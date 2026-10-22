import { Component, Input, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  ModalController,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { DisplayedUserStatistics } from '@app/shared/firebase-firestore.interfaces';
import { UtilsService } from '@app/services/utils.service';
import { DisplayMode } from '@app/shared/enums';

@Component({
  selector: 'app-user-detail-modal',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    CommonModule,
    TranslatePipe,
  ],
})
export class UserDetailComponent {
  translate = inject(TranslateService);
  private readonly modalCtrl = inject(ModalController);
  private readonly utilsService = inject(UtilsService);

  @Input() lang!: string;
  @Input() userStatistic!: DisplayedUserStatistics;
  @Input() displayMode!: DisplayMode;
  DisplayMode = DisplayMode;

  /**
   * Closes the user detail modal.
   */
  async close(): Promise<void> {
    await this.modalCtrl.dismiss();
  }

  /**
   * Gets the application version in the format "major.minor (date)".
   * @returns The formatted application version string, or an empty string if not available.
   */
  getAppVersion(): string {
    if (!this.userStatistic?.deviceInfo?.appVersion?.date) {
      return '';
    }
    const v = this.userStatistic.deviceInfo.appVersion;
    return `${v.major}.${v.minor} (${v.date})`;
  }

  /**
   * Formats the given date and time according to the display mode.
   * @param dateTime The date and time to format.
   * @returns The formatted date and time string.
   */
  getFormatDateTime(dateTime: Date | null): string {
    if (this.displayMode === DisplayMode.Programmer) {
      return this.utilsService.formatDateTimeISO(dateTime);
    }

    return this.utilsService.formatDateISO(dateTime);
  }

  /**
   * Gets the platform on which the user is currently running the application.
   * @returns The displayed platform string.
   */
  getDisplayedPlatform(): string {
    const platform = this.userStatistic.displayedPlatform;
    return platform === 'native' ? `${platform} - Android App` : platform;
  }
}
