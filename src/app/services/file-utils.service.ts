import { inject, Inject, Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Directory } from '@capacitor/filesystem';
import { Photo } from '@capacitor/camera';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

import { AlertService } from './alert.service';
import { ToastService } from './toast.service';
import { FILESYSTEM, FilesystemLike } from './filesystem.token';
import { FileExtension, FileNamePrefix } from '../shared/enums';
import { UserPhoto } from '../shared/app.interfaces';

@Injectable({
  providedIn: 'root',
})
export class FileUtilsService {
  private readonly storage = inject(Storage);
  private readonly alertService = inject(AlertService);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly toastService = inject(ToastService);

  private readonly PHOTO_STORAGE: string = 'photos';
  private readonly photosSubject = new BehaviorSubject<UserPhoto[]>([]);
  public photos$ = this.photosSubject.asObservable();
  private photos: UserPhoto[] = [];
  private fileName: string = '';

  constructor(
    @Inject(FILESYSTEM) private readonly filesystem: FilesystemLike,
  ) {}

  /**
   * Initializes the Ionic Storage instance. 
   * This method should be called before any storage operations are performed.
   * It ensures that the storage is ready for use and prevents potential errors 
   * related to uninitialized storage.
   */
  async initStorage() {
    await this.storage.create();
  }

  /**
   * Gets the path to the documents directory for the current file.
   *
   * @returns The path to the documents directory.
   */
  async getDocumentsPath(): Promise<string> {
    const result = await this.filesystem.getUri({
      path: this.fileName,
      directory: Directory.Documents,
    });

    // Remove the "file://" prefix
    let path = result.uri;
    if (path.startsWith('file://')) {
      path = path.slice(7);
    }
    return path;
  }

  /**
   * Saves a photo to the filesystem.
   *
   * @param photo The photo to save.
   * @returns The saved photo as a UserPhoto object.
   */
  async savePhoto(photo: Photo): Promise<UserPhoto> {
    // base64 format is required by FileSystem API to save
    const base64Data = await this.readAsBase64(photo);

    // write file to data directory
    const fileName = this.getFileName(FileNamePrefix.ImageToText);
    console.log('savePhoto - fileName:', fileName);
    const savedFile = await this.filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Documents,
    });
    console.log('savePhoto - savedFile:', savedFile);

    if (Capacitor.isNativePlatform()) {
      // Display the new image by rewriting the 'file://' path to HTTP
      // Details: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      // do not use webPath to display the new image instead of base64
      // because this is already loaded in memory, because it is not stored
      // in the filesystem and will be lost after app restart
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      const base64Data = (await this.blobToDataUrl(blob)) as string;
      return {
        filepath: fileName,
        webviewPath: base64Data,
      };
    }
  }

  /**
   * Reads a photo as a base64 string.
   * This method handles both native and web platforms, converting the photo
   * to base64 format as required by the FileSystem API for saving.
   * @param photo The photo to read as a base64 string.
   * @returns The photo as a base64 string.
   */
  private async readAsBase64(photo: Photo) {
    console.log('readAsBase64 - photo:', photo);
    if (Capacitor.isNativePlatform()) {
      // read file into base64
      const file = await this.filesystem.readFile({
        path: photo.path!,
      });

      return file.data;
    } else {
      // fetch photo, read as blob then convert to base64
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();

      return (await this.blobToBase64(blob)) as string;
    }
  }

  /**
   * Loads saved photos from cache and updates the observable.
   * Note: This method should be called during component initialization
   * to ensure that the photos are available for display.
   *
   * On mobiles, photos are stored in filesystem/documents.
   * On web, photos are stored in localStorage.
   */
  async loadSavedPhotos() {
    const loading = await this.loadingCtrl.create({
      message: 'Fotos werden geladen ...',
    });
    await loading.present();

    await this.getPhotosFromCache();

    if (!Capacitor.isNativePlatform()) {
      for (let photo of this.photos) {
        try {
          if (!photo.webviewPath?.startsWith('data:')) {
            continue;
          }
          if (photo.webviewPath?.startsWith('blob:')) {
            // blob URLs are not persistent — log and clear or set placeholder
            console.warn(
              'Blob URL not persistent; image not available after reload',
              photo.webviewPath,
            );
          }
        } catch (error) {
          const errorMessage = 'Foto konnte nicht geladen werden!';
          console.error(errorMessage, error);
          // this.toast.displayToast({ message: errorMessage, type: 'error' });
          this.toastService.showToast(errorMessage);
        }
      }
      this.photosSubject.next(this.photos);
    }

    loading.dismiss();
  }

  /**
   * Caches the current list of photos to local storage.
   * This method should be called whenever the list of photos is updated
   * (e.g., after adding or deleting a photo) to ensure that the cache remains up-to-date.
   */
  async cachePhotos() {
    try {
      await this.storage.set(this.PHOTO_STORAGE, JSON.stringify(this.photos));
    } catch (error) {
      console.error('Error saving photos to storage:', error);
    }
    this.photosSubject.next(this.photos);
  }

  /**
   * Retrieves the list of photos from local storage and updates the observable.
   * This method should be called during component initialization to ensure that
   * the photos are available for display. It handles both native and web platforms.
   * On mobiles, photos are stored in filesystem/documents.
   * On web, photos are stored in localStorage.
   */
  public async getPhotosFromCache() {
    try {
      const value = await this.storage.get(this.PHOTO_STORAGE);
      this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];
      this.photosSubject.next(this.photos);
    } catch (error) {
      console.error('Error loading photos from storage:', error);
    }
  }

  /**
   * Deletes all photos from the filesystem and clears the cache.
   * This method checks for necessary permissions before attempting deletion.
   * @returns A promise that resolves when all photos have been deleted.
   */
  public async deleteAllPhotos() {
    // TODO implement confirmDeleteAllPhotos
    // if (await this.confirmDeleteAllPhotos()) {

    // check permissions
    if (!(await this.checkFilesystemPermission())) {
      console.log('Storage permission not granted, skipping file deletion');
      return;
    }
    const numberOfPhotos = this.photos.length;
    for (let i = 0; i < numberOfPhotos; i++) {
      await this.deletePhoto(this.photos[0]);
    }
    const successMessage = 'alle Fotos wurden gelöscht!';
    // this.toast.displayToast({ message: successMessage, type: 'success' });
    this.toastService.showToast(successMessage);
    // }
  }

  /**
   * Deletes a specific photo from the filesystem and updates the cache.
   * This method checks for necessary permissions before attempting deletion.
   * @param photo The photo to delete.
   * @returns A promise that resolves when the photo has been deleted.
   */
  public async deletePhoto(photo: UserPhoto) {
    console.log('deletePhoto - deleting photo:', photo);
    console.log(
      'Capacitor.convertFileSrc:',
      Capacitor.convertFileSrc(photo.filepath),
    );
    const filename = this.getFilenameFromFilepath(photo.filepath);
    console.log('deletePhoto - filename:', filename);
    try {
      await this.filesystem.deleteFile({
        path: filename,
        directory: Directory.Documents,
      });

      this.photos = this.photos.filter((p) => p.filepath !== photo.filepath);

      await this.cachePhotos();

      const successMessage = 'Foto wurde gelöscht!';
      this.toastService.showToast(successMessage);
    } catch (error) {
      const errorMessage = 'Foto konnte nicht gelöscht werden!';
      console.error(errorMessage, error);
      this.toastService.showToast(errorMessage);
    }
  }

  /**
   * Saves a file to the filesystem.
   * On mobile, it uses the Capacitor Filesystem API.
   * On web, it creates a download link for the file.
   * @param fileName The name of the file to save.
   * @param data The file data as a base64 string.
   */
  async saveFile(fileName: string, data: string) {
    console.log('saveFile - fileName:', fileName);
    if (Capacitor.isNativePlatform()) {
      // use Capacitor Filesystem API for mobiles
      try {
        await this.filesystem.writeFile({
          path: fileName,
          data: data,
          directory: Directory.Documents,
        });
      } catch (error) {
        console.error('Error saving file:', error);
        this.alertService.showStoragePermissionError();
      }
    } else {
      // for Desktop/Web: create a download link
      const blob = this.base64ToBlob(data);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      console.log('WEB: File download url:', url);
    }
  }

  /**
   * Downloads a file from the given URL and saves it to the filesystem.
   * @param fileDownloadLink The URL of the file to download.
   * @returns A promise that resolves to true if the file was successfully 
   *          downloaded and saved, false otherwise.
   */
  async downloadFile(fileDownloadLink: string): Promise<boolean> {
    if (!fileDownloadLink?.trim()) {
      console.error('File URL is not available');
      this.alertService.showErrorAlert(
        'FEATURE.TOAST.ERROR__MISSING_DOWNLOAD_URL',
      );
      return false;
    }

    if (!(await this.checkAndRequestFilesystemPermission())) {
      return false;
    }

    try {
      const response = await fetch(fileDownloadLink);
      const blob = await response.blob();
      const base64Data = await this.blobToBase64(blob);

      await this.saveFile(this.fileName, base64Data);
      return true;
    } catch (error) {
      console.error('Error saving file in downloadFile:', error);
      this.alertService.showStoragePermissionError();
      return false;
    }
  }

  /**
   * Checks if the app has permission to access the filesystem.
   * If the app is running on a native platform, it checks the publicStorage permission.
   * @returns A promise that resolves to true if permission is granted, false otherwise.
   */
  private async checkFilesystemPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    try {
      const permissions = await this.filesystem.checkPermissions();

      if (permissions.publicStorage === 'granted') {
        return true;
      } else {
        return false;
      }
    } catch (permissionError) {
      console.warn(
        'Permission check failed, continuing anyway:',
        permissionError,
      );
    }
    return true;
  }

  /**
   * Checks if the app has permission to access the filesystem and requests it if not granted.
   * @returns A promise that resolves to true if permission is granted, false otherwise.
   */
  private async checkAndRequestFilesystemPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }
    try {
      const permissions = await this.filesystem.checkPermissions();

      if (permissions.publicStorage === 'granted') {
        return true;
      } else {
        // request missing permission
        const requestResult = await this.filesystem.requestPermissions();

        if (requestResult.publicStorage !== 'granted') {
          console.error('Storage permission denied by user');
          this.alertService.showStoragePermissionError();
          return false;
        } else {
          return true;
        }
      }
    } catch (permissionError) {
      console.warn(
        'Permission check failed, continuing anyway:',
        permissionError,
      );
      // Continue - older Android versions might not support this
    }
    return true;
  }

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

  /**
   * Generates a file name with the given prefix and extension.
   * @param filePrefix The prefix for the file name.
   * @param fileExtension The extension for the file name. Defaults to JPEG.
   * @returns The generated file name.
   */
  private getFileName(
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
  private getFilenameFromFilepath(filepath: string): string {
    if (!filepath) return filepath;
    // strip file:// prefix if present
    const p = filepath.startsWith('file://') ? filepath.slice(7) : filepath;
    return p.substring(p.lastIndexOf('/') + 1);
  }

  /**
   * Generates a timestamp string in the format YYYYMMDD_HHMMSS.
   * This timestamp is used for creating unique file names.
   * @returns The generated timestamp string.
   */
  private generateTimestamp(): string {
    const now = new Date(Date.now());
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
      now.getDate(),
    )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  }
}
