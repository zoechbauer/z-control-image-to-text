import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import pica from 'pica';
import { ImageManipulator } from '@capacitor-community/image-manipulator';

import {
  OcrBuildOptions,
  VisionBatchRequest,
} from '../shared/google-vision.interfaces';
import {
  ImageCompressionInput,
  ImageCompressionOptions,
  ImageCompressionResult,
} from '../shared/image-compression.interfaces';
import { UserPhoto } from '../shared/app.interfaces';
import { FilePathService } from './file-path.service';
import { FileConversionService } from './file-conversion.service';

@Injectable({ providedIn: 'root' })
export class ImageCompressionService {
  private readonly filePathService = inject(FilePathService);
  private readonly fileConversionService = inject(FileConversionService);
  private readonly pica = pica();


  /**
   * Compress an image input, either from a file path or a base64 string.
   * For native platforms, it uses the Capacitor Image Manipulator plugin. 
   * For web platforms, it uses the Pica library for resizing and compression.
   * Falls back to web compression if native compression fails due to plugin issues.
   * @param input The image input to compress
   * @param options Compression options
   * @returns The result of the compression, including the compressed image data
   */
  async compress(
  input: ImageCompressionInput,
  options: ImageCompressionOptions = {},
): Promise<ImageCompressionResult> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    mimeType = 'image/jpeg',
    forceResize = false,
  } = options;

  const { main, webview } = this.filePathService.resolveImageSource(input);
  const safeSource = webview || main;

  const originalBytes = await this.filePathService.getSourceBytes(safeSource);
  const { width: srcW, height: srcH } =
    await this.filePathService.getDimensions(safeSource);

  const pixels = srcW * srcH;
  const effQuality = pixels > 12_000_000 ? Math.min(quality, 0.75) : quality;
  const shouldResize = forceResize || srcW > maxWidth || srcH > maxHeight;

  const resizeOptions = {
    maxWidth,
    maxHeight,
    quality: effQuality,
    mimeType,
    shouldResize,
    originalBytes,
  };

  if (!Capacitor.isNativePlatform()) {
    return this.compressWeb(safeSource, resizeOptions);
  }

  try {
    return await this.compressNative(main, resizeOptions);
  } catch (error) {
    console.error('[ImageCompressionService] Native compression failed', error);
    if (!this.isNativeImageManipulatorFailure(error)) {
      throw error;
    }

    console.warn(
      '[ImageCompressionService] Native compression failed, fallback to web compression',
      error,
    );

    return this.compressWeb(safeSource, resizeOptions);
  }
}

private isNativeImageManipulatorFailure(error: unknown): boolean {
  const message = String((error as any)?.message ?? '').toLowerCase();
  const stack = String((error as any)?.stack ?? '').toLowerCase();
  const payload = `${message} ${stack}`;

  const markers = [
    'noclassdeffounderror',
    'classnotfoundexception',
    'image manipulator',
    'imagemanipulator',
    'getdimensions',
    'plugin not implemented',
    'plugin unavailable',
  ];

  return markers.some((m) => payload.includes(m));
}

  /**
   * Build a Vision OCR request from a compressed image.
   * @param compressed The compressed image result
   * @param options OCR build options
   * @returns The Vision API batch request
   */
  buildVisionOcrRequestFromCompressed(
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

  /**
   * Build a Vision OCR request from an image input, compressing it first if necessary.
   * @param input The image input to compress and build the request from
   * @param compressOptions Compression options
   * @param ocrOptions OCR build options
   * @returns The Vision API batch request
   */
  async buildVisionOcrRequestFromInput(
    input: ImageCompressionInput,
    compressOptions: ImageCompressionOptions = {},
    ocrOptions: OcrBuildOptions = {},
  ): Promise<VisionBatchRequest> {
    const compressed = await this.compress(input, compressOptions);
    return this.buildVisionOcrRequestFromCompressed(compressed, ocrOptions);
  }

  /**
   * Build a Vision OCR request from a UserPhoto, compressing it first if necessary.
   * @param photo The UserPhoto to compress and build the request from
   * @param compressOptions Compression options
   * @param ocrOptions OCR build options
   * @returns The Vision API batch request
   */
  async buildVisionOcrRequestFromPhoto(
    photo: UserPhoto,
    compressOptions: ImageCompressionOptions = {},
    ocrOptions: OcrBuildOptions = {},
  ): Promise<VisionBatchRequest> {
    return this.buildVisionOcrRequestFromInput(photo, compressOptions, ocrOptions);
  }

  /**
   * Compress an image for the web platform.
   * @param source The source image as a data URL or file path
   * @param opts Compression options
   * @returns The result of the compression, including the compressed image data
   */
  private async compressWeb(
    source: string,
    opts: {
      maxWidth: number;
      maxHeight: number;
      quality: number;
      mimeType: 'image/jpeg' | 'image/webp' | 'image/png';
      shouldResize: boolean;
      originalBytes: number;
    },
  ): Promise<ImageCompressionResult> {
    const img = await this.filePathService.loadImage(source);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;

    const { width, height } = opts.shouldResize
      ? this.filePathService.fitSize(srcW, srcH, opts.maxWidth, opts.maxHeight)
      : { width: srcW, height: srcH };

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    if (width !== srcW || height !== srcH) {
      await this.pica.resize(img, canvas, {
        quality: 3,
        unsharpAmount: 80,
        unsharpThreshold: 2,
      });
    } else {
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.drawImage(img, 0, 0);
    }

    const blob = await this.filePathService.canvasToBlob(
      canvas,
      opts.mimeType,
      opts.quality,
    );
    const base64 = await this.fileConversionService.blobToBase64(blob);

    return {
      base64,
      mimeType: opts.mimeType,
      width,
      height,
      originalBytes: opts.originalBytes,
      compressedBytes: blob.size,
      resized: opts.shouldResize || blob.size < opts.originalBytes,
    };
  }

  /**
   * Compress an image for the native platform.
   * @param source The source image as a file path
   * @param opts Compression options
   * @returns The result of the compression, including the compressed image data
   */
  private async compressNative(
    source: string,
    opts: {
      maxWidth: number;
      maxHeight: number;
      quality: number;
      mimeType: 'image/jpeg' | 'image/webp' | 'image/png';
      shouldResize: boolean;
      originalBytes: number;
    },
  ): Promise<ImageCompressionResult> {
    const dims = await ImageManipulator.getDimensions({ imagePath: source });

    let width = dims.width;
    let height = dims.height;
    let finalSource = source;
    let originalBytes = opts.originalBytes;

    if (!originalBytes) {
      const origBlob = await fetch(source).then((r) => r.blob());
      originalBytes = origBlob.size;
    }

    if (opts.shouldResize) {
      const resized = await ImageManipulator.resize({
        imagePath: source,
        maxWidth: opts.maxWidth,
        maxHeight: opts.maxHeight,
        quality: Math.round(opts.quality * 100),
        fixRotation: true,
      });

      width = resized.resizedWidth;
      height = resized.resizedHeight;
      finalSource = resized.webPath || resized.imagePath;
    }

    let fetchUrl = finalSource;
    if (fetchUrl.startsWith('file:')) {
      fetchUrl = Capacitor.convertFileSrc(fetchUrl);
    }

    const blob = await fetch(fetchUrl).then((r) => r.blob());
    const base64 = await this.fileConversionService.blobToBase64(blob);

    return {
      base64,
      mimeType: opts.mimeType,
      width,
      height,
      originalBytes,
      compressedBytes: blob.size,
      resized: opts.shouldResize || blob.size < originalBytes,
    };
  }
}