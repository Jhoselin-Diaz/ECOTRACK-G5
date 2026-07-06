import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CategoriaService } from '../../../service/categoria.service';
import { FactorEmisionService } from '../../../service/factor-emision.service';
import { FactorEmision } from '../../../model/factor-emision.model';
import { Categoria } from '../../../model/categoria.model';

@Component({
  selector: 'app-admin-factor-emision',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './factor-emision.component.html',
  styleUrl: './factor-emision.component.css'
})
export class FactorEmisionComponent implements OnInit {
  categorias: Categoria[] = [];
  factores: FactorEmision[] = [];
  selectedCategoriaId: number | null = null;
  cargandoCategorias = true;
  cargandoFactores = false;

  // Formulario de edición/creación
  editando = false;
  factorEdit: FactorEmision = {
    codigo: '',
    nombre: '',
    keyword: '',
    unidad: '',
    factorKgCO2PorUnidad: 0
  };
  esNuevo = false;

  constructor(
    private categoriaService: CategoriaService,
    private factorEmisionService: FactorEmisionService
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.categoriaService.listar().subscribe({
      next: (cats) => {
        this.categorias = cats;
        this.cargandoCategorias = false;
        if (cats.length > 0) {
          const firstCatId = cats[0].id || cats[0].idCategoria;
          if (firstCatId) {
            this.selectedCategoriaId = firstCatId;
            this.cargarFactores(firstCatId);
          }
        }
      },
      error: (err) => {
        console.error('Error cargando categorias:', err);
        this.cargandoCategorias = false;
      }
    });
  }

  onCategoriaChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const catId = Number(target.value);
    if (catId) {
      this.selectedCategoriaId = catId;
      this.cargarFactores(catId);
    }
  }

  cargarFactores(catId: number): void {
    this.cargandoFactores = true;
    this.factorEmisionService.listarPorCategoria(catId).subscribe({
      next: (facts) => {
        this.factores = facts;
        this.cargandoFactores = false;
      },
      error: (err) => {
        console.error('Error cargando factores de emision:', err);
        this.cargandoFactores = false;
        this.factores = [];
      }
    });
  }

  iniciarNuevo(): void {
    this.esNuevo = true;
    this.editando = true;
    this.factorEdit = {
      codigo: '',
      nombre: '',
      keyword: '',
      unidad: '',
      factorKgCO2PorUnidad: 0,
      categoriaId: this.selectedCategoriaId || undefined,
      idCategoria: this.selectedCategoriaId || undefined
    };
  }

  iniciarEdicion(factor: FactorEmision): void {
    this.esNuevo = false;
    this.editando = true;
    this.factorEdit = { ...factor };
  }

  cancelar(): void {
    this.editando = false;
  }

  guardar(): void {
    if (!this.factorEdit.codigo || !this.factorEdit.nombre || !this.factorEdit.unidad || this.factorEdit.factorKgCO2PorUnidad === undefined) {
      alert('Por favor complete todos los campos obligatorios (Código, Nombre, Unidad y Factor).');
      return;
    }

    const catId = this.selectedCategoriaId;
    if (!catId) {
      alert('No se ha seleccionado ninguna categoría.');
      return;
    }

    if (this.esNuevo) {
      this.factorEmisionService.registrar(this.factorEdit, catId).subscribe({
        next: () => {
          alert('Factor de emisión registrado con éxito.');
          this.cargarFactores(catId);
          this.editando = false;
        },
        error: (err) => {
          console.error('Error registrando factor:', err);
          alert('Error al registrar factor de emisión.');
        }
      });
    } else {
      const idFact = this.factorEdit.idFactor || this.factorEdit.id;
      if (!idFact) return;
      this.factorEmisionService.editar(idFact, this.factorEdit, catId).subscribe({
        next: () => {
          alert('Factor de emisión actualizado con éxito.');
          this.cargarFactores(catId);
          this.editando = false;
        },
        error: (err) => {
          console.error('Error editando factor:', err);
          alert('Error al actualizar factor de emisión.');
        }
      });
    }
  }

  listarFactores(): void {
    if (this.selectedCategoriaId) {
      this.cargarFactores(this.selectedCategoriaId);
    }
  }

  eliminar(id: number | undefined): void {
    if (!id) return;
    if (confirm('¿Está seguro de que desea eliminar este factor de emisión?')) {
      this.factorEmisionService.eliminar(id).subscribe({
        next: () => {
          alert('Factor de emisión eliminado con éxito.');
          this.listarFactores();
        },
        error: (err) => {
          console.error('Error eliminando factor:', err);
          alert('Error al eliminar factor de emisión.');
        }
      });
    }
  }
}
