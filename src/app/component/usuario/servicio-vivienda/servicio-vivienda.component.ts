import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
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
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-servicio-vivienda',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule
  ],
  templateUrl: './servicio-vivienda.component.html',
  styleUrl: './servicio-vivienda.component.css'
})
export class ServicioViviendaComponent implements OnInit, AfterViewInit{
  factores: FactorEmision[] = [];
  consumos: Consumo[] = [];
  editandoId: number | null = null;
  consumoOriginal: Consumo | null = null;
  guardando = false;
  formulario = { electricidad: '', gasNatural: '', carbon: '' };

  constructor(
    private consumoService: ConsumoService,
    private factorService: FactorEmisionService,
    private usuarioService: UsuarioService) { }

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  displayedColumns: string[] = [
    'servicio',
    'cantidad',
    'co2',
    'fecha',
    'acciones'
  ];

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  dataSource = new MatTableDataSource<Consumo>([]);

  ngOnInit(): void {
    console.log('Servicio-Vivienda - ngOnInit iniciado');

    this.factorService.listarPorCategoria(6).subscribe((factores) => {
      this.factores = factores;

      console.log('=================================');
      console.log('FACTORES RECIBIDOS DEL BACKEND');
      console.log(this.factores);
      console.log('=================================');

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
    const consumos = [
      this.crearConsumo('Electricidad', Number(this.formulario.electricidad)),
      this.crearConsumo('Gas Natural', Number(this.formulario.gasNatural)),
      this.crearConsumo('Carbón', Number(this.formulario.carbon))
    ].filter((consumo): consumo is Consumo => !!consumo);

    if (!consumos.length) return;

    console.log('Servicio-Vivienda - Consumos a enviar:', consumos);
    this.guardando = true;
    const peticion = this.editandoId ? this.consumoService.editar(this.editandoId, consumos[0]) : forkJoin(consumos.map((consumo) => this.consumoService.registrar(consumo)));
    peticion.subscribe({
      next: (res: any) => {
        console.log('Servicio-Vivienda - Respuesta del backend:', res);
        this.cargarConsumos();
        this.cancelar();
      },
      complete: () => (this.guardando = false),
      error: (error) => {
        console.error('Servicio-Vivienda - Error del backend:', error);
        this.guardando = false;
      }
    });
  }

  editar(consumo: Consumo): void {
    this.consumoOriginal = JSON.parse(JSON.stringify(consumo));
    this.editandoId = this.obtenerConsumoId(consumo);
    this.formulario = { electricidad: '', gasNatural: '', carbon: '' };
    this.formulario[this.llaveServicio(this.obtenerNombre(consumo))] = Number(this.obtenerCantidad(consumo)) as any;
  }

  eliminar(id: any): void {
    const cleanId = typeof id === 'number' ? id : parseInt(String(id).split(':')[0], 10);
    if (cleanId && !isNaN(cleanId)) {
      console.log('Servicio-Vivienda - Eliminando consumo con ID:', cleanId);
      this.consumoService.eliminar(cleanId).subscribe({
        next: () => {
          console.log('Servicio-Vivienda - Consumo eliminado exitosamente');
          this.consumos = this.consumos.filter(c => this.obtenerConsumoId(c) !== cleanId);
          this.dataSource.data = [...this.consumos];
        },
        error: (error) => {
          console.error('Servicio-Vivienda - Error al eliminar consumo:', error);
        }
      });
    } else {
      console.error('Servicio-Vivienda - ID inválido para eliminar:', id);
    }
  }

  cancelar(): void {
    this.editandoId = null;
    this.consumoOriginal = null;
    this.formulario = { electricidad: '', gasNatural: '', carbon: '' };
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

  private crearConsumo(nombre: string, cantidad: number): Consumo | undefined {

    console.log('--------------------------------');
    console.log('Buscando factor para:', nombre);
    console.log('Cantidad:', cantidad);

    const factor = this.factores.find((item) =>
      this.normalizar(this.obtenerFactorNombre(item))
        .includes(this.normalizar(nombre))
    );

    console.log('Factor encontrado:', factor);
    console.log('--------------------------------');

    if (!factor || !cantidad) {
      console.log('NO SE PUDO CREAR EL CONSUMO');
      return undefined;
    }

    const consumo: Consumo = {
      ...(this.editandoId ? this.consumoOriginal : {}),
      usuarioId: this.usuarioService.obtenerUsuarioId(),
      factorId: this.obtenerFactorId(factor),
      cantidad,
      detalles: [{
        clave: 'Tipo_Servicio',
        valor: nombre
      }]
    };

    console.log('Consumo creado:', consumo);

    return consumo;
  }

  private llaveServicio(nombre: string): 'electricidad' | 'gasNatural' | 'carbon' {
    const texto = this.normalizar(nombre);
    if (texto.includes('gas')) return 'gasNatural';
    if (texto.includes('carbon')) return 'carbon';
    return 'electricidad';
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

  private normalizar(valor: string): string {
    return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

}
