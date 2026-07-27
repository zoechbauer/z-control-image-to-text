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
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonImg,
  IonCol,
  IonRow,
  IonTextarea,
  IonInput,
} from '@ionic/angular/standalone';

import { PhotoInfo, UserPhoto } from 'src/app/shared/app.interfaces';

@Component({
  selector: 'app-photo-info-modal',
  templateUrl: './photo-info-modal.component.html',
  styleUrls: ['./photo-info-modal.component.scss'],
  standalone: true,
  imports: [
    IonCol,
    IonImg,
    IonGrid,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonRow,
    IonCol,
    IonInput,
    IonTextarea,
    ReactiveFormsModule,
    TranslatePipe,
  ],
})
export class PhotoInfoModalComponent implements OnInit {
  @Input() photo!: UserPhoto;

  translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  photoForm!: FormGroup;
  title: string | undefined;
  description: string | undefined;
  extractedText: string | undefined;

  ngOnInit() {
    this.title = this.photo.photoInfo?.title;
    this.description = this.photo.photoInfo?.description;
    this.extractedText = this.photo.photoInfo?.extractedText;

    this.photoForm = this.fb.group({
      title: [this.title || '', Validators.required],
      description: [this.description || ''],
    });
  }

  save() {
    if (this.photoForm.valid) {
      this.modalCtrl.dismiss(this.photoForm.value, 'save');
    }
  }

  cancel() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
