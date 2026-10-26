import { TestBed } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';

import { createTranslateServiceMock } from '../testing/translate-service.mock';
import { ClipboardService } from './clipboard.service';
import { PhotoStorageService } from './photo-storage.service';
import {
  CopyDataOptions,
  TextStatistics,
  UserPhoto,
} from '../shared/app.interfaces';
import { ToastService } from './toast.service';
import { FileConversionService } from './file-conversion.service';
import { UtilsService } from './utils.service';
import { FilePathService } from './file-path.service';

describe('ClipboardService', () => {
  let service: ClipboardService;
  let photoStorageServiceSpy: jasmine.SpyObj<PhotoStorageService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let fileConversionServiceSpy: jasmine.SpyObj<FileConversionService>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;
  let filePathServiceSpy: jasmine.SpyObj<FilePathService>;
  let isNativePlatformSpy: jasmine.Spy;
  let photo: UserPhoto;
  let textStatistics: TextStatistics;
  let options: CopyDataOptions;

  beforeEach(() => {
    toastServiceSpy = jasmine.createSpyObj('toastService', ['showToast']);

    fileConversionServiceSpy = jasmine.createSpyObj('fileConversionService', [
      'getImageDataUrl',
      'dataUrlToBlobSync',
    ]);

    utilsServiceSpy = jasmine.createSpyObj('UtilsService', [
      'formatDateTimeISO',
    ]);

    filePathServiceSpy = jasmine.createSpyObj('FilePathService', [
      'getFilenameFromFilepath',
    ]);

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

    isNativePlatformSpy = spyOn(Capacitor, 'isNativePlatform').and.returnValue(
      false,
    );

    TestBed.configureTestingModule({
      providers: [
        ClipboardService,
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: FileConversionService, useValue: fileConversionServiceSpy },
        { provide: PhotoStorageService, useValue: photoStorageServiceSpy },
        { provide: UtilsService, useValue: utilsServiceSpy },
        { provide: FilePathService, useValue: filePathServiceSpy },
      ],
    });

    service = TestBed.inject(ClipboardService);

    photo = {
      id: '1',
      filepath: 'file:///path/to/photo',
      webviewPath: 'path/to/photo',
      photoInfo: {
        extractedText: 'Some extracted text',
      },
    } as any as UserPhoto;
    textStatistics = {} as TextStatistics;
    options = { copyExtractedText: true, copyPhoto: false } as CopyDataOptions;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('copyDataToClipboard', () => {
    let copyImageAndTextWebSpy: jasmine.Spy;
    let shareImageAndTextNativeSpy: jasmine.Spy;
    let areTextOptionsSelectedSpy: jasmine.Spy;
    let isPhotoOptionSelectedSpy: jasmine.Spy;

    beforeEach(() => {
      copyImageAndTextWebSpy = spyOn(
        service as any,
        'copyImageAndTextWeb',
      ).and.stub();
      shareImageAndTextNativeSpy = spyOn(
        service as any,
        'shareImageAndTextNative',
      ).and.stub();
      areTextOptionsSelectedSpy = spyOn(
        service as any,
        'areTextOptionsSelected',
      ).and.returnValue(true);
      isPhotoOptionSelectedSpy = spyOn(
        service as any,
        'isPhotoOptionSelected',
      ).and.returnValue(false);
    });

    it('should copy data to clipboard on web', async () => {
      isNativePlatformSpy.and.returnValue(false);

      await service.copyDataToClipboard(photo, textStatistics, options);

      expect(copyImageAndTextWebSpy).toHaveBeenCalledWith(
        photo,
        textStatistics,
        options,
      );
      expect(shareImageAndTextNativeSpy).not.toHaveBeenCalled();
    });

    it('should copy data to clipboard on mobile', async () => {
      isNativePlatformSpy.and.returnValue(true);

      await service.copyDataToClipboard(photo, textStatistics, options);

      expect(shareImageAndTextNativeSpy).toHaveBeenCalledWith(
        photo,
        textStatistics,
        options,
      );
      expect(copyImageAndTextWebSpy).not.toHaveBeenCalled();
    });

    it('should not copy data if no options are selected', async () => {
      areTextOptionsSelectedSpy.and.returnValue(false);
      isPhotoOptionSelectedSpy.and.returnValue(false);

      await service.copyDataToClipboard(photo, textStatistics, options);

      expect(copyImageAndTextWebSpy).not.toHaveBeenCalled();
      expect(shareImageAndTextNativeSpy).not.toHaveBeenCalled();
    });
  });

  describe('shareImageAndTextNative', () => {
    let areTextOptionsSelectedSpy: jasmine.Spy;
    let isPhotoOptionSelectedSpy: jasmine.Spy;
    let shareSpy: jasmine.Spy;

    beforeEach(() => {
      areTextOptionsSelectedSpy = spyOn(
        service as any,
        'areTextOptionsSelected',
      );
      isPhotoOptionSelectedSpy = spyOn(service as any, 'isPhotoOptionSelected');
      if (typeof (navigator as any).share === 'function') {
        shareSpy = spyOn(navigator as any, 'share').and.resolveTo(undefined);
      } else {
        shareSpy = jasmine.createSpy('share').and.resolveTo(undefined);
        Object.defineProperty(navigator, 'share', {
          configurable: true,
          writable: true,
          value: shareSpy,
        });
      }
    });

    it('should share image and text on mobile app', async () => {
      isNativePlatformSpy.and.returnValue(true);
      areTextOptionsSelectedSpy.and.returnValue(true);
      isPhotoOptionSelectedSpy.and.returnValue(true);
      const copyTextContentSpy = spyOn(
        service as any,
        'copyTextContent',
      ).and.stub();
      const options = { copyAll: true } as CopyDataOptions;

      await (service as any).shareImageAndTextNative(
        photo,
        textStatistics,
        options,
      );

      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'FEATURE.TOAST.SUCCESS_DATA_SHARED',
      );
      expect(copyTextContentSpy).toHaveBeenCalledWith(
        photo,
        textStatistics,
        options,
      );
      expect(shareSpy).toHaveBeenCalled();
    });

    it('should only share the selected options on mobile app', async () => {
      const testCases = [
        {
          CaseNo: 1,
          photoOptionsSelected: true,
          textOptionsSelected: true,
          expectedShareData: {
            title: 'z-control Image to Text',
            text: 'Copied Text',
            url: photo.filepath?.startsWith('file://')
              ? photo.filepath
              : undefined,
          },
        },
        {
          CaseNo: 2,
          photoOptionsSelected: false,
          textOptionsSelected: true,
          expectedShareData: {
            title: 'z-control Image to Text',
            text: 'Copied Text',
          },
        },
        {
          CaseNo: 3,
          photoOptionsSelected: true,
          textOptionsSelected: false,
          expectedShareData: {
            title: 'z-control Image to Text',
            url: photo.filepath?.startsWith('file://')
              ? photo.filepath
              : undefined,
          },
        },
      ];

      spyOn(service as any, 'copyTextContent').and.returnValue('Copied Text');
      const options = { copyExtractedText: true } as CopyDataOptions;

      for (const testCase of testCases) {
        shareSpy.calls.reset();
        isNativePlatformSpy.and.returnValue(true);
        areTextOptionsSelectedSpy.and.returnValue(testCase.textOptionsSelected);
        isPhotoOptionSelectedSpy.and.returnValue(testCase.photoOptionsSelected);

        await (service as any).shareImageAndTextNative(
          photo,
          textStatistics,
          options,
        );

        expect(shareSpy)
          .withContext(`Case No: ${testCase.CaseNo}`)
          .toHaveBeenCalled();
        const sharedData = shareSpy.calls.mostRecent().args[0];
        expect(sharedData)
          .withContext(`Case No: ${testCase.CaseNo}`)
          .toEqual(jasmine.objectContaining(testCase.expectedShareData));
      }
    });

    it('should not share image and text if no options are selected on mobile app', async () => {
      isNativePlatformSpy.and.returnValue(true);
      areTextOptionsSelectedSpy.and.returnValue(false);
      isPhotoOptionSelectedSpy.and.returnValue(false);
      const copyTextContentSpy = spyOn(
        service as any,
        'copyTextContent',
      ).and.stub();
      const options = { copyAll: true } as CopyDataOptions;

      await (service as any).shareImageAndTextNative(
        photo,
        textStatistics,
        options,
      );

      expect(toastServiceSpy.showToast).not.toHaveBeenCalled();
      expect(copyTextContentSpy).not.toHaveBeenCalled();
      expect(shareSpy).not.toHaveBeenCalled();
    });

    it('should not share image and console error and show Toast if photo has no filepath on mobile app', async () => {
      isNativePlatformSpy.and.returnValue(true);
      isPhotoOptionSelectedSpy.and.returnValue(true);
      const copyTextContentSpy = spyOn(
        service as any,
        'copyTextContent',
      ).and.stub();
      const options = { copyAll: true } as CopyDataOptions;
      const photo = {
        filepath: '',
        photoInfo: {
          title: 'Test Photo',
        },
      } as UserPhoto;

      await (service as any).shareImageAndTextNative(
        photo,
        textStatistics,
        options,
      );

      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'FEATURE.TOAST.IMAGE_SHARE_NO_FILEPATH',
      );
      expect(copyTextContentSpy).not.toHaveBeenCalled();
      expect(shareSpy).not.toHaveBeenCalled();
    });

    it('should log error and show toast if sharing fails on mobile app', async () => {
      isNativePlatformSpy.and.returnValue(true);
      isPhotoOptionSelectedSpy.and.returnValue(true);
      areTextOptionsSelectedSpy.and.returnValue(true);
      const options = { copyAll: true } as CopyDataOptions;
      const error = new Error('Sharing failed');
      shareSpy.and.throwError(error);
      spyOn(console, 'error').and.stub();

      await (service as any).shareImageAndTextNative(
        photo,
        textStatistics,
        options,
      );

      expect(console.error).toHaveBeenCalledWith('Share failed', error);
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'FEATURE.TOAST.IMAGE_SHARE_NOT_SUPPORTED',
      );
    });
  });

  describe('copyImageAndTextWeb', () => {
    let areTextOptionsSelectedSpy: jasmine.Spy;
    let isPhotoOptionSelectedSpy: jasmine.Spy;
    let navigatorClipboardWriteSpy: jasmine.Spy;

    beforeEach(() => {
      areTextOptionsSelectedSpy = spyOn(
        service as any,
        'areTextOptionsSelected',
      );
      isPhotoOptionSelectedSpy = spyOn(service as any, 'isPhotoOptionSelected');
      if (!(navigator as any).clipboard) {
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          writable: true,
          value: {
            write: () => Promise.resolve(),
          },
        });
      }
      navigatorClipboardWriteSpy = spyOn(
        navigator.clipboard,
        'write',
      ).and.resolveTo(undefined);
      fileConversionServiceSpy.getImageDataUrl.and.resolveTo(
        'data:image/png;base64,aGVsbG8=',
      );
      fileConversionServiceSpy.dataUrlToBlobSync.and.returnValue(
        new Blob(['hello'], { type: 'image/png' }),
      );
    });

    it('should copy image and text on web app', async () => {
      isNativePlatformSpy.and.returnValue(false);
      areTextOptionsSelectedSpy.and.returnValue(true);
      isPhotoOptionSelectedSpy.and.returnValue(true);
      const copyTextContentSpy = spyOn(
        service as any,
        'copyTextContent',
      ).and.returnValue('Copied Text');
      const options = { copyAll: true } as CopyDataOptions;

      await (service as any).copyImageAndTextWeb(
        photo,
        textStatistics,
        options,
      );

      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'FEATURE.TOAST.SUCCESS_DATA_COPIED',
      );
      expect(copyTextContentSpy).toHaveBeenCalledWith(
        photo,
        textStatistics,
        options,
      );
      expect(navigatorClipboardWriteSpy).toHaveBeenCalled();
      expect(fileConversionServiceSpy.getImageDataUrl).toHaveBeenCalledWith(
        photo,
      );
      expect(fileConversionServiceSpy.dataUrlToBlobSync).toHaveBeenCalledWith(
        'data:image/png;base64,aGVsbG8=',
      );
    });

    it('should only copy the selected options on web app', async () => {
      const testCases = [
        {
          CaseNo: 1,
          photoOptionsSelected: true,
          textOptionsSelected: true,
        },
        {
          CaseNo: 2,
          photoOptionsSelected: false,
          textOptionsSelected: true,
        },
        {
          CaseNo: 3,
          photoOptionsSelected: true,
          textOptionsSelected: false,
        },
      ];

      const copyTextContentSpy = spyOn(
        service as any,
        'copyTextContent',
      ).and.returnValue('Copied Text');
      const options = { copyExtractedText: true } as CopyDataOptions;

      for (const testCase of testCases) {
        navigatorClipboardWriteSpy.calls.reset();
        copyTextContentSpy.calls.reset();
        isNativePlatformSpy.and.returnValue(false);
        areTextOptionsSelectedSpy.and.returnValue(testCase.textOptionsSelected);
        isPhotoOptionSelectedSpy.and.returnValue(testCase.photoOptionsSelected);

        await (service as any).copyImageAndTextWeb(
          photo,
          textStatistics,
          options,
        );

        expect(navigatorClipboardWriteSpy)
          .withContext(`Case No: ${testCase.CaseNo}`)
          .toHaveBeenCalled();
        if (testCase.textOptionsSelected) {
          expect(copyTextContentSpy)
            .withContext(`Case No: ${testCase.CaseNo}`)
            .toHaveBeenCalledWith(photo, textStatistics, options);
        } else {
          expect(copyTextContentSpy)
            .withContext(`Case No: ${testCase.CaseNo}`)
            .not.toHaveBeenCalled();
          expect(fileConversionServiceSpy.dataUrlToBlobSync).toHaveBeenCalled();
        }
      }
    });

    it('should not copy image and text if no options are selected on web app', async () => {
      isNativePlatformSpy.and.returnValue(false);
      areTextOptionsSelectedSpy.and.returnValue(false);
      isPhotoOptionSelectedSpy.and.returnValue(false);
      const copyTextContentSpy = spyOn(
        service as any,
        'copyTextContent',
      ).and.stub();
      const options = { copyAll: true } as CopyDataOptions;

      await (service as any).copyImageAndTextWeb(
        photo,
        textStatistics,
        options,
      );

      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'FEATURE.TOAST.ERROR_COPYING_DATA',
      );
      expect(copyTextContentSpy).not.toHaveBeenCalled();
      expect(navigatorClipboardWriteSpy).not.toHaveBeenCalled();
      expect(fileConversionServiceSpy.dataUrlToBlobSync).not.toHaveBeenCalled();
    });

    it('should not copy image and console error and show Toast if photo has no data url on web app', async () => {
      isNativePlatformSpy.and.returnValue(false);
      isPhotoOptionSelectedSpy.and.returnValue(true);
      areTextOptionsSelectedSpy.and.returnValue(true);
      const copyTextContentSpy = spyOn(
        service as any,
        'copyTextContent',
      ).and.returnValue('Copied Text');
      fileConversionServiceSpy.getImageDataUrl.and.throwError(
        'Image retrieval failed',
      );
      const options = { copyAll: true } as CopyDataOptions;
      const photo = {
        filepath: '',
        photoInfo: {
          title: 'Test Photo',
        },
      } as UserPhoto;

      await (service as any).copyImageAndTextWeb(
        photo,
        textStatistics,
        options,
      );

      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'FEATURE.TOAST.ERROR_COPYING_DATA',
      );
      expect(copyTextContentSpy).not.toHaveBeenCalled();
      expect(navigatorClipboardWriteSpy).not.toHaveBeenCalled();
    });

    it('should log error and show toast if copying fails on web app while copying image and text', async () => {
      isNativePlatformSpy.and.returnValue(false);
      isPhotoOptionSelectedSpy.and.returnValue(true);
      areTextOptionsSelectedSpy.and.returnValue(true);
      const options = { copyAll: true } as CopyDataOptions;
      const error = new Error('Copying failed');
      navigatorClipboardWriteSpy.and.throwError(error);
      spyOn(console, 'error').and.stub();

      await (service as any).copyImageAndTextWeb(
        photo,
        textStatistics,
        options,
      );

      expect(console.error).toHaveBeenCalledWith(
        'Failed to copy data to clipboard',
        jasmine.any(Error),
      );
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'FEATURE.TOAST.ERROR_COPYING_DATA',
      );
    });

    it('should log error and show toast if user is not allowed on web app', async () => {
      isNativePlatformSpy.and.returnValue(false);
      isPhotoOptionSelectedSpy.and.returnValue(true);
      areTextOptionsSelectedSpy.and.returnValue(true);
      const blob = new Blob(['hello'], { type: 'text/plain' });
      fileConversionServiceSpy.dataUrlToBlobSync.and.returnValue(blob);
      fileConversionServiceSpy.getImageDataUrl.and.resolveTo(
        'data:image/png;base64,aGVsbG8=',
      );
      const options = { copyAll: true } as CopyDataOptions;
      navigatorClipboardWriteSpy.and.rejectWith(new Error('NotAllowedError'));
      spyOn(console, 'error').and.stub();

      await (service as any).copyImageAndTextWeb(
        photo,
        textStatistics,
        options,
      );

      expect(console.error).toHaveBeenCalledWith(
        'Failed to copy data to clipboard',
        jasmine.any(Error),
      );
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'FEATURE.TOAST.IMAGE_COPY_NOT_SUPPORTED_WEB',
      );
    });
  });

  describe('isPhotoOptionSelected', () => {
    const testCases = [
      { options: { copyPhoto: true }, expected: true },
      { options: { copyPhoto: false }, expected: false },
    ];
    it('should return true if copyPhoto is selected', () => {
      for (const testCase of testCases) {
        expect((service as any).isPhotoOptionSelected(testCase.options)).toBe(
          testCase.expected,
        );
      }
    });
  });

  describe('areTextOptionsSelected', () => {
    const testCases = [
      {
        caseNo: 1,
        copyDataObject: {
          copyPhoto: false,
          copyTitleDescription: false,
          copyExtractedText: false,
          copyTextStatistics: false,
          copyCreatedModifiedTimestamps: false,
          copyAll: false,
        },
        expected: false,
      },
      { caseNo: 2, copyDataObject: {}, expected: false },
      {
        caseNo: 3,
        copyDataObject: {
          copyPhoto: true,
          copyTitleDescription: true,
          copyExtractedText: true,
          copyTextStatistics: true,
          copyCreatedModifiedTimestamps: true,
          copyAll: true,
        },
        expected: true,
      },
      {
        caseNo: 4,
        copyDataObject: {
          copyPhoto: true,
          copyTitleDescription: false,
          copyExtractedText: false,
          copyTextStatistics: false,
          copyCreatedModifiedTimestamps: false,
          copyAll: false,
        },
        expected: true,
      },
      {
        caseNo: 5,
        copyDataObject: {
          copyTitleDescription: true,
        },
        expected: true,
      },
      {
        caseNo: 6,
        copyDataObject: {
          copyExtractedText: true,
        },
        expected: true,
      },
      {
        caseNo: 7,
        copyDataObject: {
          copyTextStatistics: true,
        },
        expected: true,
      },
      {
        caseNo: 8,
        copyDataObject: {
          copyCreatedModifiedTimestamps: true,
        },
        expected: true,
      },
      {
        caseNo: 9,
        copyDataObject: {
          copyAll: true,
        },
        expected: true,
      },
    ];
    it('should return true if at least one CopyDataObject is selected', () => {
      for (const testCase of testCases) {
        expect((service as any).areTextOptionsSelected(testCase.copyDataObject))
          .withContext(`caseNo: ${testCase.caseNo}`)
          .toBe(testCase.expected);
      }
    });
  });

  describe('copyTextContent', () => {
    beforeEach(() => {
      const getTitleDescriptionTextSpy = spyOn(
        service as any,
        'getTitleDescriptionText',
      ).and.returnValue('Title Description Text\n');
      const getExtractedTextSpy = spyOn(
        service as any,
        'getExtractedText',
      ).and.returnValue('Extracted Text\n');
      const getTextStatisticsSpy = spyOn(
        service as any,
        'getTextStatisticsText',
      ).and.returnValue('Text Statistics\n');
      const getTimestampsTextSpy = spyOn(
        service as any,
        'getTimestampsText',
      ).and.returnValue('Created Modified Timestamps\n');
      const getPhotoNameSpy = spyOn(
        service as any,
        'getPhotoName',
      ).and.returnValue('Photo Name\n');
    });

    const headerData =
      'z-control Image to Text\n' + 'FEATURE.COPY_DATA.TITLE' + '\n\n';

    const testCases = [
      {
        caseNo: 1,
        copyDataObject: {
          copyPhoto: false,
          copyTitleDescription: false,
          copyExtractedText: false,
          copyTextStatistics: false,
          copyCreatedModifiedTimestamps: false,
        },
        expectedData: headerData,
      },
      {
        caseNo: 2,
        copyDataObject: {
          copyPhoto: true,
          copyTitleDescription: false,
          copyExtractedText: false,
          copyTextStatistics: false,
          copyCreatedModifiedTimestamps: false,
        },
        expectedData: headerData + 'Photo Name\n',
      },
      {
        caseNo: 3,
        copyDataObject: {
          copyPhoto: false,
          copyTitleDescription: true,
          copyExtractedText: false,
          copyTextStatistics: false,
          copyCreatedModifiedTimestamps: false,
        },
        expectedData: headerData + 'Title Description Text\n',
      },
      {
        caseNo: 4,
        copyDataObject: {
          copyExtractedText: true,
          copyTitleDescription: true,
        },
        expectedData:
          headerData + 'Title Description Text\n' + 'Extracted Text\n',
      },
      {
        caseNo: 5,
        copyDataObject: {
          copyTextStatistics: true,
        },
        expectedData: headerData + 'Text Statistics\n',
      },
      {
        caseNo: 6,
        copyDataObject: {
          copyCreatedModifiedTimestamps: true,
        },
        expectedData: headerData + 'Created Modified Timestamps\n',
      },
      {
        caseNo: 7,
        copyDataObject: {
          copyPhoto: true,
          copyTitleDescription: true,
          copyExtractedText: true,
          copyTextStatistics: true,
          copyCreatedModifiedTimestamps: true,
        },
        expectedData:
          headerData +
          'Title Description Text\n' +
          'Extracted Text\n' +
          'Text Statistics\n' +
          'Created Modified Timestamps\n' +
          'Photo Name\n',
      },
    ];

    it('should add text info of selected options', () => {
      for (const testCase of testCases) {
        expect(
          (service as any).copyTextContent(
            photo,
            textStatistics,
            testCase.copyDataObject,
          ),
        )
          .withContext(`caseNo: ${testCase.caseNo}`)
          .toBe(testCase.expectedData);
      }
    });
  });

  describe('getTitleDescriptionText', () => {
    const headerLabel = 'FEATURE.COPY_DATA.TITLE_DESCRIPTION.HEADER';
    const titleLabel = 'FEATURE.COPY_DATA.TITLE_DESCRIPTION.TITLE';
    const descriptionLabel = 'FEATURE.COPY_DATA.TITLE_DESCRIPTION.DESCRIPTION';

    const testCases = [
      {
        caseNo: 1,
        photo: {
          photoInfo: {
            title: 'Title',
            description: 'Description',
            extractedText: 'Extracted Text',
          },
        } as any as UserPhoto,
        expectedPhotoInfo: { title: 'Title', description: 'Description' },
      },
      {
        caseNo: 2,
        photo: {
          photoInfo: {
            title: 'Title',
            extractedText: 'Extracted Text',
          },
        } as any as UserPhoto,
        expectedPhotoInfo: { title: 'Title', description: '' },
      },
      {
        caseNo: 3,
        photo: {
          photoInfo: {
            description: 'Description',
            extractedText: 'Extracted Text',
          },
        } as any as UserPhoto,
        expectedPhotoInfo: { title: '', description: 'Description' },
      },
      {
        caseNo: 4,
        photo: {
          photoInfo: {
            extractedText: 'Extracted Text',
          },
        } as any as UserPhoto,
        expectedPhotoInfo: { title: '', description: '' },
      },
    ];

    it('should return the correct title description text', () => {
      for (const testCase of testCases) {
        const expectedText =
          `${headerLabel}\n${titleLabel}: ${testCase.expectedPhotoInfo.title}` +
          `\n${descriptionLabel}: ${testCase.expectedPhotoInfo.description}\n\n`;

        expect((service as any).getTitleDescriptionText(testCase.photo))
          .withContext(`caseNo: ${testCase.caseNo}`)
          .toBe(expectedText);
      }
    });
  });

  describe('getExtractedText', () => {
    const testCases = [
      {
        caseNo: 1,
        photo: {
          photoInfo: {
            extractedText: 'Extracted Text',
          },
        } as any as UserPhoto,
        expectedHeaderLabel: 'FEATURE.COPY_DATA.EXTRACTED_TEXT.HEADER',
        expectedExtractedText: 'Extracted Text',
      },
      {
        caseNo: 2,
        photo: {
          photoInfo: {
            extractedText: '',
          },
        } as any as UserPhoto,
        expectedHeaderLabel: 'FEATURE.COPY_DATA.EXTRACTED_TEXT.HEADER_NO_DATA',
        expectedExtractedText: 'The image does not contain any extracted text.',
      },
    ];

    it('should return the correct extracted text', () => {
      photoStorageServiceSpy.getNoExtractedTextInfo.and.returnValue(
        'The image does not contain any extracted text.',
      );

      for (const testCase of testCases) {
        const expectedText = `${testCase.expectedHeaderLabel}\n${testCase.expectedExtractedText}\n\n`;

        expect((service as any).getExtractedText(testCase.photo))
          .withContext(`caseNo: ${testCase.caseNo}`)
          .toBe(expectedText);
      }
    });
  });

  describe('getPhotoName', () => {
    const headerLabel = 'FEATURE.COPY_DATA.PHOTO.HEADER';
    const filenameLabel = 'FEATURE.COPY_DATA.PHOTO.FILENAME';

    const testCases = [
      {
        caseNo: 1,
        photo: {
          photoInfo: {
            fileName: 'photo1.jpg',
          },
        } as any as UserPhoto,
        expectedFileName: 'photo1.jpg',
      },
      {
        caseNo: 2,
        photo: {
          photoInfo: {
            fileName: '',
          },
        } as any as UserPhoto,
        expectedFileName: '',
      },
    ];

    it('should return the correct photo name', () => {
      for (const testCase of testCases) {
        filePathServiceSpy.getFilenameFromFilepath.and.returnValue(
          testCase.expectedFileName,
        );
        const expectedText = `${headerLabel}\n${filenameLabel}: ${testCase.expectedFileName}\n\n`;

        expect((service as any).getPhotoName(testCase.photo))
          .withContext(`caseNo: ${testCase.caseNo}`)
          .toBe(expectedText);
      }
    });
  });

  describe('getTimestampsText', () => {
    const headerLabel = 'FEATURE.COPY_DATA.TIMESTAMPS.HEADER';
    const createdAtLabel = 'FEATURE.COPY_DATA.TIMESTAMPS.CREATED_AT';
    const modifiedAtLabel = 'FEATURE.COPY_DATA.TIMESTAMPS.MODIFIED_AT';

    const testCases = [
      {
        caseNo: 1,
        photo: {
          photoInfo: {
            createdAt: '2024-06-01T12:00:00.000Z',
            modifiedAt: '2024-06-02T12:00:00.000Z',
          },
        } as any as UserPhoto,
        expectedCreatedAt: '2024-06-01T12:00:00.000Z',
        expectedModifiedAt: '2024-06-02T12:00:00.000Z',
      },
      {
        caseNo: 2,
        photo: {
          photoInfo: {
            createdAt: '2024-06-01T12:00:00.000Z',
          },
        } as any as UserPhoto,
        expectedCreatedAt: '2024-06-01T12:00:00.000Z',
        expectedModifiedAt: '',
      },
      {
        caseNo: 3,
        photo: {} as any as UserPhoto,
        expectedCreatedAt: '',
        expectedModifiedAt: '',
      },
    ];

    it('should return the correct timestamps text', () => {
      for (const testCase of testCases) {
        utilsServiceSpy.formatDateTimeISO.and.callFake((date: Date | null) => {
          if (!date) return '';
          return date.toISOString();
        });
        const expectedText =
          `${headerLabel}\n${createdAtLabel}: ${testCase.expectedCreatedAt}` +
          `\n${modifiedAtLabel}: ${testCase.expectedModifiedAt}\n\n`;

        expect((service as any).getTimestampsText(testCase.photo))
          .withContext(`caseNo: ${testCase.caseNo}`)
          .toBe(expectedText);
      }
    });
  });

  describe('getTextStatisticsText', () => {
    const headerLabel = 'FEATURE.COPY_DATA.TEXT_STATISTICS.HEADER';
    const wordCountLabel = 'FEATURE.COPY_DATA.TEXT_STATISTICS.NUMBER_OF_WORDS';
    const lineCountLabel = 'FEATURE.COPY_DATA.TEXT_STATISTICS.NUMBER_OF_LINES';
    const characterCountLabel =
      'FEATURE.COPY_DATA.TEXT_STATISTICS.NUMBER_OF_CHARACTERS';

    it('should return the correct text statistics text', () => {
      const testCases = [
        {
          caseNo: 1,
          textStatistics: {
            wordCount: 10,
            lineCount: 5,
            characterCount: 50,
          } as TextStatistics,
          expectedStatistics: {
            wordCount: 10,
            lineCount: 5,
            characterCount: 50,
          },
        },
        {
          caseNo: 2,
          textStatistics: {
            wordCount: 0,
            lineCount: 0,
            characterCount: 0,
          } as TextStatistics,
          expectedStatistics: {
            wordCount: 0,
            lineCount: 0,
            characterCount: 0,
          },
        },
        {
          caseNo: 3,
          textStatistics: {} as TextStatistics,
          expectedStatistics: {
            wordCount: 0,
            lineCount: 0,
            characterCount: 0,
          },
        },
      ];

      for (const testCase of testCases) {
        const expectedText =
          `${headerLabel}\n${wordCountLabel}: ${testCase.expectedStatistics.wordCount}` +
          `\n${lineCountLabel}: ${testCase.expectedStatistics.lineCount}`+ 
          `\n${characterCountLabel}: ${testCase.expectedStatistics.characterCount}\n\n`;

        expect((service as any).getTextStatisticsText(testCase.textStatistics))
          .withContext(`caseNo: ${testCase.caseNo}`)
          .toBe(expectedText);
      }
    });
  });
});
