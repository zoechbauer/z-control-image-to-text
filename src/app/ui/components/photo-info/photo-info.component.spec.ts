import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { createTranslateServiceMock } from '@testing/translate-service.mock';

import { ToastService } from 'src/app/services/toast.service';
import { PhotoInfoComponent } from './photo-info.component';

describe('PhotoInfoComponent', () => {
  let component: PhotoInfoComponent;
  let fixture: ComponentFixture<PhotoInfoComponent>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let modalCtrlSpy: jasmine.SpyObj<ModalController>;

  beforeEach(waitForAsync(() => {
    modalCtrlSpy = jasmine.createSpyObj('ModalController', ['dismiss']);

    toastServiceSpy = jasmine.createSpyObj('ToastService', ['showToast']);

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ReactiveFormsModule, PhotoInfoComponent],
      providers: [
        { provide: ModalController, useValue: modalCtrlSpy },
        {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
        {
          provide: ToastService,
          useValue: toastServiceSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoInfoComponent);
    component = fixture.componentInstance;

    component.photo = {
      filepath: 'path/to/photo.jpg',
      photoInfo: { title: 'Title', description: 'Desc', extractedText: 'Text' },
    } as any;

    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('save', () => {
    it('should show toast if form is invalid', async () => {
      component.photoForm.controls['title'].setValue('');
      await component.save();
      expect(toastServiceSpy.showToast).toHaveBeenCalledWith(
        'FEATURE.PHOTO_INFO_MODAL.TOAST.ERROR_TITLE_REQUIRED',
      );
    });

    it('should dismiss modal with form value if form is valid', async () => {
      component.photoForm.controls['title'].setValue('Valid Title');
      await component.save();
      expect(modalCtrlSpy.dismiss).toHaveBeenCalledWith(
        component.photoForm.value,
        'save',
      );
    });
  });

  describe('cancel', () => {
    it('should dismiss modal with cancel role', async () => {
      await component.cancel();
      expect(modalCtrlSpy.dismiss).toHaveBeenCalledWith(null, 'cancel');
    });
  });

  describe('hasDataChanged', () => {
    it('should test if title and description have changed', () => {
      const testCases = [
        {
          initialTitle: 'Title from UserPhoto',
          initialDescription: 'Description from UserPhoto',
          FormTitle: 'Title from UserPhoto',
          FormDescription: 'Description from UserPhoto',
          expected: false,
        },
        {
          initialTitle: 'Title from UserPhoto',
          initialDescription: 'Description from UserPhoto',
          FormTitle: 'Changed Title',
          FormDescription: 'Description from UserPhoto',
          expected: true,
        },
        {
          initialTitle: 'Title from UserPhoto',
          initialDescription: 'Description from UserPhoto',
          FormTitle: 'Title from UserPhoto',
          FormDescription: 'Changed Description',
          expected: true,
        },
        {
          initialTitle: 'Title from UserPhoto',
          initialDescription: 'Description from UserPhoto',
          FormTitle: 'Changed Title',
          FormDescription: 'Changed Description',
          expected: true,
        },
      ];
      testCases.forEach((testCase) => {
        component.title = testCase.initialTitle;
        component.description = testCase.initialDescription;
        component.photoForm.controls['title'].setValue(testCase.FormTitle);
        component.photoForm.controls['description'].setValue(
          testCase.FormDescription,
        );

        expect(component.hasDataChanged()).toBe(testCase.expected);
      });
    });
  });

  describe('headerTitle', () => {
    it('should return the correct header title based on the photo title', () => {
      const testCases = [
        {
          title: 'UserPhoto has title',
          expectedHeaderTitle: 'FEATURE.PHOTO_INFO_MODAL.TITLE_CHANGE_INFO',
        },
        {
          title: '',
          expectedHeaderTitle: 'FEATURE.PHOTO_INFO_MODAL.TITLE_ADD_INFO',
        },
        {
          title: undefined,
          expectedHeaderTitle: 'FEATURE.PHOTO_INFO_MODAL.TITLE_ADD_INFO',
        },
      ];
      testCases.forEach((testCase) => {
        component.title = testCase.title;
        expect(component.headerTitle).toBe(testCase.expectedHeaderTitle);
      });
    });
  });

  describe('ngOnInit', () => {
    it('should intialize title and description from the photo', () => {
      component.photo.photoInfo!.title = 'Initial Title';
      component.photo.photoInfo!.description = 'Initial Description';
      component.ngOnInit();

      expect(component.title).toBe('Initial Title');
      expect(component.description).toBe('Initial Description');
    });

    it('should initialize the form with the correct values', () => {
      component.photo.photoInfo!.title = 'Initial Title';
      component.photo.photoInfo!.description = 'Initial Description';
      component.ngOnInit();

      expect(component.photoForm.controls['title'].value).toBe('Initial Title');
      expect(component.photoForm.controls['description'].value).toBe(
        'Initial Description',
      );
    });

    it('should convert undefined title and description to empty strings in the form', () => {
      component.photo.photoInfo!.title = undefined;
      component.photo.photoInfo!.description = undefined;
      component.ngOnInit();

      expect(component.photoForm.controls['title'].value).toBe('');
      expect(component.photoForm.controls['description'].value).toBe('');
    });
  });
});
