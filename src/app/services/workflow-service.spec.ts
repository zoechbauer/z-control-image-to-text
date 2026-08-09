import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { WorkflowService } from './workflow-service';
import { WorkflowStep } from '../shared/enums';
import { UtilsService } from './utils.service';
import { createTranslateServiceMock } from '../testing/translate-service.mock';

describe('WorkflowService', () => {
  let service: WorkflowService;
  const workflowChangedSub = new Subject<WorkflowStep>();
  const utilsServiceMock = {
    workflowChangedSub,
    workflowChanged$: workflowChangedSub.asObservable(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: UtilsService, useValue: utilsServiceMock },
      ],
    });
    service = TestBed.inject(WorkflowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showBackButton', () => {
    it('should set showBackButton to true when workflowChanged$ emits a relevant workflow step', () => {
      const relevantSteps: WorkflowStep[] = [
        WorkflowStep.DisplayExtractedText,
        WorkflowStep.DisplayResultsFromStorage,
        WorkflowStep.ManageHistory,
      ];

      relevantSteps.forEach((step: WorkflowStep) => {
        const result = service.showBackButton(step);
        expect(result).toBeTrue();
      });
    });

    it('should set showBackButton to false when workflowChanged$ emits a non-relevant workflow step', () => {
      const nonRelevantSteps: WorkflowStep[] = [
        WorkflowStep.SelectPhoto,
        WorkflowStep.AddPhotoInfo,
        WorkflowStep.UpdatePhotoInfo,
      ];

      nonRelevantSteps.forEach((step: WorkflowStep) => {
        const result = service.showBackButton(step);
        expect(result).toBeFalse();
      });
    });
  });
});
