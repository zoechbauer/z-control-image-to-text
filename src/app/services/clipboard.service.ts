import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

import { ToastService } from './toast.service';
import { FileConversionService } from './file-conversion.service';
import { CopyDataOptions, UserPhoto } from '../shared/app.interfaces';
import { PhotoStorageService } from './photo-storage.service';
import { UtilsService } from './utils.service';
import { environment } from 'src/environments/environment';
import { FilePathService } from './file-path.service';

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  private readonly translate = inject(TranslateService);
  private readonly toastService = inject(ToastService);
  private readonly fileConversionService = inject(FileConversionService);
  private readonly photoStorageService = inject(PhotoStorageService);
  private readonly utilsService = inject(UtilsService);
  private readonly filePathService = inject(FilePathService);

  /**
   * Copies the specified data to the clipboard based on the provided options.
   * @param photo The UserPhoto object containing the photo data.
   * @param textStatistics The text statistics associated with the photo.
   * @param options The CopyDataOptions specifying what data to copy.
   * @returns A Promise that resolves when the copy operation is complete.
   */
  async copyDataToClipboard(
    photo: UserPhoto,
    textStatistics: any,
    options: CopyDataOptions,
  ): Promise<void> {
    if (
      this.areTextOptionsSelected(options) ||
      this.isPhotoOptionSelected(options)
    ) {
      if (Capacitor.isNativePlatform()) {
        await this.shareImageAndTextNative(photo, textStatistics, options);
      } else {
        await this.copyImageAndTextWeb(photo, textStatistics, options);
      }
    }
  }

  /**
   * Checks if any text-related options are selected in the provided CopyDataOptions.
   * @param options The CopyDataOptions to check.
   * @returns True if any text-related options are selected; otherwise, false.
   */
  private areTextOptionsSelected(options: CopyDataOptions): boolean {
    return (
      options.copyPhoto ||
      false ||
      options.copyTitleDescription ||
      false ||
      options.copyExtractedText ||
      false ||
      options.copyTextStatistics ||
      false ||
      options.copyCreatedModifiedTimestamps ||
      false ||
      options.copyAll ||
      false
    );
  }

  /**
   * Checks if the photo option is selected in the provided CopyDataOptions.
   * @param options The CopyDataOptions to check.
   * @returns True if the photo option is selected; otherwise, false.
   */
  private isPhotoOptionSelected(options: CopyDataOptions): boolean {
    return options.copyPhoto || false;
  }

  /**
   * Shares the image and text content natively using the Capacitor Share plugin.
   * @param photo The UserPhoto object containing the photo data.
   * @param textStatistics The text statistics associated with the photo.
   * @param options The CopyDataOptions specifying what data to share.
   * @returns A Promise that resolves when the share operation is complete.
   */
  private async shareImageAndTextNative(
    photo: UserPhoto,
    textStatistics: any,
    options: CopyDataOptions,
  ): Promise<void> {
    try {
      let shareText = '';
      let filePath: string | undefined;
      let shareItemData: Record<string, any> = {};

      const title =
        environment.app.name +
        (photo.photoInfo?.title ? ' - ' + photo.photoInfo.title : '');
      shareItemData['title'] = title;

      if (this.isPhotoOptionSelected(options)) {
        filePath = photo.filepath?.startsWith('file://')
          ? photo.filepath
          : undefined;

        if (!filePath) {
          console.error('No file path available for sharing.');
          this.toastService.showToast(
            this.translate.instant('FEATURE.TOAST.IMAGE_SHARE_NO_FILEPATH'),
          );
          return;
        }

        shareItemData['url'] = filePath;
      }

      if (this.areTextOptionsSelected(options)) {
        shareText = this.copyTextContent(photo, textStatistics, options);
        shareItemData['text'] = shareText;
      }

      await Share.share(shareItemData);

      this.toastService.showToast(
        this.translate.instant('FEATURE.TOAST.SUCCESS_DATA_SHARED'),
      );
    } catch (err) {
      console.error('Share failed', err);
      this.toastService.showToast(
        this.translate.instant('FEATURE.TOAST.IMAGE_SHARE_NOT_SUPPORTED'),
      );
    }
  }

  /**
   * Copies the image and text content to the web clipboard using the Clipboard API.
   * @param photo The UserPhoto object containing the photo data.
   * @param textStatistics The text statistics associated with the photo.
   * @param options The CopyDataOptions specifying what data to copy.
   * @returns A Promise that resolves when the copy operation is complete.
   */
  async copyImageAndTextWeb(
    photo: UserPhoto,
    textStatistics: any,
    options: CopyDataOptions,
  ): Promise<void> {
    try {
      let imageBlob: Blob | null = null;
      let copiedData = '';
      let clipboardItemData: Record<string, any> = {};

      const dataUrl = this.isPhotoOptionSelected(options)
        ? await this.fileConversionService.getImageDataUrl(photo)
        : '';

      if (this.isPhotoOptionSelected(options)) {
        imageBlob = this.fileConversionService.dataUrlToBlobSync(dataUrl);
        clipboardItemData[imageBlob.type || 'image/png'] = imageBlob;
      }

      if (this.areTextOptionsSelected(options)) {
        copiedData = this.copyTextContent(photo, textStatistics, options);
        clipboardItemData['text/plain'] = new Blob([copiedData], {
          type: 'text/plain',
        });

        const html = `<div>${copiedData.replaceAll('\n', '<br/>')}<br/><img src="${dataUrl}" /></div>`;
        clipboardItemData['text/html'] = new Blob([html], {
          type: 'text/html',
        });
      }

      const clipboardItem = new ClipboardItem(clipboardItemData);

      await navigator.clipboard.write([clipboardItem]);

      this.toastService.showToast(
        this.translate.instant('FEATURE.TOAST.SUCCESS_DATA_COPIED'),
      );
    } catch (err) {
      console.error('Failed to copy data to clipboard', err);
      const isNotallowedError = String(err).includes('NotAllowedError');
      if (isNotallowedError) {
        (Capacitor.isNativePlatform()) ?
        this.toastService.showToast(
          this.translate.instant('FEATURE.TOAST.IMAGE_COPY_NOT_SUPPORTED_NATIVE'),
        ) : 
        this.toastService.showToast(
          this.translate.instant('FEATURE.TOAST.IMAGE_COPY_NOT_SUPPORTED_WEB'),
        );
      } else {
        this.toastService.showToast(
          this.translate.instant('FEATURE.TOAST.ERROR_COPYING_DATA'),
        );
      }
    }
  }

  /**
   * Generates the text content to be copied to the clipboard based on the provided options.
   * @param photo The UserPhoto object containing the photo data.
   * @param textStatistics The text statistics associated with the photo.
   * @param options The CopyDataOptions specifying what data to include in the text content.
   * @returns A string containing the formatted text content to be copied to the clipboard.
   */
  private copyTextContent(
    photo: UserPhoto,
    textStatistics: any,
    options: CopyDataOptions,
  ): string {
    let data = environment.app.name + '\n';
    data += this.translate.instant('FEATURE.COPY_DATA.TITLE') + '\n\n';

    if (options.copyTitleDescription) {
      data += this.getTitleDescriptionText(photo);
    }

    if (options.copyExtractedText) {
      data += this.getExtractedText(photo);
    }

    if (options.copyTextStatistics && photo.photoInfo?.extractedText) {
      data += this.getTextStatisticsText(textStatistics);
    }

    if (options.copyCreatedModifiedTimestamps) {
      data += this.getTimestampsText(photo);
    }

    if (options.copyPhoto) {
      data += this.getPhotoName(photo);
    }

    return data;
  }

  private getTitleDescriptionText(photo: UserPhoto): string {
    const headerLabel = this.translate.instant(
      'FEATURE.COPY_DATA.TITLE_DESCRIPTION.HEADER',
    );
    const titleLabel = this.translate.instant('FEATURE.COPY_DATA.TITLE_DESCRIPTION.TITLE');
    const descriptionLabel = this.translate.instant('FEATURE.COPY_DATA.TITLE_DESCRIPTION.DESCRIPTION');
    
    const title = photo.photoInfo?.title || '';
    const description = photo.photoInfo?.description || '';
    
    return `${headerLabel}\n${titleLabel}: ${title}\n${descriptionLabel}: ${description}\n\n`;
  }

  /**
   * Gets the extracted text from the photo, or a placeholder if no text is available.
   * @param photo The UserPhoto object containing the photo data.
   * @returns A string containing the extracted text or a placeholder message.
   */
  private getExtractedText(photo: UserPhoto): string {
    const extractedText = photo.photoInfo?.extractedText || '';
    
    const headerLabel = extractedText
      ? this.translate.instant('FEATURE.COPY_DATA.EXTRACTED_TEXT.HEADER')
      : this.translate.instant('FEATURE.COPY_DATA.EXTRACTED_TEXT.HEADER_NO_DATA');
    const extractedTextLabel =
      extractedText || this.photoStorageService.getNoExtractedTextInfo(photo);

    return `${headerLabel}\n${extractedTextLabel}\n\n`;
  }

  private getTextStatisticsText(textStatistics: any): string {
    const headerLabel = this.translate.instant(
      'FEATURE.COPY_DATA.TEXT_STATISTICS.HEADER',
    );
    const wordCountLabel = this.translate.instant(
      'FEATURE.COPY_DATA.TEXT_STATISTICS.NUMBER_OF_WORDS',
    );
    const lineCountLabel = this.translate.instant(
      'FEATURE.COPY_DATA.TEXT_STATISTICS.NUMBER_OF_LINES',
    );
    const characterCountLabel = this.translate.instant(
      'FEATURE.COPY_DATA.TEXT_STATISTICS.NUMBER_OF_CHARACTERS',
    );
    
    const wordCount = textStatistics?.wordCount || 0;
    const lineCount = textStatistics?.lineCount || 0;
    const characterCount = textStatistics?.characterCount || 0;

    return `${headerLabel}\n${wordCountLabel}: ${wordCount}\n${lineCountLabel}: ${lineCount}\n` + 
    `${characterCountLabel}: ${characterCount}\n\n`;
  }

  private getTimestampsText(photo: UserPhoto): string {
    const headerLabel = this.translate.instant(
      'FEATURE.COPY_DATA.TIMESTAMPS.HEADER',
    );
    const createdAtLabel = this.translate.instant(
      'FEATURE.COPY_DATA.TIMESTAMPS.CREATED_AT',
    );
    const modifiedAtLabel = this.translate.instant(
      'FEATURE.COPY_DATA.TIMESTAMPS.MODIFIED_AT',
    );

    const createdAt = photo.photoInfo?.createdAt || '';
    const modifiedAt = photo.photoInfo?.modifiedAt || '';
    const createdAtFormatted = createdAt ? this.utilsService.formatDateTimeISO(new Date(createdAt)) : '';
    const modifiedAtFormatted = modifiedAt ? this.utilsService.formatDateTimeISO(new Date(modifiedAt)) : '';
    
    return `${headerLabel}\n${createdAtLabel}: ${createdAtFormatted}\n${modifiedAtLabel}: ${modifiedAtFormatted}\n\n`;
  }

  private getPhotoName(photo: UserPhoto): string {
    const headerLabel = this.translate.instant(
      'FEATURE.COPY_DATA.PHOTO.HEADER',
    );
    const filenameLabel = this.translate.instant(
      'FEATURE.COPY_DATA.PHOTO.FILENAME',
    );
    const filename = this.filePathService.getFilenameFromFilepath(photo.filepath);

    return `${headerLabel}\n${filenameLabel}: ${filename}\n\n`;
  }
}
