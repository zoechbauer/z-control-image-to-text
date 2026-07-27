import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

import { UserPhoto, ResolvedImageSource } from '../shared/app.interfaces';
import { FileExtension, FileNamePrefix } from '../shared/enums';

@Injectable({
  providedIn: 'root',
})
export class FilePathService {
  private fileName: string = '';

  /**
   * Gets the path to the documents directory for the current file.
   *
   * @returns The path to the documents directory.
   */
  async getDocumentsPath(
    getUri: (args: {
      path: string;
      directory: any;
    }) => Promise<{ uri: string }>,
    directory: any,
  ): Promise<string> {
    const result = await getUri({
      path: this.fileName,
      directory,
    });

    // Remove the "file://" prefix
    let path = result.uri;
    if (path.startsWith('file://')) {
      path = path.slice(7);
    }
    return path;
  }

  /**
   * Generates a file name with the given prefix and extension.
   * @param filePrefix The prefix for the file name.
   * @param fileExtension The extension for the file name. Defaults to JPEG.
   * @returns The generated file name.
   */
  getFileName(
    filePrefix: FileNamePrefix,
    fileExtension: FileExtension = FileExtension.JPEG,
  ): string {
    this.fileName = `${filePrefix}_${this.generateTimestamp()}.${fileExtension}`;
    return this.fileName;
  }

  /**
   * Extracts the file name from a given file path.
   * @param filepath The full file path.
   * @returns The extracted file name.
   */
  getFilenameFromFilepath(filepath: string): string {
    if (!filepath) return filepath;
    // strip file:// prefix if present
    const p = filepath.startsWith('file://') ? filepath.slice(7) : filepath;
    return p.substring(p.lastIndexOf('/') + 1);
  }

  /**
   * Resolves the image source for different types of input.
   * @param input The input image source, which can be a UserPhoto, File, Blob, or string.
   * @returns An object containing the main image source, an optional webview source,
   *          and a flag indicating if it's a UserPhoto.
   */
  resolveImageSource(
    input: UserPhoto | File | Blob | string,
  ): ResolvedImageSource {
    if (this.isUserPhoto(input)) {
      if (Capacitor.isNativePlatform()) {
        return {
          main: input.filepath,
          webview:
            input.webviewPath ?? Capacitor.convertFileSrc(input.filepath),
          isUserPhoto: true,
        };
      }

      return {
        main: input.webviewPath || input.filepath,
        webview: input.webviewPath,
        isUserPhoto: true,
      };
    }

    if (typeof input === 'string') {
      if (
        input.startsWith('data:') ||
        input.startsWith('blob:') ||
        input.startsWith('file:') ||
        input.startsWith('http')
      ) {
        return { main: input, webview: input, isUserPhoto: false };
      }

      return {
        main: `data:image/jpeg;base64,${input}`,
        webview: `data:image/jpeg;base64,${input}`,
        isUserPhoto: false,
      };
    }

    return { main: '', webview: '', isUserPhoto: false };
  }

  /**
   * Gets the size in bytes of the source image, whether it's a base64 string or a URL.
   * @param source The source image, which can be a base64 string or a URL.
   * @returns A promise that resolves to the size in bytes of the source image.
   * @throws An error if the source is not a valid base64 string or URL.
   */
  async getSourceBytes(source: string): Promise<number> {
    if (source.startsWith('data:')) {
      const comma = source.indexOf(',');
      const base64 = comma >= 0 ? source.substring(comma + 1) : source;
      return (
        Math.floor((base64.length * 3) / 4) -
        (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0)
      );
    }

    const blob = await fetch(source).then((r) => r.blob());
    return blob.size;
  }

  /**
   * Gets the dimensions (width and height) of an image from a given source URL or base64 string.
   * @param source The source of the image, which can be a URL or a base64 string.
   * @returns A promise that resolves to an object containing the width and height of the image.
   * @throws An error if the image cannot be loaded or if the source is invalid.
   */
  async getDimensions(
    source: string,
  ): Promise<{ width: number; height: number }> {
    const img = await this.loadImage(source);
    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
    };
  }

  /**
   * Loads an image from a given source URL or base64 string.
   * @param src The source of the image, which can be a URL or a base64 string.
   * @returns A promise that resolves to an HTMLImageElement once the image is loaded.
   * @throws An error if the image cannot be loaded.
   */
  loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = src;
    });
  }

  /**
   * Calculates the target width and height for an image while maintaining its aspect ratio.
   * If the image is smaller than the specified maximum dimensions, it will not be resized.
   * @param srcW The original width of the image.
   * @param srcH The original height of the image.
   * @param maxW The maximum allowed width of the image.
   * @param maxH The maximum allowed height of the image.
   * @returns An object containing the calculated width and height of the image while maintaining its aspect ratio.
   */
  fitSize(srcW: number, srcH: number, maxW: number, maxH: number) {
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
   * Converts a canvas element to a Blob object.
   * @param canvas The canvas element to convert.
   * @param mimeType The MIME type of the resulting Blob (e.g., 'image/jpeg').
   * @param quality The quality of the resulting Blob (a number between 0 and 1,
   *               applicable for image/jpeg and image/webp).
   */
  async canvasToBlob(
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

  /**
   * Generates a timestamp string in the format YYYYMMDD_HHMMSS.
   * This timestamp is used for creating unique file names.
   * @returns The generated timestamp string.
   */
  generateTimestamp(): string {
    const now = new Date(Date.now());
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate(),
    )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }

  private isUserPhoto(input: any): input is UserPhoto {
    return typeof input === 'object' && input !== null && 'filepath' in input;
  }
}
