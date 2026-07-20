import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
import localeDe from '@angular/common/locales/de';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  arrowForwardOutline,
  arrowUpOutline,
  cameraOutline,
  caretDownOutline,
  checkboxOutline,
  checkmarkOutline,
  closeOutline,
  cloudDownloadOutline,
  helpOutline,
  imagesOutline,
  informationCircle,
  languageOutline,
  listOutline,
  locationOutline,
  lockClosedOutline,
  logInOutline,
  logoGooglePlaystore,
  mailOutline,
  openOutline,
  personOutline,
  phonePortraitOutline,
  qrCodeOutline,
  reloadOutline,
  rocketOutline,
  settingsOutline,
  trashOutline,
  volumeHighOutline,
} from 'ionicons/icons';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// Register Ionicons used in the application
addIcons({
  'arrow-back-outline': arrowBackOutline,
  'arrow-forward-outline': arrowForwardOutline,
  'arrow-up-outline': arrowUpOutline,
  'camera-outline': cameraOutline,
  'caret-down-outline': caretDownOutline,
  'checkbox-outline': checkboxOutline,
  'checkmark-outline': checkmarkOutline,
  'close-outline': closeOutline,
  'cloud-download': cloudDownloadOutline,
  'help-outline': helpOutline,
  'images-outline': imagesOutline,
  'information-circle': informationCircle,
  'language-outline': languageOutline,
  'list-outline': listOutline,
  'location-outline': locationOutline,
  'lock-closed': lockClosedOutline,
  'log-in-outline': logInOutline,
  'logo-google-playstore': logoGooglePlaystore,
  'mail-outline': mailOutline,
  'open-outline': openOutline,
  'person-outline': personOutline,
  'phone-portrait': phonePortraitOutline,
  'qr-code-outline': qrCodeOutline,
  'reload-outline': reloadOutline,
  'rocket-outline': rocketOutline,
  'settings-outline': settingsOutline,
  'trash-outline': trashOutline,
  'volume-high-outline': volumeHighOutline,
});

// Register PWA Components like Camera, File, etc. for use in the application on Web
defineCustomElements(window);

// Register German locale data for number/date pipes
registerLocaleData(localeDe);

bootstrapApplication(AppComponent, appConfig);
