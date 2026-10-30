import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { lastValueFrom, throwError } from 'rxjs';

import { ConnectivityService } from '../services/connectivity.service';
import { networkErrorInterceptor } from './network-error.interceptor';

describe('networkErrorInterceptor', () => {
  let connectivityServiceSpy: jasmine.SpyObj<ConnectivityService>;

  beforeEach(() => {
    connectivityServiceSpy = jasmine.createSpyObj('ConnectivityService', [
      'notifyRequestNetworkError',
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: ConnectivityService, useValue: connectivityServiceSpy },
      ],
    });
  });

  it('should notify connectivity service on status 0 errors', async () => {
    const req = new HttpRequest('GET', '/test');
    const httpError = new HttpErrorResponse({ status: 0 });

    const result$ = TestBed.runInInjectionContext(() =>
      networkErrorInterceptor(req, () => throwError(() => httpError)),
    );

    await expectAsync(lastValueFrom(result$)).toBeRejected();
    expect(connectivityServiceSpy.notifyRequestNetworkError).toHaveBeenCalled();
  });

  it('should not notify connectivity service on non-network errors', async () => {
    const req = new HttpRequest('GET', '/test');
    const httpError = new HttpErrorResponse({ status: 500 });

    const result$ = TestBed.runInInjectionContext(() =>
      networkErrorInterceptor(req, () => throwError(() => httpError)),
    );

    await expectAsync(lastValueFrom(result$)).toBeRejected();
    expect(
      connectivityServiceSpy.notifyRequestNetworkError,
    ).not.toHaveBeenCalled();
  });
});
