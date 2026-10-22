import { Injectable, inject } from '@angular/core';
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
    const target = event?.target as HTMLElement | null;
    const buttonName = target?.getAttribute('name') ?? null;

    let nextStep: WorkflowStep;

    switch (currentStep) {
      case WorkflowStep.SelectPhoto:
        nextStep = this.nextForSelectPhoto(buttonName);
        break;

      case WorkflowStep.ExtractText:
        nextStep = this.nextForExtractText(buttonName);
        break;

      case WorkflowStep.DisplayExtractedText:
        nextStep = this.nextForDisplayExtractedText(buttonName);
        break;

      case WorkflowStep.DisplayResultsFromStorage:
        nextStep = this.nextForDisplayResultsFromStorage(selectedPhoto, buttonName);
        break;

      case WorkflowStep.ManageHistory:
        nextStep = this.nextForManageHistory(buttonName);
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

  private nextForSelectPhoto(buttonName: string | null): WorkflowStep {
    return buttonName === 'load-data'
      ? WorkflowStep.DisplayResultsFromStorage
      : WorkflowStep.ExtractText;
  }

  private nextForExtractText(buttonName: string | null): WorkflowStep {
    return buttonName === 'delete-photo'
      ? WorkflowStep.SelectPhoto
      : WorkflowStep.DisplayExtractedText;
  }

  private nextForDisplayExtractedText(buttonName: string | null): WorkflowStep {
    return buttonName === 'go-back'
      ? WorkflowStep.SelectPhoto
      : WorkflowStep.DisplayExtractedText;
  }

  private nextForDisplayResultsFromStorage(
    selectedPhoto: UserPhoto | undefined,
    buttonName: string | null,
  ): WorkflowStep {
    if (selectedPhoto) {
      return WorkflowStep.ManageHistory;
    }
    return buttonName === 'go-back'
      ? WorkflowStep.SelectPhoto
      : WorkflowStep.DisplayResultsFromStorage;
  }

  private nextForManageHistory(buttonName: string | null): WorkflowStep {
    const backActions = new Set(['back-to-history', 'delete-data', 'go-back']);
    return backActions.has(buttonName ?? '')
      ? WorkflowStep.DisplayResultsFromStorage
      : WorkflowStep.ManageHistory;
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
