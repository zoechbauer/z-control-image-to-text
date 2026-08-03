import { Component, inject, Input, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ModalController } from '@ionic/angular';
import {
  IonGrid,
  IonItem,
  IonLabel,
  IonCard,
  IonCardContent,
  IonButton,
  IonImg,
  IonCol,
  IonRow,
  IonTextarea,
  IonInput,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonIcon,
} from '@ionic/angular/standalone';

import { UserPhoto } from 'src/app/shared/app.interfaces';
import { ToastService } from 'src/app/services/toast.service';
import { UtilsService } from 'src/app/services/utils.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-photo-info',
  templateUrl: './photo-info.component.html',
  styleUrls: ['./photo-info.component.scss'],
  standalone: true,
  imports: [
    IonCol,
    IonImg,
    IonGrid,
    IonItem,
    IonLabel,
    IonCard,
    IonCardContent,
    IonButton,
    IonRow,
    IonCol,
    IonInput,
    IonTextarea,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonIcon,
    ReactiveFormsModule,
    TranslatePipe,
    NgIf,
  ],
})
export class PhotoInfoComponent implements OnInit {
  @Input() photo!: UserPhoto;

  translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastService = inject(ToastService);
  private readonly utilsService = inject(UtilsService);

  photoForm!: FormGroup;
  title: string | undefined;
  description: string | undefined;
  hideImageWhenEditingOnMobile = false;

  get headerTitle(): string {
    return this.title
      ? 'FEATURE.PHOTO_INFO_MODAL.TITLE_CHANGE_INFO'
      : 'FEATURE.PHOTO_INFO_MODAL.TITLE_ADD_INFO';
  }

  /**
   * Initializes the component by setting the title and description.
   */
  ngOnInit() {
    this.title = this.photo.photoInfo?.title;
    this.description = this.photo.photoInfo?.description;

    this.photoForm = this.fb.group({
      title: [this.title || '', Validators.required],
      description: [this.description || ''],
    });
  }

  /**
   * Saves the photo information and dismisses the modal with the updated data.
   * If the form is invalid, shows a toast message indicating the error.
   */
  save() {
    if (!this.photoForm.valid) {
      this.toastService.showToast(
        this.translate.instant(
          'FEATURE.PHOTO_INFO_MODAL.TOAST.ERROR_TITLE_REQUIRED',
        ),
      );
      return;
    }
    this.modalCtrl.dismiss(this.photoForm.value, 'save');
  }

  /**
   * Dismisses the modal without saving any changes and returns null as the result.
   * The role 'cancel' is used to indicate that the modal was dismissed without saving.
   */
  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  /**
   * Sets the hideImageWhenEditingOnMobile flag to true on mobile devices.
   * On mobile devices the image would hide the input fields when the keyboard is open, 
   * so this method hides the image when the user is editing the photo information.
   * 
   */
  setHideImageWhenEditingOnMobile() {
    if (this.utilsService.isNative && !this.hideImageWhenEditingOnMobile) {
      this.hideImageWhenEditingOnMobile = true;
    }
  }

  /**
   * Checks if the photo information has changed compared to the initial values.
   * @returns True if the title or description has changed, false otherwise.
   */
  hasDataChanged(): boolean {
    const currentTitle = this.photoForm.get('title')?.value;
    const currentDescription = this.photoForm.get('description')?.value;
    return currentTitle !== this.title || currentDescription !== this.description;
  }
}
