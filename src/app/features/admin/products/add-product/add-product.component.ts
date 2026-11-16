import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/products.model';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
})
export class AddProductComponent {

  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private router = inject(Router);

  loading = false;
  errorMessage = '';

  productForm = this.fb.group({

  name: ['', [
    Validators.required,
    Validators.pattern(/\S/)
  ]],

  brand: ['', [
    Validators.required,
    Validators.pattern(/\S/)
  ]],

  category: ['', [
    Validators.required,
    Validators.pattern(/\S/)
  ]],

  price: [0, [
    Validators.required,
    Validators.min(1)
  ]],

  stock: [0, [
    Validators.required,
    Validators.min(0)
  ]],

  rating: [0, [
    Validators.required,
    Validators.min(0),
    Validators.max(5)
  ]],

  image: ['', [
    Validators.required,
    Validators.pattern(/^(https?:\/\/.+|\/.+)$/i)
  ]],

  description: ['', [
    Validators.required,
    Validators.pattern(/\S/)
  ]]

});

  get f() {
    return this.productForm.controls;
  }

  onSubmit(): void {

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const product = this.productForm.getRawValue() as Product;

    this.productService.addProduct(product).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/admin/products']);
      },
      error: (error) => {
        console.error('Error adding product:', error);
        this.loading = false;
        this.errorMessage = 'Failed to add product. Please try again.';
      }
    });

  }

  cancel(): void {
    this.router.navigate(['/admin/products']);
  }

}