import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { CameraWeb } from '@capacitor/camera/dist/esm/web';
import { TranslateService } from '@ngx-translate/core';

import { PhotoService } from './photo.service';
import { PhotoStorageService } from './photo-storage.service';
import { ToastService } from './toast.service';
import { UserPhoto } from '../shared/app.interfaces';
import { createTranslateServiceMock } from '../testing/translate-service.mock';

describe('PhotoService', () => {
  let service: PhotoService;
  let photosSubject: BehaviorSubject<UserPhoto[]>;
  let photoStorageServiceSpy: jasmine.SpyObj<PhotoStorageService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    photosSubject = new BehaviorSubject<UserPhoto[]>([]);

    photoStorageServiceSpy = jasmine.createSpyObj<PhotoStorageService>(
      'PhotoStorageService',
      ['savePhoto', 'cachePhotos', 'deleteAllPhotos', 'deletePhoto'],
      { photos$: photosSubject.asObservable() },
    );

    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', [
      'showToast',
    ]);

    TestBed.configureTestingModule({
      providers: [
        PhotoService,
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        { provide: PhotoStorageService, useValue: photoStorageServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    });

    service = TestBed.inject(PhotoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('makePhoto', () => {
    it('should call capturePhoto with Camera source', async () => {
      const captureSpy = spyOn<any>(service, 'capturePhoto').and.resolveTo();

      await service.makePhoto();

      expect(captureSpy).toHaveBeenCalledWith(CameraSource.Camera);
    });
  });

  describe('selectPhoto', () => {
    it('should call capturePhoto with Photos source', async () => {
      const captureSpy = spyOn<any>(service, 'capturePhoto').and.resolveTo();

      await service.selectPhoto();

      expect(captureSpy).toHaveBeenCalledWith(CameraSource.Photos);
    });
  });

  describe('capturePhoto', () => {
    it('should capture photo and pass it to saveCapturedPhoto', async () => {
      const capturedPhoto = {
        webPath: 'http://localhost/captured.jpg',
        format: 'jpeg',
      } as Photo;

      const getPhotoMock = jasmine
        .createSpy('getPhoto')
        .and.resolveTo(capturedPhoto);
      spyOn(CameraWeb.prototype, 'getPhoto').and.callFake(getPhotoMock);
      const saveCapturedSpy = spyOn<any>(
        service,
        'saveCapturedPhoto',
      ).and.resolveTo();

      await (service as any).capturePhoto(CameraSource.Camera);

      expect(getPhotoMock).toHaveBeenCalledWith({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100,
      });
      expect(saveCapturedSpy).toHaveBeenCalledWith(capturedPhoto);
    });

    it('should handle errors when capturing photo', async () => {
      const error = new Error('Camera error');
      spyOn(CameraWeb.prototype, 'getPhoto').and.rejectWith(error);
      const saveCapturedSpy = spyOn<any>(
        service,
        'saveCapturedPhoto',
      ).and.resolveTo();
      const handlePhotoCaptureErrorSpy = spyOn<any>(
        service,
        'handlePhotoCaptureError',
      ).and.callThrough();

      await (service as any).capturePhoto(CameraSource.Camera);

      expect(saveCapturedSpy).not.toHaveBeenCalled();
      expect(handlePhotoCaptureErrorSpy).toHaveBeenCalledWith(
        error,
        CameraSource.Camera,
      );
    });
  });

  describe('handlePhotoCaptureError', () => {
    it('should log error and show Toast when errors on capturing photo', () => {
      const error = new Error('Test error');
      spyOn(console, 'error');
      const testCases = [
        {
          caseNo: 1,
          source: CameraSource.Camera,
          expectedMessage: 'FEATURE.TOAST.ERROR_PHOTO_CAPTURE',
        },
        {
          caseNo: 2,
          source: CameraSource.Photos,
          expectedMessage: 'FEATURE.TOAST.ERROR_PHOTO_SELECTION',
        },
      ];

      testCases.forEach((testCase) => {
        (service as any).handlePhotoCaptureError(error, testCase.source);

        expect(console.error).toHaveBeenCalledWith(
          'Error capturing or selecting photo:',
          error,
        );
        expect(toastServiceSpy.showToast)
          .withContext(`Case ${testCase.caseNo}`)
          .toHaveBeenCalledWith(testCase.expectedMessage);
      });
    });

    it('should show toast without logging when user cancelled action', () => {
      const error = new Error('User cancelled');
      spyOn(console, 'error');
      const testCases = [
        {
          caseNo: 1,
          source: CameraSource.Camera,
          expectedMessage: 'FEATURE.TOAST.PHOTO_CAPTURE_CANCELLED',
        },
        {
          caseNo: 2,
          source: CameraSource.Photos,
          expectedMessage: 'FEATURE.TOAST.PHOTO_CAPTURE_CANCELLED',
        },
      ];

      testCases.forEach((testCase) => {
        (service as any).handlePhotoCaptureError(error, testCase.source);
        
        expect(toastServiceSpy.showToast)
          .withContext(`Case ${testCase.caseNo}`)
          .toHaveBeenCalledWith(testCase.expectedMessage);
        expect(console.error).not.toHaveBeenCalled();
      });
    });
  });

  describe('saveCapturedPhoto', () => {
    it('should save photo and cache photos', async () => {
      const capturedPhoto = { webPath: 'http://localhost/saved.jpg' } as Photo;
      spyOn(service, 'savePhoto').and.resolveTo({
        filepath: 'file:///saved.jpg',
      } as UserPhoto);

      await (service as any).saveCapturedPhoto(capturedPhoto);

      expect(service.savePhoto).toHaveBeenCalledWith(capturedPhoto);
      expect(photoStorageServiceSpy.cachePhotos).toHaveBeenCalled();
    });
  });

  describe('savePhoto', () => {
    it('should delegate to PhotoStorageService.savePhoto', async () => {
      const photo = { webPath: 'http://localhost/photo.jpg' } as Photo;
      const savedPhoto = {
        filepath: 'file:///saved.jpg',
        webviewPath: 'http://localhost/saved.jpg',
      } as UserPhoto;
      photoStorageServiceSpy.savePhoto.and.resolveTo(savedPhoto);

      const result = await service.savePhoto(photo);

      expect(photoStorageServiceSpy.savePhoto).toHaveBeenCalledWith(photo);
      expect(result).toEqual(savedPhoto);
    });
  });
});
