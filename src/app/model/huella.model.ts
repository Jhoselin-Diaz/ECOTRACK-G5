export interface UsuarioHuellaDTO {
  id: number;
  usuario: string;
  correo: string;
}

export interface DetalleHuellaDTO extends UsuarioHuellaDTO {
  periodo: string;
  totalKgCO2: number;
  fechaCalculo: string;
  estado: string;
  categoria?: string;
  actividad?: string;
  consumosOriginales?: any[];
}

export interface CategoriaProporcional {
  nombre: string;
  porcentaje: number;
  valor: number;
  icon: string;
  colorClass: string;
}

export interface RegistroDetalle {
  categoria: string;
  actividad: string;
  valor: number;
}
