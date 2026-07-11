import { Injectable, inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

import { AllMonthsOption, DisplayMode } from '../shared/enums';
import { UtilsService } from './utils.service';
import { AppConstants } from '../shared/app.constants';

enum LocalStorage {
  SelectedLanguage = 'selectedLanguage',
  StatisticsDisplayMode = 'statisticsDisplayMode',
  StatisticsSelectedMonth = 'statisticsSelectedMonth',
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly storage = inject(Storage);
  private readonly utilsService = inject(UtilsService);

  /**
   * Emits the firestore UID of the user (e.g. anonymous user).
   */
  firestoreUidSubject = new BehaviorSubject<string | null>(null);
  /**
   * Observable for the firestore UID.
   */
  firestoreUid$ = this.firestoreUidSubject.asObservable();
  /**
   * Emits the currently selected base language code (e.g. 'en', 'de').
   */
  selectedLanguageSubject = new BehaviorSubject<string>(
    this.getMobileDefaultLanguage(),
  );
  /**
   * Observable for the currently selected base language code.
   */
  selectedLanguage$ = this.selectedLanguageSubject.asObservable();
  /**
   * Emits the name of the currently selected base language (e.g. 'English', 'Deutsch').
   */
  selectedLanguageNameSubject = new BehaviorSubject<string>(
    this.getMobileDefaultLanguage(),
  );

  /**
   * Emits the current display mode for statistics (User or Programmer).
   */
  statisticsDisplayModeSubject = new BehaviorSubject<DisplayMode>(
    DisplayMode.User,
  );
  /**
   * Observable for the current display mode for statistics.
   */
  statisticsDisplayMode$ = this.statisticsDisplayModeSubject.asObservable();

  /**
   * Emits the currently selected month for statistics filtering.
   */
  statisticsSelectedMonthSubject = new BehaviorSubject<string>('');
  /**
   * Observable for the currently selected month for statistics filtering.
   */
  statisticsSelectedMonth$ = this.statisticsSelectedMonthSubject.asObservable();

  private async initStorage() {
    await this.storage.create();
  }

  /**
   * Initializes the storage service and loads necessary data.
   * @param translate The TranslateService instance
   */
  async initializeServicesAsync(
    translate: import('@ngx-translate/core').TranslateService,
  ): Promise<void> {
    try {
      await this.initStorage();
      await this.loadSelectedOrDefaultLanguage();
      await this.loadFirestoreUid();
    } catch (error) {
      console.error('App initialization failed:', error);
      await this.initializeWithDefaults(translate);
    }
  }

  /**
   * Fallback: sets default language to 'en' in TranslateService
   */
  private async initializeWithDefaults(
    translate: import('@ngx-translate/core').TranslateService,
  ): Promise<void> {
    try {
      translate.setDefaultLang('en');
      translate.use('en');
    } catch (fallbackError) {
      console.error('Critical: Even defaults failed:', fallbackError);
    }
  }

  /**
   * Loads the selected language from storage, or sets and returns the default language if not found.
   * Updates the selectedLanguageSubject accordingly.
   * @returns The selected or default language code
   */
  async loadSelectedOrDefaultLanguage(): Promise<string> {
    const selectedLanguage = await this.storage.get(
      LocalStorage.SelectedLanguage,
    );

    if (selectedLanguage) {
      this.selectedLanguageSubject.next(selectedLanguage);
      return selectedLanguage;
    } else {
      const lang = this.getMobileDefaultLanguage();
      await this.saveSelectedLanguage(lang);
      this.selectedLanguageSubject.next(lang);
      return lang;
    }
  }

  /**
   * Saves the selected language to storage and updates the observable.
   * @param language The language code to save
   */
  async saveSelectedLanguage(language: string) {
    if (!language) {
      throw new Error('Language must be provided');
    }
    try {
      await this.storage.set(LocalStorage.SelectedLanguage, language);
      this.selectedLanguageSubject.next(language);
    } catch (error) {
      console.error('Error saving selected language:', error);
    }
  }

  /**
   * Determines the default language for the mobile device.
   * @returns The default language code ('de' or 'en')
   */
  private getMobileDefaultLanguage(): string {
    const lang = navigator.language.split('-')[0]; // e.g. "de-DE" -> "de"
    return /(de|en)/gi.test(lang) ? lang : 'en';
  }

  /**
   * Loads the firestore UID from storage and updates the observable.
   * @returns The stored firestore UID or null if not found
   */
  async loadFirestoreUid(): Promise<string | null> {
    const firestoreUid = await this.storage.get(AppConstants.currentUser);
    if (firestoreUid) {
      this.firestoreUidSubject.next(firestoreUid);
      return firestoreUid;
    }
    return null;
  }

  /**
   * Saves the firestore UID to storage.
   * @param uid The firestore UID to save
   */
  async saveFirestoreUid(uid: string): Promise<void> {
    try {
      await this.storage.set(AppConstants.currentUser, uid);
    } catch (error) {
      console.error('Error saving current user UID:', error);
    }
  }

  /**
   * Loads the statistics display mode from storage and updates the observable.
   * @returns The stored display mode or User mode as default
   */
  async getStatisticsDisplayMode(): Promise<DisplayMode> {
    let displayMode: DisplayMode;
    const rawValue = await this.storage.get(LocalStorage.StatisticsDisplayMode);

    if (rawValue && Object.values(DisplayMode).includes(rawValue)) {
      displayMode = rawValue as DisplayMode;
    } else {
      displayMode = DisplayMode.User;
    }

    this.statisticsDisplayModeSubject.next(displayMode);
    return displayMode;
  }

  /**
   * Saves the selected display mode for statistics in local storage.
   * @param displayMode User or Programmer display mode to save in local storage
   */
  async saveStatisticsDisplayMode(displayMode: DisplayMode): Promise<void> {
    try {
      await this.storage.set(LocalStorage.StatisticsDisplayMode, displayMode);
      this.statisticsDisplayModeSubject.next(displayMode);
    } catch (error) {
      console.error('Error saving statistics display mode:', error);
    }
  }

  /**
   * Resolves the effective month filter used by the statistics view.
   *
   * Behavior:
   * - If no value exists in storage, the current month is used and persisted.
   * - If a valid month string (YYYY-MM) exists:
   *   - On non-programmer devices, past months are automatically replaced with the current month and persisted.
   *   - On programmer devices, the stored month is kept (including past months).
   * - If the stored value is not in YYYY-MM format, the method falls back to the provided
   *   all-months format and persists it via saveStatisticsSelectedMonth.
   *
   * Notes:
   * - Month comparison is done lexicographically on YYYY-MM values.
   * - Persistence is normalized through saveStatisticsSelectedMonth.
   *
   * @param allMonthsOptionFormat Value to return when the stored month is invalid
   * (for example, select-label value or storage value for all months).
   * @param isProgrammerDevice Whether past month selections are allowed without auto-reset.
   * @returns Resolved month filter value for statistics.
   */
  async getStatisticsSelectedMonth(
    allMonthsOptionFormat: AllMonthsOption,
    isProgrammerDevice = false,
  ): Promise<string> {
    let selectedMonth: string;
    const rawValue: string = await this.storage.get(
      LocalStorage.StatisticsSelectedMonth,
    );
    const currentMonth = this.utilsService.getCurrentMonth();

    if (rawValue === currentMonth) {
      this.statisticsSelectedMonthSubject.next(currentMonth);
      return currentMonth;
    }

    // no value in storage → set current month
    if (!rawValue) {
      selectedMonth = currentMonth;
      await this.saveStatisticsSelectedMonth(selectedMonth);
      return selectedMonth;
    }

    // value in storage has correct format → check if it is the previous month and update if necessary
    if (rawValue.length === 7) {
      if (rawValue < currentMonth && !isProgrammerDevice) {
        selectedMonth = currentMonth;
        await this.saveStatisticsSelectedMonth(selectedMonth);
      } else {
        selectedMonth = rawValue;
        await this.saveStatisticsSelectedMonth(selectedMonth);
      }

      return selectedMonth;
    }

    // value in storage has wrong format → set to all
    selectedMonth = allMonthsOptionFormat;
    await this.saveStatisticsSelectedMonth(selectedMonth);
    return selectedMonth;
  }

  /**
   * Saves the selected month for statistics in local storage.
   * If selectedMonth has not YYYY-MM format then it is converted into Local storage value for all.
   * @param selectedMonth The month object to save in local storage
   */
  async saveStatisticsSelectedMonth(selectedMonth: string): Promise<void> {
    try {
      const convertedSelectedMonth =
        selectedMonth.length === 7
          ? selectedMonth
          : AllMonthsOption.localStorageValue;
      await this.storage.set(
        LocalStorage.StatisticsSelectedMonth,
        convertedSelectedMonth,
      );
      this.statisticsSelectedMonthSubject.next(convertedSelectedMonth);
    } catch (error) {
      console.error('Error saving statistics selected month:', error);
    }
  }
}
