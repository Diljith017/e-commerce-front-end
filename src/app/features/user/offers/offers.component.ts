import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Offer {
  id: number;
  name: string;
  category: string;
  originalPrice: number;
  offerPrice: number;
  discount: number;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './offers.component.html',
  styleUrl: './offers.component.css'
})
export class OffersComponent implements OnInit, OnDestroy {

  private timerInterval: ReturnType<typeof setInterval> | undefined;

  private readonly storageKey = 'nutriforge_offer_end_time';

  days = 0;
  hours = 0;
  minutes = 0;
  seconds = 0;

  offerExpired = false;

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // START COUNTDOWN
  startCountdown(): void {

  let endTime = localStorage.getItem(this.storageKey);

  if (!endTime || Number(endTime) <= Date.now()) {

    const deadline = Date.now() + (24 * 60 * 60 * 1000);

    endTime = String(deadline);

    localStorage.setItem(this.storageKey, endTime);

  }

  const deadline = Number(endTime);

  this.updateCountdown(deadline);

  this.timerInterval = setInterval(() => {
    this.updateCountdown(deadline);
  }, 1000);

}
  // UPDATE TIMER
  updateCountdown(deadline: number): void {

  const remaining = Math.max(0, deadline - Date.now());

  this.days = Math.floor(remaining / (1000 * 60 * 60 * 24));

  this.hours = Math.floor(
    (remaining / (1000 * 60 * 60)) % 24
  );

  this.minutes = Math.floor(
    (remaining / (1000 * 60)) % 60
  );

  this.seconds = Math.floor(
    (remaining / 1000) % 60
  );

  if (remaining <= 0) {

    // Restart for another 24 hours
    const newDeadline = Date.now() + (24 * 60 * 60 * 1000);

    localStorage.setItem(
      this.storageKey,
      String(newDeadline)
    );

    this.offerExpired = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.startCountdown();

  }

}

  // FORMAT TIMER
  formatTime(value: number): string {
    return String(value).padStart(2, '0');
  }

  offers: Offer[] = [

    {
      id: 1,
      name: 'Whey Protein',
      category: 'Whey Protein',
      originalPrice: 2499,
      offerPrice: 1999,
      discount: 20,
      icon: '🥛',
      label: 'BEST SELLER'
    },

    {
      id: 2,
      name: 'Creatine Monohydrate',
      category: 'Creatine',
      originalPrice: 799,
      offerPrice: 599,
      discount: 25,
      icon: '💪',
      label: 'HOT DEAL'
    },

    {
      id: 3,
      name: 'Pre-Workout',
      category: 'Pre-Workout',
      originalPrice: 1199,
      offerPrice: 899,
      discount: 25,
      icon: '⚡',
      label: 'LIMITED OFFER'
    },

    {
      id: 4,
      name: 'Mass Gainer',
      category: 'Mass Gainer',
      originalPrice: 1999,
      offerPrice: 1599,
      discount: 20,
      icon: '🏋️',
      label: 'SPECIAL DEAL'
    },

    {
      id: 5,
      name: 'Vitamin Complex',
      category: 'Vitamins',
      originalPrice: 699,
      offerPrice: 499,
      discount: 29,
      icon: '🍊',
      label: 'SAVE MORE'
    },

    {
      id: 6,
      name: 'Recovery Formula',
      category: 'Recovery',
      originalPrice: 999,
      offerPrice: 749,
      discount: 25,
      icon: '🔋',
      label: 'HOT DEAL'
    }

  ];

  get totalSavings(): number {
    return this.offers.reduce(
      (total, offer) =>
        total + (offer.originalPrice - offer.offerPrice),
      0
    );
  }

}