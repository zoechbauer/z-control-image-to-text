import { TestBed } from '@angular/core/testing';

import { ImageSourceResolverService } from './image-source-resolver.service';
import {
  ImageCompressionInput,
  ResolvedImageSource,
} from '../shared/image-compression.interfaces';
import { FileConversionService } from './file-conversion.service';
import is from '@angular/common/locales/is';
import { Capacitor } from '@capacitor/core';

describe('ImageSourceResolverService', () => {
  let service: ImageSourceResolverService;
  let fileConversionServiceSpy: jasmine.SpyObj<FileConversionService>;

  beforeEach(() => {
    fileConversionServiceSpy = jasmine.createSpyObj<FileConversionService>(
      'FileConversionService',
      ['blobToDataUrl'],
    );
    TestBed.configureTestingModule({
      providers: [
        ImageSourceResolverService,
        { provide: FileConversionService, useValue: fileConversionServiceSpy },
      ],
    });

    service = TestBed.inject(ImageSourceResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isUserPhoto', () => {
    it('should return true for user photo filepath using input', () => {
      const input: ImageCompressionInput = {
        filepath: 'https://example.com/user/photo.jpg',
      };
      expect((service as any).isUserPhoto(input)).toBeTrue();
    });

    it('should return false for user photo without filepath', () => {
      const input: ImageCompressionInput = {
        webviewPath: 'https://example.com/user/photo.jpg',
      } as unknown as ImageCompressionInput;
      expect((service as any).isUserPhoto(input)).toBeFalse();
    });

    it('should return false for non-user photo input', () => {
      const input: ImageCompressionInput = {
        photo: 'some/photo.jpg',
      } as unknown as ImageCompressionInput;
      expect((service as any).isUserPhoto(input)).toBeFalse();
    });
  });

  describe('resolve', () => {
    let isNativeSpy: jasmine.Spy;

    beforeEach(() => {
      fileConversionServiceSpy.blobToDataUrl.calls.reset();
      isNativeSpy = spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
    });

    it('should resolve user photo input on web app', async () => {
      isNativeSpy.and.returnValue(false);
      const input: ImageCompressionInput = {
        filepath: 'https://example.com/user/photo.jpg',
      };
      fileConversionServiceSpy.blobToDataUrl.and.resolveTo(
        'data:image/jpeg;base64,...',
      );

      const result = await service.resolve(input);

      const expectedResolvedImage: ResolvedImageSource = {
        main: 'https://example.com/user/photo.jpg',
        webview: undefined,
        isUserPhoto: true,
      };
      expect(result).toEqual(expectedResolvedImage);
    });

    it('should resolve user photo input on mobile app', async () => {
      isNativeSpy.and.returnValue(true);
      const input: ImageCompressionInput = {
        filepath: 'https://example.com/user/photo.jpg',
      };
      fileConversionServiceSpy.blobToDataUrl.and.resolveTo(
        'data:image/jpeg;base64,...',
      );

      const result = await service.resolve(input);

      const expectedResolvedImage: ResolvedImageSource = {
        main: 'https://example.com/user/photo.jpg',
        webview: 'https://example.com/user/photo.jpg',
        isUserPhoto: true,
      };
      expect(result).toEqual(expectedResolvedImage);
    });

    it('should resolve string input as main image', async () => {
      const input: ImageCompressionInput =
        'https://example.com/user/photo.jpg' as unknown as ImageCompressionInput;
      fileConversionServiceSpy.blobToDataUrl.and.resolveTo(
        'data:image/jpeg;base64,...',
      );

      const testCases = [
        {
          caseNo: 1,
          input: 'https://example.com/user/photo.jpg',
          expected: {
            main: 'https://example.com/user/photo.jpg',
            webview: 'https://example.com/user/photo.jpg',
            isUserPhoto: false,
          },
        },
        {
          caseNo: 2,
          input: 'http://example.com/user/photo.jpg',
          expected: {
            main: 'http://example.com/user/photo.jpg',
            webview: 'http://example.com/user/photo.jpg',
            isUserPhoto: false,
          },
        },
        {
          caseNo: 3,
          input: 'data:image/jpeg;base64,...',
          expected: {
            main: 'data:image/jpeg;base64,...',
            webview: 'data:image/jpeg;base64,...',
            isUserPhoto: false,
          },
        },
        {
          caseNo: 4,
          input: 'blob:http://localhost:3000/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          expected: {
            main: 'blob:http://localhost:3000/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            webview: 'blob:http://localhost:3000/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            isUserPhoto: false,
          },
        },
        {
          caseNo: 5,
          input: 'file:///input.jpg',
          expected: {
            main: 'file:///input.jpg',
            webview: 'file:///input.jpg',
            isUserPhoto: false,
          },
        },
        {
          caseNo: 6,
          input: 'aGVsbG8=',
          expected: {
            main: 'data:image/jpeg;base64,aGVsbG8=',
            webview: 'data:image/jpeg;base64,aGVsbG8=',
            isUserPhoto: false,
          },
        },
      ];

      for (const testCase of testCases) {
        const result = await service.resolve(
          testCase.input as unknown as ImageCompressionInput,
        );

        expect(result)
          .withContext(`Test case ${testCase.caseNo}`)
          .toEqual(testCase.expected);
      }
    });

    it('should resolve blob input by converting it to a data URL', async () => {
      const input = new Blob(['image bytes'], { type: 'image/png' });
      const expectedDataUrl = 'data:image/png;base64,aW1hZ2UgYnl0ZXM=';
      fileConversionServiceSpy.blobToDataUrl.and.resolveTo(expectedDataUrl);

      const result = await service.resolve(input as unknown as ImageCompressionInput);

      expect(result).toEqual({
        main: expectedDataUrl,
        webview: expectedDataUrl,
        isUserPhoto: false,
      });
      expect(fileConversionServiceSpy.blobToDataUrl).toHaveBeenCalledWith(input);
    });
  });
});
