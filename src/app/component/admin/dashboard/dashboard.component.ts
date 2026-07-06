import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { forkJoin } from 'rxjs';
import { AdminDashboardService } from '../../../service/admin-dashboard.service';
import { ConsumoService } from '../../../service/consumo.service';
import { UsuarioService } from '../../../service/usuario.service';
import { DashboardResumenDTO, CategoriaHuellaDTO, UsuarioActivoDTO, UsuarioHuellaTotalDTO, EvolucionHuellaDTO } from '../../../model/dashboard.model';
import { UsuarioResponseDTO } from '../../../model/usuario.model';
import { Consumo } from '../../../model/consumo.model';

interface SvgPoint {
  x: number;
  y: number;
  label: string;
  value: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule
  ],
  providers: [DecimalPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  resumen: DashboardResumenDTO = {
    totalUsuarios: 0,
    totalConsumos: 0,
    huellaTotal: 0,
    huellaPromedio: 0
  };

  huellaCategorias: CategoriaHuellaDTO[] = [];
  usuariosActivos: UsuarioActivoDTO[] = [];
  usuariosMayorHuella: UsuarioHuellaTotalDTO[] = [];
  usuariosMayorHuellaOriginal: UsuarioHuellaTotalDTO[] = [];
  evolucionHuella: EvolucionHuellaDTO[] = [];

  puntosGrafico: SvgPoint[] = [];
  polylinePointsStr = '';
  areaPointsStr = '';
  maxEmisionEvolucion = 1;
  svgWidth = 500;
  svgHeight = 200;
  paddingLeft = 50;
  paddingRight = 20;
  paddingTop = 20;
  paddingBottom = 30;

  tooltipActivo: SvgPoint | null = null;
  tooltipX = 0;
  tooltipY = 0;

  filtroImpacto: 'MAYOR' | 'MENOR' = 'MAYOR';
  cargando = true;
  errorCarga = false;

  columnasActivos = ['index', 'usuario', 'registros', 'ultimoRegistro'];
  columnasHuella = ['index', 'usuario', 'huella'];

  private nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  constructor(
    private dashboardService: AdminDashboardService,
    private consumoService: ConsumoService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
    this.cargarDatosDashboard();
  }

  cargarDatosDashboard(): void {
    this.cargando = true;
    this.errorCarga = false;

    forkJoin({
      usuarios: this.usuarioService.listarUsuarios(),
      consumos: this.consumoService.listar(),
      factores: this.dashboardService.obtenerHuellaCategorias()
    }).subscribe({
      next: (res) => {
        const usuariosRaw: any[] = res.usuarios || [];
        const listaConsumos: Consumo[] = res.consumos || [];

        const listaFactores: any[] = (res as any).factores || [];

        // Filtro de admin
        const listaUsuarios = usuariosRaw.filter(usr => {
          const rolRaw = usr.rol || usr.idRol || (usr.roles && usr.roles[0]) || '';
          const rolString = String(rolRaw).trim().toLowerCase();
          if (rolString === '1' || rolString.includes('admin')) {
            return false;
          }
          return true;
        });

        // METRICAS SUPERIORES REALES
        this.resumen.totalUsuarios = listaUsuarios.length;
        this.resumen.totalConsumos = listaConsumos.length;
        this.resumen.huellaTotal = listaConsumos.reduce((sum, c) => sum + (c.emisionesKgCO2 || 0), 0);
        this.resumen.huellaPromedio = this.resumen.totalUsuarios > 0
          ? this.resumen.huellaTotal / this.resumen.totalUsuarios
          : 0;

        // Usuarios por huella de carbono
        this.usuariosMayorHuellaOriginal = listaUsuarios.map(usr => {
          const idUsuarioActual = usr.idUsuario || usr.id;
          const huellaUsuario = listaConsumos
            .filter(c => c.usuarioId === idUsuarioActual)
            .reduce((sum, c) => sum + (c.emisionesKgCO2 || 0), 0);

          return {
            usuarioId: idUsuarioActual,
            username: usr.username || 'Usuario',
            correo: usr.correo || usr.email || '',
            totalKgCO2: huellaUsuario
          };
        });

        // Usuarios más activos
        this.usuariosActivos = listaUsuarios.map(usr => {
          const idUsuarioActual = usr.idUsuario || usr.id;
          const consumosUsuario = listaConsumos.filter(c => c.usuarioId === idUsuarioActual);

          let ultimoRegStr = '-';
          if (consumosUsuario.length > 0) {
            const fechas = consumosUsuario
              .map(c => c.fechaRegistro ? new Date(c.fechaRegistro).getTime() : 0)
              .filter(t => t > 0);
            if (fechas.length > 0) {
              ultimoRegStr = new Date(Math.max(...fechas)).toISOString();
            }
          }

          return {
            usuarioId: idUsuarioActual,
            username: usr.username || 'Usuario',
            correo: usr.correo || usr.email || '',
            totalRegistros: consumosUsuario.length,
            ultimoRegistro: ultimoRegStr
          };
        })
          .sort((a, b) => b.totalRegistros - a.totalRegistros)
          .slice(0, 5);


        if (listaConsumos.length > 0) {
          console.group('%c [DIAGNÓSTICO] Análisis de Consumo en Tiempo de Ejecución ', 'background: #222; color: #bada55; font-size: 12px;');
          console.log('Total registros de consumo recibidos:', listaConsumos.length);
          console.table(listaConsumos.slice(0, 5));

          const primerConflictivo = listaConsumos.find(c => {
            const rawId = c.categoriaId ?? (c as any).idCategoria ?? c.factor?.categoriaId ?? c.factor?.idCategoria ?? (c as any).categoria?.id ?? (c as any).categoria?.idCategoria;
            const numId = rawId ? Number(rawId) : 0;
            return !numId || numId < 1 || numId > 6;
          });

          if (primerConflictivo) {
            console.warn('Primer registro de consumo conflictivo detectado:', primerConflictivo);
            console.log('Llaves del registro (runtime keys):', Object.keys(primerConflictivo));
            console.log('Prototipo del objeto:', Object.getPrototypeOf(primerConflictivo));

            const camposCategoria = ['categoriaId', 'idCategoria', 'categoria_id', 'categoria', 'factor', 'factorId', 'emisionesKgCO2'];
            camposCategoria.forEach(key => {
              const valor = (primerConflictivo as any)[key];
              console.log(`Propiedad [${key}]:`, {
                valor: valor,
                tipo: typeof valor,
                constructor: valor && typeof valor === 'object' ? valor.constructor.name : 'N/A'
              });

              if (valor && typeof valor === 'object') {
                console.log(`  -> Sub-llaves de [${key}]:`, Object.keys(valor));
                if (key === 'factor' || key === 'categoria') {
                  const subCampos = ['id', 'idFactor', 'factorId', 'categoriaId', 'idCategoria', 'categoria_id', 'categoria'];
                  subCampos.forEach(subKey => {
                    const subValor = valor[subKey];
                    console.log(`     -> Propiedad interna [${subKey}]:`, {
                      valor: subValor,
                      tipo: typeof subValor
                    });
                  });
                }
              }
            });
          } else {
            console.log('No se encontraron consumos con IDs de categoría fuera del rango 1-6.');
          }
          console.groupEnd();
        }

        // CATEGORÍAS EN VIVO - DETECCIÓN NATIVA POR ID DE TU MODELO
        const mapaCategorias: { [key: number]: string } = {
          1: 'Alimento',
          2: 'Electrodomésticos',
          3: 'Ropa',
          4: 'Coche',
          5: 'Autobús',
          6: 'Servicio y Vivienda'
        };

        const totalesPorCategoria: { [key: string]: number } = {
          'Alimento': 0, 'Electrodomésticos': 0, 'Ropa': 0, 'Coche': 0, 'Autobús': 0, 'Servicio y Vivienda': 0
        };

        listaConsumos.forEach(c => {

          const catIdRaw =
            c.categoriaId ??
            (c as any).idCategoria ??
            (c as any).categoria_id ??
            c.factor?.categoriaId ??
            c.factor?.idCategoria ??
            (c as any).factor?.categoria_id ??
            (c as any).categoria?.id ??
            (c as any).categoria?.idCategoria ??
            (c as any).factor?.categoria?.id ??
            (c as any).factor?.categoria?.idCategoria ??
            c.factorId ??
            (c as any).idFactor ??
            0;

          const catId = typeof catIdRaw === 'string' ? parseInt(catIdRaw, 10) : Number(catIdRaw);

          const nombreCatFinal = mapaCategorias[catId];

          const emisionesRaw = c.emisionesKgCO2 ?? (c as any).emisiones_kg_co2 ?? 0;
          const emisiones = typeof emisionesRaw === 'string' ? parseFloat(emisionesRaw) : Number(emisionesRaw);

          if (nombreCatFinal && totalesPorCategoria[nombreCatFinal] !== undefined) {
            totalesPorCategoria[nombreCatFinal] += (isNaN(emisiones) ? 0 : emisiones);
          }
        });

        this.huellaCategorias = Object.keys(totalesPorCategoria).map(key => {
          const totalCat = totalesPorCategoria[key];
          const porcentajeCat = this.resumen.huellaTotal > 0 ? (totalCat / this.resumen.huellaTotal) * 100 : 0;
          return {
            categoria: key,
            totalKgCO2: totalCat,
            porcentaje: porcentajeCat
          };
        }).sort((a, b) => b.totalKgCO2 - a.totalKgCO2);
        // EVOLUCIÓN MENSUAL
        const registrosPorMes: { [key: string]: { anio: number, mes: number, totalKgCO2: number } } = {};

        listaConsumos.forEach(c => {
          if (c.fechaRegistro) {
            const fecha = new Date(c.fechaRegistro);
            const anio = fecha.getFullYear();
            const mes = fecha.getMonth() + 1;
            const clave = `${anio}-${mes}`;

            if (!registrosPorMes[clave]) {
              registrosPorMes[clave] = { anio, mes, totalKgCO2: 0 };
            }
            registrosPorMes[clave].totalKgCO2 += (c.emisionesKgCO2 || 0);
          }
        });

        this.evolucionHuella = Object.values(registrosPorMes)
          .sort((a, b) => (a.anio - b.anio) || (a.mes - b.mes))
          .map(item => ({
            anio: item.anio,
            mes: item.mes,
            totalKgCO2: item.totalKgCO2
          }))
          .slice(-6);

        this.ordenarUsuariosHuella();
        this.generarPuntosGrafico();
        this.cargando = false;
      },
      error: (err) => {
        console.error('CRÍTICO: Error de conexión o mapeo con la Base de Datos:', err);
        this.errorCarga = true;
        this.cargando = false;
      }
    });
  }

  cambiarFiltroImpacto(filtro: 'MAYOR' | 'MENOR'): void {
    this.filtroImpacto = filtro;
    this.ordenarUsuariosHuella();
  }

  ordenarUsuariosHuella(): void {
    const datos = [...this.usuariosMayorHuellaOriginal];
    if (this.filtroImpacto === 'MAYOR') {
      datos.sort((a, b) => b.totalKgCO2 - a.totalKgCO2);
    } else {
      datos.sort((a, b) => a.totalKgCO2 - b.totalKgCO2);
    }
    this.usuariosMayorHuella = datos;
  }

  generarPuntosGrafico(): void {
    if (this.evolucionHuella.length === 0) {
      this.puntosGrafico = [];
      this.polylinePointsStr = '';
      this.areaPointsStr = '';
      return;
    }

    const n = this.evolucionHuella.length;
    this.maxEmisionEvolucion = Math.max(...this.evolucionHuella.map(e => e.totalKgCO2));
    if (this.maxEmisionEvolucion <= 0) {
      this.maxEmisionEvolucion = 1;
    }

    const plotWidth = this.svgWidth - this.paddingLeft - this.paddingRight;
    const plotHeight = this.svgHeight - this.paddingTop - this.paddingBottom;

    this.puntosGrafico = this.evolucionHuella.map((item, index) => {
      const x = this.paddingLeft + (index * (plotWidth / Math.max(1, n - 1)));
      const y = this.svgHeight - this.paddingBottom - ((item.totalKgCO2 / this.maxEmisionEvolucion) * plotHeight);

      const label = `${this.nombresMeses[(item.mes - 1) % 12]} ${item.anio}`;

      return {
        x,
        y,
        label,
        value: item.totalKgCO2
      };
    });

    this.polylinePointsStr = this.puntosGrafico.map(p => `${p.x},${p.y}`).join(' ');

    if (this.puntosGrafico.length > 0) {
      const first = this.puntosGrafico[0];
      const last = this.puntosGrafico[this.puntosGrafico.length - 1];
      this.areaPointsStr = `${first.x},${this.svgHeight - this.paddingBottom} ` +
        this.polylinePointsStr +
        ` ${last.x},${this.svgHeight - this.paddingBottom}`;
    } else {
      this.areaPointsStr = '';
    }
  }

  mostrarTooltip(point: SvgPoint): void {
    this.tooltipActivo = point;
    this.tooltipX = point.x;
    this.tooltipY = point.y - 12;
  }

  ocultarTooltip(): void {
    this.tooltipActivo = null;
  }
}
