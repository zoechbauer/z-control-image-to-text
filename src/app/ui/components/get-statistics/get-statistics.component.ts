import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import {
  IonGrid,
  IonCol,
  IonRow,
  IonIcon,
  IonButton,
  IonRadio,
  IonRadioGroup,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
} from '@ionic/angular/standalone';
import {
  NgFor,
  NgIf,
  NgTemplateOutlet,
  DecimalPipe,
  JsonPipe,
} from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { LogoComponent } from '../logo/logo.component';
import { AllMonthsOption, DisplayMode, LogoType } from '@app/shared/enums';
import { FirebaseFirestoreService } from '@app/services/firebase-firestore.service';
import { environment } from '@env/environment';
import {
  DisplayedUserStatistics,
  StatisticsData,
  UserStatisticsSummary,
  DisplayedUserStatisticsRow,
  ContingentData,
} from '@app/shared/firebase-firestore.interfaces';
import { UtilsService } from '@app/services/utils.service';
import { LocalStorageService } from '@app/services/local-storage.service';
import { FirebaseFirestoreUtilsService } from '@app/services/firebase-firestore-utils.service';
import { SpinnerComponent } from '../spinner/spinner.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-get-statistics',

  templateUrl: './get-statistics.component.html',
  styleUrls: ['./get-statistics.component.scss'],
  standalone: true,
  imports: [
    IonSearchbar,
    IonButton,
    IonRow,
    IonCol,
    NgIf,
    NgFor,
    JsonPipe,
    NgTemplateOutlet,
    DecimalPipe,
    TranslateModule,
    IonGrid,
    IonIcon,
    IonRadioGroup,
    IonRadio,
    IonSelect,
    IonSelectOption,
    LogoComponent,
    SpinnerComponent,
    FormsModule,
  ],
})
export class GetStatisticsComponent implements OnInit, OnDestroy {
  private readonly translate = inject(TranslateService);
  private readonly firestoreService = inject(FirebaseFirestoreService);
  private readonly firestoreUtilsService = inject(FirebaseFirestoreUtilsService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly utilsService = inject(UtilsService);

  @Input() lang!: string;

  LogoType = LogoType;
  DisplayMode = DisplayMode;
  displayMode: DisplayMode = DisplayMode.User;
  selectedDisplayMode: DisplayMode = DisplayMode.User;
  currentUserUid: string | null = null;
  isProgrammerDevice: boolean = false;
  filterSelectedMonth: string = '';
  selectedMonthForStatisticsSections: string = '';
  allFilterMonthValues: string[] = [];
  searchTerm: string = '';
  platformFilter: 'all' | 'web' | 'native' = 'all';
  onlyExceeded = false;
  showRawDebugDetails = false;
  showDisplayedValuesDetail = false;
  showTranslationStatisticsDetail = false;
  showUserMappingDetail = false;
  showProgrammerDevicesDetail = false;

  // Statistics data
  isLoading = true;
  contingentData: ContingentData | null = null;
  isStopped = false;
  totalCharCount = 0;
  allUsersCharCount = 0;
  totalLimit = 0;
  totalBuffer = 0;
  totalRemaining = 0;
  userLimit = 0;
  userStatisticsSummaryData: UserStatisticsSummary[] = [];
  filteredUserStatsRows: DisplayedUserStatisticsRow[] = [];
  private allUserStatsRows: DisplayedUserStatisticsRow[] = [];
  private readonly subscriptions: Subscription[] = [];
  private _statisticsData: StatisticsData | null = null;
  private isPortrait = true;

  /**
   * Gets the statistics data.
   * @returns The current statistics data or null if not available.
   */
  get statisticsData(): StatisticsData | null {
    return this._statisticsData;
  }

  /**
   * Sets the statistics data and updates the displayed user statistics rows accordingly.
   * @param value The new statistics data or null if not available.
   */
  set statisticsData(value: StatisticsData | null) {
    this._statisticsData = value;
    this.allUserStatsRows = (value?.displayedUserStatistics ?? []).map(
      (userStat) => ({
        ...userStat,
        formattedLastActivityDate: this.getFormatDateTime(
          userStat.lastFeatureUsageDate ?? userStat.userCreatedAt,
        ),
        isCurrentUser: this.isCurrentUser(userStat.userId),
      }),
    );
    this.applyUserStatsFilter();
  }

  /**
   * Gets a value indicating whether the column should be hidden based on the current orientation.
   * @returns True if the column should be hidden, false otherwise.
   */
  get hideColumn(): boolean {
    return this.isPortrait;
  }

  /**
   * Gets a value indicating whether the column should be hidden based on the current orientation
   * or if the display mode is set to user.
   * @returns True if the column should be hidden, false otherwise.
   */
  get hideColumnIfUserOrPortrait(): boolean {
    return this.isPortrait || this.displayMode === DisplayMode.User;
  }

  /**
   * Gets a value indicating whether the application is running in a native environment.
   * @returns True if the application is running natively, false otherwise.
   */
  get isNative(): boolean {
    return this.utilsService.isNative;
  }

  /**
   * Gets a value indicating whether the application is running in a Firebase emulator environment.
   * @returns True if the application is running in a Firebase emulator, false otherwise.
   */
  get isFirebaseEmulator(): boolean {
    return environment.app.useFirebaseEmulator;
  }

  /**
   * Gets a value indicating whether all months are selected in the filter.
   * @returns True if all months are selected, false otherwise.
   */
  get isAllMonthsSelected(): boolean {
    return this.filterSelectedMonth === AllMonthsOption.SelectOptionValue;
  }

  /**
   * Sets up the component by initializing subscriptions, event listeners, and other necessary data.
   */
  ngOnInit(): void {
    this.setupSubscriptions();
    this.setupEventListeners();
    void this.init();
  }

  private setupSubscriptions(): void {
    this.subscriptions.push(
      this.firestoreUtilsService.statisticsRefresh$.subscribe(async () => {
        // Only reload if not currently loading
        if (!this.isLoading) {
          await this.init();
        }
      }),
      this.firestoreService.programmerDeviceRefresh$.subscribe(() => {
        // Update isProgrammerDevice without triggering full reload
        const newValue = this.firestoreService.isProgrammerDevice;
        if (this.isProgrammerDevice !== newValue) {
          this.isProgrammerDevice = newValue;
        }
      }),
    );
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.isPortrait = this.utilsService.isPortrait;
    });

    window.addEventListener('orientationchange', () => {
      this.isPortrait = this.utilsService.isPortrait;
    });
  }

  /**
   * Initializes the component by setting up necessary data and state.
   */
  async init() {
    this.isLoading = true;
    this.searchTerm = '';
    this.isPortrait = this.utilsService.isPortrait;
    this.isProgrammerDevice = this.firestoreService.isProgrammerDevice;
    await this.setFilterValues();

    try {
      this.currentUserUid = await this.localStorageService.loadFirestoreUid();

      // Read control flags
      this.contingentData =
        await this.firestoreService.readFeatureContingentData(
          this.filterSelectedMonth,
        );
      this.isStopped = !!this.contingentData.StopFeatureUsageForAllUsers;

      // Total contingent
      this.totalLimit =
        this.contingentData.maxFreeFeatureCharsPerMonth ??
        environment.app.maxFreeFeatureCharsPerMonth;
      this.totalBuffer =
        this.contingentData.maxFreeFeatureCharsBufferPerMonth ??
        environment.app.maxFreeFeatureCharsBufferPerMonth;
      this.totalCharCount = await this.firestoreService.getTotalCharCount(
        this.filterSelectedMonth,
      );
      this.totalRemaining = Math.max(
        0,
        this.totalLimit - this.totalBuffer - this.totalCharCount,
      );

      // User contingent
      this.userLimit =
        this.contingentData.maxFreeFeatureCharsPerMonthForUser ??
        environment.app.maxFreeFeatureCharsPerMonthForUser;

      // user statistics and info
      this.statisticsData =
        await this.firestoreUtilsService.getDisplayedUserStatistics(
          this.isProgrammerDevice,
        );
      this.userStatisticsSummaryData =
        this.firestoreUtilsService.getUserStatisticsSummary(
          this.statisticsData?.displayedUserStatistics ?? [],
        );

      // Calculate the sum of all users' consumed feature characters
      this.allUsersCharCount =
        this.statisticsData?.displayedUserStatistics.reduce(
          (sum, userStat) => sum + userStat.consumedFeatureCharCount,
          0,
        ) ?? 0;
    } catch (error) {
      console.error('GetStatisticsComponent: Error loading statistics', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Handles changes to the search term input by updating the search term and applying the filter.
   * @param value The new search term value.
   */
  onSearchTermChange(value: string | null | undefined): void {
    this.searchTerm = value ?? '';
    this.applyUserStatsFilter();
  }

  /**
   * Tracks user statistics rows by their unique user ID.
   * @param index The index of the row in the list.
   * @param userStat The user statistics row.
   * @returns The unique user ID for the row.
   */
  trackByUserId(index: number, userStat: DisplayedUserStatisticsRow): string {
    return userStat.userId;
  }

  /**
   * Sets the filteredUserStatsRows with the rows filtered by the current search term.
   *
   * Supported filter modes:
   * - Text search (default): matches `userName` or `displayedPlatform` (case-insensitive).
   * - Consumed Feature character count:
   *   - `>123` => rows with `consumedFeatureCharCount > 123`
   *   - `<10`  => rows with `consumedFeatureCharCount < 10`
   *
   * Notes:
   * - Optional spaces after operators are supported (for example `> 123`).
   * - If the search term is empty, all rows are returned unchanged.
   */
  private applyUserStatsFilter(): void {
    const rows = this.allUserStatsRows;
    const term = (this.searchTerm ?? '').trim();

    if (!term) {
      this.filteredUserStatsRows = rows;
      return;
    }

    // Consumed Feature character count filters: >123 or <10
    const charMatch = /^([<>])\s*(\d+)$/.exec(term);
    if (charMatch) {
      const operator = charMatch[1];
      const value = Number(charMatch[2]);

      this.filteredUserStatsRows = rows.filter((u) =>
        operator === '>'
          ? u.consumedFeatureCharCount > value
          : u.consumedFeatureCharCount < value,
      );
      return;
    }

    // Default text filter on userName, displayedPlatform, or displayedModel
    const lower = term.toLowerCase();
    this.filteredUserStatsRows = rows.filter(
      (u) =>
        u.userName.toLowerCase().includes(lower) ||
        (u.displayedPlatform ?? '').toLowerCase().includes(lower) ||
        (u.displayedModel ?? '').toLowerCase().includes(lower),
    );
  }

  /**
   * Gets the section header text for the given translation key, including the selected month.
   * @param translationKey The translation key for the section header.
   * @returns The formatted section header text.
   */
  getSectionHeader(translationKey: string): string {
    let selectedMonth: string;

    if (this.isAllMonthsSelected) {
      selectedMonth = this.translate.instant(AllMonthsOption.SelectOptionValue);
    } else {
      selectedMonth = this.translate.instant(
        this.selectedMonthForStatisticsSections,
      );
    }

    return `${this.translate.instant(translationKey)}: ${selectedMonth}`;
  }

  private async setFilterValues(): Promise<void> {
    this.displayMode =
      await this.localStorageService.getStatisticsDisplayMode();
    this.selectedDisplayMode = this.displayMode;

    this.allFilterMonthValues =
      this.utilsService.getAllFirestoreSearchStringsForMonth();
    this.filterSelectedMonth =
      await this.localStorageService.getStatisticsSelectedMonth(
        AllMonthsOption.SelectOptionValue,
        this.isProgrammerDevice,
      );
    this.selectedMonthForStatisticsSections = this.filterSelectedMonth;
  }

  /**
   * Handles the event when the user applies the filter settings.
   * Stores the selected month and display mode in local storage and triggers a data reload.
   */
  async onFilterData(): Promise<void> {
    this.selectedMonthForStatisticsSections = this.filterSelectedMonth;
    this.displayMode = this.selectedDisplayMode;

    // Store selected month in local storage
    await this.localStorageService
      .saveStatisticsSelectedMonth(this.filterSelectedMonth)
      .catch((error) => {
        console.error('Error saving selected month to local storage:', error);
      });
    // Store display mode in local storage
    await this.localStorageService
      .saveStatisticsDisplayMode(this.displayMode)
      .catch((error) => {
        console.error('Error saving display mode to local storage:', error);
      });
    // Trigger data reload with current filters
    await this.init();
  }

  /**
   * Checks if the given user ID corresponds to the current user.
   * @param userId The user ID to check.
   * @returns True if the user ID matches the current user's ID, false otherwise.
   */
  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserUid;
  }

  /**
   * Shows detailed information for the specified user statistics.
   * @param lang The language to use for displaying the details.
   * @param userStatistic The user statistics to display in detail.
   */
  async showDetailInfos(
    lang: string,
    userStatistic: DisplayedUserStatistics,
  ): Promise<void> {
    await this.utilsService.openUserDetail(lang, userStatistic, this.displayMode);
  }

  /**
   * Formats the given date and time according to the current display mode.
   * @param dateTime The date and time to format.
   * @returns The formatted date and time string.
   */
  getFormatDateTime(dateTime: Date | null): string {
    if (this.displayMode === DisplayMode.Programmer) {
      return this.utilsService.formatDateTimeISO(dateTime);
    }

    return this.utilsService.formatDateISO(dateTime);
  }

  /**
   * Cleans up resources and unsubscribes from all subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
