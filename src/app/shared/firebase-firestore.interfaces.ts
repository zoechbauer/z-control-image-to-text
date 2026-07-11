// keep in sync with functions/src/shared/firebase-firestore.interfaces.ts
export interface FirestoreContingentData {
  StopTranslationForAllUsers?: boolean;
  maxFreeTranslateCharsPerMonth?: number;
  maxFreeTranslateCharsBufferPerMonth?: number;
  maxFreeTranslateCharsPerMonthForUser?: number;
}

export interface ContingentData {
  StopFeatureUsageForAllUsers?: boolean;
  maxFreeFeatureCharsPerMonth?: number;
  maxFreeFeatureCharsBufferPerMonth?: number;
  maxFreeFeatureCharsPerMonthForUser?: number;
}

export interface DisplayedUserContingentData {
  userNameKey: string;
  freeFeatureCharsPerMonth: number;
  consumedFeatureCharCountCurrentMonth: number;
  availableFeatureCharCountCurrentMonth: number;
}
export interface DisplayedUserStatistics {
  userId: string;
  userName: string;
  userType: 'P' | 'U'; // Programmer or User
  userCreatedAt: Date;
  userLastUpdated: Date | null;
  device: string | null;
  isNative: boolean;
  deviceInfo: DeviceInfo;
  displayedPlatform: string;
  displayedModel: string;
  consumedFeatureCharCount: number;
  lastFeatureUsageDate: Date | null;
}
export interface DisplayedUserStatisticsRow extends DisplayedUserStatistics {
  formattedLastActivityDate: string;
  isCurrentUser: boolean;
}
export interface UserStatisticsSummary {
  category: string;
  name: string;
  countFeatureUsage: number;
  countRegistrations: number;
}

export interface UserFeatureUsageStatistics {
  userId: string;
  consumedFeatureCharCount: number;
  lastFeatureUsageDate?: Date;
}

export interface UserType {
  userId: string;
  name: string;
  type: 'P' | 'U'; // Programmer or User
  isNative: boolean;
  createdAt: Date;
  device?: string;
  deviceInfo?: DeviceInfo;
  lastUpdated?: Date;
}

export interface StatisticsData {
  displayedUserStatistics: DisplayedUserStatistics[];
  userFeatureStatistics: UserFeatureUsageStatistics[];
  users: UserType[];
  programmerDeviceUIDs: ProgrammerDeviceUID[];
}
export interface ProgrammerDeviceUID {
  userId: string;
  name: string;
}
export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  appVersion: {
    major: number;
    minor: number;
    date: string;
  };
}
