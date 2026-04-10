import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../../features/auth/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const role = authService.getCurrentRole();
    if (allowedRoles.includes(role)) {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  };
};
