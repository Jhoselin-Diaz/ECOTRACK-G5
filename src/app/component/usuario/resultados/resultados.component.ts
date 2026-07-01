import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Consumo } from '../../../model/consumo.model';
import { Categoria } from '../../../model/categoria.model';
import { FactorEmision } from '../../../model/factor-emision.model';
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

interface RegistroDashboard {
  nombre: string;
  cantidad: number;
  co2: number;
  fecha: string;
}

interface CategoriaDashboard {
  id: number;
  nombre: string;
  icono: string;
  registros: RegistroDashboard[];
  totalCo2: number;
}

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

  readonly meses = [
    { valor: '1', nombre: 'Enero' },
    { valor: '2', nombre: 'Febrero' },
    { valor: '3', nombre: 'Marzo' },
    { valor: '4', nombre: 'Abril' },
    { valor: '5', nombre: 'Mayo' },
    { valor: '6', nombre: 'Junio' },
    { valor: '7', nombre: 'Julio' },
    { valor: '8', nombre: 'Agosto' },
    { valor: '9', nombre: 'Septiembre' },
    { valor: '10', nombre: 'Octubre' },
    { valor: '11', nombre: 'Noviembre' },
    { valor: '12', nombre: 'Diciembre' }
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
    if (this.tipoPeriodo === 'dia') {
      return !!this.formulario.fechaDia;
    }
    if (this.tipoPeriodo === 'mes') {
      return !!(this.formulario.mes && this.formulario.anio);
    }
    if (this.tipoPeriodo === 'anio') {
      return !!this.formulario.anio;
    }
    return false;
  }

  generarResultados(): void {
    if (!this.formularioValido) return;

    this.cargando = true;
    this.error = '';
    this.dashboardVisible = false;

    // --- LOGS DE VERIFICACIÓN (diagnóstico) ---
    const usernameLogueado = this.usuarioService.obtenerUsername();
    const usuarioIdDisponible = this.usuarioService.obtenerUsuarioId();
    console.log('[Resultados] Usuario autenticado (username):', usernameLogueado);
    console.log('[Resultados] ID de usuario disponible:', usuarioIdDisponible, '(0 = no disponible del backend aún)');
    console.log('[Resultados] Filtro seleccionado:', {
      tipoPeriodo: this.tipoPeriodo,
      mes: this.formulario.mes,
      anio: this.formulario.anio,
      fechaDia: this.formulario.fechaDia
        ? this.formatearFecha(this.formulario.fechaDia)
        : null
    });
    // -------------------------------------------

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

        // --- LOGS DE VERIFICACIÓN (diagnóstico) ---
        console.log('[Resultados] Total consumos recibidos del backend:', consumos.length);
        if (consumos.length > 0) {
          console.log('[Resultados] Ejemplo de consumo recibido:', JSON.stringify(consumos[0], null, 2));
          console.log('[Resultados] Campos de usuario en el consumo:', {
            usuarioId: (consumos[0] as any).usuarioId,
            idUsuario: (consumos[0] as any).idUsuario,
            usuario: (consumos[0] as any).usuario,
            nombre: (consumos[0] as any).nombre
          });
          console.log('[Resultados] Fecha del primer consumo:', this.obtenerFecha(consumos[0]));
        }
        // -------------------------------------------

        // Construir mapa factorId → categoriaId a partir de los factores recibidos
        const factorToCategoryMap = new Map<number, number>();
        const registrarFactores = (factores: FactorEmision[], catId: number) => {
          factores.forEach((f) => {
            const fId = f.id ?? f.idFactor ?? f.factorId;
            if (fId !== undefined) {
              factorToCategoryMap.set(fId, catId);
            }
          });
        };
        registrarFactores(factores1, 1);
        registrarFactores(factores2, 2);
        registrarFactores(factores3, 3);
        registrarFactores(factores4, 4);
        registrarFactores(factores5, 5);
        registrarFactores(factores6, 6);

        // -----------------------------------------------------------------------
        // FILTRADO POR USUARIO
        //
        // El backend /consumos/listar devuelve todos los consumos (findAll()).
        // La entidad Consumo tiene @JsonBackReference en "usuario", por lo que
        // usuarioId siempre llega como null en el JSON.
        //
        // Estrategia actual: NO filtrar por usuario en el frontend hasta que el
        // backend filtre por el JWT del SecurityContext o devuelva el usuarioId.
        //
        // Si el id está disponible (backend actualizado), filtrar:
        //   if (c.usuarioId !== usuarioId) return false;
        //
        // Si solo está el username, no hay campo comparable en el consumo.
        // -----------------------------------------------------------------------

        const usuarioId = this.usuarioService.obtenerUsuarioId();

        console.log('====================================');
        console.log('USUARIO LOGUEADO:', usuarioId);
        console.log('====================================');

        const consumosFiltrados = consumos.filter((c: Consumo) => {

          console.log('------------------------------------');
          console.log('CONSUMO:', c);
          console.log('usuarioId consumo:', c.usuarioId);
          console.log('usuarioId logueado:', usuarioId);

          const consumoUsuarioId = c.usuarioId;

          if (
            usuarioId > 0 &&
            consumoUsuarioId !== undefined &&
            consumoUsuarioId !== null
          ) {
            if (Number(consumoUsuarioId) !== Number(usuarioId)) {
              console.log('DESCARTADO POR USUARIO');
              return false;
            }
          }

          const fechaStr = this.obtenerFecha(c);

          console.log('fecha consumo:', fechaStr);
          console.log('tipoPeriodo:', this.tipoPeriodo);
          console.log('fechaDia:', this.formulario.fechaDia);
          console.log('mes:', this.formulario.mes);
          console.log('anio:', this.formulario.anio);

          if (!fechaStr || fechaStr === '-') {
            console.log('DESCARTADO POR FECHA VACIA');
            return false;
          }

          const parts = fechaStr.split('-');

          if (parts.length < 3) {
            console.log('DESCARTADO POR FORMATO FECHA');
            return false;
          }

          const anioC = parseInt(parts[0], 10);
          const mesC = parseInt(parts[1], 10);

          if (this.tipoPeriodo === 'dia') {

            if (!this.formulario.fechaDia) {
              return false;
            }

            const fechaSeleccionada =
              this.formatearFecha(this.formulario.fechaDia);

            const coincide = fechaStr === fechaSeleccionada;

            console.log('COINCIDE DIA:', coincide);

            return coincide;
          }

          if (this.tipoPeriodo === 'mes') {

            const coincide =
              anioC === parseInt(this.formulario.anio, 10) &&
              mesC === parseInt(this.formulario.mes, 10);

            console.log('COINCIDE MES:', coincide);

            return coincide;
          }

          if (this.tipoPeriodo === 'anio') {

            const coincide =
              anioC === parseInt(this.formulario.anio, 10);

            console.log('COINCIDE AÑO:', coincide);

            return coincide;
          }

          return false;
        });

        console.log('====================================');
        console.log('TOTAL FILTRADOS:', consumosFiltrados.length);
        console.log('====================================');

        // 2. Agrupar consumos por categoría
        const grouped = new Map<number, Consumo[]>();

        consumosFiltrados.forEach((c) => {
          const fId = c.factorId ?? c.factor?.id;

          let catId = fId ? factorToCategoryMap.get(fId) : undefined;

          // Fallback 1: categoriaId directo en el consumo
          if (!catId) {
            catId = c.categoriaId;
          }

          // Fallback 2: categoriaId desde el factor anidado
          if (!catId && c.factor) {
            const f = c.factor;
            catId = f.categoriaId;
          }

          if (catId) {
            if (!grouped.has(catId)) {
              grouped.set(catId, []);
            }
            grouped.get(catId)!.push(c);
          }
        });

        // Iconos por categoría ID
        const iconos: Record<number, string> = {
          1: '🥕', // Alimentos
          2: '💡', // Electrodomésticos
          3: '👕', // Ropa
          4: '🚗', // Coche
          5: '🚌', // Autobús
          6: '🏠'  // Servicio / Vivienda
        };

        const resultCategories: CategoriaDashboard[] = [];
        let sumTotalGeneral = 0;

        categorias.forEach((cat) => {
          const catId = cat.id ?? cat.idCategoria ?? 0;
          const consumosCat = grouped.get(catId) || [];

          // REGLA: no mostrar categorías sin registros en el período
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
              icono: iconos[catId] ?? '📊',
              registros,
              totalCo2: totalCatCo2
            });
          }
        });

        this.categoriasFiltradas = resultCategories;
        this.totalGeneral = sumTotalGeneral;

        // Calcular equivalencias usando constantes centralizadas
        this.equivalencias = {
          arboles: this.totalGeneral / EQUIVALENCIAS.CO2_POR_ARBOL_ANIO,
          kilometros: this.totalGeneral / EQUIVALENCIAS.CO2_POR_KILOMETRO_COCHE,
          electricidad: this.totalGeneral / EQUIVALENCIAS.CO2_POR_KWH
        };

        console.log('[Resultados] Categorías con registros encontradas:', this.categoriasFiltradas.length);
        console.log('[Resultados] Total general CO₂:', this.totalGeneral);

        this.dashboardVisible = true;
        this.cargando = false;
      },
      error: (err) => {
        console.error('[Resultados] Error al obtener datos del backend:', err);
        this.error = 'Ocurrió un error al obtener los consumos registrados en el período. Por favor intente nuevamente.';
        this.cargando = false;
      }
    });
  }

  obtenerDetalleNombre(consumo: Consumo, categoriaId: number): string {
    const detalleVal = (clave: string): string => {
      const detalles = consumo.detalles;
      if (Array.isArray(detalles)) {
        const val = detalles.find((item) => item.clave === clave)?.valor ?? '';
        return String(val);
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
    if (typeof fecha === 'string' && fecha.includes('T')) {
      return fecha.split('T')[0];
    }
    if (typeof fecha === 'string' && fecha.includes(' ')) {
      return fecha.split(' ')[0];
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
