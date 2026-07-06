import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule
  ],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent {

  summaryCards = [
    {
      icon: 'restaurant',
      title: 'Alimentos',
      description: '2 registros completados esta semana'
    },
    {
      icon: 'directions_car',
      title: 'Transporte',
      description: '2 vehículos registrados'
    },
    {
      icon: 'home_work',
      title: 'Servicios / Vivienda',
      description: '230 kg de CO₂ equivalente registrado este mes'
    }
  ];

  steps = [
    {
      icon: 'edit_note',
      title: 'Registra tus consumos',
      description:
        'Ingresa tus datos sobre alimentos, transporte, ropa y energía.'
    },
    {
      icon: 'calculate',
      title: 'Calculamos tu impacto',
      description:
        'EcoTrack procesa tu información y estima tu huella de carbono.'
    },
    {
      icon: 'analytics',
      title: 'Visualiza y mejora',
      description:
        'Revisa resultados y toma decisiones más sostenibles.'
    }
  ];

}
