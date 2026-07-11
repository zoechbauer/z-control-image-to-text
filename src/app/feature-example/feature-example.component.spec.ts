import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';
import { ToastService } from '../services/toast.service';
import { FirebaseFirestoreService } from '../services/firebase-firestore.service';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils.service';
import { ToastAnchor } from '../shared/enums';
import { createTranslateServiceMock } from '../testing/translate-service.mock';
import { UserStatisticComponent } from '../ui/components/user-statistic/user-statistic.component';
import { SpinnerComponent } from '../ui/components/spinner/spinner.component';
import { FeatureExampleComponent } from './feature-example.component';
import { FeatureService } from '../services/feature.service';

@Component({
  selector: 'app-user-statistic',
  template: '',
  standalone: true,
})
class MockUserStatisticComponent {}

@Component({
  selector: 'app-spinner',
  template: '',
  standalone: true,
})
class MockSpinnerComponent {}

describe('FeatureExampleComponent', () => {
  let component: FeatureExampleComponent;
  let fixture: ComponentFixture<FeatureExampleComponent>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;
  let firestoreUtilsServiceSpy: jasmine.SpyObj<FirebaseFirestoreUtilsService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let featureServiceSpy: jasmine.SpyObj<FeatureService>;

  beforeEach(async () => {
    utilsServiceSpy = jasmine.createSpyObj('UtilsService', [
      'showOrHideIonTabBar',
    ]);
    firestoreUtilsServiceSpy = jasmine.createSpyObj(
      'FirebaseFirestoreUtilsService',
      ['isContingentExceeded', 'requestStatisticsRefresh'],
    );
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['showToast']);
    featureServiceSpy = jasmine.createSpyObj('FeatureService', [
      'secureFeatureCloudFunction',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        MockUserStatisticComponent,
        MockSpinnerComponent,
        FeatureExampleComponent,
      ],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        {
          provide: LocalStorageService,
          useValue: {
            selectedLanguage$: of('de'),
            selectedLanguageName$: of('Deutsch (de)'),
          },
        },
        {
          provide: UtilsService,
          useValue: utilsServiceSpy,
        },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: FirebaseFirestoreService, useValue: {} },
        {
          provide: FirebaseFirestoreUtilsService,
          useValue: firestoreUtilsServiceSpy,
        },
        { provide: FeatureService, useValue: featureServiceSpy },
      ],
    })
      .overrideComponent(FeatureExampleComponent, {
        remove: {
          imports: [UserStatisticComponent, SpinnerComponent],
        },
        add: {
          imports: [MockUserStatisticComponent, MockSpinnerComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FeatureExampleComponent);
    component = fixture.componentInstance;
  });

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    describe('clear', () => {
      it('should call initFormControls', () => {
        const initFormControlsSpy = spyOn<any>(component, 'initFormControls');
        component.clear();
        expect(initFormControlsSpy).toHaveBeenCalled();
      });
      
      it('should init form controls if initFormControls() is called', () => {
        component.featureInput = 'Some text';
        component.relatedWords = ['word1', 'word2'];
        component.searchBtnDisabled = true;
        component.clearBtnDisabled = false;
        (component as any).initFormControls();

        expect(component.featureInput).toBe('');
        expect(component.relatedWords).toEqual([]);
        expect(component.searchBtnDisabled).toBeTrue();
        expect(component.clearBtnDisabled).toBeTrue();
      });
    });

    describe('search', () => {
      let originalSimulate: boolean;

      beforeEach(() => {
        component.featureInput = 'Some text';
        firestoreUtilsServiceSpy.isContingentExceeded.and.returnValue(
          Promise.resolve(false),
        );
      });

      it('should set isContingentExceeded to true if contingent is exceeded', async () => {
        firestoreUtilsServiceSpy.isContingentExceeded.and.returnValue(
          Promise.resolve(true),
        );
        await (component as any).updateIsContingentExceeded();
        expect(component.isContingentExceeded).toBeTrue();
      });

      it('should show contingent exceeded toast and not call secureFeatureCloudFunction if contingent is exceeded', async () => {
        firestoreUtilsServiceSpy.isContingentExceeded.and.returnValue(
          Promise.resolve(true),
        );
        await component.search();

        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.CONTINGENT_EXCEEDED',
          ToastAnchor.MainPage,
        );
        expect(component.isLoading).toBeFalse();
        expect(
          featureServiceSpy.secureFeatureCloudFunction,
        ).not.toHaveBeenCalled();
      });

      it('should show contingent exceeded toast and clear isLoading if secureFeatureCloudFunction throws an error which contains contingent', async () => {
        component.isLoading = true;
        featureServiceSpy.secureFeatureCloudFunction.and.throwError(
          new Error('Feature quota/contingent exceeded'),
        );
        await component.search();

        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.CONTINGENT_EXCEEDED',
          ToastAnchor.MainPage,
        );
        expect(toastServiceSpy.showToast).not.toHaveBeenCalledWith(
          'FEATURE.TOAST.QUOTA_REDUCED',
          ToastAnchor.MainPage,
        );
        expect(component.isLoading).toBeFalse();
      });

      it('should log error, show error toast and clear isLoading if secureFeatureCloudFunction throws an error', async () => {
        component.isLoading = true;
        const consoleErrorSpy = spyOn(console, 'error');
        featureServiceSpy.secureFeatureCloudFunction.and.throwError(
          new Error('Feature execution failed'),
        );
        await component.search();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Feature error:',
          new Error('Feature execution failed'),
        );
        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.ERROR_CALLING_FEATURE',
          ToastAnchor.MainPage,
        );
        expect(toastServiceSpy.showToast).not.toHaveBeenCalledWith(
          'FEATURE.TOAST.QUOTA_REDUCED',
          ToastAnchor.MainPage,
        );
        expect(component.isLoading).toBeFalse();
        (console.error as jasmine.Spy).calls.reset();
      });

      it('should call secureFeatureCloudFunction if input is set', async () => {
        await component.search();
        expect(featureServiceSpy.secureFeatureCloudFunction).toHaveBeenCalled();
      });

      it('should refresh statistics and show completion toast if secureFeatureCloudFunction returns result', async () => {
        featureServiceSpy.secureFeatureCloudFunction.and.returnValue(
          Promise.resolve({
            feature: { text: 'Linz', related: 'upper austria' },
          }),
        );
        await component.search();

        expect(featureServiceSpy.secureFeatureCloudFunction).toHaveBeenCalled();
        expect(
          firestoreUtilsServiceSpy.requestStatisticsRefresh,
        ).toHaveBeenCalled();
        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.QUOTA_REDUCED',
          ToastAnchor.MainPage,
        );
      });

      it('should clear isLoading indicator after search is completed', async () => {
        component.isLoading = true;
        featureServiceSpy.secureFeatureCloudFunction.and.returnValue(
          Promise.resolve({
            feature: { text: 'Linz', related: 'upper austria' },
          }),
        );
        await component.search();
        expect(component.isLoading).toBeFalse();
      });
    });
  });
});
