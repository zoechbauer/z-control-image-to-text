import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

import { FeatureResultComponent } from './feature-result.component';
import { createTranslateServiceMock } from 'src/app/testing/translate-service.mock';

describe('FeatureResultComponent', () => {
  let component: FeatureResultComponent;
  let fixture: ComponentFixture<FeatureResultComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FeatureResultComponent],
      providers: [
        { provide: TranslateService, useValue: createTranslateServiceMock() },
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
