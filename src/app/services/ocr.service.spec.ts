import { TestBed } from '@angular/core/testing';
import { Functions } from '@angular/fire/functions';
import { TranslateService } from '@ngx-translate/core';

import { OcrService } from './ocr.service';
import { ToastService } from './toast.service';
describe('OcrService', () => {
  let service: OcrService;
  let toastServiceMock: any;

  beforeEach(() => {
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
      'instant',
      'get',
      'use',
      'setDefaultLang',
    ]);
    translateServiceSpy.instant.and.returnValue('SIMULATED_TRANSLATION');

    toastServiceMock = jasmine.createSpyObj('ToastService', ['showToast']);
    const functionsStub = {} as Functions;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Functions,
          useValue: functionsStub,
        },
        {
          provide: TranslateService,
          useValue: translateServiceSpy,
        },
        {
          provide: ToastService,
          useValue: toastServiceMock,
        },
      ],
    });
    service = TestBed.inject(OcrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('secureRecognize', () => {
    it('should call secureRecognize cloud function and return result', async () => {
      const callableSpy = jasmine.createSpy('callable').and.resolveTo({
        data: { text: 'Recognized Text', featureType: 'image' },
      });

      const createCallableSpy = spyOn<any>(
        service,
        'getHttpsCallable'
      ).and.returnValue(callableSpy);

      const result = await service.secureRecognize({
        imageBase64: 'dummy-image-data',
        mode: 'image',
      });

      expect(createCallableSpy).toHaveBeenCalled();
      expect(callableSpy).toHaveBeenCalledWith({
        appId: 'image_to_text',
        imageBase64: 'dummy-image-data',
        mode: 'image',
      });
      expect(result).toEqual({ text: 'Recognized Text', featureType: 'image' });
    });

    it('should log and show toast when cloud function fails', async () => {
      const cloudError = new Error('Cloud Function failed');
      const callableSpy = jasmine
        .createSpy('callable')
        .and.rejectWith(cloudError);

      const consoleErrorSpy = spyOn(console, 'error');

      spyOn<any>(service, 'getHttpsCallable').and.returnValue(callableSpy);

      await expectAsync(
        service.secureRecognize({
          imageBase64: 'dummy-image-data',
          mode: 'image',
        })
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error calling secure feature:',
        cloudError
      );
      expect(toastServiceMock.showToast).toHaveBeenCalledWith(
        'SIMULATED_TRANSLATION',
        jasmine.anything()
      );
    });
  });
});
