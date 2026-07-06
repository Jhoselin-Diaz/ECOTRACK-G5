import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { DetalleHuellaDTO, CategoriaProporcional, RegistroDetalle } from '../../../../model/huella.model';

@Component({
  selector: 'app-detalle-huella-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule
  ],
  templateUrl: './detalle-huella-dialog.component.html',
  styleUrl: './detalle-huella-dialog.component.css'
})
export class DetalleHuellaDialogComponent {
  categorias: CategoriaProporcional[] = [];
  subRegistros: RegistroDetalle[] = [];
  displayedColumns: string[] = ['categoria', 'actividad', 'valor'];

  getCategoriaClave(catId: string): string {
    switch (catId) {
      case '1': return 'Alimento';
      case '2': return 'Electrodoméstico';
      case '3': return 'Ropa';
      case '4': return 'Coche';
      case '5': return 'Autobús';
      case '6': return 'Servicio y Vivienda';
      default: return 'Otros';
    }
  }

  constructor(
    public dialogRef: MatDialogRef<DetalleHuellaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DetalleHuellaDTO
  ) {
    if (this.data) {
      const total = this.data.totalKgCO2;
      const totalEmisiones = total || 1; // evitar divisiones por cero
      const consumos = this.data.consumosOriginales || [];

      // Inicializamos sumatorias para las 6 categorías reales
      const acumuladoPorCategoria: Record<string, number> = {
        'Coche': 0,
        'Alimento': 0,
        'Servicio y Vivienda': 0,
        'Electrodoméstico': 0,
        'Autobús': 0,
        'Ropa': 0
      };

      // Acumulamos emisiones reales de la base de datos
      consumos.forEach(c => {
        const catClave = this.getCategoriaClave(c.categoria || '');
        if (catClave in acumuladoPorCategoria) {
          acumuladoPorCategoria[catClave] += c.totalKgCO2 || 0;
        }
      });

      // Se completa las 6 categorías con porcentajes dinámicos y valores reales
      this.categorias = [
        { nombre: 'Coche', porcentaje: Number(((acumuladoPorCategoria['Coche'] / totalEmisiones) * 100).toFixed(1)), valor: acumuladoPorCategoria['Coche'], icon: 'directions_car', colorClass: 'bar-coche' },
        { nombre: 'Alimento', porcentaje: Number(((acumuladoPorCategoria['Alimento'] / totalEmisiones) * 100).toFixed(1)), valor: acumuladoPorCategoria['Alimento'], icon: 'restaurant', colorClass: 'bar-alimento' },
        { nombre: 'Servicio y Vivienda', porcentaje: Number(((acumuladoPorCategoria['Servicio y Vivienda'] / totalEmisiones) * 100).toFixed(1)), valor: acumuladoPorCategoria['Servicio y Vivienda'], icon: 'home', colorClass: 'bar-vivienda' },
        { nombre: 'Electrodoméstico', porcentaje: Number(((acumuladoPorCategoria['Electrodoméstico'] / totalEmisiones) * 100).toFixed(1)), valor: acumuladoPorCategoria['Electrodoméstico'], icon: 'bolt', colorClass: 'bar-electro' },
        { nombre: 'Autobús', porcentaje: Number(((acumuladoPorCategoria['Autobús'] / totalEmisiones) * 100).toFixed(1)), valor: acumuladoPorCategoria['Autobús'], icon: 'directions_bus', colorClass: 'bar-autobus' },
        { nombre: 'Ropa', porcentaje: Number(((acumuladoPorCategoria['Ropa'] / totalEmisiones) * 100).toFixed(1)), valor: acumuladoPorCategoria['Ropa'], icon: 'checkroom', colorClass: 'bar-ropa' }
      ];

      // Poblamos dinámicamente la tabla inferior de actividades a partir de consumos reales
      this.subRegistros = consumos.map(c => ({
        categoria: this.getCategoriaClave(c.categoria || ''),
        actividad: c.actividad || 'Actividad registrada',
        valor: c.totalKgCO2 || 0
      }));
    }
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
