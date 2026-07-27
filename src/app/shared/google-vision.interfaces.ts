export type VisionFeatureType =
  | 'TEXT_DETECTION'
  | 'DOCUMENT_TEXT_DETECTION'
  | 'LABEL_DETECTION'
  | 'FACE_DETECTION';

export interface VisionFeature {
  type: VisionFeatureType;
  maxResults?: number;
}

export interface VisionImagePayload {
  content: string;
}

export interface VisionAnnotateImageRequest {
  image: VisionImagePayload;
  features: VisionFeature[];
}

export interface VisionBatchRequest {
  requests: VisionAnnotateImageRequest[];
}

export interface OcrBuildOptions {
  feature?: Extract<
    VisionFeatureType,
    'TEXT_DETECTION' | 'DOCUMENT_TEXT_DETECTION'
  >;
  maxResults?: number;
}