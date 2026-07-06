import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-inicio',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {
  adminCards = [
    {
      icon: 'people',
      title: 'Gestión de usuarios',
      description: 'Supervisa el registro de usuarios, administra roles y estados de cuenta en el sistema.',
      link: '/admin/usuarios',
      buttonText: 'Administrar'
    },
    {
      icon: 'analytics',
      title: 'Reportes del sistema',
      description: 'Accede a gráficos y consolidados de emisiones de CO₂ global e históricos.',
      link: '/admin/dashboard',
      buttonText: 'Ver Reportes'
    },
    {
      icon: 'settings_suggest',
      title: 'Configuración',
      description: 'Mantén actualizados los factores de emisión por tipo de consumo.',
      link: '/admin/factor-emision',
      buttonText: 'Configurar'
    }
  ];
}
