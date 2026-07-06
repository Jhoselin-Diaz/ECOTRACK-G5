import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const requiredRoles = route.data['roles'] as string[] | undefined;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const userRoles = authService.getRoles();
  const singleRol = localStorage.getItem('rol');
  if (singleRol && !userRoles.includes(singleRol)) {
    userRoles.push(singleRol);
  }

  const hasRequiredRole = requiredRoles.some(role => 
    userRoles.some(uRole => {
      const uRoleClean = String(uRole).toUpperCase().trim();
      const rRoleClean = String(role).toUpperCase().trim();
      return uRoleClean === rRoleClean || 
             uRoleClean.replace('ROLE_', '') === rRoleClean.replace('ROLE_', '');
    })
  );

  if (hasRequiredRole) {
    return true;
  }

  // Si no tiene el rol, redirigir según su rol real (o a login si no está logueado)
  const isUserAdmin = userRoles.some(r => {
    const rClean = String(r).toUpperCase().trim();
    return rClean === 'ROLE_ADMIN' || rClean === 'ADMIN';
  });

  if (isUserAdmin) {
    router.navigate(['/admin/inicio']);
  } else {
    router.navigate(['/inicio']);
  }
  return false;
};
