import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/products.model';
import { ToastService } from '../../../../core/services/toast.service';



@Component({
  selector: 'app-edit-product',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './edit-product.component.html',
  styleUrl: './edit-product.component.css'
})
export class EditProductComponent implements OnInit {

  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);

  productId = '';

  loading = false;
  saving = false;
  errorMessage = '';

  // EDIT PRODUCT FORM
 productForm = this.fb.group({

  name: [
    '',
    [
      Validators.required,
      Validators.pattern(/\S/)
    ]
  ],

  brand: [
    '',
    [
      Validators.required,
      Validators.pattern(/\S/)
    ]
  ],

  category: [
    '',
    [
      Validators.required,
      Validators.pattern(/\S/)
    ]
  ],

  price: [
    0,
    [
      Validators.required,
      Validators.min(1)
    ]
  ],

  stock: [
    0,
    [
      Validators.required,
      Validators.min(0)
    ]
  ],

  rating: [
    0,
    [
      Validators.required,
      Validators.min(0),
      Validators.max(5)
    ]
  ],

  image: [
    '',
    [
      Validators.required,
      Validators.pattern(/^(https?:\/\/.+|\/.+)$/i)
    ]
  ],

  description: [
    '',
    [
      Validators.required,
      Validators.pattern(/\S/)
    ]
  ]

});

  get f() {
    return this.productForm.controls;
  }

  ngOnInit(): void {

    this.productId =
      this.route.snapshot.paramMap.get('id') ?? '';

    if (!this.productId) {
      this.errorMessage = 'Invalid product ID.';
      return;
    }

    this.loadProduct();

  }

  // LOAD EXISTING PRODUCT
  loadProduct(): void {

    this.loading = true;

    this.productService.getProductById(this.productId).subscribe({

      next: (product: Product) => {

        this.productForm.patchValue(product);

        this.loading = false;

      },

      error: (error) => {

        console.error('Error loading product:', error);

        this.errorMessage = 'Failed to load product.';

        this.loading = false;

      }

    });

  }

  // UPDATE PRODUCT
// UPDATE PRODUCT
onSubmit(): void {

  if (this.productForm.invalid) {
    this.productForm.markAllAsTouched();
    return;
  }

  this.saving = true;
  this.errorMessage = '';

  const updatedProduct = {
    name: this.productForm.value.name!,
    brand: this.productForm.value.brand!,
    category: this.productForm.value.category!,
    price: this.productForm.value.price!,
    stock: this.productForm.value.stock!,
    rating: this.productForm.value.rating!,
    image: this.productForm.value.image!,
    description: this.productForm.value.description!
  };

  this.productService.updateProduct(
    this.productId,
    updatedProduct
  ).subscribe({

    next: () => {

      this.saving = false;

      // SUCCESS TOAST
      this.toastService.show(
        'Product updated successfully!',
        'success'
      );

      this.router.navigate(['/admin/products']);

    },

    error: (error) => {

      console.error('Error updating product:', error);

      this.errorMessage = 'Failed to update product.';

      // ERROR TOAST
      this.toastService.show(
        'Failed to update product!',
        'error'
      );

      this.saving = false;

    }

  });

}

  // CANCEL EDIT
  cancel(): void {

    this.router.navigate(['/admin/products']);

  }

}