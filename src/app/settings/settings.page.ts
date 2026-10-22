import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { IonContent, IonicModule } from '@ionic/angular';
import { NgIf } from '@angular/common';

import { environment } from '@env/environment';
import { LogoType, Tab } from '../shared/enums';
import { FireStoreConstants } from '../shared/app.constants';
import { LocalStorageService } from '../services/local-storage.service';
import { UtilsService } from '../services/utils.service';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils.service';
import { HeaderComponent } from '../ui/components/header/header.component';
import { LanguageAccordionComponent } from '../ui/components/accordions/language-accordion.component';
import { FeedbackAccordionComponent } from '../ui/components/accordions/feedback-accordion.component';
import { ChangeLogAccordionComponent } from '../ui/components/accordions/change-log-accordion.component';
import { GetSourceAccordionComponent } from '../ui/components/accordions/get-source-accordion.component';
import { PrivacyPolicyAccordionComponent } from '../ui/components/accordions/privacy-policy-accordion.component';
import { GetMobileAppAccordionComponent } from '../ui/components/accordions/get-mobile-app-accordion.component';
import { GetStatisticsAccordionComponent } from '../ui/components/accordions/get-statistics-accordion.component';
import { SpinnerComponent } from '../ui/components/spinner/spinner.component';

// Single source of truth for settings accordion IDs.
// Add new accordion IDs here when extending the settings page.
const ACCORDION_VALUES = [
  'language',
  'z-control',
  'get-statistics',
  'privacy-policy',
  'change-log',
  'get-mobile-app',
  'get-source',
] as const;

type AccordionValue = (typeof ACCORDION_VALUES)[number];

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  imports: [
    NgIf,
    IonicModule,
    TranslatePipe,
    HeaderComponent,
    LanguageAccordionComponent,
    FeedbackAccordionComponent,
    ChangeLogAccordionComponent,
    GetSourceAccordionComponent,
    PrivacyPolicyAccordionComponent,
    GetMobileAppAccordionComponent,
    GetStatisticsAccordionComponent,
    SpinnerComponent,
  ],
})
export class SettingsPage implements OnInit, OnDestroy {
  translate = inject(TranslateService);
  readonly localStorage = inject(LocalStorageService);
  readonly utilsService = inject(UtilsService);
  private readonly firestoreUtilsService = inject(FirebaseFirestoreUtilsService);

  private readonly validAccordionValues = new Set<AccordionValue>(
    ACCORDION_VALUES,
  );
  openAccordion: AccordionValue | null = null;
  showAllAccordions = true;
  selectedLanguage!: string;
  selectedLanguageName?: string;
  LogoType = LogoType;
  Tab = Tab;
  currentYearMonth: string = FireStoreConstants.currentYearMonthPath();
  isLoading = true;
  private readonly subscriptions: Subscription[] = [];

  /**
   * Returns the application name from the environment configuration.
   */
  get appName(): string {
    return environment.app.name;
  }

  /**
   * Returns the version information of the application.
   */
  get versionInfo() {
    const { major, minor, date } = {
      major: environment.version.major,
      minor: environment.version.minor,
      date: environment.version.date,
    };
    return `${major}.${minor} (${date})`;
  }

  /**
   * Returns whether the application is running in a native environment.
   */
  get isNative(): boolean {
    return this.utilsService.isNative;
  }

/**
 * Lifecycle hook that is called after the component has been initialized.
 */
  ngOnInit() {
    this.isLoading = true;
    this.showAllAccordions = true;
    this.setupSubscriptions();
    this.utilsService.showOrHideIonTabBar();
    this.setupEventListeners();
  }

  private setupSubscriptions() {
    this.subscriptions.push(
      this.localStorage.selectedLanguage$.subscribe(lang => {
        this.translate.use(lang);
        this.translate.setDefaultLang(lang);
        this.selectedLanguage = lang;
        this.isLoading = false;
      }),
      this.utilsService.logoClicked$.subscribe(() => {
        this.openFeedbackAccordion();
      }),
    );
  }

  private openFeedbackAccordion() {
    this.openAccordion = null;
    this.openAccordion = 'z-control';
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.utilsService.showOrHideIonTabBar();
    });
  }

  /**
   * Handles the change event for the accordion group.
   * @param event The custom event emitted by the accordion group.
   * @param content The IonContent associated with the accordion group.
   */
  onAccordionGroupChange(event: CustomEvent, content: IonContent) {
    const value = this.normalizeAccordionValue(event?.detail?.value);

    // Ignore bubbled value-change events from nested controls (e.g. radio groups).
    if (value === undefined) {
      return;
    }

    // refresh statistic on open to update data on month change
    // we need to do this before setting the openAccordion value,
    // because the accordion content gets destroyed on close and recreated on open - 
    // so we need to update the data before that happens
    if (value === 'get-statistics') {
      this.firestoreUtilsService.requestStatisticsRefresh();
    }

    this.openAccordion = value;
    this.showAllAccordions = this.openAccordion == null;
  }

  /**
   * Normalizes the raw value emitted by the accordion group.
   * @param rawValue The raw value emitted by the accordion group.
   * @returns The normalized accordion value, or null if the accordion is closed, or undefined if the value is invalid.
   */
  private normalizeAccordionValue(
    rawValue: unknown,
  ): AccordionValue | null | undefined {
    // Header toggle close can emit undefined, null, or empty string.
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return null;
    }

    if (
      typeof rawValue === 'string' &&
      this.validAccordionValues.has(rawValue as AccordionValue)
    ) {
      return rawValue as AccordionValue;
    }

    return undefined;
  }

  /**
   * Handles the change event for the language selection.
   * @param event The custom event emitted by the language selection control.
   */
  async onLanguageChange(event: any) {
    const lang = event.detail?.value;
    if (lang) {
      await this.localStorage.saveSelectedLanguage(lang);
      this.translate.use(lang);
      this.translate.setDefaultLang(lang);
    }
  }

  /**
   * Expands all accordion sections.
   */
  showAll() {
    this.openAccordion = null;
    this.showAllAccordions = true;
  }

  /**
   * Opens the changelog modal.
   */
  async openChangelog() {
    await this.utilsService.openChangelog();
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
