import { Injectable } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
    const router = inject(Router);
    if (localStorage.getItem('lm_token')) return true;
    router.navigate(['/login']);
    return false;
};
