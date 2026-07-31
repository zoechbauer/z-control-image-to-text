import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonCardSubtitle,
  IonImg,
  IonLabel,
  IonItem,
} from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { TextStatistics, UserPhoto } from 'src/app/shared/app.interfaces';

@Component({
  selector: 'app-feature-result',
  templateUrl: './feature-result.component.html',
  styleUrls: ['./feature-result.component.scss'],
  imports: [
    IonItem,
    IonLabel,
    IonCardSubtitle,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonImg,
    CommonModule,
    FormsModule,
    TranslatePipe,
  ],
})
export class FeatureResultComponent {
  @Input() selectedHistoryPhoto!: UserPhoto;
  @Input() extractedText: string | null = null;
  @Input() textStatistics: TextStatistics = {
    wordCount: 0,
    lineCount: 0,
    characterCount: 0,
  };

  private readonly translate = inject(TranslateService);
}
