import type { UserPhoto } from './app.interfaces';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0..1
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
  forceResize?: boolean;
}

export interface ImageCompressionResult {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
  resized: boolean;
}

export type ImageCompressionInput = File | Blob | string | UserPhoto;

export interface ResolvedImageSource {
  main: string;
  webview?: string;
  isUserPhoto: boolean;
}

export interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  mimeType: 'image/jpeg' | 'image/webp' | 'image/png';
  shouldResize: boolean;
  originalBytes: number;
}

export interface ImageSize {
  width: number;
  height: number;
}
