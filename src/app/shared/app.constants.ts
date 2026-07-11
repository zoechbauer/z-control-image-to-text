import { environment } from '@env/environment';

export class AppConstants {
  public static readonly currentUser: string = 'currentUser';
  private static readonly _maxFreeFeatureCharsPerMonth = 500000;

  static get maxFreeFeatureCharsPerMonth(): number {
    return (
      environment.app.maxFreeFeatureCharsPerMonth ??
      this._maxFreeFeatureCharsPerMonth
    );
  }
}

// IMPORTANT: Do not change the path of FireStoreConstants as it is used in both the functions and the Angular app.
// functions/src/shared/app.constants.ts
// src/app/shared/app.constants.ts

export class FireStoreConstants {
  static readonly COLLECTION_NAME = 'ZC_ionic_setup';
  static readonly APP_ID = 'ionic_setup';

  static readonly getUserMappingUsersCollectionPath = () => {
    return `${FireStoreConstants.COLLECTION_NAME}/userMapping/users`;
  };

  static readonly getUsersCollectionPath = (
    selectedMonth: string | undefined = undefined,
  ) => {
    let month = this.currentYearMonthPath();
    if (selectedMonth) month = selectedMonth;
    return `${FireStoreConstants.COLLECTION_NAME}/${month}/users`;
  };

  static readonly getMetaTotalCharsDocumentPath = (
    selectedMonth: string | undefined = undefined,
  ) => {
    let month = this.currentYearMonthPath();
    if (selectedMonth) month = selectedMonth;
    return `${FireStoreConstants.COLLECTION_NAME}/${month}/meta/totalChars`;
  };

  static readonly getMetaContingentDataDocumentPath = (
    selectedMonth: string | undefined = undefined,
  ) => {
    let month = this.currentYearMonthPath();
    if (selectedMonth) month = selectedMonth;
    return `${FireStoreConstants.COLLECTION_NAME}/${month}/meta/contingentData`;
  };

  /**
   * Returns the current year and month as a string in the format 'YYYY-MM'.
   */
  static readonly currentYearMonthPath = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };
}
