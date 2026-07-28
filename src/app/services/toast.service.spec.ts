import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ModalController, ToastController } from '@ionic/angular';

import { ToastService } from './toast.service';
import { UtilsService } from './utils.service';

describe('ToastService', () => {
  let service: ToastService;
  let isDesktop = false;
  const toastControllerSpy = jasmine.createSpyObj('ToastController', [
    'create',
  ]);
  const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
    'instant',
    'get',
  ]);
  translateServiceSpy.onLangChange = of({});
  const utilsService: any = {};
  const modalControllerSpy = jasmine.createSpyObj('ModalController', [
    'dismiss',
    'create',
  ]);

  beforeEach(() => {
    isDesktop = false;
    Object.defineProperty(utilsService, 'isDesktop', {
      get: () => isDesktop,
      configurable: true,
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: UtilsService, useValue: utilsService },
        { provide: ToastController, useValue: toastControllerSpy },
      ],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('toast positioning based on app type', () => {
    let toastController: jasmine.SpyObj<ToastController>;
    let mockToast: jasmine.SpyObj<HTMLIonToastElement>;

    beforeEach(() => {
      toastController = TestBed.inject(
        ToastController,
      ) as jasmine.SpyObj<ToastController>;

      // Basic toast mock
      mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
      mockToast.present.and.returnValue(Promise.resolve());
      toastController.create.and.returnValue(Promise.resolve(mockToast));
    });

    it('should show toast at bottom on desktop', async () => {
      isDesktop = true;

      await (service as any).showToastMessage('Test Message');

      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          position: 'bottom',
        }),
      );
    });

    it('should show toast at top on mobile', async () => {
      isDesktop = false;

      await (service as any).showToastMessage('Test Message');

      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          position: 'top',
        }),
      );
    });
  });

  describe('showToast method', () => {
    let toastController: jasmine.SpyObj<ToastController>;
    let mockToast: jasmine.SpyObj<HTMLIonToastElement>;

    beforeEach(() => {
      toastController = TestBed.inject(
        ToastController,
      ) as jasmine.SpyObj<ToastController>;

      // Basic toast mock
      mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
      mockToast.present.and.returnValue(Promise.resolve());
      toastController.create.and.returnValue(Promise.resolve(mockToast));
    });

    it('should show toast', async () => {
      // Arrange
      const message = 'Test Message';
      const duration = 3000;
      translateServiceSpy.instant.and.returnValue(message);
      // Act
      service.showToast(message);
      await Promise.resolve();
      await Promise.resolve();
      // Assert
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message,
          duration,
        }),
      );
    });

    it('should handle error when toast presentation fails', async () => {
      // Arrange
      const message = 'Test Message';
      translateServiceSpy.instant.and.returnValue(message);
      spyOn<any>(service, 'showToastMessage').and.returnValue(
        Promise.reject('Toast creation failed'),
      );
      const consoleErrorSpy = spyOn(console, 'error');
      // Act
      await service.showToast(message);
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error presenting toast:',
        'Toast creation failed',
      );
    });
  });

  describe('showDisabledToast method', () => {
    let toastController: jasmine.SpyObj<ToastController>;
    let mockToast: jasmine.SpyObj<HTMLIonToastElement>;

    beforeEach(() => {
      toastController = TestBed.inject(
        ToastController,
      ) as jasmine.SpyObj<ToastController>;

      // Basic toast mock
      mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
      mockToast.present.and.returnValue(Promise.resolve());
      toastController.create.and.returnValue(Promise.resolve(mockToast));
    });

    it('should show disabled toast', async () => {
      // Arrange
      const message = 'Test Message';
      const duration = 3000;
      translateServiceSpy.instant.and.returnValue(message);
      // Act
      await service.showDisabledToast(message);
      // Assert
      expect(toastController.create).toHaveBeenCalledWith(
        jasmine.objectContaining({
          message,
          duration,
        }),
      );
    });

    it('should handle error when toast presentation fails', async () => {
      // Arrange
      const message = 'Test Message';
      translateServiceSpy.instant.and.returnValue(message);
      spyOn<any>(service, 'showToastMessage').and.returnValue(
        Promise.reject('Toast creation failed'),
      );
      const consoleErrorSpy = spyOn(console, 'error');
      // Act
      await service.showDisabledToast(message);
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error presenting toast:',
        'Toast creation failed',
      );
    });
  });

  describe('production toast safeguards', () => {
    let toastController: jasmine.SpyObj<ToastController>;
    let consoleErrorSpy: jasmine.Spy;

    beforeEach(() => {
      toastController = TestBed.inject(
        ToastController,
      ) as jasmine.SpyObj<ToastController>;

      isDesktop = false;
      consoleErrorSpy = spyOn(console, 'error');
    });

    it('should call ensureIonToastDefined before creating toast', async () => {
      const mockToast = jasmine.createSpyObj('HTMLIonToastElement', [
        'present',
      ]);
      mockToast.present.and.returnValue(Promise.resolve());
      toastController.create.and.returnValue(Promise.resolve(mockToast));

      const ensureSpy = spyOn<any>(
        service,
        'ensureIonToastDefined',
      ).and.returnValue(Promise.resolve());

      await (service as any).presentToast({ message: 'x', position: 'top' });

      expect(ensureSpy).toHaveBeenCalled();
      expect(toastController.create).toHaveBeenCalled();
    });

    it('should log contextual error when ToastController.create rejects', async () => {
      const failingError = new Error('create failed');
      toastController.create.and.returnValue(Promise.reject(failingError));

      await (service as any).presentToast({
        message: 'Test Message',
        position: 'top',
        positionAnchor: 'toast-anchor-main',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Toast presentation failed. Ionic ToastController may still be affected by a production/runtime issue. UI fallback is intentionally disabled to preserve consistent Ionic UI.',
        jasmine.objectContaining({
          error: failingError,
          message: 'Test Message',
          position: 'top',
          positionAnchor: 'toast-anchor-main',
        }),
      );
    });

    it('should log timeout error when toast controller flow times out', async () => {
      const timeoutError = new Error('ToastController flow timed out');
      spyOn<any>(service, 'withTimeout').and.returnValue(
        Promise.reject(timeoutError),
      );

      await (service as any).presentToast({
        message: 'Timeout Message',
        position: 'top',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Toast presentation failed. Ionic ToastController may still be affected by a production/runtime issue. UI fallback is intentionally disabled to preserve consistent Ionic UI.',
        jasmine.objectContaining({
          error: timeoutError,
          message: 'Timeout Message',
          position: 'top',
        }),
      );
    });
  });
});
