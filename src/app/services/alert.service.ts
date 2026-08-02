import { inject, Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { UserPhoto } from '../shared/app.interfaces';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  // important: you cannot use html tags e.g. <br> in the alert messages, because it will not be rendered correctly
  // use '\n' for line breaks instead, which will be rendered correctly in the alert for mobile but not for web

  private readonly alertController = inject(AlertController);
  private readonly translate = inject(TranslateService);

  /**
   * Shows an alert indicating that storage permission is required to save a photo.
   * This alert is displayed when the app does not have the necessary permissions to access storage.
   * The user is informed about the permission requirement and can acknowledge the message by clicking "OK".
   */
  async showStoragePermissionError(): Promise<void> {
    const alert = await this.alertController.create({
      header: await lastValueFrom(
        this.translate.get('APP.ALERT_SERVICE.STORAGE_PERMISSION.HEADER'),
      ),
      subHeader: await lastValueFrom(
        this.translate.get('APP.ALERT_SERVICE.STORAGE_PERMISSION.SUBHEADER'),
      ),
      message: await lastValueFrom(
        this.translate.get('APP.ALERT_SERVICE.STORAGE_PERMISSION.MESSAGE'),
      ),
      buttons: [
        {
          text: await lastValueFrom(this.translate.get('APP.ALERT_SERVICE.OK')),
          role: 'cancel',
        },
      ],
    });

    await alert.present();
  }

  /**
   * Shows a confirmation alert for deleting a photo or all photos.
   * @param photo The photo to be deleted, or 'all' to delete all photos.
   * @returns A promise that resolves to true if the user confirms the deletion, false otherwise.
   */
  async confirmDeletePhotoAlert(photo: UserPhoto | 'all'): Promise<boolean> {
    let header, subHeader, message;
    if (photo && photo !== 'all') {
      header = await lastValueFrom(
        this.translate.get('APP.ALERT_SERVICE.DELETE_PHOTO.HEADER')
      );
      subHeader = await lastValueFrom(
        this.translate.get('APP.ALERT_SERVICE.DELETE_PHOTO.SUBHEADER')
      );
      message = await lastValueFrom(
        this.translate.get('APP.ALERT_SERVICE.DELETE_PHOTO.MESSAGE')
      );
    } else {
      header = await lastValueFrom(
        this.translate.get('APP.ALERT_SERVICE.DELETE_PHOTOS.HEADER')
      );
      subHeader = await lastValueFrom(
        this.translate.get('APP.ALERT_SERVICE.DELETE_PHOTOS.SUBHEADER')
      );
      message = await lastValueFrom(
        this.translate.get('APP.ALERT_SERVICE.DELETE_PHOTOS.MESSAGE')
      );
    }
    return this.confirmDeleteAlert(header, subHeader, message);
  }

  /**
   * Shows a confirmation alert for deleting a photo or all photos.
   * @param header The header text of the alert.
   * @param subHeader The subheader text of the alert.
   * @param message The message text of the alert.
   * @returns A promise that resolves to true if the user confirms the deletion, false otherwise.
   */
  private async confirmDeleteAlert(
    header: string,
    subHeader: string,
    message: string,
  ): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const alert = await this.alertController.create({
        header: header,
        subHeader: subHeader,
        message: message,
        buttons: [
          {
            text: this.translate.instant('APP.ALERT_SERVICE.DELETE'),
            role: 'destructive',
            handler: () => resolve(true),
          },
          {
            text: this.translate.instant('APP.ALERT_SERVICE.CANCEL'),
            role: 'cancel',
            handler: () => resolve(false),
          },
        ],
        cssClass: 'confirm-delete-alert',
        backdropDismiss: false,
      });

      await alert.present();
    });
  }
}
