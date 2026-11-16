import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { Product } from '../../../../../core/models/products.model';
import { ProductCard } from '../../../../../shared/components/product-card/product-card.component';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';

import { loadProducts } from '../../../../../store/products/products.actions';

import {
  selectAllProducts,
  selectProductsLoading,
  selectProductsError
} from '../../../../../store/products/products.selectors';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductCard,
    PaginationComponent
  ],
  templateUrl: './products-list.html',
  styleUrl: './products-list.css'
})
export class ProductsList implements OnInit {

  readonly store = inject(Store);
  private route = inject(ActivatedRoute);

  products$: Observable<Product[]> =
    this.store.select(selectAllProducts);

  loading$: Observable<boolean> =
    this.store.select(selectProductsLoading);

  errorMessage$: Observable<string | null> =
    this.store.select(selectProductsError);

  searchTerm = '';
  selectedCategory = 'All';
  sortOrder = 'default';

  showCategorySelector = true;

  // Pagination
  currentPage = 1;
  pageSize = 8;

  ngOnInit(): void {

    this.store.dispatch(loadProducts());

    this.route.queryParamMap.subscribe(params => {

      const category = params.get('category');
      const search = params.get('search');

      this.selectedCategory = category || 'All';
      this.searchTerm = search || '';

      this.currentPage = 1;

      this.showCategorySelector = ![
        'Whey Protein',
        'Creatine',
        'Pre-Workout',
        'Mass Gainer',
        'Health & Wellness'
      ].some(
        item => item.toLowerCase() === category?.toLowerCase()
      );

    });
  }

  retryLoadingProducts(): void {
    this.store.dispatch(loadProducts());
  }

  getFilteredProducts(products: Product[]): Product[] {

    let filtered = products.filter(product => {

      const search = this.searchTerm.trim().toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        product.brand.toLowerCase().includes(search);

      const matchesCategory =
        this.selectedCategory === 'All' ||
        product.category.toLowerCase() ===
          this.selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });

    if (this.sortOrder === 'low-to-high') {
      filtered = [...filtered].sort(
        (a, b) => a.price - b.price
      );
    }

    if (this.sortOrder === 'high-to-low') {
      filtered = [...filtered].sort(
        (a, b) => b.price - a.price
      );
    }

    return filtered;
  }

  getPaginatedProducts(products: Product[]): Product[] {

    const startIndex = (this.currentPage - 1) * this.pageSize;

    return products.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  onFiltersChanged(): void {
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'All';
    this.sortOrder = 'default';
    this.currentPage = 1;
  }
}