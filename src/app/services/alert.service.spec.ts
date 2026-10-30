import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';

import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';
import { CopyDataOption } from '../shared/enums';
import { UserPhoto } from '../shared/app.interfaces';
import { ToastService } from './toast.service';

describe('AlertService', () => {
  let service: AlertService;
  let alertControllerSpy: jasmine.SpyObj<AlertController>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let alertSpy: any;

  beforeEach(() => {
    alertSpy = jasmine.createSpyObj('Alert', ['present', 'dismiss']);
    alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
    translateServiceSpy = createTranslateServiceMock();
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['showToast']);

    TestBed.configureTestingModule({
      providers: [
        AlertService,
        {
          provide: TranslateService,
          useValue: translateServiceSpy,
        },
        { provide: AlertController, useValue: alertControllerSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    });

    service = TestBed.inject(AlertService);
  });

  describe('showStoragePermissionError', () => {
    it('should create and present a storage permission error alert with translated strings', async () => {
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showStoragePermissionError();

      expect(translateServiceSpy.instant).toHaveBeenCalledWith(
        'APP.ALERT_SERVICE.STORAGE_PERMISSION.HEADER',
      );
      expect(translateServiceSpy.instant).toHaveBeenCalledWith(
        'APP.ALERT_SERVICE.STORAGE_PERMISSION.SUBHEADER',
      );
      expect(translateServiceSpy.instant).toHaveBeenCalledWith(
        'APP.ALERT_SERVICE.STORAGE_PERMISSION.MESSAGE',
      );
      expect(alertControllerSpy.create).toHaveBeenCalledWith({
        header: 'APP.ALERT_SERVICE.STORAGE_PERMISSION.HEADER',
        subHeader: 'APP.ALERT_SERVICE.STORAGE_PERMISSION.SUBHEADER',
        message: 'APP.ALERT_SERVICE.STORAGE_PERMISSION.MESSAGE',
        buttons: [
          {
            text: 'APP.ALERT_SERVICE.OK',
            role: 'cancel',
          },
        ],
      });
      expect(alertSpy.present).toHaveBeenCalled();
    });
  });

  describe('confirmDeletePhotoAlert', () => {
    it('should create and present a confirm delete all photos alert with translated strings', async () => {
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.confirmDeletePhotoAlert('all');

      expect(translateServiceSpy.instant).toHaveBeenCalledWith(
        'APP.ALERT_SERVICE.DELETE_PHOTOS.HEADER',
      );
      expect(translateServiceSpy.instant).toHaveBeenCalledWith(
        'APP.ALERT_SERVICE.DELETE_PHOTOS.MESSAGE',
      );
      expect(alertControllerSpy.create).toHaveBeenCalledWith({
        header: 'APP.ALERT_SERVICE.DELETE_PHOTOS.HEADER',
        subHeader: 'APP.ALERT_SERVICE.DELETE_PHOTOS.SUBHEADER',
        message: 'APP.ALERT_SERVICE.DELETE_PHOTOS.MESSAGE',
        buttons: [
          {
            text: 'APP.ALERT_SERVICE.DELETE',
            role: 'destructive',
          },
          {
            text: 'APP.ALERT_SERVICE.CANCEL',
            role: 'cancel',
          },
        ],
        cssClass: 'confirm-delete-alert',
        backdropDismiss: false,
      });
      expect(alertSpy.present).toHaveBeenCalled();
    });

    it('should create and present a confirm delete a single photo alert with translated strings', async () => {
      alertControllerSpy.create.and.resolveTo(alertSpy);
      const photo = {
        photoInfo: { title: 'Sample Photo' },
      } as any as UserPhoto;

      await service.confirmDeletePhotoAlert(photo);

      expect(translateServiceSpy.instant).toHaveBeenCalledWith(
        'APP.ALERT_SERVICE.DELETE_PHOTO.HEADER',
      );
      expect(translateServiceSpy.instant).toHaveBeenCalledWith(
        'APP.ALERT_SERVICE.DELETE_PHOTO.MESSAGE',
      );
      expect(alertControllerSpy.create).toHaveBeenCalledWith({
        header: 'APP.ALERT_SERVICE.DELETE_PHOTO.HEADER',
        subHeader: 'APP.ALERT_SERVICE.DELETE_PHOTO.SUBHEADER',
        message: 'APP.ALERT_SERVICE.DELETE_PHOTO.MESSAGE',
        buttons: [
          {
            text: 'APP.ALERT_SERVICE.DELETE',
            role: 'destructive',
          },
          {
            text: 'APP.ALERT_SERVICE.CANCEL',
            role: 'cancel',
          },
        ],
        cssClass: 'confirm-delete-alert',
        backdropDismiss: false,
      });
      expect(alertSpy.present).toHaveBeenCalled();
    });

    it('should return false if user cancels the action', async () => {
      // make onDidDismiss resolve to a cancel role so the service behaves as if the user cancelled
      alertSpy.onDidDismiss = jasmine
        .createSpy('onDidDismiss')
        .and.returnValue(Promise.resolve({ role: 'cancel' }));
      alertControllerSpy.create.and.resolveTo(alertSpy);
      const photo = {
        photoInfo: { title: 'Sample Photo' },
      } as any as UserPhoto;

      const result = await service.confirmDeletePhotoAlert(photo);

      expect(alertControllerSpy.create).toHaveBeenCalled();
      expect(alertSpy.present).toHaveBeenCalled();
      expect(result).toBeFalse();
    });

    it('should return true if user confirms the action', async () => {
      // make onDidDismiss resolve to a destructive role so the service behaves as if the user confirmed deletion
      alertSpy.onDidDismiss = jasmine
        .createSpy('onDidDismiss')
        .and.returnValue(Promise.resolve({ role: 'destructive' }));
      alertControllerSpy.create.and.resolveTo(alertSpy);
      const photo = {
        photoInfo: { title: 'Sample Photo' },
      } as any as UserPhoto;

      const result = await service.confirmDeletePhotoAlert(photo);

      expect(alertControllerSpy.create).toHaveBeenCalled();
      expect(alertSpy.present).toHaveBeenCalled();
      expect(result).toBeTrue();
    });
  });

  describe('showCopyAlert', () => {
    it('should display the copy alert', async () => {
      alertSpy.onDidDismiss = jasmine
        .createSpy('onDidDismiss')
        .and.returnValue(Promise.resolve({ role: 'destructive' }));
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showCopyAlert('some\\filepath');

      expect(alertControllerSpy.create).toHaveBeenCalled();
      expect(alertSpy.present).toHaveBeenCalled();
    });

    it('should return selected copy options when user confirms', async () => {
      const returnedData = {
        copyPhoto: true,
        copyTitleDescription: true,
        copyExtractedText: false,
        copyTextStatistics: true,
        copyCreatedModifiedTimestamps: false,
      };
      alertSpy.onDidDismiss = jasmine
        .createSpy('onDidDismiss')
        .and.returnValue(Promise.resolve({ data: returnedData }));
      alertControllerSpy.create.and.resolveTo(alertSpy);

      const result = await service.showCopyAlert('some\\file.png');

      expect(alertControllerSpy.create).toHaveBeenCalled();
      expect(alertSpy.present).toHaveBeenCalled();
      expect(result).toEqual(returnedData);
    });

    it('should disable photo checkbox for non-image files on native platform', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      // make onDidDismiss resolve with empty data
      alertSpy.onDidDismiss = jasmine
        .createSpy('onDidDismiss')
        .and.returnValue(Promise.resolve({ data: {} }));
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showCopyAlert('c:\\path\\to\\file.tiff');

      expect(alertControllerSpy.create).toHaveBeenCalled();
      const createArgs = alertControllerSpy.create.calls.mostRecent()
        .args[0] as any;
      expect(createArgs.header).toBe(
        'APP.ALERT_SERVICE.COPY_DATA.HEADER_SHARE',
      );
      // first input corresponds to the photo checkbox
      const photoInput = createArgs.inputs[0];
      expect(photoInput.disabled).toBeTrue();
      expect(photoInput.checked).toBeFalse();
    });

    it('should keep photo checkbox enabled for image files on web', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      alertSpy.onDidDismiss = jasmine
        .createSpy('onDidDismiss')
        .and.returnValue(Promise.resolve({ data: {} }));
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showCopyAlert('c:\\path\\to\\file.png');

      expect(alertControllerSpy.create).toHaveBeenCalled();
      const createArgs = alertControllerSpy.create.calls.mostRecent()
        .args[0] as any;
      expect(createArgs.header).toBe('APP.ALERT_SERVICE.COPY_DATA.HEADER');
      const photoInput = createArgs.inputs[0];
      expect(photoInput.disabled).toBeFalse();
      expect(photoInput.checked).toBeTrue();
    });

    it('should enable/disable photo checkbox for different image files on web or native platforms', async () => {
      let isNativePlatformSpy = spyOn(
        Capacitor,
        'isNativePlatform',
      ).and.returnValue(false);

      alertSpy.onDidDismiss = jasmine
        .createSpy('onDidDismiss')
        .and.returnValue(Promise.resolve({ data: {} }));
      alertControllerSpy.create.and.resolveTo(alertSpy);

      const testCases = [
        {
          testCase: '1',
          file: 'c:\\path\\to\\file.png',
          isNative: false,
          expectedDisabled: false,
          expectedChecked: true,
          photoLabelErrorText: '',
        },
        {
          testCase: '2',
          file: 'c:\\path\\to\\file.jpg',
          isNative: false,
          expectedDisabled: true,
          expectedChecked: false,
          photoLabelErrorText:
            'APP.ALERT_SERVICE.COPY_DATA.PHOTO_FORMAT_NOT_SUPPORTED_WEB',
        },
        {
          testCase: '3',
          file: 'c:\\path\\to\\file.jpeg',
          isNative: false,
          expectedDisabled: true,
          expectedChecked: false,
          photoLabelErrorText:
            'APP.ALERT_SERVICE.COPY_DATA.PHOTO_FORMAT_NOT_SUPPORTED_WEB',
        },
        {
          testCase: '4',
          file: 'c:\\path\\to\\file.tiff',
          isNative: false,
          expectedDisabled: true,
          expectedChecked: false,
          photoLabelErrorText:
            'APP.ALERT_SERVICE.COPY_DATA.PHOTO_FORMAT_NOT_SUPPORTED_WEB',
        },
        {
          testCase: '5',
          file: 'c:\\path\\to\\file.png',
          isNative: true,
          expectedDisabled: false,
          expectedChecked: true,
          photoLabelErrorText: '',
        },
        {
          testCase: '6',
          file: 'c:\\path\\to\\file.jpg',
          isNative: true,
          expectedDisabled: false,
          expectedChecked: true,
          photoLabelErrorText: '',
        },
        {
          testCase: '7',
          file: 'c:\\path\\to\\file.jpeg',
          isNative: true,
          expectedDisabled: false,
          expectedChecked: true,
          photoLabelErrorText: '',
        },
        {
          testCase: '8',
          file: 'c:\\path\\to\\file.tiff',
          isNative: true,
          expectedDisabled: true,
          expectedChecked: false,
          photoLabelErrorText:
            'APP.ALERT_SERVICE.COPY_DATA.PHOTO_FORMAT_NOT_SUPPORTED_NATIVE',
        },
      ];

      for (const testCase of testCases) {
        isNativePlatformSpy.and.returnValue(testCase.isNative);
        await service.showCopyAlert(testCase.file);

        expect(alertControllerSpy.create).toHaveBeenCalled();
        const createArgs = alertControllerSpy.create.calls.mostRecent()
          .args[0] as any;
        const photoInput = createArgs.inputs[0];
        expect(photoInput.disabled)
          .withContext(`Test case ${testCase.testCase}: disabled`)
          .toBe(testCase.expectedDisabled);
        expect(photoInput.checked)
          .withContext(`Test case ${testCase.testCase}: checked`)
          .toBe(testCase.expectedChecked);
        expect(photoInput.label)
          .withContext(`Test case ${testCase.testCase}: errorText`)
          .toContain(testCase.photoLabelErrorText);
      }
    });

    it('should execute confirm and cancel button handlers as expected', async () => {
      // web platform
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      alertSpy.onDidDismiss = jasmine
        .createSpy('onDidDismiss')
        .and.returnValue(Promise.resolve({ data: {} }));
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showCopyAlert('c:\\path\\to\\file.png');

      const createArgs = alertControllerSpy.create.calls.mostRecent()
        .args[0] as any;
      const confirmBtn = (createArgs.buttons as any[]).find(
        (b: any) => b.role === 'confirm',
      );
      const cancelBtn = (createArgs.buttons as any[]).find(
        (b: any) => b.role === 'cancel',
      );

      const confirmResultWithoutSelection = confirmBtn.handler([]);

      // call confirm handler without any selected options and expect false
      expect(confirmResultWithoutSelection)
        .withContext('confirmResultWithoutSelection')
        .toBeFalse();

      expect(confirmBtn).withContext('Confirm button').toBeDefined();
      expect(cancelBtn).withContext('Cancel button').toBeDefined();

      // call confirm handler with some selected options
      const confirmResult = confirmBtn.handler([
        CopyDataOption.Photo,
        CopyDataOption.ExtractedText,
        CopyDataOption.TextStatistics,
      ]);
      expect(confirmResult.copyPhoto).withContext('copyPhoto').toBeTrue();
      expect(confirmResult.copyExtractedText)
        .withContext('copyExtractedText')
        .toBeTrue();
      expect(confirmResult.copyTextStatistics)
        .withContext('copyTextStatistics')
        .toBeTrue();
      expect(confirmResult.copyCreatedModifiedTimestamps)
        .withContext('copyCreatedModifiedTimestamps')
        .toBeFalse();
      expect(confirmResult.copyTitleDescription)
        .withContext('copyTitleDescription')
        .toBeFalse();

      // call cancel handler and expect an empty object
      const cancelResult = cancelBtn.handler();
      expect(cancelResult).withContext('cancelResult').toEqual({});
    });

    it('should display the correct text for web app', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      alertSpy.onDidDismiss = jasmine
        .createSpy('onDidDismiss')
        .and.returnValue(Promise.resolve({ data: {} }));
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showCopyAlert('c:\\path\\to\\file.png');

      const createArgs = alertControllerSpy.create.calls.mostRecent()
        .args[0] as any;
      expect(createArgs.header).toBe('APP.ALERT_SERVICE.COPY_DATA.HEADER');
      expect(createArgs.subHeader).toBe(
        'APP.ALERT_SERVICE.COPY_DATA.SUBHEADER',
      );
      expect(createArgs.message).toBe('APP.ALERT_SERVICE.COPY_DATA.MESSAGE');
      expect(createArgs.buttons[0].text).toBe('APP.ALERT_SERVICE.COPY');
    });

    it('should display the correct text for native app', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      alertSpy.onDidDismiss = jasmine
        .createSpy('onDidDismiss')
        .and.returnValue(Promise.resolve({ data: {} }));
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showCopyAlert('c:\\path\\to\\file.png');

      const createArgs = alertControllerSpy.create.calls.mostRecent()
        .args[0] as any;
      expect(createArgs.header).toBe(
        'APP.ALERT_SERVICE.COPY_DATA.HEADER_SHARE',
      );
      expect(createArgs.subHeader).toBeUndefined();
      expect(createArgs.message).toBe(
        'APP.ALERT_SERVICE.COPY_DATA.MESSAGE_SHARE',
      );
      expect(createArgs.buttons[0].text).toBe('APP.ALERT_SERVICE.SHARE');
    });

    it('should show a toast when no copy data is selected', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      alertSpy.onDidDismiss = jasmine
        .createSpy('onDidDismiss')
        .and.returnValue(Promise.resolve({ data: [] }));
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showCopyAlert('c:\\path\\to\\file.png');

      const createArgs = alertControllerSpy.create.calls.mostRecent()
        .args[0] as any;
      const copyBtn = createArgs.buttons.find(
        (btn: any) => btn.role === 'confirm'
      );
      copyBtn.handler([]);

      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'FEATURE.TOAST.ERROR_NO_COPY_DATA_SELECTED'
      );
    });
  });
});
