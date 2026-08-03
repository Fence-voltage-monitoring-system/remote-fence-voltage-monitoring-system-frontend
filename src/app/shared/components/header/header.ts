import { AfterViewInit, Component, HostListener, OnDestroy, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Bell, createIcons } from 'lucide';
import { filter, Subscription } from 'rxjs';
import { UserMenuComponent } from '../user-menu/user-menu';

@Component({ selector: 'app-header', standalone: true, imports: [RouterLink, UserMenuComponent], templateUrl: './header.html', styleUrl: './header.css' })
export class HeaderComponent implements AfterViewInit, OnDestroy {
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

  ngAfterViewInit(): void {
    createIcons({ icons: { Bell }, attrs: { 'stroke-width': 1.7, width: 17, height: 17 } });
  }

  async toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  }

  ngOnDestroy(): void { clearInterval(this.timer); this.routeSubscription.unsubscribe(); }
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
