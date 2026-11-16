import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { OrderService } from '../../../../core/services/order.service';
import { Order } from '../../../../core/models/order.model';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PaginationComponent
  ],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css'
})
export class OrderListComponent implements OnInit {

  private orderService = inject(OrderService);

  orders: Order[] = [];

  loading = false;
  errorMessage = '';

  // SEARCH AND FILTERS
  searchTerm = '';

  statusFilter = 'all';

  paymentFilter: 'all' | 'cod' | 'online' = 'all';

  dateSort: 'newest' | 'oldest' = 'newest';

  // PAGINATION
  currentPage = 1;
  pageSize = 8;

  ngOnInit(): void {
    this.loadOrders();
  }

  // LOAD ORDERS
  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.currentPage = 1;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.errorMessage = 'Failed to load orders.';
        this.loading = false;
      }
    });
  }

  // SEARCH AND FILTER ORDERS
  get filteredOrders(): Order[] {

    const search = this.searchTerm.trim().toLowerCase();

    return this.orders
      .filter(order => {

        const orderId = String(
          order.orderNumber || order.id || ''
        ).toLowerCase();

        const customerName =
          order.customer.fullName.toLowerCase();

        const customerEmail =
          order.customer.email.toLowerCase();

        const matchesSearch =
          orderId.includes(search) ||
          customerName.includes(search) ||
          customerEmail.includes(search);

        const matchesStatus =
          this.statusFilter === 'all' ||
          order.status.toLowerCase() === this.statusFilter.toLowerCase();

        const paymentMethod =
          order.paymentMethod.toLowerCase();

        const matchesPayment =
          this.paymentFilter === 'all' ||
          (this.paymentFilter === 'cod' && paymentMethod === 'cod') ||
          (this.paymentFilter === 'online' && paymentMethod !== 'cod');

        return matchesSearch && matchesStatus && matchesPayment;

      })
      .sort((a, b) => {

        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();

        return this.dateSort === 'newest'
          ? dateB - dateA
          : dateA - dateB;

      });
  }

  // PAGINATED ORDERS
  get paginatedOrders(): Order[] {

    const startIndex = (this.currentPage - 1) * this.pageSize;

    return this.filteredOrders.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  // CLEAR FILTERS
  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.paymentFilter = 'all';
    this.dateSort = 'newest';
    this.currentPage = 1;
  }

  // CHANGE PAGE
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  // CHANGE PAGE SIZE
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  // UPDATE ORDER STATUS
  updateStatus(order: Order, status: string): void {

    if (!order.id) {
      return;
    }

    this.orderService.updateOrderStatus(
      order.id,
      status
    ).subscribe({

      next: (updatedOrder) => {
        order.status = updatedOrder.status;
      },

      error: (error) => {
        console.error('Error updating order status:', error);
        alert('Failed to update order status.');
      }

    });
  }

}