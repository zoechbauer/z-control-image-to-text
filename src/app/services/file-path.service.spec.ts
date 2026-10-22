import { TestBed } from '@angular/core/testing';

import { FilePathService } from './file-path.service';
import { FileNamePrefix } from '../shared/enums';
import { UserPhoto } from '../shared/app.interfaces';
import { Capacitor } from '@capacitor/core';
import { type } from 'os';

describe('FilePathService', () => {
  let service: FilePathService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FilePathService],
    });

    service = TestBed.inject(FilePathService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Filename methods', () => {
    it('should return the correct filename', () => {
      const timeStamp = service.generateTimestamp();
      const filename = service.getFileName(FileNamePrefix.ImageToText, 'txt');

      expect(filename).toBe(`${FileNamePrefix.ImageToText}_${timeStamp}.txt`);
    });

    it('should return the filename from a path', () => {
      let path = '/path/to/file.txt';
      let filename = service.getFilenameFromFilepath(path);
      expect(filename).withContext('path').toBe('file.txt');

      path = 'file://path/to/file.txt';
      filename = service.getFilenameFromFilepath(path);
      expect(filename).withContext('file:// path').toBe('file.txt');

      filename = service.getFilenameFromFilepath('');
      expect(filename).withContext('empty path').toBe('');
    });

    it('should return the filename extension from a path', () => {
      let path = '/path/to/file.txt';
      let extension = service.getFilenameExtension(path);
      expect(extension).withContext('path').toBe('txt');

      path = 'file://path/to/file.txt';
      extension = service.getFilenameExtension(path);
      expect(extension).withContext('file:// path').toBe('txt');

      extension = service.getFilenameExtension('');
      expect(extension).withContext('empty path').toBe('');
    });

    it('should format the timestamp correctly', () => {
      const dateNowSpy = spyOn(Date, 'now');
      const testData = [
        // month, day, hour, minute and second padding cases
        { date: new Date(2024, 1, 3, 4, 5, 6), expected: '20240203_040506' },
        { date: new Date(2024, 0, 9, 9, 9, 9), expected: '20240109_090909' },
        { date: new Date(2024, 2, 10, 2, 2, 2), expected: '20240310_020202' },
        { date: new Date(2024, 9, 1, 0, 1, 2), expected: '20241001_000102' },
        {
          date: new Date(2024, 11, 31, 23, 59, 59),
          expected: '20241231_235959',
        },
      ];

      testData.forEach(({ date, expected }) => {
        dateNowSpy.and.returnValue(date.getTime());
        const formatted = service.generateTimestamp();

        expect(formatted).toBe(expected);
      });
    });
  });

  describe('isUserPhoto', () => {
    it('should return true for user photo', () => {
      const photo = { filepath: 'some/path/to/photo.jpg' } as any as UserPhoto;
      expect((service as any).isUserPhoto(photo)).toBeTrue();
    });

    it('should return false for non-user photo filenames', () => {
      const photo = { photoInfo: { title: 'no filepath' } } as any as UserPhoto;
      expect((service as any).isUserPhoto(photo)).toBeFalse();
    });
  });

  describe('resolveImageSource', () => {
    it('should return the correct image source for a user photo with filepath and webviewPath on web app', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      const photo = {
        filepath: 'some/path/to/photo.jpg',
        webviewPath: 'some/webpath/to/photo.jpg',
      } as any as UserPhoto;

      let source = (service as any).resolveImageSource(photo);

      expect(source).toEqual({
        main: 'some/webpath/to/photo.jpg',
        webview: 'some/webpath/to/photo.jpg',
        isUserPhoto: true,
      });
    });

    it('should return the correct image source for a user photo only with filepath on web application', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      const photo = {
        filepath: 'some/path/to/photo.jpg',
      } as any as UserPhoto;

      const source = (service as any).resolveImageSource(photo);

      expect(source).toEqual({
        main: 'some/path/to/photo.jpg',
        webview: undefined,
        isUserPhoto: true,
      });
    });

    it('should return the correct image source for a user photo with filepath and webviewPath on native app', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      const photo = {
        filepath: 'some/path/to/photo.jpg',
        webviewPath: 'some/webpath/to/photo.jpg',
      } as any as UserPhoto;

      let source = (service as any).resolveImageSource(photo);

      expect(source).toEqual({
        main: 'some/path/to/photo.jpg',
        webview: 'some/webpath/to/photo.jpg',
        isUserPhoto: true,
      });
    });

    it('should return the correct image source for a user photo only with filepath on native application', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      spyOn(Capacitor, 'convertFileSrc').and.returnValue(
        'converted/path/to/photo.jpg',
      );
      const photo = {
        filepath: 'some/path/to/photo.jpg',
      } as any as UserPhoto;

      const source = (service as any).resolveImageSource(photo);

      expect(source).toEqual({
        main: 'some/path/to/photo.jpg',
        webview: 'converted/path/to/photo.jpg',
        isUserPhoto: true,
      });
    });

    it('should return the correct image source for a string', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      const testCases = [
        {
          testCase: 1, // base64 string
          input: 'QUJDRA==',
          expected: {
            main: 'data:image/jpeg;base64,QUJDRA==',
            webview: 'data:image/jpeg;base64,QUJDRA==',
            isUserPhoto: false,
          },
        },
        {
          testCase: 2, // file URL
          input: 'file:///input.jpg',
          expected: {
            main: 'file:///input.jpg',
            webview: 'file:///input.jpg',
            isUserPhoto: false,
          },
        },
        {
          testCase: 3, // http URL
          input: 'http://localhost/_capacitor_file_/resized.jpg',
          expected: {
            main: 'http://localhost/_capacitor_file_/resized.jpg',
            webview: 'http://localhost/_capacitor_file_/resized.jpg',
            isUserPhoto: false,
          },
        },
        {
          testCase: 4, // data URL
          input: 'data:image/jpeg;base64,somebase64data',
          expected: {
            main: 'data:image/jpeg;base64,somebase64data',
            webview: 'data:image/jpeg;base64,somebase64data',
            isUserPhoto: false,
          },
        },
        {
          testCase: 5, // blob:http URL
          input:
            'blob:http://localhost:3000/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          expected: {
            main: 'blob:http://localhost:3000/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            webview:
              'blob:http://localhost:3000/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            isUserPhoto: false,
          },
        },
        {
          testCase: 6, // blob:https URL
          input:
            'blob:https://example.com/550e8400-e29b-41d4-a716-446655440000',
          expected: {
            main: 'blob:https://example.com/550e8400-e29b-41d4-a716-446655440000',
            webview:
              'blob:https://example.com/550e8400-e29b-41d4-a716-446655440000',
            isUserPhoto: false,
          },
        },
        {
          testCase: 7, // blob:app URL
          input: 'blob:app://c8f9d2e1-4a5b-6c7d-8e9f-0a1b2c3d4e5f',
          expected: {
            main: 'blob:app://c8f9d2e1-4a5b-6c7d-8e9f-0a1b2c3d4e5f',
            webview: 'blob:app://c8f9d2e1-4a5b-6c7d-8e9f-0a1b2c3d4e5f',
            isUserPhoto: false,
          },
        },
      ];

      testCases.forEach(({ testCase, input, expected }) => {
        const source = (service as any).resolveImageSource(input);
        expect(source).withContext(`Test case: ${testCase}`).toEqual(expected);
      });
    });

    it('should return null for non-user photo', () => {
      const photo = { photoInfo: { title: 'no filepath' } } as any as UserPhoto;
      const source = (service as any).resolveImageSource(photo);

      expect(source).toEqual({
        main: '',
        webview: '',
        isUserPhoto: false,
      });
    });
  });

  describe('canvasToBlob', () => {
    it('should convert canvas to blob', async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const mimeType = 'image/png';
      const quality = 1.0;

      const blob = await (service as any).canvasToBlob(
        canvas,
        mimeType,
        quality,
      );
      expect(blob).toBeInstanceOf(Blob);
      expect(blob?.type).toBe('image/png');
    });

    it('should reject with error if canvas.toBlob is not provided', async () => {
      const canvas = document.createElement('canvas');
      const errorMsg = 'Canvas toBlob failed';
      spyOn(canvas, 'toBlob').and.callFake((callback: BlobCallback) =>
        callback(null),
      );
      await expectAsync(
        (service as any).canvasToBlob(canvas, 'image/png', 1.0),
      ).toBeRejectedWithError(errorMsg);
    });
  });

  describe('loadImage', () => {
    it('should load an image successfully', async () => {
      const src =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA' +
        'AAAFCAYAAACNbyblAAAAHElEQVQI12P4' +
        '//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
      const img = await (service as any).loadImage(src);
      expect(img).toBeInstanceOf(HTMLImageElement);
      expect(img.src).toBe(src);
    });

    it('should reject if the image fails to load', async () => {
      const src = 'invalid-image-src';
      await expectAsync((service as any).loadImage(src)).toBeRejectedWithError(
        'Image load failed',
      );
    });
  });

  describe('getDimensions', () => {
    it('should return the correct dimensions of an image', async () => {
      const src =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA' +
        'AAAFCAYAAACNbyblAAAAHElEQVQI12P4' +
        '//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';

      // Because the actual image size is not stored on the img element as a visible “size”
      // property you can read from the raw DOM object dump.
      const img = await (service as any).loadImage(src);
      // console.log('image loaded', img);
      // console.log('img.naturalWidth', img.naturalWidth);
      // console.log('img.naturalHeight', img.naturalHeight);

      const dimensions = await (service as any).getDimensions(src);
      expect(dimensions).toEqual({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    });
  });

  describe('fitSize', () => {
    it('should return original size if the long side is smaller than the minimum long side', () => {
      const srcW = 500;
      const srcH = 400;
      const maxW = 1000;
      const maxH = 1000;
      const result = (service as any).fitSize(srcW, srcH, maxW, maxH);
      expect(result).toEqual({ width: 500, height: 400 });
    });

    it('should scale down the image if the long side is larger than the maximum long side', () => {
      const srcW = 2000;
      const srcH = 1500;
      const maxW = 1000;
      const maxH = 1000;
      const result = (service as any).fitSize(srcW, srcH, maxW, maxH);
      expect(result.width).toBeLessThanOrEqual(1000);
      expect(result.height).toBeLessThanOrEqual(1000);
    });

    it('should maintain the aspect ratio', () => {
      const srcW = 1600;
      const srcH = 1200;
      const maxW = 1000;
      const maxH = 1000;
      const result = (service as any).fitSize(srcW, srcH, maxW, maxH);
      expect(result.width / result.height).toBeCloseTo(1600 / 1200);
    });
  });

  describe('getSourceBytes', () => {
    let fetchSpy: jasmine.Spy;

    beforeEach(() => {
      fetchSpy = spyOn(globalThis, 'fetch').and.callFake(((src: string) => {
        const result = (src: string) => {
          if (src.startsWith('data:')) {
            const comma = src.indexOf(',');
            const base64 = comma >= 0 ? src.substring(comma + 1) : src;

            let padding: number;
            if (base64.endsWith('==')) {
              padding = 2;
            } else if (base64.endsWith('=')) {
              padding = 1;
            } else {
              padding = 0;
            }
            return Math.floor((base64.length * 3) / 4) - padding;
          }
          return 0;
        };

        const responseBlob = new Blob([String(result(src))], {
          type: 'image/jpeg',
        });
        return Promise.resolve({
          blob: () => Promise.resolve(responseBlob),
        } as Response);
      }) as any);
    });

    it('should return the correct byte array of an image with data URL ending with ==', async () => {
      const src =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA' +
        'AAAFCAYAAACNbyblAAAAHElEQVQI12P4' +
        '//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';

      const bytes = await (service as any).getSourceBytes(src);
      expect(typeof bytes).toBe('number');
      expect(bytes).toBeGreaterThan(0);
    });

    it('should return the correct byte array of an image with data URL ending with =', async () => {
      const src = 'data:image/png;base64,AAAA=';

      const bytes = await (service as any).getSourceBytes(src);
      expect(typeof bytes).toBe('number');
      expect(bytes).toBeGreaterThan(0);
    });

    it('should return the correct byte array of an image with data URL ending with no =', async () => {
      const src = 'data:image/png;base64,AAAA';

      const bytes = await (service as any).getSourceBytes(src);
      expect(typeof bytes).toBe('number');
      expect(bytes).toBeGreaterThan(0);
    });

    it('should return the correct byte array of an image with a non-data URL', async () => {
      fetchSpy.and.resolveTo({
        blob: () => Promise.resolve(new Blob(['abc'], { type: 'image/png' })),
      } as Response);

      const bytes = await (service as any).getSourceBytes(
        'https://example.com/test.png',
      );
      expect(bytes).toBe(3);
    });
  });
});
