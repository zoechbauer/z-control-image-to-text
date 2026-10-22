import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';

import { FeatureResultComponent } from './feature-result.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';
import { PhotoStorageService } from 'src/app/services/photo-storage.service';
import { UserPhoto } from 'src/app/shared/app.interfaces';

describe('FeatureResultComponent', () => {
  let photoStorageServiceSpy: jasmine.SpyObj<PhotoStorageService>;
  let component: FeatureResultComponent;
  let fixture: ComponentFixture<FeatureResultComponent>;

  beforeEach(waitForAsync(() => {
    photoStorageServiceSpy = jasmine.createSpyObj('PhotoStorageService', [
      'getNoExtractedTextInfo',
    ]);

    TestBed.configureTestingModule({
      imports: [FeatureResultComponent],
      providers: [
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: Storage, useValue: {} },
        { provide: PhotoStorageService, useValue: photoStorageServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('template rendering', () => {
    it('should display the component template correctly', () => {
      expect(fixture.nativeElement).toBeTruthy();
    });

    describe('feature result container visibility', () => {
      it('should display the feature result content only when history photo is selected', () => {
        component.selectedHistoryPhoto = {} as any as UserPhoto;
        fixture.detectChanges();

        const content = fixture.nativeElement.querySelector(
          '.feature-result-container',
        );
        expect(content).toBeTruthy();
      });

      it('should hide the feature result content when no history photo is selected', () => {
        component.selectedHistoryPhoto = undefined as any as UserPhoto;
        fixture.detectChanges();

        const hiddenContent = fixture.nativeElement.querySelector(
          '.feature-result-container',
        );
        expect(hiddenContent).toBeNull();
      });
    });

    describe('title and description card', () => {
      it('should display the title and description card when photo info has a title', () => {
        component.selectedHistoryPhoto = {
          photoInfo: {
            title: 'Test Title',
          },
        } as any as UserPhoto;
        fixture.detectChanges();

        const titleDescCard = fixture.nativeElement.querySelector(
          '.feature-result-card-title-desc',
        );
        expect(titleDescCard).toBeTruthy();
      });

      it('should display the title when photo info has a title', () => {
        component.selectedHistoryPhoto = {
          photoInfo: {
            title: 'Test Title',
          },
        } as any as UserPhoto;
        fixture.detectChanges();

        const title = fixture.nativeElement.querySelector(
          '.feature-result-card-title-desc .photo-info-title',
        );
        expect(title).toBeTruthy();
      });

      it('should display the description when photo info has a description', () => {
        component.selectedHistoryPhoto = {
          photoInfo: {
            title: 'Test Title',
            description: 'Test Description',
          },
        } as any as UserPhoto;
        fixture.detectChanges();

        const description = fixture.nativeElement.querySelector(
          '.feature-result-card-title-desc .photo-info-description',
        );
        expect(description).toBeTruthy();
      });
    });

    describe('extracted text card', () => {
      it('should display the extracted text card when extracted text is available', () => {
        component.selectedHistoryPhoto = {} as any as UserPhoto;
        component.extractedText = 'Test Extracted Text';
        fixture.detectChanges();

        const extractedTextCard = fixture.nativeElement.querySelector(
          '.feature-result-card-extracted-text',
        );
        expect(extractedTextCard).toBeTruthy();
      });

      it('should display the no extracted text card when extracted text is not available', () => {
        component.selectedHistoryPhoto = {} as any as UserPhoto;
        component.extractedText = '';
        fixture.detectChanges();

        const noExtractedTextCard = fixture.nativeElement.querySelector(
          '.feature-result-card-no-extracted-text',
        );
        expect(noExtractedTextCard).toBeTruthy();
      });
    });

    describe('statistics card', () => {
      it('should display the statistics card when photo info is available', () => {
        component.selectedHistoryPhoto = {
          photoInfo: {
            title: 'Test Title',
            description: 'Test Description',
          },
        } as any as UserPhoto;
        fixture.detectChanges();

        const statisticsCard = fixture.nativeElement.querySelector(
          '.feature-result-card-statistics',
        );
        expect(statisticsCard).toBeTruthy();
      });

      it('should hide the statistics card when photo info is not available', () => {
        component.selectedHistoryPhoto = {
          photoInfo: undefined,
        } as any as UserPhoto;
        fixture.detectChanges();

        const statisticsCard = fixture.nativeElement.querySelector(
          '.feature-result-card-statistics',
        );
        expect(statisticsCard).toBeNull();
      });

      it('should show created and modified timestamps when available', () => {
        component.selectedHistoryPhoto = {
          photoInfo: {
            createdAt: new Date('2024-01-01T12:00:00'),
            modifiedAt: new Date('2024-01-02T12:00:00'),
          },
        } as any as UserPhoto;
        fixture.detectChanges();

        const createdAtRow = fixture.nativeElement.querySelector(
          '.updated-timestamps ion-row:nth-child(1)',
        );
        const modifiedAtRow = fixture.nativeElement.querySelector(
          '.updated-timestamps ion-row:nth-child(2)',
        );
        expect(createdAtRow).toBeTruthy();
        expect(modifiedAtRow).toBeTruthy();
      });

      it('should hide modified timestamps when not available', () => {
        component.selectedHistoryPhoto = {
          photoInfo: {
            createdAt: new Date('2024-01-01T12:00:00'),
            modifiedAt: undefined,
          },
        } as any as UserPhoto;
        fixture.detectChanges();

        const createdAtRow = fixture.nativeElement.querySelector(
          '.updated-timestamps ion-row:nth-child(1)',
        );
        const modifiedAtRow = fixture.nativeElement.querySelector(
          '.updated-timestamps ion-row:nth-child(2)',
        );
        expect(createdAtRow).toBeTruthy();
        expect(modifiedAtRow).toBeNull();
      });
    });
  });
});
