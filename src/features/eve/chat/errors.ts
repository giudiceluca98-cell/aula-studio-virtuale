export class EveGroundedChatError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "EveGroundedChatError";
  }
}
export class EveGroundedChatDisabledError extends EveGroundedChatError {
  constructor() { super("grounded_chat_disabled", "Chat grounded disattivata"); }
}
export class EveGroundedChatValidationError extends EveGroundedChatError {
  constructor(message: string) { super("grounded_chat_invalid", message); }
}
export class EveGroundedChatAuthorizationError extends EveGroundedChatError {
  constructor(message: string) { super("grounded_chat_forbidden", message); }
}
export class EveGroundedChatIntegrityError extends EveGroundedChatError {
  constructor(message: string) { super("grounded_chat_integrity", message); }
}
export class EveGroundedChatDependencyError extends EveGroundedChatError {
  constructor(message = "Servizi grounded non disponibili") { super("grounded_chat_dependency", message); }
}
export class EveGroundedChatPersistenceError extends EveGroundedChatError {
  constructor(message = "Persistenza chat non disponibile") { super("grounded_chat_persistence", message); }
}
