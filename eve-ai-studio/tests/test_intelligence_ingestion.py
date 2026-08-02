from __future__ import annotations
import base64, io, zipfile
from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest
from pypdf import PdfWriter
from app.intelligence import *
from app.intelligence.web_acquisition import WebFetchResult


def docx_bytes(text='Documento didattico verificabile'):
    out=io.BytesIO()
    with zipfile.ZipFile(out,'w') as z:
        z.writestr('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>')
        z.writestr('word/document.xml',f'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{text}</w:t></w:r></w:p></w:body></w:document>')
    return out.getvalue()

def epub_bytes(text='Capitolo EPUB controllato'):
    out=io.BytesIO()
    with zipfile.ZipFile(out,'w') as z:
        z.writestr('mimetype','application/epub+zip')
        z.writestr('META-INF/container.xml','<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf"/></rootfiles></container>')
        z.writestr('OEBPS/content.opf','<package xmlns="http://www.idpf.org/2007/opf"><manifest><item id="c1" href="c1.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="c1"/></spine></package>')
        z.writestr('OEBPS/c1.xhtml',f'<html><body><h1>{text}</h1><script>evil()</script></body></html>')
    return out.getvalue()

def encrypted_pdf():
    out=io.BytesIO(); w=PdfWriter(); w.add_blank_page(width=100,height=100); w.encrypt('secret'); w.write(out); return out.getvalue()

def service(tmp_path, *, ingest=True, crawl=False, acquirer=None):
    db=tmp_path/'r.sqlite3'; store=SqliteResearchStore(db); acquisition=SqliteAcquisitionStore(db); ingestion=SqliteIngestionStore(db)
    extractor=AdvancedDocumentExtractor(AdvancedIngestionPolicy(enabled=ingest,max_document_bytes=2_000_000))
    crawler=LimitedCrawler(acquirer or FakeAcquirer({}),CrawlPolicy(enabled=crawl,max_depth=1,max_pages=4,max_total_bytes=100000))
    svc=ResearchCenterService(store,acquisition_store=acquisition,acquirer=acquirer or FakeAcquirer({}),ingestion_store=ingestion,advanced_extractor=extractor,ingestion_policy=extractor.policy,crawler=crawler,crawl_policy=crawler.policy)
    project=svc.create_project(ResearchProjectCreateRequest(room_id='room-a',title='P',objective='O',domain='D'))
    return store,ingestion,svc,project

def request(data,filename='test.docx',media='application/vnd.openxmlformats-officedocument.wordprocessingml.document',key='import-key-0001'):
    return ResearchAdvancedImportRequest(actor_id='teacher-1',idempotency_key=key,filename=filename,media_type=media,content_base64=base64.b64encode(data).decode())

class FakeAcquirer:
    def __init__(self,pages):
        self.pages=pages
        self.policy=WebAcquisitionPolicy(enabled=False)
    def fetch(self,url):
        body=self.pages[url]
        return WebFetchResult(requested_url=url,final_url=url,status=200,media_type='text/html',content=body,redirect_chain=(),resolved_ips=('93.184.216.34',),robots_allowed=True)

class RedirectingFakeAcquirer(FakeAcquirer):
    def fetch(self,url):
        result=super().fetch(url)
        return WebFetchResult(requested_url=url,final_url='https://other.test/landing',status=200,media_type=result.media_type,content=result.content,redirect_chain=('https://other.test/landing',),resolved_ips=result.resolved_ips,robots_allowed=True)

def test_ingestion_disabled_by_default(tmp_path):
    *_,svc,project=service(tmp_path,ingest=False)
    with pytest.raises(ResearchAdvancedIngestionDisabledError): svc.import_advanced_document(project.project_id,'room-a',request(docx_bytes()))

def test_docx_and_epub_extract_without_macro_or_script_execution(tmp_path):
    _,_,svc,p=service(tmp_path)
    doc=svc.import_advanced_document(p.project_id,'room-a',request(docx_bytes()))
    assert doc.format_name=='docx' and 'didattico' in doc.extracted_text and not doc.instructions_executable
    epub=svc.import_advanced_document(p.project_id,'room-a',request(epub_bytes(),filename='book.epub',media='application/epub+zip',key='import-key-0002'))
    assert 'Capitolo EPUB' in epub.extracted_text and 'evil' not in epub.extracted_text

def test_docx_macro_is_rejected(tmp_path):
    data=io.BytesIO()
    with zipfile.ZipFile(data,'w') as z:
        z.writestr('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>');z.writestr('word/vbaProject.bin',b'x')
    *_,svc,p=service(tmp_path)
    with pytest.raises(ResearchArchiveRejectedError): svc.import_advanced_document(p.project_id,'room-a',request(data.getvalue()))

def test_encrypted_pdf_is_rejected(tmp_path):
    *_,svc,p=service(tmp_path)
    with pytest.raises(ResearchDocumentEncryptedError): svc.import_advanced_document(p.project_id,'room-a',request(encrypted_pdf(),filename='locked.pdf',media='application/pdf'))

def test_idempotency_and_exact_duplicate_are_separate_controls(tmp_path):
    _,_,svc,p=service(tmp_path); data=docx_bytes()
    first=svc.import_advanced_document(p.project_id,'room-a',request(data))
    replay=svc.import_advanced_document(p.project_id,'room-a',request(data))
    assert replay.document_id==first.document_id
    duplicate=svc.import_advanced_document(p.project_id,'room-a',request(data,key='import-key-0003'))
    assert duplicate.duplicate_kind==ResearchDuplicateKind.EXACT and duplicate.duplicate_of_document_id==first.document_id

def test_near_duplicate_detection(tmp_path):
    _,_,svc,p=service(tmp_path)
    first=svc.import_advanced_document(p.project_id,'room-a',request(docx_bytes('uno due tre quattro cinque sei sette otto nove dieci')))
    second=svc.import_advanced_document(p.project_id,'room-a',request(docx_bytes('uno due tre quattro cinque sei sette otto nove undici'),key='import-key-0004'))
    assert second.duplicate_kind in {ResearchDuplicateKind.NEAR,ResearchDuplicateKind.NONE}
    assert first.room_id==second.room_id

def test_room_isolation(tmp_path):
    _,_,svc,p=service(tmp_path); doc=svc.import_advanced_document(p.project_id,'room-a',request(docx_bytes()))
    with pytest.raises(ResearchDocumentNotFoundError): svc.get_ingested_document(doc.document_id,'room-b')

def test_crawl_disabled(tmp_path):
    store,_,svc,p=service(tmp_path,crawl=False)
    src=svc.add_source_candidate(p.project_id,'room-a',ResearchSourceCandidateCreateRequest(url='https://example.edu/root'))
    with pytest.raises(ResearchCrawlDisabledError): svc.crawl_source(p.project_id,src.source_id,'room-a',ResearchCrawlRequest(actor_id='teacher'))

def test_limited_crawl_same_domain_depth_and_quarantine(tmp_path):
    pages={'https://example.edu/root':b'<a href="/a">A</a><a href="https://other.test/x">X</a> Root','https://example.edu/a':b'<p>Child</p>'}
    acq=FakeAcquirer(pages); store,ing,svc,p=service(tmp_path,crawl=True,acquirer=acq)
    src=svc.add_source_candidate(p.project_id,'room-a',ResearchSourceCandidateCreateRequest(url='https://example.edu/root'))
    run=svc.crawl_source(p.project_id,src.source_id,'room-a',ResearchCrawlRequest(actor_id='teacher',max_depth=1,max_pages=4))
    assert run.page_count==2 and all(not page.instructions_executable for page in run.pages)
    assert all('other.test' not in page.url for page in run.pages)

def test_limited_crawl_rejects_cross_domain_redirect(tmp_path):
    pages={'https://example.edu/root':b'<p>Redirected</p>'}
    acq=RedirectingFakeAcquirer(pages); _,_,svc,p=service(tmp_path,crawl=True,acquirer=acq)
    src=svc.add_source_candidate(p.project_id,'room-a',ResearchSourceCandidateCreateRequest(url='https://example.edu/root'))
    with pytest.raises(ResearchCrawlLimitError):
        svc.crawl_source(p.project_id,src.source_id,'room-a',ResearchCrawlRequest(actor_id='teacher'))

def test_api_imports_lists_and_reads(tmp_path):
    _,_,svc,p=service(tmp_path); app=FastAPI();app.include_router(create_research_router(svc));client=TestClient(app)
    body=request(docx_bytes()).model_dump()
    r=client.post(f'/v1/intelligence/research/projects/{p.project_id}/documents/import',params={'room_id':'room-a'},json=body)
    assert r.status_code==201
    doc_id=r.json()['document_id']
    assert client.get(f'/v1/intelligence/research/documents/{doc_id}',params={'room_id':'room-a'}).status_code==200
    assert client.get(f'/v1/intelligence/research/projects/{p.project_id}/documents/imports',params={'room_id':'room-a'}).json()['total']==1

def test_status_reports_05_without_enabling_flags_implicitly(tmp_path):
    _,_,svc,_=service(tmp_path,ingest=False,crawl=False);status=svc.status()
    assert status.checkpoint=='INTELLIGENCE-0.5' and status.advanced_ingestion_available and not status.advanced_ingestion_enabled and not status.crawl_enabled
