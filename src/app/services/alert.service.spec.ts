import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

describe('AlertService', () => {
  let service: AlertService;
  let alertControllerSpy: jasmine.SpyObj<AlertController>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;
  let alertSpy: any;

  beforeEach(() => {
    alertSpy = jasmine.createSpyObj('Alert', ['present']);
    alertControllerSpy = jasmine.createSpyObj('AlertController', ['create']);
    translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        AlertService,
        { provide: AlertController, useValue: alertControllerSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
      ],
    });

    service = TestBed.inject(AlertService);
  });

  describe('showStoragePermissionError', () => {
    it('should create and present a storage permission error alert with translated strings', async () => {
      translateServiceSpy.get.and.callFake((key: string) => of('Translated: ' + key));
      alertControllerSpy.create.and.resolveTo(alertSpy);

      await service.showStoragePermissionError();

      expect(translateServiceSpy.get).toHaveBeenCalledWith('APP.ALERT_SERVICE.STORAGE_PERMISSION.HEADER');
      expect(translateServiceSpy.get).toHaveBeenCalledWith('APP.ALERT_SERVICE.STORAGE_PERMISSION.SUBHEADER');
      expect(translateServiceSpy.get).toHaveBeenCalledWith('APP.ALERT_SERVICE.STORAGE_PERMISSION.MESSAGE');
      expect(alertControllerSpy.create).toHaveBeenCalledWith({
        header: 'Translated: APP.ALERT_SERVICE.STORAGE_PERMISSION.HEADER',
        subHeader: 'Translated: APP.ALERT_SERVICE.STORAGE_PERMISSION.SUBHEADER',
        message: 'Translated: APP.ALERT_SERVICE.STORAGE_PERMISSION.MESSAGE',
        buttons: [
          {
            text: 'Translated: APP.ALERT_SERVICE.OK',
            role: 'cancel',
          },
        ],
      });
      expect(alertSpy.present).toHaveBeenCalled();
    });
  });
});