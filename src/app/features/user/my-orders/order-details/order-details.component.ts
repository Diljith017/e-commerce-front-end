import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Order } from '../../../../core/models/order.model';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class OrderDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  order: Order | null = null;

  loading = true;
  errorMessage = '';

  // Cancellation properties
  showCancelDialog = false;
  cancellationReason = '';
  cancellationComment = '';
  cancellationError = '';
  cancelling = false;
  successMessage = '';

  cancellationReasons: string[] = [
    'Ordered by mistake',
    'Found a better price elsewhere',
    'Delivery is taking too long',
    'Changed my mind',
    'Ordered the wrong product',
    'Payment-related issue',
    'Other'
  ];

  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Invalid order ID.';
      this.loading = false;
      return;
    }

    this.loadOrder(id);
  }

  // Load order details
  loadOrder(id: string): void {

    this.loading = true;

    this.orderService.getOrderById(id).subscribe({

      next: (data) => {
        this.order = data;
        this.loading = false;
      },

      error: (error) => {
        console.error('Failed to load order:', error);
        this.errorMessage = 'Unable to load order details.';
        this.loading = false;
      }

    });
  }

  // Order tracking steps
  trackingSteps: string[] = [
    'Placed',
    'Processing',
    'Shipped',
    'Delivered'
  ];

  get currentStep(): number {

    if (!this.order) {
      return -1;
    }

    const status = this.order.status.toLowerCase();

    switch (status) {

      case 'placed':
      case 'pending':
        return 0;

      case 'processing':
        return 1;

      case 'shipped':
        return 2;

      case 'delivered':
        return 3;

      default:
        return -1;
    }
  }

  // Check whether cancellation is allowed
  canCancelOrder(): boolean {

    if (!this.order) {
      return false;
    }

    const status = this.order.status.trim().toLowerCase();

    return [
      'pending',
      'processing',
      'confirmed',
      'placed'
    ].includes(status);
  }

  // Open cancellation popup
  openCancelDialog(): void {

    if (!this.canCancelOrder()) {
      return;
    }

    this.showCancelDialog = true;
    this.cancellationReason = '';
    this.cancellationComment = '';
    this.cancellationError = '';
  }

  // Close popup
  closeCancelDialog(): void {

    if (this.cancelling) {
      return;
    }

    this.showCancelDialog = false;
    this.cancellationError = '';
  }

  // Confirm cancellation
  confirmCancellation(): void {

    if (!this.order) {
      return;
    }

    if (!this.cancellationReason) {
      this.cancellationError =
        'Please select a cancellation reason.';
      return;
    }

    if (!this.order.id) {
      this.cancellationError =
        'Order ID is missing.';
      return;
    }

    // Recheck status before sending request
    if (!this.canCancelOrder()) {
      this.cancellationError =
        'This order can no longer be cancelled.';
      return;
    }

    this.cancelling = true;
    this.cancellationError = '';

    this.orderService.cancelOrder(
      this.order.id,
      this.cancellationReason,
      this.cancellationComment.trim()
    ).subscribe({

      next: (updatedOrder) => {

        this.order = {
          ...this.order!,
          ...updatedOrder
        };

        this.successMessage =
          'Your order has been cancelled successfully!';

        this.showCancelDialog = false;
        this.cancelling = false;

      },

      error: (error) => {

        console.error('Cancellation failed:', error);

        this.cancellationError =
          'Unable to cancel your order. Please try again.';

        this.cancelling = false;

      }

    });
  }
}