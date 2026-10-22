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

  describe('getCardTitle', () => {
    it('should return the correct card title for each workflow step', () => {
      const stepsWithTitles: { step: WorkflowStep; title: string }[] = [
        { step: WorkflowStep.SelectPhoto, title: 'FEATURE.CARD.TITLE' },
        { step: WorkflowStep.AddPhotoInfo, title: 'FEATURE.CARD.TITLE' },
        { step: WorkflowStep.ExtractText, title: 'FEATURE.CARD.TITLE' },
        {
          step: WorkflowStep.DisplayExtractedText,
          title: 'FEATURE.CARD.TITLE',
        },
        {
          step: WorkflowStep.DisplayResultsFromStorage,
          title: 'FEATURE.CARD.TITLE-HISTORY',
        },
        {
          step: WorkflowStep.UpdatePhotoInfo,
          title: 'FEATURE.CARD.TITLE-HISTORY',
        },
        {
          step: WorkflowStep.ManageHistory,
          title: 'FEATURE.CARD.TITLE-HISTORY',
        },
      ];

      stepsWithTitles.forEach(({ step, title }) => {
        const result = service.getCardTitle(step);
        expect(result).withContext(`Failed for step: ${step}`).toBe(title);
      });
    });
  });

  describe('getNextWorkflowStep', () => {
    let workflowChangedSpy: jasmine.Spy;
    beforeEach(() => {
      workflowChangedSpy = spyOn(utilsServiceMock.workflowChangedSub, 'next');
    });

    it('should log warning for invalid workflow step', () => {
      let warningSpy = spyOn(console, 'warn');
      const validWorkflowSteps: Set<WorkflowStep> = new Set([
        WorkflowStep.SelectPhoto,
        WorkflowStep.ExtractText,
        WorkflowStep.DisplayExtractedText,
        WorkflowStep.DisplayResultsFromStorage,
        WorkflowStep.ManageHistory,
      ]);
      const allWorkflowSteps: WorkflowStep[] = [
        WorkflowStep.SelectPhoto,
        WorkflowStep.AddPhotoInfo,
        WorkflowStep.ExtractText,
        WorkflowStep.DisplayExtractedText,
        WorkflowStep.DisplayResultsFromStorage,
        WorkflowStep.UpdatePhotoInfo,
        WorkflowStep.ManageHistory,
      ];
      allWorkflowSteps.forEach((step) => {
        warningSpy.calls.reset();
        workflowChangedSpy.calls.reset();

        const event = {
          target: { getAttribute: (name: string) => 'some-event' },
        } as any;

        const result = service.getNextWorkflowStep(step, event);
        const isValidStep = validWorkflowSteps.has(step);
        
        if (!isValidStep) {
          expect(workflowChangedSpy).toHaveBeenCalledWith(
            WorkflowStep.SelectPhoto,
          );
          expect(warningSpy)
            .withContext(`Failed for step: ${step}`)
            .toHaveBeenCalledWith(
              `No next workflow step defined for current step: ${step}`,
            );
        }

        if (isValidStep) {
          expect(warningSpy)
            .withContext(`Failed for step: ${step}`)
            .not.toHaveBeenCalled();
        }
      });
    });

    it('SelectPhoto: load-data -> DisplayResultsFromStorage', () => {
      const event = {
        target: { getAttribute: (name: string) => 'load-data' },
      } as any;

      const result = service.getNextWorkflowStep(
        WorkflowStep.SelectPhoto,
        event,
      );

      expect(result).toBe(WorkflowStep.DisplayResultsFromStorage);
      expect(workflowChangedSpy).toHaveBeenCalledWith(
        WorkflowStep.DisplayResultsFromStorage,
      );
    });

    it('SelectPhoto: other -> ExtractText', () => {
      const event = {
        target: { getAttribute: (name: string) => 'some-other' },
      } as any;

      const result = service.getNextWorkflowStep(
        WorkflowStep.SelectPhoto,
        event,
      );

      expect(result).toBe(WorkflowStep.ExtractText);
      expect(workflowChangedSpy).toHaveBeenCalledWith(WorkflowStep.ExtractText);
    });

    it('ExtractText: delete-photo -> SelectPhoto', () => {
      const event = {
        target: { getAttribute: (name: string) => 'delete-photo' },
      } as any;

      const result = service.getNextWorkflowStep(
        WorkflowStep.ExtractText,
        event,
      );

      expect(result).toBe(WorkflowStep.SelectPhoto);
      expect(workflowChangedSpy).toHaveBeenCalledWith(WorkflowStep.SelectPhoto);
    });

    it('ExtractText: other -> DisplayExtractedText', () => {
      const event = { target: { getAttribute: (name: string) => null } } as any;

      const result = service.getNextWorkflowStep(
        WorkflowStep.ExtractText,
        event,
      );

      expect(result).toBe(WorkflowStep.DisplayExtractedText);
      expect(workflowChangedSpy).toHaveBeenCalledWith(
        WorkflowStep.DisplayExtractedText,
      );
    });

    it('DisplayExtractedText: go-back -> SelectPhoto', () => {
      const event = {
        target: { getAttribute: (name: string) => 'go-back' },
      } as any;

      const result = service.getNextWorkflowStep(
        WorkflowStep.DisplayExtractedText,
        event,
      );

      expect(result).toBe(WorkflowStep.SelectPhoto);
      expect(workflowChangedSpy).toHaveBeenCalledWith(WorkflowStep.SelectPhoto);
    });

    it('DisplayExtractedText: other -> DisplayExtractedText', () => {
      const event = {
        target: { getAttribute: (name: string) => 'continue' },
      } as any;

      const result = service.getNextWorkflowStep(
        WorkflowStep.DisplayExtractedText,
        event,
      );

      expect(result).toBe(WorkflowStep.DisplayExtractedText);
      expect(workflowChangedSpy).toHaveBeenCalledWith(
        WorkflowStep.DisplayExtractedText,
      );
    });

    it('DisplayResultsFromStorage: with selectedPhoto -> ManageHistory', () => {
      const event = { target: { getAttribute: (name: string) => null } } as any;
      const selectedPhoto = {} as any;

      const result = service.getNextWorkflowStep(
        WorkflowStep.DisplayResultsFromStorage,
        event,
        selectedPhoto,
      );

      expect(result).toBe(WorkflowStep.ManageHistory);
      expect(workflowChangedSpy).toHaveBeenCalledWith(
        WorkflowStep.ManageHistory,
      );
    });

    it('DisplayResultsFromStorage: go-back -> SelectPhoto when no selectedPhoto', () => {
      const event = {
        target: { getAttribute: (name: string) => 'go-back' },
      } as any;

      const result = service.getNextWorkflowStep(
        WorkflowStep.DisplayResultsFromStorage,
        event,
      );

      expect(result).toBe(WorkflowStep.SelectPhoto);
      expect(workflowChangedSpy).toHaveBeenCalledWith(WorkflowStep.SelectPhoto);
    });

    it('DisplayResultsFromStorage: other -> DisplayResultsFromStorage when no selectedPhoto', () => {
      const event = {
        target: { getAttribute: (name: string) => 'something' },
      } as any;

      const result = service.getNextWorkflowStep(
        WorkflowStep.DisplayResultsFromStorage,
        event,
      );

      expect(result).toBe(WorkflowStep.DisplayResultsFromStorage);
      expect(workflowChangedSpy).toHaveBeenCalledWith(
        WorkflowStep.DisplayResultsFromStorage,
      );
    });

    it('ManageHistory: back actions -> DisplayResultsFromStorage', () => {
      const events = [
        {
          target: { getAttribute: (name: string) => 'back-to-history' },
        } as any,
        { target: { getAttribute: (name: string) => 'delete-data' } } as any,
        { target: { getAttribute: (name: string) => 'go-back' } } as any,
      ];
      for (const event of events) {
        const result = service.getNextWorkflowStep(
          WorkflowStep.ManageHistory,
          event,
        );

        expect(result)
          .withContext(`Event: ${event.target.getAttribute('name')}`)
          .toBe(WorkflowStep.DisplayResultsFromStorage);
        expect(workflowChangedSpy).toHaveBeenCalledWith(
          WorkflowStep.DisplayResultsFromStorage,
        );
      }
    });

    it('ManageHistory: other -> ManageHistory', () => {
      const event = {
        target: { getAttribute: (name: string) => 'edit' },
      } as any;

      const result = service.getNextWorkflowStep(
        WorkflowStep.ManageHistory,
        event,
      );

      expect(result).toBe(WorkflowStep.ManageHistory);
      expect(workflowChangedSpy).toHaveBeenCalledWith(
        WorkflowStep.ManageHistory,
      );
    });
  });
});
