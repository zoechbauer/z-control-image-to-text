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

import { UtilsService } from '../services/utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { ToastService } from '../services/toast.service';
import { ToastAnchor, WorkflowStep } from '../shared/enums';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils.service';
import { SpinnerComponent } from '../ui/components/spinner/spinner.component';
import { WorkflowService } from '../services/workflow-service';
import { UserPhoto } from '../shared/app.interfaces';
import { PhotoService } from '../services/photo.service';
import type { TextStatistics } from '../shared/app.interfaces';
import { FileUtilsService } from '../services/file-utils.service';

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
  readonly fileUtilsService = inject(FileUtilsService);
  readonly utilsService = inject(UtilsService);
  private readonly toastService = inject(ToastService);
  private readonly firestoreUtilsService = inject(
    FirebaseFirestoreUtilsService,
  );
  private readonly workflowService = inject(WorkflowService);

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
      this.fileUtilsService.loadSavedPhotos().then(() => {
        this.isLoading = false;
      });
    });
  }

  /**
   * Use this function to check if the user has exceeded their contingent for calling the feature.
   */
  private async updateIsContingentExceeded() {
    this.isContingentExceeded =
      await this.firestoreUtilsService.isContingentExceeded();
  }

  async makePhoto() {
    await this.photoService.makePhoto();
    this.selectedPhoto = this.photoService.getLastPhoto() as UserPhoto;

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  async selectPhotoFromGallery() {
    await this.photoService.selectPhoto();
    this.selectedPhoto = this.photoService.getLastPhoto() as UserPhoto;

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  async selectResultsFromStorage(event: any) {
    await this.fileUtilsService.getPhotosFromCache();
    console.log(
      'selectResultsFromStorage - loaded photos:',
      this.fileUtilsService.photos$,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
      event,
    );
  }

  async extractTextFromPhoto() {
    this.isLoading = true;

    if (!this.selectedPhoto) {
      this.toastService.showToast(
        'No photo selected. Please select a photo first.',
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

    this.toastService.showToast(
      'extractTextFromPhoto is not implemented yet',
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
    this.isLoading = false;
  }

  deleteTextAndPhoto() {
    this.toastService.showToast(
      'deleteTextAndPhoto is not implemented yet',
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  deleteAll() {
    this.photoService.deleteAllPhotos();
  }

  sendMail(event: any) {
    this.toastService.showToast(
      'sendMail is not implemented yet',
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
      event,
    );
  }

  saveTextAndPhoto() {
    this.toastService.showToast(
      'saveTextAndPhoto is not implemented yet',
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  clear(event: any): void {
    this.initFormControls();

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
      event,
    );
  }

  private initFormControls(): void {
    this.selectedPhoto = undefined;
  }
}
