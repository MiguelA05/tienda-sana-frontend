import { HttpErrorResponse } from '@angular/common/http';
import { MensajeDTO } from '../../dto/mensaje-dto';

export function assertOkReply<T>(m: MensajeDTO): T {
  if (m.error) {
    const r = m.reply;
    const msg =
      typeof r === 'string'
        ? r
        : r && typeof r === 'object' && 'message' in r
          ? String((r as { message?: string }).message)
          : 'Error del servidor';
    throw new Error(msg);
  }
  return m.reply as T;
}

export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object' && 'reply' in body) {
      const r = (body as MensajeDTO).reply;
      if (typeof r === 'string') {
        return r;
      }
    }
    return err.message || fallback;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}
