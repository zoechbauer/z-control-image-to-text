import {
  inject,
  Injectable,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { TranslateService } from '@ngx-translate/core';

import { RecognizeInputData, RecognizeResult } from '../shared/app.interfaces';
import { FireStoreConstants } from '../shared/app.constants';
import { ToastAnchor } from '../shared/enums';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class OcrService {
  private readonly functions = inject(Functions);
  private readonly translate = inject(TranslateService);
  private readonly toastService = inject(ToastService);

  private readonly injector: Injector;

  constructor() {
    this.injector = inject(Injector);
  }

  /**
   * Calls a secure cloud function to perform OCR (Optical Character Recognition) on an image.
   * @param params The input data required for the OCR process, including image data and any additional parameters.
   * @returns A promise that resolves to the OCR result, or undefined if an error occurs.
   */
  async secureRecognize(
    params: RecognizeInputData,
  ): Promise<RecognizeResult | undefined> {
    try {
      const callable = runInInjectionContext(this.injector, () =>
        this.getHttpsCallable('extractTextFromImage'),
      );
      const result = await runInInjectionContext(this.injector, () =>
        (callable as any)({
          appId: FireStoreConstants.APP_ID,
          ...params,
        }),
      );
      return result?.data as RecognizeResult;
    } catch (error) {
      console.error('Error calling secure feature:', error);
      this.toastService.showToast(
        this.translate.instant('FEATURE.TOAST.ERROR_CALLING_FEATURE'),
        ToastAnchor.MainPage,
      );
      return undefined;
    }
  }

  private getHttpsCallable(functionName: string) {
    return httpsCallable(this.functions, functionName);
  }

}
