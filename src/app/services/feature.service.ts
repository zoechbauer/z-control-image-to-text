import {
  inject,
  Injectable,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { TranslateService } from '@ngx-translate/core';

import { SecureFeatureData, FeatureResult } from '../shared/app.interfaces';
import { FireStoreConstants } from '../shared/app.constants';
import { ToastAnchor } from '../shared/enums';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  private readonly functions = inject(Functions);
  private readonly translate = inject(TranslateService);
  private readonly toastService = inject(ToastService);

  private readonly injector: Injector;

  constructor() {
    this.injector = inject(Injector);
  }

  /**
   * Calls the secureFeature Firebase Cloud Function for feature logic.
   * see z-control-translator/secureTranslateCloudFunction as a concrete example of how to implement a secure feature cloud function.
   * @param params The parameters for the feature. In a real implementation, this would be replaced with actual parameters relevant to the feature.
   * @returns Promise resolving to feature object or throws error.
   */
  async secureFeatureCloudFunction(
    params: SecureFeatureData,
  ): Promise<FeatureResult | undefined> {
    try {
      const callable = runInInjectionContext(this.injector, () =>
        this.getHttpsCallable('secureFeature'),
      );
      const result = await runInInjectionContext(this.injector, () =>
        (callable as any)({
          appId: FireStoreConstants.APP_ID,
          ...params,
        }),
      );
      return result?.data as FeatureResult;
    } catch (error) {
      console.error('Error calling secure feature:', error);
      this.toastService.showToast(
        this.translate.instant('APP.MAIN.TOAST.ERROR_CALLING_FEATURE'),
        ToastAnchor.MainPage,
      );
      return undefined;
    }
  }

  private getHttpsCallable(functionName: string) {
    return httpsCallable(this.functions, functionName);
  }
}
