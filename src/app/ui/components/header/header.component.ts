import { Component, Input, inject, OnInit, OnDestroy } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
} from '@ionic/angular/standalone';
import { NgIf, AsyncPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { LogoType, Tab, WorkflowStep } from './../../../shared/enums';
import { UtilsService } from '@app/services/utils.service';
import { LogoComponent } from '../logo/logo.component';
import { WorkflowService } from 'src/app/services/workflow-service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    NgIf,
    LogoComponent,
    AsyncPipe,
  ],
})
export class HeaderComponent implements OnInit, OnDestroy {
  translate = inject(TranslateService);
  readonly utilsService = inject(UtilsService);
  private readonly workflowService = inject(WorkflowService);

  @Input() currentTab!: Tab;
  LogoType = LogoType;
  Tab = Tab;
  showBackButton: boolean = false;
  private readonly subscriptions: Subscription[] = [];

  /**
   * Determines if the screen size is considered large.
   * @returns True if the screen is large, false otherwise.
   */
  get isLargeScreen(): boolean {
    return !this.utilsService.isSmallScreen;
  }

  /**
   * Determines if the current tab is the main feature tab.
   * @returns True if the current tab is the main feature tab, false otherwise.
   */
  get onMainFeatureTab(): boolean {
    return this.currentTab === Tab.MainFeature;
  }

  /**
   * Determines if the current tab is the settings tab.
   * @returns True if the current tab is the settings tab, false otherwise.
   */
  get onSettingsTab(): boolean {
    return this.currentTab === Tab.Settings;
  }

  /**
   * Determines if the tabs bar should be hidden.
   * @returns True if the tabs bar should be hidden, false otherwise.
   */
  get hideTabsBar(): boolean {
    return !this.utilsService.isShowIonTabBar;
  }

  /**
   * Initializes the component and subscribes to workflow changes.
   */
  ngOnInit() {
    this.subscriptions.push(
      this.utilsService.workflowChanged$.subscribe((workflowStep: WorkflowStep) => {
        this.showBackButton = this.workflowService.showBackButton(workflowStep);
      }),
    );
  }

  /**
   * Cleans up resources and unsubscribes from all subscriptions when the component is destroyed.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Navigates to the settings tab.
   */
  async goToSettings() {
    await this.utilsService.navigateToTab(Tab.Settings);
  }

  /**
   * Navigates to the main feature tab.
   */
  async goToMainFeature() {
    await this.utilsService.navigateToTab(Tab.MainFeature);
  }

  /**
   * Navigates to the settings tab and opens the feedback section.
   */
  async goToSettingsAndOpenFeedback() {
    await this.utilsService.navigateToTabWithParams(Tab.Settings, {
      open: 'z-control',
    });
    setTimeout(() => {
      this.utilsService.logoClickedSub.next(true);
    }, 500);
  }
  
  /**
   * Opens the help modal.
   */
  openHelpModal(): Promise<void> {
    return this.utilsService.openHelpModal();
  }

  /**
   * Handles the back button click event.
   * @param event The click event.
   */
  goBack(event: Event) {
    this.utilsService.backButtonClickedSub.next(true);
  }
}
