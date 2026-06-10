import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AlimentosComponent } from './component/alimentos/alimentos.component';
import { AutobusComponent } from './component/autobus/autobus.component';
import { CocheComponent } from './component/coche/coche.component';
import { ElectrodomesticoComponent } from './component/electrodomestico/electrodomestico.component';
import { InicioComponent } from './component/inicio/inicio.component';
import { ResultadosComponent } from './component/resultados/resultados.component';
import { RopaComponent } from './component/ropa/ropa.component';
import { ServicioViviendaComponent } from './component/servicio-vivienda/servicio-vivienda.component';
import { authGuard } from './security/auth.guard';
import { roleGuard } from './security/role.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'inicio', component: InicioComponent, canActivate: [authGuard] },
  { path: 'servicio-vivienda', component: ServicioViviendaComponent, canActivate: [authGuard] },
  { path: 'coche', component: CocheComponent, canActivate: [authGuard] },
  { path: 'autobus', component: AutobusComponent, canActivate: [authGuard] },
  { path: 'electrodomestico', component: ElectrodomesticoComponent, canActivate: [authGuard] },
  { path: 'ropa', component: RopaComponent, canActivate: [authGuard] },
  { path: 'alimentos', component: AlimentosComponent, canActivate: [authGuard] },
  { path: 'resultados', component: ResultadosComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
