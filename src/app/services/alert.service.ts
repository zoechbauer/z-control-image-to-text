import { inject, Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';

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
        this.translate.get('APP.ALERT_SERVICE.STORAGE_PERMISSION.HEADER')
      ),
      subHeader: await lastValueFrom(
        this.translate.get('APP.ALERT_SERVICE.STORAGE_PERMISSION.SUBHEADER')
      ),
      message: await lastValueFrom(
        this.translate.get('APP.ALERT_SERVICE.STORAGE_PERMISSION.MESSAGE')
      ),
      buttons: [
        {
          text: await lastValueFrom(
            this.translate.get('APP.ALERT_SERVICE.OK')
          ),
          role: 'cancel',
        },
      ],
    });

    await alert.present();
  }
}
