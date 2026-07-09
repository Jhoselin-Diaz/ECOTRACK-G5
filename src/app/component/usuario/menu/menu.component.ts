import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../service/auth.service';
import { UsuarioService } from '../../../service/usuario.service';
import { NotificacionUsuario } from '../../../model/usuario.model';

interface MenuItem {
  icon: string;
  label: string;
  path: string;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatButtonModule
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit, OnDestroy {


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

  notificaciones: NotificacionUsuario[] = [];
  notificacionesInterval: any;
  userId = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    const roles = this.authService.getRoles();
    this.esAdmin = roles.some(r => {
      const roleStr = String(r).toUpperCase().trim();
      return roleStr === 'ROLE_ADMIN' || roleStr === 'ADMIN';
    });

    this.userId = this.usuarioService.obtenerUsuarioId();
    if (this.userId > 0) {
      this.cargarNotificaciones();
      this.notificacionesInterval = setInterval(() => {
        this.cargarNotificaciones();
      }, 30000);
    }
  }

  ngOnDestroy(): void {
    if (this.notificacionesInterval) {
      clearInterval(this.notificacionesInterval);
    }
  }

  cargarNotificaciones(): void {
    this.usuarioService.obtenerNotificacionesNoLeidas(this.userId).subscribe({
      next: (data) => {
        this.notificaciones = data;
      },
      error: (err) => {
        console.error('[MenuComponent] Error fetching notifications:', err);
      }
    });
  }

  marcarLeida(event: MouseEvent, notificationId: number): void {
    event.stopPropagation();
    this.usuarioService.marcarNotificacionComoLeida(notificationId).subscribe({
      next: () => {
        this.notificaciones = this.notificaciones.filter(n => n.id !== notificationId);
      },
      error: (err) => {
        console.error('[MenuComponent] Error marking notification as read:', err);
      }
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
