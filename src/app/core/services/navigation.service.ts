import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  readonly isMobileNavOpen = signal(false);

  toggleMobileNav(): void {
    this.isMobileNavOpen.update((open) => !open);
  }

  openMobileNav(): void {
    this.isMobileNavOpen.set(true);
  }

  closeMobileNav(): void {
    this.isMobileNavOpen.set(false);
  }
}
