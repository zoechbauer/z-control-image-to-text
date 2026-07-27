import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { ImageManipulator } from '@capacitor-community/image-manipulator';
import pica from 'pica';

import type { ResizeOptions, ImageSize } from '../shared/image-compression.interfaces';
import { FileConversionService } from './file-conversion.service';
import { PhotoStorageService } from './photo-storage.service';

@Injectable({ providedIn: 'root' })
export class ImageResizeEngineService {
  private readonly photoStorageService = inject(PhotoStorageService);
  private readonly fileConversionService = inject(FileConversionService);
  private readonly pica = pica();

  /**
   * Compress an image for the web platform.
   * @param source The source image as a data URL or Blob URL.
   * @param opts The resize options including max dimensions, quality, and MIME type.
   * @returns An object containing the compressed image data, dimensions, and byte sizes.
   */
  async compressWeb(source: string, opts: ResizeOptions): Promise<{
    base64: string;
    mimeType: string;
    width: number;
    height: number;
    originalBytes: number;
    compressedBytes: number;
    resized: boolean;
  }> {
    const img = await this.loadImage(source);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    const { width, height } = opts.shouldResize
      ? this.fitSize(srcW, srcH, opts.maxWidth, opts.maxHeight)
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

    const blob = await this.canvasToBlob(canvas, opts.mimeType, opts.quality);
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
   * @param source The source image file path.
   * @param opts The resize options including max dimensions, quality, and MIME type.
   * @returns An object containing the compressed image data, dimensions, and byte sizes.
   */
  async compressNative(source: string, opts: ResizeOptions): Promise<{
    base64: string;
    mimeType: string;
    width: number;
    height: number;
    originalBytes: number;
    compressedBytes: number;
    resized: boolean;
  }> {
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

  /**
   * Load an image from the given source URL.
   * @param src The source URL of the image.
   * @returns A promise that resolves to the loaded HTMLImageElement.
   */
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = src;
    });
  }

  /**
   * Calculate the target size for an image to fit within the given maximum dimensions.
   * @param srcW The original width of the image.
   * @param srcH The original height of the image.
   * @param maxW The maximum allowed width.
   * @param maxH The maximum allowed height.
   * @returns The calculated width and height that fit within the maximum dimensions.
   */
  private fitSize(srcW: number, srcH: number, maxW: number, maxH: number): ImageSize {
    const maxLongSide = Math.max(maxW, maxH);
    const minLongSide = 800;
    const longSide = Math.max(srcW, srcH);

    if (longSide <= minLongSide) {
      return { width: srcW, height: srcH };
    }

    const targetLong = Math.min(longSide, maxLongSide);
    const scale = targetLong / longSide;

    return {
      width: Math.max(1, Math.round(srcW * scale)),
      height: Math.max(1, Math.round(srcH * scale)),
    };
  }

  /**
   * Convert a canvas element to a Blob object.
   * @param canvas The HTMLCanvasElement to convert.
   * @param mimeType The MIME type of the resulting Blob.
   * @param quality The quality of the resulting Blob (0 to 1).
   * @returns A promise that resolves to the resulting Blob.
   */
  private async canvasToBlob(
    canvas: HTMLCanvasElement,
    mimeType: string,
    quality: number,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'));
          resolve(blob);
        },
        mimeType,
        quality,
      );
    });
  }
}