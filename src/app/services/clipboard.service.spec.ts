import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { createTranslateServiceMock } from '../testing/translate-service.mock';
import { ClipboardService } from './clipboard.service';
import { PhotoStorageService } from './photo-storage.service';

describe('ClipboardService', () => {
  let service: ClipboardService;
  let photoStorageServiceSpy: jasmine.SpyObj<PhotoStorageService>;

  beforeEach(() => {
    photoStorageServiceSpy = jasmine.createSpyObj('PhotoStorageService', [
      'savePhoto',
      'loadSavedPhotos',
      'cachePhotos',
      'getPhotosFromCache',
      'deleteAllPhotos',
      'deletePhoto',
      'saveFile',
      'downloadFile',
      'updatePhotoInfo',
      'getNoExtractedTextInfo',
      'getNextPhoto',
      'getPreviousPhoto',
    ]);

    const modalControllerSpy = jasmine.createSpyObj('ModalController', [
      'dismiss',
      'create',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ClipboardService,
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: PhotoStorageService, useValue: photoStorageServiceSpy },
      ],
    });

    service = TestBed.inject(ClipboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
