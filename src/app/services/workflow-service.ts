import { Injectable } from '@angular/core';
import { WorkflowStep } from '../shared/enums';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  getNextWorkflowStep(currentStep: WorkflowStep, event?: any): WorkflowStep {
    let nextStep: WorkflowStep;

    const target = event?.target as HTMLElement | null;
    const buttonName = target?.getAttribute('name') ?? null;

    if (buttonName === 'clear') {
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
        nextStep = WorkflowStep.DisplayResultsFromStorage;
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
