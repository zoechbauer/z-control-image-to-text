import { Injectable, inject } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';

import { ToastService } from './toast.service';
import {  UserPhoto } from './../shared/app.interfaces';
import { PhotoStorageService } from './photo-storage.service';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private readonly toast = inject(ToastService);
  private readonly photoStorageService = inject(PhotoStorageService);
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
   * @param source The source of the photo, either CameraSource.Camera or CameraSource.Photos.
   */
  public async makePhoto() {
    await this.capturePhoto(CameraSource.Camera);
  }

  /**
   * Selects a photo from the device's photo gallery.
   * This method uses the Capacitor Camera plugin to open the photo gallery 
   * and allows the user to select a photo.
   * The selected photo is then saved and added to the list of photos.
   */
  public async selectPhoto() {
    await this.capturePhoto(CameraSource.Photos);
  }

  /**
   * Captures a photo using the specified source (camera or photo gallery).
   *
   * @param source The source of the photo, either CameraSource.Camera or CameraSource.Photos.
   */
  private async capturePhoto(source: CameraSource) {
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: source,
      quality: 100,
    });

    await this.saveCapturedPhoto(capturedPhoto);
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

  /**
   * Deletes all photos from the storage and clears the list of photos.
   * This method removes all photos from the storage and updates the list of photos to be empty.
   * It also displays a toast message indicating that all photos have been deleted.
   */
  public async deleteAllPhotos() {
    await this.photoStorageService.deleteAllPhotos();
  }

  /**
   * Deletes a specific photo from the storage and updates the list of photos.
   *
   * @param photo The photo to delete.
   */
  public async deletePhoto(photo: UserPhoto) {
      this.photos = this.photos.filter((p) => p.filepath !== photo.filepath);
      await this.photoStorageService.deletePhoto(photo);
  }

}
