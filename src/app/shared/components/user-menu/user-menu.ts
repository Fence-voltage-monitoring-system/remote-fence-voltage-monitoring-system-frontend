import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { BellRing, ChevronDown, CircleHelp, createElement, LogOut, Palette, ShieldCheck, UserRound } from 'lucide';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenuComponent implements AfterViewInit {
  @Output() readonly signOut = new EventEmitter<void>();
  open = false;

  private readonly icons = { UserRound, BellRing, ShieldCheck, Palette, CircleHelp, LogOut, ChevronDown };

  constructor(private readonly host: ElementRef<HTMLElement>, private readonly router: Router) {}

  ngAfterViewInit(): void {
    this.host.nativeElement.querySelectorAll<HTMLElement>('[data-menu-icon]').forEach((placeholder) => {
      const name = placeholder.dataset['menuIcon'] as keyof typeof this.icons;
      const icon = this.icons[name];
      if (icon) placeholder.replaceWith(createElement(icon, { width: 17, height: 17, 'stroke-width': 1.7 }));
    });
  }

  toggle(): void {
    this.open = !this.open;
  }

  choose(): void {
    this.open = false;
  }

  navigateTo(route: string): void {
    this.open = false;
    void this.router.navigateByUrl(route);
  }

  requestSignOut(): void {
    this.open = false;
    this.signOut.emit();
  }

  @HostListener('document:click', ['$event'])
  closeWhenClickingOutside(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open = false;
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.open = false;
  }
}
