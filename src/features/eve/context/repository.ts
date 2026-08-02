import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EveContextAuditInput,
  EveContextAuditReceipt,
  EveVerifiedConversation,
  EveVerifiedCourse,
  EveVerifiedIdentity,
  EveVerifiedMaterial,
} from "./contracts";
import type { EveRole } from "../contracts";

export interface EveContextRepository {
  getIdentity(userId: string, roomId: string): Promise<EveVerifiedIdentity | null>;
  getCourse(roomId: string, courseId: string): Promise<EveVerifiedCourse | null>;
  getMaterial(roomId: string, materialId: string): Promise<EveVerifiedMaterial | null>;
  getConversation(
    roomId: string,
    conversationId: string,
  ): Promise<EveVerifiedConversation | null>;
  recordAudit(input: EveContextAuditInput): Promise<EveContextAuditReceipt>;
}

export class SupabaseEveContextRepository implements EveContextRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getIdentity(userId: string, roomId: string): Promise<EveVerifiedIdentity | null> {
    const membership = await this.client
      .from("room_members")
      .select("user_id,room_id,role,joined_at,left_at")
      .eq("user_id", userId)
      .eq("room_id", roomId)
      .maybeSingle();
    if (membership.error) throw membership.error;
    const row = membership.data as Record<string, unknown> | null;
    if (!row || row.left_at) return null;

    const roleResult = await this.client
      .from("eve_room_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("room_id", roomId)
      .is("revoked_at", null);
    if (roleResult.error) throw roleResult.error;
    const explicitRoles = ((roleResult.data ?? []) as Array<{ role: EveRole }>).map(
      (entry) => entry.role,
    );
    return {
      userId,
      roomId,
      memberRole: String(row.role) as EveVerifiedIdentity["memberRole"],
      explicitRoles,
      joinedAt: String(row.joined_at),
    };
  }

  async getCourse(roomId: string, courseId: string): Promise<EveVerifiedCourse | null> {
    const result = await this.client
      .from("courses")
      .select("id,room_id,title")
      .eq("id", courseId)
      .eq("room_id", roomId)
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return null;
    return {
      courseId: String(result.data.id),
      roomId: String(result.data.room_id),
      title: String(result.data.title),
    };
  }

  async getMaterial(roomId: string, materialId: string): Promise<EveVerifiedMaterial | null> {
    const assetResult = await this.client
      .from("eve_material_assets")
      .select("id,room_id,course_id,title,source_type,status,current_version_id")
      .eq("id", materialId)
      .eq("room_id", roomId)
      .maybeSingle();
    if (assetResult.error) throw assetResult.error;
    const asset = assetResult.data as Record<string, unknown> | null;
    if (!asset || asset.status === "revoked" || asset.status === "archived" || !asset.current_version_id) {
      return null;
    }
    const versionResult = await this.client
      .from("eve_material_versions")
      .select("id,room_id,checksum_sha256,status,metadata")
      .eq("id", String(asset.current_version_id))
      .eq("room_id", roomId)
      .maybeSingle();
    if (versionResult.error) throw versionResult.error;
    const version = versionResult.data as Record<string, unknown> | null;
    if (!version || version.status === "revoked" || version.status === "failed") return null;
    return {
      materialId: String(asset.id),
      roomId: String(asset.room_id),
      courseId: asset.course_id ? String(asset.course_id) : null,
      title: String(asset.title),
      sourceType: String(asset.source_type),
      status: String(asset.status),
      currentVersionId: String(version.id),
      checksumSha256: String(version.checksum_sha256),
      metadata: (version.metadata ?? {}) as Readonly<Record<string, unknown>>,
    };
  }

  async getConversation(
    roomId: string,
    conversationId: string,
  ): Promise<EveVerifiedConversation | null> {
    const result = await this.client
      .from("eve_conversations")
      .select("id,room_id,owner_id,status")
      .eq("id", conversationId)
      .eq("room_id", roomId)
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return null;
    return {
      conversationId: String(result.data.id),
      roomId: String(result.data.room_id),
      ownerId: String(result.data.owner_id),
      status: String(result.data.status),
    };
  }

  async recordAudit(input: EveContextAuditInput): Promise<EveContextAuditReceipt> {
    const result = await this.client
      .from("eve_context_audit_events")
      .insert({
        room_id: input.roomId,
        user_id: input.userId,
        conversation_id: input.conversationId,
        scope: input.scope,
        context_digest: input.contextDigest,
        selected_text_sha256: input.selectedTextSha256,
        selected_chars: input.selectedChars,
        authorized_material_count: input.authorizedMaterialCount,
        resource_ids: input.resourceIds,
        roles: input.roles,
        outcome: input.outcome,
        rejection_code: input.rejectionCode,
      })
      .select("id,created_at")
      .single();
    if (result.error) throw result.error;
    return { auditId: String(result.data.id), createdAt: String(result.data.created_at) };
  }
}
