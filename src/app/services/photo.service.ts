import { Injectable, inject } from '@angular/core';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';

import { ToastService } from './toast.service';
import {  UserPhoto } from './../shared/app.interfaces';
import { FileUtilsService } from './file-utils.service';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private readonly toast = inject(ToastService);
  private readonly fileUtilsService = inject(FileUtilsService);
  
  public photos: UserPhoto[] = [];

  constructor() {
    this.fileUtilsService.photos$.subscribe((photos) => {
      this.photos = photos;
    });
  }


  public async makePhoto() {
    await this.capturePhoto(CameraSource.Camera);
  }

  public async selectPhoto() {
    await this.capturePhoto(CameraSource.Photos);
  }

  public getLastPhoto(): UserPhoto | undefined {
    console.log('getLastPhoto', this.photos.length, this.photos);
    if (this.photos.length > 0) {
      return this.photos[0];
    }
    return undefined;
  }

  private async capturePhoto(source: CameraSource) {
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: source,
      quality: 100,
    });

    await this.saveCapturedPhoto(capturedPhoto);
  }

  private async saveCapturedPhoto(capturedPhoto: Photo) {
    const savedImageFile = await this.savePhoto(capturedPhoto);
    this.photos.unshift(savedImageFile);

    await this.fileUtilsService.cachePhotos();
  }

  public async savePhoto(photo: Photo): Promise<UserPhoto> {
    return await this.fileUtilsService.savePhoto(photo);
  }

  public async deleteAllPhotos() {
    await this.fileUtilsService.deleteAllPhotos();
  }

  public async deletePhoto(photo: UserPhoto) {
      this.photos = this.photos.filter((p) => p.filepath !== photo.filepath);
      await this.fileUtilsService.deletePhoto(photo);
  }

}
