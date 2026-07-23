import { AfterViewInit, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  Bell,
  ChartNoAxesCombined,
  Columns3,
  Cpu,
  createIcons,
  Fence,
  FileChartColumn,
  LayoutDashboard,
  Map,
  PanelTop,
  RadioTower,
  ScrollText,
  Settings,
  TriangleAlert,
  Users,
  Zap,
} from 'lucide';

interface NavigationItem {
  label: string;
  icon: string;
  route?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent implements AfterViewInit {
  activeItem = 'Dashboard';

  readonly items: NavigationItem[] = [
    { label: 'Dashboard', icon: 'layout-dashboard', route: '/' },
    { label: 'Virtual Fence', icon: 'fence', route: '/virtual-fence' },
    { label: 'Map', icon: 'map', route: '/map' },
    { label: 'Historical Analysis', icon: 'chart-no-axes-combined' },
    { label: 'Alerts', icon: 'triangle-alert' },
    { label: 'Notifications', icon: 'bell' },
    { label: 'Fence Management', icon: 'panel-top' },
    { label: 'Section Management', icon: 'columns-3' },
    { label: 'Device Management', icon: 'cpu' },
    { label: 'Gateway Management', icon: 'radio-tower' },
    { label: 'User Management', icon: 'users' },
    { label: 'Reports', icon: 'file-chart-column' },
    { label: 'Audit Logs', icon: 'scroll-text' },
    { label: 'System Configuration', icon: 'settings' },
  ];

  ngAfterViewInit(): void {
    createIcons({
      icons: { Bell, ChartNoAxesCombined, Columns3, Cpu, Fence, FileChartColumn, LayoutDashboard, Map, PanelTop, RadioTower, ScrollText, Settings, TriangleAlert, Users, Zap },
      attrs: { 'stroke-width': 1.7, width: 17, height: 17 },
    });
  }
}
