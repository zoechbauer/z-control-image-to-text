import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';

import { FirebaseFirestoreService } from './firebase-firestore.service';
import { environment } from '@env/environment';
import {
  DisplayedUserContingentData,
  DisplayedUserStatistics,
  StatisticsData,
  UserStatisticsSummary,
  UserFeatureUsageStatistics,
  ContingentData,
} from '../shared/firebase-firestore.interfaces';
import { LocalStorageService } from './local-storage.service';
import {
  AllMonthsOption,
  DisplayMode,
  StatisticsSummaryCategory,
  StatisticsSummaryName,
} from '../shared/enums';
import { DeviceUtils } from './device-utils.service';
import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class FirebaseFirestoreUtilsService {
  private readonly firestoreService = inject(FirebaseFirestoreService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly utilsService = inject(UtilsService);

  private readonly statisticsRefreshSubject = new Subject<void>();
  readonly statisticsRefresh$ = this.statisticsRefreshSubject.asObservable();
  private statisticsDisplayMode: DisplayMode = DisplayMode.User;
  private statisticsSelectedMonth: string = '';

  constructor() {
    this.firestoreService.programmerDeviceRefresh$.subscribe(() => {
      this.localStorageService
        .getStatisticsDisplayMode()
        .then((mode: DisplayMode) => {
          this.statisticsDisplayMode = mode;
        });
    });
  }

  /**
   * Requests a statistics refresh by emitting a notification to all subscribers.
   *
   * This method triggers the statisticsRefresh$ observable, notifying all components
   * listening to statistics changes that they should refresh their data.
   */
  requestStatisticsRefresh(): void {
    this.statisticsRefreshSubject.next();
  }

  /**
   * Retrieves displayed user statistics from Firestore.
   *
   * Fetches feature usage statistics for all users and user information for the selected month
   * (or all months), then aggregates and combines them into a StatisticsData result.
   *
   * When the same userId appears in multiple records (e.g. across months), the records
   * are aggregated: char counts are summed, target languages are unioned, and the latest
   * feature usage date is kept.
   *
   * Users with no feature usage activity (consumedFeatureCharCount === 0) are excluded unless
   * the display mode is Programmer. Results are sorted by last feature usage date descending,
   * with ties broken by user creation date descending.
   *
   * On a programmer device, programmer device UIDs are also fetched and included.
   *
   * @param {boolean} isProgrammerDevice - Indicates whether the device is a programmer device.
   * @returns {Promise<StatisticsData>} A promise resolving to statistics data containing
   *          displayed user statistics, raw user feature usage statistics, all users,
   *          and programmer device UIDs (empty if not a programmer device).
   */
  async getDisplayedUserStatistics(
    isProgrammerDevice: boolean,
  ): Promise<StatisticsData> {
    let statisticsData: StatisticsData = {
      displayedUserStatistics: [],
      userFeatureStatistics: [],
      users: [],
      programmerDeviceUIDs: [],
    };

    this.statisticsDisplayMode =
      await this.localStorageService.getStatisticsDisplayMode();

    this.statisticsSelectedMonth =
      await this.localStorageService.getStatisticsSelectedMonth(
        AllMonthsOption.localStorageValue,
        isProgrammerDevice,
      );

    const userFeatureUsageStatistics: UserFeatureUsageStatistics[] =
      await this.firestoreService.getAllUserFeatureUsageStatistics(
        this.statisticsSelectedMonth,
      );

    statisticsData.userFeatureStatistics = userFeatureUsageStatistics;

    statisticsData.users = await this.firestoreService.getUsers(
      this.statisticsSelectedMonth,
    );

    if (this.firestoreService.isProgrammerDevice) {
      statisticsData.programmerDeviceUIDs =
        await this.firestoreService.getProgrammerDeviceUIDs();
    }

    statisticsData.users.forEach((userInfo) => {
      const userFeatureUsageInfos = userFeatureUsageStatistics.filter(
        (u) => u.userId === userInfo.userId,
      );

      const aggregatedFeatureUsageInfo: UserFeatureUsageStatistics | undefined =
        userFeatureUsageInfos.length > 0
          ? {
              userId: userInfo.userId,
              consumedFeatureCharCount: userFeatureUsageInfos.reduce(
                (sum, info) => sum + (info.consumedFeatureCharCount || 0),
                0,
              ),
              lastFeatureUsageDate: userFeatureUsageInfos.reduce<
                Date | undefined
              >((latest, info) => {
                const current = info.lastFeatureUsageDate;
                /* istanbul ignore next */
                if (!current) return latest;
                if (!latest || current.getTime() > latest.getTime()) {
                  return current;
                }
                /* istanbul ignore next */
                return latest;
              }, undefined),
            }
          : undefined;

      const stat: DisplayedUserStatistics = {
        userId: userInfo.userId,
        userName: userInfo.name,
        userType: userInfo.type,
        userCreatedAt: userInfo.createdAt,
        userLastUpdated: userInfo.lastUpdated || null,
        isNative: userInfo.isNative,
        device: userInfo.device || null,
        deviceInfo: userInfo.deviceInfo || {
          userAgent: '',
          platform: '',
          language: '',
          appVersion: {
            major: 0,
            minor: 0,
            date: '',
          },
        },
        displayedPlatform: DeviceUtils.getWebPlatform(userInfo),
        displayedModel: DeviceUtils.getModel(userInfo),
        consumedFeatureCharCount:
          aggregatedFeatureUsageInfo?.consumedFeatureCharCount ?? 0,
        lastFeatureUsageDate:
          aggregatedFeatureUsageInfo?.lastFeatureUsageDate ?? null,
      };

      if (
        this.statisticsDisplayMode === DisplayMode.Programmer ||
        stat.consumedFeatureCharCount > 0
      ) {
        statisticsData.displayedUserStatistics.push(stat);
      }
    });

    statisticsData.displayedUserStatistics.sort(
      (a, b) =>
        (b.lastFeatureUsageDate?.getTime() ?? 0) -
          (a.lastFeatureUsageDate?.getTime() ?? 0) ||
        (b.userCreatedAt?.getTime() ?? 0) - (a.userCreatedAt?.getTime() ?? 0),
    ); // Sort by last feature usage date desc and userCreatedAt desc
    return statisticsData;
  }

  /**
   * Builds an aggregated statistics summary for display in the admin statistics view.
   *
   * Creates summary rows in this order:
   * 1. User type (Programmer/User)
   * 2. Platform (native/webmobile/webdesktop)
   * 3. Device model
   * 4. Target language count (1-5)
   *
   * Each row includes:
   * - countFeatureUsage: users with consumedFeatureCharCount > 0
   * - countRegistrations: users with consumedFeatureCharCount === 0
   *
   * @param statisticsData The list of displayed user statistics used as input.
   * @returns A flattened array of summary rows grouped by category.
   */
  getUserStatisticsSummary(
    statisticsData: DisplayedUserStatistics[],
  ): UserStatisticsSummary[] {
    let statsSummary: UserStatisticsSummary[] = [];
    let rows: UserStatisticsSummary[];

    // user type summary rows
    rows = this.createStatisticsSummaryUserTypeRows(
      StatisticsSummaryCategory.UserType,
      statisticsData,
    );
    statsSummary.push(...rows);

    // platform summary rows
    rows = this.createStatisticsSummaryPlatformRows(
      StatisticsSummaryCategory.Platform,
      statisticsData,
    );
    statsSummary.push(...rows);

    // device model summary rows
    rows = this.createStatisticsSummaryModelRows(
      StatisticsSummaryCategory.Model,
      statisticsData,
    );
    statsSummary.push(...rows);

    return statsSummary;
  }

  /**
   * Creates summary rows grouped by user type (Programmer/User).
   *
   * @param category Summary category label for the generated rows.
   * @param statisticsData Source user statistics.
   * @returns Summary rows for each user type.
   */
  private createStatisticsSummaryUserTypeRows(
    category: StatisticsSummaryCategory,
    statisticsData: DisplayedUserStatistics[],
  ): UserStatisticsSummary[] {
    const types = [
      StatisticsSummaryName.Programmer,
      StatisticsSummaryName.User,
    ];

    return this.buildStatisticsSummaryRows(category, types, statisticsData);
  }

  /**
   * Creates summary rows grouped by platform (native/webmobile/webdesktop).
   *
   * @param category Summary category label for the generated rows.
   * @param statisticsData Source user statistics.
   * @returns Summary rows for each platform.
   */
  private createStatisticsSummaryPlatformRows(
    category: StatisticsSummaryCategory,
    statisticsData: DisplayedUserStatistics[],
  ): UserStatisticsSummary[] {
    const types = [
      StatisticsSummaryName.Native,
      StatisticsSummaryName.WebMobile,
      StatisticsSummaryName.WebDesktop,
    ];

    return this.buildStatisticsSummaryRows(category, types, statisticsData);
  }

  /**
   * Creates summary rows grouped by normalized device model names.
   *
   * Uses a normalized model key to merge formatting variants while preserving
   * one display name per model for output.
   *
   * @param category Summary category label for the generated rows.
   * @param statisticsData Source user statistics.
   * @returns Alphabetically sorted model summary rows.
   */
  private createStatisticsSummaryModelRows(
    category: StatisticsSummaryCategory,
    statisticsData: DisplayedUserStatistics[],
  ): UserStatisticsSummary[] {
    const modelMap = this.getModelTypeMap(statisticsData);

    return Array.from(modelMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([normalizedModel, displayedModel]) => ({
        category,
        name: displayedModel,
        countFeatureUsage: this.countFeatureUsageForType(
          statisticsData,
          normalizedModel,
        ),
        countRegistrations: this.countRegistrationsForType(
          statisticsData,
          normalizedModel,
        ),
      }));
  }

  /**
   * Builds summary rows for the specified types.
   *
   * @param category Summary category label for the generated rows.
   * @param types Array of types to generate summary rows for.
   * @param statisticsData Source user statistics.
   * @returns Summary rows for each specified type.
   */
  private buildStatisticsSummaryRows(
    category: StatisticsSummaryCategory,
    types: string[],
    statisticsData: DisplayedUserStatistics[],
  ): UserStatisticsSummary[] {
    let rows: UserStatisticsSummary[] = [];
    types.forEach((type) => {
      rows.push({
        category,
        name: type,
        countFeatureUsage: this.countFeatureUsageForType(statisticsData, type),
        countRegistrations: this.countRegistrationsForType(
          statisticsData,
          type,
        ),
      });
    });
    return rows;
  }

  /**
   * Counts users with at least one feature usage for the given type.
   *
   * Supports user type, platform, and normalized model names.
   *
   * @param statisticsData Source user statistics.
   * @param type Type discriminator used for matching.
   * @returns Number of users with consumedFeatureCharCount > 0.
   */
  private countFeatureUsageForType(
    statisticsData: DisplayedUserStatistics[],
    type: StatisticsSummaryName | string,
  ): number {
    return statisticsData.filter((userStat) => {
      switch (type) {
        case StatisticsSummaryName.Programmer:
        case StatisticsSummaryName.User:
          return (
            userStat.userType === type && userStat.consumedFeatureCharCount > 0
          );
        case StatisticsSummaryName.Native:
        case StatisticsSummaryName.WebMobile:
        case StatisticsSummaryName.WebDesktop:
          return (
            userStat.displayedPlatform === type &&
            userStat.consumedFeatureCharCount > 0
          );
        default:
          return (
            this.normalizeModelForCompare(userStat.displayedModel) ===
              this.normalizeModelForCompare(type) &&
            userStat.consumedFeatureCharCount > 0
          );
      }
    }).length;
  }

  /**
   * Counts users with no feature usage for the given type.
   *
   * Supports user type, platform, and normalized model names.
   *
   * @param statisticsData Source user statistics.
   * @param type Type discriminator used for matching.
   * @returns Number of users with consumedFeatureCharCount === 0.
   */
  private countRegistrationsForType(
    statisticsData: DisplayedUserStatistics[],
    type: StatisticsSummaryName | string,
  ): number {
    return statisticsData.filter((userStat) => {
      switch (type) {
        case StatisticsSummaryName.Programmer:
        case StatisticsSummaryName.User:
          return (
            userStat.userType === type &&
            userStat.consumedFeatureCharCount === 0
          );
        case StatisticsSummaryName.Native:
        case StatisticsSummaryName.WebMobile:
        case StatisticsSummaryName.WebDesktop:
          return (
            userStat.displayedPlatform === type &&
            userStat.consumedFeatureCharCount === 0
          );
        default:
          return (
            this.normalizeModelForCompare(userStat.displayedModel) ===
              this.normalizeModelForCompare(type) &&
            userStat.consumedFeatureCharCount === 0
          );
      }
    }).length;
  }

  /**
   * Normalizes a model name for comparison by removing whitespace and converting to uppercase.
   *
   * @param value Model name to normalize.
   * @returns Normalized model name.
   */
  private normalizeModelForCompare(value: string | null | undefined): string {
    return (value ?? '').split(/\s+/).join('').toUpperCase();
  }

  /**
   * Builds a map of normalized model keys to display model names.
   *
   * Empty model names are skipped. The first encountered display name is kept
   * for each normalized key.
   *
   * @param statisticsData Source user statistics.
   * @returns Map where key is normalized model and value is display model.
   */
  private getModelTypeMap(
    statisticsData: DisplayedUserStatistics[],
  ): Map<string, string> {
    const modelMap = new Map<string, string>();

    statisticsData.forEach((userStat) => {
      const displayedModel = (userStat.displayedModel ?? '').trim();
      if (!displayedModel) {
        return;
      }
      const normalizedModel = this.normalizeModelForCompare(displayedModel);
      if (!modelMap.has(normalizedModel)) {
        modelMap.set(normalizedModel, displayedModel);
      }
    });
    return modelMap;
  }

  /**
   * Retrieves displayed user contingent data for feature usage limits.
   *
   * Fetches the current feature usage contingent information for both the current user
   * and all users combined. Automatically refreshes the month context if the month has changed.
   * Calculates available character counts based on configured limits and buffers.
   *
   * @returns {Promise<DisplayedUserContingentData[]>} A promise resolving to an array containing
   *          contingent data for the current user and all users combined.
   */
  async getDisplayedUserContingentData(): Promise<
    DisplayedUserContingentData[]
  > {
    // Read all control flags from Firestore
    const contingentData: ContingentData =
      await this.firestoreService.readFeatureContingentData(
        this.utilsService.getCurrentMonth(),
      );
    const displayedContingentData: DisplayedUserContingentData[] = [];
    // calculate data for current user
    const userCharCount = await this.firestoreService.getCharCountForUser();
    const limit =
      contingentData.maxFreeFeatureCharsPerMonthForUser ??
      environment.app.maxFreeFeatureCharsPerMonthForUser;
    let availableCharCountCurrentMonth = Math.max(0, limit - userCharCount);
    const currentUserContingentData: DisplayedUserContingentData = {
      userNameKey: 'MAIN_STATISTICS.CARD.GRID.USER_NAME_YOU',
      consumedFeatureCharCountCurrentMonth: userCharCount,
      freeFeatureCharsPerMonth: limit,
      availableFeatureCharCountCurrentMonth: availableCharCountCurrentMonth,
    };
    displayedContingentData.push(currentUserContingentData);

    // calculate data for all users
    const totalCharCount = await this.firestoreService.getTotalCharCount();
    const totalLimit =
      contingentData.maxFreeFeatureCharsPerMonth ??
      environment.app.maxFreeFeatureCharsPerMonth;
    const totalBuffer =
      contingentData.maxFreeFeatureCharsBufferPerMonth ??
      environment.app.maxFreeFeatureCharsBufferPerMonth;
    availableCharCountCurrentMonth = Math.max(
      0,
      totalLimit - totalBuffer - totalCharCount,
    );
    const allUserContingentData: DisplayedUserContingentData = {
      userNameKey: 'MAIN_STATISTICS.CARD.GRID.USER_NAME_ALL',
      consumedFeatureCharCountCurrentMonth: totalCharCount,
      freeFeatureCharsPerMonth: totalLimit - totalBuffer,
      availableFeatureCharCountCurrentMonth: availableCharCountCurrentMonth,
    };
    displayedContingentData.push(allUserContingentData);
    return displayedContingentData;
  }

  /**
   * Checks if the feature usage contingent has been exceeded.
   *
   * This method verifies, in order:
   * 1. If feature usage is globally stopped for all users.
   * 2. If the total contingent for all users is exceeded.
   * 3. If the contingent for the current user is exceeded.
   * Returns true if any of these conditions are met, otherwise false.
   *
   * Note: these checks are also implemented in the Firebase Functions backend for security.
   */
  async isContingentExceeded(): Promise<boolean> {
    // Read all control flags from Firestore
    const flags: ContingentData =
      await this.firestoreService.readFeatureContingentData(
        this.utilsService.getCurrentMonth(),
      );

    // 1. If feature usage is globally stopped for all users
    if (flags.StopFeatureUsageForAllUsers) {
      return true;
    }
    // 2. If the total contingent for all users is exceeded
    if (await this.isTotalContingentExceeded(flags)) {
      return true;
    }
    // 3. If the contingent for the current user is exceeded
    if (await this.isContingentForUserExceeded(flags)) {
      return true;
    }
    return false;
  }

  private async isContingentForUserExceeded(
    flags: ContingentData,
  ): Promise<boolean> {
    const limit =
      flags.maxFreeFeatureCharsPerMonthForUser ??
      environment.app.maxFreeFeatureCharsPerMonthForUser;
    const charCount = await this.firestoreService.getCharCountForUser();
    return charCount >= limit;
  }

  private async isTotalContingentExceeded(
    flags: ContingentData,
  ): Promise<boolean> {
    const limit =
      flags.maxFreeFeatureCharsPerMonth ??
      environment.app.maxFreeFeatureCharsPerMonth;
    const buffer =
      flags.maxFreeFeatureCharsBufferPerMonth ??
      environment.app.maxFreeFeatureCharsBufferPerMonth;
    const charCount = await this.firestoreService.getTotalCharCount();
    return charCount >= limit - buffer;
  }
}
