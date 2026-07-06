export interface Usuario {
  id?: number;
  idUsuario?: number;
  nombre?: string;
  email?: string;
  roles?: string[];
}

export interface UsuarioResponseDTO {
  idUsuario: number;
  username: string;
  correo: string;
  enabled: boolean;
  rol: string;
  fechaRegistro?: string;
}

export interface UsuarioDTO {
  username: string;
  correo: string;
  password?: string;
}
