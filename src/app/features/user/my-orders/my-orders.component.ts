import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';

import { Order } from '../../../core/models/order.model';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.css'
})
export class MyOrdersComponent implements OnInit {

  private orderService = inject(OrderService);
  private store = inject(Store);

  orders: Order[] = [];

  loading = true;
  errorMessage = '';
  successMessage = '';

  // Filter and sorting
  selectedStatus = 'All';
  sortOrder: 'newest' | 'oldest' = 'newest';

  // Cancellation
  orderToCancel: Order | null = null;

  cancellationReason = '';
  cancellationComment = '';

  cancellationError = '';
  cancelling = false;

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
    this.loadOrders();
  }

 // Load orders of the logged-in user
loadOrders(): void {
  this.loading = true;
  this.errorMessage = '';

  this.store.select(selectCurrentUser)
    .pipe(take(1))
    .subscribe(user => {

      console.log('Logged-in user:', user);
      console.log('Logged-in user ID:', user?.id);

      if (!user?.id) {
        this.orders = [];
        this.errorMessage = 'Please log in to view your orders.';
        this.loading = false;
        return;
      }

      this.orderService
        .getOrdersByUserId(String(user.id))
        .subscribe({
         next: (data) => {
  console.log('Filtered orders:', data);

  // Sort orders from oldest to newest
  const chronologicalOrders = [...data].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
  );

  // Assign individual order numbers to each user
  this.orders = chronologicalOrders.map((order, index) => ({
    ...order,
    orderNumber: order.orderNumber ?? index + 1
  }));

  this.loading = false;
},
          error: (error) => {
            console.error('Failed to load orders:', error);
            this.errorMessage = 'Unable to load your orders.';
            this.loading = false;
          }
        });
    });
}
  // Filter and sort orders
  get filteredOrders(): Order[] {

    let result = [...this.orders];

    if (this.selectedStatus !== 'All') {

      result = result.filter(
        order =>
          order.status.toLowerCase() ===
          this.selectedStatus.toLowerCase()
      );

    }

    result.sort((a, b) => {

      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return this.sortOrder === 'newest'
        ? dateB - dateA
        : dateA - dateB;

    });

    return result;
  }

  // Change status filter
  onStatusChange(event: Event): void {

    const select = event.target as HTMLSelectElement;

    this.selectedStatus = select.value;
  }

  // Change sorting
  onSortChange(event: Event): void {

    const select = event.target as HTMLSelectElement;

    this.sortOrder = select.value as 'newest' | 'oldest';
  }

  // Check whether order can be cancelled
  canCancelOrder(order: Order): boolean {

    return ['pending', 'processing','confirmed',
    'placed'].includes(
      order.status.toLowerCase()
    );
  }

  // Open cancellation popup
  openCancelDialog(order: Order): void {

    if (!this.canCancelOrder(order)) {
      return;
    }

    this.orderToCancel = order;

    this.cancellationReason = '';
    this.cancellationComment = '';
    this.cancellationError = '';
  }

  // Close cancellation popup
  closeCancelDialog(): void {

    if (this.cancelling) {
      return;
    }

    this.orderToCancel = null;

    this.cancellationReason = '';
    this.cancellationComment = '';
    this.cancellationError = '';
  }

  // Confirm cancellation
  confirmCancellation(): void {

    if (!this.orderToCancel) {
      return;
    }

    if (!this.cancellationReason) {

      this.cancellationError =
        'Please select a cancellation reason.';

      return;
    }

    if (!this.orderToCancel.id) {

      this.cancellationError =
        'Order ID is missing. Unable to cancel this order.';

      return;
    }

    const orderId = this.orderToCancel.id;

    this.cancelling = true;
    this.cancellationError = '';

    this.orderService.cancelOrder(
      orderId,
      this.cancellationReason,
      this.cancellationComment.trim()
    ).subscribe({

      next: (updatedOrder) => {

  this.orders = this.orders.map(order =>
    order.id === orderId
      ? { ...order, ...updatedOrder }
      : order
  );

  const orderNumber = this.orderToCancel?.orderNumber ?? orderId;

  this.successMessage =
    `Order #${orderNumber} cancelled successfully!`;
        this.cancelling = false;

        this.orderToCancel = null;

        this.cancellationReason = '';
        this.cancellationComment = '';

      },

      error: (error) => {

        console.error('Order cancellation failed:', error);

        this.cancellationError =
          'Unable to cancel your order. Please try again.';

        this.cancelling = false;

      }

    });
  }

}