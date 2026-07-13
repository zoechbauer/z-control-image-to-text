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
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { UtilsService } from '../services/utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { ToastService } from '../services/toast.service';
import { ToastAnchor, WorkflowStep } from '../shared/enums';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils.service';
import { FeatureService } from '../services/feature.service';
import { SpinnerComponent } from '../ui/components/spinner/spinner.component';
import { WorkflowService } from '../services/workflow-service';

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
    CommonModule,
    FormsModule,
    TranslatePipe,
    SpinnerComponent,
  ],
})
export class FeatureComponent implements OnInit {
  translate = inject(TranslateService);
  localStorage = inject(LocalStorageService);
  readonly utilsService = inject(UtilsService);
  private readonly toastService = inject(ToastService);
  private readonly firestoreUtilsService = inject(
    FirebaseFirestoreUtilsService,
  );
  private readonly featureService = inject(FeatureService);
  private readonly workflowService = inject(WorkflowService);

  featureInput: string = ''; // TODO replace with photo
  WorkflowStep = WorkflowStep;
  workflowStep = WorkflowStep.SelectPhoto;
  isLoading = false;
  isContingentExceeded: boolean = false;

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

  makePhoto() {
    this.toastService.showToast(
      'makePhoto is not implemented yet',
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  selectPhotoFromGalery() {
    this.toastService.showToast(
      'selectPhoto is not implemented yet',
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
  }

  selectResultsFromStorage(event: any) {
    this.toastService.showToast(
      'selectResultsFromStorage is not implemented yet',
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
      event,
    );
  }

  extractTextFromPhoto() {
    this.toastService.showToast(
      'extractTextFromPhoto is not implemented yet',
      ToastAnchor.MainPage,
    );

    this.workflowStep = this.workflowService.getNextWorkflowStep(
      this.workflowStep,
    );
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

  private displayFeatureResults(featureResults: any): void {
    console.warn('TODO displayFeatureResults ....');
  }

  private initFormControls(): void {
    console.warn('TODO initFormControls...');
  }

  // /**
  //  * Searches for features based on the user input.
  //  * Processes the feature input and returns the results.
  //  */
  // async search() {
  //   this.isLoading = true;
  //   await this.updateIsContingentExceeded();

  //   if (this.isContingentExceeded) {
  //     this.toastService.showToast(
  //       this.translate.instant('FEATURE.TOAST.CONTINGENT_EXCEEDED'),
  //       ToastAnchor.MainPage,
  //     );
  //     this.isLoading = false;
  //     return;
  //   }

  //   try {
  //     const featureResults =
  //       await this.featureService.secureFeatureCloudFunction({
  //         text: this.featureInput,
  //       });
  //     if (!featureResults) {
  //       this.isLoading = false;
  //       return;
  //     }
  //     this.displayFeatureResults(featureResults);
  //     this.firestoreUtilsService.requestStatisticsRefresh();
  //     this.toastService.showToast(
  //       this.translate.instant('FEATURE.TOAST.QUOTA_REDUCED'),
  //       ToastAnchor.MainPage,
  //     );
  //   } catch (error: any) {
  //     if (error?.message?.includes('contingent')) {
  //       this.toastService.showToast(
  //         this.translate.instant('FEATURE.TOAST.CONTINGENT_EXCEEDED'),
  //         ToastAnchor.MainPage,
  //       );
  //     } else {
  //       console.error('Feature error:', error);
  //       this.toastService.showToast(
  //         this.translate.instant('FEATURE.TOAST.ERROR_CALLING_FEATURE'),
  //         ToastAnchor.MainPage,
  //       );
  //     }
  //   } finally {
  //     this.isLoading = false;
  //   }
  // }
}
