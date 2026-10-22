import { MainPage } from './../main/main.page';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Storage } from '@ionic/storage-angular';
import { TranslateService } from '@ngx-translate/core';

import { PhotoStorageService } from './photo-storage.service';
import { createTranslateServiceMock } from '../testing/translate-service.mock';
import { ToastService } from './toast.service';
import { AlertService } from './alert.service';
import { FileConversionService } from './file-conversion.service';
import { FilePathService } from './file-path.service';
import { FILESYSTEM } from './filesystem.token';
import { UserPhoto } from '../shared/app.interfaces';
import { Capacitor } from '@capacitor/core';
import { ToastAnchor } from '../shared/enums';

const photos: UserPhoto[] = [
  {
    filepath: 'img_txt_20261019_173534.png',
    webviewPath: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoA...',
    photoInfo: {
      createdAt: '2026-10-19T15:35:42.739Z',
      description: 'Test making photo',
      extractedText: "Oooh\nthat's\nSkoda Epis\nEpiQ",
      modifiedAt: '2026-10-19T15:36:30.433Z',
      title: 'Auto touring magazine',
    },
  } as UserPhoto,
  {
    filepath: 'img_txt_20261016_115125.png',
    webviewPath: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAA...',
    photoInfo: {
      createdAt: '2026-10-16T09:51:28.967Z',
      description: 'photo description',
      extractedText: '',
      modifiedAt: '2026-10-19T09:15:50.925Z',
      title: 'photo title',
    },
  } as UserPhoto,
  {
    filepath: 'img_txt_20261016_115048.jpeg',
    webviewPath: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAATIAAAE...',
    photoInfo: {
      createdAt: '2026-10-16T09:50:54.016Z',
      extractedText: 'BEST FREE TEXT-TO-AI\nIMAGE GENERATORS',
    },
  } as UserPhoto,
];

describe('PhotoStorageService', () => {
  let service: PhotoStorageService;
  let storageSpy: jasmine.SpyObj<Storage>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let fileConversionServiceSpy: jasmine.SpyObj<FileConversionService>;
  let filePathServiceSpy: jasmine.SpyObj<FilePathService>;
  let filesystemSpy: jasmine.SpyObj<typeof FILESYSTEM>;
  let isNativePlattformSpy: jasmine.Spy;

  beforeEach(() => {
    storageSpy = jasmine.createSpyObj('Storage', [
      'create',
      'get',
      'set',
      'remove',
      'clear',
      'length',
      'keys',
    ]);
    storageSpy.create.and.returnValue(Promise.resolve(storageSpy));
    storageSpy.get.and.returnValue(Promise.resolve(null));
    storageSpy.set.and.returnValue(Promise.resolve());
    storageSpy.remove.and.returnValue(Promise.resolve());
    storageSpy.clear.and.returnValue(Promise.resolve());
    storageSpy.length.and.returnValue(Promise.resolve(0));
    storageSpy.keys.and.returnValue(Promise.resolve([]));

    toastServiceSpy = jasmine.createSpyObj('ToastService', ['showToast']);
    alertServiceSpy = jasmine.createSpyObj('AlertService', [
      'presentAlert',
      'showStoragePermissionError',
    ]);
    fileConversionServiceSpy = jasmine.createSpyObj('FileConversionService', [
      'blobToDataUrl',
      'blobToBase64',
      'base64ToBlob',
    ]);
    filePathServiceSpy = jasmine.createSpyObj('FilePathService', [
      'getFileName',
      'getFilenameFromFilepath',
    ]);
    filesystemSpy = jasmine.createSpyObj('FILESYSTEM', [
      'readFile',
      'writeFile',
      'deleteFile',
      'checkPermissions',
      'requestPermissions',
    ]);
    isNativePlattformSpy = spyOn(Capacitor, 'isNativePlatform');

    TestBed.configureTestingModule({
      providers: [
        PhotoStorageService,
        { provide: FILESYSTEM, useValue: filesystemSpy },
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: Storage, useValue: storageSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: FileConversionService, useValue: fileConversionServiceSpy },
        { provide: FilePathService, useValue: filePathServiceSpy },
      ],
    });

    service = TestBed.inject(PhotoStorageService);
    service['photos'] = [];
  });

  afterEach(() => {
    isNativePlattformSpy.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize the storage service', async () => {
    await service.initStorage();
    expect(storageSpy.create).toHaveBeenCalled();
  });

  describe('getNextPhoto', () => {
    beforeEach(() => {
      (service as any).photos = photos.slice();
    });
    it('should return the next photo in the list', () => {
      const nextPhoto = service.getNextPhoto(photos[0]);
      expect(nextPhoto).toEqual((service as any).photos[1]);
    });

    it('should return undefined if there is no next photo', () => {
      const nextPhoto = service.getNextPhoto(photos[photos.length - 1]);
      expect(nextPhoto).toBeUndefined();
    });
  });

  describe('getPreviousPhoto', () => {
    beforeEach(() => {
      (service as any).photos = photos.slice();
    });
    it('should return the previous photo in the list', () => {
      const previousPhoto = service.getPreviousPhoto(photos[1]);
      expect(previousPhoto).toEqual((service as any).photos[0]);
    });

    it('should return undefined if there is no previous photo', () => {
      const previousPhoto = service.getPreviousPhoto(photos[0]);
      expect(previousPhoto).toBeUndefined();
    });
  });

  describe('getNoExtractedTextInfo', () => {
    it('should return the correct info when there is no extracted text', () => {
      const photo = {
        filepath: 'img_txt_20261019_173534.png',
        photoInfo: {
          createdAt: '2026-10-19T15:35:42.739Z',
          description: 'Test making photo',
          extractedText: '',
          modifiedAt: '2026-10-19T15:36:30.433Z',
          title: 'Auto touring magazine',
        },
      };
      const result = service.getNoExtractedTextInfo(photo);
      expect(result).toBe('FEATURE.CARD.LABEL.NO_EXTRACTED_TEXT_FOUND');
    });

    it('should return the correct info when there is no photo info', () => {
      const photo = {
        filepath: 'img_txt_20261019_173534.png',
        photoInfo: null,
      } as any as UserPhoto;
      const result = service.getNoExtractedTextInfo(photo);
      expect(result).toBe(
        'FEATURE.CARD.LABEL.NO_EXTRACTED_TEXT_NO_METADATA_INFO',
      );
    });

    it('should return empty string if photoinfo and extractedText are both filled', () => {
      (service as any).photos = photos.slice();
      const result = service.getNoExtractedTextInfo((service as any).photos[0]);
      expect(result).toBe('');
    });
  });

  describe('updatePhotoInfo', () => {
    let cachePhotosSpy: jasmine.Spy;

    beforeEach(() => {
      cachePhotosSpy = spyOn(service as any, 'cachePhotos').and.callThrough();
      spyOn(Date.prototype, 'toISOString').and.callFake(
        () => '2026-10-20T16:19:00.000Z',
      );
      service['photos'] = photos.slice();
    });

    it('should add the new photo info and cache the updated photo', async () => {
      const photo = {
        filepath: 'img_txt_20261019_173534.png',
      };
      service['photos'][0] = photo;
      const addPhotoInfo = {
        title: 'new title',
        description: 'new description',
      };
      const expectedPhoto = {
        filepath: 'img_txt_20261019_173534.png',
        photoInfo: {
          createdAt: '2026-10-20T16:19:00.000Z',
          title: 'new title',
          description: 'new description',
        },
      };

      const updatedPhoto = await service.updatePhotoInfo(photo, addPhotoInfo);

      expect(updatedPhoto).toEqual(expectedPhoto);
      expect(cachePhotosSpy).toHaveBeenCalled();
      expect(service['photos']).toContain(
        jasmine.objectContaining(expectedPhoto),
      );
    });

    it('should update the changed photo info and cache the updated photo', async () => {
      const photo = {
        filepath: 'img_txt_20261019_173534.png',
        photoInfo: {
          createdAt: '2026-10-19T15:35:42.739Z',
          title: 'new title',
          description: 'new description',
        },
      };
      service['photos'][0] = photo;
      const updatePhotoInfo = {
        title: 'changed title',
        description: 'changed description',
      };
      const expectedPhoto = {
        filepath: 'img_txt_20261019_173534.png',
        photoInfo: {
          createdAt: '2026-10-19T15:35:42.739Z',
          title: 'changed title',
          description: 'changed description',
          modifiedAt: '2026-10-20T16:19:00.000Z',
        },
      };

      const updatedPhoto = await service.updatePhotoInfo(
        photo,
        updatePhotoInfo,
      );

      expect(updatedPhoto).toEqual(expectedPhoto);
      expect(cachePhotosSpy).toHaveBeenCalled();
      expect(service['photos']).toContain(
        jasmine.objectContaining(expectedPhoto),
      );
    });
  });

  describe('getPhotosFromCache', () => {
    it('should load photos from cache and update the observable', async () => {
      storageSpy.get.and.returnValue(Promise.resolve(JSON.stringify(photos)));

      await service.getPhotosFromCache();

      expect(service['photos']).toEqual(photos);
      service['photosSubject'].subscribe((photos) => {
        expect(photos).toEqual((service as any).photos);
      });
    });

    it('should log and throw error if loading from cache fails', async () => {
      const error = new Error('Failed to load');
      storageSpy.get.and.returnValue(Promise.reject(error));
      spyOn(console, 'error');

      try {
        await service.getPhotosFromCache();
      } catch (e) {
        expect(e).toBe(error);
        expect(console.error).toHaveBeenCalledWith(
          'Error loading photos from storage:',
          error,
        );
      }
    });
  });

  describe('cachePhotos', () => {
    it('should save photos to storage and update the observable', async () => {
      const photos = [
        {
          filepath: 'img_txt_20261019_173534.png',
          photoInfo: {
            extractedText: 'some extracted text',
            createdAt: '2026-10-19T15:35:42.739Z',
            title: 'some title',
          },
        },
      ];
      service['photos'] = photos;

      await service.cachePhotos();

      expect(storageSpy.set).toHaveBeenCalledWith(
        service['PHOTO_STORAGE'],
        JSON.stringify(photos),
      );
      service['photosSubject'].subscribe((cachedPhotos) => {
        expect(cachedPhotos).toEqual(photos);
      });
    });

    it('should log error if saving to storage fails', async () => {
      const error = new Error('Failed to save');
      storageSpy.set.and.returnValue(Promise.reject(error));
      spyOn(console, 'error');

      try {
        await service.cachePhotos();
      } catch (e) {
        expect(e).toBe(error);
        expect(console.error).toHaveBeenCalledWith(
          'Error saving photos to storage:',
          error,
        );
      }
    });
  });

  describe('loadSavedPhotos', () => {
    let getPhotosFromCacheSpy: jasmine.Spy;
    let photosSubjectSpy: jasmine.Spy;
    let checkWebviewPathOfphotosSpy: jasmine.Spy;

    beforeEach(() => {
      getPhotosFromCacheSpy = spyOn(service, 'getPhotosFromCache').and.stub();
      photosSubjectSpy = spyOn(
        service['photosSubject'],
        'next',
      ).and.callThrough();
      checkWebviewPathOfphotosSpy = spyOn(
        service as any,
        'checkWebviewPathOfphotos',
      ).and.callThrough();
      service['photos'] = photos.slice();
    });

    afterEach(() => {
      getPhotosFromCacheSpy.calls.reset();
      photosSubjectSpy.calls.reset();
      checkWebviewPathOfphotosSpy.calls.reset();
    });

    it('should load photos without errors on mobile app', async () => {
      isNativePlattformSpy.and.returnValue(true);
      await service.loadSavedPhotos();

      expect(getPhotosFromCacheSpy).toHaveBeenCalled();
      expect(photosSubjectSpy).not.toHaveBeenCalled();
    });

    it('should load photos without errors on web app', async () => {
      isNativePlattformSpy.and.returnValue(false);
      await service.loadSavedPhotos();

      expect(getPhotosFromCacheSpy).toHaveBeenCalled();
      expect(photosSubjectSpy).toHaveBeenCalled();
      service['photosSubject'].subscribe((photos) => {
        expect(photos).toEqual(service['photos']);
      });
    });

    it('should log warining if webviewpath is a blob URL that starts with blob on web app', async () => {
      isNativePlattformSpy.and.returnValue(false);
      spyOn(console, 'warn');
      service['photos'][0].webviewPath = 'blob:http://example.com/123';

      await service.loadSavedPhotos();

      expect(console.warn).toHaveBeenCalledWith(
        'Blob URL not persistent; image not available after reload',
        'blob:http://example.com/123',
      );

      expect(getPhotosFromCacheSpy).toHaveBeenCalled();
      expect(photosSubjectSpy).toHaveBeenCalled();
      service['photosSubject'].subscribe((photos) => {
        expect(photos).toEqual(service['photos']);
      });
    });

    it('should not check webviewpath on mobile app', async () => {
      isNativePlattformSpy.and.returnValue(true);
      await service.loadSavedPhotos();

      expect(getPhotosFromCacheSpy).toHaveBeenCalled();
      expect(checkWebviewPathOfphotosSpy)
        .withContext('mobile app')
        .not.toHaveBeenCalled();
    });

    it('should check webviewpath on web app', async () => {
      isNativePlattformSpy.and.returnValue(false);
      await service.loadSavedPhotos();

      expect(getPhotosFromCacheSpy).toHaveBeenCalled();
      expect(checkWebviewPathOfphotosSpy)
        .withContext('web app')
        .toHaveBeenCalled();
    });

    it('should not warn on web app if webviewpath is an object', async () => {
      isNativePlattformSpy.and.returnValue(false);
      (service['photos'][0] as any).webviewPath = {
        'blob:': 'hello',
        type: 'text/plain',
      };
      spyOn(console, 'warn');
      await service.loadSavedPhotos();

      expect(getPhotosFromCacheSpy).toHaveBeenCalled();
      expect(checkWebviewPathOfphotosSpy)
        .withContext('web app')
        .toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should log an error and show a toast if loading photos fails', () => {
      const testCases = [
        {
          CaseNumber: 1,
          isNativePlatform: false,
        },
        {
          CaseNumber: 2,
          isNativePlatform: true,
        },
      ];
      spyOn(console, 'error');

      testCases.forEach(async ({ CaseNumber, isNativePlatform }) => {
        isNativePlattformSpy.and.returnValue(isNativePlatform);
        getPhotosFromCacheSpy.and.throwError('Failed to load photos');

        await service.loadSavedPhotos();

        expect(console.error)
          .withContext(`Case ${CaseNumber}`)
          .toHaveBeenCalledWith(
            'photo.webviewPath is not available or invalid',
            'Failed to load photos',
          );
        expect(toastServiceSpy.showToast)
          .withContext(`Case ${CaseNumber}`)
          .toHaveBeenCalledWith('TOAST.ERROR_LOADING_PHOTOS');
      });
    });
  });

  describe('deleteAllPhotos', () => {
    beforeEach(() => {
      service['photos'] = photos.slice();
    });

    it('should delete all photos if permitted', async () => {
      const photosToDelete = [...service['photos']];
      spyOn(service as any, 'checkFilesystemPermission').and.returnValue(
        Promise.resolve(true),
      );
      const originalDeletePhoto = service.deletePhoto.bind(service);
      const deletePhotoSpy = spyOn(service as any, 'deletePhoto').and.callFake(
        async (photo: any) => originalDeletePhoto(photo),
      );
      (filesystemSpy as any).deleteFile.and.resolveTo();

      const result = await service.deleteAllPhotos();

      expect(deletePhotoSpy).toHaveBeenCalledTimes(photosToDelete.length);
      expect(deletePhotoSpy.calls.allArgs()).toEqual(
        photosToDelete.map((photo) => [photo]),
      );
      expect(service['photos']).toEqual([]);
      expect(result).toBeTrue();
    });

    it('should not delete any photos and show info if not permitted', async () => {
      spyOn(service as any, 'checkFilesystemPermission').and.returnValue(
        Promise.resolve(false),
      );
      spyOn(console, 'warn');
      const photosToDelete = [...service['photos']];
      const deletePhotoSpy = spyOn(
        service as any,
        'deletePhoto',
      ).and.resolveTo();

      const result = await service.deleteAllPhotos();

      expect(console.warn).toHaveBeenCalledWith(
        'Storage permission not granted, skipping file deletion',
      );
      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();
      expect(deletePhotoSpy).not.toHaveBeenCalled();
      expect(service['photos']).toEqual(photosToDelete);
      expect(result).toBeFalse();
    });
  });

  describe('deletePhoto', () => {
    beforeEach(() => {
      service['photos'] = photos.slice();
    });

    it('should delete a single photo if permitted', async () => {
      const photo = service['photos'][0];
      (filesystemSpy as any).deleteFile.and.resolveTo();
      spyOn(service as any, 'checkFilesystemPermission').and.returnValue(
        Promise.resolve(true),
      );
      const cachePhotosSpy = spyOn(
        service as any,
        'cachePhotos',
      ).and.resolveTo();
      filePathServiceSpy.getFilenameFromFilepath.and.callThrough();

      const result = await service['deletePhoto'](photo);

      expect(service['photos']).not.toContain(photo);
      expect(cachePhotosSpy).toHaveBeenCalled();
      expect(result).toBeTrue();
    });

    it('should not delete a single photo and show info if not permitted', async () => {
      const photo = service['photos'][0];
      (filesystemSpy as any).deleteFile.and.resolveTo();
      spyOn(service as any, 'checkFilesystemPermission').and.returnValue(
        Promise.resolve(false),
      );
      const cachePhotosSpy = spyOn(
        service as any,
        'cachePhotos',
      ).and.resolveTo();
      filePathServiceSpy.getFilenameFromFilepath.and.callThrough();
      spyOn(console, 'warn');

      const result = await service['deletePhoto'](photo);

      expect(console.warn).toHaveBeenCalledWith(
        'Storage permission not granted, skipping file deletion',
      );
      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();
      expect(cachePhotosSpy).not.toHaveBeenCalled();
      expect(service['photos']).toContain(photo);
      expect(result).toBeFalse();
    });

    it('should log and throw error if deletion fails', async () => {
      const photo = service['photos'][0];
      (filesystemSpy as any).deleteFile.and.rejectWith(
        new Error('Deletion failed'),
      );
      spyOn(service as any, 'checkFilesystemPermission').and.returnValue(
        Promise.resolve(true),
      );
      spyOn(console, 'error');

      await expectAsync(service['deletePhoto'](photo)).toBeRejectedWithError(
        'Deletion failed',
      );
      expect(console.error).toHaveBeenCalledWith(
        'Error deleting photo:',
        jasmine.any(Error),
      );
    });
  });

  describe('savePhoto', () => {
    beforeEach(() => {
      service['photos'] = photos.slice();
    });

    it('should save a photo if permitted on web', async () => {
      isNativePlattformSpy.and.returnValue(false);
      const photo = service['photos'][0];
      const savedFile = { uri: 'file:///Documents/generated-photo.jpg' };
      const savedDataUrl = 'data:image/jpeg;base64,AAAA';

      filePathServiceSpy.getFileName.and.returnValue('generated-photo.jpg');
      (filesystemSpy as any).writeFile.and.resolveTo(savedFile);
      (filesystemSpy as any).readFile.and.resolveTo({ data: 'base64-data' });
      fileConversionServiceSpy.blobToBase64.and.resolveTo('base64-data');
      fileConversionServiceSpy.blobToDataUrl.and.resolveTo(savedDataUrl);
      spyOn(
        service as any,
        'checkAndRequestFilesystemPermission',
      ).and.returnValue(Promise.resolve(true));
      spyOn(window, 'fetch').and.resolveTo({
        blob: () => Promise.resolve(new Blob(['x'])),
      } as Response);

      const result = await service['savePhoto'](photo as any);

      expect(filePathServiceSpy.getFileName).toHaveBeenCalled();
      expect(service['photos'][0]).toEqual(
        jasmine.objectContaining({
          filepath: 'generated-photo.jpg',
          webviewPath: savedDataUrl,
        }),
      );
      expect(result).toEqual(
        jasmine.objectContaining({
          filepath: 'generated-photo.jpg',
          webviewPath: savedDataUrl,
        }),
      );
    });

    it('should save a photo if permitted on mobile', async () => {
      isNativePlattformSpy.and.returnValue(true);
      const photo = service['photos'][0];
      const savedFile = { uri: 'file:///Documents/generated-photo.jpg' };

      filePathServiceSpy.getFileName.and.returnValue('generated-photo.jpg');
      (filesystemSpy as any).writeFile.and.resolveTo(savedFile);
      (filesystemSpy as any).readFile.and.resolveTo({ data: 'base64-data' });
      spyOn(
        service as any,
        'checkAndRequestFilesystemPermission',
      ).and.returnValue(Promise.resolve(true));

      const result = await service['savePhoto'](photo as any);

      expect(filePathServiceSpy.getFileName).toHaveBeenCalled();
      expect(service['photos'][0]).toEqual(
        jasmine.objectContaining({
          filepath: 'file:///Documents/generated-photo.jpg',
          webviewPath: 'file:///Documents/generated-photo.jpg',
        }),
      );
      expect(result).toEqual(
        jasmine.objectContaining({
          filepath: 'file:///Documents/generated-photo.jpg',
          webviewPath: 'file:///Documents/generated-photo.jpg',
        }),
      );
    });

    it('should not save a photo and show info if not permitted', async () => {
      const photo = { filepath: 'path/to/photo.jpg' } as any;
      (filesystemSpy as any).writeFile.and.resolveTo();
      spyOn(
        service as any,
        'checkAndRequestFilesystemPermission',
      ).and.returnValue(Promise.resolve(false));

      await expectAsync(service['savePhoto'](photo)).toBeRejectedWithError(
        'Storage permission denied',
      );

      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();
      expect(service['photos']).not.toContain(photo);
    });
  });

  describe('checkFilesystemPermission', () => {
    it('should return true on web', async () => {
      isNativePlattformSpy.and.returnValue(false);

      const result = await service['checkFilesystemPermission']();
      expect(result).toBeTrue();
    });

    it('should return true if permission is granted on mobile', async () => {
      isNativePlattformSpy.and.returnValue(true);
      (filesystemSpy as any).checkPermissions.and.resolveTo({
        publicStorage: 'granted',
      });

      const result = await service['checkFilesystemPermission']();
      expect(result).toBeTrue();
    });

    it('should return false if permission is denied on mobile', async () => {
      isNativePlattformSpy.and.returnValue(true);
      (filesystemSpy as any).checkPermissions.and.resolveTo({
        publicStorage: 'denied',
      });

      const result = await service['checkFilesystemPermission']();
      expect(result).toBeFalse();
    });

    it('should log warning and return true if permissions check fails on mobile', async () => {
      isNativePlattformSpy.and.returnValue(true);
      (filesystemSpy as any).checkPermissions.and.rejectWith(
        new Error('Check failed'),
      );
      spyOn(console, 'warn');

      const result = await service['checkFilesystemPermission']();

      expect(result).toBeTrue();
      expect(console.warn).toHaveBeenCalledWith(
        'Permission check failed, continuing anyway:',
        jasmine.any(Error),
      );
    });
  });

  describe('checkAndRequestFilesystemPermission', () => {
    it('should return true on web', async () => {
      isNativePlattformSpy.and.returnValue(false);

      const result = await service['checkAndRequestFilesystemPermission']();
      expect(result).toBeTrue();
    });

    it('should return true if permission is granted on mobile', async () => {
      isNativePlattformSpy.and.returnValue(true);
      (filesystemSpy as any).checkPermissions.and.resolveTo({
        publicStorage: 'granted',
      });

      const result = await service['checkAndRequestFilesystemPermission']();
      expect(result).toBeTrue();
    });

    it('should return true if missing permission is granted on request on mobile', async () => {
      isNativePlattformSpy.and.returnValue(true);
      (filesystemSpy as any).checkPermissions.and.resolveTo({
        publicStorage: 'denied',
      });
      (filesystemSpy as any).requestPermissions.and.resolveTo({
        publicStorage: 'granted',
      });

      const result = await service['checkAndRequestFilesystemPermission']();
      expect(result).toBeTrue();
    });

    it('should log error and show info if requested missing permission is denied on mobile', async () => {
      isNativePlattformSpy.and.returnValue(true);
      (filesystemSpy as any).checkPermissions.and.resolveTo({
        publicStorage: 'denied',
      });
      (filesystemSpy as any).requestPermissions.and.resolveTo({
        publicStorage: 'denied',
      });
      alertServiceSpy.showStoragePermissionError.and.callThrough();
      const consoleErrorSpy = spyOn(console, 'error');

      const result = await service['checkAndRequestFilesystemPermission']();
      expect(result).toBeFalse();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Storage permission denied by user',
      );
      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();
    });

    it('should log warning and return true if permissions check fails on mobile', async () => {
      isNativePlattformSpy.and.returnValue(true);
      (filesystemSpy as any).checkPermissions.and.rejectWith(
        new Error('Check failed'),
      );
      spyOn(console, 'warn');

      const result = await service['checkAndRequestFilesystemPermission']();

      expect(result).toBeTrue();
      expect(console.warn).toHaveBeenCalledWith(
        'Permission check failed, continuing anyway:',
        jasmine.any(Error),
      );
    });
  });

  describe('saveFile', () => {
    beforeEach(() => {
      (filesystemSpy as any).writeFile.calls.reset();
      alertServiceSpy.showStoragePermissionError.calls.reset();
    });

    it('should create a download link for the file on web', async () => {
      isNativePlattformSpy.and.returnValue(false);
      const blob = new Blob(['hello'], { type: 'text/plain' });
      fileConversionServiceSpy.base64ToBlob.and.returnValue(blob);
      const createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue(
        'blob:download-url',
      );
      const revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
      const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');

      await expectAsync(
        (service as any).saveFile('test.png', 'data:image/png;base64,'),
      ).toBeResolved();

      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:download-url');
    });

    it('should save the file on mobile if permissions are granted', async () => {
      isNativePlattformSpy.and.returnValue(true);
      spyOn(
        service as any,
        'checkAndRequestFilesystemPermission',
      ).and.returnValue(Promise.resolve(true));
      (filesystemSpy as any).writeFile.and.resolveTo();

      await expectAsync(
        (service as any).saveFile('test.png', 'data:image/png;base64,'),
      ).toBeResolved();
      expect(
        (service as any)['checkAndRequestFilesystemPermission'],
      ).toHaveBeenCalled();
      expect((filesystemSpy as any).writeFile).toHaveBeenCalled();
    });

    it('should not save the file, show notification and throw error on mobile if permissions are denied', async () => {
      isNativePlattformSpy.and.returnValue(true);
      spyOn(
        service as any,
        'checkAndRequestFilesystemPermission',
      ).and.returnValue(Promise.resolve(false));
      alertServiceSpy.showStoragePermissionError.and.stub();

      await expectAsync(
        (service as any).saveFile('test.png', 'data:image/png;base64,'),
      ).toBeRejectedWithError('Storage permission denied');

      expect(
        (service as any)['checkAndRequestFilesystemPermission'],
      ).toHaveBeenCalled();
      expect((filesystemSpy as any).writeFile).not.toHaveBeenCalled();
      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();
    });

    it('should log error and show notification on mobile if saving fails', async () => {
      isNativePlattformSpy.and.returnValue(true);
      spyOn(
        service as any,
        'checkAndRequestFilesystemPermission',
      ).and.returnValue(Promise.resolve(true));
      (filesystemSpy as any).writeFile.and.rejectWith(
        new Error('Write failed'),
      );
      spyOn(console, 'error');
      alertServiceSpy.showStoragePermissionError.and.stub();

      await expectAsync(
        (service as any).saveFile('test.png', 'data:image/png;base64,'),
      ).toBeResolved();

      expect(console.error).toHaveBeenCalledWith(
        'Error saving file:',
        jasmine.any(Error),
      );
      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();
    });
  });

  describe('downloadFile', () => {
    it('should return true if download and save succeed', async () => {
      spyOn(
        service as any,
        'checkAndRequestFilesystemPermission',
      ).and.returnValue(Promise.resolve(true));
      fileConversionServiceSpy.blobToBase64.and.resolveTo('base64-data');
      spyOn(window, 'fetch').and.resolveTo({
        blob: () => Promise.resolve(new Blob(['x'])),
      } as Response);
      spyOn(service, 'saveFile').and.returnValue(Promise.resolve());
      (service as any).fileName = 'file.png';

      const result = await service.downloadFile('http://example.com/file.png');

      expect(result).toBeTrue();
      expect(fileConversionServiceSpy.blobToBase64).toHaveBeenCalled();
      expect(service.saveFile).toHaveBeenCalledWith('file.png', 'base64-data');
    });

    it('logs error and shows a toast and return false if downloadlink is invalid', async () => {
      spyOn(console, 'error');

      const result = await service.downloadFile('');

      expect(result).toBeFalse();
      expect(console.error).toHaveBeenCalledWith(
        "File URL '' is not available",
      );
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'FEATURE.TOAST.ERROR_MISSING_DOWNLOAD_URL',
        ToastAnchor.MainPage,
      );
    });

    it('should return false and do not save if not permitted', async () => {
      spyOn(console, 'error');
      spyOn(
        service as any,
        'checkAndRequestFilesystemPermission',
      ).and.returnValue(Promise.resolve(false));

      const result = await service.downloadFile('http://example.com/file.png');

      expect(result).toBeFalse();
      expect(console.error).not.toHaveBeenCalled();
      expect((filesystemSpy as any).writeFile).not.toHaveBeenCalled();
    });

    it('should log error and show a toast if download fails', async () => {
      spyOn(console, 'error');
      spyOn(
        service as any,
        'checkAndRequestFilesystemPermission',
      ).and.returnValue(Promise.resolve(true));
      (filesystemSpy as any).writeFile.and.rejectWith(
        new Error('Write failed'),
      );

      const result = await service.downloadFile('http://example.com/file.png');

      expect(result).toBeFalse();
      expect(console.error).toHaveBeenCalledWith(
        'Error saving file in downloadFile:',
        jasmine.any(Error),
      );
      expect(alertServiceSpy.showStoragePermissionError).toHaveBeenCalled();
    });
  });
});
