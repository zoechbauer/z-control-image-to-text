import { TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage-angular';

import { LocalStorageService } from './local-storage.service';
import { AllMonthsOption, DisplayMode } from '../shared/enums';
import { TranslateService } from '@ngx-translate/core';
import { ModalController } from '@ionic/angular';
import { UtilsService } from './utils.service';
import { AppConstants } from '../shared/app.constants';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let storageSpy: jasmine.SpyObj<Storage>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;

  const createTranslateServiceSpy = () =>
    jasmine.createSpyObj('TranslateService', ['get', 'setDefaultLang', 'use']);
  const modalControllerSpy = jasmine.createSpyObj('ModalController', [
    'dismiss',
    'create',
  ]);

  beforeEach(() => {
    storageSpy = jasmine.createSpyObj('Storage', [
      'create',
      'get',
      'set',
      'remove',
      'clear',
      'length',
      'keys',
    ]);
    storageSpy.create.and.returnValue(Promise.resolve(storageSpy));
    storageSpy.get.and.returnValue(Promise.resolve(null));
    storageSpy.set.and.returnValue(Promise.resolve());
    storageSpy.remove.and.returnValue(Promise.resolve());
    storageSpy.clear.and.returnValue(Promise.resolve());
    storageSpy.length.and.returnValue(Promise.resolve(0));
    storageSpy.keys.and.returnValue(Promise.resolve([]));

    utilsServiceSpy = jasmine.createSpyObj('UtilsService', ['getCurrentMonth']);

    TestBed.configureTestingModule({
      providers: [
        LocalStorageService,
        { provide: Storage, useValue: storageSpy },
        { provide: TranslateService, useValue: createTranslateServiceSpy() },
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: UtilsService, useValue: utilsServiceSpy },
      ],
    });
    service = TestBed.inject(LocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('get selected or default language', () => {
    it('should return default language if no language is saved', async () => {
      const defaultLanguage = service['getMobileDefaultLanguage']();
      storageSpy.get.and.returnValue(Promise.resolve(null));
      const language = await service.loadSelectedOrDefaultLanguage();
      expect(language).toBe(defaultLanguage);
    });

    it('should save default language if no language is saved', async () => {
      const defaultLanguage = service['getMobileDefaultLanguage']();
      storageSpy.get.and.returnValue(Promise.resolve(null));
      const language = await service.loadSelectedOrDefaultLanguage();
      expect(language).toBe(defaultLanguage);
      expect(storageSpy.set).toHaveBeenCalledWith('selectedLanguage', language);
    });

    it('should return saved language if it exists', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('fr'));
      const language = await service.loadSelectedOrDefaultLanguage();
      expect(language).toBe('fr');
    });
  });

  describe('save selected language', () => {
    it('should save the selected language', async () => {
      await service.saveSelectedLanguage('nl');
      expect(storageSpy.set).toHaveBeenCalledWith('selectedLanguage', 'nl');
    });

    it('should update the selected language subject', async () => {
      await service.saveSelectedLanguage('nl');
      expect(service.selectedLanguageSubject.value).toBe('nl');
    });

    it('logs an error if saving fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('some error');
      storageSpy.set.and.returnValue(Promise.reject(error));

      await service.saveSelectedLanguage('nl');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving selected language:',
        error,
      );
    });

    it('throws an error if language is not provided', async () => {
      await expectAsync(service.saveSelectedLanguage('')).toBeRejectedWithError(
        Error,
        'Language must be provided',
      );
    });
  });

  describe('load firestore uid', () => {
    it('should load the firestore uid', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('some-uid'));
      const uid = await service.loadFirestoreUid();
      expect(uid).toBe('some-uid');
    });

    it('should set firestore uid subject if uid is found', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('some-uid'));
      await service.loadFirestoreUid();
      expect(service.firestoreUidSubject.value).toBe('some-uid');
    });

    it('should return null if no firestore uid is found', async () => {
      storageSpy.get.and.returnValue(Promise.resolve(null));
      const uid = await service.loadFirestoreUid();
      expect(uid).toBeNull();
    });
  });

  describe('save firestore uid', () => {
    it('should save the firestore uid', async () => {
      await service.saveFirestoreUid('some-uid');
      expect(storageSpy.set).toHaveBeenCalledWith(
        AppConstants.currentUser,
        'some-uid',
      );
    });

    it('should log an error if saving fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('some error');
      storageSpy.set.and.returnValue(Promise.reject(error));
      await service.saveFirestoreUid('some-uid');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving current user UID:',
        error,
      );
    });
  });

  describe('get statistics display mode', () => {
    it('should get the statistics display mode', async () => {
      storageSpy.get.and.returnValue(Promise.resolve(DisplayMode.Programmer));
      const displayMode = await service.getStatisticsDisplayMode();
      expect(displayMode).toBe(DisplayMode.Programmer);
    });

    it('should return default display mode if no display mode is found', async () => {
      storageSpy.get.and.returnValue(Promise.resolve(null));
      const displayMode = await service.getStatisticsDisplayMode();
      expect(displayMode).toBe(DisplayMode.User);
    });

    it('should set statistics display mode subject based on loaded display mode', async () => {
      storageSpy.get.and.returnValue(Promise.resolve(DisplayMode.User));
      await service.getStatisticsDisplayMode();
      expect(service.statisticsDisplayModeSubject.value).toBe(DisplayMode.User);
    });
  });

  describe('save statistics display mode', () => {
    it('should save the statistics display mode', async () => {
      await service.saveStatisticsDisplayMode(DisplayMode.Programmer);
      expect(storageSpy.set).toHaveBeenCalledWith(
        'statisticsDisplayMode',
        DisplayMode.Programmer,
      );
    });

    it('should log an error if saving fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('some error');
      storageSpy.set.and.returnValue(Promise.reject(error));

      await service.saveStatisticsDisplayMode(DisplayMode.User);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving statistics display mode:',
        error,
      );
    });
  });

  describe('get statistics selected month', () => {
    it('should get the statistics selected month', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('2026-03'));
      const selectedMonth = await service.getStatisticsSelectedMonth(
        AllMonthsOption.SelectOptionValue,
        false,
      );
      expect(selectedMonth).toBe('2026-03');
    });

    const TEST_NAME =
      'should return current month from utilsService and save in local storage if no selected month is found';
    it(TEST_NAME, async () => {
      storageSpy.get.and.returnValue(Promise.resolve(null));
      utilsServiceSpy.getCurrentMonth.and.returnValue('2026-04');

      const selectedMonth = await service.getStatisticsSelectedMonth(
        AllMonthsOption.SelectOptionValue,
        false,
      );
      expect(selectedMonth).toBe('2026-04');
      expect(storageSpy.set).toHaveBeenCalledWith(
        'statisticsSelectedMonth',
        '2026-04',
      );
    });

    it('should update to current month if stored month is past and device is not programmer', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('2026-03'));
      utilsServiceSpy.getCurrentMonth.and.returnValue('2026-04');
      const isProgrammerDevice = false;

      const selectedMonth = await service.getStatisticsSelectedMonth(
        AllMonthsOption.SelectOptionValue,
        isProgrammerDevice,
      );
      expect(selectedMonth).toBe('2026-04');
      expect(storageSpy.set).toHaveBeenCalledWith(
        'statisticsSelectedMonth',
        '2026-04',
      );
    });

    it('should update to current month if stored month is past and device is not set', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('2026-03'));
      utilsServiceSpy.getCurrentMonth.and.returnValue('2026-04');

      const selectedMonth = await service.getStatisticsSelectedMonth(
        AllMonthsOption.SelectOptionValue,
      );
      expect(selectedMonth).toBe('2026-04');
      expect(storageSpy.set).toHaveBeenCalledWith(
        'statisticsSelectedMonth',
        '2026-04',
      );
    });

    it('should not update to current month if stored month is past and device is programmer', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('2026-03'));
      utilsServiceSpy.getCurrentMonth.and.returnValue('2026-04');
      const isProgrammerDevice = true;

      const selectedMonth = await service.getStatisticsSelectedMonth(
        AllMonthsOption.SelectOptionValue,
        isProgrammerDevice,
      );
      expect(selectedMonth).toBe('2026-03');
      expect(storageSpy.set).toHaveBeenCalledWith(
        'statisticsSelectedMonth',
        '2026-03',
      );
    });

    it('should not update local storage if month did not change', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('2026-04'));
      utilsServiceSpy.getCurrentMonth.and.returnValue('2026-04');

      let isProgrammerDevice = true;
      let selectedMonth = await service.getStatisticsSelectedMonth(
        AllMonthsOption.SelectOptionValue,
        isProgrammerDevice,
      );
      expect(selectedMonth)
        .withContext('Programmer device - selectedMonth')
        .toBe('2026-04');
      expect(storageSpy.set)
        .withContext('Programmer device - storage set')
        .not.toHaveBeenCalled();

      isProgrammerDevice = false;
      selectedMonth = await service.getStatisticsSelectedMonth(
        AllMonthsOption.SelectOptionValue,
        isProgrammerDevice,
      );
      expect(selectedMonth)
        .withContext('User device - selectedMonth')
        .toBe('2026-04');
      expect(storageSpy.set)
        .withContext('User device - storage set')
        .not.toHaveBeenCalled();
    });

    it('should return AllMonthsOption.SelectOptionValue if stored value length is not 7', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('all'));

      const selectedMonth = await service.getStatisticsSelectedMonth(
        AllMonthsOption.SelectOptionValue,
        true,
      );

      expect(selectedMonth)
        .withContext('selectedMonth')
        .toBe(AllMonthsOption.SelectOptionValue);
      expect(service.statisticsSelectedMonthSubject.value)
        .withContext('statisticsSelectedMonthSubject')
        .toBe(AllMonthsOption.localStorageValue);
    });

    it('should set statistics selected month subject based on loaded selected month', async () => {
      storageSpy.get.and.returnValue(Promise.resolve('2026-03'));
      await service.getStatisticsSelectedMonth(
        AllMonthsOption.SelectOptionValue,
        false,
      );
      expect(service.statisticsSelectedMonthSubject.value).toBe('2026-03');
    });
  });

  describe('save statistics selected month', () => {
    it('should save the statistics selected month', async () => {
      await service.saveStatisticsSelectedMonth('2026-03');
      expect(storageSpy.set).toHaveBeenCalledWith(
        'statisticsSelectedMonth',
        '2026-03',
      );
    });

    it('should save AllMonthsOption.localStorageValue if selected month length is not 7', async () => {
      await service.saveStatisticsSelectedMonth(
        AllMonthsOption.SelectOptionValue,
      );

      expect(storageSpy.set).toHaveBeenCalledWith(
        'statisticsSelectedMonth',
        AllMonthsOption.localStorageValue,
      );
      expect(service.statisticsSelectedMonthSubject.value).toBe(
        AllMonthsOption.localStorageValue,
      );
    });

    it('should log an error if saving fails', async () => {
      const consoleErrorSpy = spyOn(console, 'error');
      const error = new Error('some error');
      storageSpy.set.and.returnValue(Promise.reject(error));

      await service.saveStatisticsSelectedMonth('2026-03');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error saving statistics selected month:',
        error,
      );
    });
  });

  describe('initialize services', () => {
    it('should initialize the storage', async () => {
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);
      expect(storageSpy.create).toHaveBeenCalled();
    });

    it('should load selected or default language', async () => {
      const loadSelectedOrDefaultLanguageSpy = spyOn(
        service,
        'loadSelectedOrDefaultLanguage',
      ).and.returnValue(Promise.resolve('en'));
      const translateServiceSpy = createTranslateServiceSpy();
      await service.initializeServicesAsync(translateServiceSpy);
      expect(loadSelectedOrDefaultLanguageSpy).toHaveBeenCalled();
    });

    it('should set default language in translate service when initialization fails', async () => {
      storageSpy.create.and.returnValue(
        Promise.reject(new Error('init failed')),
      );

      const translateServiceSpy = createTranslateServiceSpy();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(translateServiceSpy.setDefaultLang).toHaveBeenCalledWith('en');
      expect(translateServiceSpy.use).toHaveBeenCalledWith('en');
    });

    it('should run remaining initialization steps on success', async () => {
      spyOn(service, 'loadSelectedOrDefaultLanguage').and.returnValue(
        Promise.resolve('en'),
      );
      const loadFirestoreUidSpy = spyOn(
        service,
        'loadFirestoreUid',
      ).and.returnValue(Promise.resolve(null));

      const translateServiceSpy = createTranslateServiceSpy();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(loadFirestoreUidSpy).toHaveBeenCalled();
    });

    it('should not call fallback translate methods when initialization succeeds', async () => {
      spyOn(service, 'loadSelectedOrDefaultLanguage').and.returnValue(
        Promise.resolve('en'),
      );
      spyOn(service, 'loadFirestoreUid').and.returnValue(Promise.resolve(null));

      const translateServiceSpy = createTranslateServiceSpy();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(translateServiceSpy.setDefaultLang).not.toHaveBeenCalled();
      expect(translateServiceSpy.use).not.toHaveBeenCalled();
    });

    it('should log and fallback if a later initialization step fails', async () => {
      spyOn(service, 'loadSelectedOrDefaultLanguage').and.returnValue(
        Promise.resolve('en'),
      );
      spyOn(service, 'loadFirestoreUid').and.returnValue(
        Promise.reject(new Error('Firestore UID load failed')),
      );
      const consoleErrorSpy = spyOn(console, 'error');
      const translateServiceSpy = createTranslateServiceSpy();
      const initializeWithDefaultsSpy = spyOn(
        service as any,
        'initializeWithDefaults',
      ).and.callThrough();

      await service.initializeServicesAsync(translateServiceSpy);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'App initialization failed:',
        new Error('Firestore UID load failed'),
      );
      expect(translateServiceSpy.setDefaultLang).toHaveBeenCalledWith('en');
      expect(translateServiceSpy.use).toHaveBeenCalledWith('en');
      expect(initializeWithDefaultsSpy).toHaveBeenCalledWith(
        translateServiceSpy,
      );
    });
  });
});
