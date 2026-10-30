import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';

import { ConnectivityService } from './connectivity.service';
import { UtilsService } from './utils.service';

describe('ConnectivityService', () => {
  let service: ConnectivityService;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;
  let onlineState = true;

  beforeEach(() => {
    utilsServiceSpy = jasmine.createSpyObj('UtilsService', ['setOfflineState']);

    spyOnProperty(window.navigator, 'onLine', 'get').and.callFake(
      () => onlineState,
    );

    TestBed.configureTestingModule({
      providers: [
        ConnectivityService,
        { provide: UtilsService, useValue: utilsServiceSpy },
      ],
    });

    service = TestBed.inject(ConnectivityService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should emit offline state when offline event occurs', fakeAsync(() => {
    service.startMonitoring();
    onlineState = false;

    window.dispatchEvent(new Event('offline'));
    tick(600);

    expect(utilsServiceSpy.setOfflineState).toHaveBeenCalledWith(true);
  }));

  it('should emit online state when online event occurs', fakeAsync(() => {
    service.startMonitoring();
    onlineState = true;

    window.dispatchEvent(new Event('online'));
    tick(600);

    expect(utilsServiceSpy.setOfflineState).toHaveBeenCalledWith(false);
  }));

  it('should set offline state on request network error notification', () => {
    service.notifyRequestNetworkError();
    expect(utilsServiceSpy.setOfflineState).toHaveBeenCalledWith(true);
  });

  it('should return without subscribing when already subscribed', () => {
    service.startMonitoring();
    const addEventListenerSpy = spyOn(window, 'addEventListener');
    service.startMonitoring();

    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it('should read native network status and register a native listener on mobile', fakeAsync(() => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    const removeSpy = jasmine.createSpy('remove').and.resolveTo();
    let statusChangeHandler:
      | ((status: { connected: boolean; connectionType: string }) => void)
      | undefined;

    const networkPlugin = {
      getStatus: jasmine
        .createSpy('getStatus')
        .and.resolveTo({ connected: false, connectionType: 'none' }),
      addListener: jasmine
        .createSpy('addListener')
        .and.callFake((_eventName: string, callback: (status: any) => void) => {
          statusChangeHandler = callback;
          return Promise.resolve({ remove: removeSpy });
        }),
    };

    (Capacitor as any).Plugins = {
      ...(Capacitor as any).Plugins,
      Network: networkPlugin,
    };

    service.startMonitoring();
    tick();

    expect(networkPlugin.getStatus).toHaveBeenCalled();
    expect(networkPlugin.addListener).toHaveBeenCalledWith(
      'networkStatusChange',
      jasmine.any(Function),
    );
    expect(utilsServiceSpy.setOfflineState).toHaveBeenCalledWith(true);

    statusChangeHandler?.({ connected: true, connectionType: 'wifi' });
    expect(utilsServiceSpy.setOfflineState).toHaveBeenCalledWith(false);
  }));

  it('should set offline state if networkPlugin is missing on mobile', () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
    (Capacitor as any).Plugins = {
      ...(Capacitor as any).Plugins,
      Network: undefined,
    };
    onlineState = false;
    service.startMonitoring();
    
    expect(utilsServiceSpy.setOfflineState).toHaveBeenCalledWith(true);
  });
});
