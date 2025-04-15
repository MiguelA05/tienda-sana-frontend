// home.component.ts
import { Component, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  discount?: number;
}

@Component({
  selector: 'app-home',
  imports: [BrowserModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  categories: string[] = [
    'Desayunos Saludables',
    'Bowl Nutritivos',
    'Snacks Orgánicos',
    'Jugos Detox',
    'Postres Veganos',
    'Suplementos'
  ];

  products: Product[] = [
    {
      id: 1,
      name: 'Bowl de Quinoa con Vegetales',
      category: 'Bowl Nutritivos',
      price: 12.99,
      image: 'assets/images/quinoa-bowl.jpg',
      rating: 4.8,
      reviews: 150,
      discount: 30
    },
    {
      id: 2,
      name: 'Barra Energética de Semillas',
      category: 'Snacks Orgánicos',
      price: 4.99,
      image: 'assets/images/energy-bar.jpg',
      rating: 4.5,
      reviews: 89
    },
    {
      id: 3,
      name: 'Smoothie Detox Verde',
      category: 'Jugos Detox',
      price: 6.50,
      image: 'assets/images/green-smoothie.jpg',
      rating: 4.7,
      reviews: 204
    },
    {
      id: 4,
      name: 'Galletas de Avena Sin Gluten',
      category: 'Postres Veganos',
      price: 5.25,
      image: 'assets/images/oat-cookies.jpg',
      rating: 4.6,
      reviews: 132
    }
  ];

  constructor() { }

  ngOnInit(): void {
    // En una implementación real, aquí cargarías los datos de un servicio
  }

  addToCart(product: Product): void {
    // Lógica para añadir al carrito
    console.log('Producto añadido:', product);
    // Implementar lógica real con un servicio de carrito
  }

  getDiscountedPrice(price: number, discount?: number): number {
    if (!discount) return price;
    return price - (price * discount / 100);
  }

  getRatingStars(rating: number): any[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return new Array(5).fill(0).map((_, index) => ({
      full: index < fullStars,
      half: index === fullStars && hasHalfStar
    }));
  }
}