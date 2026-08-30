/**
 * Motivo del fallo de un alta, para que la UI decida sin leer el texto del
 * mensaje (que cambia cada vez que se reescribe la copy).
 */
export type RegisterFailureReason =
  /** El nombre pertenece a otra persona de esta sala: el alta no es válida. */
  | 'username-taken'
  /** Este dispositivo ya tenía registro: el alta cuenta como completada. */
  | 'already-registered'
  /** Red, permisos o cualquier otro fallo: conviene verificar contra el servidor. */
  | 'generic'

export class RegisterError extends Error {
  readonly reason: RegisterFailureReason

  constructor(reason: RegisterFailureReason, message: string) {
    super(message)
    this.name = 'RegisterError'
    this.reason = reason
  }
}

export function registerFailureReason(err: unknown): RegisterFailureReason {
  return err instanceof RegisterError ? err.reason : 'generic'
}
