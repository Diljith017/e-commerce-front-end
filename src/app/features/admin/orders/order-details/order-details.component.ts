import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { OrderService } from '../../../../core/services/order.service';
import { Order } from '../../../../core/models/order.model';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class adminOrderDetailsComponent implements OnInit {

  private orderService = inject(OrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  order: Order | null = null;

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Invalid order ID.';
      return;
    }

    this.loadOrder(id);
  }

  loadOrder(id: string): void {
    this.loading = true;

    this.orderService.getOrderById(id).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.errorMessage = 'Failed to load order details.';
        this.loading = false;
      }
    });
  }

  updateStatus(status: string): void {
    if (!this.order?.id) {
      return;
    }

    this.orderService.updateOrderStatus(
      this.order.id,
      status
    ).subscribe({
      next: (updatedOrder) => {
        if (this.order) {
          this.order.status = updatedOrder.status;
        }
      },
      error: (error) => {
        console.error('Error updating status:', error);
        alert('Failed to update order status.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }
}