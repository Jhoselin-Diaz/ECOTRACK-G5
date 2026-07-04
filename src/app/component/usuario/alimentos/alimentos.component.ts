import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Consumo } from '../../../model/consumo.model';
import { FactorEmision } from '../../../model/factor-emision.model';
import { ConsumoService } from '../../../service/consumo.service';
import { FactorEmisionService } from '../../../service/factor-emision.service';
import { UsuarioService } from '../../../service/usuario.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ViewChild, AfterViewInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-alimentos',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatTableModule,
    MatPaginatorModule,
    CommonModule,
    MatButtonModule
  ],
  templateUrl: './alimentos.component.html',
  styleUrl: './alimentos.component.css'
})
export class AlimentosComponent implements OnInit, AfterViewInit {
  alimentos: string[] = [];
  factores: FactorEmision[] = [];
  consumos: Consumo[] = [];
  editandoId: number | null = null;
  consumoOriginal: Consumo | null = null;
  guardando = false;

  formulario = {
    tipoAlimento: '',
    cantidad: ''
  };


  constructor(
    private consumoService: ConsumoService,
    private factorService: FactorEmisionService,
    private usuarioService: UsuarioService
  ) { }

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  displayedColumns: string[] = [
    'alimento',
    'cantidad',
    'co2',
    'fecha',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Consumo>();

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit(): void {
    console.log('Alimentos - ngOnInit iniciado');
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.factorService.listarPorCategoria(1).subscribe((factores) => {
      this.factores = factores;
      console.log('Alimentos - Factores cargados:', this.factores);
      this.alimentos = factores.map(f => f.nombre || f.nombreFactor || '').filter(Boolean);
      this.cargarConsumos();
    });
  }

  cargarConsumos(): void {

    const usuarioId = this.usuarioService.obtenerUsuarioId();

    this.consumoService.listar().subscribe((consumos: any[]) => {

      const idsFactores = new Set(
        this.factores.map(f => this.obtenerFactorId(f))
      );

      this.consumos = consumos.filter(
        consumo =>
          consumo.usuarioId === usuarioId &&
          idsFactores.has(this.obtenerConsumoFactorId(consumo))
      );

      this.dataSource.data = [...this.consumos];

    });
  }

  guardar(): void {
    const cantidad = Number(this.formulario.cantidad);

    if (!cantidad) {
      return;
    }

    const factor = this.factores.find(f => (f.nombre || f.nombreFactor) === this.formulario.tipoAlimento) || this.factores[0];
    if (!factor) {
      console.error('Alimentos - No hay factores disponibles');
      return;
    }

    const consumo: Consumo = {
      ...(this.editandoId ? this.consumoOriginal : {}),
      usuarioId: this.usuarioService.obtenerUsuarioId(),
      factorId: this.obtenerFactorId(factor),
      cantidad,
      detalles: [
        { clave: 'Tipo_Alimento', valor: this.formulario.tipoAlimento }
      ]
    };
    console.log('Alimentos - Payload a enviar:', consumo);
    this.guardando = true;
    const peticion = this.editandoId
      ? this.consumoService.editar(this.editandoId, consumo)
      : this.consumoService.registrar(consumo);

    peticion.subscribe({
      next: (res: any) => {
        console.log('Alimentos - Respuesta del backend:', res);
        this.cargarConsumos();
        this.cancelar();
      },
      complete: () => (this.guardando = false),
      error: (error) => {
        console.error('Alimentos - Error del backend:', error);
        this.guardando = false;
      }
    });
  }

  editar(consumo: Consumo): void {
    this.consumoOriginal = JSON.parse(JSON.stringify(consumo));
    this.editandoId = this.obtenerConsumoId(consumo);
    this.formulario = {
      tipoAlimento: consumo.factor?.nombre || this.buscarFactor(this.obtenerConsumoFactorId(consumo))?.nombre || `${this.detalle(consumo, 'Tipo_Alimento')}`,
      cantidad: Number(this.obtenerCantidad(consumo)) as any
    };
  }

  eliminar(id: any): void {
    const cleanId = typeof id === 'number' ? id : parseInt(String(id).split(':')[0], 10);
    if (cleanId && !isNaN(cleanId)) {
      console.log('Alimentos - Eliminando consumo con ID:', cleanId);
      this.consumoService.eliminar(cleanId).subscribe({
        next: () => {
          console.log('Alimentos - Consumo eliminado exitosamente');
          this.consumos = this.consumos.filter(c => this.obtenerConsumoId(c) !== cleanId);
          this.dataSource.data = [...this.consumos];
        },
        error: (error) => {
          console.error('Alimentos - Error al eliminar consumo:', error);
        }
      });
    } else {
      console.error('Alimentos - ID inválido para eliminar:', id);
    }
  }

  cancelar(): void {
    this.editandoId = null;
    this.consumoOriginal = null;
    this.formulario = { tipoAlimento: '', cantidad: '' };
  }

  compareObjects(o1: any, o2: any): boolean {
    if (o1 === o2) return true;
    if (!o1 || !o2) return false;

    const getId = (obj: any) => {
      if (typeof obj === 'object') {
        return obj.idFactor || obj.id || obj.idCategoria;
      }
      return typeof obj === 'string' && obj.includes(':') ? parseInt(obj.split(':')[0], 10) : Number(obj);
    };

    return getId(o1) === getId(o2);
  }

  detalle(consumo: Consumo, clave: string): string | number {
    const detalles = consumo.detalles;
    if (Array.isArray(detalles)) return detalles.find((item) => item.clave === clave)?.valor ?? '';
    if (detalles && typeof detalles === 'object') return (detalles as Record<string, string | number>)[clave] ?? '';
    return '';
  }

  obtenerNombre(consumo: Consumo): string {
    return this.obtenerFactorNombre(consumo.factor ?? this.buscarFactor(this.obtenerConsumoFactorId(consumo)));
  }

  obtenerCantidad(consumo: Consumo): number {
    return consumo.cantidad ?? 0;
  }

  obtenerCo2(consumo: Consumo): string | number {
    return consumo.emisionesKgCO2 ?? 'Pendiente';
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

  obtenerFactorId(factor: FactorEmision): number {
    return factor.id ?? factor.idFactor ?? factor.factorId ?? 0;
  }

  obtenerFactorNombre(factor?: FactorEmision): string {
    return factor?.nombre ?? factor?.nombreFactor ?? factor?.descripcion ?? factor?.tipo ?? '-';
  }

  private buscarFactor(id: number): FactorEmision | undefined {
    return this.factores.find((factor) => this.obtenerFactorId(factor) === id);
  }

  obtenerConsumoId(consumo: Consumo): number {
    const rawId = consumo.id ?? 0;
    const cleanId = String(rawId).split(':')[0];
    return Number(cleanId) || 0;
  }

  private obtenerConsumoFactorId(consumo: Consumo): number {
    return consumo.factorId ?? this.obtenerFactorId(consumo.factor ?? {});
  }


}
