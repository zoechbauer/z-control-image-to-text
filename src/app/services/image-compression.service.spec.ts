import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { ImageManipulator } from '@capacitor-community/image-manipulator';
import { ImageManipulatorWeb } from '@capacitor-community/image-manipulator/dist/esm/web';

import { ImageCompressionService } from './image-compression.service';
import { FilePathService } from './file-path.service';
import { FileConversionService } from './file-conversion.service';

describe('ImageCompressionService', () => {
  let service: ImageCompressionService;
  let filePathServiceSpy: jasmine.SpyObj<FilePathService>;
  let fileConversionServiceSpy: jasmine.SpyObj<FileConversionService>;

  const compressionResult = {
    base64: 'BASE64_DATA',
    mimeType: 'image/jpeg',
    width: 1000,
    height: 800,
    originalBytes: 1000,
    compressedBytes: 500,
    resized: true,
  };

  beforeEach(() => {
    filePathServiceSpy = jasmine.createSpyObj<FilePathService>(
      'FilePathService',
      [
        'resolveImageSource',
        'getSourceBytes',
        'getDimensions',
        'loadImage',
        'fitSize',
        'canvasToBlob',
      ],
    );

    fileConversionServiceSpy = jasmine.createSpyObj<FileConversionService>(
      'FileConversionService',
      ['blobToBase64'],
    );

    TestBed.configureTestingModule({
      providers: [
        ImageCompressionService,
        { provide: FilePathService, useValue: filePathServiceSpy },
        { provide: FileConversionService, useValue: fileConversionServiceSpy },
      ],
    });

    service = TestBed.inject(ImageCompressionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('compress', () => {
    beforeEach(() => {
      filePathServiceSpy.resolveImageSource.and.returnValue({
        main: 'file:///main.jpg',
        webview: 'http://localhost/_capacitor_file_/main.jpg',
        isUserPhoto: true,
      });
      filePathServiceSpy.getSourceBytes.and.resolveTo(2000);
      filePathServiceSpy.getDimensions.and.resolveTo({
        width: 4000,
        height: 4000,
      });
    });

    it('should use web compression on non-native platforms with quality capping for very large images', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      const compressWebSpy = spyOn<any>(service, 'compressWeb').and.resolveTo(
        compressionResult,
      );

      const result = await service.compress('dummy-input', { quality: 0.95 });

      expect(result).toEqual(compressionResult);
      expect(compressWebSpy).toHaveBeenCalledWith(
        'http://localhost/_capacitor_file_/main.jpg',
        jasmine.objectContaining({
          quality: 0.75,
          shouldResize: true,
          originalBytes: 2000,
          mimeType: 'image/jpeg',
        }),
      );
    });

    it('should use native compression on native platforms', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      filePathServiceSpy.getDimensions.and.resolveTo({
        width: 1000,
        height: 700,
      });

      const compressNativeSpy = spyOn<any>(
        service,
        'compressNative',
      ).and.resolveTo(compressionResult);

      const result = await service.compress('dummy-input', {
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });

      expect(result).toEqual(compressionResult);
      expect(compressNativeSpy).toHaveBeenCalledWith(
        'file:///main.jpg',
        jasmine.objectContaining({
          quality: 0.8,
          shouldResize: false,
          originalBytes: 2000,
        }),
      );
    });

    it('should fallback to web compression when native plugin fails with known plugin error', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      spyOn<any>(service, 'compressNative').and.rejectWith(
        new Error('Plugin not implemented: ImageManipulator.getDimensions'),
      );
      const compressWebSpy = spyOn<any>(service, 'compressWeb').and.resolveTo(
        compressionResult,
      );
      const warnSpy = spyOn(console, 'warn');

      const result = await service.compress('dummy-input');

      expect(result).toEqual(compressionResult);
      expect(compressWebSpy).toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
    });

    it('should rethrow unknown native compression errors', async () => {
      const unknownError = new Error('unexpected network failure');
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      const nativeSpy = spyOn<any>(service, 'compressNative').and.rejectWith(
        unknownError,
      );

      await expectAsync(service.compress('dummy-input')).toBeRejectedWith(
        unknownError,
      );
      expect(nativeSpy).toHaveBeenCalled();
    });
  });

  describe('native plugin error marker detection', () => {
    it('should return true for known native plugin errors', () => {
      const result = (service as any).isNativeImageManipulatorFailure(
        new Error('NoClassDefFoundError: ImageManipulator class missing'),
      );

      expect(result).toBeTrue();
    });

    it('should return false for unknown errors', () => {
      const result = (service as any).isNativeImageManipulatorFailure(
        new Error('Timeout while uploading'),
      );

      expect(result).toBeFalse();
    });
  });

  describe('buildVisionOcrRequestFromCompressed', () => {
    it('should build request with defaults', () => {
      const request =
        service.buildVisionOcrRequestFromCompressed(compressionResult);

      expect(request).toEqual({
        requests: [
          {
            image: { content: 'BASE64_DATA' },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      });
    });

    it('should build request with custom OCR options', () => {
      const request = service.buildVisionOcrRequestFromCompressed(
        compressionResult,
        {
          feature: 'TEXT_DETECTION',
          maxResults: 3,
        },
      );

      expect(request.requests[0].features[0]).toEqual({
        type: 'TEXT_DETECTION',
        maxResults: 3,
      });
    });
  });

  describe('buildVisionOcrRequestFromInput', () => {
    it('should compress input and build request', async () => {
      spyOn(service, 'compress').and.resolveTo(compressionResult);

      const request = await service.buildVisionOcrRequestFromInput(
        'dummy-input',
        {},
        {
          feature: 'TEXT_DETECTION',
          maxResults: 2,
        },
      );

      expect(service.compress).toHaveBeenCalledWith('dummy-input', {});
      expect(request.requests[0].image.content).toBe('BASE64_DATA');
      expect(request.requests[0].features[0]).toEqual({
        type: 'TEXT_DETECTION',
        maxResults: 2,
      });
    });
  });

  describe('buildVisionOcrRequestFromPhoto', () => {
    it('should delegate to buildVisionOcrRequestFromInput', async () => {
      const photo = {
        filepath: 'file:///photo.jpg',
        webviewPath: 'http://localhost/_capacitor_file_/photo.jpg',
      } as any;
      const expectedRequest = {
        requests: [
          {
            image: { content: 'BASE64_DATA' },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
          },
        ],
      };

      const builderSpy = spyOn(
        service,
        'buildVisionOcrRequestFromInput',
      ).and.resolveTo(expectedRequest as any);

      const request = await service.buildVisionOcrRequestFromPhoto(
        photo,
        { quality: 0.7 },
        { maxResults: 5 },
      );

      expect(builderSpy).toHaveBeenCalledWith(
        photo,
        { quality: 0.7 },
        { maxResults: 5 },
      );
      expect(request).toEqual(expectedRequest as any);
    });
  });

  describe('compressWeb', () => {
    it('should resize with pica when shouldResize is true', async () => {
      const img = {
        naturalWidth: 2000,
        naturalHeight: 1000,
        width: 2000,
        height: 1000,
      } as HTMLImageElement;
      const blob = new Blob(['x'.repeat(400)], { type: 'image/jpeg' });
      const ctx = jasmine.createSpyObj('CanvasRenderingContext2D', [
        'drawImage',
      ]);
      const canvasMock = {
        width: 0,
        height: 0,
        getContext: jasmine.createSpy('getContext').and.returnValue(ctx),
      } as any;

      filePathServiceSpy.loadImage.and.resolveTo(img);
      filePathServiceSpy.fitSize.and.returnValue({ width: 1000, height: 500 });
      filePathServiceSpy.canvasToBlob.and.resolveTo(blob);
      fileConversionServiceSpy.blobToBase64.and.resolveTo('WEB_BASE64');

      const originalCreateElement = document.createElement.bind(document);
      spyOn(document, 'createElement').and.callFake((tagName: string) => {
        if (tagName === 'canvas') return canvasMock;
        return originalCreateElement(tagName);
      });

      const picaResizeSpy = spyOn(
        (service as any).pica,
        'resize',
      ).and.resolveTo();

      const result = await (service as any).compressWeb('http://image.jpg', {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        mimeType: 'image/jpeg',
        shouldResize: true,
        originalBytes: 1000,
      });

      expect(filePathServiceSpy.fitSize).toHaveBeenCalledWith(
        2000,
        1000,
        1200,
        1200,
      );
      expect(picaResizeSpy).toHaveBeenCalledWith(
        img,
        canvasMock,
        jasmine.objectContaining({ quality: 3 }),
      );
      expect(filePathServiceSpy.canvasToBlob).toHaveBeenCalledWith(
        canvasMock,
        'image/jpeg',
        0.8,
      );
      expect(result).toEqual({
        base64: 'WEB_BASE64',
        mimeType: 'image/jpeg',
        width: 1000,
        height: 500,
        originalBytes: 1000,
        compressedBytes: blob.size,
        resized: true,
      });
    });

    it('should draw directly to canvas when no resize is needed', async () => {
      const img = {
        naturalWidth: 800,
        naturalHeight: 600,
        width: 800,
        height: 600,
      } as HTMLImageElement;
      const blob = new Blob(['x'.repeat(600)], { type: 'image/jpeg' });
      const ctx = jasmine.createSpyObj('CanvasRenderingContext2D', [
        'drawImage',
      ]);
      const canvasMock = {
        width: 0,
        height: 0,
        getContext: jasmine.createSpy('getContext').and.returnValue(ctx),
      } as any;

      filePathServiceSpy.loadImage.and.resolveTo(img);
      filePathServiceSpy.canvasToBlob.and.resolveTo(blob);
      fileConversionServiceSpy.blobToBase64.and.resolveTo('WEB_BASE64_DIRECT');

      const originalCreateElement = document.createElement.bind(document);
      spyOn(document, 'createElement').and.callFake((tagName: string) => {
        if (tagName === 'canvas') return canvasMock;
        return originalCreateElement(tagName);
      });

      const picaResizeSpy = spyOn(
        (service as any).pica,
        'resize',
      ).and.resolveTo();

      const result = await (service as any).compressWeb('http://image.jpg', {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        mimeType: 'image/jpeg',
        shouldResize: false,
        originalBytes: 500,
      });

      expect(picaResizeSpy).not.toHaveBeenCalled();
      expect(ctx.drawImage).toHaveBeenCalledWith(img, 0, 0);
      expect(result.resized).toBeFalse();
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should throw when canvas 2D context is unavailable', async () => {
      const img = {
        naturalWidth: 800,
        naturalHeight: 600,
        width: 800,
        height: 600,
      } as HTMLImageElement;
      const canvasMock = {
        width: 0,
        height: 0,
        getContext: jasmine.createSpy('getContext').and.returnValue(null),
      } as any;

      filePathServiceSpy.loadImage.and.resolveTo(img);

      const originalCreateElement = document.createElement.bind(document);
      spyOn(document, 'createElement').and.callFake((tagName: string) => {
        if (tagName === 'canvas') return canvasMock;
        return originalCreateElement(tagName);
      });

      await expectAsync(
        (service as any).compressWeb('http://image.jpg', {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          mimeType: 'image/jpeg',
          shouldResize: false,
          originalBytes: 500,
        }),
      ).toBeRejectedWithError('Canvas 2D context unavailable');

      expect(filePathServiceSpy.canvasToBlob).not.toHaveBeenCalled();
    });
  });

  describe('compressNative', () => {
    it('should resize and convert file URLs before fetching final blob', async () => {
      const getDimensionsMock = jasmine
        .createSpy('getDimensions')
        .and.resolveTo({
          width: 3000,
          height: 2000,
        } as any);
      const resizeMock = jasmine.createSpy('resize').and.resolveTo({
        resizedWidth: 1200,
        resizedHeight: 800,
        webPath: 'file:///resized.jpg',
        imagePath: 'file:///resized.jpg',
      } as any);
      spyOn(ImageManipulatorWeb.prototype, 'getDimensions').and.callFake(
        getDimensionsMock,
      );
      spyOn(ImageManipulatorWeb.prototype, 'resize').and.callFake(resizeMock);
      const convertSpy = spyOn(Capacitor, 'convertFileSrc').and.returnValue(
        'http://localhost/_capacitor_file_/resized.jpg',
      );

      const fetchSpy = spyOn(globalThis, 'fetch').and.callFake(((
        input: RequestInfo | URL,
      ) => {
        const url = String(input);
        const responseBlob = new Blob(
          [url.includes('resized') ? 'x'.repeat(200) : 'x'],
          {
            type: 'image/jpeg',
          },
        );
        return Promise.resolve({
          blob: () => Promise.resolve(responseBlob),
        } as Response);
      }) as any);
      fileConversionServiceSpy.blobToBase64.and.resolveTo('NATIVE_BASE64');

      const result = await (service as any).compressNative(
        'file:///input.jpg',
        {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.81,
          mimeType: 'image/jpeg',
          shouldResize: true,
          originalBytes: 1000,
        },
      );

      expect(getDimensionsMock).toHaveBeenCalledWith({
        imagePath: 'file:///input.jpg',
      });
      expect(resizeMock).toHaveBeenCalledWith({
        imagePath: 'file:///input.jpg',
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 81,
        fixRotation: true,
      });
      expect(convertSpy).toHaveBeenCalledWith('file:///resized.jpg');
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost/_capacitor_file_/resized.jpg',
      );
      expect(result).toEqual({
        base64: 'NATIVE_BASE64',
        mimeType: 'image/jpeg',
        width: 1200,
        height: 800,
        originalBytes: 1000,
        compressedBytes: 200,
        resized: true,
      });
    });

    it('should fetch original bytes when missing and skip resize when shouldResize is false', async () => {
      const getDimensionsMock = jasmine
        .createSpy('getDimensions')
        .and.resolveTo({
          width: 640,
          height: 480,
        } as any);
      const resizeMock = jasmine.createSpy('resize').and.resolveTo({
        resizedWidth: 0,
        resizedHeight: 0,
      } as any);
      spyOn(ImageManipulatorWeb.prototype, 'getDimensions').and.callFake(
        getDimensionsMock,
      );
      spyOn(ImageManipulatorWeb.prototype, 'resize').and.callFake(resizeMock);
      const convertSpy = spyOn(Capacitor, 'convertFileSrc').and.returnValue(
        'http://localhost/_capacitor_file_/input.jpg',
      );

      const fetchSpy = spyOn(globalThis, 'fetch').and.callFake(((
        input: RequestInfo | URL,
      ) => {
        const url = String(input);
        const content = url.startsWith('file:///')
          ? 'x'.repeat(900)
          : 'x'.repeat(700);
        return Promise.resolve({
          blob: () =>
            Promise.resolve(new Blob([content], { type: 'image/jpeg' })),
        } as Response);
      }) as any);
      fileConversionServiceSpy.blobToBase64.and.resolveTo(
        'NATIVE_BASE64_NO_RESIZE',
      );

      const result = await (service as any).compressNative(
        'file:///input.jpg',
        {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          mimeType: 'image/jpeg',
          shouldResize: false,
          originalBytes: 0,
        },
      );

      expect(getDimensionsMock).toHaveBeenCalledWith({
        imagePath: 'file:///input.jpg',
      });
      expect(resizeMock).not.toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalledWith('file:///input.jpg');
      expect(convertSpy).toHaveBeenCalledWith('file:///input.jpg');
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost/_capacitor_file_/input.jpg',
      );
      expect(result).toEqual({
        base64: 'NATIVE_BASE64_NO_RESIZE',
        mimeType: 'image/jpeg',
        width: 640,
        height: 480,
        originalBytes: 900,
        compressedBytes: 700,
        resized: true,
      });
    });
  });
});
