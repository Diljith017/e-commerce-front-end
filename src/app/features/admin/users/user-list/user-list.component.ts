import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { User } from '../../../../core/models/user.model';
import { Order } from '../../../../core/models/order.model';

import { AuthService } from '../../../../core/services/auth.service';
import { OrderService } from '../../../../core/services/order.service';
import { ToastService } from '../../../../core/services/toast.service';

import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent,
    RouterLink
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {

  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private toastService = inject(ToastService);

  users: User[] = [];
  orders: Order[] = [];

  searchTerm = '';
  loading = true;
  errorMessage = '';

  statusFilter: 'all' | 'active' | 'blocked' = 'all';

  // PAGINATION
  currentPage = 1;
  pageSize = 8;

  // CONFIRMATION MODAL
  showStatusConfirm = false;
  selectedUser: User | null = null;
  selectedAction: 'block' | 'unblock' | null = null;
  updatingStatus = false;

  ngOnInit(): void {
    this.loadUsers();
    this.loadOrders();
  }

  // LOAD USERS
  loadUsers(): void {
    this.loading = true;

    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data.filter(user => user.role === 'user');
        this.currentPage = 1;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage = 'Failed to load users.';
        this.loading = false;
      }
    });
  }

  // LOAD ORDERS
  loadOrders(): void {
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data;
      },
      error: (error) => {
        console.error('Error loading orders:', error);
      }
    });
  }

  // SEARCH + STATUS FILTER
  get filteredUsers(): User[] {

    const search = this.searchTerm.trim().toLowerCase();

    return this.users.filter(user => {

      const matchesSearch =
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);

      const userStatus = user.status || 'active';

      const matchesStatus =
        this.statusFilter === 'all' ||
        userStatus === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  // CLEAR FILTERS
  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.currentPage = 1;
  }

  // PAGINATED USERS
  get paginatedUsers(): User[] {

    const startIndex = (this.currentPage - 1) * this.pageSize;

    return this.filteredUsers.slice(
      startIndex,
      startIndex + this.pageSize
    );
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

  // GET ORDER COUNT
  getOrderCount(userId?: string): number {

    if (!userId) {
      return 0;
    }

    return this.orders.filter(
      order => String(order.userId) === String(userId)
    ).length;
  }

  // OPEN BLOCK CONFIRMATION
  blockUser(user: User): void {

    this.selectedUser = user;
    this.selectedAction = 'block';
    this.showStatusConfirm = true;
  }

  // OPEN UNBLOCK CONFIRMATION
  unblockUser(user: User): void {

    this.selectedUser = user;
    this.selectedAction = 'unblock';
    this.showStatusConfirm = true;
  }

  // CANCEL CONFIRMATION
  cancelStatusChange(): void {

    if (this.updatingStatus) {
      return;
    }

    this.showStatusConfirm = false;
    this.selectedUser = null;
    this.selectedAction = null;
  }

  // CONFIRM BLOCK / UNBLOCK
  confirmStatusChange(): void {

    if (
      !this.selectedUser?.id ||
      !this.selectedAction ||
      this.updatingStatus
    ) {
      return;
    }

    const userId = this.selectedUser.id;
    const userName = this.selectedUser.name;
    const action = this.selectedAction;

    const newStatus = action === 'block'
      ? 'blocked'
      : 'active';

    this.updatingStatus = true;

    this.authService.updateUserStatus(
      userId,
      newStatus
    ).subscribe({

      next: (updatedUser) => {

        this.users = this.users.map(existingUser =>
          String(existingUser.id) === String(updatedUser.id)
            ? updatedUser
            : existingUser
        );

        this.showStatusConfirm = false;
        this.selectedUser = null;
        this.selectedAction = null;
        this.updatingStatus = false;

        // ADJUST PAGINATION
        const totalPages = Math.ceil(
          this.filteredUsers.length / this.pageSize
        );

        if (this.currentPage > totalPages) {
          this.currentPage = Math.max(1, totalPages);
        }

        // SUCCESS TOAST
        this.toastService.show(
          action === 'block'
            ? `${userName} blocked successfully!`
            : `${userName} unblocked successfully!`,
          'success'
        );

      },

      error: (error) => {

        console.error(`Error ${action}ing user:`, error);

        this.showStatusConfirm = false;
        this.selectedUser = null;
        this.selectedAction = null;
        this.updatingStatus = false;

        this.toastService.show(
          action === 'block'
            ? 'Failed to block user. Please try again.'
            : 'Failed to unblock user. Please try again.',
          'error'
        );

      }

    });
  }

  // ACTIVE USERS COUNT
  get activeUserCount(): number {

    return this.users.filter(
      user => (user.status || 'active') === 'active'
    ).length;
  }

  // BLOCKED USERS COUNT
  get blockedUserCount(): number {

    return this.users.filter(
      user => user.status === 'blocked'
    ).length;
  }

}