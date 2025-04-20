import { Component, OnInit } from '@angular/core';
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
export class HomeComponent implements OnInit {
  carouselItems = [
    {
      imageUrl: 'https://www.semana.com/resizer/v2/UBZ5DYABJZCQVMS26LBZDA2QTM.jpg?auth=394188381b20bf2c9faf8c2d44e30e5b6240c03549840bb27f596246abfe2d7c&smart=true&quality=75&width=1280&height=720',
      title: 'Bienvenido a Tienda Sana',
      subtitle: 'Descubre productos saludables para tu estilo de vida'
    },
    {
      imageUrl: 'https://strapi.fitia.app/uploads/verduras_402de1696c.jpg',
      title: 'Ofertas Especiales',
      subtitle: 'Aprovecha descuentos exclusivos en nuestros productos'
    },
    {
      imageUrl: 'https://ccviva.com/sites/default/files/2024-09/restaurantes-envigado.jpeg',
      title: 'Calidad Garantizada',
      subtitle: 'Productos seleccionados con los más altos estándares'
    }
  ];

  currentPage: number = 0;
  filterForm!: FormGroup;
  productos: any[] = [];
  seleccionados: any[] = [];
  productosDisponibles: boolean = true;
  pages: number[] = [];
  filterUsed: boolean = false;
  tipos: string[] = [];
  activeSlideIndex: number = 0;
  slideInterval: any; // Variable para almacenar el temporizador

  /**
   * Constructor de la clase HomeComponent
   * @param publicoService publicoService para manejar la lógica de negocio relacionada con el cliente
   * @param formBuilder formBuilder para construir formularios reactivos
   */
  constructor(private publicoService: PublicoService, private formBuilder: FormBuilder) {
    this.productos = [];
    this.obtenerProductos(this.currentPage);
    this.obtenerCategorias();
    this.createForm();
    this.seleccionados = [];
    
  }

  /**
   * Método para inicializar el componente
   */
  ngOnInit(): void {
    this.createForm();
    this.startSlideInterval(); // Inicia el cambio automático de subtítulos
  }

  /**
   * Método para inicializar el formulario reactivo
   */
  ngOnDestroy(): void {
    this.stopSlideInterval(); // Detiene el temporizador al destruir el componente
  }

  /**
   * Método para iniciar el intervalo de cambio automático de subtítulos
   */
  startSlideInterval(): void {
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Cambia cada 5 segundos
  }

  /**
   * Método para detener el intervalo de cambio automático de subtítulos
   */
  stopSlideInterval(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  /**
   * Método para cambiar al siguiente subtítulo del carrusel
   */
  nextSlide() {
    this.activeSlideIndex = (this.activeSlideIndex + 1) % this.carouselItems.length;
  }

  /**
   * Método para cambiar al subtítulo anterior del carrusel
   */
  prevSlide() {
    this.activeSlideIndex = (this.activeSlideIndex - 1 + this.carouselItems.length) % this.carouselItems.length;
  }

  /**
   * Método para obtener el producto por ID
   * @param id ID del producto
   */
  public obtenerProductos(page: number) {
    this.publicoService.listarProductos(page).subscribe({
      next: (data) => {
        console.log(data);
        this.pages = Array.from({ length: data.reply.totalPaginas }, (_, i) => i + 1);
        this.productos = data.reply.productos;
        this.currentPage = page;
        this.actualizarProductosDisponibles();
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  /**
   * Método para obtener las categorías de productos
   */
  public obtenerCategorias() {
    // Lógica para obtener categorías
  }

  /**
   * Método para crear el formulario reactivo
   */
  createForm() {
    this.filterForm = this.formBuilder.group({
      name: [''],
      city: [''],
      eventType: ['OTHER'],
    });
  }

  /**
   * Método para aplicar el filtro a los productos
   * @param page Página actual
   */
  public filter(page: number) {
    // Lógica para filtrar productos
  }

  /**
   * Método para agregar un producto a la lista de seleccionados
   * @param producto Producto a agregar
   */
  public nextPage() {
    this.currentPage++;
    if (this.filterUsed) {
      this.filter(this.currentPage);
    } else {
      this.obtenerProductos(this.currentPage);
    }
    this.actualizarProductosDisponibles();
  }

  /**
   * Método para ir a la página anterior
   */
  public previousPage() {
    this.currentPage--;
    if (this.filterUsed) {
      this.filter(this.currentPage);
    } else {
      this.obtenerProductos(this.currentPage);
    }
  }

  /**
   * Metodo para actualizar la disponibilidad de productos
   */
  public actualizarProductosDisponibles() {
    this.productosDisponibles = this.currentPage < this.pages.length - 1;
  }

  /**
   * Metodo para reiniciar el formulario de filtro
   */
  public resetForm() {
    this.filterForm.reset();
  }
}