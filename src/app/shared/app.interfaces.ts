export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  photoInfo?: PhotoInfo;
}
export interface PhotoInfo {
  title?: string;
  description?: string;
  extractedText?: string;
}
export interface RecognizeInputData {
  imageBase64: string;
  mode: 'document' | 'image';
}
export interface RecognizeResult {
  text: string;
  featureType: string;
}
export interface ResolvedImageSource {
  main: string;
  webview?: string;
  isUserPhoto: boolean;
}
export interface FilterMonthOption {
  value: string;
  display: string;
}
export interface ErrorType {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
export interface TextStatistics {
  wordCount: number;
  lineCount: number;
  characterCount: number;
}
