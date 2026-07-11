import { Component, inject, OnInit, Renderer2 } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { TranslateService } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';

import { environment } from '../environments/environment';
import { LocalStorageService } from './services/local-storage.service';
import { FirebaseFirestoreService } from './services/firebase-firestore.service';
import { SystemBarsService } from './services/system-bars.service';
import { SafeAreaInsetsService } from './services/safe-area-insets.service';
import { CapacitorPlatformService } from './services/capacitor-platform.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly renderer = inject(Renderer2);
  private readonly firestoreService = inject(FirebaseFirestoreService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly safeAreaInsets = inject(SafeAreaInsetsService);
  private readonly systemBars = inject(SystemBarsService);
  private readonly capacitorPlatformService = inject(CapacitorPlatformService);

  isNativeApp = Capacitor.isNativePlatform();
  showTabsBar = environment.app.showTabsBar;

  ngOnInit() {
    this.initializeApp();
  }

  async initializeApp() {
    if (this.isNativeApp) {
      this.renderer.addClass(document.body, 'native-app');

      await this.capacitorPlatformService.hideSplashScreen();
      await this.capacitorPlatformService.setStatusBarOverlay(false);
      this.safeAreaInsets.setSafeAreaInsetsFix();

      const isDarkMode = await this.systemBars.getCurrentIsDarkMode();
      await this.systemBars.setBars(isDarkMode);

      await this.capacitorPlatformService.showStatusBar();
    } else {
      this.renderer.addClass(document.body, 'web-app');
    }

    await this.localStorageService.initializeServicesAsync(this.translate);
    await this.firestoreService.init();
  }
}
