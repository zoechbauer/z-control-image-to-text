import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { Functions } from '@angular/fire/functions';

import { FeatureService } from './feature.service';
import { ToastService } from './toast.service';

describe('FeatureService', () => {
  let service: FeatureService;
  const appId = 'ionic_setup';

  beforeEach(() => {
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
      'instant',
      'get',
      'use',
      'setDefaultLang',
    ]);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['showToast']);
    const functionsStub = {} as Functions;

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        FeatureService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: Functions, useValue: functionsStub },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    });
    service = TestBed.inject(FeatureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('secureFeatureCloudFunction', () => {
    let relatedWords: string;

    beforeEach(() => {
      relatedWords = 'upper austria, vienna, graz, st. pölten, wels';
    });

    it('should call secureFeature cloud function and return related words', async () => {
      const callableSpy = jasmine.createSpy('callable').and.resolveTo({
        data: { feature: { text: 'Linz', related: relatedWords } },
      });
      spyOn(service as any, 'getHttpsCallable').and.returnValue(callableSpy);

      const result = await service.secureFeatureCloudFunction({ text: 'Linz' });

      expect(callableSpy).toHaveBeenCalledWith({
        appId,
        text: 'Linz',
      });
      expect(result).toEqual({
        feature: { text: 'Linz', related: relatedWords },
      });
    });

    it('should return info when cloud function finds no related words', async () => {
      const callableSpy = jasmine.createSpy('callable').and.resolveTo({
        data: {
          feature: { text: 'xxx-11', related: 'no related words found' },
        },
      });

      spyOn<any>(service, 'getHttpsCallable').and.returnValue(callableSpy);

      const result = await service.secureFeatureCloudFunction({
        text: 'xxx-11',
      });

      expect(result).toEqual({
        feature: { text: 'xxx-11', related: 'no related words found' },
      });
    });

    it('should log and rethrow when cloud function fails', async () => {
      const cloudError = new Error('Cloud Function failed');
      const callableSpy = jasmine
        .createSpy('callable')
        .and.rejectWith(cloudError);
      spyOn<any>(service, 'getHttpsCallable').and.returnValue(callableSpy);

      const consoleErrorSpy = spyOn(console, 'error');

      await expectAsync(
        service.secureFeatureCloudFunction({ text: 'Linz' }),
      ).toBeResolved();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error calling secure feature:',
        cloudError,
      );
    });
  });
});
