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
  ModalController,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Photo } from '@capacitor/camera';

import type {
  PhotoInfo,
  TextStatistics,
  UserPhoto,
} from '../shared/app.interfaces';
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
import { FeatureResultComponent } from '../ui/components/feature-result/feature-result.component';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-feature',
  templateUrl: './feature.component.html',
  imports: [
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
    FeatureResultComponent,
  ],
})
export class FeatureComponent implements OnInit {
  translate = inject(TranslateService);
  localStorage = inject(LocalStorageService);
  readonly photoService = inject(PhotoService);
  readonly photoStorageService = inject(PhotoStorageService);
  readonly utilsService = inject(UtilsService);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastService = inject(ToastService);
  private readonly firestoreUtilsService = inject(
    FirebaseFirestoreUtilsService,
  );
  private readonly ocrService = inject(OcrService);
  private readonly workflowService = inject(WorkflowService);
  private readonly imageCompressionService = inject(ImageCompressionService);
  private readonly alertService = inject(AlertService);

  selectedPhoto?: UserPhoto;
  selectedHistoryPhoto?: UserPhoto;
  extractedText: string = '';
  WorkflowStep = WorkflowStep;
  workflowStep = WorkflowStep.SelectPhoto;
  isLoading = false;
  isContingentExceeded: boolean = false;
  textStatistics: TextStatistics = {
    wordCount: 0,
    lineCount: 0,
    characterCount: 0,
  };
  hasNextImage: boolean = true;
  hasPreviousImage: boolean = false;
  private extractedTextItems: string[] = [];

  /**
   * Get the card title based on the current workflow step.
   * If the workflow step is one of the initial steps (SelectPhoto, ExtractText, DisplayExtractedText, AddPhotoInfo),
   * the title will be "Extract Text from Image". Otherwise, it will be "Manage History".
   * @returns The card title as a translated string.
   */
  get cardTitle(): string {
    if (
      this.workflowStep === WorkflowStep.SelectPhoto ||
      this.workflowStep === WorkflowStep.ExtractText ||
      this.workflowStep === WorkflowStep.DisplayExtractedText ||
      this.workflowStep === WorkflowStep.AddPhotoInfo
    ) {
      return this.translate.instant('FEATURE.CARD.TITLE');
    } else {
      return this.translate.instant('FEATURE.CARD.TITLE-HISTORY');
    }
  }

  /**
   * Initialize the component by updating the contingent status, initializing form controls,
   * setting the initial workflow step, and loading saved photos from the photo storage service.
   * The selected photo is set to the first photo in the loaded photos.
   */
  ngOnInit() {
    this.updateIsContingentExceeded().then(() => {
      this.initFormControls();
      this.workflowStep = WorkflowStep.SelectPhoto;
      this.photoStorageService.loadSavedPhotos().then(() => {
        this.isLoading = false;
      });
    });

    this.photoStorageService.photos$.subscribe((photos) => {
      this.selectedPhoto = photos[0];
    });
  }

  /**
   * Get the label for the info button based on the provided photo.
   * If the photo has a title, the label will be "Change Info". Otherwise, it will be "Add Info".
   * @param photo The selectedPhoto or selectedHistoryPhoto for which to get the info button label.
   * @returns The info button label as a translated string.
   */
  getInfoButtonLabel(photo: UserPhoto | undefined): string {
    if (photo?.photoInfo?.title) {
      return this.translate.instant('FEATURE.CARD.BUTTON.CHANGE_INFO');
    } else {
      return this.translate.instant('FEATURE.CARD.BUTTON.ADD_INFO');
    }
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
    this.initFormControls();

    this.isLoading = true;
    const selected = await this.photoService.makePhoto();
    this.isLoading = false;

    if (selected) {
      this.workflowStep = this.workflowService.getNextWorkflowStep(
        this.workflowStep,
      );
    }
  }

  /**
   * Select a photo from the device gallery and
   * update the selected photo and workflow step accordingly.
   */
  async selectPhotoFromGallery() {
    this.initFormControls();

    this.isLoading = true;
    const selected = await this.photoService.selectPhoto();
    this.isLoading = false;

    if (selected) {
      this.workflowStep = this.workflowService.getNextWorkflowStep(
        this.workflowStep,
      );
    }
  }

  /**
   * Select a photo from the history and update the selected history photo.
   * @param photo The photo to select from the history.
   */
  async selectHistoryPhoto(photo: UserPhoto) {
    this.initFormControls();
    this.selectedHistoryPhoto = photo;
    this.extractedText = photo.photoInfo?.extractedText || '';
    this.displayTextStatistics();

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
      null,
      photo,
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
      await this.storeAndDisplayFeatureResults(featureResults);
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
   * Deletes the selected photo from the photo storage service if the user
   * confirms the deletion through an alert. A toast notification is shown
   * to inform the user that all photos have been deleted..
   * The workflow step is updated accordingly.
   * @param event The event that triggered the delete action.
   * @returns A promise that resolves when the operation is complete.
   */
  async deleteTextAndPhoto(event: any): Promise<void> {
    if (
      !(await this.alertService.confirmDeletePhotoAlert(
        this.selectedHistoryPhoto as UserPhoto,
      ))
    ) {
      return;
    }

    this.isLoading = true;
    try {
      const photoDeleted = await this.photoStorageService.deletePhoto(
        this.selectedHistoryPhoto as UserPhoto,
      );

      if (photoDeleted) {
        this.toastService.showToast(
          this.translate.instant('FEATURE.TOAST.SUCCESS_PHOTO_DELETED'),
          ToastAnchor.MainPage,
        );

        this.workflowStep = this.workflowService.getNextWorkflowStep(
          this.workflowStep,
          event,
        );
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      const errorMessage = this.translate.instant(
        'FEATURE.TOAST.ERROR_DELETING_PHOTO',
      );
      this.toastService.showToast(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Deletes all photos from the photo storage service if the user
   * confirms the deletion through an alert. A toast notification is shown
   * to inform the user that all photos have been deleted..
   * The workflow step is updated accordingly.
   * @returns A promise that resolves when the operation is complete.
   */
  async deleteAllPhotos(): Promise<void> {
    if (!(await this.alertService.confirmDeletePhotoAlert('all'))) {
      return;
    }

    this.isLoading = true;
    try {
      const isDeleted = await this.photoStorageService.deleteAllPhotos();
      if (isDeleted) {
        const successMessage = this.translate.instant(
          'FEATURE.TOAST.SUCCESS_ALL_PHOTOS_DELETED',
        );
        this.toastService.showToast(successMessage);

        this.workflowStep = this.workflowService.getNextWorkflowStep(
          this.workflowStep,
        );
      }
    } catch (error) {
      console.error('Error deleting all photos:', error);
      const errorMessage = this.translate.instant(
        'FEATURE.TOAST.ERROR_DELETING_ALL_PHOTOS',
      );
      this.toastService.showToast(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Add the information of the selected photo by opening a modal for user input.
   * If the user provides updated information, the photo is updated and persisted
   * using the photo storage service. A toast notification is shown to inform
   * the user that the information has been updated. The workflow step is updated
   * accordingly.
   */
  async addInfo() {
    const updatedPhoto: UserPhoto | undefined =
      await this.utilsService.openPhotoInfoModal(
        this.selectedPhoto as UserPhoto,
      );

    if (updatedPhoto) {
      this.selectedPhoto = await this.savePhotoInfo(
        this.selectedPhoto!,
        updatedPhoto.photoInfo?.title || '',
        updatedPhoto.photoInfo?.description || '',
      );
    }

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  /**
   * Change the information of the selected photo
   * and update the workflow step accordingly.
   */
  async changeInfo() {
    const updatedPhoto: UserPhoto | undefined =
      await this.utilsService.openPhotoInfoModal(
        this.selectedHistoryPhoto as UserPhoto,
      );

    if (updatedPhoto) {
      this.selectedHistoryPhoto = (await this.savePhotoInfo(
        this.selectedHistoryPhoto!,
        updatedPhoto.photoInfo?.title || '',
        updatedPhoto.photoInfo?.description || '',
      )) as UserPhoto;
    }

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  /**
   * Save title and description.
   * As the extracted text is not editable, it is used from the existing photo information.
   * The updated photo information is persisted using the photo storage service.
   * A toast notification is shown to inform the user that the information has been updated.
   * @param photo The photo to update.
   * @param title The new title for the photo.
   * @param description The new description for the photo.
   */
  private async savePhotoInfo(
    photo: UserPhoto,
    title: string,
    description: string,
  ): Promise<UserPhoto> {
    const photoInfo: Partial<PhotoInfo> = {};

    if (title !== undefined) {
      photoInfo.title = title;
    }
    if (description !== undefined) {
      photoInfo.description = description;
    }

    const updatedPhoto = await this.photoStorageService.updatePhotoInfo(
      photo,
      photoInfo as PhotoInfo,
    );

    this.toastService.showToast(
      this.translate.instant('FEATURE.PHOTO_INFO_MODAL.TOAST.INFO_UPDATED'),
      ToastAnchor.MainPage,
    );
    return updatedPhoto;
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
      this.workflowStep,
    );
  }

  /**
   * Navigate back to the history view and update the workflow step accordingly.
   * @param event The event that triggered the navigation back to history.
   */
  backToHistory(event: any) {
    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
      event,
    );
  }

  /**
   * Navigate to the next image in the history and update the selected history photo.
   * The availability of next and previous images is also updated accordingly.
   */
  getNextImage() {
    const nextPhoto = this.photoStorageService.getNextPhoto(
      this.selectedHistoryPhoto as UserPhoto,
    );
    if (nextPhoto) {
      this.selectedHistoryPhoto = nextPhoto;
      this.hasNextImage = !!this.photoStorageService.getNextPhoto(nextPhoto);
      this.hasPreviousImage = !!this.photoStorageService.getPreviousPhoto(nextPhoto);
    } else {
      this.hasNextImage = false;
      this.hasPreviousImage = !!this.photoStorageService.getPreviousPhoto(
        this.selectedHistoryPhoto as UserPhoto,
      );
    }
  }

  /**
   * Navigate to the previous image in the history and update the selected history photo.
   * The availability of next and previous images is also updated accordingly.
   */
  getPreviousImage() {
    const previousPhoto = this.photoStorageService.getPreviousPhoto(
      this.selectedHistoryPhoto as UserPhoto,
    );
    if (previousPhoto) {
      this.selectedHistoryPhoto = previousPhoto;
      this.hasNextImage = !!this.photoStorageService.getNextPhoto(previousPhoto);
      this.hasPreviousImage = !!this.photoStorageService.getPreviousPhoto(previousPhoto);
    } else {
      this.hasPreviousImage = false;
      this.hasNextImage = !!this.photoStorageService.getNextPhoto(
        this.selectedHistoryPhoto as UserPhoto,
      );
    }
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

  /**
   * Store the extracted text and photo information, update the selected photo,
   * and display the text statistics.
   * @param featureResults The results of the feature extraction, including the extracted text.
   */
  private async storeAndDisplayFeatureResults(
    featureResults: any,
  ): Promise<void> {
    this.extractedText = featureResults?.text ?? '';

    const photoInfo: Partial<PhotoInfo> = {
      extractedText: this.extractedText,
    };

    this.selectedPhoto = await this.photoStorageService.updatePhotoInfo(
      this.selectedPhoto as UserPhoto,
      photoInfo,
    );

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
   * and workflow step to their default values.
   */
  private initFormControls(): void {
    this.selectedPhoto = undefined;
    this.selectedHistoryPhoto = undefined;
    this.extractedText = '';
    this.extractedTextItems = [];
  }
}
