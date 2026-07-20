export interface FilterMonthOption {
  value: string;
  display: string;
}
export interface ErrorType {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
  photoInfo?: PhotoInfo;
}

export interface PhotoInfo {
    info?: string;
    extractedText?: string;
}

export interface TextStatistics {
  wordCount: number;
  lineCount: number;
  characterCount: number;
}
