import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

type Theme = 'dark' | 'light' | 'system';
type TextSize = 'small' | 'default' | 'large';
type Density = 'comfortable' | 'compact';

interface AppearancePreferences {
  theme: Theme;
  accent: string;
  textSize: TextSize;
  density: Density;
  reducedMotion: boolean;
  highContrast: boolean;
}

@Component({
  selector: 'app-appearance-page',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent],
  templateUrl: './appearance.html',
  styleUrl: './appearance.css',
})
export class AppearancePage {
  private readonly storageKey = 'dwc-appearance-preferences';
  readonly themes: { value: Theme; name: string; description: string }[] = [
    { value: 'dark', name: 'Dark', description: 'Optimized for control rooms' },
    { value: 'light', name: 'Light', description: 'Clear in bright environments' },
    { value: 'system', name: 'System', description: 'Match this device' },
  ];
  readonly accents = [
    { name: 'Forest', value: '#4ee672' },
    { name: 'Emerald', value: '#22c98b' },
    { name: 'Ocean', value: '#42a5f5' },
    { name: 'Amber', value: '#f5b942' },
  ];
  preferences: AppearancePreferences = this.loadPreferences();
  saved = false;

  constructor() { this.applyPreferences(); }

  setTheme(theme: Theme): void { this.preferences.theme = theme; this.changed(); }
  setAccent(accent: string): void { this.preferences.accent = accent; this.changed(); }
  setTextSize(textSize: TextSize): void { this.preferences.textSize = textSize; this.changed(); }
  setDensity(density: Density): void { this.preferences.density = density; this.changed(); }
  toggleMotion(): void { this.preferences.reducedMotion = !this.preferences.reducedMotion; this.changed(); }
  toggleContrast(): void { this.preferences.highContrast = !this.preferences.highContrast; this.changed(); }

  reset(): void {
    this.preferences = this.defaults();
    this.changed();
  }

  private changed(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    this.applyPreferences();
    this.saved = true;
    window.setTimeout(() => this.saved = false, 1800);
  }

  private applyPreferences(): void {
    const root = document.documentElement;
    root.dataset['theme'] = this.preferences.theme;
    root.dataset['textSize'] = this.preferences.textSize;
    root.dataset['density'] = this.preferences.density;
    root.dataset['highContrast'] = String(this.preferences.highContrast);
    root.dataset['reducedMotion'] = String(this.preferences.reducedMotion);
    root.style.setProperty('--accent-color', this.preferences.accent);
  }

  private loadPreferences(): AppearancePreferences {
    try { return { ...this.defaults(), ...JSON.parse(localStorage.getItem(this.storageKey) ?? '{}') }; }
    catch { return this.defaults(); }
  }

  private defaults(): AppearancePreferences {
    return { theme: 'dark', accent: '#4ee672', textSize: 'default', density: 'comfortable', reducedMotion: false, highContrast: false };
  }
}
