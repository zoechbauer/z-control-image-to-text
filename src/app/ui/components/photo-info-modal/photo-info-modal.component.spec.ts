import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';

import { createTranslateServiceMock } from '@testing/translate-service.mock';
import { PhotoInfoModalComponent } from './photo-info-modal.component';

describe('PhotoInfoModalComponent', () => {
  let component: PhotoInfoModalComponent;
  let fixture: ComponentFixture<PhotoInfoModalComponent>;
  const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['dismiss']);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [IonicModule.forRoot(), ReactiveFormsModule, PhotoInfoModalComponent],
      providers: [{ provide: ModalController, useValue: modalCtrlSpy },
                {
          provide: TranslateService,
          useValue: createTranslateServiceMock(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoInfoModalComponent);
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
});