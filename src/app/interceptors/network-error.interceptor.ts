import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ConnectivityService } from '../services/connectivity.service';

export const networkErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const connectivityService = inject(ConnectivityService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 0) {
        connectivityService.notifyRequestNetworkError();
      }

      return throwError(() => error);
    }),
  );
};
