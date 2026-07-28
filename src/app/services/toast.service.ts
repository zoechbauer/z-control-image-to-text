import { Injectable, NgZone, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { defineCustomElement as defineIonToastElement } from '@ionic/core/components/ion-toast.js';

import { UtilsService } from './utils.service';
import { ToastAnchor } from '../shared/enums';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  translate = inject(TranslateService);
  private readonly toastController = inject(ToastController);
  private readonly utilsService = inject(UtilsService);
  private readonly ngZone = inject(NgZone);
  private readonly toastTimeoutMs = 1500;
  private toastDefinitionReady?: Promise<void>;

  constructor() {
    // Preload toast registration once so first user interaction is not blocked.
    void this.ensureIonToastDefined();
  }

  /**
   * Shows a toast with a translated message, typically used for disabled actions.
   *
   * @param toastMsg The translation key or message to display
   * @param anchorId Optional anchor ID for positioning the toast
   */
  async showDisabledToast(toastMsg: string, anchorId?: ToastAnchor) {
    const translatedMsg = this.translate.instant(toastMsg);

    this.showToastMessage(translatedMsg, anchorId).catch((error) => {
      console.error('Error presenting toast:', error);
    });
  }

  /**
   * Displays a toast message below the header using a translated message string.
   *
   * @param translatedToastMessage The message to display (already translated).
   * @param anchorId Optional anchor ID, default is ToastAnchor.SETTINGS_PAGE.
   */
  showToast(translatedToastMessage: string, anchorId?: ToastAnchor): void {
    this.showToastMessage(translatedToastMessage, anchorId).catch((error) => {
      console.error('Error presenting toast:', error);
    });
  }

  private async showToastMessage(
    translatedToastMessage: string,
    anchorId?: ToastAnchor,
  ) {
    const toastOptions: any = {
      message: translatedToastMessage,
      duration: 3000,
      icon: 'information-circle',
      color: 'medium',
      position: this.getToastPosition(),
      buttons: [
        {
          icon: 'close-outline',
          role: 'cancel',
        },
      ],
    };

    const anchor = this.getToastAnchor(anchorId);
    if (anchor) {
      toastOptions.positionAnchor = anchor;
    }
    await this.presentToast(toastOptions);
  }

  /**
   * Presents a toast through Ionic's controller and applies a timeout guard.
   *
   * If creation/presentation fails or times out, the error is logged and no
   * custom UI fallback is rendered to keep the app UI behavior consistent.
   *
   * @param toastOptions Fully prepared Ionic toast options.
   */
  private async presentToast(toastOptions: any): Promise<void> {
    await this.ensureIonToastDefined();

    try {
      await this.withTimeout(
        this.ngZone.run(async () => {
          const toast = await this.toastController.create(toastOptions);
          await toast.present();
        }),
        this.toastTimeoutMs,
        'ToastController flow timed out',
      );
    } catch (error) {
      console.error(
        'Toast presentation failed. Ionic ToastController may still be affected by a production/runtime issue. UI fallback is intentionally disabled to preserve consistent Ionic UI.',
        {
          error,
          message: toastOptions?.message,
          position: toastOptions?.position,
          positionAnchor: toastOptions?.positionAnchor,
        },
      );
    }
  }

  /**
   * Ensures the ion-toast web component is registered exactly once.
   *
   * This prevents production-only timing issues where ToastController.create()
   * may stall before the component is available.
   */
  private async ensureIonToastDefined(): Promise<void> {
    const customElementsRegistry = globalThis.customElements;
    if (!customElementsRegistry) {
      return;
    }

    if (customElementsRegistry.get('ion-toast')) {
      return;
    }

    if (!this.toastDefinitionReady) {
      this.toastDefinitionReady = Promise.resolve().then(() => {
        defineIonToastElement();
      });
    }

    await this.toastDefinitionReady;
  }

  /**
   * Wraps a promise with a timeout so stalled async flows can fail fast.
   *
   * @param promise Promise to execute.
   * @param timeoutMs Max wait time in milliseconds.
   * @param timeoutMessage Error message used when timeout is reached.
   * @returns The original promise result when resolved in time.
   */
  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = globalThis.setTimeout(() => {
        reject(new Error(timeoutMessage));
      }, timeoutMs);

      promise
        .then((value) => {
          globalThis.clearTimeout(timeoutId);
          resolve(value);
        })
        .catch((error) => {
          globalThis.clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private getToastPosition(): 'top' | 'bottom' {
    if (this.utilsService.isDesktop) {
      return 'bottom';
    }
    // On mobile devices, display toast at the top to prevent it from being obscured by the navigation bar or keyboard.
    return 'top';
  }

  private getToastAnchor(anchorId?: ToastAnchor): string | undefined {
    if (this.utilsService.isDesktop) {
      return undefined; // Do not set anchor on desktop
    }
    const resolvedAnchorId = anchorId || ToastAnchor.SettingsPage;
    if (!this.isAnchorVisible(resolvedAnchorId)) {
      return undefined;
    }
    // On mobile devices, display toast below the header prevent it from being obscured by the header bar.
    return resolvedAnchorId;
  }

  private isAnchorVisible(anchorId: string): boolean {
    const anchorElement = globalThis.document?.getElementById(anchorId);
    if (!anchorElement || !anchorElement.isConnected) {
      return false;
    }
    return anchorElement.getClientRects().length > 0;
  }
}
