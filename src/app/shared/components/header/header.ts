import { Component, HostListener, OnDestroy, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { UserMenuComponent } from '../user-menu/user-menu';

@Component({ selector: 'app-header', standalone: true, imports: [RouterLink, UserMenuComponent], templateUrl: './header.html', styleUrl: './header.css' })
export class HeaderComponent implements OnDestroy {
  readonly currentTime = signal('');
  readonly currentDate = signal('');
  readonly pageName = signal('Live Dashboard');
  readonly fullscreen = signal(false);
  private readonly timer: ReturnType<typeof setInterval>;
  private readonly routeSubscription: Subscription;
  private readonly timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  private readonly dateFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', day: '2-digit', month: 'short', year: 'numeric' });

  constructor(private readonly router: Router) {
    this.updateClock();
    this.updatePageName(this.router.url);
    this.timer = setInterval(() => this.updateClock(), 1000);
    this.routeSubscription = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => this.updatePageName(event.urlAfterRedirects));
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void { this.fullscreen.set(Boolean(document.fullscreenElement)); }

  async toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }

  ngOnDestroy(): void { clearInterval(this.timer); this.routeSubscription.unsubscribe(); }
  private updateClock(): void { const now = new Date(); this.currentTime.set(this.timeFormatter.format(now)); this.currentDate.set(this.dateFormatter.format(now)); }
  private updatePageName(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    const pageNames: Array<[string, string]> = [
      ['/dashboard', 'Live Dashboard'],
      ['/virtual-fence', 'Live View'],
      ['/map', 'Fence Map'],
      ['/devices', 'Device Management'],
      ['/device-management', 'Device Management'],
      ['/gateways', 'Gateway Management'],
      ['/gateway-management', 'Gateway Management'],
      ['/historical-analysis', 'Historical Analysis'],
      ['/alerts', 'Alerts'],
      ['/notifications', 'Notifications'],
      ['/fences', 'Fence Management'],
      ['/sections', 'Section Management'],
      ['/users', 'User Management'],
      ['/reports', 'Reports'],
      ['/audit-logs', 'Audit Logs'],
      ['/configuration', 'System Configuration'],
      ['/user-profile', 'User Profile'],
      ['/profile', 'My Profile'],
      ['/security', 'Security Settings'],
      ['/appearance', 'Theme & Appearance'],
      ['/help-support', 'Help & Support'],
    ];
    this.pageName.set(pageNames.find(([route]) => path.startsWith(route))?.[1] ?? 'Live Dashboard');
  }
}
