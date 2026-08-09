import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { WorkflowStep } from '../shared/enums';
import { UserPhoto } from '../shared/app.interfaces';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  private readonly utilsService = inject(UtilsService);
  private readonly translate = inject(TranslateService);

  /**
   * Determines the next workflow step based on the current step and an optional event or selected photo.
   * @param currentStep The current workflow step.
   * @param event An optional event of a button click.
   * @param selectedPhoto An optional selected photo.
   * @returns The next workflow step.
   */
  getNextWorkflowStep(
    currentStep: WorkflowStep,
    event?: any,
    selectedPhoto?: UserPhoto,
  ): WorkflowStep {
    let nextStep: WorkflowStep;

    const target = event?.target as HTMLElement | null;
    const buttonName = target?.getAttribute('name') ?? null;

    switch (currentStep) {
      case WorkflowStep.SelectPhoto:
        if (buttonName === 'load-data') {
          nextStep = WorkflowStep.DisplayResultsFromStorage;
        } else {
          nextStep = WorkflowStep.ExtractText;
        }
        break;

      case WorkflowStep.ExtractText:
        if (buttonName === 'delete-photo') {
          nextStep = WorkflowStep.SelectPhoto;
        } else {
          nextStep = WorkflowStep.DisplayExtractedText;
        }
        break;

      case WorkflowStep.DisplayExtractedText:
        if (buttonName === 'go-back') {
          nextStep = WorkflowStep.SelectPhoto;
        } else {
          nextStep = WorkflowStep.DisplayExtractedText;
        }
        break;

      case WorkflowStep.DisplayResultsFromStorage:
        if (selectedPhoto) {
          nextStep = WorkflowStep.ManageHistory;
        } else if (buttonName === 'go-back') {
          nextStep = WorkflowStep.SelectPhoto;
        } else {
          nextStep = WorkflowStep.DisplayResultsFromStorage;
        }
        break;

      case WorkflowStep.ManageHistory:
        if (
          buttonName === 'back-to-history' ||
          buttonName === 'delete-data' ||
          buttonName === 'go-back'
        ) {
          nextStep = WorkflowStep.DisplayResultsFromStorage;
        } else {
          nextStep = WorkflowStep.ManageHistory;
        }
        break;

      default:
        console.warn(
          `No next workflow step defined for current step: ${currentStep}`,
        );
        nextStep = WorkflowStep.SelectPhoto;
    }

    this.utilsService.workflowChangedSub.next(nextStep);
    return nextStep;
  }

  /**
   * Determines whether the back button should be shown in header for the given workflow step.
   * @param currentStep The current workflow step.
   * @returns True if the back button should be shown, false otherwise.
   */
  showBackButton(currentStep: WorkflowStep): boolean {
    return (
      currentStep === WorkflowStep.DisplayExtractedText ||
      currentStep === WorkflowStep.DisplayResultsFromStorage ||
      currentStep === WorkflowStep.ManageHistory
    );
  }

  /**
   * Get the card title based on the current workflow step.
   * If the workflow step is one of the initial steps (SelectPhoto, ExtractText, DisplayExtractedText, AddPhotoInfo),
   * the title will be "Extract Text from Image". Otherwise, it will be "Manage History".
   * @returns The card title as a translated string.
   */
  getCardTitle(currentStep: WorkflowStep): string {
    if (
      currentStep === WorkflowStep.SelectPhoto ||
      currentStep === WorkflowStep.ExtractText ||
      currentStep === WorkflowStep.DisplayExtractedText ||
      currentStep === WorkflowStep.AddPhotoInfo
    ) {
      return this.translate.instant('FEATURE.CARD.TITLE');
    } else {
      return this.translate.instant('FEATURE.CARD.TITLE-HISTORY');
    }
  }
}
