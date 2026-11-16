import { Routes } from '@angular/router';

// USER COMPONENTS
import { Home } from './features/user/home/home';
import { ProductsList } from './features/user/products/pages/products-list/products-list';
import { ProductDetails } from './features/user/products/pages/product-details/product-details.component';
import { CartComponent } from './features/user/cart/pages/cart/cart.component';
import { CheckoutComponent } from './features/user/checkout/checkout.component';
import { OrderConfirmationComponent } from './features/user/order-confirmation/order-confirmation.component';
import { MyOrdersComponent } from './features/user/my-orders/my-orders.component';
import { OrderDetailsComponent } from './features/user/my-orders/order-details/order-details.component';
import { OffersComponent } from './features/user/offers/offers.component';
import { Register } from './features/user/auth/pages/register/register';
import { Login } from './features/user/auth/pages/login/login';
import { ProfileComponent } from './features/user/profile/profile.component';
import { NotFound } from './features/user/pages/not-found/not-found.component';
import { WishlistComponent } from './features/user/wishlist/wishlist.component';

// GUARDS
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';
import { userGuard } from './core/guards/user.guard';


// ADMIN COMPONENTS
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { ProductListComponent } from './features/admin/products/product-list/product-list.component';
import { AddProductComponent } from './features/admin/products/add-product/add-product.component';
import { EditProductComponent } from './features/admin/products/edit-product/edit-product.component';
import { OrderListComponent } from './features/admin/orders/order-list/order-list.component';
import { adminOrderDetailsComponent } from './features/admin/orders/order-details/order-details.component';
import { UserListComponent } from './features/admin/users/user-list/user-list.component';
import { UserDetailsComponent } from './features/admin/users/user-details/user-details.component';
import { CouponsComponent } from './features/admin/coupons/coupons.component';



import { AdminLayoutComponent } from './features/admin/components/admin-layout/admin-layout.component';




export const routes: Routes = [

  // USER ROUTES

  { path: '', component: Home, canActivate: [userGuard], pathMatch: 'full' },

  { path: 'products', component: ProductsList, canActivate: [authGuard] },
  { path: 'products/:id', component: ProductDetails, canActivate: [authGuard] },

  { path: 'cart', component: CartComponent },
  { path: 'wishlist', component: WishlistComponent },

  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },

  { path: 'order-confirmation', component: OrderConfirmationComponent, canActivate: [authGuard] },
  { path: 'my-orders', component: MyOrdersComponent, canActivate: [authGuard] },
  { path: 'my-orders/:id', component: OrderDetailsComponent, canActivate: [authGuard] },

  { path: 'offers', component: OffersComponent, canActivate: [authGuard] },

  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: 'login', component: Login, canActivate: [guestGuard] },


  // ADMIN ROUTES
{
  path: 'admin',
  component: AdminLayoutComponent,
  canActivate: [adminGuard],
  children: [
    {
      path: 'dashboard',
      component: DashboardComponent
    },
    {
  path: 'products',
  component: ProductListComponent
    },
    {
  path: 'products/add',
  component: AddProductComponent
},
{
  path: 'products/edit/:id',
  component: EditProductComponent
},
{
  path: 'orders',
  component: OrderListComponent
},
{
  path: 'orders/:id',
  component: adminOrderDetailsComponent
},
{
  path: 'users',
  component: UserListComponent
},
{
  path: 'users/:id',
  component: UserDetailsComponent
},
{
  path: 'coupons',
  component: CouponsComponent
},
    {
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full'
    }
  ]
},


  // NOT FOUND

  { path: '**', component: NotFound }

];