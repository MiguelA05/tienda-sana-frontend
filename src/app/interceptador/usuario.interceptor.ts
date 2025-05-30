import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export const usuarioInterceptor: HttpInterceptorFn = (req, next) => {

  const tokenService = inject(TokenService);
  const isApiAuth = req.url.includes("api/auth");
  const isAPiPublico = req.url.includes("api/public");

  if (!tokenService.isLogged() || isApiAuth || isAPiPublico) {
    return next(req);
  }
  const token = tokenService.getToken();
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  return next(authReq);
};
