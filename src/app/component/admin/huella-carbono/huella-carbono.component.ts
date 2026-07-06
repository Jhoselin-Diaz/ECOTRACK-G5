import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../service/auth.service';
import { ConsumoService } from '../../../service/consumo.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DetalleHuellaDTO } from '../../../model/huella.model';
import { environment } from '../../../environments/environment';
import { DetalleHuellaDialogComponent } from './detalle-huella-dialog/detalle-huella-dialog.component';

@Component({
  selector: 'app-admin-huella-carbono',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule
  ],
  templateUrl: './huella-carbono.component.html',
  styleUrl: './huella-carbono.component.css'
})
export class HuellaCarbonoComponent implements OnInit {
  dataSource = new MatTableDataSource<DetalleHuellaDTO>();
  cargando = false;
  errorMessage = '';

  // Filtros
  searchQuery = '';
  filtroAlerta = 'Todos';
  fechaDesde: any = null;
  fechaHasta: any = null;

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private consumoService: ConsumoService,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    const hoy = new Date();
    this.fechaDesde = new Date(hoy.getFullYear(), 0, 1);
    this.fechaHasta = hoy;
    this.aplicarFiltro();
  }

  formatearFecha(fecha: any): string | null {
    if (!fecha) return null;

    if (typeof fecha === 'string' && /^\d{4}-\d{2 }-\d{2}$/.test(fecha)) {
      return fecha;
    }
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  obtenerFecha(c: DetalleHuellaDTO): string {
    const fecha = c.fechaCalculo ?? '-';
    if (fecha === '-') return '-';
    if (typeof fecha === 'string' && fecha.includes('T')) {
      return fecha.split('T')[0];
    }
    if (typeof fecha === 'string' && fecha.includes(' ')) {
      return fecha.split(' ')[0];
    }
    return fecha;
  }

  aplicarFiltro(): void {
    this.cargando = true;
    this.errorMessage = '';

    const desdeStr = this.formatearFecha(this.fechaDesde);
    const hastaStr = this.formatearFecha(this.fechaHasta);

    if (!desdeStr || !hastaStr) {
      console.warn('Búsqueda cancelada: Rango de fechas incompleto o inválido.');
      this.errorMessage = 'Por favor, seleccione un rango de fechas válido (Desde y Hasta) antes de realizar la búsqueda.';
      this.cargando = false;
      return;
    }

    const tokenReal = this.authService.getToken() || '';
    const headers = new HttpHeaders().set('Authorization', 'Bearer ' + tokenReal);

    // Realizamos la llamada al servicio de consumos para obtener la lista plana de consumos de usuarios comunes
    this.consumoService.obtenerHistoricoFiltrado(headers).subscribe({
      next: (respuesta) => {
        const dDesde = new Date(this.fechaDesde);
        dDesde.setHours(0, 0, 0, 0);
        const dHasta = new Date(this.fechaHasta);
        dHasta.setHours(23, 59, 59, 999);

        // 1. Filtramos consumos por rango de fechas y búsqueda de texto
        const consumosFiltrados = respuesta.filter(c => {
          const fechaStr = this.obtenerFecha(c);
          if (!fechaStr || fechaStr === '-') return false;

          const parts = fechaStr.split('-');
          if (parts.length < 3) return false;
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);

          const cDate = new Date(year, month, day);
          const enRango = cDate >= dDesde && cDate <= dHasta;
          if (!enRango) return false;

          // Búsqueda por texto (Usuario o Correo)
          if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase().trim();
            const matchesUser = c.usuario ? c.usuario.toLowerCase().includes(q) : false;
            const matchesEmail = c.correo ? c.correo.toLowerCase().includes(q) : false;
            if (!matchesUser && !matchesEmail) return false;
          }

          return true;
        });

        // 2. Agrupamos consumos por correo y mes/año para acumular emisiones de forma neta
        const agrupado = new Map<string, DetalleHuellaDTO>();

        consumosFiltrados.forEach(c => {
          const fechaStr = this.obtenerFecha(c);
          if (!fechaStr || fechaStr === '-') return;
          const parts = fechaStr.split('-');
          if (parts.length < 2) return;
          const anioMes = `${parts[0]}-${parts[1]}`;
          const mapKey = `${c.correo}_${anioMes}`;

          const mesEvaluado = `${parts[1]}/${parts[0]}`;

          if (!agrupado.has(mapKey)) {
            agrupado.set(mapKey, {
              id: c.id,
              usuario: c.usuario,
              correo: c.correo,
              periodo: '',
              totalKgCO2: 0,
              fechaCalculo: mesEvaluado,
              estado: c.estado || 'Activo',
              consumosOriginales: []
            });
          }

          const registro = agrupado.get(mapKey)!;
          registro.totalKgCO2 += c.totalKgCO2;

          if (c.correo === registro.correo && mesEvaluado === registro.fechaCalculo) {
            registro.consumosOriginales!.push({
              id: c.id,
              categoria: c.categoria,
              actividad: c.actividad,
              totalKgCO2: c.totalKgCO2
            });
          }
        });

        // 3. Mapeamos y clasificamos según las emisiones acumuladas
        const listadoFinal: DetalleHuellaDTO[] = [];
        agrupado.forEach(item => {
          let clasificacion = 'EFICIENTE';
          if (item.totalKgCO2 > 1000) {
            clasificacion = 'CRITICO';
          } else if (item.totalKgCO2 >= 100) {
            clasificacion = 'MODERADO';
          }

          listadoFinal.push({
            id: item.id,
            usuario: item.usuario,
            correo: item.correo,
            periodo: clasificacion,
            totalKgCO2: item.totalKgCO2,
            fechaCalculo: item.fechaCalculo,
            estado: clasificacion === 'CRITICO' ? 'Mitigación Urgente' : (clasificacion === 'EFICIENTE' ? 'Consumo Óptimo' : 'Monitoreo Continuo'),
            consumosOriginales: item.consumosOriginales
          });
        });

        // 4. Filtramos por Nivel de Alerta
        let listadoFiltrado = listadoFinal;
        if (this.filtroAlerta && this.filtroAlerta !== 'Todos') {
          listadoFiltrado = listadoFinal.filter(item => {
            if (this.filtroAlerta === 'CRITICO') return item.totalKgCO2 > 1000;
            if (this.filtroAlerta === 'MODERADO') return item.totalKgCO2 >= 100 && item.totalKgCO2 <= 1000;
            if (this.filtroAlerta === 'EFICIENTE') return item.totalKgCO2 < 100;
            return true;
          });
        }

        this.dataSource.data = listadoFiltrado;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al filtrar histórico:', error);
        this.errorMessage = 'Ocurrió un error al obtener los consumos registrados en el período. Por favor intente nuevamente.';
        this.cargando = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.searchQuery = '';
    this.filtroAlerta = 'Todos';
    const hoy = new Date();
    this.fechaDesde = new Date(hoy.getFullYear(), 0, 1);
    this.fechaHasta = hoy;
    this.errorMessage = '';
    this.aplicarFiltro();
  }

  verDetalle(row: DetalleHuellaDTO): void {
    this.dialog.open(DetalleHuellaDialogComponent, {
      data: row,
      width: '650px',
      maxWidth: '90vw',
      disableClose: false
    });
  }
}
