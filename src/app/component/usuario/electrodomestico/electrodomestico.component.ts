import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Consumo } from '../../../model/consumo.model';
import { FactorEmision } from '../../../model/factor-emision.model';
import { ConsumoService } from '../../../service/consumo.service';
import { FactorEmisionService } from '../../../service/factor-emision.service';
import { UsuarioService } from '../../../service/usuario.service';
import { ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-electrodomestico',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule
  ],
  templateUrl: './electrodomestico.component.html',
  styleUrl: './electrodomestico.component.css'
})
export class ElectrodomesticoComponent implements OnInit, AfterViewInit {
  electrodomesticos: string[] = [];
  factores: FactorEmision[] = [];
  consumos: Consumo[] = [];
  editandoId: number | null = null;
  consumoOriginal: Consumo | null = null;
  guardando = false;
  formulario = { tipoElectrodomestico: '', cantidad: '' };

  constructor(private consumoService: ConsumoService, private factorService: FactorEmisionService, private usuarioService: UsuarioService) { }

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  displayedColumns: string[] = [
    'electrodomestico',
    'cantidad',
    'co2',
    'fecha',
    'acciones'
  ];

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  dataSource = new MatTableDataSource<Consumo>();
  ngOnInit(): void {
    console.log('Electrodoméstico - ngOnInit iniciado');
    this.factorService.listarPorCategoria(2).subscribe((factores) => {
      this.factores = factores;
      console.log('Electrodoméstico - Factores cargados:', this.factores);
      this.electrodomesticos = factores.map(f => f.nombre || f.nombreFactor || '').filter(Boolean);
      this.cargarConsumos();
    });
  }

  cargarConsumos(): void {

    const usuarioId = this.usuarioService.obtenerUsuarioId();

    this.consumoService.listar().subscribe((consumos: any[]) => {

      const idsFactores = new Set(
        this.factores.map(f => this.obtenerFactorId(f))
      );

      this.consumos = consumos.filter(consumo =>
        consumo.usuarioId === usuarioId &&
        idsFactores.has(this.obtenerConsumoFactorId(consumo))
      );

      this.dataSource.data = [...this.consumos];

    });
  }

  guardar(): void {
    const cantidad = Number(this.formulario.cantidad);
    if (!cantidad) return;
    const factor = this.factores.find(f => (f.nombre || f.nombreFactor) === this.formulario.tipoElectrodomestico) || this.factores[0];
    if (!factor) {
      console.error('Electrodoméstico - No hay factores disponibles');
      return;
    }
    const consumo: Consumo = {
      ...(this.editandoId ? this.consumoOriginal : {}),
      usuarioId: this.usuarioService.obtenerUsuarioId(),
      factorId: this.obtenerFactorId(factor),
      cantidad,
      detalles: [
        { clave: 'Tipo_Electrodomestico', valor: this.formulario.tipoElectrodomestico }
      ]
    };
    console.log('Electrodoméstico - Payload a enviar:', consumo);
    this.guardando = true;
    const peticion = this.editandoId ? this.consumoService.editar(this.editandoId, consumo) : this.consumoService.registrar(consumo);
    peticion.subscribe({
      next: (res: any) => {
        console.log('Electrodoméstico - Respuesta del backend:', res);
        this.cargarConsumos();
        this.cancelar();
      },
      complete: () => (this.guardando = false),
      error: (error) => {
        console.error('Electrodoméstico - Error del backend:', error);
        this.guardando = false;
      }
    });
  }

  editar(consumo: Consumo): void {
    this.consumoOriginal = JSON.parse(JSON.stringify(consumo));
    this.editandoId = this.obtenerConsumoId(consumo);
    this.formulario = {
      tipoElectrodomestico: consumo.factor?.nombre || this.buscarFactor(this.obtenerConsumoFactorId(consumo))?.nombre || `${this.detalle(consumo, 'Tipo_Electrodomestico')}`,
      cantidad: Number(this.obtenerCantidad(consumo)) as any
    };
  }

  eliminar(id: any): void {
    const cleanId = typeof id === 'number' ? id : parseInt(String(id).split(':')[0], 10);
    if (cleanId && !isNaN(cleanId)) {
      console.log('Electrodoméstico - Eliminando consumo con ID:', cleanId);
      this.consumoService.eliminar(cleanId).subscribe({
        next: () => {
          console.log('Electrodoméstico - Consumo eliminado exitosamente');
          this.consumos = this.consumos.filter(c => this.obtenerConsumoId(c) !== cleanId);
          this.dataSource.data = [...this.consumos];
        },
        error: (error) => {
          console.error('Electrodoméstico - Error al eliminar consumo:', error);
        }
      });
    } else {
      console.error('Electrodoméstico - ID inválido para eliminar:', id);
    }
  }

  cancelar(): void {
    this.editandoId = null;
    this.consumoOriginal = null;
    this.formulario = { tipoElectrodomestico: '', cantidad: '' };
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
    const rawId = factor.id ?? factor.idFactor ?? factor.factorId ?? 0;
    const cleanId = String(rawId).split(':')[0];
    return Number(cleanId) || 0;
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
    const rawId = consumo.factorId ?? this.obtenerFactorId(consumo.factor ?? {});
    const cleanId = String(rawId).split(':')[0];
    return Number(cleanId) || 0;
  }

}
