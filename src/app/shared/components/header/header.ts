import { Component, OnDestroy, signal } from '@angular/core';
import { UserMenuComponent } from '../user-menu/user-menu';

@Component({ selector: 'app-header', standalone: true, imports: [UserMenuComponent], templateUrl: './header.html', styleUrl: './header.css' })
export class HeaderComponent implements OnDestroy {
  readonly currentTime = signal('');
  readonly currentDate = signal('');

  private readonly timer: ReturnType<typeof setInterval>;
  private readonly timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  private readonly dateFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Colombo',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  constructor() {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime.set(this.timeFormatter.format(now));
    this.currentDate.set(this.dateFormatter.format(now));
  }
}
