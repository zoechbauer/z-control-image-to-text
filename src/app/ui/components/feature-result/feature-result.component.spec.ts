import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage-angular';

import { FeatureResultComponent } from './feature-result.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';
import { PhotoStorageService } from 'src/app/services/photo-storage.service';

describe('FeatureResultComponent', () => {
  let component: FeatureResultComponent;
  let fixture: ComponentFixture<FeatureResultComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FeatureResultComponent],
      providers: [
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        { provide: Storage, useValue: {} },
        { provide: PhotoStorageService, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
