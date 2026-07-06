import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Consumo } from '../../../model/consumo.model';
import { FactorEmision } from '../../../model/factor-emision.model';
import { RegistroDashboard, CategoriaDashboard } from '../../../model/dashboard.model';
import { ConsumoService } from '../../../service/consumo.service';
import { CategoriaService } from '../../../service/categoria.service';
import { FactorEmisionService } from '../../../service/factor-emision.service';
import { UsuarioService } from '../../../service/usuario.service';
import { EQUIVALENCIAS } from '../../../Equivalencia/equivalencias.constants';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';


@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './resultados.component.html',
  styleUrl: './resultados.component.css'
})
export class ResultadosComponent {
  tipoPeriodo = 'dia';
  formulario = {
    fechaDia: null as Date | null,
    mes: '',
    anio: ''
  };

  cargando = false;
  error = '';
  dashboardVisible = false;
  totalGeneral = 0;
  categoriasFiltradas: CategoriaDashboard[] = [];

  equivalencias = {
    arboles: 0,
    kilometros: 0,
    electricidad: 0
  };

  // HU31 — Alerta Visual de Consumo Excesivo
  clasificacionGlobal = '';
  mensajeAlerta = '';
  colorAlertaClass = '';

  readonly meses = [
    { valor: '1', nombre: 'Enero' }, { valor: '2', nombre: 'Febrero' },
    { valor: '3', nombre: 'Marzo' }, { valor: '4', nombre: 'Abril' },
    { valor: '5', nombre: 'Mayo' }, { valor: '6', nombre: 'Junio' },
    { valor: '7', nombre: 'Julio' }, { valor: '8', nombre: 'Agosto' },
    { valor: '9', nombre: 'Septiembre' }, { valor: '10', nombre: 'Octubre' },
    { valor: '11', nombre: 'Noviembre' }, { valor: '12', nombre: 'Diciembre' }
  ];

  readonly anios = this.generarAnios();

  constructor(
    private consumoService: ConsumoService,
    private categoriaService: CategoriaService,
    private factorService: FactorEmisionService,
    private usuarioService: UsuarioService
  ) { }

  generarAnios(): number[] {
    const anioActual = new Date().getFullYear();
    const anios: number[] = [];
    for (let i = anioActual; i >= anioActual - 10; i--) {
      anios.push(i);
    }
    return anios;
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get formularioValido(): boolean {
    if (this.tipoPeriodo === 'dia') return !!this.formulario.fechaDia;
    if (this.tipoPeriodo === 'mes') return !!(this.formulario.mes && this.formulario.anio);
    if (this.tipoPeriodo === 'anio') return !!this.formulario.anio;
    return false;
  }

  generarResultados(): void {
    if (!this.formularioValido) return;

    this.cargando = true;
    this.error = '';
    this.dashboardVisible = false;

    forkJoin({
      consumos: this.consumoService.listarFiltro(),
      categorias: this.categoriaService.listar(),
      factores1: this.factorService.listarPorCategoria(1),
      factores2: this.factorService.listarPorCategoria(2),
      factores3: this.factorService.listarPorCategoria(3),
      factores4: this.factorService.listarPorCategoria(4),
      factores5: this.factorService.listarPorCategoria(5),
      factores6: this.factorService.listarPorCategoria(6)
    }).subscribe({
      next: ({ consumos, categorias, factores1, factores2, factores3, factores4, factores5, factores6 }) => {

        const factorToCategoryMap = new Map<number, number>();
        const registrarFactores = (factores: FactorEmision[], catId: number) => {
          factores.forEach((f) => {
            const fId = f.id ?? f.idFactor ?? f.factorId;
            if (fId !== undefined) factorToCategoryMap.set(fId, catId);
          });
        };
        registrarFactores(factores1, 1);
        registrarFactores(factores2, 2);
        registrarFactores(factores3, 3);
        registrarFactores(factores4, 4);
        registrarFactores(factores5, 5);
        registrarFactores(factores6, 6);

        const usuarioId = this.usuarioService.obtenerUsuarioId();

        const consumosFiltrados = consumos.filter((c: Consumo) => {
          const consumoUsuarioId = c.usuarioId;

          if (usuarioId > 0 && consumoUsuarioId !== undefined && consumoUsuarioId !== null) {
            if (Number(consumoUsuarioId) !== Number(usuarioId)) return false;
          }

          const fechaStr = this.obtenerFecha(c);
          if (!fechaStr || fechaStr === '-') return false;

          const parts = fechaStr.split('-');
          if (parts.length < 3) return false;

          const anioC = parseInt(parts[0], 10);
          const mesC = parseInt(parts[1], 10);

          if (this.tipoPeriodo === 'dia') {
            if (!this.formulario.fechaDia) return false;
            return fechaStr === this.formatearFecha(this.formulario.fechaDia);
          }

          if (this.tipoPeriodo === 'mes') {
            return anioC === parseInt(this.formulario.anio, 10) && mesC === parseInt(this.formulario.mes, 10);
          }

          if (this.tipoPeriodo === 'anio') {
            return anioC === parseInt(this.formulario.anio, 10);
          }

          return false;
        });

        const grouped = new Map<number, Consumo[]>();

        consumosFiltrados.forEach((c) => {
          const fId = c.factorId ?? c.factor?.id;
          const catId = (fId ? factorToCategoryMap.get(fId) : undefined) ?? c.categoriaId ?? c.factor?.categoriaId;

          if (catId) {
            if (!grouped.has(catId)) grouped.set(catId, []);
            grouped.get(catId)!.push(c);
          }
        });

        const iconos: Record<number, string> = {
          1: '🥕', 2: '💡', 3: '👕', 4: '🚗', 5: '🚌', 6: '🏠'
        };

        const resultCategories: CategoriaDashboard[] = [];
        let sumTotalGeneral = 0;

        categorias.forEach((cat) => {
          const catId = cat.id ?? cat.idCategoria ?? 0;
          const consumosCat = grouped.get(catId) || [];

          if (consumosCat.length > 0) {
            let totalCatCo2 = 0;
            const registros = consumosCat.map((c) => {
              const co2Val = Number(c.emisionesKgCO2 ?? 0);
              totalCatCo2 += co2Val;
              return {
                nombre: this.obtenerDetalleNombre(c, catId),
                cantidad: c.cantidad ?? 0,
                co2: co2Val,
                fecha: this.obtenerFecha(c)
              };
            });

            sumTotalGeneral += totalCatCo2;

            resultCategories.push({
              id: catId,
              nombre: cat.nombre ?? cat.nombreCategoria ?? 'Categoría',
              icono: iconos[catId],
              registros,
              totalCo2: totalCatCo2
            });
          }
        });

        this.categoriasFiltradas = resultCategories;
        this.totalGeneral = sumTotalGeneral;

        this.equivalencias = {
          arboles: this.totalGeneral / EQUIVALENCIAS.CO2_POR_ARBOL_ANIO,
          kilometros: this.totalGeneral / EQUIVALENCIAS.CO2_POR_KILOMETRO_COCHE,
          electricidad: this.totalGeneral / EQUIVALENCIAS.CO2_POR_KWH
        };

        if (this.totalGeneral < 100) {
          this.clasificacionGlobal = 'EFICIENTE';
          this.mensajeAlerta = 'Consumo Óptimo';
          this.colorAlertaClass = 'alerta-eficiente';
        } else if (this.totalGeneral <= 1000) {
          this.clasificacionGlobal = 'MODERADO';
          this.mensajeAlerta = 'Monitoreo Continuo. Intenta reducir tu consumo';
          this.colorAlertaClass = 'alerta-moderado';
        } else {
          this.clasificacionGlobal = 'CRÍTICO';
          this.mensajeAlerta = 'Mitigación Urgente. Este registro supera el promedio mensual recomendado';
          this.colorAlertaClass = 'alerta-critico';
        }

        this.dashboardVisible = true;
        this.cargando = false;
      },
      error: (err) => {
        console.error('[Resultados] Error crítico de red:', err);
        this.error = 'Ocurrió un error al obtener los consumos registrados en el período. Por favor intente nuevamente.';
        this.cargando = false;
      }
    });
  }

  obtenerDetalleNombre(consumo: Consumo, categoriaId: number): string {
    const detalleVal = (clave: string): string => {
      const detalles = consumo.detalles;
      if (Array.isArray(detalles)) {
        return String(detalles.find((item) => item.clave === clave)?.valor ?? '');
      }
      if (detalles && typeof detalles === 'object') {
        return String((detalles as Record<string, string | number>)[clave] ?? '');
      }
      return '';
    };

    switch (categoriaId) {
      case 1: return detalleVal('Tipo_Alimento') || 'Alimento';
      case 2: return detalleVal('Tipo_Electrodomestico') || 'Electrodoméstico';
      case 3: return detalleVal('Tipo_Prenda') || 'Prenda de ropa';
      case 4: {
        const marca = detalleVal('Marca') || '-';
        const combustible = detalleVal('Tipo_Combustible') || this.obtenerFactorNombre(consumo.factor);
        return `${marca} (${combustible})`;
      }
      case 5: {
        const tipo = detalleVal('Tipo_Transporte') || '-';
        const comb = detalleVal('Tipo_Combustible') || this.obtenerFactorNombre(consumo.factor);
        return `${tipo} (${comb})`;
      }
      case 6: return detalleVal('Tipo_Servicio') || 'Servicio doméstico';
      default: return this.obtenerFactorNombre(consumo.factor) || 'Registro';
    }
  }

  obtenerFecha(consumo: Consumo): string {
    const fecha = consumo.fechaRegistro ?? '-';
    if (fecha === '-') return '-';
    if (typeof fecha === 'string') {
      if (fecha.includes('T')) return fecha.split('T')[0];
      if (fecha.includes(' ')) return fecha.split(' ')[0];
    }
    return fecha;
  }

  obtenerFactorNombre(factor?: FactorEmision): string {
    return factor?.nombre ?? factor?.nombreFactor ?? factor?.descripcion ?? factor?.tipo ?? '';
  }

  exportarDashboard(): void {
    console.log('[Resultados] Exportación iniciada (estructura lista para PDF)');
  }
}
