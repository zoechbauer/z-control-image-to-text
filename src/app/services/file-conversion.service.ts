import { Injectable } from '@angular/core';

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
    const mimeMatch = parts[0]?.match(/data:([^;]+);base64/) || [];
    const mime = mimeMatch[1] || 'application/octet-stream';
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  }
}