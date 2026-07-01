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

  const hasRequiredRole = requiredRoles.some(role =>
    userRoles.includes(role)
  );

  if (hasRequiredRole) {
    return true;
  }

  router.navigate(['/inicio']);
  return false;
};
