import { TestBed } from '@angular/core/testing';

import { VisionRequestBuilderService } from './vision-request-builder.service';
import {
  OcrBuildOptions,
  VisionBatchRequest as getVisionBatchRequest,
} from '../shared/google-vision.interfaces';
import { ImageCompressionResult } from '../shared/image-compression.interfaces';

describe('VisionRequestBuilderService', () => {
  function getVisionBatchRequest(
    compressedImage: ImageCompressionResult,
    featureType: string | undefined,
  ) {
    const type = featureType || 'DOCUMENT_TEXT_DETECTION';
    return {
      requests: [
        {
          image: {
            content: compressedImage.base64,
          },
          features: [
            {
              type: type,
              maxResults: 1,
            },
          ],
        },
      ],
    } as any as getVisionBatchRequest;
  }

  let service: VisionRequestBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VisionRequestBuilderService],
    });

    service = TestBed.inject(VisionRequestBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build a vision request', () => {
    const testCases = [
      {
        caseNo: 1,
        featureType: undefined,
        compressedImage: {
          base64: 'data:image/png;base64,...',
        } as any as ImageCompressionResult,
        options: {},
      },
      {
        caseNo: 2,
        featureType: undefined,
        compressedImage: {
          base64: 'data:image/png;base64,...',
        } as any as ImageCompressionResult,
        options: undefined,
      },
      {
        caseNo: 3,
        compressedImage: {
          base64: 'data:image/png;base64,...',
        } as any as ImageCompressionResult,
        featureType: 'DOCUMENT_TEXT_DETECTION',
        options: {
          feature: 'DOCUMENT_TEXT_DETECTION',
        } as any as OcrBuildOptions,
      },
      {
        caseNo: 4,
        compressedImage: {
          base64: 'data:image/png;base64,...',
        } as any as ImageCompressionResult,
        featureType: 'TEXT_DETECTION',
        options: {
          feature: 'TEXT_DETECTION',
        } as any as OcrBuildOptions,
      },
    ];

    testCases.forEach(({ caseNo, compressedImage, options, featureType }) => {
      const request = service.buildOcrRequest(compressedImage, options);
      expect(request)
        .withContext(`Case No: ${caseNo}`)
        .toEqual(getVisionBatchRequest(compressedImage, featureType));
    });
  });
});
