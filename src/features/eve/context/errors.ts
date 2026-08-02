export class EveContextError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class EveContextDisabledError extends EveContextError {
  constructor() { super("context_disabled", "Il Context Builder è disattivato"); }
}

export class EveContextConfigurationError extends EveContextError {
  constructor(message = "Configurazione Context Builder non valida") {
    super("context_misconfigured", message);
  }
}

export class EveContextAuthenticationError extends EveContextError {
  constructor() { super("authentication_required", "Identità autenticata richiesta"); }
}

export class EveContextAuthorizationError extends EveContextError {
  constructor(message = "Riferimento non autorizzato") {
    super("context_forbidden", message);
  }
}

export class EveContextValidationError extends EveContextError {
  constructor(message: string) { super("context_invalid", message); }
}

export class EveContextIntegrityError extends EveContextError {
  constructor(message = "Firma del contesto non valida") {
    super("context_integrity_failed", message);
  }
}
