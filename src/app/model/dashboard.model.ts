export interface DashboardResumenDTO {
  totalUsuarios: number;
  totalConsumos: number;
  huellaTotal: number;
  huellaPromedio: number;
}

// Huella de carbono por categoría
export interface CategoriaHuellaDTO {
  categoria: string;
  totalKgCO2: number;
  porcentaje: number;
}

export interface UsuarioActivoDTO {
  usuarioId: number;
  username: string;
  correo: string;
  totalRegistros: number;
  ultimoRegistro: string;
}

export interface UsuarioHuellaTotalDTO {
  usuarioId: number;
  username: string;
  correo: string;
  totalKgCO2: number;
}

export interface EvolucionHuellaDTO {
  anio: number;
  mes: number;
  totalKgCO2: number;
}

export interface RegistroDashboard {
  nombre: string;
  cantidad: number;
  co2: number;
  fecha: string;
}

export interface CategoriaDashboard {
  id: number;
  nombre: string;
  icono: string;
  registros: RegistroDashboard[];
  totalCo2: number;
}
