import "server-only";
import { createHash, randomUUID } from "node:crypto";
import type { EveAuthorizedContext, EveContextScope, EveRole } from "../contracts";
import type { EveContextConfig } from "./config";
import type {
  EveContextAuditInput,
  EveContextBuildRequest,
  EveContextBuildResult,
  EveVerifiedMaterial,
} from "./contracts";
import {
  EveContextAuthenticationError,
  EveContextAuthorizationError,
  EveContextDisabledError,
  EveContextValidationError,
} from "./errors";
import type { EveContextRepository } from "./repository";
import { canShareSelectedText, canUseRoomSharedContext, resolveEveRoles } from "./roles";
import { signAuthorizedContext } from "./signature";

const cleanId = (value: string | undefined, field: string): string | undefined => {
  if (value === undefined) return undefined;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > 240) throw new EveContextValidationError(`${field} non valido`);
  return cleaned;
};

const metadataString = (
  material: EveVerifiedMaterial | undefined,
  key: string,
): string | undefined => {
  const value = material?.metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const bindLocation = (
  requested: string | undefined,
  observed: string | undefined,
  label: string,
): string | undefined => {
  if (requested && !observed) {
    throw new EveContextAuthorizationError(`${label} non verificabile dal materiale autorizzato`);
  }
  if (requested && observed !== requested) {
    throw new EveContextAuthorizationError(`${label} non appartiene alla risorsa autorizzata`);
  }
  return requested ?? observed;
};

export class EveContextBuilder {
  constructor(
    private readonly repository: EveContextRepository,
    private readonly config: EveContextConfig,
  ) {}

  async build(
    authenticatedUserId: string | null | undefined,
    request: EveContextBuildRequest,
    now = new Date(),
  ): Promise<EveContextBuildResult> {
    if (!this.config.enabled) throw new EveContextDisabledError();
    const userId = cleanId(authenticatedUserId ?? undefined, "userId");
    if (!userId) throw new EveContextAuthenticationError();
    const roomId = cleanId(request.roomId, "roomId");
    if (!roomId) throw new EveContextValidationError("roomId obbligatorio");

    const identity = await this.repository.getIdentity(userId, roomId);
    if (!identity) throw new EveContextAuthorizationError("Utente non appartenente all'aula");
    const roles = resolveEveRoles(identity.memberRole, identity.explicitRoles);
    const scope: EveContextScope = request.scope ?? "private";
    if (scope === "room_shared" && !canUseRoomSharedContext(roles)) {
      throw new EveContextAuthorizationError("Il ruolo non può costruire contesto condiviso");
    }

    const conversationId = cleanId(request.conversationId, "conversationId");
    if (conversationId) {
      const conversation = await this.repository.getConversation(roomId, conversationId);
      if (!conversation || conversation.ownerId !== userId || conversation.status !== "active") {
        throw new EveContextAuthorizationError("Conversazione privata non autorizzata");
      }
    }

    const courseId = cleanId(request.courseId, "courseId");
    if (courseId && !(await this.repository.getCourse(roomId, courseId))) {
      throw new EveContextAuthorizationError("Corso non appartenente all'aula");
    }

    const primaryMaterialId = cleanId(request.primaryMaterialId, "primaryMaterialId");
    const requestedMaterialIds = [
      ...(primaryMaterialId ? [primaryMaterialId] : []),
      ...(request.authorizedMaterialIds ?? []),
    ].map((value) => cleanId(value, "materialId") as string);
    const uniqueMaterialIds = [...new Set(requestedMaterialIds)];
    if (uniqueMaterialIds.length > this.config.maxAuthorizedMaterials) {
      throw new EveContextValidationError("Troppi materiali richiesti nel contesto");
    }

    const materials: EveVerifiedMaterial[] = [];
    for (const materialId of uniqueMaterialIds) {
      const material = await this.repository.getMaterial(roomId, materialId);
      if (!material) throw new EveContextAuthorizationError("Materiale non autorizzato o revocato");
      if (courseId && material.courseId && material.courseId !== courseId) {
        throw new EveContextAuthorizationError("Materiale appartenente a un altro corso");
      }
      materials.push(material);
    }
    const primaryMaterial = primaryMaterialId
      ? materials.find((material) => material.materialId === primaryMaterialId)
      : undefined;

    const subjectId = bindLocation(
      cleanId(request.subjectId, "subjectId"),
      metadataString(primaryMaterial, "subject_id"),
      "Materia",
    );
    const moduleId = bindLocation(
      cleanId(request.moduleId, "moduleId"),
      metadataString(primaryMaterial, "module_id") ?? metadataString(primaryMaterial, "stage_id"),
      "Modulo",
    );
    const lessonId = bindLocation(
      cleanId(request.lessonId, "lessonId"),
      metadataString(primaryMaterial, "lesson_id"),
      "Lezione",
    );
    const sectionId = bindLocation(
      cleanId(request.sectionId, "sectionId"),
      metadataString(primaryMaterial, "section_id"),
      "Sezione",
    );

    const rawSelection = request.selectedText?.trim() ?? "";
    if (rawSelection.length > this.config.maxSelectedChars) {
      throw new EveContextValidationError("Testo selezionato oltre il limite configurato");
    }
    if (rawSelection && !primaryMaterial) {
      throw new EveContextAuthorizationError("Il testo selezionato richiede un materiale verificato");
    }
    const shareSelection = Boolean(request.shareSelectedText);
    if (scope === "room_shared" && shareSelection && !this.config.sharedSelectionEnabled) {
      throw new EveContextAuthorizationError("Condivisione del testo disattivata dal server");
    }
    if (scope === "room_shared" && shareSelection && !canShareSelectedText(roles)) {
      throw new EveContextAuthorizationError("Il ruolo non può condividere testo selezionato");
    }
    const selectedText =
      rawSelection && (scope === "private" || shareSelection) ? rawSelection : undefined;
    const selectedTextSha256 = selectedText
      ? createHash("sha256").update(selectedText, "utf8").digest("hex")
      : undefined;

    const issuedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + this.config.tokenTtlSeconds * 1_000).toISOString();
    const context: EveAuthorizedContext = {
      version: "1.4",
      checkpoint: "CORE-1.4",
      userId,
      roomId,
      roles: roles as readonly EveRole[],
      scope,
      conversationId,
      courseId,
      subjectId,
      moduleId,
      lessonId,
      sectionId,
      primaryMaterialId,
      authorizedMaterialIds: materials.map((material) => material.materialId),
      selectedText,
      selectedTextSha256,
      selectionLocator: selectedText ? cleanId(request.selectionLocator, "selectionLocator") : undefined,
      issuedAt,
      expiresAt,
      nonce: randomUUID(),
    };
    const signed = signAuthorizedContext(context, this.config.signingSecret);
    const auditInput: EveContextAuditInput = {
      roomId,
      userId,
      conversationId: conversationId ?? null,
      scope,
      contextDigest: signed.digest,
      selectedTextSha256: selectedTextSha256 ?? null,
      selectedChars: selectedText?.length ?? 0,
      authorizedMaterialCount: materials.length,
      resourceIds: {
        courseId: courseId ?? null,
        subjectId: subjectId ?? null,
        moduleId: moduleId ?? null,
        lessonId: lessonId ?? null,
        sectionId: sectionId ?? null,
        primaryMaterialId: primaryMaterialId ?? null,
      },
      roles,
      outcome: "success",
      rejectionCode: null,
    };
    const audit = await this.repository.recordAudit(auditInput);
    return { context, token: signed.token, digest: signed.digest, audit };
  }
}
