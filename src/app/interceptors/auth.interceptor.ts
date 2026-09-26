import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth';
import { API_BASE_URL } from '../services/api-base';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const token = authService.obtenerToken();

  const esApiHcu008 = req.url.startsWith(`${API_BASE_URL}/`);

  let request = req;

  if (esApiHcu008 && token && !req.headers.has('Authorization')) {
    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (esApiHcu008 && error.status === 401) {
        authService.cerrarSesion();
      }

      return throwError(() => error);
    })
  );
};
