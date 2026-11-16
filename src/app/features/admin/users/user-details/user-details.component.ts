import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { User } from '../../../../core/models/user.model';
import { Order } from '../../../../core/models/order.model';

import { AuthService } from '../../../../core/services/auth.service';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class UserDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private authService = inject(AuthService);
  private orderService = inject(OrderService);

  user: User | null = null;
  orders: Order[] = [];

  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');

    if (!userId) {
      this.errorMessage = 'Invalid user ID.';
      this.loading = false;
      return;
    }

    this.loadUserDetails(userId);
  }

  // LOAD USER AND ORDERS
  loadUserDetails(userId: string): void {

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      users: this.authService.getAllUsers(),
      orders: this.orderService.getOrdersByUserId(userId)
    }).subscribe({

      next: ({ users, orders }) => {

        this.user = users.find(
          user => String(user.id) === userId
        ) ?? null;

        if (!this.user) {
          this.errorMessage = 'User not found.';
          this.loading = false;
          return;
        }

        this.orders = orders.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

        this.loading = false;
      },

      error: (error) => {

        console.error('Error loading user details:', error);

        this.errorMessage = 'Failed to load user details.';

        this.loading = false;
      }

    });
  }

  // TOTAL ORDERS
  get totalOrders(): number {
    return this.orders.length;
  }

  // TOTAL AMOUNT SPENT
  get totalSpent(): number {
    return this.orders
      .filter(order => order.status !== 'Cancelled')
      .reduce((total, order) => total + order.total, 0);
  }

  // ACTIVE USER CHECK
  get isActive(): boolean {
    return (this.user?.status || 'active') === 'active';
  }

  // BACK TO USERS
  goBack(): void {
    this.router.navigate(['/admin/users']);
  }

}