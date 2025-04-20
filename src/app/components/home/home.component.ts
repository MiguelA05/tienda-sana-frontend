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
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/unieventos-images-service.appspot.com/o/verduras_402de1696c-compressed-_1_.webp?alt=media&token=e9361056-28d0-407b-8239-6910d88e9418',
      title: 'Bienvenido a Tienda Sana',
      subtitle: 'Descubre productos saludables para tu estilo de vida'
    },
    {
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/unieventos-images-service.appspot.com/o/restaurantes-envigado-compressed.webp?alt=media&token=201f2ab0-8c0c-48c9-9884-928deb6463a8',
      title: 'Ofertas Especiales',
      subtitle: 'Aprovecha descuentos exclusivos en nuestros productos'
    },
    {
      imageUrl: 'https://firebasestorage.googleapis.com/v0/b/unieventos-images-service.appspot.com/o/hacer-platillos-mas-saludables-compressed.webp?alt=media&token=edf0180c-f2b4-433a-8fcb-b7421530f8b8',
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