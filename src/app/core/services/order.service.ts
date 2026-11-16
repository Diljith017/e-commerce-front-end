import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/orders';

  // Save a new order
  createOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  // Get all orders
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  // Get orders by user ID
  getOrdersByUserId(userId: string): Observable<Order[]> {

    const params = new HttpParams()
      .set('userId', userId);

    return this.http.get<Order[]>(this.apiUrl, { params });
  }

  // Get one order by ID
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  // Cancel an order
  cancelOrder(
    id: string,
    cancellationReason: string,
    cancellationComment: string
  ): Observable<Order> {

    return this.http.patch<Order>(`${this.apiUrl}/${id}`, {
      status: 'Cancelled',
      cancellationReason,
      cancellationComment,
      cancelledAt: new Date().toISOString()
    });
  }

  // Update order status (Admin)
updateOrderStatus(
  id: string,
  status: string
): Observable<Order> {
  return this.http.patch<Order>(
    `${this.apiUrl}/${id}`,
    { status }
  );
}
}