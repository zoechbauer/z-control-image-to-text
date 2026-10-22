import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild, SecurityContext, inject } from '@angular/core';
import { MarkdownComponent, MarkdownService, SANITIZE } from 'ngx-markdown';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  ModalController,
  IonSpinner,
} from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';

import { UtilsService } from '@app/services/utils.service';

@Component({
  selector: 'app-markdown-viewer',
  templateUrl: './markdown-viewer.component.html',
  styleUrls: ['./markdown-viewer.component.scss'],
  standalone: true,
  imports: [
    IonSpinner,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    MarkdownComponent,
    IonSpinner,
    NgIf,
  ],
  providers: [
    ModalController,
    MarkdownService,
    { provide: SANITIZE, useValue: SecurityContext.HTML },
  ],
})
export class MarkdownViewerComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly modalController = inject(ModalController);
  readonly utilsService = inject(UtilsService);

  @Input() fullChangeLogPath!: string;
  @ViewChild('content', { static: false }) content!: IonContent;

  markdown: string = '';
  showSpinner: boolean = true;

  /**
   * Determines if the application is running in a native environment.
   * @returns True if running natively, false otherwise.
   */
  get isNative(): boolean {
    return this.utilsService.isNative;
  }

  /**
   * Lifecycle hook that is called after the component has been initialized.
   * Loads the markdown changelog.
   */
  ngOnInit() {
    this.loadMarkdownChangelog();
  }

  /**
   * Closes the modal containing the markdown viewer.
   */
  async closeModal() {
    await this.modalController.dismiss();
  }

  /**
   * Scrolls the content to the top.
   */
  async scrollToTop() {
    await this.content.scrollToTop(300);
  }

  /**
   * Loads the markdown changelog from the specified path.
   */
  private loadMarkdownChangelog() {
    this.http.get(this.fullChangeLogPath, { responseType: 'text' }).subscribe({
      next: (data) => {
        this.markdown = data;
        this.showSpinner = false;
      },
      error: (error) => {
        console.error('Error loading changelog:', error);
        this.showSpinner = false;
      },
    });
  }
}
