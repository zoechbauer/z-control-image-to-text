import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { ImageResizeEngineService } from './image-resize-engine.service';
import { PhotoStorageService } from './photo-storage.service';
import { UserPhoto } from '../shared/app.interfaces';
import { FileConversionService } from './file-conversion.service';

describe('ImageResizeEngineService', () => {
  let service: ImageResizeEngineService;
  let photosSubject: BehaviorSubject<UserPhoto[]>;
  let photoStorageServiceSpy: jasmine.SpyObj<PhotoStorageService>;
  let fileConversionServiceSpy: jasmine.SpyObj<FileConversionService>;

  beforeEach(() => {
    photosSubject = new BehaviorSubject<UserPhoto[]>([]);
    fileConversionServiceSpy = jasmine.createSpyObj<FileConversionService>(
      'FileConversionService',
      [
        'blobToDataUrl',
        'blobToBase64',
        'base64ToBlob',
        'getImageDataUrl',
        'dataUrlToBlobSync',
      ],
    );
    photoStorageServiceSpy = jasmine.createSpyObj<PhotoStorageService>(
      'PhotoStorageService',
      ['savePhoto', 'cachePhotos', 'deleteAllPhotos', 'deletePhoto'],
      { photos$: photosSubject.asObservable() },
    );

    TestBed.configureTestingModule({
      providers: [
        ImageResizeEngineService,
        { provide: PhotoStorageService, useValue: photoStorageServiceSpy },
        { provide: FileConversionService, useValue: fileConversionServiceSpy },
      ],
    });

    service = TestBed.inject(ImageResizeEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
