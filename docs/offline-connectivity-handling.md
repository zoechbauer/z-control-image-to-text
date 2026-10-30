# Offline Connectivity Handling

## Problem

Users should see feedback when no internet connection is available.  
The status should be visible globally in the header and remain stable while navigating between pages.

## Implemented Solution

The app now handles this in three coordinated layers:

1. **Global connectivity listener**
   - Service: `ConnectivityService`
   - File: `src/app/services/connectivity.service.ts`
   - Initialized once during app startup in `AppComponent.initializeApp()`
   - On web: listens to browser `online` and `offline` events
   - On mobile/native Android: reads Capacitor network status via `Network.getStatus()` and listens to `networkStatusChange`
   - Uses RxJS `debounceTime` + `distinctUntilChanged` to smooth state changes
   - Writes the global offline state through `UtilsService.setOfflineState(...)`

2. **HTTP network error fallback**
   - Interceptor: `networkErrorInterceptor`
   - File: `src/app/interceptors/network-error.interceptor.ts`
   - Registered via `provideHttpClient(withInterceptors(...))` in `app.config.ts`
   - Triggers on `HttpErrorResponse` with status `0` (network-level failure)
   - Marks app state as offline through `ConnectivityService.notifyRequestNetworkError()`

3. **Persistent header rendering**
   - Header binds to `utilsService.offlineChanged$`
   - `offlineChanged$` is backed by `BehaviorSubject<boolean>`
   - New header instances created after route changes immediately receive the latest offline value

## Mobile-specific note

The browser-only `online` / `offline` events are not reliable enough on Android when the device is switched into flight mode or Wi‑Fi is disabled. For native mobile devices, the app must rely on Capacitor network status updates instead of browser events alone.

This is why the mobile implementation uses the Capacitor Network plugin to update the global offline state when the device actually loses connectivity.

## Debounce Rules

- Connectivity state changes are debounced by **500 ms**

## Header Message

- Translation key: `HEADER.NETWORK_OFFLINE`

## Why this design

- `BehaviorSubject` prevents state loss during component recreation on route changes
- `ConnectivityService` provides app-wide state handling (not only HTTP requests)
- Interceptor catches network-failure edge cases that may happen while online/offline events are delayed or unavailable
