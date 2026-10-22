import { InjectionToken } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';

/**
 * Injection tokens for Capacitor plugins.
 */
export const SPLASH_SCREEN = new InjectionToken<typeof SplashScreen>('SplashScreen', {
  providedIn: 'root',
  factory: () => SplashScreen,
});

/**
 * Injection token for the StatusBar plugin.
 */
export const STATUS_BAR = new InjectionToken<typeof StatusBar>('StatusBar', {
  providedIn: 'root',
  factory: () => StatusBar,
});

/**
 * Injection token for the NavigationBar plugin.
 */
export const NAVIGATION_BAR = new InjectionToken<typeof NavigationBar>('NavigationBar', {
  providedIn: 'root',
  factory: () => NavigationBar,
});