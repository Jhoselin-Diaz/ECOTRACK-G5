import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../service/auth.service';

interface MenuItem {
  icon: string;
  label: string;
  path: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIconModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit {

  esAdmin = false;

  menuItems: MenuItem[] = [
    {
      icon: 'home',
      label: 'Inicio',
      path: '/inicio'
    },
    {
      icon: 'home_work',
      label: 'Servicio/Vivienda',
      path: '/servicio-vivienda'
    },
    {
      icon: 'directions_car',
      label: 'Coche',
      path: '/coche'
    },
    {
      icon: 'directions_bus',
      label: 'Autobús',
      path: '/autobus'
    },
    {
      icon: 'bolt',
      label: 'Electrodomésticos',
      path: '/electrodomestico'
    },
    {
      icon: 'checkroom',
      label: 'Ropa',
      path: '/ropa'
    },
    {
      icon: 'restaurant',
      label: 'Alimentos',
      path: '/alimentos'
    },
    {
      icon: 'bar_chart',
      label: 'Resultados',
      path: '/resultados'
    }
  ];

  private titles: Record<string, string> = {
    '/inicio': 'Inicio',
    '/servicio-vivienda': 'Servicio / Vivienda',
    '/coche': 'Coche',
    '/autobus': 'Autobús',
    '/electrodomestico': 'Electrodomésticos',
    '/ropa': 'Ropa',
    '/alimentos': 'Alimentos',
    '/resultados': 'Resultados',
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

  ngOnInit(): void {
    const roles = this.authService.getRoles();
    this.esAdmin = roles.some(r => {
      const roleStr = String(r).toUpperCase().trim();
      return roleStr === 'ROLE_ADMIN' || roleStr === 'ADMIN';
    });
  }

  get pageTitle(): string {
    const path = this.router.url
      .split('?')[0]
      .split('#')[0];

    return this.titles[path] ?? 'Inicio';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
