import { router } from 'expo-router';

/** Navegación explícita a la pantalla inicial (fuera del flujo automático de AuthGate). */
export function navigateToWelcome(): void {
  if (router.canDismiss()) {
    router.dismissAll();
  }
  router.replace('/');
}
