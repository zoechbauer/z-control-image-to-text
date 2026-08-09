import { Component, Input, inject, OnInit, OnDestroy } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
} from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';
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

  get isLargeScreen(): boolean {
    return !this.utilsService.isSmallScreen;
  }

  get onMainFeatureTab(): boolean {
    return this.currentTab === Tab.MainFeature;
  }

  get onSettingsTab(): boolean {
    return this.currentTab === Tab.Settings;
  }

  get hideTabsBar(): boolean {
    return !this.utilsService.isShowIonTabBar;
  }

  ngOnInit() {
    this.subscriptions.push(
      this.utilsService.workflowChanged$.subscribe((workflowStep: WorkflowStep) => {
        this.showBackButton = this.workflowService.showBackButton(workflowStep);
      }),
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  goToSettings() {
    this.utilsService.navigateToTab(Tab.Settings);
  }

  goToMainFeature() {
    this.utilsService.navigateToTab(Tab.MainFeature);
  }

  goToSettingsAndOpenFeedback() {
    this.utilsService.navigateToTabWithParams(Tab.Settings, {
      open: 'z-control',
    });
    setTimeout(() => {
      this.utilsService.logoClickedSub.next(true);
    }, 500);
  }

  openHelpModal(): Promise<void> {
    return this.utilsService.openHelpModal();
  }

  goBack(event: Event) {
    this.utilsService.backButtonClickedSub.next(true);
  }
}
