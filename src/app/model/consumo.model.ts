import { ConsumoDetalle } from './consumo-detalle.model';
import { FactorEmision } from './factor-emision.model';

export interface Consumo {
  id?: number;
  usuarioId?: number;
  categoriaId?: number;
  factorId?: number;
  nombre?: string;
  factor?: FactorEmision;
  cantidad?: number;
  emisionesKgCO2?: number;
  fechaRegistro?: string;
  detalles?: ConsumoDetalle[] | Record<string, string | number> | string;
}
