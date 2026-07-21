import JSZip from "jszip";
import mammoth from "mammoth";
import { PDFDocument } from "pdf-lib";
import { NextResponse, type NextRequest } from "next/server";
import { resolveMaterialAccess } from "@/lib/material-access";
import { roomContentIdSchema } from "@/lib/room-content-removal";
import { createClient } from "@/lib/supabase/server";
import { PROGRAMMING_LESSON_ID, publicProgrammingLesson } from "@/lib/catalog/subjects/programming-zero-lesson";
import { eveLessonAdvice } from "@/lib/programming-lesson-progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_OFFICE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_INSPECTION_BYTES = 25 * 1024 * 1024;
const MAX_TEXT_CHARS = 2_000_000;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}

function decodeXml(value: string) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

async function extractSlides(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const names = Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
  const slides: string[][] = [];
  for (const name of names.slice(0, 1000)) {
    const xml = await zip.file(name)?.async("string") ?? "";
    slides.push([...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((match) => decodeXml(match[1]).trim()).filter(Boolean));
  }
  return slides;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ roomId: string; materialId: string }> }) {
  const values = await params;
  if (!roomContentIdSchema.safeParse(values.roomId).success || !roomContentIdSchema.safeParse(values.materialId).success) return json({ error: "invalid_resource" }, 400);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "not_authenticated" }, 401);
  const [{ data: material, error: materialError }, { data: progress }] = await Promise.all([
    supabase.from("materials").select("id,room_id,course_id,type,title,description,url,storage_path,metadata,access_mode,monitoring_level,internal_viewer,import_status").eq("id", values.materialId).eq("room_id", values.roomId).is("archived_at", null).single(),
    supabase.from("material_reader_progress").select("viewer,paragraph_index,token_index,scroll_ratio,document_position,page_number,page_count,video_time_seconds,video_duration_seconds,watched_ranges,watched_unique_seconds,completion_percentage,active_seconds,learning_state,exercise_state,last_interaction_at,last_opened_at").eq("user_id", user.id).eq("material_id", values.materialId).maybeSingle(),
  ]);
  if (materialError || !material) return json({ error: "material_not_found" }, 404);
  const access = resolveMaterialAccess(material);
  const base = { material: { id: material.id, roomId: material.room_id, courseId: material.course_id, title: material.title, description: material.description }, access, progress };

  if (access.internalViewer === "lesson" && material.metadata?.lesson_id === PROGRAMMING_LESSON_ID) {
    const { data: projectSubmissions } = await supabase.from("native_lesson_submissions")
      .select("activity_id,response,status,updated_at")
      .eq("user_id", user.id)
      .eq("material_id", values.materialId)
      .eq("activity_type", "project");
    return json({ ...base, kind: "lesson", lesson: publicProgrammingLesson(), eve: eveLessonAdvice(progress?.exercise_state), projectSubmissions: projectSubmissions ?? [] });
  }
  if (access.internalViewer === "video" && access.embedUrl) return json({ ...base, kind: "video", embedUrl: access.embedUrl, provider: access.provider });
  if (access.internalViewer === "pdf") {
    if (material.storage_path) {
      const [{ data, error }, { data: file }] = await Promise.all([
        supabase.storage.from("study-materials").createSignedUrl(material.storage_path, 600),
        supabase.storage.from("study-materials").download(material.storage_path),
      ]);
      if (error || !data?.signedUrl) return json({ ...base, kind: "unavailable", error: "file_unavailable" }, 409);
      let pageCount: number | null = null;
      if (file && file.size <= MAX_PDF_INSPECTION_BYTES) {
        try {
          const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
          pageCount = pdf.getPageCount();
        } catch {
          pageCount = null;
        }
      }
      return json({ ...base, kind: "pdf", resourceUrl: data.signedUrl, pageCount });
    }
  }
  if (access.internalViewer === "text" && material.storage_path) return json({ ...base, kind: "text", readerUrl: `/room/${values.roomId}/material/${values.materialId}?embedded=1` });
  if ((access.internalViewer === "document" || access.internalViewer === "presentation") && material.storage_path) {
    const { data: file, error } = await supabase.storage.from("study-materials").download(material.storage_path);
    if (error || !file) return json({ ...base, kind: "unavailable", error: "file_unavailable" }, 409);
    if (file.size > MAX_OFFICE_BYTES) return json({ ...base, kind: "unavailable", error: "file_too_large" }, 413);
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      if (access.internalViewer === "document") {
        const result = await mammoth.extractRawText({ buffer });
        return json({ ...base, kind: "document", paragraphs: result.value.slice(0, MAX_TEXT_CHARS).split(/\n{2,}/).map((part) => part.trim()).filter(Boolean) });
      }
      return json({ ...base, kind: "presentation", slides: await extractSlides(buffer) });
    } catch {
      return json({ ...base, kind: "unavailable", error: "conversion_failed" }, 422);
    }
  }
  return json({ ...base, kind: access.accessMode === "unsupported" ? "unsupported" : "import-required" });
}
