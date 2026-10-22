import { NgIf } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { LogoType } from '@app/shared/enums';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss'],
  standalone: true,
  imports: [NgIf],
})
export class LogoComponent implements OnInit, OnChanges {
  @Input() type?: LogoType;
  leftLogoText: string = '';
  rightLogoText: string = '';
  LogoType = LogoType;

  /**
   * Initializes the component and sets the initial logo text.
   */
  constructor() {
    window.addEventListener('resize', () => {
      this.setLogoText();
    });
  }

  /**
   * Lifecycle hook that is called after the component's view has been fully initialized.
   */
  ngOnInit(): void {
    this.setLogoText();
  }

  /**
   * Lifecycle hook that is called when any data-bound property of a directive changes.
   * @param changes The changes object containing the changed properties.
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['type']) {
      this.setLogoText();
    }
  }

  private setLogoText(): void {
    this.leftLogoText = '';
    this.rightLogoText = '';

    if (this.type === LogoType.Copyright) {
      this.leftLogoText = '© 2026';
      this.rightLogoText = 'z-control';
    } else {
      // show company only on landscape mode
      this.rightLogoText = this.isPortrait ? '' : 'z-control';
    }
  }

  private get isPortrait(): boolean {
    return window.matchMedia('(orientation: portrait)').matches;
  }
}
