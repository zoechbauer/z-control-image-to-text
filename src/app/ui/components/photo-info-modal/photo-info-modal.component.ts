import { Component, Input, OnInit } from '@angular/core';
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
    ReactiveFormsModule,
  ],
})
export class PhotoInfoModalComponent implements OnInit {
  @Input() photo!: UserPhoto;

  photoForm!: FormGroup;
  info: string | undefined;
  extractedText: string | undefined;

  constructor(
    private readonly fb: FormBuilder,
    private readonly modalCtrl: ModalController,
  ) {}

  ngOnInit() {
    this.info = this.photo.photoInfo?.info;
    this.extractedText = this.photo.photoInfo?.extractedText;

    this.photoForm = this.fb.group({
      info: [this.info || ''],
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
