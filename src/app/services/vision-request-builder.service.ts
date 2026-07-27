import { Injectable } from '@angular/core';
import {
  OcrBuildOptions,
  VisionBatchRequest,
} from '../shared/google-vision.interfaces';
import { ImageCompressionResult } from '../shared/image-compression.interfaces';

@Injectable({ providedIn: 'root' })
export class VisionRequestBuilderService {

  /**
   * Builds a Google Vision API request for OCR (Optical Character Recognition) 
   * based on the provided compressed image and options.
   *
   * @param compressed The compressed image data, including base64 representation.
   * @param options Optional parameters for the OCR request, such as feature type and maximum results.
   * @returns A VisionBatchRequest object ready to be sent to the Google Vision API.
   */
  buildOcrRequest(
    compressed: ImageCompressionResult,
    options: OcrBuildOptions = {},
  ): VisionBatchRequest {
    const { feature = 'DOCUMENT_TEXT_DETECTION', maxResults = 1 } = options;

    return {
      requests: [
        {
          image: { content: compressed.base64 },
          features: [{ type: feature, maxResults }],
        },
      ],
    };
  }
}