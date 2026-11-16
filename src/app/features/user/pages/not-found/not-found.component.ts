import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
templateUrl: './not-found.component.html',
styleUrl: './not-found.component.css'
})
export class NotFound {

  private router = inject(Router);

  goBack(): void {
    if (window.history.length > 1) {
      this.router.navigateByUrl('/');
    } else {
      this.router.navigate(['/']);
    }
  }

}