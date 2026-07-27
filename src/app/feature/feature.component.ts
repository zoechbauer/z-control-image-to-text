import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonCardSubtitle,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonLabel,
  IonItem,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Photo } from '@capacitor/camera';

import type { TextStatistics, UserPhoto } from '../shared/app.interfaces';
import { ToastAnchor, WorkflowStep } from '../shared/enums';
import { OcrService } from '../services/ocr.service';
import { UtilsService } from '../services/utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { ToastService } from '../services/toast.service';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils.service';
import { SpinnerComponent } from '../ui/components/spinner/spinner.component';
import { WorkflowService } from '../services/workflow-service';
import { ImageCompressionService } from '../services/image-compression.service';
import { PhotoService } from '../services/photo.service';
import { PhotoStorageService } from '../services/photo-storage.service';

@Component({
  selector: 'app-feature',
  templateUrl: './feature.component.html',
  imports: [
    IonItem,
    IonLabel,
    IonIcon,
    IonCardSubtitle,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    CommonModule,
    FormsModule,
    TranslatePipe,
    SpinnerComponent,
  ],
})
export class FeatureComponent implements OnInit {
  translate = inject(TranslateService);
  localStorage = inject(LocalStorageService);
  readonly photoService = inject(PhotoService);
  readonly photoStorageService = inject(PhotoStorageService);
  readonly utilsService = inject(UtilsService);
  private readonly toastService = inject(ToastService);
  private readonly firestoreUtilsService = inject(
    FirebaseFirestoreUtilsService,
  );
  private readonly ocrService = inject(OcrService);
  private readonly workflowService = inject(WorkflowService);
  private readonly imageCompressionService = inject(ImageCompressionService);

  selectedPhoto?: UserPhoto;
  extractedText: string = '';
  extractedTextItems: string[] = [];
  WorkflowStep = WorkflowStep;
  workflowStep = WorkflowStep.SelectPhoto;
  isLoading = false;
  isContingentExceeded: boolean = false;
  textStatistics: TextStatistics = {
    wordCount: 0,
    lineCount: 0,
    characterCount: 0,
  };

  ngOnInit() {
    this.updateIsContingentExceeded().then(() => {
      this.initFormControls();
      this.photoStorageService.loadSavedPhotos().then(() => {
        this.isLoading = false;
      });
    });

    this.photoStorageService.photos$.subscribe((photos) => {
      this.selectedPhoto = photos[0];
    });
  }

  /**
   * Use this function to check if the user has exceeded their contingent for calling the feature.
   */
  private async updateIsContingentExceeded() {
    this.isContingentExceeded =
      await this.firestoreUtilsService.isContingentExceeded();
  }

  /**
   * Make a photo using the device camera and
   * update the selected photo and workflow step accordingly.
   */
  async makePhoto() {
    await this.photoService.makePhoto();

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  /**
   * Select a photo from the device gallery and
   * update the selected photo and workflow step accordingly.
   */
  async selectPhotoFromGallery() {
    await this.photoService.selectPhoto();

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  /**
   * Select photos from storage and update the workflow step accordingly.
   * @param event The event triggering the selection from storage.
   */
  async selectPhotosFromStorage(event: any) {
    this.isLoading = true;
    await this.photoStorageService.getPhotosFromCache();

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
      event,
    );
    this.isLoading = false;
  }

  /**
   * Extract text from the selected photo using OCR if the contingent is not exceeded
   * and update the workflow step accordingly. The extracted text and statistics will
   * be displayed in the UI, and a toast notification will be shown to inform the user
   * about the quota reduction. The workflow step will be updated accordingly.
   * @returns A promise that resolves when the text extraction is complete.
   */
  async extractTextFromPhoto() {
    this.isLoading = true;

    if (!this.selectedPhoto) {
      this.toastService.showToast(
        this.translate.instant('FEATURE.TOAST.ERROR_NO_PHOTO_SELECTED'),
        ToastAnchor.MainPage,
      );
      this.isLoading = false;
      return;
    }

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
      const visionRequest =
        await this.imageCompressionService.buildVisionOcrRequestFromPhoto(
          this.selectedPhoto as UserPhoto,
          {
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 0.8,
            mimeType: 'image/jpeg',
          },
          { feature: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
        );
      const imageBase64 = visionRequest.requests[0].image.content;

      const featureResults = await this.ocrService.secureRecognize({
        imageBase64,
        mode: 'image',
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

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  /**
   * Delete the extracted text and the selected photo, 
   * and update the workflow step accordingly.
   */
  deleteTextAndPhoto() {
    this.toastService.showToast(
      this.translate.instant('APP.UNDER_CONSTRUCTION'),
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  /**
   * Delete all photos from the photo service
   * and update the workflow step accordingly.
   */
  deleteAllPhotos() {
    this.isLoading = true;
    this.photoService.deleteAllPhotos();
    this.isLoading = false;
  }

  addInfo(event: any) {
    this.toastService.showToast(
      this.translate.instant('APP.UNDER_CONSTRUCTION'),
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
      event,
    );
  }

  /**
   * Change the information of the selected photo 
   * and update the workflow step accordingly.
   */
  changeInfo() {
    this.toastService.showToast(
      this.translate.instant('APP.UNDER_CONSTRUCTION'),
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep
    );
  }

  /**
   * Copy the extracted text, compressed photo, and statistics to the clipboard
   * and update the workflow step accordingly.
   */
  copyData() {
    this.toastService.showToast(
      this.translate.instant('APP.UNDER_CONSTRUCTION'),
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep
    );
  }

  /**
   * Save the extracted text, compressed photo, and statistics to the device storage
   * and update the workflow step accordingly.
   */
  saveTextAndPhoto() {
    this.toastService.showToast(
      this.translate.instant('APP.UNDER_CONSTRUCTION'),
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  /**
   * Clear the current form controls and update the workflow step accordingly.
   * @param event The event that triggered the clear action.
   */
  clear(event: any): void {
    this.initFormControls();

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
      event,
    );
  }

  private displayFeatureResults(featureResults: any): void {
    this.extractedText = featureResults?.text ?? '';
    this.displayTextStatistics();
  }

  /**
   * Display statistics about the extracted text, including word count, line count,
   * and character count.
   * The extracted text is split into lines and filtered to remove empty lines.
   */
  private displayTextStatistics() {
    this.extractedTextItems = this.extractedText
      .split('\n')
      .filter((line) => line.trim() !== '');

    this.textStatistics = {
      wordCount: this.extractedText
        .replaceAll('\n', ' ')
        .split(' ')
        .filter((word) => word.trim() !== '').length,
      lineCount: this.extractedTextItems.length,
      characterCount: this.extractedText.length,
    };
  }

  /**
   * Initialize form controls by resetting the selected photo, extracted text, 
   * extracted text items, and workflow step to their default values.
   * This method is called when the component is initialized or when the user clears the form.
   */
  private initFormControls(): void {
    this.selectedPhoto = undefined;
    this.extractedText = '';
    this.extractedTextItems = [];
    this.workflowStep = WorkflowStep.SelectPhoto;
  }
}
