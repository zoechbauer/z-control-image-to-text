import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';

import { ToastService } from './toast.service';
import { UserPhoto } from './../shared/app.interfaces';
import { PhotoStorageService } from './photo-storage.service';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private readonly translate = inject(TranslateService);
  private readonly toast = inject(ToastService);
  private readonly photoStorageService = inject(PhotoStorageService);
  private readonly alertService = inject(AlertService);
  public photos: UserPhoto[] = [];

  /**
   * Initializes the PhotoService by subscribing to the photo storage service's photos observable.
   * This ensures that the service maintains an up-to-date list of photos.
   */
  constructor() {
    this.photoStorageService.photos$.subscribe((photos) => {
      this.photos = photos;
    });
  }

  /**
   * Captures a photo using the device camera or selects a photo from the gallery.
   * The photo is then saved and added to the list of photos.
   * @param source The source of the photo, either CameraSource.Camera or CameraSource.Photos.
   * @returns A promise that resolves to true if a photo was selected successfully,
   *          otherwise false.
   */
  public async makePhoto(): Promise<boolean> {
    return await this.capturePhoto(CameraSource.Camera);
  }

  /**
   * Selects a photo from the device's photo gallery.
   * This method uses the Capacitor Camera plugin to open the photo gallery
   * and allows the user to select a photo.
   * The selected photo is then saved and added to the list of photos.
   * @returns A promise that resolves to true if a photo was selected successfully,
   *          otherwise false.
   */
  public async selectPhoto(): Promise<boolean> {
    return await this.capturePhoto(CameraSource.Photos);
  }

  /**
   * Captures a photo using the specified source (camera or photo gallery).
   * If the photo is captured or selected successfully, it is saved and added to the
   * list of photos. If the user cancels the operation or an error occurs,
   * a toast message is displayed.
   *
   * @param source The source of the photo, either CameraSource.Camera or CameraSource.Photos.
   * @returns A promise that resolves to true if a photo was captured successfully,
   *          otherwise false.
   */
  private async capturePhoto(source: CameraSource): Promise<boolean> {
    try {
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: source,
        quality: 100,
      });

      await this.saveCapturedPhoto(capturedPhoto);
      return true;
    } catch (error) {
      // user cancelled the photo capture or selection, or an error occurred
      this.handlePhotoCaptureError(error, source);
      return false;
    }
  }

  /**
   * Handles errors that occur during photo capture or selection.
   * If the user cancels the operation, a toast message is displayed.
   * Otherwise, the error is logged to the console and an error message is shown to the user.
   *
   * @param error The error that occurred.
   * @param source The source of the photo, either CameraSource.Camera or CameraSource.Photos.
   */
  private handlePhotoCaptureError(error: any, source: CameraSource) {
    let errorMessage = '';

    if (error instanceof Error && error.message.includes('User cancelled')) {
      errorMessage =
        source === CameraSource.Camera
          ? this.translate.instant('FEATURE.TOAST.PHOTO_CAPTURE_CANCELLED')
          : this.translate.instant('FEATURE.TOAST.PHOTO_SELECTION_CANCELLED');
    } else {
      console.error('Error capturing or selecting photo:', error);
      errorMessage =
        source === CameraSource.Camera
          ? this.translate.instant('FEATURE.TOAST.ERROR_PHOTO_CAPTURE')
          : this.translate.instant('FEATURE.TOAST.ERROR_PHOTO_SELECTION');
    }
    
    this.toast.showToast(errorMessage);
  }

  /**
   * Saves the captured photo to the storage and updates the list of photos.
   *
   * @param capturedPhoto The photo captured using the camera or selected from the gallery.
   */
  private async saveCapturedPhoto(capturedPhoto: Photo) {
    await this.savePhoto(capturedPhoto);
    await this.photoStorageService.cachePhotos();
  }

  /**
   * Saves a photo to the storage.
   *
   * @param photo The photo to save.
   * @returns The saved photo as a UserPhoto object.
   */
  public async savePhoto(photo: Photo): Promise<UserPhoto> {
    return await this.photoStorageService.savePhoto(photo);
  }
}
