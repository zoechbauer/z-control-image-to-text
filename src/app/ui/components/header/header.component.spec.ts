import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';

import { HeaderComponent } from './header.component';
import { TranslateService } from '@ngx-translate/core';
import { UtilsService } from '@app/services/utils.service';
import { Tab, WorkflowStep } from '@app/shared/enums';
import { Subject } from 'rxjs';
import { createTranslateServiceMock } from '@testing/translate-service.mock';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let utilsService: UtilsService;
  
  const modalControllerSpy = jasmine.createSpyObj('ModalController', [
    'create',
  ]);
  const logoClickedSub = new Subject<boolean>();
  const workflowChangedSub = new Subject<WorkflowStep>();
  const backButtonClickedSub = new Subject<void>();
  const _isSmallScreen = false;
  const utilsServiceMock = {
    get isSmallScreen() {
      return _isSmallScreen;
    },
    isShowIonTabBar: true,
    navigateToTab: jasmine.createSpy('navigateToTab'),
    openHelpModal: jasmine
      .createSpy('openHelpModal')
      .and.returnValue(Promise.resolve()),
    navigateToTabWithParams: jasmine.createSpy('navigateToTabWithParams'),
    logoClickedSub,
    logoClicked$: logoClickedSub.asObservable(),
    workflowChangedSub,
    workflowChanged$: workflowChangedSub.asObservable(),
    backButtonClickedSub,
    backButtonClicked$: backButtonClickedSub.asObservable(),
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [IonicModule.forRoot(), HeaderComponent],
      providers: [
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: UtilsService, useValue: utilsServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    utilsService = TestBed.inject(UtilsService);
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call utilsService.openHelpModal', async () => {
    await component.openHelpModal();
    expect(utilsService.openHelpModal).toHaveBeenCalled();
  });

  it('should call utilsService.navigateToTab with Tab.MainFeature and Tab.Settings', () => {
    component.goToMainFeature();
    expect(utilsService.navigateToTab).toHaveBeenCalledWith(Tab.MainFeature);

    component.goToSettings();
    expect(utilsService.navigateToTab).toHaveBeenCalledWith(Tab.Settings);
  });

  it('should return correct values for onMainFeatureTab and onSettingsTab', () => {
    component.currentTab = Tab.MainFeature;

    expect(component.onMainFeatureTab).toBeTrue();
    expect(component.onSettingsTab).toBeFalse();
  });

  it('should navigate to Tab.Settings with params and emit logoClickedSub after 500ms', (done) => {
    spyOn(utilsService.logoClickedSub, 'next');
    component.goToSettingsAndOpenFeedback();

    expect(utilsService.navigateToTabWithParams).toHaveBeenCalledWith(
      Tab.Settings,
      { open: 'z-control' },
    );
    setTimeout(() => {
      expect(utilsService.logoClickedSub.next).toHaveBeenCalledWith(true);
      done();
    }, 510);
  });

  it('should return true for isLargeScreen if utilsService.isSmallScreen is false', () => {
    Object.defineProperty(utilsService, 'isSmallScreen', { get: () => false });
    expect(component.isLargeScreen).toBeTrue();
  });

  it('should return false for isLargeScreen if utilsService.isSmallScreen is true', () => {
    Object.defineProperty(utilsService, 'isSmallScreen', { get: () => true });
    expect(component.isLargeScreen).toBeFalse();
  });

  describe('showBackButton', () => {
    it('should set showBackButton to true when workflowChanged$ emits a relevant workflow step', () => {
      const relevantSteps: WorkflowStep[] = [
        WorkflowStep.DisplayExtractedText,
        WorkflowStep.DisplayResultsFromStorage,
        WorkflowStep.ManageHistory,
      ];

      relevantSteps.forEach((step: WorkflowStep) => {
        utilsService.workflowChangedSub.next(step);

        expect(component.showBackButton).toBeTrue();
      });
    });

    it('should set showBackButton to false when workflowChanged$ emits a non-relevant workflow step', () => {
      const nonRelevantSteps: WorkflowStep[] = [
        WorkflowStep.SelectPhoto,
        WorkflowStep.AddPhotoInfo,
        WorkflowStep.UpdatePhotoInfo,
      ];

      nonRelevantSteps.forEach((step: WorkflowStep) => {
        utilsService.workflowChangedSub.next(step);

        expect(component.showBackButton).toBeFalse();
      });
    });
  });

  it('should emit backButtonClicked$ when the back button is clicked', () => {
    const spy = spyOn(utilsService.backButtonClickedSub, 'next');
    component.goBack(new Event('click'));
    
    expect(spy).toHaveBeenCalledWith(true);
  });
});
