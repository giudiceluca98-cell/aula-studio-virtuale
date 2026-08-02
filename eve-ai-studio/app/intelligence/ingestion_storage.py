from __future__ import annotations

import json, sqlite3
from datetime import datetime, timezone
from pathlib import Path
from threading import RLock

from .advanced_ingestion import ExtractedAdvancedDocument, fingerprint_similarity
from .errors import ResearchDocumentNotFoundError, ResearchProjectNotFoundError, ResearchSourceNotFoundError
from .limited_crawler import CrawlResult
from .models import (
    ResearchCrawlPage, ResearchCrawlRun, ResearchCrawlStatus,
    ResearchDuplicateKind, ResearchIngestedDocument, ResearchIngestionEvent,
    ResearchIngestionStatus,
)


def utc_now()->str: return datetime.now(timezone.utc).isoformat(timespec='seconds')

class SqliteIngestionStore:
    def __init__(self,path:str|Path):
        self.path=Path(path); self.path.parent.mkdir(parents=True,exist_ok=True)
        self._lock=RLock(); self._connection=sqlite3.connect(self.path,check_same_thread=False); self._connection.row_factory=sqlite3.Row
        self._connection.execute('PRAGMA foreign_keys = ON'); self._connection.execute('PRAGMA journal_mode = WAL'); self._schema()
    def close(self):
        with self._lock:self._connection.close()
    def _schema(self):
        with self._lock,self._connection:
            self._connection.executescript('''
            CREATE TABLE IF NOT EXISTS research_ingestion_events(
              ingestion_id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL, room_id TEXT NOT NULL,
              source_id INTEGER, actor_id TEXT NOT NULL, idempotency_key TEXT NOT NULL, filename TEXT NOT NULL,
              media_type TEXT NOT NULL, status TEXT NOT NULL, document_id INTEGER, error_code TEXT,
              created_at TEXT NOT NULL, completed_at TEXT, UNIQUE(room_id,idempotency_key));
            CREATE TABLE IF NOT EXISTS research_ingested_documents(
              document_id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL, room_id TEXT NOT NULL,
              source_id INTEGER, ingestion_id INTEGER NOT NULL UNIQUE, filename TEXT NOT NULL, media_type TEXT NOT NULL,
              format_name TEXT NOT NULL, size_bytes INTEGER NOT NULL, sha256 TEXT NOT NULL, extracted_text TEXT NOT NULL,
              extracted_chars INTEGER NOT NULL, fingerprint_json TEXT NOT NULL, metadata_json TEXT NOT NULL,
              duplicate_kind TEXT NOT NULL, duplicate_of_document_id INTEGER, content_trust TEXT NOT NULL,
              instructions_executable INTEGER NOT NULL, created_at TEXT NOT NULL,
              FOREIGN KEY(duplicate_of_document_id) REFERENCES research_ingested_documents(document_id));
            CREATE INDEX IF NOT EXISTS idx_ingested_room_sha ON research_ingested_documents(room_id,sha256);
            CREATE TABLE IF NOT EXISTS research_ingestion_segments(
              segment_id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER NOT NULL, segment_index INTEGER NOT NULL,
              locator TEXT NOT NULL, text_content TEXT NOT NULL, text_sha256 TEXT NOT NULL,
              FOREIGN KEY(document_id) REFERENCES research_ingested_documents(document_id) ON DELETE CASCADE,
              UNIQUE(document_id,segment_index));
            CREATE TABLE IF NOT EXISTS research_crawl_runs(
              crawl_id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL, room_id TEXT NOT NULL,
              source_id INTEGER NOT NULL, actor_id TEXT NOT NULL, root_url TEXT NOT NULL, status TEXT NOT NULL,
              page_count INTEGER NOT NULL DEFAULT 0,total_bytes INTEGER NOT NULL DEFAULT 0,truncated INTEGER NOT NULL DEFAULT 0,
              error_code TEXT,created_at TEXT NOT NULL,completed_at TEXT);
            CREATE TABLE IF NOT EXISTS research_crawl_pages(
              crawl_page_id INTEGER PRIMARY KEY AUTOINCREMENT,crawl_id INTEGER NOT NULL,url TEXT NOT NULL,depth INTEGER NOT NULL,
              media_type TEXT NOT NULL,size_bytes INTEGER NOT NULL,sha256 TEXT NOT NULL,extracted_text TEXT NOT NULL,
              discovered_links_json TEXT NOT NULL,content_trust TEXT NOT NULL,instructions_executable INTEGER NOT NULL,
              FOREIGN KEY(crawl_id) REFERENCES research_crawl_runs(crawl_id) ON DELETE CASCADE,UNIQUE(crawl_id,url));
            ''')
    def _require_project(self,project_id,room_id):
        row=self._connection.execute('SELECT 1 FROM research_projects WHERE project_id=? AND room_id=?',(project_id,room_id)).fetchone()
        if row is None: raise ResearchProjectNotFoundError(project_id)
    def _require_source(self,project_id,source_id,room_id):
        self._require_project(project_id,room_id)
        row=self._connection.execute('SELECT url FROM research_source_candidates WHERE project_id=? AND source_id=?',(project_id,source_id)).fetchone()
        if row is None: raise ResearchSourceNotFoundError(source_id)
        return str(row['url'])
    def get_event_by_key(self,room_id,key):
        with self._lock:
            row=self._connection.execute('SELECT * FROM research_ingestion_events WHERE room_id=? AND idempotency_key=?',(room_id,key)).fetchone()
        return self._event(row) if row else None
    def begin_import(self,*,project_id,room_id,source_id,actor_id,idempotency_key,filename,media_type):
        now=utc_now()
        with self._lock,self._connection:
            self._require_project(project_id,room_id)
            if source_id is not None:self._require_source(project_id,source_id,room_id)
            cur=self._connection.execute('INSERT INTO research_ingestion_events(project_id,room_id,source_id,actor_id,idempotency_key,filename,media_type,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)',(project_id,room_id,source_id,actor_id,idempotency_key,filename,media_type,ResearchIngestionStatus.RUNNING.value,now))
            return int(cur.lastrowid)
    def complete_import(self,*,ingestion_id,project_id,room_id,source_id,content,extracted:ExtractedAdvancedDocument,near_threshold:float):
        now=utc_now(); dup_kind=ResearchDuplicateKind.NONE; duplicate_of=None
        with self._lock,self._connection:
            self._require_project(project_id,room_id)
            exact=self._connection.execute('SELECT document_id FROM research_ingested_documents WHERE room_id=? AND sha256=? ORDER BY document_id LIMIT 1',(room_id,extracted.sha256)).fetchone()
            if exact: dup_kind=ResearchDuplicateKind.EXACT; duplicate_of=int(exact['document_id'])
            else:
                for row in self._connection.execute('SELECT document_id,fingerprint_json FROM research_ingested_documents WHERE room_id=?',(room_id,)).fetchall():
                    if fingerprint_similarity(extracted.fingerprint_tokens,json.loads(row['fingerprint_json']))>=near_threshold:
                        dup_kind=ResearchDuplicateKind.NEAR;duplicate_of=int(row['document_id']);break
            cur=self._connection.execute('INSERT INTO research_ingested_documents(project_id,room_id,source_id,ingestion_id,filename,media_type,format_name,size_bytes,sha256,extracted_text,extracted_chars,fingerprint_json,metadata_json,duplicate_kind,duplicate_of_document_id,content_trust,instructions_executable,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(project_id,room_id,source_id,ingestion_id,extracted.filename,extracted.media_type,extracted.format_name,len(content),extracted.sha256,extracted.extracted_text,len(extracted.extracted_text),json.dumps(extracted.fingerprint_tokens),json.dumps(extracted.metadata,ensure_ascii=False),dup_kind.value,duplicate_of,'untrusted_external_document',0,now))
            doc_id=int(cur.lastrowid)
            self._connection.executemany('INSERT INTO research_ingestion_segments(document_id,segment_index,locator,text_content,text_sha256) VALUES(?,?,?,?,?)',[(doc_id,s.index,s.locator,s.text,s.text_sha256) for s in extracted.segments])
            self._connection.execute('UPDATE research_ingestion_events SET status=?,document_id=?,completed_at=? WHERE ingestion_id=?',(ResearchIngestionStatus.SUCCEEDED.value,doc_id,now,ingestion_id))
        return self.get_document(doc_id,room_id)
    def fail_import(self,ingestion_id,error_code):
        with self._lock,self._connection:self._connection.execute('UPDATE research_ingestion_events SET status=?,error_code=?,completed_at=? WHERE ingestion_id=?',(ResearchIngestionStatus.FAILED.value,error_code,utc_now(),ingestion_id))
    def _event(self,row):
        return ResearchIngestionEvent(ingestion_id=row['ingestion_id'],project_id=row['project_id'],room_id=row['room_id'],source_id=row['source_id'],actor_id=row['actor_id'],idempotency_key=row['idempotency_key'],filename=row['filename'],media_type=row['media_type'],status=ResearchIngestionStatus(row['status']),document_id=row['document_id'],error_code=row['error_code'],created_at=row['created_at'],completed_at=row['completed_at'])
    def get_document(self,document_id,room_id):
        with self._lock:row=self._connection.execute('SELECT * FROM research_ingested_documents WHERE document_id=? AND room_id=?',(document_id,room_id)).fetchone()
        if row is None:raise ResearchDocumentNotFoundError(document_id)
        return ResearchIngestedDocument(document_id=row['document_id'],project_id=row['project_id'],room_id=row['room_id'],source_id=row['source_id'],ingestion_id=row['ingestion_id'],filename=row['filename'],media_type=row['media_type'],format_name=row['format_name'],size_bytes=row['size_bytes'],sha256=row['sha256'],extracted_text=row['extracted_text'],extracted_chars=row['extracted_chars'],segment_count=self._connection.execute('SELECT COUNT(*) FROM research_ingestion_segments WHERE document_id=?',(document_id,)).fetchone()[0],duplicate_kind=ResearchDuplicateKind(row['duplicate_kind']),duplicate_of_document_id=row['duplicate_of_document_id'],content_trust=row['content_trust'],instructions_executable=bool(row['instructions_executable']),metadata=json.loads(row['metadata_json']),created_at=row['created_at'])
    def list_events(self,project_id,room_id,limit=100):
        with self._lock:
            self._require_project(project_id,room_id);rows=self._connection.execute('SELECT * FROM research_ingestion_events WHERE project_id=? AND room_id=? ORDER BY ingestion_id DESC LIMIT ?',(project_id,room_id,limit)).fetchall()
        return [self._event(r) for r in rows]
    def count_documents(self):
        with self._lock:return int(self._connection.execute('SELECT COUNT(*) FROM research_ingested_documents').fetchone()[0])
    def begin_crawl(self,*,project_id,source_id,room_id,actor_id,root_url):
        with self._lock,self._connection:
            self._require_source(project_id,source_id,room_id);cur=self._connection.execute('INSERT INTO research_crawl_runs(project_id,room_id,source_id,actor_id,root_url,status,created_at) VALUES(?,?,?,?,?,?,?)',(project_id,room_id,source_id,actor_id,root_url,ResearchCrawlStatus.RUNNING.value,utc_now()));return int(cur.lastrowid)
    def complete_crawl(self,crawl_id,result:CrawlResult):
        now=utc_now()
        with self._lock,self._connection:
            self._connection.executemany('INSERT INTO research_crawl_pages(crawl_id,url,depth,media_type,size_bytes,sha256,extracted_text,discovered_links_json,content_trust,instructions_executable) VALUES(?,?,?,?,?,?,?,?,?,0)',[(crawl_id,p.url,p.depth,p.media_type,p.size_bytes,p.sha256,p.extracted_text,json.dumps(p.discovered_links),'untrusted_web_content') for p in result.pages])
            self._connection.execute('UPDATE research_crawl_runs SET status=?,page_count=?,total_bytes=?,truncated=?,completed_at=? WHERE crawl_id=?',(ResearchCrawlStatus.SUCCEEDED.value,len(result.pages),result.total_bytes,int(result.truncated),now,crawl_id))
        return self.get_crawl(crawl_id)
    def fail_crawl(self,crawl_id,error_code):
        with self._lock,self._connection:self._connection.execute('UPDATE research_crawl_runs SET status=?,error_code=?,completed_at=? WHERE crawl_id=?',(ResearchCrawlStatus.FAILED.value,error_code,utc_now(),crawl_id))
    def get_crawl(self,crawl_id,room_id=None):
        with self._lock:
            row=self._connection.execute('SELECT * FROM research_crawl_runs WHERE crawl_id=?'+(' AND room_id=?' if room_id else ''),((crawl_id,room_id) if room_id else (crawl_id,))).fetchone()
            if row is None:raise ResearchDocumentNotFoundError(crawl_id)
            pages=self._connection.execute('SELECT * FROM research_crawl_pages WHERE crawl_id=? ORDER BY crawl_page_id',(crawl_id,)).fetchall()
        return ResearchCrawlRun(crawl_id=row['crawl_id'],project_id=row['project_id'],room_id=row['room_id'],source_id=row['source_id'],actor_id=row['actor_id'],root_url=row['root_url'],status=ResearchCrawlStatus(row['status']),page_count=row['page_count'],total_bytes=row['total_bytes'],truncated=bool(row['truncated']),error_code=row['error_code'],created_at=row['created_at'],completed_at=row['completed_at'],pages=[ResearchCrawlPage(crawl_page_id=p['crawl_page_id'],url=p['url'],depth=p['depth'],media_type=p['media_type'],size_bytes=p['size_bytes'],sha256=p['sha256'],extracted_text=p['extracted_text'],discovered_links=json.loads(p['discovered_links_json']),content_trust=p['content_trust'],instructions_executable=bool(p['instructions_executable'])) for p in pages])
    def count_crawls(self):
        with self._lock:return int(self._connection.execute('SELECT COUNT(*) FROM research_crawl_runs').fetchone()[0])
