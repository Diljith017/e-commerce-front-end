import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/products.model';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PaginationComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {

  private productService = inject(ProductService);
  private toastService = inject(ToastService);

  products: Product[] = [];

  loading = false;
  errorMessage = '';

  // SEARCH AND FILTERS
  searchTerm = '';
  categoryFilter = 'all';

  stockFilter: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' = 'all';

  // PAGINATION
  currentPage = 1;
  pageSize = 8;

  // DELETE CONFIRMATION
  showDeleteConfirm = false;
  selectedProductId: string | null = null;
  deleting = false;

  ngOnInit(): void {
    this.loadProducts();
  }

  // LOAD PRODUCTS
  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';

    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.currentPage = 1;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.errorMessage = 'Failed to load products.';
        this.loading = false;
      }
    });
  }

  // GET UNIQUE CATEGORIES
  get categories(): string[] {
    return [...new Set(
      this.products.map(product => product.category)
    )].sort();
  }

  // SEARCH AND FILTER PRODUCTS
  get filteredProducts(): Product[] {

    const search = this.searchTerm.trim().toLowerCase();

    return this.products.filter(product => {

      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.brand.toLowerCase().includes(search);

      const matchesCategory =
        this.categoryFilter === 'all' ||
        product.category === this.categoryFilter;

      let matchesStock = true;

      if (this.stockFilter === 'in-stock') {
        matchesStock = product.stock >= 10;
      } else if (this.stockFilter === 'low-stock') {
        matchesStock = product.stock > 0 && product.stock < 10;
      } else if (this.stockFilter === 'out-of-stock') {
        matchesStock = product.stock === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;

    });
  }

  // PAGINATED PRODUCTS
  get paginatedProducts(): Product[] {

    const startIndex = (this.currentPage - 1) * this.pageSize;

    return this.filteredProducts.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  // CLEAR FILTERS
  clearFilters(): void {
    this.searchTerm = '';
    this.categoryFilter = 'all';
    this.stockFilter = 'all';
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

  // OPEN DELETE CONFIRMATION
  deleteProduct(id: string): void {
    this.selectedProductId = id;
    this.showDeleteConfirm = true;
  }

  // CANCEL DELETE
  cancelDelete(): void {
    if (this.deleting) {
      return;
    }

    this.showDeleteConfirm = false;
    this.selectedProductId = null;
  }

  // CONFIRM DELETE
  confirmDeleteProduct(): void {

    if (!this.selectedProductId || this.deleting) {
      return;
    }

    const id = this.selectedProductId;

    this.deleting = true;

    this.productService.deleteProduct(id).subscribe({

      next: () => {

        this.products = this.products.filter(
          product => product.id !== id
        );

        const totalPages = Math.ceil(
          this.filteredProducts.length / this.pageSize
        );

        if (this.currentPage > totalPages) {
          this.currentPage = Math.max(1, totalPages);
        }

        this.showDeleteConfirm = false;
        this.selectedProductId = null;
        this.deleting = false;

        this.toastService.show(
          'Product deleted successfully!',
          'success'
        );

      },

      error: (error) => {

        console.error('Error deleting product:', error);

        this.deleting = false;
        this.showDeleteConfirm = false;
        this.selectedProductId = null;

        this.toastService.show(
          'Failed to delete product. Please try again.',
          'error'
        );

      }

    });
  }

}