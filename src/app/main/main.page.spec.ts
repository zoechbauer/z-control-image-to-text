import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Functions } from '@angular/fire/functions';

import { LocalStorageService } from '../services/local-storage.service';
import { FirebaseFirestoreUtilsService } from '../services/firebase-firestore-utils.service';
import { UtilsService } from '../services/utils.service';
import { MainPage } from './main.page';
import { UserStatisticComponent } from '../ui/components/user-statistic/user-statistic.component';
import { createTranslateServiceMock } from '../testing/translate-service.mock';

@Component({
  selector: 'app-header',
  template: '',
  standalone: true,
})
class MockHeaderComponent {}
@Component({
  selector: 'app-feature-example',
  template: '',
  standalone: true,
})
class MockFeatureExampleComponent {}
@Component({
  selector: 'app-user-statistic',
  template: '',
  standalone: true,
})
class MockUserStatisticComponent {}

describe('MainPage', () => {
  let component: MainPage;
  let fixture: ComponentFixture<MainPage>;
  let utilsServiceSpy: jasmine.SpyObj<UtilsService>;
  let firestoreUtilsServiceSpy: jasmine.SpyObj<FirebaseFirestoreUtilsService>;

  beforeEach(async () => {
    utilsServiceSpy = jasmine.createSpyObj('UtilsService', [
      'showOrHideIonTabBar',
      'isPortrait',
    ]);
    firestoreUtilsServiceSpy = jasmine.createSpyObj(
      'FirebaseFirestoreUtilsService',
      ['isContingentExceeded', 'requestStatisticsRefresh'],
    );
    TestBed.configureTestingModule({
      imports: [
        MainPage,
        MockFeatureExampleComponent,
        MockUserStatisticComponent,
      ],
      providers: [
        { provide: TranslateService, useValue: createTranslateServiceMock() },
        {
          provide: LocalStorageService,
          useValue: {
            selectedLanguage$: of('de'),
          },
        },
        { provide: UtilsService, useValue: utilsServiceSpy },
        {
          provide: FirebaseFirestoreUtilsService,
          useValue: firestoreUtilsServiceSpy,
        },
        { provide: Functions, useValue: {} },
      ],
    })
      .overrideComponent(MainPage, {
        remove: { imports: [UserStatisticComponent] },
        add: { imports: [MockUserStatisticComponent] },
      })
      .compileComponents();
    fixture = TestBed.createComponent(MainPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('class logic', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
      it('should call showOrHideIonTabBar, setupEventListeners, setupSubscriptions, updateIsContingentExceeded, initFormControls, and getTranslationPlaceholder', async () => {
        const showOrHideIonTabBarSpy = utilsServiceSpy.showOrHideIonTabBar;
        const setupEventListenersSpy = spyOn<any>(
          component,
          'setupEventListeners',
        );
        const setupSubscriptionsSpy = spyOn<any>(
          component,
          'setupSubscriptions',
        );

        component.ngOnInit();
        await fixture.whenStable();

        expect(showOrHideIonTabBarSpy).toHaveBeenCalled();
        expect(setupEventListenersSpy).toHaveBeenCalled();
        expect(setupSubscriptionsSpy).toHaveBeenCalled();
      });

      describe('setupEventListeners', () => {
        it('should add resize event listeners', () => {
          spyOn(window, 'addEventListener');

          (component as any).setupEventListeners();

          expect(window.addEventListener).toHaveBeenCalledWith(
            'resize',
            jasmine.any(Function),
          );
        });

        it('should call showOrHideIonTabBar when window is resized', () => {
          const showOrHideIonTabBarSpy = utilsServiceSpy.showOrHideIonTabBar;
          (component as any).setupEventListeners();
          // Reset the spy call count to ignore the initial call during setup
          showOrHideIonTabBarSpy.calls.reset();

          window.dispatchEvent(new Event('resize'));

          expect(showOrHideIonTabBarSpy).toHaveBeenCalled();
        });
      });

      describe('setupSubscriptions', () => {
        it('should subscribe to selectedLanguage$ and update translate api', () => {
          const localStorage = TestBed.inject(LocalStorageService);
          (localStorage.selectedLanguage$ as any) = of('en');

          const translate = component.translate;
          // Reset spies if they already exist
          (translate.use as jasmine.Spy).calls.reset();
          (translate.setDefaultLang as jasmine.Spy).calls.reset();

          (component as any).setupSubscriptions();

          expect(translate.use).toHaveBeenCalledWith('en');
          expect(translate.setDefaultLang).toHaveBeenCalledWith('en');
        });
      });
    });

    describe('onAccordionGroupChange', () => {
      it('should call requestStatisticsRefresh on firestoreUtilsService', () => {
        const requestStatisticsRefreshSpy = TestBed.inject(
          FirebaseFirestoreUtilsService,
        ).requestStatisticsRefresh as jasmine.Spy;
        const event = {
          detail: { value: 'some-value' },
        } as CustomEvent;
        const content = {} as any;
        component.onAccordionGroupChange(event, content);

        expect(requestStatisticsRefreshSpy).toHaveBeenCalled();
      });
    });

    describe('ngOnDestroy', () => {
      it('should unsubscribe from all subscriptions', () => {
        const subscription1 = jasmine.createSpyObj('Subscription', [
          'unsubscribe',
        ]);
        const subscription2 = jasmine.createSpyObj('Subscription', [
          'unsubscribe',
        ]);
        (component as any).subscriptions = [subscription1, subscription2];

        (component as any).ngOnDestroy();

        expect(subscription1.unsubscribe).toHaveBeenCalled();
        expect(subscription2.unsubscribe).toHaveBeenCalled();
      });
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      spyOn<any>(component, 'setupSubscriptions').and.stub();
      spyOn<any>(component, 'setupEventListeners').and.stub();

      fixture.detectChanges();
    });

    it('should show header, feature and user statistic components', () => {
      const headerComponent = fixture.nativeElement.querySelector('app-header');
      const featureComponent = fixture.nativeElement.querySelector(
        'app-feature-example',
      );
      const userStatisticComponent =
        fixture.nativeElement.querySelector('app-user-statistic');

      expect(headerComponent).toBeTruthy();
      expect(featureComponent).toBeTruthy();
      expect(userStatisticComponent).toBeTruthy();
    });

    it('should show landscape class on ion-content when utilsService.isPortrait is false', () => {
      Object.defineProperty(utilsServiceSpy, 'isPortrait', { value: false });
      fixture.detectChanges();

      const ionContent = fixture.nativeElement.querySelector('ion-content');
      expect(ionContent.classList).toContain('landscape');
    });
  });
});
