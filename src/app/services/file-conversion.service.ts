import { Injectable } from '@angular/core';
import { UserPhoto } from '../shared/app.interfaces';

@Injectable({
  providedIn: 'root',
})
export class FileConversionService {
  /**
   * Converts a Blob object to a data URL.
   * @param blob The Blob object to convert.
   * @returns A promise that resolves to the data URL representation of the Blob.
   */
  async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Converts a Blob object to a base64 string.
   * @param blob The Blob object to convert.
   * @returns A promise that resolves to the base64 representation of the Blob.
   */
  async blobToBase64(blob: Blob): Promise<string> {
    const dataUrl = await this.blobToDataUrl(blob);
    const comma = dataUrl.indexOf(',');
    return comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
  }

  /**
   * Converts a base64 string or data URL to a Blob object.
   * @param base64OrDataUrl The base64 string or data URL to convert.
   * @returns The Blob representation of the base64 string or data URL.
   */
  base64ToBlob(base64OrDataUrl: string): Blob {
    const parts = base64OrDataUrl.split(',');
    const base64 = parts.length > 1 ? parts[1] : parts[0];
    const mimeMatch = /data:([^;]+);base64/.exec(parts[0] ?? '') || [];
    const mime = mimeMatch[1] || 'application/octet-stream';
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.codePointAt(i) ?? 0;
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  }

  /**
   * Retrieves the data URL representation of the specified UserPhoto.
   * @param photo The UserPhoto object containing the photo data.
   * @returns A promise that resolves to the data URL of the photo.
   */
  async getImageDataUrl(photo: UserPhoto): Promise<string> {
    const imageUrl = photo.webviewPath || '';
    if (!imageUrl) return '';

    if (imageUrl.startsWith('data:image/')) {
      return imageUrl;
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.status}`);
      }

      const blob = await response.blob();
      const dataUrl = await this.blobToDataUrl(blob);

      if (!dataUrl.startsWith('data:image/')) {
        throw new Error('Converted value is not a valid image data URL');
      }

      return dataUrl;
    } catch (err) {
      console.error('Failed to convert image to data URL', err);
      return '';
    }
  }

  /**
   * Converts a data URL to a Blob object synchronously.
   * @param dataUrl The data URL to convert.
   * @returns The Blob representation of the data URL.
   */
  dataUrlToBlobSync(dataUrl: string): Blob {
    const [header, base64Data] = dataUrl.split(',');
    const mimeMatch = /data:(.*?);base64/.exec(header) || [];
    const mimeType = mimeMatch?.[1] || 'image/png';

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.codePointAt(i) ?? 0;
    }

    return new Blob([bytes], { type: mimeType });
  }
}