# OCR Image Flow Documentation

## Overview

This document describes the image-to-text flow used by the **z-control Image To Text** app. The flow starts with a selected photo, compresses it for OCR, builds a Google Vision-compatible request, and sends the base64 image to the secure OCR endpoint.

The implementation is designed for both web and native Capacitor platforms. On native, the app works with real filesystem paths and WebView-safe paths; on web, it works with browser-accessible blob/data URLs.

The compression layer uses two different libraries depending on the platform:
- `ImageManipulator` for native image manipulation and resizing.
- `pica` for browser-side high-quality image resizing.

## API

### `ImageCompressionService.buildVisionOcrRequestFromPhoto(photo, compressOptions, ocrOptions)`

Builds a Google Vision OCR request from a `UserPhoto` object.

```ts
const visionRequest = await this.imageCompressionService.buildVisionOcrRequestFromPhoto(
  this.selectedPhoto as UserPhoto,
  {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    mimeType: 'image/jpeg',
  },
  { feature: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
);
```

#### Parameters
- `photo`: The selected `UserPhoto` object.
- `compressOptions`: Image resize and encoding options.
- `ocrOptions`: OCR feature configuration.

#### Returns
A `VisionBatchRequest` object containing base64 image content under `requests[0].image.content`.

### `ocrService.secureRecognize(payload)`

Sends the base64 image data to the secure OCR backend.

```ts
const featureResults = await this.ocrService.secureRecognize({
  imageBase64: visionRequest.requests.image.content,
  mode: 'image',
});
```

#### Parameters
- `imageBase64`: Base64-encoded image data.
- `mode`: OCR mode selector, currently `image`.

#### Returns
A backend response object with extracted OCR results.

## Sequence

1. A photo is selected and stored as `UserPhoto`.
2. The app calls `buildVisionOcrRequestFromPhoto(...)`.
3. The image source is resolved for the current platform.
4. The image is measured and compressed using platform-specific logic.
5. A Vision OCR request is assembled with `DOCUMENT_TEXT_DETECTION`.
6. The base64 image content is passed to `ocrService.secureRecognize(...)`.
7. The backend returns OCR results, which are displayed in the UI.

## Data Contracts

### `UserPhoto`

```ts
export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  category?: category;
  title?: string;
  description?: string;
}
```

#### Fields
- `filepath`: Absolute native file path or stored web filename.
- `webviewPath`: Browser/WebView-safe path used for rendering and fetching.
- `category`: Optional photo category.
- `title`: Optional title.
- `description`: Optional description.

### `ImageCompressionOptions`

```ts
export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
  forceResize?: boolean;
}
```

#### Fields
- `maxWidth`, `maxHeight`: Maximum output dimensions.
- `quality`: JPEG/WebP compression quality from `0` to `1`.
- `mimeType`: Output image MIME type.
- `forceResize`: Forces resize even when the image is already small enough.

### `OcrBuildOptions`

```ts
export interface OcrBuildOptions {
  feature?: 'TEXT_DETECTION' | 'DOCUMENT_TEXT_DETECTION';
  maxResults?: number;
}
```

#### Fields
- `feature`: OCR feature used by Vision.
- `maxResults`: Maximum number of OCR results requested.

### `ImageCompressionResult`

```ts
export interface ImageCompressionResult {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
  resized: boolean;
}
```

#### Fields
- `base64`: Compressed image data without the data URL prefix.
- `mimeType`: Output image MIME type.
- `width`, `height`: Final output dimensions.
- `originalBytes`: Source image size in bytes.
- `compressedBytes`: Final compressed size in bytes.
- `resized`: Indicates whether compression/resizing actually reduced or changed the image.

### `VisionBatchRequest`

This is an internal Vision-style request object produced by `ImageCompressionService`. It mirrors the Google Vision OCR request structure, including `requests[]`, `image.content`, and `features[]`. It is not sent directly to `secureRecognize(...)`.

```ts
export interface VisionBatchRequest {
  requests: [
    {
      image: {
        content: string;
      };
      features: [
        {
          type: 'TEXT_DETECTION' | 'DOCUMENT_TEXT_DETECTION';
          maxResults?: number;
        }
      ];
    }
  ];
}
```

#### Usage

```ts
const visionRequest =
  await this.imageCompressionService.buildVisionOcrRequestFromPhoto(
    this.selectedPhoto as UserPhoto,
    {
      maxWidth: 1024,
      maxHeight: 1024,
      quality: 0.8,
      mimeType: 'image/jpeg',
    },
    { feature: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
  );

const imageBase64 = visionRequest.requests.image.content;

const featureResults = await this.ocrService.secureRecognize({
  imageBase64,
  mode: 'image',
});
```

### `ocrService.secureRecognize(payload)`

Sends the base64 image data to the secure OCR backend.

```ts
const featureResults = await this.ocrService.secureRecognize({
  imageBase64,
  mode: 'image',
});
```

#### Parameters
- `imageBase64`: Base64-encoded image data extracted from `visionRequest.requests[0].image.content`.
- `mode`: OCR mode selector, currently `image`.

#### Returns
A backend response object with extracted OCR results.

## Compression Libraries

### Native compression with `ImageManipulator`

On native iOS/Android, the app uses `@capacitor-community/image-manipulator` to read image dimensions and resize the image before converting it to base64. This is the preferred native path because it works with actual filesystem paths and preserves platform-native image handling.

The native flow:
- reads dimensions using `ImageManipulator.getDimensions(...)`.
- optionally resizes using `ImageManipulator.resize(...)`.
- fetches the resulting web path or converted file path.
- converts the final blob to base64.

### Web compression with `pica`

On web, the app uses `pica` to resize the image on a canvas with higher quality than a plain draw operation. `pica` is used only when the source image needs resizing; otherwise, the canvas is drawn directly with the original dimensions.

The web flow:
- loads the image with browser APIs.
- calculates target dimensions.
- resizes via `pica.resize(...)` when needed.
- converts the canvas to a `Blob`.
- converts the blob to base64 for OCR.

## Platform Behavior

### Web

On web, the source image is typically a `blob:` or `data:` URL. The app uses browser APIs to load the image, resize it on a canvas, and convert the result to base64.

### Native

On native iOS/Android, the source image is stored on the device filesystem. The app uses the real `file:///...` path for native image operations and a WebView-safe path for preview and fetch operations.

### Source Resolution

The source resolution logic returns two paths when available:
- `main`: Used for native filesystem operations.
- `webview`: Used for browser/WebView-safe loading and fetching.

This avoids direct use of `file:///...` inside the WebView, which can cause loading errors.

## OCR Request Example

```ts
const visionRequest = await this.imageCompressionService.buildVisionOcrRequestFromPhoto(
  this.selectedPhoto as UserPhoto,
  {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
    mimeType: 'image/jpeg',
  },
  { feature: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
);

const featureResults = await this.ocrService.secureRecognize({
  imageBase64: visionRequest.requests.image.content,
  mode: 'image',
});
```

## Notes

- `DOCUMENT_TEXT_DETECTION` is used for dense text and document-like layouts.
- The image is resized to a long side around 1024 px by default, which keeps OCR quality high while reducing payload size.
- The OCR backend should remain server-side so that credentials are not exposed in the client.
- The app intentionally uses different compression libraries per platform to match the capabilities of each runtime. [web:26][web:124][web:61]

## Responsibilities

### `PhotoStorageService`

Handles photo persistence, loading, caching, deletion, and storage permissions.

### `FileConversionService`

Handles Blob/base64/data URL conversion logic.

### `FilePathService`

Handles path resolution, filename generation, image loading, dimensions, byte-size estimation, and canvas conversion.

### `ImageCompressionService`

Orchestrates source resolution, compression, and OCR request building.

### `ocrService`

Sends the base64 image to the secure OCR backend and returns OCR results.

## Related Flow

1. Select photo.
2. Store or load `UserPhoto`.
3. Compress with `ImageCompressionService`.
4. Build Vision OCR request.
5. Send base64 to `ocrService.secureRecognize(...)`.
6. Display OCR results.
