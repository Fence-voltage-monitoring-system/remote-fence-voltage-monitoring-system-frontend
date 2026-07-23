import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';
import { BellRing, ChevronDown, CircleHelp, createElement, KeyRound, LogOut, Palette, Settings, ShieldCheck, UserRound } from 'lucide';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenuComponent implements AfterViewInit {
  @Output() readonly signOut = new EventEmitter<void>();
  open = false;

  private readonly icons = { UserRound, Settings, BellRing, ShieldCheck, KeyRound, Palette, CircleHelp, LogOut, ChevronDown };

  constructor(private readonly host: ElementRef<HTMLElement>) {}

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
