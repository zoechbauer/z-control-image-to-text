import { inject, Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { CopyDataOptions, UserPhoto } from '../shared/app.interfaces';
import { CopyDataOption } from '../shared/enums';
import { FilePathService } from './file-path.service';
import { Capacitor } from '@capacitor/core';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  // important: you cannot use html tags e.g. <br> in the alert messages, because it will not be rendered correctly
  // use '\n' for line breaks instead, which will be rendered correctly in the alert for mobile but not for web

  private readonly alertController = inject(AlertController);
  private readonly translate = inject(TranslateService);
  private readonly filePathService = inject(FilePathService);
  private readonly toastService = inject(ToastService);

  /**
   * Shows an alert indicating that storage permission is required to save a photo.
   * This alert is displayed when the app does not have the necessary permissions to access storage.
   * The user is informed about the permission requirement and can acknowledge the message by clicking "OK".
   */
  async showStoragePermissionError(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.translate.instant(
        'APP.ALERT_SERVICE.STORAGE_PERMISSION.HEADER',
      ),
      subHeader: this.translate.instant(
        'APP.ALERT_SERVICE.STORAGE_PERMISSION.SUBHEADER',
      ),
      message: this.translate.instant(
        'APP.ALERT_SERVICE.STORAGE_PERMISSION.MESSAGE',
      ),
      buttons: [
        {
          text: this.translate.instant('APP.ALERT_SERVICE.OK'),
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
      header = this.translate.instant('APP.ALERT_SERVICE.DELETE_PHOTO.HEADER');
      subHeader = this.translate.instant(
        'APP.ALERT_SERVICE.DELETE_PHOTO.SUBHEADER',
      );
      message = this.translate.instant(
        'APP.ALERT_SERVICE.DELETE_PHOTO.MESSAGE',
      );
    } else {
      header = this.translate.instant('APP.ALERT_SERVICE.DELETE_PHOTOS.HEADER');
      subHeader = this.translate.instant(
        'APP.ALERT_SERVICE.DELETE_PHOTOS.SUBHEADER',
      );
      message = this.translate.instant(
        'APP.ALERT_SERVICE.DELETE_PHOTOS.MESSAGE',
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
    try {
      const alert = await this.alertController.create({
        header: header,
        subHeader: subHeader,
        message: message,
        buttons: [
          {
            text: this.translate.instant('APP.ALERT_SERVICE.DELETE'),
            role: 'destructive',
          },
          {
            text: this.translate.instant('APP.ALERT_SERVICE.CANCEL'),
            role: 'cancel',
          },
        ],
        cssClass: 'confirm-delete-alert',
        backdropDismiss: false,
      });

      await alert.present();

      // Wait for the alert to be dismissed and inspect the role of the button that dismissed it.
      const result = await alert.onDidDismiss();
      // role is 'destructive' for delete, 'cancel' for cancel
      return result.role === 'destructive';
    } catch (err) {
      console.error('Error showing confirm delete alert', err);
      return false;
    }
  }

  /**
   * Shows an alert for copying data options.
   * The user can select which data to copy (photo, info, extracted text, or all).
   * @returns A promise that resolves to the selected copy data options.
   */
  async showCopyAlert(filepath: string): Promise<CopyDataOptions> {
    let { photoLabel, photoChecked, photoDisabled } =
      this.setValuesForCopyImage(filepath);

    const alert = await this.alertController.create({
      header: !Capacitor.isNativePlatform()
        ? this.translate.instant('APP.ALERT_SERVICE.COPY_DATA.HEADER')
        : this.translate.instant('APP.ALERT_SERVICE.COPY_DATA.HEADER_SHARE'),
      subHeader: !Capacitor.isNativePlatform()
        ? this.translate.instant('APP.ALERT_SERVICE.COPY_DATA.SUBHEADER')
        : undefined,
      message: !Capacitor.isNativePlatform()
        ? this.translate.instant('APP.ALERT_SERVICE.COPY_DATA.MESSAGE')
        : this.translate.instant('APP.ALERT_SERVICE.COPY_DATA.MESSAGE_SHARE'),
      cssClass: 'copy-data-alert',
      inputs: [
        {
          name: CopyDataOption.Photo,
          type: 'checkbox',
          label: photoLabel,
          disabled: photoDisabled,
          checked: photoChecked,
          value: CopyDataOption.Photo,
        },
        {
          name: CopyDataOption.TitleDescription,
          type: 'checkbox',
          checked: true,
          label: this.translate.instant(
            'APP.ALERT_SERVICE.COPY_TITLE_DESCRIPTION',
          ),
          value: CopyDataOption.TitleDescription,
        },
        {
          name: CopyDataOption.ExtractedText,
          type: 'checkbox',
          checked: true,
          label: this.translate.instant(
            'APP.ALERT_SERVICE.COPY_EXTRACTED_TEXT',
          ),
          value: CopyDataOption.ExtractedText,
        },
        {
          name: CopyDataOption.TextStatistics,
          type: 'checkbox',
          checked: true,
          label: this.translate.instant(
            'APP.ALERT_SERVICE.COPY_TEXT_STATISTICS',
          ),
          value: CopyDataOption.TextStatistics,
        },
        {
          name: CopyDataOption.CreatedModifiedTimestamps,
          type: 'checkbox',
          checked: true,
          label: this.translate.instant(
            'APP.ALERT_SERVICE.COPY_CREATED_MODIFIED_TIMESTAMPS',
          ),
          value: CopyDataOption.CreatedModifiedTimestamps,
        },
      ],
      buttons: [
        {
          text: !Capacitor.isNativePlatform()
            ? this.translate.instant('APP.ALERT_SERVICE.COPY')
            : this.translate.instant('APP.ALERT_SERVICE.SHARE'),
          role: 'confirm',
          handler: (data: string[]) => {
            if (!data.length) {
              this.toastService.showToast(
                this.translate.instant('FEATURE.TOAST.ERROR_NO_COPY_DATA_SELECTED'),
              );
              return false;
            }
            return {
              copyPhoto: data.includes(CopyDataOption.Photo),
              copyTitleDescription: data.includes(
                CopyDataOption.TitleDescription,
              ),
              copyExtractedText: data.includes(CopyDataOption.ExtractedText),
              copyTextStatistics: data.includes(CopyDataOption.TextStatistics),
              copyCreatedModifiedTimestamps: data.includes(
                CopyDataOption.CreatedModifiedTimestamps,
              ),
            };
          },
        },
        {
          text: this.translate.instant('APP.ALERT_SERVICE.CANCEL'),
          role: 'cancel',
          handler: () => ({}),
        },
      ],
    });

    await alert.present();
    const result = await alert.onDidDismiss<CopyDataOptions>();

    return result.data ?? {};
  }

  private setValuesForCopyImage(filepath: string) {
    let photoLabel = this.translate.instant('APP.ALERT_SERVICE.COPY_PHOTO');
    let photoChecked = true;
    let photoDisabled = false;

    const ext = this.filePathService.getFilenameExtension(filepath);
    if (
      Capacitor.isNativePlatform() &&
      ext !== 'png' &&
      ext !== 'jpg' &&
      ext !== 'jpeg'
    ) {
      photoLabel +=
        ' - ' +
        this.translate.instant(
          'APP.ALERT_SERVICE.COPY_DATA.PHOTO_FORMAT_NOT_SUPPORTED_NATIVE',
          { format: ext },
        );
      photoChecked = false;
      photoDisabled = true;
    }

    if (!Capacitor.isNativePlatform() && ext !== 'png') {
      photoLabel +=
        ' - ' +
        this.translate.instant(
          'APP.ALERT_SERVICE.COPY_DATA.PHOTO_FORMAT_NOT_SUPPORTED_WEB',
          { format: ext },
        );
      photoChecked = false;
      photoDisabled = true;
    }

    return { photoLabel, photoChecked, photoDisabled };
  }
}
