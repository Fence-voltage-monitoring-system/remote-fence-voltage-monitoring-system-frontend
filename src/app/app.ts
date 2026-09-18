import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  host: { class: 'block min-h-screen' },
})
export class App {
  constructor() {
    this.restoreAppearancePreferences();
  }

  private restoreAppearancePreferences(): void {
    try {
      const raw = localStorage.getItem('dwc-appearance-preferences');
      if (raw) {
        const prefs = JSON.parse(raw);
        const root = document.documentElement;
        let activeTheme = prefs.theme;
        if (activeTheme === 'system') {
          activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        if (activeTheme) root.dataset['theme'] = activeTheme;
        if (prefs.theme) root.dataset['userThemeSetting'] = prefs.theme;
        if (prefs.textSize) root.dataset['textSize'] = prefs.textSize;
        if (prefs.density) root.dataset['density'] = prefs.density;
        if (prefs.highContrast !== undefined) root.dataset['highContrast'] = String(prefs.highContrast);
        if (prefs.reducedMotion !== undefined) root.dataset['reducedMotion'] = String(prefs.reducedMotion);
        if (prefs.accent) root.style.setProperty('--accent-color', prefs.accent);
      }
    } catch (e) {}
  }
}
