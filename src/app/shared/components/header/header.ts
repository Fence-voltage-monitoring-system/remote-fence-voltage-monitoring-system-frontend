import { AfterViewInit, Component, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Bell, createIcons } from 'lucide';
import { filter, Subscription } from 'rxjs';
import { UserMenuComponent } from '../user-menu/user-menu';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({ selector: 'app-header', standalone: true, imports: [RouterLink, UserMenuComponent], templateUrl: './header.html', styleUrl: './header.css' })
export class HeaderComponent implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  readonly currentTime = signal('');
  readonly currentDate = signal('');
  readonly pageName = signal('Live Dashboard');
  readonly fullscreen = signal(false);
  private readonly timer: ReturnType<typeof setInterval>;
  private readonly routeSubscription: Subscription;
  private readonly liveSub?: Subscription;
  private statsSubscription?: Subscription;
  readonly unread = signal(0);
  private readonly timeFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  private readonly dateFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', day: '2-digit', month: 'short', year: 'numeric' });

  constructor(private readonly router: Router, private readonly notifications: NotificationService) {
    this.updateClock();
    this.updatePageName(this.router.url);
    this.timer = setInterval(() => this.updateClock(), 1000);
    this.routeSubscription = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => this.updatePageName(event.urlAfterRedirects));
    // subscribe to published stats so header updates immediately (including preview stats)
    this.notifications.stats$.subscribe({ next: (s) => this.unread.set(s.unread), error: () => {/* ignore */} });
    // subscribe to live notifications and update unread count when new unread items arrive
    this.liveSub = this.notifications.connectLive().subscribe({ next: (item) => { if (!item.read) this.unread.update(n => n + 1); }, error: () => {/* ignore */} });
  }

  onSignOut(): void {
    this.authService.logout().subscribe({
      next: () => { void this.router.navigateByUrl('/'); },
      error: () => { void this.router.navigateByUrl('/'); },
    });
  }

  @HostListener('document:fullscreenchange')
  onFullscreenChange(): void { this.fullscreen.set(Boolean(document.fullscreenElement)); }

  ngAfterViewInit(): void {
    createIcons({ icons: { Bell }, attrs: { 'stroke-width': 1.7, width: 17, height: 17 } });
    // fetch initial stats so the header shows correct unread count immediately
    this.notifications.getStats().subscribe({ next: () => {/* stats published to stats$ */}, error: () => {/* ignore */} });
  }

  async toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }

  ngOnDestroy(): void { clearInterval(this.timer); this.routeSubscription.unsubscribe(); this.liveSub?.unsubscribe(); this.statsSubscription?.unsubscribe(); }
  private updateClock(): void { const now = new Date(); this.currentTime.set(this.timeFormatter.format(now)); this.currentDate.set(this.dateFormatter.format(now)); }
  private updatePageName(url: string): void {
    const path = url.split('?')[0].split('#')[0];
    this.pageName.set(
      path.startsWith('/virtual-fence') ? 'Live View' :
      path.startsWith('/map') ? 'Fence Map' :
      path.startsWith('/historical-analysis') ? 'Historical Analysis' :
      path.startsWith('/alerts') ? 'Alerts' :
      path.startsWith('/notifications') ? 'Notifications' :
      path.startsWith('/devices') || path.startsWith('/device-management') ? 'Device Management' :
      path.startsWith('/gateways') || path.startsWith('/gateway-management') ? 'Gateway Management' :
      path.startsWith('/fences') ? 'Fence Management' :
      path.startsWith('/sections') ? 'Section Management' :
      path.startsWith('/users') ? 'User Management' :
      path.startsWith('/reports') ? 'Reports' :
      path.startsWith('/configuration') ? 'System Configuration' :
      path.startsWith('/audit-logs') ? 'Audit Logs' :
      path.startsWith('/profile') ? 'My Profile' :
      path.startsWith('/security') ? 'Security Settings' :
      path.startsWith('/appearance') ? 'Theme & Appearance' :
      path.startsWith('/help-support') ? 'Help & Support' :
      'Live Dashboard'
    );
  }
}
