import { environment } from '@env/environment';

export class AppConstants {
  public static readonly currentUser: string = 'currentUser';

  /**
   * Returns the maximum number of free image processing allowed per month.
   */
  static get maxFreeFeatureCharsPerMonth(): number {
    return environment.app.maxFreeFeatureCharsPerMonth ?? 0;
  }

  /**
   * Returns the maximum number of free image processing allowed per month for a single user.
   */
  static get maxFreeFeatureCharsPerMonthForUser(): number {
    return environment.app.maxFreeFeatureCharsPerMonthForUser ?? 0;
  }
}

// IMPORTANT: Do not change the path of FireStoreConstants as it is used in both the functions and the Angular app.
// functions/src/shared/app.constants.ts
// src/app/shared/app.constants.ts

export class FireStoreConstants {
  static readonly COLLECTION_NAME = 'ZC_image_to_text_statistics';
  static readonly APP_ID = 'image_to_text';

  /**
   * Returns the path to the user mapping users collection.
   */
  static readonly getUserMappingUsersCollectionPath = () => {
    return `${FireStoreConstants.COLLECTION_NAME}/userMapping/users`;
  };

  /**
   * Returns the path to the users collection for the specified month.
   * @param selectedMonth The selected month in the format 'YYYY-MM'. If not provided, the current month is used.
   */
  static readonly getUsersCollectionPath = (
    selectedMonth: string | undefined = undefined,
  ) => {
    let month = this.currentYearMonthPath();
    if (selectedMonth) month = selectedMonth;
    return `${FireStoreConstants.COLLECTION_NAME}/${month}/users`;
  };

  /**
   * Returns the path to the meta total characters document for the specified month.
   * @param selectedMonth The selected month in the format 'YYYY-MM'. If not provided, the current month is used.
   */
  static readonly getMetaTotalCharsDocumentPath = (
    selectedMonth: string | undefined = undefined,
  ) => {
    let month = this.currentYearMonthPath();
    if (selectedMonth) month = selectedMonth;
    return `${FireStoreConstants.COLLECTION_NAME}/${month}/meta/totalChars`;
  };

  /**
   * Returns the path to the meta contingent data document for the specified month.
   * @param selectedMonth The selected month in the format 'YYYY-MM'. If not provided, the current month is used.
   */
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
