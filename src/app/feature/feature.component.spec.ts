import { ClipboardService } from './../services/clipboard.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';
import { Capacitor } from '@capacitor/core';
import { of, BehaviorSubject } from 'rxjs';

import { createTranslateServiceMock } from '../testing/translate-service.mock';
import { ToastAnchor, WorkflowStep } from '../shared/enums';
import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';
import { ToastService } from '../services/toast.service';
import { FirebaseFirestoreService } from '../services/firebase-firestore.service';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils.service';
import { OcrService } from '../services/ocr.service';
import { PhotoService } from '../services/photo.service';
import { PhotoStorageService } from '../services/photo-storage.service';
import { ImageCompressionService } from '../services/image-compression.service';
import { WorkflowService } from '../services/workflow-service';
import { AlertService } from '../services/alert.service';
import { UserStatisticComponent } from '../ui/components/user-statistic/user-statistic.component';
import { SpinnerComponent } from '../ui/components/spinner/spinner.component';
import { FeatureComponent } from './feature.component';
import { UserPhoto } from '../shared/app.interfaces';

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

const photos: UserPhoto[] = [
  {
    filepath: 'path/to/photo1.jpeg',
    photoInfo: { title: 'Photo 1' },
  } as any as UserPhoto,
  {
    filepath: 'path/to/photo2.jpeg',
    photoInfo: { title: 'Photo 2' },
  } as any as UserPhoto,
  {
    filepath: 'path/to/photo3.jpeg',
    photoInfo: { title: 'Photo 3' },
  } as any as UserPhoto,
];

describe('FeatureComponent', () => {
  let component: FeatureComponent;
  let fixture: ComponentFixture<FeatureComponent>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;
  let firestoreUtilsServiceSpy: jasmine.SpyObj<FirebaseFirestoreUtilsService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let ocrServiceSpy: jasmine.SpyObj<OcrService>;
  let photoServiceSpy: jasmine.SpyObj<PhotoService>;
  let photoStorageServiceSpy: jasmine.SpyObj<PhotoStorageService>;
  let photoStoragePhotosSubject: BehaviorSubject<UserPhoto[]>;
  let imageCompressionServiceSpy: jasmine.SpyObj<ImageCompressionService>;
  let modalControllerSpy: jasmine.SpyObj<ModalController>;
  let workflowServiceSpy: jasmine.SpyObj<WorkflowService>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let clipboardServiceSpy: jasmine.SpyObj<ClipboardService>;

  beforeEach(async () => {
    utilsServiceSpy = jasmine.createSpyObj(
      'UtilsService',
      ['showOrHideIonTabBar', 'openPhotoInfoModal'],
      {
        backButtonClicked$: of(true),
      },
    );
    modalControllerSpy = jasmine.createSpyObj('ModalController', ['dismiss']);
    firestoreUtilsServiceSpy = jasmine.createSpyObj(
      'FirebaseFirestoreUtilsService',
      ['isContingentExceeded', 'requestStatisticsRefresh'],
    );
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['showToast']);
    ocrServiceSpy = jasmine.createSpyObj('OcrService', ['secureRecognize']);
    photoServiceSpy = jasmine.createSpyObj('PhotoService', [
      'makePhoto',
      'selectPhoto',
    ],
  {
    photos,
  });
    imageCompressionServiceSpy = jasmine.createSpyObj(
      'ImageCompressionService',
      ['compress', 'buildVisionOcrRequestFromPhoto'],
    );
    photoStoragePhotosSubject = new BehaviorSubject<UserPhoto[]>(photos);
    photoStorageServiceSpy = jasmine.createSpyObj(
      'PhotoStorageService',
      [
        'savePhoto',
        'loadSavedPhotos',
        'getPhotosFromCache',
        'deleteAllPhotos',
        'deletePhoto',
        'updatePhotoInfo',
        'getNextPhoto',
        'getPreviousPhoto',
      ],
      {
        photos$: photoStoragePhotosSubject.asObservable(),
      },
    );
    workflowServiceSpy = jasmine.createSpyObj('WorkflowService', [
      'getNextWorkflowStep',
      'getCardTitle',
    ]);
    alertServiceSpy = jasmine.createSpyObj('AlertService', [
      'showCopyAlert',
      'confirmDeletePhotoAlert',
    ]);
    clipboardServiceSpy = jasmine.createSpyObj('ClipboardService', [
      'copyDataToClipboard',
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
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: WorkflowService, useValue: workflowServiceSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: ClipboardService, useValue: clipboardServiceSpy },
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

    // default stubs so tests that don't explicitly define these won't fail
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

    ocrServiceSpy.secureRecognize.and.returnValue(Promise.resolve(undefined));
    component.isLoading = false;
  });

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    describe('getter', () => {
      it('should return the cardTitle', () => {
        const expectedTitle = 'Expected Card Title';
        workflowServiceSpy.getCardTitle.and.returnValue(expectedTitle);
        expect(component.cardTitle).toBe(expectedTitle);
      });

      it('should return the copyShareLabel', () => {
        const isNativeSpy = spyOn(
          Capacitor,
          'isNativePlatform',
        ).and.returnValue(false);
        expect(component.copyShareLabel)
          .withContext('is native platform')
          .toBe('FEATURE.CARD.BUTTON.COPY_DATA');

        isNativeSpy.and.returnValue(true);
        expect(component.copyShareLabel)
          .withContext('is not native platform')
          .toBe('FEATURE.CARD.BUTTON.SHARE_DATA');
      });
    });

    describe('getInfoButtonLabel', () => {
      it('should return the correct label based on photo information', () => {
        const testCases = [
          {
            photoTitle: 'Some Title',
            expectedLabel: 'FEATURE.CARD.BUTTON.CHANGE_INFO',
          },
          { photoTitle: '', expectedLabel: 'FEATURE.CARD.BUTTON.ADD_INFO' },
          {
            photoTitle: undefined,
            expectedLabel: 'FEATURE.CARD.BUTTON.ADD_INFO',
          },
        ];

        testCases.forEach(({ photoTitle, expectedLabel }) => {
          const photo: UserPhoto = { photoInfo: { title: photoTitle } } as any;
          expect(component.getInfoButtonLabel(photo))
            .withContext(`photo title: [${photoTitle}]`)
            .toBe(expectedLabel);
        });
      });
    });

    describe('extractTextFromPhoto', () => {
      beforeEach(() => {
        firestoreUtilsServiceSpy.isContingentExceeded.and.returnValue(
          Promise.resolve(false),
        );
        component.selectedPhoto = { filepath: 'path/to/photo.jpeg' } as any;
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

      const TEST_NAME_2 =
        'should log error, show error toast and clear isLoading ' +
        'if secureRecognize throws an error which does not contain contingent';
      it(TEST_NAME_2, async () => {
        component.isLoading = true;
        const consoleErrorSpy = spyOn(console, 'error');
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

      it('should call secureRecognize with image if input is set', async () => {
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

        expect(ocrServiceSpy.secureRecognize).toHaveBeenCalledWith({
          imageBase64: 'compressedBase64String',
          mode: 'image',
        });
      });

      const TEST_NAME_3 =
        'should call storeAndDisplayFeatureResults, refresh statistics and show completion toast' +
        ' if secureRecognize returns result';
      it(TEST_NAME_3, async () => {
        ocrServiceSpy.secureRecognize.and.returnValue(
          Promise.resolve({
            text: 'Extracted Text from Photo\nSuper Tool!',
            featureType: 'text',
          }),
        );
        component.selectedPhoto = { filepath: 'path/to/photo.jpeg' } as any;
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
        const storeAndDisplayFeatureResultsSpy = spyOn(
          component as any,
          'storeAndDisplayFeatureResults',
        ).and.returnValue(Promise.resolve());

        await component.extractTextFromPhoto();

        expect(
          imageCompressionServiceSpy.buildVisionOcrRequestFromPhoto,
        ).toHaveBeenCalled();
        expect(ocrServiceSpy.secureRecognize).toHaveBeenCalled();
        expect(storeAndDisplayFeatureResultsSpy).toHaveBeenCalled();
        expect(
          firestoreUtilsServiceSpy.requestStatisticsRefresh,
        ).toHaveBeenCalled();
        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.QUOTA_REDUCED',
          ToastAnchor.MainPage,
        );
      });

      it('should show toast if no photo is selected', async () => {
        component.selectedPhoto = undefined;
        await component.extractTextFromPhoto();

        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.ERROR_NO_PHOTO_SELECTED',
          ToastAnchor.MainPage,
        );
      });

      describe('clear loading indicator', () => {
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

        it('should clear isLoading indicator when no photo is selected', async () => {
          component.selectedPhoto = undefined;
          component.isLoading = true;

          await component.extractTextFromPhoto();
          expect(component.isLoading).toBeFalse();
        });

        it('should clear isLoading indicator when contingent is exceeded', async () => {
          component.isLoading = true;
          component.isContingentExceeded = true;

          await component.extractTextFromPhoto();
          expect(component.isLoading).toBeFalse();
        });

        it('should clear isLoading indicator when secureRecognize throws an error', async () => {
          component.isLoading = true;
          ocrServiceSpy.secureRecognize.and.returnValue(
            Promise.reject(new Error('secureRecognize error')),
          );

          await component.extractTextFromPhoto();
          expect(component.isLoading).toBeFalse();
        });
      });
    });

    describe('makePhoto', () => {
      it('should update workflow step and clear loading indicator after making a photo', async () => {
        component.workflowStep = WorkflowStep.SelectPhoto;
        component.isLoading = true;
        photoServiceSpy.makePhoto.and.returnValue(Promise.resolve(true));

        await component.makePhoto();

        expect(component.workflowStep).not.toBe(WorkflowStep.SelectPhoto);
        expect(component.isLoading).toBeFalse();
      });

      it('should not update workflow step but clear isLoading indicator if making a photo fails', async () => {
        component.workflowStep = WorkflowStep.SelectPhoto;
        component.isLoading = true;
        photoServiceSpy.makePhoto.and.returnValue(Promise.resolve(false));

        await component.makePhoto();

        expect(component.workflowStep).toBe(WorkflowStep.SelectPhoto);
        expect(component.isLoading).toBeFalse();
      });

      it('should call initFormControls when making a photo', async () => {
        component.isLoading = true;
        photoServiceSpy.makePhoto.and.returnValue(Promise.resolve(true));

        const initFormControlsSpy = spyOn(component as any, 'initFormControls');

        await component.makePhoto();

        expect(initFormControlsSpy).toHaveBeenCalled();
      });
    });

    describe('selectPhotoFromGallery', () => {
      it('should update workflow step and clear loading indicator after selecting a photo from gallery', async () => {
        component.workflowStep = WorkflowStep.SelectPhoto;
        component.isLoading = true;
        photoServiceSpy.selectPhoto.and.returnValue(Promise.resolve(true));

        await component.selectPhotoFromGallery();

        expect(component.workflowStep).not.toBe(WorkflowStep.SelectPhoto);
        expect(component.isLoading).toBeFalse();
      });

      const TEST_NAME_4 =
        'should not update workflow step but clear isLoading indicator' +
        ' if selecting a photo from gallery fails';
      it(TEST_NAME_4, async () => {
        component.workflowStep = WorkflowStep.SelectPhoto;
        component.isLoading = true;
        photoServiceSpy.selectPhoto.and.returnValue(Promise.resolve(false));

        await component.selectPhotoFromGallery();

        expect(component.workflowStep).toBe(WorkflowStep.SelectPhoto);
        expect(component.isLoading).toBeFalse();
      });

      it('should call initFormControls when selecting a photo from gallery', async () => {
        component.isLoading = true;
        photoServiceSpy.selectPhoto.and.returnValue(Promise.resolve(true));

        const initFormControlsSpy = spyOn(component as any, 'initFormControls');

        await component.selectPhotoFromGallery();

        expect(initFormControlsSpy).toHaveBeenCalled();
      });
    });

    describe('selectHistoryPhoto', () => {
      it('should update workflow step after selecting a photo from history', async () => {
        component.workflowStep = WorkflowStep.DisplayResultsFromStorage;
        component.selectHistoryPhoto(photos[0]);

        expect(component.workflowStep).not.toBe(WorkflowStep.UpdatePhotoInfo);
      });

      it('should call initFormControls when selecting a photo from history', () => {
        const initFormControlsSpy = spyOn(component as any, 'initFormControls');
        component.selectHistoryPhoto(photos[0]);

        expect(initFormControlsSpy).toHaveBeenCalled();
      });

      it('should call displayTextStatistics and update extracted text when selecting a photo from history', () => {
        const displayTextStatisticsSpy = spyOn(
          component as any,
          'displayTextStatistics',
        );
        const expectedExtractedText = photos[0].photoInfo!.extractedText ?? '';
        component.selectHistoryPhoto(photos[0]);

        expect(displayTextStatisticsSpy).toHaveBeenCalled();
        expect(component.extractedText).toBe(expectedExtractedText);
      });
    });

    describe('selectPhotosFromStorage', () => {
      it('should update workflow step and clear loading indicator after selecting a photo from history', async () => {
        component.workflowStep = WorkflowStep.SelectPhoto;
        component.isLoading = true;
        photoStorageServiceSpy.getPhotosFromCache.and.returnValue(
          Promise.resolve(),
        );

        await component.selectPhotosFromStorage(new PointerEvent('click'));

        expect(component.workflowStep).not.toBe(WorkflowStep.SelectPhoto);
        expect(component.isLoading).toBeFalse();
      });

      const TEST_NAME_5 =
        'should not update workflow step, display a toast ' +
        'and clear isLoading indicator if selecting a photo from storage fails';
      it(TEST_NAME_5, async () => {
        component.workflowStep = WorkflowStep.SelectPhoto;
        component.isLoading = true;
        photoStorageServiceSpy.getPhotosFromCache.and.returnValue(
          Promise.reject(),
        );

        await component.selectPhotosFromStorage(new PointerEvent('click'));

        expect(component.workflowStep).toBe(WorkflowStep.SelectPhoto);
        expect(component.isLoading).toBeFalse();
        expect(toastServiceSpy.showToast).toHaveBeenCalled();
      });
    });

    describe('addInfo', async () => {
      it('should call getNextWorkflowStep and savePhotoInfo with the updated info when saving', async () => {
        component.selectedPhoto = {
          photoInfo: { title: 'Some Title', description: 'Some Description' },
        } as any;
        component.workflowStep = WorkflowStep.AddPhotoInfo;

        const savePhotoInfoSpy = spyOn(
          component as any,
          'savePhotoInfo',
        ).and.returnValue(Promise.resolve(component.selectedPhoto));
        utilsServiceSpy.openPhotoInfoModal.and.returnValue(
          Promise.resolve({
            photoInfo: { title: 'Some Title', description: 'Some Description' },
          } as any),
        );

        const currentStep = component.workflowStep;
        await component.addInfo();

        expect(savePhotoInfoSpy).toHaveBeenCalledWith(
          component.selectedPhoto,
          'Some Title',
          'Some Description',
        );
        expect(workflowServiceSpy.getNextWorkflowStep).toHaveBeenCalledWith(
          currentStep,
        );
      });

      it('should call getNextWorkflowStep and not savePhotoInfo when cancelling', async () => {
        component.selectedPhoto = {
          photoInfo: { title: 'Some Title', description: 'Some Description' },
        } as any;
        component.workflowStep = WorkflowStep.AddPhotoInfo;

        const savePhotoInfoSpy = spyOn(
          component as any,
          'savePhotoInfo',
        ).and.returnValue(Promise.resolve(component.selectedPhoto));
        utilsServiceSpy.openPhotoInfoModal.and.returnValue(
          Promise.resolve(undefined),
        );

        const currentStep = component.workflowStep;
        await component.addInfo();

        expect(savePhotoInfoSpy).not.toHaveBeenCalled();
        expect(workflowServiceSpy.getNextWorkflowStep).toHaveBeenCalledWith(
          currentStep,
        );
      });
    });

    describe('changeInfo', async () => {
      it('should call getNextWorkflowStep and savePhotoInfo with the updated info when saving', async () => {
        component.selectedHistoryPhoto = {
          photoInfo: { title: 'Some Title', description: 'Some Description' },
        } as any;
        component.workflowStep = WorkflowStep.UpdatePhotoInfo;

        const savePhotoInfoSpy = spyOn(
          component as any,
          'savePhotoInfo',
        ).and.returnValue(Promise.resolve(component.selectedHistoryPhoto));
        utilsServiceSpy.openPhotoInfoModal.and.returnValue(
          Promise.resolve({
            photoInfo: { title: 'Some Title', description: 'Some Description' },
          } as any),
        );

        const currentStep = component.workflowStep;
        await component.changeInfo();

        expect(savePhotoInfoSpy).toHaveBeenCalledWith(
          component.selectedHistoryPhoto,
          'Some Title',
          'Some Description',
        );
        expect(workflowServiceSpy.getNextWorkflowStep).toHaveBeenCalledWith(
          currentStep,
        );
      });

      it('should call getNextWorkflowStep and not savePhotoInfo when cancelling', async () => {
        component.selectedHistoryPhoto = {
          photoInfo: { title: 'Some Title', description: 'Some Description' },
        } as any;
        component.workflowStep = WorkflowStep.UpdatePhotoInfo;

        const savePhotoInfoSpy = spyOn(
          component as any,
          'savePhotoInfo',
        ).and.returnValue(Promise.resolve(component.selectedHistoryPhoto));
        utilsServiceSpy.openPhotoInfoModal.and.returnValue(
          Promise.resolve(undefined),
        );

        const currentStep = component.workflowStep;
        await component.changeInfo();

        expect(savePhotoInfoSpy).not.toHaveBeenCalled();
        expect(workflowServiceSpy.getNextWorkflowStep).toHaveBeenCalledWith(
          currentStep,
        );
      });
    });

    describe('store and display feature results', () => {
      it('should store extracted text and call displayTextStatistics', async () => {
        const featureResults = { text: 'some extracted text' } as any;
        const initialPhoto = {
          photoInfo: { title: 'Title', description: 'Description' },
        } as any;
        component.selectedPhoto = initialPhoto;
        const statistcsSpy = spyOn(component as any, 'displayTextStatistics');

        const photoWithExtractedText = {
          ...initialPhoto,
          photoInfo: { extractedText: featureResults.text },
        } as any;

        photoStorageServiceSpy.updatePhotoInfo.and.returnValue(
          Promise.resolve(photoWithExtractedText),
        );

        await (component as any).storeAndDisplayFeatureResults(featureResults);

        expect(photoStorageServiceSpy.updatePhotoInfo).toHaveBeenCalledWith(
          initialPhoto,
          { extractedText: featureResults.text },
        );
        expect(component.selectedPhoto).toEqual(photoWithExtractedText);
        expect(statistcsSpy).toHaveBeenCalled();
      });

      it('should update history photo and extracted text and call displayTextStatistics', async () => {
        const photo = {
          photoInfo: {
            title: 'Title',
            description: 'Description',
            extractedText: 'some extracted text',
          },
        } as any;
        const statistcsSpy = spyOn(component as any, 'displayTextStatistics');

        await (component as any).updateDisplayedData(photo);

        expect(component.selectedHistoryPhoto).toEqual(photo);
        expect(component.extractedText).toEqual(photo.photoInfo.extractedText);
        expect(statistcsSpy).toHaveBeenCalled();
      });

      it('should display text statistics when there is extracted text', () => {
        const testCases = [
          {
            caseNo: 1,
            extractedText: '1 line extracted text',
            expectedStatistics: {
              wordCount: 4,
              lineCount: 1,
              characterCount: 21,
            },
          },
          {
            caseNo: 2,
            extractedText: 'line 1\nline 2',
            expectedStatistics: {
              wordCount: 4,
              lineCount: 2,
              characterCount: 12,
            },
          },
          {
            caseNo: 3,
            extractedText: 'line 1\n\nline 2\n',
            expectedStatistics: {
              wordCount: 4,
              lineCount: 2,
              characterCount: 12,
            },
          },
          {
            caseNo: 4,
            extractedText:
              '  text with leading spaces\n  text   between   spaces  \ntext with trailing spaces   ',
            expectedStatistics: {
              wordCount: 11,
              lineCount: 3,
              characterCount: 81,
            },
          },
          {
            caseNo: 5,
            extractedText: '\n\n',
            expectedStatistics: {
              wordCount: 0,
              lineCount: 0,
              characterCount: 0,
            },
          },
        ];

        testCases.forEach((testCase) => {
          component.extractedText = testCase.extractedText;

          (component as any).displayTextStatistics();

          expect(component.textStatistics)
            .withContext(`Failed on case #${testCase.caseNo}`)
            .toEqual(testCase.expectedStatistics);
        });
      });
    });

    describe('getNextImage and getPreviousImage', () => {
      beforeEach(() => {
        // Make the PhotoStorageService spies behave like the real service based on the photos array.
        photoStorageServiceSpy.getNextPhoto.and.callFake((arg: UserPhoto) => {
          console.info(
            'photoStorageServiceSpy: getNextPhoto called with arg:',
            arg,
          );
          if (!arg) {
            return undefined;
          }
          if (arg.filepath === photos[0].filepath) return photos[1];
          if (arg.filepath === photos[1].filepath) return photos[2];
          if (arg.filepath === photos[2].filepath) return undefined;
          return undefined;
        });

        photoStorageServiceSpy.getPreviousPhoto.and.callFake(
          (arg: UserPhoto) => {
            console.info(
              'photoStorageServiceSpy: getPreviousPhoto called with arg:',
              arg,
            );
            if (!arg) {
              return undefined;
            }
            if (arg.filepath === photos[0].filepath) return undefined;
            if (arg.filepath === photos[1].filepath) return photos[0];
            if (arg.filepath === photos[2].filepath) return photos[1];
            return undefined;
          },
        );

        (photoStorageServiceSpy as any).photos = photos;
      });

      it('should set the next image and flags in the history', () => {
        const testCases = [
          {
            caseNo: 1,
            selectedHistoryPhoto: photos[1],
            nextPhoto: photos[2],
            expectedNextPhotoHasNextImage: false,
            expectedNextPhotoHasPreviousImage: true,
          },
          {
            caseNo: 2,
            selectedHistoryPhoto: photos[0],
            nextPhoto: photos[1],
            expectedNextPhotoHasNextImage: true,
            expectedNextPhotoHasPreviousImage: true,
          },
          {
            caseNo: 3,
            selectedHistoryPhoto: photos[2] as UserPhoto,
            nextPhoto: photos[2],
            expectedNextPhotoHasNextImage: false,
            expectedNextPhotoHasPreviousImage: true,
          },
        ];
        testCases.forEach((testCase) => {
          component.selectedHistoryPhoto = testCase.selectedHistoryPhoto;

          // reset state for each sub-case so assertions are per-case
          component.hasNextImage = false;
          component.hasPreviousImage = false;

          (component as any).getNextImage();

          expect(component.selectedHistoryPhoto)
            .withContext(`caseNo ${testCase.caseNo} selectedHistoryPhoto`)
            .toEqual(testCase.nextPhoto);
          expect(component.hasNextImage)
            .withContext(`caseNo ${testCase.caseNo} hasNextImage`)
            .toBe(testCase.expectedNextPhotoHasNextImage);
          expect(component.hasPreviousImage)
            .withContext(`caseNo ${testCase.caseNo} hasPreviousImage`)
            .toBe(testCase.expectedNextPhotoHasPreviousImage);
        });
      });

      it('should set the previous image and flags in the history', () => {
        const testCases = [
          {
            caseNo: 1,
            selectedHistoryPhoto: photos[1],
            previousPhoto: photos[0],
            expectedPreviousPhotoHasNextImage: true,
            expectedPreviousPhotoHasPreviousImage: false,
          },
          {
            caseNo: 2,
            selectedHistoryPhoto: photos[0],
            previousPhoto: photos[0],
            expectedPreviousPhotoHasNextImage: true,
            expectedPreviousPhotoHasPreviousImage: false,
          },
          {
            caseNo: 3,
            selectedHistoryPhoto: photos[2] as UserPhoto,
            previousPhoto: photos[1],
            expectedPreviousPhotoHasNextImage: true,
            expectedPreviousPhotoHasPreviousImage: true,
          },
        ];
        testCases.forEach((testCase) => {
          component.selectedHistoryPhoto = testCase.selectedHistoryPhoto;

          // reset state for each sub-case so assertions are per-case
          component.hasNextImage = false;
          component.hasPreviousImage = false;

          (component as any).getPreviousImage();

          expect(component.selectedHistoryPhoto)
            .withContext(`caseNo ${testCase.caseNo} selectedHistoryPhoto`)
            .toEqual(testCase.previousPhoto);
          expect(component.hasNextImage)
            .withContext(`caseNo ${testCase.caseNo} hasNextImage`)
            .toBe(testCase.expectedPreviousPhotoHasNextImage);
          expect(component.hasPreviousImage)
            .withContext(`caseNo ${testCase.caseNo} hasPreviousImage`)
            .toBe(testCase.expectedPreviousPhotoHasPreviousImage);
        });
      });
    });

    describe('deleteAllPhotos', () => {
      it('should return without deleting photos when deleting is cancelled', async () => {
        const confirmDeleteSpy =
          alertServiceSpy.confirmDeletePhotoAlert.and.returnValue(
            Promise.resolve(false),
          );

        await component.deleteAllPhotos();

        expect(confirmDeleteSpy).toHaveBeenCalled();
        expect(photoStorageServiceSpy.deleteAllPhotos).not.toHaveBeenCalled();
        expect(component.isLoading).toBeFalse();
      });

      it('should log error and show toast if deletion fails', async () => {
        const confirmDeleteSpy =
          alertServiceSpy.confirmDeletePhotoAlert.and.returnValue(
            Promise.resolve(true),
          );
        const error = new Error('Deletion failed');
        photoStorageServiceSpy.deleteAllPhotos.and.returnValue(
          Promise.reject(error),
        );
        spyOn(console, 'error');

        await component.deleteAllPhotos();

        expect(confirmDeleteSpy).toHaveBeenCalled();
        expect(photoStorageServiceSpy.deleteAllPhotos).toHaveBeenCalled();
        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.ERROR_DELETING_ALL_PHOTOS',
        );
        expect(console.error).toHaveBeenCalledWith(
          'Error deleting all photos:',
          error,
        );
        expect(component.isLoading).toBeFalse();
      });

      it('should should show toast and call workflowstep if deletion succeeds', async () => {
        const confirmDeleteSpy =
          alertServiceSpy.confirmDeletePhotoAlert.and.returnValue(
            Promise.resolve(true),
          );
        photoStorageServiceSpy.deleteAllPhotos.and.returnValue(
          Promise.resolve(true),
        );

        await component.deleteAllPhotos();

        expect(confirmDeleteSpy).toHaveBeenCalled();
        expect(photoStorageServiceSpy.deleteAllPhotos).toHaveBeenCalled();
        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.SUCCESS_ALL_PHOTOS_DELETED',
        );
        expect(workflowServiceSpy.getNextWorkflowStep).toHaveBeenCalled();
        expect(component.isLoading).toBeFalse();
      });
    });

    describe('delete a photo with or without extracted text', () => {
      it('should call deleteTextAndPhotoExec with the selected history photo', async () => {
        const deleteTextAndPhotoExecSpy = spyOn(
          component as any,
          'deleteTextAndPhotoExec',
        ).and.returnValue(Promise.resolve());

        const event = {} as any;
        await component.deleteTextAndPhoto(event);

        expect(deleteTextAndPhotoExecSpy).toHaveBeenCalledWith(
          event,
          component.selectedHistoryPhoto,
        );
      });

      it('should call deleteTextAndPhotoExec with the selected photo', async () => {
        const deleteTextAndPhotoExecSpy = spyOn(
          component as any,
          'deleteTextAndPhotoExec',
        ).and.returnValue(Promise.resolve());

        const event = {} as any;
        await component.deletePhoto(event);

        expect(deleteTextAndPhotoExecSpy).toHaveBeenCalledWith(
          event,
          component.selectedPhoto,
        );
      });

      it('should not delete photo when deletion is cancelled', async () => {
        const confirmDeleteSpy =
          alertServiceSpy.confirmDeletePhotoAlert.and.returnValue(
            Promise.resolve(false),
          );

        await (component as any).deleteTextAndPhotoExec(
          {} as Event,
          component.selectedHistoryPhoto,
        );

        expect(confirmDeleteSpy).toHaveBeenCalled();
        expect(photoStorageServiceSpy.deletePhoto).not.toHaveBeenCalled();
        expect(component.isLoading).toBeFalse();
      });

      it('should log error and show toast if deletion fails', async () => {
        const confirmDeleteSpy =
          alertServiceSpy.confirmDeletePhotoAlert.and.returnValue(
            Promise.resolve(true),
          );
        const error = new Error('Deletion failed');
        photoStorageServiceSpy.deletePhoto.and.returnValue(
          Promise.reject(error),
        );
        spyOn(console, 'error');

        await (component as any).deleteTextAndPhotoExec(
          {} as Event,
          component.selectedHistoryPhoto,
        );

        expect(confirmDeleteSpy).toHaveBeenCalled();
        expect(photoStorageServiceSpy.deletePhoto).toHaveBeenCalled();
        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.ERROR_DELETING_PHOTO',
        );
        expect(console.error).toHaveBeenCalledWith(
          'Error deleting photo:',
          error,
        );
        expect(component.isLoading).toBeFalse();
      });

      it('should should show toast and call workflowstep if deletion succeeds', async () => {
        const confirmDeleteSpy =
          alertServiceSpy.confirmDeletePhotoAlert.and.returnValue(
            Promise.resolve(true),
          );
        photoStorageServiceSpy.deletePhoto.and.returnValue(
          Promise.resolve(true),
        );

        await (component as any).deleteTextAndPhotoExec(
          {} as Event,
          component.selectedHistoryPhoto,
        );

        expect(confirmDeleteSpy).toHaveBeenCalled();
        expect(photoStorageServiceSpy.deletePhoto).toHaveBeenCalled();
        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.TOAST.SUCCESS_PHOTO_DELETED',
          ToastAnchor.MainPage,
        );
        expect(workflowServiceSpy.getNextWorkflowStep).toHaveBeenCalled();
        expect(component.isLoading).toBeFalse();
      });
    });

    describe('savePhotoInfo', () => {
      it('updates title and description if this data are not undefined', () => {
        const testCases = [
          {
            title: 'New Title',
            description: 'New Description',
            expectedPhotoInfo: {
              title: 'New Title',
              description: 'New Description',
            },
          },
          {
            title: undefined,
            description: 'New Description',
            expectedPhotoInfo: { description: 'New Description' },
          },
          {
            title: 'New Title',
            description: undefined,
            expectedPhotoInfo: { title: 'New Title' },
          },
          { title: undefined, description: undefined, expectedPhotoInfo: {} },
        ];

        testCases.forEach(({ title, description, expectedPhotoInfo }) => {
          (component as any).savePhotoInfo(photos[0], title, description);

          expect(photoStorageServiceSpy.updatePhotoInfo).toHaveBeenCalledWith(
            photos[0],
            expectedPhotoInfo,
          );
        });
      });

      it('should show toast and return updated photo if photo info is successfully updated', async () => {
        const updatedPhoto = {
          ...photos[0],
          photoInfo: {
            title: 'Updated Title',
            description: 'Updated Description',
          },
        };
        photoStorageServiceSpy.updatePhotoInfo.and.returnValue(
          Promise.resolve(updatedPhoto),
        );

        const result = await (component as any).savePhotoInfo(
          photos[0],
          'Updated Title',
          'Updated Description',
        );

        expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
          'FEATURE.PHOTO_INFO_MODAL.TOAST.INFO_UPDATED',
          ToastAnchor.MainPage,
        );
        expect(result).toBe(updatedPhoto);
      });
    });

    it('should call all necessary services when copying a photo', async () => {
      alertServiceSpy.showCopyAlert.and.returnValue(
        Promise.resolve({ copyAll: true }),
      );
      clipboardServiceSpy.copyDataToClipboard.and.returnValue(
        Promise.resolve(),
      );
      component.workflowStep = WorkflowStep.ManageHistory;
      component.selectedHistoryPhoto = photos[0];
      component.textStatistics = {
        wordCount: 1,
        lineCount: 1,
        characterCount: 5,
      };

      await component.copyData();

      expect(alertServiceSpy.showCopyAlert).toHaveBeenCalled();
      expect(clipboardServiceSpy.copyDataToClipboard).toHaveBeenCalledWith(
        photos[0],
        {
          wordCount: 1,
          lineCount: 1,
          characterCount: 5,
        },
        { copyAll: true },
      );
      expect(workflowServiceSpy.getNextWorkflowStep).toHaveBeenCalledWith(
        WorkflowStep.ManageHistory,
      );
    });

    describe('ngOnInit', () => {
      it('should initialize component correctly when updateIsContingentExceeded succeeds', async () => {
        firestoreUtilsServiceSpy.isContingentExceeded.and.returnValue(
          Promise.resolve(false),
        );
        const initFormControlsSpy = spyOn(component as any, 'initFormControls');
        const setupSubscriptionsSpy = spyOn(
          component as any,
          'setupSubscriptions',
        );

        fixture.detectChanges(); // triggers ngOnInit and other lifecycle hooks
        await fixture.whenStable();

        expect(setupSubscriptionsSpy).toHaveBeenCalled();
        expect(
          firestoreUtilsServiceSpy.isContingentExceeded,
        ).toHaveBeenCalled();
        expect(component.isContingentExceeded).toBe(false);
        expect(component.workflowStep).toBe(WorkflowStep.SelectPhoto);
        expect(photoStorageServiceSpy.loadSavedPhotos).toHaveBeenCalled();
        expect(initFormControlsSpy).toHaveBeenCalled();
        expect(component.isLoading).toBeFalse();
      });

      it('should log error when updateIsContingentExceeded fails', async () => {
        const consoleErrorSpy = spyOn(console, 'error');
        firestoreUtilsServiceSpy.isContingentExceeded.and.returnValue(
          Promise.reject('error'),
        );

        fixture.detectChanges();
        await fixture.whenStable();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Feature initialization failed',
          'error',
        );
        expect(component.isLoading).toBeFalse();
      });

      describe('setupSubscriptions', () => {
        it('should subscribe to photoStorageService.photos$ and utilsService.backButtonClicked$', () => {
          const photoStorageServiceSpyObj = photoStorageServiceSpy as any;
          const utilsServiceSpyObj = utilsServiceSpy as any;

          const subscribeSpyPhotos = spyOn(
            photoStorageServiceSpyObj.photos$,
            'subscribe',
          ).and.callThrough();
          const subscribeSpyBackButton = spyOn(
            utilsServiceSpyObj.backButtonClicked$,
            'subscribe',
          ).and.callThrough();

          (component as any).setupSubscriptions();

          expect(subscribeSpyPhotos).toHaveBeenCalled();
          expect(subscribeSpyBackButton).toHaveBeenCalled();
          expect((component as any).subscriptions).toHaveSize(2);
        });
      });
    });

    it('should unsubscribe from all subscriptions in ngOnDestroy', () => {
      const subscription1 = jasmine.createSpyObj('Subscription', [
        'unsubscribe',
      ]);
      const subscription2 = jasmine.createSpyObj('Subscription', [
        'unsubscribe',
      ]);
      (component as any).subscriptions = [subscription1, subscription2];

      (component as any).ngOnDestroy();

      expect(subscription1.unsubscribe).toHaveBeenCalled();
      expect(subscription2.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Template rendering', () => {
    beforeEach(() => {
      spyOn<any>(component, 'initFormControls').and.stub();
      spyOn<any>(component, 'setupSubscriptions').and.stub();

      fixture.detectChanges();
    });

    describe('spinner', () => {
      it('should show spinner when isLoading is true', () => {
        component.isLoading = true;
        fixture.detectChanges();

        const spinner = fixture.nativeElement.querySelector('app-spinner');
        expect(spinner).toBeTruthy();
      });

      it('should hide spinner when isLoading is false', () => {
        component.isLoading = false;
        fixture.detectChanges();

        const spinner = fixture.nativeElement.querySelector('app-spinner');
        expect(spinner).toBeNull();
      });
    });

    it('should display cardTitle in ion-card-title', () => {
      const expectedTitle = 'Expected Card Title';
      spyOnProperty(component, 'cardTitle', 'get').and.returnValue(
        expectedTitle,
      );
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('ion-card-title');
      expect(title.textContent).toContain(expectedTitle);
    });

    it('should show workflow description in ion-card-subtitle', () => {
      const subtitle = fixture.nativeElement.querySelector('ion-card-subtitle');
      expect(subtitle).toBeTruthy();
      expect(subtitle.textContent).toContain(component.workflowStep);
    });

    describe('displayed buttons', () => {
      let cameraButton: HTMLElement;
      let galleryButton: HTMLElement;
      let historyButton: HTMLElement;
      let extractTextButton: HTMLElement;
      let deletePhotoButton: HTMLElement;
      let addInfoButton: HTMLElement;
      let changeInfoButton: HTMLElement;
      let deleteAllButton: HTMLElement;
      let previousImageButton: HTMLElement;
      let nextImageButton: HTMLElement;
      let copyDataButton: HTMLElement;
      let deleteDataButton: HTMLElement;

      function queryButtons() {
        cameraButton = fixture.nativeElement.querySelector('ion-button[name="camera"]');
        galleryButton = fixture.nativeElement.querySelector('ion-button[name="gallery"]');
        historyButton = fixture.nativeElement.querySelector('ion-button[name="load-data"]');
        extractTextButton = fixture.nativeElement.querySelector('ion-button[name="extract-text"]');
        deletePhotoButton = fixture.nativeElement.querySelector('ion-button[name="delete-photo"]');
        addInfoButton = fixture.nativeElement.querySelector('ion-button[name="add-info"]');
        changeInfoButton = fixture.nativeElement.querySelector('ion-button[name="change-info"]');
        deleteAllButton = fixture.nativeElement.querySelector('ion-button[name="delete-all"]');
        previousImageButton = fixture.nativeElement.querySelector('ion-button[name="previous-image"]');
        nextImageButton = fixture.nativeElement.querySelector('ion-button[name="next-image"]');
        copyDataButton = fixture.nativeElement.querySelector('ion-button[name="copy-data"]');
        deleteDataButton = fixture.nativeElement.querySelector('ion-button[name="delete-data"]');
      }

      it('should display the correct buttons for WorkflowStep.SelectPhoto ', () => {
        component.workflowStep = WorkflowStep.SelectPhoto;
        fixture.detectChanges();
        queryButtons();

        expect(cameraButton).withContext('cameraButton').toBeTruthy();
        expect(galleryButton).withContext('galleryButton').toBeTruthy();
        expect(historyButton).withContext('historyButton').toBeTruthy();

        expect(extractTextButton).withContext('extractTextButton').toBeNull();
        expect(deletePhotoButton).withContext('deletePhotoButton').toBeNull();
        expect(addInfoButton).withContext('addInfoButton').toBeNull();
        expect(changeInfoButton).withContext('changeInfoButton').toBeNull();
        expect(deleteAllButton).withContext('deleteAllButton').toBeNull();
        expect(previousImageButton).withContext('previousImageButton').toBeNull();
        expect(nextImageButton).withContext('nextImageButton').toBeNull();
        expect(copyDataButton).withContext('copyDataButton').toBeNull();
        expect(deleteDataButton).withContext('deleteDataButton').toBeNull();
      });

      it('should display the correct buttons for WorkflowStep.ExtractText ', () => {
        component.workflowStep = WorkflowStep.ExtractText;
        fixture.detectChanges();
        queryButtons();

        expect(extractTextButton).withContext('extractTextButton').toBeTruthy();
        expect(deletePhotoButton).withContext('deletePhotoButton').toBeTruthy();

        expect(cameraButton).withContext('cameraButton').toBeNull();
        expect(galleryButton).withContext('galleryButton').toBeNull();
        expect(historyButton).withContext('historyButton').toBeNull();
        expect(addInfoButton).withContext('addInfoButton').toBeNull();
        expect(changeInfoButton).withContext('changeInfoButton').toBeNull();
        expect(deleteAllButton).withContext('deleteAllButton').toBeNull();
        expect(previousImageButton).withContext('previousImageButton').toBeNull();
        expect(nextImageButton).withContext('nextImageButton').toBeNull();
        expect(copyDataButton).withContext('copyDataButton').toBeNull();
        expect(deleteDataButton).withContext('deleteDataButton').toBeNull();
      });

      it('should display the correct buttons for WorkflowStep.DisplayExtractedText ', () => {
        component.workflowStep = WorkflowStep.DisplayExtractedText;
        fixture.detectChanges();
        queryButtons();

        expect(addInfoButton).withContext('addInfoButton').toBeTruthy();

        expect(cameraButton).withContext('cameraButton').toBeNull();
        expect(galleryButton).withContext('galleryButton').toBeNull();
        expect(historyButton).withContext('historyButton').toBeNull();
        expect(extractTextButton).withContext('extractTextButton').toBeNull();
        expect(deletePhotoButton).withContext('deletePhotoButton').toBeNull();
        expect(changeInfoButton).withContext('changeInfoButton').toBeNull();
        expect(deleteAllButton).withContext('deleteAllButton').toBeNull();
        expect(previousImageButton).withContext('previousImageButton').toBeNull();
        expect(nextImageButton).withContext('nextImageButton').toBeNull();
        expect(copyDataButton).withContext('copyDataButton').toBeNull();
        expect(deleteDataButton).withContext('deleteDataButton').toBeNull();
      });

      it('should display the correct buttons for step DisplayResultsFromStorage if photos are available', () => {
        photoStorageServiceSpy.photos$ = of(photos);
        component.workflowStep = WorkflowStep.DisplayResultsFromStorage;
        fixture.detectChanges();
        queryButtons();

        expect(deleteAllButton).withContext('deleteAllButton').toBeTruthy();

        expect(addInfoButton).withContext('addInfoButton').toBeNull();
        expect(cameraButton).withContext('cameraButton').toBeNull();
        expect(galleryButton).withContext('galleryButton').toBeNull();
        expect(historyButton).withContext('historyButton').toBeNull();
        expect(extractTextButton).withContext('extractTextButton').toBeNull();
        expect(deletePhotoButton).withContext('deletePhotoButton').toBeNull();
        expect(changeInfoButton).withContext('changeInfoButton').toBeNull();
        expect(previousImageButton).withContext('previousImageButton').toBeNull();
        expect(nextImageButton).withContext('nextImageButton').toBeNull();
        expect(copyDataButton).withContext('copyDataButton').toBeNull();
        expect(deleteDataButton).withContext('deleteDataButton').toBeNull();
      });

      it('should display the correct buttons for step DisplayResultsFromStorage if no photos are available', () => {
        photoStoragePhotosSubject.next([]);
        component.workflowStep = WorkflowStep.DisplayResultsFromStorage;
        fixture.detectChanges();
        queryButtons();

        expect(deleteAllButton).withContext('deleteAllButton').toBeNull();
        expect(addInfoButton).withContext('addInfoButton').toBeNull();
        expect(cameraButton).withContext('cameraButton').toBeNull();
        expect(galleryButton).withContext('galleryButton').toBeNull();
        expect(historyButton).withContext('historyButton').toBeNull();
        expect(extractTextButton).withContext('extractTextButton').toBeNull();
        expect(deletePhotoButton).withContext('deletePhotoButton').toBeNull();
        expect(changeInfoButton).withContext('changeInfoButton').toBeNull();
        expect(previousImageButton).withContext('previousImageButton').toBeNull();
        expect(nextImageButton).withContext('nextImageButton').toBeNull();
        expect(copyDataButton).withContext('copyDataButton').toBeNull();
        expect(deleteDataButton).withContext('deleteDataButton').toBeNull();
      });

      it('should display the correct buttons for WorkflowStep.ManageHistory ', () => {
        component.workflowStep = WorkflowStep.ManageHistory;
        component.hasPreviousImage = true;
        component.hasNextImage = true;
        fixture.detectChanges();
        queryButtons();

        expect(previousImageButton).withContext('previousImageButton').toBeTruthy();
        expect(nextImageButton).withContext('nextImageButton').toBeTruthy();
        expect(changeInfoButton).withContext('changeInfoButton').toBeTruthy();
        expect(copyDataButton).withContext('copyDataButton').toBeTruthy();
        expect(deleteDataButton).withContext('deleteDataButton').toBeTruthy();

        expect(cameraButton).withContext('cameraButton').toBeNull();
        expect(galleryButton).withContext('galleryButton').toBeNull();
        expect(historyButton).withContext('historyButton').toBeNull();
        expect(extractTextButton).withContext('extractTextButton').toBeNull();
        expect(deletePhotoButton).withContext('deletePhotoButton').toBeNull();
        expect(addInfoButton).withContext('addInfoButton').toBeNull();
        expect(deleteAllButton).withContext('deleteAllButton').toBeNull();
      });

    });
  });
});
