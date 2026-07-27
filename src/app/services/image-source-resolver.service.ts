import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

import { UserPhoto } from '../shared/app.interfaces';
import { ImageCompressionInput, ResolvedImageSource } from '../shared/image-compression.interfaces';
import { FileConversionService } from './file-conversion.service';

@Injectable({ providedIn: 'root' })
export class ImageSourceResolverService {
  private readonly fileConversionService = inject(FileConversionService);

  /**
   * Resolves the main and webview sources for the given image input.
   *
   * @param input The image input, which can be a UserPhoto, a data URL, a Blob, 
   *              or a base64 string.
   * @returns An object containing the main and webview sources, and a 
   *              flag indicating if it's a user photo.
   */
  async resolve(input: ImageCompressionInput): Promise<ResolvedImageSource> {
    if (this.isUserPhoto(input)) {
      if (Capacitor.isNativePlatform()) {
        return {
          main: input.filepath,
          webview: input.webviewPath ?? Capacitor.convertFileSrc(input.filepath),
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

    const dataUrl = await this.fileConversionService.blobToDataUrl(input);
    return { main: dataUrl, webview: dataUrl, isUserPhoto: false };
  }

  /**
   * Checks if the given input is a UserPhoto object.
   *
   * @param input The image input to check.
   * @returns True if the input is a UserPhoto, false otherwise.
   */
  private isUserPhoto(input: ImageCompressionInput): input is UserPhoto {
    return typeof input === 'object' && input !== null && 'filepath' in input;
  }
}