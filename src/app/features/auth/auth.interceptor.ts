import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isPublicAuthEndpoint =
    req.url.includes('/auth/login')
    || req.url.includes('/auth/register')
    || req.url.includes('/auth/password/recovery-request')
    || req.url.includes('/auth/password/validate-token')
    || req.url.includes('/auth/password/reset');

  const token = authService.getToken();
  const shouldAttachToken = !!token && !isPublicAuthEndpoint;

  const request = shouldAttachToken
    ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : req;

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isPublicAuthEndpoint) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
