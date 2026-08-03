import { Injectable } from '@angular/core';
import { WorkflowStep } from '../shared/enums';
import { UserPhoto } from '../shared/app.interfaces';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
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

    if (buttonName === 'back-to-previous') {
      return WorkflowStep.SelectPhoto;
    }

    switch (currentStep) {
      case WorkflowStep.SelectPhoto:
        if (buttonName === 'load-data') {
          nextStep = WorkflowStep.DisplayResultsFromStorage;
        } else {
          nextStep = WorkflowStep.ExtractText;
        }
        break;

      case WorkflowStep.ExtractText:
        nextStep = WorkflowStep.DisplayExtractedText;
        break;

      case WorkflowStep.DisplayExtractedText:
        nextStep = WorkflowStep.DisplayExtractedText;
        break;

      case WorkflowStep.DisplayResultsFromStorage:
        if (selectedPhoto) {
          nextStep = WorkflowStep.ManageHistory;
        } else {
          nextStep = WorkflowStep.DisplayResultsFromStorage;
        }
        break;

      case WorkflowStep.ManageHistory:
        if (buttonName === 'back-to-history' || buttonName === 'delete-data') {
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

    return nextStep;
  }
}
