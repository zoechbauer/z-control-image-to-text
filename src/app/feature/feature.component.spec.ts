import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';
import { of } from 'rxjs';

import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';
import { ToastService } from '../services/toast.service';
import { FirebaseFirestoreService } from '../services/firebase-firestore.service';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils.service';
import { ToastAnchor, WorkflowStep } from '../shared/enums';
import { createTranslateServiceMock } from '../testing/translate-service.mock';
import { UserStatisticComponent } from '../ui/components/user-statistic/user-statistic.component';
import { SpinnerComponent } from '../ui/components/spinner/spinner.component';
import { FeatureComponent } from './feature.component';
import { OcrService } from '../services/ocr.service';
import { PhotoService } from '../services/photo.service';
import { PhotoStorageService } from '../services/photo-storage.service';
import { ImageCompressionService } from '../services/image-compression.service';

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

describe('FeatureComponent', () => {
  let component: FeatureComponent;
  let fixture: ComponentFixture<FeatureComponent>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;
  let firestoreUtilsServiceSpy: jasmine.SpyObj<FirebaseFirestoreUtilsService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let ocrServiceSpy: jasmine.SpyObj<OcrService>;
  let photoServiceSpy: jasmine.SpyObj<any>;
  let photoStorageServiceSpy: jasmine.SpyObj<any>;
  let imageCompressionServiceSpy: jasmine.SpyObj<any>;

  beforeEach(async () => {
    utilsServiceSpy = jasmine.createSpyObj('UtilsService', [
      'showOrHideIonTabBar',
    ]);
    firestoreUtilsServiceSpy = jasmine.createSpyObj(
      'FirebaseFirestoreUtilsService',
      ['isContingentExceeded', 'requestStatisticsRefresh'],
    );
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['showToast']);
    ocrServiceSpy = jasmine.createSpyObj('OcrService', ['secureRecognize']);
    photoServiceSpy = jasmine.createSpyObj('PhotoService', [
      'makePhoto',
      'selectPhoto',
      'getLastPhoto',
      'deleteAllPhotos',
    ]);
    imageCompressionServiceSpy = jasmine.createSpyObj(
      'ImageCompressionService',
      ['compress', 'buildVisionOcrRequestFromPhoto'],
    );
    photoStorageServiceSpy = jasmine.createSpyObj('PhotoStorageService', [
      'loadSavedPhotos',
      'getPhotosFromCache',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        IonicModule.forRoot(),
        MockUserStatisticComponent,
        MockSpinnerComponent,
        FeatureComponent,
      ],
      providers: [
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        { provide: Storage, useValue: {} },
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
        { provide: OcrService, useValue: ocrServiceSpy },
        { provide: PhotoService, useValue: photoServiceSpy },
        { provide: PhotoStorageService, useValue: photoStorageServiceSpy },
        {
          provide: ImageCompressionService,
          useValue: imageCompressionServiceSpy,
        },
      ],
    })
      .overrideComponent(FeatureComponent, {
        remove: {
          imports: [UserStatisticComponent, SpinnerComponent],
        },
        add: {
          imports: [MockUserStatisticComponent, MockSpinnerComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FeatureComponent);
    component = fixture.componentInstance;
  });

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    describe('clear', () => {
      it('should call initFormControls', () => {
        const initFormControlsSpy = spyOn<any>(component, 'initFormControls');
        component.clear({} as any);
        expect(initFormControlsSpy).toHaveBeenCalled();
      });

      it('should init form controls if initFormControls() is called', () => {
        (component as any).initFormControls();

        expect(component.selectedPhoto).toBeUndefined();
        expect(component.extractedText).toBe('');
        expect(component.extractedTextItems).toEqual([]);
        expect(component.workflowStep).toBe(WorkflowStep.SelectPhoto);
      });
    });

    describe('extractTextFromPhoto', () => {
      beforeEach(() => {
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

      it('should show contingent exceeded toast and not call secureRecognize if contingent is exceeded', async () => {
        firestoreUtilsServiceSpy.isContingentExceeded.and.returnValue(
          Promise.resolve(true),
        );
        component.selectedPhoto = { filepath: 'path/to/photo.jpg' } as any;

        await component.extractTextFromPhoto();

        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.CONTINGENT_EXCEEDED',
          ToastAnchor.MainPage,
        );
        expect(component.isLoading).toBeFalse();
        expect(
          ocrServiceSpy.secureRecognize as jasmine.Spy,
        ).not.toHaveBeenCalled();
      });

      const TEST_NAME =
        'should show contingent exceeded toast and clear isLoading ' +
        'if secureRecognize throws an error which contains contingent';
      it(TEST_NAME, async () => {
        component.isLoading = true;
        component.selectedPhoto = { filepath: 'path/to/photo.jpg' } as any;
        imageCompressionServiceSpy.buildVisionOcrRequestFromPhoto.and.returnValue(
          Promise.resolve({
            requests: [
              {
                image: { content: 'compressedBase64String' },
                features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
              },
            ],
          }),
        );
        ocrServiceSpy.secureRecognize.and.throwError(
          new Error('Feature quota/contingent exceeded'),
        );
        await component.extractTextFromPhoto();

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

      it('should log error, show error toast and clear isLoading if secureRecognize throws an error', async () => {
        component.isLoading = true;
        const consoleErrorSpy = spyOn(console, 'error');
        component.selectedPhoto = { filepath: 'path/to/photo.jpg' } as any;
        imageCompressionServiceSpy.buildVisionOcrRequestFromPhoto.and.returnValue(
          Promise.resolve({
            requests: [
              {
                image: { content: 'compressedBase64String' },
                features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
              },
            ],
          }),
        );
        ocrServiceSpy.secureRecognize.and.throwError(
          new Error('Feature execution failed'),
        );
        await component.extractTextFromPhoto();

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

      it('should call secureRecognize if input is set', async () => {
        component.selectedPhoto = { filepath: 'path/to/photo.jpg' } as any;
        imageCompressionServiceSpy.buildVisionOcrRequestFromPhoto.and.returnValue(
          Promise.resolve({
            requests: [
              {
                image: { content: 'compressedBase64String' },
                features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
              },
            ],
          }),
        );
        await component.extractTextFromPhoto();
        expect(ocrServiceSpy.secureRecognize).toHaveBeenCalled();
      });

      it('should refresh statistics and show completion toast if secureRecognize returns result', async () => {
        ocrServiceSpy.secureRecognize.and.returnValue(
          Promise.resolve({
            text: 'Extracted Text from Photo\nSuper Tool!',
            featureType: 'text',
          }),
        );
        component.selectedPhoto = { filepath: 'path/to/photo.jpg' } as any;
        imageCompressionServiceSpy.buildVisionOcrRequestFromPhoto.and.returnValue(
          Promise.resolve({
            requests: [
              {
                image: { content: 'compressedBase64String' },
                features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
              },
            ],
          }),
        );

        await component.extractTextFromPhoto();

        expect(
          imageCompressionServiceSpy.buildVisionOcrRequestFromPhoto,
        ).toHaveBeenCalled();
        expect(ocrServiceSpy.secureRecognize).toHaveBeenCalled();
        expect(
          firestoreUtilsServiceSpy.requestStatisticsRefresh,
        ).toHaveBeenCalled();
        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.QUOTA_REDUCED',
          ToastAnchor.MainPage,
        );
      });

      it('should clear isLoading indicator after extractTextFromPhoto is completed', async () => {
        component.isLoading = true;
        ocrServiceSpy.secureRecognize.and.returnValue(
          Promise.resolve({
            text: 'Extracted Text from Photo\nSuper Tool!',
            featureType: 'text',
          }),
        );
        await component.extractTextFromPhoto();
        expect(component.isLoading).toBeFalse();
      });

      it('should show toast if no photo is selected', async () => {
        component.selectedPhoto = undefined;
        await component.extractTextFromPhoto();

        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.ERROR_NO_PHOTO_SELECTED',
          ToastAnchor.MainPage,
        );
      });
    });
  });
});
