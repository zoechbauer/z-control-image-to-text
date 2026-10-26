import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { ImageManipulatorWeb } from '@capacitor-community/image-manipulator/dist/esm/web';
import { BehaviorSubject } from 'rxjs';

import { ImageResizeEngineService } from './image-resize-engine.service';
import { UserPhoto } from '../shared/app.interfaces';
import { FileConversionService } from './file-conversion.service';

describe('ImageResizeEngineService', () => {
  let service: ImageResizeEngineService;
  let photosSubject: BehaviorSubject<UserPhoto[]>;
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

    TestBed.configureTestingModule({
      providers: [
        ImageResizeEngineService,
        { provide: FileConversionService, useValue: fileConversionServiceSpy },
      ],
    });

    service = TestBed.inject(ImageResizeEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadImage', () => {
    it('should load an image', async () => {
      const src =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA' +
        'AAAFCAYAAACNbyblAAAAHElEQVQI12P4' +
        '//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';

      const img = await (service as any).loadImage(src);
      expect(img).toBeTruthy();
      expect(img.src).toBe(src);
      expect(typeof img.onerror).toBe('function');
    });

    it('should reject when image loading fails', async () => {
      const originalImage = (window as any).Image;
      const src = 'data:image/png;base64,invalid';

      class FakeImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_: string) {
          setTimeout(() => this.onerror?.(), 0);
        }
      }

      (window as any).Image = FakeImage as any;
      try {
        await expectAsync(
          (service as any).loadImage(src),
        ).toBeRejectedWithError('Image load failed');
      } finally {
        (window as any).Image = originalImage;
      }
    });
  });

  describe('fitSize', () => {
    const testCases = [
      {
        caseNo: 1,
        srcW: 200,
        srcH: 100,
        maxW: 100,
        maxH: 50,
        expected: { width: 200, height: 100 },
        info: 'maxLongSide < minLongSide',
      },
      {
        caseNo: 2,
        srcW: 1000,
        srcH: 2000,
        maxW: 500,
        maxH: 1000,
        expected: { width: 500, height: 1000 },
        info: 'scaling down image',
      },
      {
        caseNo: 3,
        srcW: 1000,
        srcH: 2000,
        maxW: 2000,
        maxH: 4000,
        expected: { width: 1000, height: 2000 },
        info: 'scaling up image',
      },
      {
        caseNo: 4,
        srcW: 1000,
        srcH: 2000,
        maxW: 1000,
        maxH: 2000,
        expected: { width: 1000, height: 2000 },
        info: 'exact fit',
      },
    ];
    it('should calculate the correct fit size', () => {
      for (const {
        caseNo,
        srcW,
        srcH,
        maxW,
        maxH,
        expected,
        info,
      } of testCases) {
        const result = (service as any).fitSize(srcW, srcH, maxW, maxH);
        expect(result)
          .withContext(`Case number ${caseNo}: ${info ?? ''}`)
          .toEqual(expected);
      }
    });
  });

  describe('canvasToBlob', () => {
    const quality = 0.9;

    it('should convert canvas to blob', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;

      const blob = await (service as any).canvasToBlob(
        canvas,
        'image/png',
        quality,
      );
      expect(blob).toBeTruthy();
      expect(blob instanceof Blob).toBeTrue();
    });

    it('should reject when canvas to blob conversion fails', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;

      spyOn(canvas, 'toBlob').and.callFake(
        (callback: (blob: Blob | null) => void) => {
          callback(null);
        },
      );

      await expectAsync(
        (service as any).canvasToBlob(canvas, 'image/png', quality),
      ).toBeRejectedWithError('Canvas toBlob failed');
    });
  });

  describe('compressWeb', () => {
    it('should compress image for web', async () => {
      const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      const opts = {
        shouldResize: true,
        maxWidth: 100,
        maxHeight: 100,
        quality: 0.9,
        mimeType: 'image/png',
        originalBytes: 5000,
      };
      const image = {
        naturalWidth: 1200,
        naturalHeight: 800,
      } as HTMLImageElement;
      const blob = new Blob(['compressed'], { type: 'image/png' });

      spyOn(service as any, 'loadImage').and.resolveTo(image);
      spyOn(service as any, 'fitSize').and.returnValue({
        width: 100,
        height: 67,
      });
      spyOn((service as any).pica, 'resize').and.resolveTo(undefined);
      spyOn(service as any, 'canvasToBlob').and.resolveTo(blob);
      fileConversionServiceSpy.blobToBase64.and.resolveTo('BASE64_DATA');

      const result = await (service as any).compressWeb(src, opts);

      expect(result).toBeTruthy();
      expect(result).toEqual({
        base64: 'BASE64_DATA',
        mimeType: 'image/png',
        width: 100,
        height: 67,
        originalBytes: 5000,
        compressedBytes: blob.size,
        resized: true,
      });
      expect(fileConversionServiceSpy.blobToBase64).toHaveBeenCalledWith(blob);
    });

    it('should use img.width and img.height if img.naturalWidth and img.naturalHeight are not available', async () => {
      const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      const opts = {
        shouldResize: true,
        maxWidth: 100,
        maxHeight: 100,
        quality: 0.9,
        mimeType: 'image/png',
        originalBytes: 5000,
      };
      const image = {
        naturalWidth: undefined,
        naturalHeight: undefined,
        width: 500,
        height: 300,
      } as unknown as HTMLImageElement;
      const blob = new Blob(['compressed'], { type: 'image/png' });

      spyOn(service as any, 'loadImage').and.resolveTo(image);
      spyOn(service as any, 'fitSize').and.returnValue({
        width: 100,
        height: 67,
      });
      spyOn((service as any).pica, 'resize').and.resolveTo(undefined);
      spyOn(service as any, 'canvasToBlob').and.resolveTo(blob);
      fileConversionServiceSpy.blobToBase64.and.resolveTo('BASE64_DATA');

      const result = await (service as any).compressWeb(src, opts);

      expect(result).toBeTruthy();
      expect(result).toEqual({
        base64: 'BASE64_DATA',
        mimeType: 'image/png',
        width: 100,
        height: 67,
        originalBytes: 5000,
        compressedBytes: blob.size,
        resized: true,
      });
      expect(fileConversionServiceSpy.blobToBase64).toHaveBeenCalledWith(blob);
    });

    it('should draw image with 2d context when resize is not needed', async () => {
      const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      const opts = {
        shouldResize: false,
        maxWidth: 100,
        maxHeight: 100,
        quality: 0.9,
        mimeType: 'image/png',
        originalBytes: 5000,
      };
      const image = {
        naturalWidth: 500,
        naturalHeight: 300,
      } as HTMLImageElement;
      const blob = new Blob(['compressed'], { type: 'image/png' });
      const drawImageSpy = jasmine.createSpy('drawImage');
      const originalCreateElement = document.createElement.bind(document);
      const canvas = originalCreateElement('canvas');

      spyOn(service as any, 'loadImage').and.resolveTo(image);
      const resizeSpy = spyOn((service as any).pica, 'resize').and.resolveTo(
        undefined,
      );
      spyOn(canvas, 'getContext').and.returnValue({
        drawImage: drawImageSpy,
      } as any);
      spyOn(document, 'createElement').and.callFake((tagName: string) => {
        if (tagName === 'canvas') {
          return canvas;
        }
        return originalCreateElement(tagName);
      });
      spyOn(service as any, 'canvasToBlob').and.resolveTo(blob);
      fileConversionServiceSpy.blobToBase64.and.resolveTo('BASE64_DATA');

      const result = await (service as any).compressWeb(src, opts);

      expect(resizeSpy).not.toHaveBeenCalled();
      expect(drawImageSpy).toHaveBeenCalledWith(image, 0, 0);
      expect(result.width).toBe(500);
      expect(result.height).toBe(300);
    });

    it('should throw when 2d context is unavailable in no-resize path', async () => {
      const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      const opts = {
        shouldResize: false,
        maxWidth: 100,
        maxHeight: 100,
        quality: 0.9,
        mimeType: 'image/png',
        originalBytes: 5000,
      };
      const image = {
        naturalWidth: 500,
        naturalHeight: 300,
      } as HTMLImageElement;
      const originalCreateElement = document.createElement.bind(document);
      const canvas = originalCreateElement('canvas');

      spyOn(service as any, 'loadImage').and.resolveTo(image);
      spyOn(canvas, 'getContext').and.returnValue(null);
      spyOn(document, 'createElement').and.callFake((tagName: string) => {
        if (tagName === 'canvas') {
          return canvas;
        }
        return originalCreateElement(tagName);
      });

      await expectAsync(
        (service as any).compressWeb(src, opts),
      ).toBeRejectedWithError('Canvas 2D context unavailable');
    });
  });

  describe('compressNative', () => {
    let getDimensionsSpy: jasmine.Spy;
    let resizeSpy: jasmine.Spy;
    let convertFileSrcSpy: jasmine.Spy;
    let fetchSpy: jasmine.Spy;

    beforeEach(() => {
      getDimensionsSpy = spyOn(ImageManipulatorWeb.prototype, 'getDimensions');
      resizeSpy = spyOn(ImageManipulatorWeb.prototype, 'resize');
      convertFileSrcSpy = spyOn(Capacitor, 'convertFileSrc').and.callFake(
        (path: string) => path,
      );
      fetchSpy = spyOn(window, 'fetch');
      getDimensionsSpy.and.resolveTo({
        width: 500,
        height: 300,
      });
      resizeSpy.and.resolveTo({
        resizedWidth: 100,
        resizedHeight: 100,
        imagePath: 'file:///tmp/resized.png',
        webPath: 'file:///tmp/resized.png',
      });
      fileConversionServiceSpy.blobToBase64.and.resolveTo('BASE64_DATA');
    });

    it('should compress image for mobile', async () => {
      fetchSpy.and.resolveTo(
        new Response(new Blob(['IMAGE_DATA'], { type: 'image/png' })),
      );
      const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      const opts = {
        shouldResize: true,
        maxWidth: 100,
        maxHeight: 100,
        quality: 0.9,
        mimeType: 'image/png',
        originalBytes: 5000,
      };

      const result = await (service as any).compressNative(src, opts);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(getDimensionsSpy).toHaveBeenCalled();
      expect(resizeSpy).toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalled();
      expect(convertFileSrcSpy).toHaveBeenCalled();
    });

    it('should get originalBytes from image if missing in options', async () => {
      fetchSpy.and.callFake(
        async () =>
          new Response(new Blob(['IMAGE_DATA'], { type: 'image/png' })),
      );
      const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      const opts = {
        shouldResize: true,
        maxWidth: 100,
        maxHeight: 100,
        quality: 0.9,
        mimeType: 'image/png',
      };

      const result = await (service as any).compressNative(src, opts);

      expect(fetchSpy).toHaveBeenCalledWith(src);
      expect(fetchSpy).toHaveBeenCalledWith('file:///tmp/resized.png');
      expect(fetchSpy.calls.count()).toBe(2);
      expect(result.originalBytes).toBeDefined();
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(getDimensionsSpy).toHaveBeenCalled();
      expect(resizeSpy).toHaveBeenCalled();
      expect(convertFileSrcSpy).toHaveBeenCalledWith('file:///tmp/resized.png');
    });
  });
});
