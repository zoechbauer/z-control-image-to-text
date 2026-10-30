import { Injectable, OnDestroy, inject } from '@angular/core';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Subscription, fromEvent, merge, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

import { UtilsService } from './utils.service';

@Injectable({
  providedIn: 'root',
})
export class ConnectivityService implements OnDestroy {
  private readonly utilsService = inject(UtilsService);
  private readonly offlineStateDebounceMs = 500;

  private monitoringSubscription?: Subscription;
  private nativeNetworkListener?: PluginListenerHandle;

  startMonitoring(): void {
    if (this.monitoringSubscription || this.nativeNetworkListener) {
      return;
    }

    if (Capacitor.isNativePlatform()) {
      void this.startNativeMonitoring();
      return;
    }

    const onlineStatus$ = merge(
      of(this.isOnline()),
      fromEvent(globalThis, 'online').pipe(map(() => true)),
      fromEvent(globalThis, 'offline').pipe(map(() => false)),
    ).pipe(
      debounceTime(this.offlineStateDebounceMs),
      distinctUntilChanged(),
    );

    this.monitoringSubscription = onlineStatus$.subscribe((isOnline) => {
      this.utilsService.setOfflineState(!isOnline);
    });
  }

  notifyRequestNetworkError(): void {
    this.utilsService.setOfflineState(true);
  }

  ngOnDestroy(): void {
    this.monitoringSubscription?.unsubscribe();
    void this.nativeNetworkListener?.remove();
    this.nativeNetworkListener = undefined;
  }

  private async startNativeMonitoring(): Promise<void> {
    const networkPlugin = (Capacitor as any).Plugins?.Network;

    if (!networkPlugin) {
      this.utilsService.setOfflineState(!this.isOnline());
      return;
    }

    const initialStatus = await networkPlugin.getStatus();
    this.utilsService.setOfflineState(!initialStatus.connected);

    this.nativeNetworkListener = await networkPlugin.addListener(
      'networkStatusChange',
      ({ connected }: { connected: boolean }) => {
        this.utilsService.setOfflineState(!connected);
      },
    );
  }

  private isOnline(): boolean {
    return globalThis.navigator?.onLine ?? true;
  }
}
