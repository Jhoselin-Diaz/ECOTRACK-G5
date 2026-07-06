import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../service/auth.service';

interface MenuItem {
  icon: string;
  label: string;
  path: string;
}

@Component({
  selector: 'app-menu-admin',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule
  ],
  templateUrl: './menu-admin.component.html',
  styleUrl: './menu-admin.component.css'
})
export class MenuAdminComponent {
  menuItems: MenuItem[] = [
    {
      icon: 'home',
      label: 'Inicio',
      path: '/admin/inicio'
    },
    {
      icon: 'dashboard',
      label: 'Dashboard',
      path: '/admin/dashboard'
    },
    {
      icon: 'people',
      label: 'Usuarios',
      path: '/admin/usuarios'
    },
    {
      icon: 'eco',
      label: 'Huella Carbono',
      path: '/admin/huella-carbono'
    },
    {
      icon: 'calculate',
      label: 'Factor Emisión',
      path: '/admin/factor-emision'
    }
  ];

  private titles: Record<string, string> = {
    '/admin/inicio': 'Inicio - Administración',
    '/admin/dashboard': 'Dashboard Global',
    '/admin/usuarios': 'Control de Usuarios',
    '/admin/huella-carbono': 'Histórico Global de Huellas',
    '/admin/factor-emision': 'Mantenimiento de Factores de Emisión'
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  get pageTitle(): string {
    const path = this.router.url
      .split('?')[0]
      .split('#')[0];

    return this.titles[path] ?? 'Administración';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
