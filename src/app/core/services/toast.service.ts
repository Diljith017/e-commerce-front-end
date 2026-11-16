import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  toasts = signal<Toast[]>([]);

  show(
    message: string,
    type: 'success' | 'error' | 'warning' = 'success'
  ): void {

    const id = Date.now() + Math.random();

    this.toasts.update(toasts => [
      ...toasts,
      { id, message, type }
    ]);

    setTimeout(() => {
      this.remove(id);
    }, 3000);
  }

  remove(id: number): void {
    this.toasts.update(toasts =>
      toasts.filter(toast => toast.id !== id)
    );
  }
}