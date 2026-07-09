import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { UsuarioHuellaDTO } from '../../../../model/huella.model';
import { UsuarioService } from '../../../../service/usuario.service';
import { NotificacionService, NotificacionAdminDTO } from '../../../../service/notificacion.service';


@Component({
  selector: 'app-enviar-mensaje-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './enviar-mensaje-modal.component.html',
  styleUrl: './enviar-mensaje-modal.component.css'
})
export class EnviarMensajeModalComponent {
  mensaje: string = '';
  enviando: boolean = false;
  errorMsg: string = '';
  exitoMsg: string = '';

  constructor(
    public dialogRef: MatDialogRef<EnviarMensajeModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UsuarioHuellaDTO,
    private usuarioService: UsuarioService,
    private notificacionService: NotificacionService
  ) {}

  cerrar(): void {
    this.dialogRef.close(false);
  }

  enviar(): void {
    if (!this.mensaje.trim()) {
      this.errorMsg = 'El mensaje no puede estar vacío.';
      return;
    }

    this.enviando = true;
    this.errorMsg = '';
    this.exitoMsg = '';

    const targetUserId = this.data.id;
    const username = this.usuarioService.obtenerUsername() || 'admin';

    const payload: NotificacionAdminDTO = {
      usuarioDestinoId: targetUserId,
      nombreAdminEnvia: username,
      contenidoMensaje: this.mensaje.trim()
    };

    this.notificacionService.enviarMensajeAdmin(payload).subscribe({
      next: (res) => {
        this.enviando = false;
        this.exitoMsg = 'Mensaje de mitigación enviado correctamente.';
        setTimeout(() => {
          this.dialogRef.close(true);
        }, 1500);
      },
      error: (err) => {
        console.error('Error al enviar el mensaje:', err);
        this.enviando = false;
        this.errorMsg = 'Ocurrió un error al enviar el mensaje. Intente de nuevo.';
      }
    });
  }
}

