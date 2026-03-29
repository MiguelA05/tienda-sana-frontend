import {
  HttpClient,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

interface CloudinarySignatureResponse {
  timestamp: number;
  signature: string;
  api_key: string;
  cloud_name: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
}

export interface CloudinaryUploadState {
  progress: number;
  secureUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class CloudinaryUploadService {
  private readonly http = inject(HttpClient);
  private readonly maxBytes = 5 * 1024 * 1024;

  validateImage(file: File): string | null {
    if (!file.type.startsWith('image/')) {
      return 'Solo se permiten archivos de imagen.';
    }
    if (file.size > this.maxBytes) {
      return 'La imagen excede 5MB.';
    }
    return null;
  }

  uploadImage(file: File): Observable<CloudinaryUploadState> {
    const validationError = this.validateImage(file);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    return this.getSignature().pipe(
      switchMap((sign) => this.uploadToCloudinary(file, sign)),
      catchError((e) => throwError(() => new Error(this.mapFriendlyError(e)))),
    );
  }

  private uploadToCloudinary(
    file: File,
    signature: CloudinarySignatureResponse
  ): Observable<CloudinaryUploadState> {
    return new Observable((observer) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.api_key);
      formData.append('timestamp', String(signature.timestamp));
      formData.append('signature', signature.signature);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloud_name}/image/upload`;
      const xhr = new XMLHttpRequest();

      const onProgress = (event: ProgressEvent<EventTarget>) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          observer.next({ progress });
        }
      };

      const onLoad = () => {
        if (xhr.status === 200) {
          try {
            const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
            observer.next({ progress: 100, secureUrl: response.secure_url });
            observer.complete();
          } catch {
            observer.error(new Error('Error parsing Cloudinary response'));
          }
        } else {
          let parsedError: unknown = undefined;
          try {
            parsedError = JSON.parse(xhr.responseText);
          } catch {
            parsedError = xhr.responseText || undefined;
          }
          observer.error(new HttpErrorResponse({ status: xhr.status, statusText: xhr.statusText, error: parsedError }));
        }
      };

      const onError = () => {
        observer.error(new HttpErrorResponse({ status: 0, statusText: 'Network error' }));
      };

      const onAbort = () => {
        observer.error(new HttpErrorResponse({ status: 0, statusText: 'Upload aborted' }));
      };

      xhr.upload.addEventListener('progress', onProgress);
      xhr.addEventListener('load', onLoad);
      xhr.addEventListener('error', onError);
      xhr.addEventListener('abort', onAbort);

      xhr.open('POST', uploadUrl);
      xhr.send(formData);

      // Cleanup para evitar requests colgadas si el observable se cancela por navegación o unsubscribe.
      return () => {
        xhr.upload.removeEventListener('progress', onProgress);
        xhr.removeEventListener('load', onLoad);
        xhr.removeEventListener('error', onError);
        xhr.removeEventListener('abort', onAbort);
        if (xhr.readyState !== XMLHttpRequest.DONE) {
          xhr.abort();
        }
      };
    });
  }

  private mapFriendlyError(err: unknown): string {
    if (err instanceof Error && !(err as HttpErrorResponse).status) {
      return err.message;
    }

    if (err instanceof HttpErrorResponse) {
      const backendReply = err.error?.reply;
      const backendDetail = err.error?.detail;
      const backendMessage = err.error?.message;

      const backendText =
        (typeof backendReply === 'string' && backendReply) ||
        (typeof backendDetail === 'string' && backendDetail) ||
        (typeof backendMessage === 'string' && backendMessage) ||
        '';

      if (err.status === 0) {
        return 'No hay conexion de red o Cloudinary no responde.';
      }
      if (err.status === 401 || err.status === 403) {
        return 'No autorizado para subir imagen. Verifique sesion y firma.';
      }
      if (err.status === 400) {
        const cloudinaryMsg = err.error?.error?.message;
        if (typeof cloudinaryMsg === 'string' && cloudinaryMsg.length > 0) {
          return `Cloudinary rechazo la imagen: ${cloudinaryMsg}`;
        }
        return 'Solicitud invalida al subir imagen.';
      }
      if (err.status >= 500) {
        if (backendText) {
          return backendText;
        }
        return 'Cloudinary o backend presentaron un error interno.';
      }

      if (backendText) {
        return backendText;
      }
    }

    return 'Error inesperado durante la subida de imagen.';
  }

  private getSignature(): Observable<CloudinarySignatureResponse> {
    return this.http.get<CloudinarySignatureResponse>(`${environment.adminServiceUrl}/cloudinary/signature`);
  }
}
