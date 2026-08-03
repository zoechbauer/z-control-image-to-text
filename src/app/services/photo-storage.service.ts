import { inject, Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';
import { Directory } from '@capacitor/filesystem';
import { Photo } from '@capacitor/camera';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

import { AlertService } from './alert.service';
import { ToastService } from './toast.service';
import { FILESYSTEM, FilesystemLike } from './filesystem.token';
import { FileNamePrefix, ToastAnchor } from '../shared/enums';
import { PhotoInfo, UserPhoto } from '../shared/app.interfaces';
import { FileConversionService } from './file-conversion.service';
import { FilePathService } from './file-path.service';

@Injectable({
  providedIn: 'root',
})
export class PhotoStorageService {
  private readonly translate = inject(TranslateService);
  private readonly storage = inject(Storage);
  private readonly alertService = inject(AlertService);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly toastService = inject(ToastService);
  private readonly fileConversionService = inject(FileConversionService);
  private readonly filePathService = inject(FilePathService);
  private readonly filesystem: FilesystemLike = inject(FILESYSTEM);

  private readonly PHOTO_STORAGE: string = 'photos';
  private readonly photosSubject = new BehaviorSubject<UserPhoto[]>([]);
  public photos$ = this.photosSubject.asObservable();
  private photos: UserPhoto[] = [];
  private readonly fileName: string = '';

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
    if (!(await this.checkAndRequestFilesystemPermission())) {
      this.alertService.showStoragePermissionError();
      throw new Error('Storage permission denied');
    }
    let savedPhoto: UserPhoto;
    // base64 format is required by FileSystem API to save
    const base64Data = await this.readAsBase64(photo);

    // write file to data directory
    const fileName = this.filePathService.getFileName(
      FileNamePrefix.ImageToText,
    );
    const savedFile = await this.filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Documents,
    });

    if (Capacitor.isNativePlatform()) {
      // Display the new image by rewriting the 'file://' path to HTTP
      // Details: [https://ionicframework.com/docs/building/webview#file-protocol](https://ionicframework.com/docs/building/webview#file-protocol)
      savedPhoto = {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      // do not use webPath to display the new image instead of base64
      // because this is already loaded in memory, because it is not stored
      // in the filesystem and will be lost after app restart
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      const base64Data = (await this.fileConversionService.blobToDataUrl(
        blob,
      )) as string;
      savedPhoto = {
        filepath: fileName,
        webviewPath: base64Data,
      };
    }
    this.photos.unshift(savedPhoto);
    return savedPhoto;
  }

  /**
   * Reads a photo as a base64 string.
   * This method handles both native and web platforms, converting the photo
   * to base64 format as required by the FileSystem API for saving.
   * @param photo The photo to read as a base64 string.
   * @returns The photo as a base64 string.
   */
  private async readAsBase64(photo: Photo) {
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

      return (await this.fileConversionService.blobToBase64(blob)) as string;
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
      message: this.translate.instant('FEATURE.LOADING.LOADING_PHOTOS'),
    });
    await loading.present();

    await this.getPhotosFromCache();

    if (!Capacitor.isNativePlatform()) {
      let loadingErrorOccurred = false;
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
          console.error('photo.webviewPath is not available or invalid', error);
          loadingErrorOccurred = true;
        }
      }
      if (loadingErrorOccurred) {
        const errorMessage = this.translate.instant(
          'TOAST.ERROR_LOADING_PHOTOS',
        );
        this.toastService.showToast(errorMessage);
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
   */
  public async deleteAllPhotos(): Promise<boolean> {
    // check permissions
    if (!(await this.checkFilesystemPermission())) {
      console.warn('Storage permission not granted, skipping file deletion');
      this.alertService.showStoragePermissionError();
      return false;
    }
    const numberOfPhotos = this.photos.length;
    for (let i = 0; i < numberOfPhotos; i++) {
      await this.deletePhoto(this.photos[0]);
    }
    return true;
  }

  /**
   * Deletes a specific photo from the filesystem and updates the cache.
   * This method checks for necessary permissions before attempting deletion.
   * @param photo The photo to delete.
   * @returns A promise that resolves to true when the photo has been deleted.
   */
  public async deletePhoto(photo: UserPhoto): Promise<boolean> {
    // check permissions
    if (!(await this.checkFilesystemPermission())) {
      console.warn('Storage permission not granted, skipping file deletion');
      this.alertService.showStoragePermissionError();
      return false;
    }

    const filename = this.filePathService.getFilenameFromFilepath(
      photo.filepath,
    );
    try {
      await this.filesystem.deleteFile({
        path: filename,
        directory: Directory.Documents,
      });

      this.photos = this.photos.filter((p) => p.filepath !== photo.filepath);

      await this.cachePhotos();
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
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
    if (Capacitor.isNativePlatform()) {
      if (!(await this.checkAndRequestFilesystemPermission())) {
        this.alertService.showStoragePermissionError();
        throw new Error('Storage permission denied');
      }
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
      const blob = this.fileConversionService.base64ToBlob(data);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
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
      console.error(`File URL '${fileDownloadLink}' is not available`);
      this.toastService.showToast(
        this.translate.instant('FEATURE.TOAST.ERROR_MISSING_DOWNLOAD_URL'),
        ToastAnchor.MainPage,
      );
      return false;
    }

    if (!(await this.checkAndRequestFilesystemPermission())) {
      return false;
    }

    try {
      const response = await fetch(fileDownloadLink);
      const blob = await response.blob();
      const base64Data = await this.fileConversionService.blobToBase64(blob);

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
   * Updates the photo information for a given photo and caches the updated list of photos.
   * @param photo The photo to update.
   * @param photoInfo The new photo information to merge with the existing info.
   * @returns A promise that resolves to the updated UserPhoto object.
   */
  async updatePhotoInfo(
    photo: UserPhoto,
    photoInfo: Partial<PhotoInfo>,
  ): Promise<UserPhoto> {
    const existingInfo = photo.photoInfo ?? {};
    // update createdAt and modifiedAt timestamps
    if (!existingInfo.createdAt) {
      photoInfo.createdAt = existingInfo.createdAt ?? new Date().toISOString();
    } else {
      photoInfo.modifiedAt = new Date().toISOString();
    };

    const updatedPhoto: UserPhoto = {
      ...photo,
      photoInfo: {
        ...existingInfo,
        ...photoInfo,
      },
    };

    this.photos = this.photos.map((p) =>
      p.filepath === updatedPhoto.filepath ? updatedPhoto : p,
    );
    this.cachePhotos();
    return updatedPhoto;
  }

  /**
   * Returns a user-friendly message indicating that no text has been extracted from the photo.
   * If the photo has no metadata, the user did not extract text from the photo. 
   * If the photo has metadata but no extracted text, the photo has no extracted text.
   * @param photo The photo to check.
   * @returns The translated message to display to the user.
   */
  getNoExtractedTextInfo(photo: UserPhoto): string {
    if (!photo.photoInfo) {
      return this.translate.instant('FEATURE.CARD.LABEL.NO_EXTRACTED_TEXT_NO_METADATA_INFO');
    }
    if (!photo.photoInfo?.extractedText) {
      return this.translate.instant('FEATURE.CARD.LABEL.NO_EXTRACTED_TEXT_FOUND');
    }
    return '';
  }

  /**
   * Returns the next photo in the list relative to the current photo.
   * @param currentPhoto The current photo.
   * @returns The next photo, or null if there is no next photo.
   */
  getNextPhoto(currentPhoto: UserPhoto): UserPhoto | null {
    const currentIndex = this.photos.findIndex(
      (photo) => photo.filepath === currentPhoto.filepath,
    );
    if (currentIndex >= 0 && currentIndex < this.photos.length - 1) {
      return this.photos[currentIndex + 1];
    }
    return null;
  }

  /**
   * Returns the previous photo in the list relative to the current photo.
   * @param currentPhoto The current photo.
   * @returns The previous photo, or null if there is no previous photo.
   */
  getPreviousPhoto(currentPhoto: UserPhoto): UserPhoto | null {
    const currentIndex = this.photos.findIndex(
      (photo) => photo.filepath === currentPhoto.filepath,
    );
    if (currentIndex > 0) {
      return this.photos[currentIndex - 1];
    }
    return null;
  }
}
