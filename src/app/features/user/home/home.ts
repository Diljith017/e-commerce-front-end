import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {

  categories = [
    {
      name: 'Whey Protein',
      icon: '🥛',
      category: 'Whey Protein',
      description: 'Support your daily protein intake'
    },
    {
      name: 'Creatine',
      icon: '💪',
      category: 'Creatine',
      description: 'A staple for strength training'
    },
    {
      name: 'Pre-Workout',
      icon: '⚡',
      category: 'Pre-Workout',
      description: 'Explore workout supplements'
    },
    {
      name: 'Mass Gainer',
      icon: '🏋️',
      category: 'Mass Gainer',
      description: 'Options for higher calorie needs'
    },
    {
      name: 'Vitamins',
      icon: '🍊',
      category: 'Health & Wellness',
      description: 'Explore everyday nutrition'
    },
    {
      name: 'Recovery',
      icon: '🔋',
      category: 'Recovery',
      description: 'Explore post-workout nutrition'
    }
  ];

  benefits = [
    {
      icon: '📦',
      title: 'Convenient Shopping',
      description: 'Browse your supplement essentials in one place.'
    },
    {
      icon: '🔒',
      title: 'Simple Checkout',
      description: 'A straightforward shopping and checkout experience.'
    },
    {
      icon: '💪',
      title: 'Fitness Focused',
      description: 'Explore products that fit your training routine.'
    },
    {
      icon: '🎧',
      title: 'Customer Support',
      description: 'Get help when you need assistance with your order.'
    }
  ];

  testimonials = [
    {
      name: 'Arjun M.',
      role: 'Fitness Enthusiast',
      message: 'The product categories make it easy to find the supplements I am looking for.',
      rating: 5
    },
    {
      name: 'Rahul K.',
      role: 'Gym Member',
      message: 'I like the clean layout and straightforward shopping experience.',
      rating: 5
    },
    {
      name: 'Nikhil S.',
      role: 'Strength Training Enthusiast',
      message: 'The store is simple to navigate, and the checkout process is easy to follow.',
      rating: 5
    }
  ];

}