import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonAccordion,
  IonAccordionGroup,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { HeaderComponent } from '../ui/components/header/header.component';
import { UtilsService } from '../services/utils.service';
import { LocalStorageService } from '../services/local-storage.service';
import { Tab } from '../shared/enums';
import { UserStatisticComponent } from '../ui/components/user-statistic/user-statistic.component';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils.service';
import { FeatureComponent } from '../feature/feature.component';
import { environment } from '@env/environment';

@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
  standalone: true,
  imports: [
    IonAccordionGroup,
    IonAccordion,
    IonContent,
    IonItem,
    IonLabel,
    FormsModule,
    TranslatePipe,
    HeaderComponent,
    UserStatisticComponent,
    FeatureComponent,
  ],
})
export class MainPage implements OnInit, OnDestroy {
  translate = inject(TranslateService);
  localStorage = inject(LocalStorageService);
  readonly utilsService = inject(UtilsService);
  private readonly firestoreUtilsService = inject(
    FirebaseFirestoreUtilsService,
  );

  Tab = Tab;
  settingsIcon: string = '<ion-icon name="settings-outline"></ion-icon>';

  private readonly subscriptions: Subscription[] = [];

  /**
   * Returns the name of the application as defined in the environment configuration.
   */
  get appName(): string {
    return environment.app.name;
  }

  /**
   * Initializes the component by setting up event listeners and subscriptions.
   */
  ngOnInit() {
    this.utilsService.showOrHideIonTabBar();
    this.setupEventListeners();
    this.setupSubscriptions();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => {
      this.utilsService.showOrHideIonTabBar();
    });
  }

  private setupSubscriptions() {
    this.subscriptions.push(
      this.localStorage.selectedLanguage$.subscribe((lang) => {
        this.translate.use(lang);
        this.translate.setDefaultLang(lang);
      }),
    );
  }

  /**
   * Handles the change event for the accordion group.
   * Requests a statistics refresh if an accordion is expanded.
   *
   * @param event The custom event triggered by the accordion group.
   * @param content The IonContent component associated with the accordion group.
   */
  onAccordionGroupChange(event: CustomEvent, content: IonContent) {
    const accordionValue = event?.detail?.value;
    if (accordionValue) {
      this.firestoreUtilsService.requestStatisticsRefresh();
    }
  }

  /**
   * Cleans up resources and unsubscribes from all subscriptions when the component is destroyed.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
