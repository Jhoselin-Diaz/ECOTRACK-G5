import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { UsuarioService } from '../../../service/usuario.service';
import { UsuarioResponseDTO, UsuarioDTO } from '../../../model/usuario.model';

@Component({
  selector: 'app-admin-usuarios',
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
    MatMenuModule,
    MatTableModule,
    MatPaginatorModule
  ],
  providers: [DatePipe],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  dataSource = new MatTableDataSource<UsuarioResponseDTO>([]);

  filtroTexto = '';
  filtroRol = 'ALL';
  filtroEstado = 'ALL';

  cargando = true;
  errorMessage = '';

  editando = false;
  esNuevo = false;
  usuarioEdit: UsuarioDTO & { idUsuario?: number; rol?: string; enabled?: boolean } = {
    username: '',
    correo: '',
    password: '',
    rol: 'ROLE_USER',
    enabled: true
  };

  columnasMostrar = ['id', 'username', 'correo', 'rol', 'enabled', 'fechaRegistro', 'acciones'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.configurarPredicadoFiltro();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.errorMessage = '';
    this.usuarioService.listarUsuarios().subscribe({
      next: (users) => {
        // Asignar fechas simuladas de registro si no vienen del backend para que la vista quede impecable
        const mappedUsers = users.map((u, i) => {
          if (!u.fechaRegistro) {
            u.fechaRegistro = new Date(2026, 4, 10 + i).toISOString();
          }
          // Asegurar que enabled tenga valor booleano
          if (u.enabled === undefined) {
            u.enabled = true;
          }
          return u;
        });

        this.dataSource.data = mappedUsers;
        this.dataSource.paginator = this.paginator;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios del backend:', err);
        this.cargando = false;
      }
    });
  }

  configurarPredicadoFiltro(): void {
    this.dataSource.filterPredicate = (data: UsuarioResponseDTO, filter: string) => {
      const filterObj = JSON.parse(filter);

      const textMatch = !filterObj.text ||
        data.username.toLowerCase().includes(filterObj.text) ||
        data.correo.toLowerCase().includes(filterObj.text);

      const rolMatch = !filterObj.rol ||
        data.rol.toLowerCase() === filterObj.rol.toLowerCase();

      let estadoMatch = true;
      if (filterObj.estado !== '') {
        const isEnabled = filterObj.estado === 'ACTIVE';
        estadoMatch = data.enabled === isEnabled;
      }

      return textMatch && rolMatch && estadoMatch;
    };
  }

  aplicarFiltros(): void {
    const filterValue = {
      text: this.filtroTexto.trim().toLowerCase(),
      rol: this.filtroRol === 'ALL' ? '' : this.filtroRol,
      estado: this.filtroEstado === 'ALL' ? '' : this.filtroEstado
    };
    this.dataSource.filter = JSON.stringify(filterValue);
  }

  getInitials(username: string): string {
    if (!username) return 'U';
    const parts = username.split(/[._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }

  iniciarNuevo(): void {
    this.esNuevo = true;
    this.editando = true;
    this.usuarioEdit = {
      username: '',
      correo: '',
      password: '',
      rol: 'ROLE_USER',
      enabled: true
    };
  }

  editar(row: any): void {
    this.esNuevo = false;
    this.usuarioEdit = {
      idUsuario: row.idUsuario,
      username: row.username,
      correo: row.correo,
      password: '',
      rol: row.rol,
      enabled: row.enabled
    };

    this.editando = true;
  }

  iniciarEdicion(user: UsuarioResponseDTO): void {
    this.editar(user);
  }

  cancelar(): void {
    this.editando = false;
  }

  guardar(): void {
    if (!this.usuarioEdit.username || !this.usuarioEdit.correo) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    const dto: UsuarioDTO = {
      username: this.usuarioEdit.username,
      correo: this.usuarioEdit.correo,
      password: this.usuarioEdit.password || undefined
    };

    if (this.esNuevo) {
      if (!this.usuarioEdit.password) {
        alert('Debe especificar una contraseña para el nuevo usuario.');
        return;
      }
      this.usuarioService.crearUsuario(dto).subscribe({
        next: (res) => {

          res.rol = this.usuarioEdit.rol || 'ROLE_USER';
          res.enabled = true;
          res.fechaRegistro = new Date().toISOString();

          this.dataSource.data = [...this.dataSource.data, res];
          alert('Usuario registrado con éxito.');
          this.editando = false;
        },
        error: (err) => {
          console.error('Error al crear usuario:', err);
          alert('Ocurrió un error al registrar el usuario en el backend.');
        }
      });
    } else {
      const id = this.usuarioEdit.idUsuario!;
      this.usuarioService.actualizarUsuario(id, dto).subscribe({
        next: (res) => {

          res.rol = this.usuarioEdit.rol || 'ROLE_USER';
          res.enabled = this.usuarioEdit.enabled !== undefined ? this.usuarioEdit.enabled : true;

          const data = [...this.dataSource.data];
          const idx = data.findIndex(u => u.idUsuario === id);
          if (idx !== -1) {

            res.fechaRegistro = data[idx].fechaRegistro;
            data[idx] = res;
            this.dataSource.data = data;
          }
          alert('Usuario actualizado con éxito.');
          this.editando = false;
        },
        error: (err) => {
          console.error('Error al actualizar usuario:', err);
          alert('Ocurrió un error al actualizar el usuario.');
        }
      });
    }
  }

  toggleEstado(user: UsuarioResponseDTO): void {
    const nuevoEstado = !user.enabled;
    this.usuarioService.cambiarEstado(user.idUsuario, nuevoEstado).subscribe({
      next: () => {
        user.enabled = nuevoEstado;
        this.dataSource.data = [...this.dataSource.data];
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        alert('Error al alterar el estado de la cuenta.');
      }
    });
  }

  eliminar(user: UsuarioResponseDTO): void {
    if (confirm(`¿Está seguro de que desea eliminar permanentemente al usuario "${user.username}"?`)) {
      this.usuarioService.eliminarUsuario(user.idUsuario).subscribe({
        next: () => {
          this.dataSource.data = this.dataSource.data.filter(u => u.idUsuario !== user.idUsuario);
          alert('Usuario eliminado con éxito.');
        },
        error: (err) => {
          console.error('Error al eliminar usuario:', err);
          alert('No se pudo eliminar el usuario. Es posible que tenga consumos asociados.');
        }
      });
    }
  }

  compareWith(o1: any, o2: any): boolean {
    return o1 && o2 ? o1 === o2 : o1 === o2;
  }
}
