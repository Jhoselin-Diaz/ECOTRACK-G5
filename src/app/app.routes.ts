import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AlimentosComponent } from './component/usuario/alimentos/alimentos.component';
import { AutobusComponent } from './component/usuario/autobus/autobus.component';
import { CocheComponent } from './component/usuario/coche/coche.component';
import { ElectrodomesticoComponent } from './component/usuario/electrodomestico/electrodomestico.component';
import { InicioComponent } from './component/usuario/inicio/inicio.component';
import { ResultadosComponent } from './component/usuario/resultados/resultados.component';
import { RopaComponent } from './component/usuario/ropa/ropa.component';
import { ServicioViviendaComponent } from './component/usuario/servicio-vivienda/servicio-vivienda.component';
import { authGuard } from './security/auth.guard';
import { roleGuard } from './security/role.guard';
import { inject } from '@angular/core';
import { AuthService } from './service/auth.service';

import { MenuAdminComponent } from './component/admin/menu-admin/menu-admin.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'usuario/inicio',
    redirectTo: () => {
      const authService = inject(AuthService);
      const roles = authService.getRoles();
      const isAdmin = roles.some(r => {
        const roleStr = String(r).toUpperCase().trim();
        return roleStr === 'ROLE_ADMIN' || roleStr === 'ADMIN';
      });
      return isAdmin ? 'admin/inicio' : 'inicio';
    }
  },
  { path: 'inicio', component: InicioComponent, canActivate: [authGuard] },
  { path: 'servicio-vivienda', component: ServicioViviendaComponent, canActivate: [authGuard] },
  { path: 'coche', component: CocheComponent, canActivate: [authGuard] },
  { path: 'autobus', component: AutobusComponent, canActivate: [authGuard] },
  { path: 'electrodomestico', component: ElectrodomesticoComponent, canActivate: [authGuard] },
  { path: 'ropa', component: RopaComponent, canActivate: [authGuard] },
  { path: 'alimentos', component: AlimentosComponent, canActivate: [authGuard] },
  { path: 'resultados', component: ResultadosComponent, canActivate: [authGuard] },
  {
    path: 'admin',
    component: MenuAdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      { path: 'inicio', loadComponent: () => import('./component/admin/inicio/inicio.component').then(m => m.InicioComponent) },
      { path: 'dashboard', loadComponent: () => import('./component/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'usuarios', loadComponent: () => import('./component/admin/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'huella-carbono', loadComponent: () => import('./component/admin/huella-carbono/huella-carbono.component').then(m => m.HuellaCarbonoComponent) },
      { path: 'factor-emision', loadComponent: () => import('./component/admin/factor-emision/factor-emision.component').then(m => m.FactorEmisionComponent) }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
