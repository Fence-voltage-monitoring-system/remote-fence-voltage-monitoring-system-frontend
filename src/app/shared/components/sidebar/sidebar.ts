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
    { label: 'Dashboard', icon: 'layout-dashboard', route: '/dashboard' },
    { label: 'Live View', icon: 'fence', route: '/virtual-fence' },
    { label: 'Map', icon: 'map', route: '/map' },
    { label: 'Historical Analysis', icon: 'chart-no-axes-combined', route: '/historical-analysis' },
    { label: 'Alerts', icon: 'triangle-alert', route: '/alerts' },
    { label: 'Notifications', icon: 'bell', route: '/notifications' },
    { label: 'Fence Management', icon: 'panel-top', route: '/fences' },
    { label: 'Section Management', icon: 'columns-3', route: '/sections' },
    { label: 'Device Management', icon: 'cpu', route: '/devices' },
    { label: 'Gateway Management', icon: 'radio-tower', route: '/gateways' },
    { label: 'User Management', icon: 'users', route: '/users' },
    { label: 'Reports', icon: 'file-chart-column', route: '/reports' },
    { label: 'Audit Logs', icon: 'scroll-text', route: '/audit-logs' },
    { label: 'System Configuration', icon: 'settings', route: '/configuration' },
  ];

  ngAfterViewInit(): void {
    createIcons({
      icons: { Bell, ChartNoAxesCombined, Columns3, Cpu, Fence, FileChartColumn, LayoutDashboard, Map, PanelTop, RadioTower, ScrollText, Settings, TriangleAlert, Users, Zap },
      attrs: { 'stroke-width': 1.7, width: 17, height: 17 },
    });
  }
}
