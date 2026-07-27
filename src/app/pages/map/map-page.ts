import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { FenceMapWorkspaceComponent } from './map';

@Component({
  selector: 'app-map-page',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FenceMapWorkspaceComponent],
  templateUrl: './map-page.html',
  styleUrl: './map-page.css',
})
export class MapPage {}
