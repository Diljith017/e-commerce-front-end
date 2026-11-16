import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.css'
})
export class OrderConfirmationComponent {

  order: Order | null;

  constructor(private router: Router) {
    this.order =
      (this.router.getCurrentNavigation()?.extras.state?.['order'] as Order)
      ?? (history.state?.order as Order)
      ?? null;
  }

  viewOrderDetails(): void {
    if (!this.order?.id) {
      console.error('Order ID is unavailable');
      return;
    }

    this.router.navigate(['/my-orders', this.order.id]);
  }
}