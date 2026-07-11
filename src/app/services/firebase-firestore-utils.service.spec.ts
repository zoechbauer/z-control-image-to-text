import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FirebaseFirestoreService } from './firebase-firestore.service';
import { environment } from '@env/environment';
import { UtilsService } from './utils.service';
import {
  DisplayedUserContingentData,
  DisplayedUserStatistics,
  ContingentData,
  ProgrammerDeviceUID,
  StatisticsData,
  UserFeatureUsageStatistics,
  UserType,
} from '../shared/firebase-firestore.interfaces';
import { FirebaseFirestoreUtilsService } from './firebase-firestore-utils.service';
import { LocalStorageService } from './local-storage.service';
import {
  AllMonthsOption,
  DisplayMode,
  StatisticsSummaryCategory,
  StatisticsSummaryName,
} from '../shared/enums';
import { FireStoreConstants } from '../shared/app.constants';

describe('FirebaseFirestoreUtilsService', () => {
  let service: FirebaseFirestoreUtilsService;
  let firestoreServiceMock: jasmine.SpyObj<FirebaseFirestoreService>;
  let utilsServiceMock: jasmine.SpyObj<UtilsService>;
  let localStorageServiceMock: jasmine.SpyObj<LocalStorageService>;
  let originalCollectionName: any;

  beforeAll(() => {
    originalCollectionName = (FireStoreConstants as any).COLLECTION_NAME;
  });

  beforeEach(() => {
    (FireStoreConstants as any).COLLECTION_NAME = originalCollectionName;

    utilsServiceMock = jasmine.createSpyObj('UtilsService', [
      'getPlatform',
      'getModel',
      'getCurrentMonth',
      'formatDateTimeISO',
    ]);

    firestoreServiceMock = jasmine.createSpyObj(
      'FirebaseFirestoreService',
      [
        'readFeatureContingentData',
        'getCharCountForUser',
        'getTotalCharCount',
        'getAllUserFeatureUsageStatistics',
        'getUsers',
        'getProgrammerDeviceUIDs',
        'init',
        'getCurrentUserId',
      ],
      {
        programmerDeviceRefresh$: of(void 0),
        isProgrammerDevice: true,
      },
    );
    localStorageServiceMock = jasmine.createSpyObj(
      'LocalStorageService',
      ['getStatisticsDisplayMode', 'getStatisticsSelectedMonth'],
      {
        statisticsDisplayMode$: of(DisplayMode.User),
        statisticsSelectedMonth$: of('2026-04'),
      },
    );
    localStorageServiceMock.getStatisticsDisplayMode.and.resolveTo(
      DisplayMode.User,
    );
    localStorageServiceMock.getStatisticsSelectedMonth.and.resolveTo('2026-04');

    TestBed.configureTestingModule({
      providers: [
        FirebaseFirestoreUtilsService,
        { provide: FirebaseFirestoreService, useValue: firestoreServiceMock },
        { provide: UtilsService, useValue: utilsServiceMock },
        {
          provide: LocalStorageService,
          useValue: localStorageServiceMock,
        },
      ],
    });
    service = TestBed.inject(FirebaseFirestoreUtilsService);
  });

  describe('requestStatisticsRefresh', () => {
    it('should call statisticsRefreshSubject.next to refresh statistics', async () => {
      spyOn(service['statisticsRefreshSubject'], 'next');
      service.requestStatisticsRefresh();
      expect(service['statisticsRefreshSubject'].next).toHaveBeenCalled();
    });
  });

  describe('isContingentExceeded', () => {
    it('should return true if StopFeatureUsageForAllUsers is true', async () => {
      firestoreServiceMock.readFeatureContingentData.and.resolveTo({
        StopFeatureUsageForAllUsers: true,
      });
      const result = await service.isContingentExceeded();
      expect(result).toBeTrue();
    });

    it('should return true if total contingent is exceeded', async () => {
      firestoreServiceMock.readFeatureContingentData.and.resolveTo({});
      firestoreServiceMock.getTotalCharCount.and.resolveTo(
        environment.app.maxFreeFeatureCharsPerMonth -
          environment.app.maxFreeFeatureCharsBufferPerMonth +
          1,
      );
      firestoreServiceMock.getCharCountForUser.and.resolveTo(0);
      const result = await service.isContingentExceeded();
      expect(result).toBeTrue();
    });

    it('should return true if user contingent is exceeded', async () => {
      firestoreServiceMock.readFeatureContingentData.and.resolveTo({});
      firestoreServiceMock.getTotalCharCount.and.resolveTo(0);
      firestoreServiceMock.getCharCountForUser.and.resolveTo(
        environment.app.maxFreeFeatureCharsPerMonthForUser + 1,
      );
      const result = await service.isContingentExceeded();
      expect(result).toBeTrue();
    });

    it('should return false if contingent is not exceeded and feature usage is not stopped', async () => {
      firestoreServiceMock.readFeatureContingentData.and.resolveTo({});
      firestoreServiceMock.getTotalCharCount.and.resolveTo(0);
      firestoreServiceMock.getCharCountForUser.and.resolveTo(0);
      const result = await service.isContingentExceeded();
      expect(result).toBeFalse();
    });

    it('should use Firestore flag values if present', async () => {
      const flags: ContingentData = {
        StopFeatureUsageForAllUsers: false,
        maxFreeFeatureCharsPerMonth: 100,
        maxFreeFeatureCharsBufferPerMonth: 0,
        maxFreeFeatureCharsPerMonthForUser: 10,
      };
      firestoreServiceMock.readFeatureContingentData.and.resolveTo(flags);
      firestoreServiceMock.getTotalCharCount.and.resolveTo(101);
      firestoreServiceMock.getCharCountForUser.and.resolveTo(11);
      // Should return true for total contingent exceeded first
      const result = await service.isContingentExceeded();
      expect(result).toBeTrue();
      // Now test user contingent exceeded
      firestoreServiceMock.getTotalCharCount.and.resolveTo(0);
      firestoreServiceMock.getCharCountForUser.and.resolveTo(11);
      const result2 = await service.isContingentExceeded();
      expect(result2).toBeTrue();
    });
  });

  describe('getDisplayedUserContingentData', () => {
    let contingentData: ContingentData;

    beforeEach(() => {
      contingentData = {
        StopFeatureUsageForAllUsers: false,
        maxFreeFeatureCharsPerMonth: 500000,
        maxFreeFeatureCharsBufferPerMonth: 5000,
        maxFreeFeatureCharsPerMonthForUser: 10000,
      };
    });

    it('should return contingent data with user char count', async () => {
      firestoreServiceMock.readFeatureContingentData.and.resolveTo(
        contingentData,
      );
      firestoreServiceMock.getCharCountForUser.and.resolveTo(1000);

      const result = await service.getDisplayedUserContingentData();
      const userContingentData = result[0];

      const expectedUserResult: DisplayedUserContingentData = {
        userNameKey: 'MAIN_STATISTICS.CARD.GRID.USER_NAME_YOU',
        freeFeatureCharsPerMonth:
          contingentData.maxFreeFeatureCharsPerMonthForUser || 0,
        consumedFeatureCharCountCurrentMonth: 1000,
        availableFeatureCharCountCurrentMonth:
          (contingentData.maxFreeFeatureCharsPerMonthForUser || 0) - 1000,
      };

      expect(userContingentData).toEqual(expectedUserResult);
    });

    it('should return contingent data with char count of all users', async () => {
      firestoreServiceMock.readFeatureContingentData.and.resolveTo(
        contingentData,
      );
      firestoreServiceMock.getCharCountForUser.and.resolveTo(1000);
      firestoreServiceMock.getTotalCharCount.and.resolveTo(20000);

      const result = await service.getDisplayedUserContingentData();
      const totalContingentData = result[1];

      const maxTotalFreeChars =
        (contingentData.maxFreeFeatureCharsPerMonth || 0) -
        (contingentData.maxFreeFeatureCharsBufferPerMonth || 0);

      const expectedTotalResult: DisplayedUserContingentData = {
        userNameKey: 'MAIN_STATISTICS.CARD.GRID.USER_NAME_ALL',
        freeFeatureCharsPerMonth: maxTotalFreeChars,
        consumedFeatureCharCountCurrentMonth: 20000,
        availableFeatureCharCountCurrentMonth: maxTotalFreeChars - 20000,
      };

      expect(totalContingentData).toEqual(expectedTotalResult);
    });

    it('should use environment data if contingent data fields are missing', async () => {
      firestoreServiceMock.readFeatureContingentData.and.resolveTo({});
      firestoreServiceMock.getCharCountForUser.and.resolveTo(500);
      firestoreServiceMock.getTotalCharCount.and.resolveTo(5000);

      environment.app.maxFreeFeatureCharsPerMonth = 500000;
      environment.app.maxFreeFeatureCharsBufferPerMonth = 5000;
      environment.app.maxFreeFeatureCharsPerMonthForUser = 10000;

      const result = await service.getDisplayedUserContingentData();
      const userContingentData = result[0];
      const totalContingentData = result[1];

      const maxTotalFreeChars =
        (environment.app.maxFreeFeatureCharsPerMonth || 0) -
        (environment.app.maxFreeFeatureCharsBufferPerMonth || 0);
      const expectedUserResult: DisplayedUserContingentData = {
        userNameKey: 'MAIN_STATISTICS.CARD.GRID.USER_NAME_YOU',
        freeFeatureCharsPerMonth:
          environment.app.maxFreeFeatureCharsPerMonthForUser || 0,
        consumedFeatureCharCountCurrentMonth: 500,
        availableFeatureCharCountCurrentMonth:
          (environment.app.maxFreeFeatureCharsPerMonthForUser || 0) - 500,
      };
      const expectedTotalResult: DisplayedUserContingentData = {
        userNameKey: 'MAIN_STATISTICS.CARD.GRID.USER_NAME_ALL',
        freeFeatureCharsPerMonth: maxTotalFreeChars,
        consumedFeatureCharCountCurrentMonth: 5000,
        availableFeatureCharCountCurrentMonth: maxTotalFreeChars - 5000,
      };
      expect(userContingentData)
        .withContext('userContingentData')
        .toEqual(expectedUserResult);
      expect(totalContingentData)
        .withContext('totalContingentData')
        .toEqual(expectedTotalResult);
    });
  });

  describe('getDisplayedUserStatistics', () => {
    let usersAll: UserType[];
    let userStatsAllMonthsRaw: UserFeatureUsageStatistics[];
    let programmerDeviceUIDs: ProgrammerDeviceUID[];

    function createAllMonthUsers(): UserType[] {
      // 10 total users: 4 consumed feature chars (40%), 6 not consumed (60%)
      return [
        {
          userId: 'U-1',
          name: 'User 1',
          type: 'U',
          isNative: false,
          createdAt: new Date('2026-02-10'),
        },
        {
          userId: 'U-2',
          name: 'User 2',
          type: 'U',
          isNative: false,
          createdAt: new Date('2026-02-11'),
        },
        {
          userId: 'U-3',
          name: 'User 3',
          type: 'U',
          isNative: true,
          createdAt: new Date('2026-03-11'),
        },
        {
          userId: 'P-1',
          name: 'Programmer 1',
          type: 'P',
          isNative: true,
          createdAt: new Date('2026-04-09'),
        },

        {
          userId: 'U-4',
          name: 'User 4',
          type: 'U',
          isNative: false,
          createdAt: new Date('2026-02-12'),
        },
        {
          userId: 'U-5',
          name: 'User 5',
          type: 'U',
          isNative: false,
          createdAt: new Date('2026-03-05'),
        },
        {
          userId: 'U-6',
          name: 'User 6',
          type: 'U',
          isNative: true,
          createdAt: new Date('2026-03-06'),
        },
        {
          userId: 'U-7',
          name: 'User 7',
          type: 'U',
          isNative: false,
          createdAt: new Date('2026-04-01'),
        },
        {
          userId: 'P-2',
          name: 'Programmer 2',
          type: 'P',
          isNative: true,
          createdAt: new Date('2026-04-02'),
        },
        {
          userId: 'P-3',
          name: 'Programmer 3',
          type: 'P',
          isNative: true,
          createdAt: new Date('2026-04-03'),
        },
      ];
    }

    function createAllMonthFeatureUsageStatsRaw(): UserFeatureUsageStatistics[] {
      // Same userIds across 3 months
      // U-1 total = 1500 + 1500 + 1500 = 4500
      // U-2 total = 1000 + 1200 + 1300 = 3500
      // Separate userIds in single months
      // U-3 total = 2500 (March only)
      // P-1 total = 3000 (April only)
      // Grand total expected after aggregation = 13500
      return [
        {
          userId: 'U-1',
          consumedFeatureCharCount: 1500,
          lastFeatureUsageDate: new Date('2026-02-20'),
        },
        {
          userId: 'U-2',
          consumedFeatureCharCount: 1000,
          lastFeatureUsageDate: new Date('2026-02-18'),
        },

        {
          userId: 'U-1',
          consumedFeatureCharCount: 1500,
          lastFeatureUsageDate: new Date('2026-03-20'),
        },
        {
          userId: 'U-2',
          consumedFeatureCharCount: 1200,
          lastFeatureUsageDate: new Date('2026-03-18'),
        },
        {
          userId: 'U-3',
          consumedFeatureCharCount: 2500,
          lastFeatureUsageDate: new Date('2026-03-25'),
        },

        {
          userId: 'U-1',
          consumedFeatureCharCount: 1500,
          lastFeatureUsageDate: new Date('2026-04-20'),
        },
        {
          userId: 'U-2',
          consumedFeatureCharCount: 1300,
          lastFeatureUsageDate: new Date('2026-04-18'),
        },
        {
          userId: 'P-1',
          consumedFeatureCharCount: 3000,
          lastFeatureUsageDate: new Date('2026-04-22'),
        },
      ];
    }

    beforeEach(() => {
      usersAll = createAllMonthUsers();
      userStatsAllMonthsRaw = createAllMonthFeatureUsageStatsRaw();
      programmerDeviceUIDs = [
        { userId: 'P-1', name: 'Programmer 1' },
        { userId: 'P-2', name: 'Programmer 2' },
        { userId: 'P-3', name: 'Programmer 3' },
      ];

      localStorageServiceMock.getStatisticsSelectedMonth.and.resolveTo(
        AllMonthsOption.localStorageValue,
      );
      localStorageServiceMock.statisticsSelectedMonth$ = of(
        AllMonthsOption.localStorageValue,
      );
      localStorageServiceMock.getStatisticsDisplayMode.and.resolveTo(
        DisplayMode.Programmer,
      );
      localStorageServiceMock.statisticsDisplayMode$ = of(
        DisplayMode.Programmer,
      );

      firestoreServiceMock.getAllUserFeatureUsageStatistics.and.resolveTo(
        userStatsAllMonthsRaw,
      );
      firestoreServiceMock.getUsers.and.resolveTo(usersAll);
      firestoreServiceMock.getProgrammerDeviceUIDs.and.resolveTo(
        programmerDeviceUIDs,
      );
      Object.defineProperty(firestoreServiceMock, 'isProgrammerDevice', {
        get: () => true,
      });
    });

    it('should load statistics and users with selected month all', async () => {
      const isProgrammerDevice = true;
      await service.getDisplayedUserStatistics(isProgrammerDevice);

      expect(
        localStorageServiceMock.getStatisticsSelectedMonth,
      ).toHaveBeenCalledWith(
        AllMonthsOption.localStorageValue,
        isProgrammerDevice,
      );
      expect(
        firestoreServiceMock.getAllUserFeatureUsageStatistics,
      ).toHaveBeenCalledWith(AllMonthsOption.localStorageValue);
      expect(firestoreServiceMock.getUsers).toHaveBeenCalledWith(
        AllMonthsOption.localStorageValue,
      );
    });

    it('should include all users in programmer mode, including 60% users without feature usage', async () => {
      const isProgrammerDevice = true;
      const result =
        await service.getDisplayedUserStatistics(isProgrammerDevice);

      expect(result.users.length).withContext('users length').toBe(10);
      expect(result.displayedUserStatistics.length)
        .withContext('displayedUserStatistics length')
        .toBe(10);

      const featureUsageCount = result.displayedUserStatistics.filter(
        (u) => u.consumedFeatureCharCount > 0,
      ).length;
      const noFeatureUsageCount = result.displayedUserStatistics.filter(
        (u) => u.consumedFeatureCharCount === 0,
      ).length;
      expect(featureUsageCount).withContext('feature usage count').toBe(4);
      expect(noFeatureUsageCount).withContext('no feature usage count').toBe(6);
    });

    it('should aggregate same userId feature usage across all months (target behavior)', async () => {
      const isProgrammerDevice = true;
      const result =
        await service.getDisplayedUserStatistics(isProgrammerDevice);

      const u1 = result.displayedUserStatistics.find((u) => u.userId === 'U-1');
      const u2 = result.displayedUserStatistics.find((u) => u.userId === 'U-2');
      const u3 = result.displayedUserStatistics.find((u) => u.userId === 'U-3');
      const p1 = result.displayedUserStatistics.find((u) => u.userId === 'P-1');

      expect(u1?.consumedFeatureCharCount).toBe(4500);
      expect(u2?.consumedFeatureCharCount).toBe(3500);
      expect(u3?.consumedFeatureCharCount).toBe(2500);
      expect(p1?.consumedFeatureCharCount).toBe(3000);

      const total = result.displayedUserStatistics.reduce(
        (sum, u) => sum + (u.consumedFeatureCharCount || 0),
        0,
      );
      expect(total).toBe(13500);
    });

    it('should keep users not present in feature usage with zero char count', async () => {
      const isProgrammerDevice = true;
      const result =
        await service.getDisplayedUserStatistics(isProgrammerDevice);

      ['U-4', 'U-5', 'U-6', 'U-7', 'P-2', 'P-3'].forEach((id) => {
        const user = result.displayedUserStatistics.find(
          (u) => u.userId === id,
        );
        expect(user).toBeDefined();
        expect(user?.consumedFeatureCharCount).toBe(0);
        expect(user?.lastFeatureUsageDate).toBeNull();
      });
    });

    describe('single-month behavior parity', () => {
      let userStats: UserFeatureUsageStatistics[];
      let users: UserType[];
      let programmerDeviceUIDs: ProgrammerDeviceUID[];

      beforeEach(() => {
        localStorageServiceMock.getStatisticsSelectedMonth.and.resolveTo(
          '2026-03',
        );
        localStorageServiceMock.statisticsSelectedMonth$ = of('2026-03');
        localStorageServiceMock.getStatisticsDisplayMode.and.resolveTo(
          DisplayMode.User,
        );
        localStorageServiceMock.statisticsDisplayMode$ = of(DisplayMode.User);

        users = [
          {
            userId: 'U-1',
            name: 'User 1',
            type: 'U' as const,
            isNative: false,
            createdAt: new Date('2026-03-10'),
          },
          {
            userId: 'U-2',
            name: 'User 2',
            type: 'U' as const,
            isNative: true,
            createdAt: new Date('2026-03-11'),
          },
          {
            userId: 'U-3',
            name: 'User 3',
            type: 'U' as const,
            isNative: false,
            createdAt: new Date('2026-03-22'),
          },
          {
            userId: 'P-1',
            name: 'Programmer Device 1',
            type: 'P' as const,
            isNative: true,
            createdAt: new Date('2026-03-12'),
          },
          {
            userId: 'P-2',
            name: 'Programmer Device 2',
            type: 'P' as const,
            isNative: true,
            createdAt: new Date('2026-03-13'),
          },
        ];

        userStats = [
          {
            userId: 'U-1',
            consumedFeatureCharCount: 1000,
            lastFeatureUsageDate: new Date('2026-03-10'),
          },
          {
            userId: 'U-2',
            consumedFeatureCharCount: 2000,
            lastFeatureUsageDate: new Date('2026-03-11'),
          },
          {
            userId: 'P-1',
            consumedFeatureCharCount: 3000,
            lastFeatureUsageDate: new Date('2026-03-12'),
          },
        ];

        programmerDeviceUIDs = [
          { userId: 'P-1', name: 'Programmer Device 1' },
          { userId: 'P-2', name: 'Programmer Device 2' },
        ];

        firestoreServiceMock.getAllUserFeatureUsageStatistics.and.resolveTo(
          userStats,
        );
        firestoreServiceMock.getUsers.and.resolveTo(users);
        firestoreServiceMock.getProgrammerDeviceUIDs.and.resolveTo(
          programmerDeviceUIDs,
        );
        Object.defineProperty(firestoreServiceMock, 'isProgrammerDevice', {
          get: () => true,
        });
      });

      it('should return user feature usage statistics', async () => {
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);
        const userFeatureUsageResult = result.userFeatureStatistics;

        expect(userFeatureUsageResult.length).toBe(3);

        const user1FeatureUsage = userFeatureUsageResult.find(
          (s) => s.userId === 'U-1',
        );
        const user2FeatureUsage = userFeatureUsageResult.find(
          (s) => s.userId === 'U-2',
        );
        const progDev1FeatureUsage = userFeatureUsageResult.find(
          (s) => s.userId === 'P-1',
        );
        expect(user1FeatureUsage).toEqual(
          jasmine.objectContaining({
            userId: 'U-1',
            consumedFeatureCharCount: 1000,
            lastFeatureUsageDate: new Date('2026-03-10'),
          }),
        );
        expect(user2FeatureUsage).toEqual(
          jasmine.objectContaining({
            userId: 'U-2',
            consumedFeatureCharCount: 2000,
            lastFeatureUsageDate: new Date('2026-03-11'),
          }),
        );
        expect(progDev1FeatureUsage).toEqual(
          jasmine.objectContaining({
            userId: 'P-1',
            consumedFeatureCharCount: 3000,
            lastFeatureUsageDate: new Date('2026-03-12'),
          }),
        );
      });

      it('should return user statistics', async () => {
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);
        const userStatsResult = result.displayedUserStatistics;

        expect(userStatsResult.length).toBe(3);

        const user1Stats = userStatsResult.find((s) => s.userId === 'U-1');
        const user2Stats = userStatsResult.find((s) => s.userId === 'U-2');
        const progDev1Stats = userStatsResult.find((s) => s.userId === 'P-1');

        expect(user1Stats).toEqual(
          jasmine.objectContaining({
            userId: 'U-1',
            userName: 'User 1',
            userType: 'U',
            isNative: false,
          }),
        );
        expect(user2Stats).toEqual(
          jasmine.objectContaining({
            userId: 'U-2',
            userName: 'User 2',
            userType: 'U',
            isNative: true,
          }),
        );
        expect(progDev1Stats).toEqual(
          jasmine.objectContaining({
            userId: 'P-1',
            userName: 'Programmer Device 1',
            userType: 'P',
            isNative: true,
          }),
        );
      });

      it('should return users', async () => {
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);
        const usersResult = result.users;

        expect(usersResult.length).toBe(5);

        const user1Users = usersResult.find((s) => s.userId === 'U-1');
        const user2Users = usersResult.find((s) => s.userId === 'U-2');
        const user3Users = usersResult.find((s) => s.userId === 'U-3');
        const progDev1Users = usersResult.find((s) => s.userId === 'P-1');
        const progDev2Users = usersResult.find((s) => s.userId === 'P-2');

        expect(user1Users).toEqual(
          jasmine.objectContaining({
            userId: 'U-1',
            name: 'User 1',
            type: 'U',
            isNative: false,
            createdAt: new Date('2026-03-10'),
          }),
        );
        expect(user2Users).toEqual(
          jasmine.objectContaining({
            userId: 'U-2',
            name: 'User 2',
            type: 'U',
            isNative: true,
            createdAt: new Date('2026-03-11'),
          }),
        );
        expect(user3Users).toEqual(
          jasmine.objectContaining({
            userId: 'U-3',
            name: 'User 3',
            type: 'U',
            isNative: false,
            createdAt: new Date('2026-03-22'),
          }),
        );
        expect(progDev1Users).toEqual(
          jasmine.objectContaining({
            userId: 'P-1',
            name: 'Programmer Device 1',
            type: 'P',
            isNative: true,
            createdAt: new Date('2026-03-12'),
          }),
        );
        expect(progDev2Users).toEqual(
          jasmine.objectContaining({
            userId: 'P-2',
            name: 'Programmer Device 2',
            type: 'P',
            isNative: true,
            createdAt: new Date('2026-03-13'),
          }),
        );
      });

      it('should return programmer devices if called from a programmer device', async () => {
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);
        const programmerDevicesResult = result.programmerDeviceUIDs;

        expect(programmerDevicesResult.length).toBe(2);

        const progDev1Users = programmerDevicesResult.find(
          (s) => s.userId === 'P-1',
        );
        const progDev2Users = programmerDevicesResult.find(
          (s) => s.userId === 'P-2',
        );

        expect(progDev1Users).toEqual(
          jasmine.objectContaining({
            userId: 'P-1',
            name: 'Programmer Device 1',
          }),
        );
        expect(progDev2Users).toEqual(
          jasmine.objectContaining({
            userId: 'P-2',
            name: 'Programmer Device 2',
          }),
        );
      });

      it('should return empty array if not called from a programmer device', async () => {
        Object.defineProperty(firestoreServiceMock, 'isProgrammerDevice', {
          get: () => false,
        });

        const isProgrammerDevice = false;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);
        const programmerDevicesResult = result.programmerDeviceUIDs;

        expect(programmerDevicesResult.length).toBe(0);

        const progDev1Users = programmerDevicesResult.find(
          (s) => s.userId === 'P-1',
        );
        const progDev2Users = programmerDevicesResult.find(
          (s) => s.userId === 'P-2',
        );

        expect(progDev1Users).toBeUndefined();
        expect(progDev2Users).toBeUndefined();
      });

      it('should add user with 0 char count to statistics if displaymode is programmer view', async () => {
        // Arrange: Set display mode to Programmer
        localStorageServiceMock.getStatisticsDisplayMode.and.resolveTo(
          DisplayMode.Programmer,
        );
        localStorageServiceMock.statisticsDisplayMode$ = of(
          DisplayMode.Programmer,
        );

        // Act
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);

        // Assert: All users (including those with 0 feature usage) should be included in displayedUserStatistics
        expect(result.displayedUserStatistics.length).toBe(
          5,
          'All 4 users should be included in programmer view',
        );
        // Specifically check that the user with 0 feature usage is present
        const userWithNoFeatureUsage = result.displayedUserStatistics.find(
          (u) => u.userId === 'P-2',
        );
        expect(userWithNoFeatureUsage).toBeDefined(
          'User with 0 char count should be included in programmer view',
        );
      });

      it('should not add user with 0 char count to statistics if displaymode is user view', async () => {
        // Act
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);

        // Assert: Only users with feature usage should be included in displayedUserStatistics
        expect(result.displayedUserStatistics.length).toBe(
          3,
          'Only users with feature usage should be included in user view',
        );
        // Specifically check that the user with 0 feature usage is NOT present
        const userWithNoFeatureUsage = result.displayedUserStatistics.find(
          (u) => u.userId === 'P-2',
        );
        expect(userWithNoFeatureUsage).toBeUndefined(
          'User with 0 feature usage should NOT be included in user view',
        );
      });

      it('should sort displayedUserStatistics by last feature usage date descending or creation date descending if feature usage date is not available', async () => {
        localStorageServiceMock.getStatisticsDisplayMode.and.resolveTo(
          DisplayMode.Programmer,
        );
        localStorageServiceMock.statisticsDisplayMode$ = of(
          DisplayMode.Programmer,
        );

        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);
        const userStatsResult = result.displayedUserStatistics;

        expect(userStatsResult.length).toBe(5);
        const expectedOrder = ['P-1', 'U-2', 'U-1', 'U-3', 'P-2'];
        const actualOrder = userStatsResult.map((u) => u.userId);
        expect(actualOrder).toEqual(
          expectedOrder,
          'Users should be sorted by last feature usage date desc, or creation date desc if feature usage date is not available',
        );
      });

      it('should not include users in displayedUserStatistics if they are absent from the users list', async () => {
        // Arrange: Create a user feature usage statistic for a user that is not in the users list
        const extraUserStat: UserFeatureUsageStatistics = {
          userId: 'U-999',
          consumedFeatureCharCount: 500,
          lastFeatureUsageDate: new Date('2026-03-15'),
        };
        const userStatsWithExtra = [...userStats, extraUserStat];
        firestoreServiceMock.getAllUserFeatureUsageStatistics.and.resolveTo(
          userStatsWithExtra,
        );

        // Act
        const isProgrammerDevice = true;
        const result: StatisticsData =
          await service.getDisplayedUserStatistics(isProgrammerDevice);

        // Assert: Users not in the users list should be excluded from displayedUserStatistics
        const excludedUser = result.displayedUserStatistics.find(
          (u) => u.userId === 'U-999',
        );
        expect(excludedUser).toBeUndefined(
          'Users not in the users list should be excluded from displayedUserStatistics',
        );
      });
    });
  });

  describe('getUserStatisticsSummary', () => {
    let statisticsData: DisplayedUserStatistics[] = [];

    function addStatisticsData(
      userId: string,
      device: string,
      displayedModel: string,
      isNative: boolean,
      platform: string,
      consumedFeatureCharCount: number,
      lastFeatureUsageDate: Date | null,
    ) {
      const createdAt = new Date('2026-03-10');
      const lastUpdated = new Date('2026-03-15');

      statisticsData.push({
        userId,
        userName: 'User Name for ' + userId,
        userType: userId.startsWith('P') ? 'P' : 'U',
        userCreatedAt: createdAt,
        userLastUpdated: lastUpdated,
        device,
        isNative,
        deviceInfo: {
          userAgent: 'User Agent',
          platform: platform,
          language: 'de',
          appVersion: {
            major: 1,
            minor: 0,
            date: '2026-03-01',
          },
        },
        displayedPlatform: platform,
        displayedModel,
        consumedFeatureCharCount: consumedFeatureCharCount,
        lastFeatureUsageDate:
          consumedFeatureCharCount > 0 ? lastFeatureUsageDate : null,
      });
    }

    function createStatisticsData(): DisplayedUserStatistics[] {
      statisticsData = [];
      addStatisticsData(
        'U-1',
        'Device 1',
        'Model 1',
        false,
        'web-desktop',
        1000,
        new Date('2026-03-15'),
      );
      addStatisticsData(
        'U-2',
        'Device 1',
        'Model 1',
        false,
        'web-mobile',
        2000,
        new Date('2026-03-13'),
      );
      addStatisticsData(
        'U-4',
        'Device 3',
        'Model 3',
        false,
        'web-mobile',
        0,
        null,
      );
      addStatisticsData(
        'P-1',
        'Device 4',
        'Model 4',
        true,
        'native',
        3000,
        new Date('2026-03-17'),
      );
      addStatisticsData(
        'P-1',
        'Device 4',
        '',
        true,
        'native',
        1000,
        new Date('2026-03-15'),
      );
      addStatisticsData(
        'P-2',
        'Device 4',
        'Model 4',
        true,
        'web-desktop',
        0,
        null,
      );
      return statisticsData;
    }

    beforeEach(() => {
      statisticsData = createStatisticsData();
    });

    it('should return summary records for user type', () => {
      // Act
      const result = service.getUserStatisticsSummary(statisticsData);

      // Filter for userType summary rows
      const userTypeRows = result.filter(
        (s) => s.category === StatisticsSummaryCategory.UserType,
      );
      expect(userTypeRows.length).toBe(2);
      const userRow = userTypeRows.find(
        (r) => r.name === StatisticsSummaryName.User,
      );
      const programmerRow = userTypeRows.find(
        (r) => r.name === StatisticsSummaryName.Programmer,
      );
      // Assert
      expect(userRow)
        .withContext('user type User')
        .toEqual(
          jasmine.objectContaining({
            name: StatisticsSummaryName.User,
            countFeatureUsage: 2,
            countRegistrations: 1,
          }),
        );
      expect(programmerRow)
        .withContext('user type Programmer')
        .toEqual(
          jasmine.objectContaining({
            name: StatisticsSummaryName.Programmer,
            countFeatureUsage: 2,
            countRegistrations: 1,
          }),
        );
    });

    it('should return summary records for platform', () => {
      // Act
      const result = service.getUserStatisticsSummary(statisticsData);

      // Filter for platform summary rows
      const platformRows = result.filter(
        (s) => s.category === StatisticsSummaryCategory.Platform,
      );
      expect(platformRows.length)
        .withContext('platform summary length')
        .toBe(3);
      const nativeRow = platformRows.find(
        (r) => r.name === StatisticsSummaryName.Native,
      );
      const webMobileRow = platformRows.find(
        (r) => r.name === StatisticsSummaryName.WebMobile,
      );
      const webDesktopRow = platformRows.find(
        (r) => r.name === StatisticsSummaryName.WebDesktop,
      );
      // Assert
      expect(nativeRow)
        .withContext('platform Native')
        .toEqual(
          jasmine.objectContaining({
            name: StatisticsSummaryName.Native,
            countFeatureUsage: 2,
            countRegistrations: 0,
          }),
        );
      expect(webMobileRow)
        .withContext('platform WebMobile')
        .toEqual(
          jasmine.objectContaining({
            name: StatisticsSummaryName.WebMobile,
            countFeatureUsage: 1,
            countRegistrations: 1,
          }),
        );
      expect(webDesktopRow)
        .withContext('platform WebDesktop')
        .toEqual(
          jasmine.objectContaining({
            name: StatisticsSummaryName.WebDesktop,
            countFeatureUsage: 1,
            countRegistrations: 1,
          }),
        );
    });

    it('should return summary records for model', () => {
      // Act
      const result = service.getUserStatisticsSummary(statisticsData);

      // Filter for model summary rows
      const modelRows = result.filter(
        (s) => s.category === StatisticsSummaryCategory.Model,
      );
      expect(modelRows.length).toBe(3);

      // Assert
      const model1Row = modelRows.find((r) => r.name === 'Model 1');
      const model3Row = modelRows.find((r) => r.name === 'Model 3');
      const model4Row = modelRows.find((r) => r.name === 'Model 4');

      expect(model1Row)
        .withContext('model Model 1')
        .toEqual(
          jasmine.objectContaining({
            name: 'Model 1',
            countFeatureUsage: 2,
            countRegistrations: 0,
          }),
          'model Model 1',
        );
      expect(model3Row)
        .withContext('model Model 3')
        .toEqual(
          jasmine.objectContaining({
            name: 'Model 3',
            countFeatureUsage: 0,
            countRegistrations: 1,
          }),
        );
      expect(model4Row)
        .withContext('model Model 4')
        .toEqual(
          jasmine.objectContaining({
            name: 'Model 4',
            countFeatureUsage: 1,
            countRegistrations: 1,
          }),
        );
    });

    it('should order the summary records correctly', () => {
      const result = service.getUserStatisticsSummary(statisticsData);

      const expectedOrder = [
        // UserType
        StatisticsSummaryName.Programmer,
        StatisticsSummaryName.User,
        // Platform
        StatisticsSummaryName.Native,
        StatisticsSummaryName.WebMobile,
        StatisticsSummaryName.WebDesktop,
        // Model
        'Model 1',
        'Model 3',
        'Model 4',
      ];

      const actualOrder = result.map((s) => s.name);

      expect(actualOrder)
        .withContext('Summary records order')
        .toEqual(expectedOrder);
    });
  });
});
