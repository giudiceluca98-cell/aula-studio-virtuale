import type { EveAuthorizedContext, EveContextScope, EveRole } from "../contracts";

export type EveRoomMemberRole = "owner" | "admin" | "member";

export interface EveContextBuildRequest {
  roomId: string;
  scope?: EveContextScope;
  conversationId?: string;
  courseId?: string;
  primaryMaterialId?: string;
  authorizedMaterialIds?: readonly string[];
  subjectId?: string;
  moduleId?: string;
  lessonId?: string;
  sectionId?: string;
  selectedText?: string;
  selectionLocator?: string;
  shareSelectedText?: boolean;
}

export interface EveVerifiedIdentity {
  userId: string;
  roomId: string;
  memberRole: EveRoomMemberRole;
  explicitRoles: readonly EveRole[];
  joinedAt: string;
}

export interface EveVerifiedCourse {
  courseId: string;
  roomId: string;
  title: string;
}

export interface EveVerifiedMaterial {
  materialId: string;
  roomId: string;
  courseId: string | null;
  title: string;
  sourceType: string;
  status: string;
  currentVersionId: string;
  checksumSha256: string;
  metadata: Readonly<Record<string, unknown>>;
}

export interface EveVerifiedConversation {
  conversationId: string;
  roomId: string;
  ownerId: string;
  status: string;
}

export interface EveContextAuditInput {
  roomId: string;
  userId: string;
  conversationId: string | null;
  scope: EveContextScope;
  contextDigest: string;
  selectedTextSha256: string | null;
  selectedChars: number;
  authorizedMaterialCount: number;
  resourceIds: Readonly<Record<string, string | null>>;
  roles: readonly EveRole[];
  outcome: "success" | "rejected" | "failed";
  rejectionCode: string | null;
}

export interface EveContextAuditReceipt {
  auditId: string;
  createdAt: string;
}

export interface EveContextBuildResult {
  context: EveAuthorizedContext;
  token: string;
  digest: string;
  audit: EveContextAuditReceipt;
}
