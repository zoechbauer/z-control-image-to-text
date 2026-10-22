import { TestBed } from '@angular/core/testing';

import { FileConversionService } from './file-conversion.service';
import { UserPhoto } from '../shared/app.interfaces';

describe('FileConversionService', () => {
  let service: FileConversionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FileConversionService],
    });

    service = TestBed.inject(FileConversionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('blobToDataUrl', () => {
    it('should resolve with data URL when FileReader succeeds', async () => {
      const blob = new Blob(['hello'], { type: 'text/plain' });
      const mockReader: any = {
        result: 'data:text/plain;base64,aGVsbG8=',
        onloadend: null,
        onerror: null,
        readAsDataURL: jasmine.createSpy('readAsDataURL').and.callFake(() => {
          mockReader.onloadend();
        }),
      };

      spyOn(window as any, 'FileReader').and.returnValue(mockReader);

      const result = await service.blobToDataUrl(blob);

      expect(mockReader.readAsDataURL).toHaveBeenCalledWith(blob);
      expect(result).toBe('data:text/plain;base64,aGVsbG8=');
    });

    it('should reject when FileReader fails', async () => {
      const blob = new Blob(['hello'], { type: 'text/plain' });
      const readError = new Error('read failed');
      const mockReader: any = {
        result: null,
        onloadend: null,
        onerror: null,
        readAsDataURL: jasmine.createSpy('readAsDataURL').and.callFake(() => {
          mockReader.onerror(readError);
        }),
      };

      spyOn(window as any, 'FileReader').and.returnValue(mockReader);

      await expectAsync(service.blobToDataUrl(blob)).toBeRejectedWith(
        readError,
      );
      expect(mockReader.readAsDataURL).toHaveBeenCalledWith(blob);
    });
  });

  describe('blobToBase64', () => {
    it('should return only base64 content when input is a data URL', async () => {
      spyOn(service, 'blobToDataUrl').and.resolveTo(
        'data:image/png;base64,QUJDRA==',
      );

      const result = await service.blobToBase64(new Blob(['x']));

      expect(result).toBe('QUJDRA==');
    });

    it('should return full string when no comma exists', async () => {
      spyOn(service, 'blobToDataUrl').and.resolveTo('QUJDRA==');

      const result = await service.blobToBase64(new Blob(['x']));

      expect(result).toBe('QUJDRA==');
    });
  });

  describe('base64ToBlob', () => {
    it('should convert data URL to Blob with extracted MIME type', async () => {
      const blob = service.base64ToBlob('data:text/plain;base64,SGVsbG8=');
      const text = await blob.text();

      expect(blob.type).toBe('text/plain');
      expect(text).toBe('Hello');
    });

    it('should convert plain base64 to Blob with default MIME type', async () => {
      const blob = service.base64ToBlob('SGVsbG8=');
      const text = await blob.text();

      expect(blob.type).toBe('application/octet-stream');
      expect(text).toBe('Hello');
    });
  });

  describe('getImageDataUrl', async () => {
    it('should resolve with data URL when fetch succeeds', async () => {
      const photo = { webviewPath: 'path/to/image.png' } as any as UserPhoto;
      const fetchSpy = spyOn(window as any, 'fetch').and.returnValue(
        Promise.resolve(
          new Response('hello', { headers: { 'Content-Type': 'image/png' } }),
        ),
      );

      const result = await service.getImageDataUrl(photo);

      expect(fetchSpy).toHaveBeenCalledWith('path/to/image.png');
      expect(result).toBe('data:image/png;base64,aGVsbG8=');
    });

    it('should log and throw an error when fetch fails', async () => {
      spyOn(console, 'error');
      const photo = {
        webviewPath: 'path/to/nonexistent.png',
      } as any as UserPhoto;
      spyOn(window as any, 'fetch').and.returnValue(
        Promise.resolve(new Response(null, { status: 404 })),
      );

      const result = await service.getImageDataUrl(photo);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to convert image to data URL',
        jasmine.any(Error),
      );
      expect(result).toBe('');
    });

    it('should log and throw an error when data URL is not an image', async () => {
      spyOn(console, 'error');
      const photo = { webviewPath: 'path/to/image.txt' } as any as UserPhoto;
      const fetchSpy = spyOn(window as any, 'fetch').and.returnValue(
        Promise.resolve(
          new Response('hello', { headers: { 'Content-Type': 'text/plain' } }),
        ),
      );
      const blobToDataUrlSpy = spyOn(service, 'blobToDataUrl').and.returnValue(
        Promise.resolve('data:text/plain;some text'),
      );

      const result = await service.getImageDataUrl(photo);

      expect(fetchSpy).toHaveBeenCalledWith('path/to/image.txt');
      expect(blobToDataUrlSpy).toHaveBeenCalled();
      expect(result).toBe('');
      expect(console.error).toHaveBeenCalledWith(
        'Failed to convert image to data URL',
        jasmine.any(Error),
      );
    });

    it('should return without fetch when webviewPath is not provided', async () => {
      const testCases = [
        { photo: { webviewPath: '' }, expected: '' },
        { photo: { webviewPath: null }, expected: '' },
        { photo: { webviewPath: undefined }, expected: '' },
        {
          photo: { webviewPath: 'data:image/png;base64,iVBORw0KGgo=' },
          expected: 'data:image/png;base64,iVBORw0KGgo=',
        },
      ];

      for (const testCase of testCases) {
        const photo = testCase.photo as any as UserPhoto;
        const result = await service.getImageDataUrl(photo);

        expect(result).toBe(testCase.expected);
      }
    });
  });

  describe('dataUrlToBlobSync', () => {
    it('should convert a valid data URL for text to a Blob', () => {
      const dataUrl = 'data:text/plain;base64,aGVsbG8=';
      const blob = service.dataUrlToBlobSync(dataUrl);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
    });

    it('should convert a valid data URL for an image to a Blob', () => {
      const dataUrl = 'data:image/png;base64,QUJDRA==';
      const blob = service.dataUrlToBlobSync(dataUrl);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('should throw an error for an invalid data URL', () => {
      const invalidDataUrl = 'invalid-data-url';
      expect(() => service.dataUrlToBlobSync(invalidDataUrl)).toThrowError();
    });
  });
});
