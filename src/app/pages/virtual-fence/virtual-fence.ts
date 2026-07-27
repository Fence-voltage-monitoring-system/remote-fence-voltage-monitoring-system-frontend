import { Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FenceRouteMapComponent } from './fence-route-map';
import { FenceMonitorComponent, FenceRouteData } from '../dashboard/components/fence-monitor/fence-monitor';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';

@Component({
  selector: 'app-virtual-fence-page',
  imports: [FenceMonitorComponent, FenceRouteMapComponent, HeaderComponent, SidebarComponent],
  templateUrl: './virtual-fence.html',
  styleUrl: './virtual-fence.css',
})
export class VirtualFencePage {
  @ViewChild('routeMapSection') routeMapSection?: ElementRef<HTMLElement>;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly selectedFenceId = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('fenceId') ?? '')),
    { initialValue: '' },
  );
  readonly activeFenceId = signal('monaragala');
  readonly selectedSectionId = signal('');
  selectedFenceRoute?: FenceRouteData;

  constructor() {
    effect(() => {
      const fenceId = this.selectedFenceId();
      if (fenceId) this.activeFenceId.set(fenceId);
    });
  }

  selectFence(fenceId: string): void {
    this.activeFenceId.set(fenceId);
    this.selectedSectionId.set('');
    if (this.selectedFenceId() === fenceId) return;
    void this.router.navigate([], { relativeTo: this.route, queryParams: { fenceId }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  showSectionOnMap(sectionId: string): void {
    this.selectedSectionId.set('');
    requestAnimationFrame(() => {
      this.selectedSectionId.set(sectionId);
      this.routeMapSection?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}
