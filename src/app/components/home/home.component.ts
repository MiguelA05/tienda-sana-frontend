import { Component } from '@angular/core';
import { CardGridComponent } from "../card-grid/card-grid.component";
import { PublicoService } from '../../services/publico.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CardGridComponent, FormsModule, ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  currentPage: number = 0;
  filterForm!: FormGroup;
  productos: any[] = [];
  seleccionados: any[] = [];
  productosDisponibles: boolean = true;
  pages: number[] = [];
  filterUsed: boolean = false;
  tipos: string[] = [];

  carouselItems = [
    {
      imageUrl: "https://www.muyinteresante.com/wp-content/uploads/sites/5/2023/08/16/64dce698e98ce.jpeg",
      title: "Encuentra tu comida ideal",
      subtitle: "Descubre los alimentos que se adaptan a tu estilo de vida"
    },
    {
      imageUrl: "https://www.flora.es/-/media/Project/Upfield/Brands/Becel-NL/Flora-ES/Assets/Cuidate/header-10-alimentos-saludables-que-son-buenos-para-tu-corazon.jpg?rev=92f792036c7f4ef7b5525cee92989a63",
      title: "Bebidas increíbles",
      subtitle: "Un deleite para tu paladar"
    },
    {
      imageUrl: "https://agenciadenoticias.unal.edu.co/fileadmin/Agencia_de_Noticias/Imagenes/2022/08-Agosto/395/AgenciaUNAL-01-1008.jpg",
      title: "Tu próxima reserva",
      subtitle: "Ofrecemos el mejor servicio"
    }
  ];

  activeSlideIndex: number = 0;

  constructor(private publicoService: PublicoService, private formBuilder: FormBuilder) {
    this.productos = [];
    this.obtenerProductos(this.currentPage);
    this.obtenerCategorias();
    this.createForm();
  }

  nextSlide() {
    this.activeSlideIndex = (this.activeSlideIndex + 1) % this.carouselItems.length;
  }

  prevSlide() {
    this.activeSlideIndex = (this.activeSlideIndex - 1 + this.carouselItems.length) % this.carouselItems.length;
  }

  public obtenerProductos(page: number) {
    // Lógica para obtener productos
  }

  public obtenerCategorias() {
    // Lógica para obtener categorías
  }

  createForm() {
    this.filterForm = this.formBuilder.group({
      name: [''],
      city: [''],
      eventType: ['OTHER'],
    });
  }

  public filter(page: number) {
    // Lógica para filtrar productos
  }

  public nextPage() {
    this.currentPage++;
    if (this.filterUsed) {
      this.filter(this.currentPage);
    } else {
      this.obtenerProductos(this.currentPage);
    }
    this.actualizarProductosDisponibles();
  }

  public previousPage() {
    this.currentPage--;
    if (this.filterUsed) {
      this.filter(this.currentPage);
    } else {
      this.obtenerProductos(this.currentPage);
    }
  }

  public actualizarProductosDisponibles() {
    this.productosDisponibles = this.currentPage < this.pages.length - 1;
  }

  public resetForm() {
    this.filterForm.reset();
  }
}