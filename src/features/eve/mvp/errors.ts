export class EveMvpError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class EveMvpDisabledError extends EveMvpError {
  constructor() { super("mvp_disabled", "Il Gate MVP è disattivato"); }
}
export class EveMvpValidationError extends EveMvpError {
  constructor(message: string) { super("mvp_invalid", message); }
}
export class EveMvpAuthorizationError extends EveMvpError {
  constructor(message = "Risorsa MVP non autorizzata") { super("mvp_forbidden", message); }
}
export class EveMvpDependencyError extends EveMvpError {
  constructor(message = "Dipendenza Eve non disponibile") { super("mvp_dependency_unavailable", message); }
}
export class EveMvpIntegrityError extends EveMvpError {
  constructor(message = "Risposta Eve non verificabile") { super("mvp_integrity_failed", message); }
}
export class EveMvpPersistenceError extends EveMvpError {
  constructor(message = "Persistenza MVP non disponibile") { super("mvp_persistence_failed", message); }
}
