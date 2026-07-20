import type { Metadata } from "next";
import { TxtDocumentReader } from "@/components/reader/txt-document-reader";

export const metadata: Metadata = { title: "Lettore materiale" };

export default async function MaterialReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string; materialId: string }>;
  searchParams: Promise<{ embedded?: string }>;
}) {
  const { roomId, materialId } = await params;
  const query = await searchParams;
  return <TxtDocumentReader roomId={roomId} materialId={materialId} embedded={query.embedded === "1"} />;
}
