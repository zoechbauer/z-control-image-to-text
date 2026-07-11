import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonItem,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonInput,
  IonCardSubtitle,
  IonList,
  IonListHeader,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { UtilsService } from '../services/utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { ToastService } from '../services/toast.service';
import { ToastAnchor } from '../shared/enums';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils.service';
import { FeatureService } from '../services/feature.service';
import { SpinnerComponent } from '../ui/components/spinner/spinner.component';

@Component({
  selector: 'app-feature-example',
  templateUrl: './feature-example.component.html',
  imports: [
    IonListHeader,
    IonCardSubtitle,
    IonInput,
    IonButton,
    IonItem,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonListHeader,
    CommonModule,
    FormsModule,
    TranslatePipe,
    SpinnerComponent,
  ],
})
export class FeatureExampleComponent implements OnInit {
  translate = inject(TranslateService);
  localStorage = inject(LocalStorageService);
  readonly utilsService = inject(UtilsService);
  private readonly toastService = inject(ToastService);
  private readonly firestoreUtilsService = inject(FirebaseFirestoreUtilsService);
  private readonly featureService = inject(FeatureService);

  featureInput: string = '';
  relatedWords: string[] = [];
  isLoading = false;
  isContingentExceeded: boolean = false;
  searchBtnDisabled: boolean = false;
  clearBtnDisabled: boolean = false;

  ngOnInit() {
    this.updateIsContingentExceeded().then(() => {
      this.initFormControls();
      this.isLoading = false;
    });
  }

  /**
   * Use this function to check if the user has exceeded their contingent for calling the feature.
   */
  private async updateIsContingentExceeded() {
    this.isContingentExceeded =
      await this.firestoreUtilsService.isContingentExceeded();
  }

  enableButtons(): void {
    const hasText = this.featureInput.trim().length > 0;
    this.searchBtnDisabled = !hasText;
    this.clearBtnDisabled = !hasText;
  }

  /**
   * Searches for features based on the user input.
   * Processes the feature input and returns the results.
   */
  async search() {
    this.isLoading = true;
    await this.updateIsContingentExceeded();

    if (this.isContingentExceeded) {
      this.toastService.showToast(
        this.translate.instant('FEATURE.TOAST.CONTINGENT_EXCEEDED'),
        ToastAnchor.MainPage,
      );
      this.isLoading = false;
      return;
    }

    try {
      const featureResults =
        await this.featureService.secureFeatureCloudFunction({
          text: this.featureInput,
        });
      if (!featureResults) {
        this.isLoading = false;
        return;
      }
      this.displayFeatureResults(featureResults);
      this.firestoreUtilsService.requestStatisticsRefresh();
      this.toastService.showToast(
        this.translate.instant('FEATURE.TOAST.QUOTA_REDUCED'),
        ToastAnchor.MainPage,
      );
    } catch (error: any) {
      if (error?.message?.includes('contingent')) {
        this.toastService.showToast(
          this.translate.instant('FEATURE.TOAST.CONTINGENT_EXCEEDED'),
          ToastAnchor.MainPage,
        );
      } else {
        console.error('Feature error:', error);
        this.toastService.showToast(
          this.translate.instant('FEATURE.TOAST.ERROR_CALLING_FEATURE'),
          ToastAnchor.MainPage,
        );
      }
    } finally {
      this.isLoading = false;
    }
  }

  clear(): void {
    this.initFormControls();
  }

  private displayFeatureResults(featureResults: any): void {
    this.relatedWords = featureResults.feature['related'].split(', ');
  }

  private initFormControls(): void {
    this.featureInput = '';
    this.relatedWords = [];
    this.enableButtons();
  }
}
