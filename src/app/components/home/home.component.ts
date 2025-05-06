import { Component, OnInit } from '@angular/core';
import { CardGridComponent } from "../card-grid/card-grid.component";
import { PublicoService } from '../../services/publico.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CardGridMesaComponent } from '../card-grid-mesa/card-grid-mesa.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CardGridComponent, FormsModule, ReactiveFormsModule, RouterModule, CommonModule, CardGridMesaComponent],
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

   // Nuevas variables para mesas
   mesaFilterForm!: FormGroup;
   mesas: any[] = [];
   mesasDisponibles: boolean = true;
   mesasPages: number[] = [];
   mesaFilterUsed: boolean = false;
   ubicaciones: string[] = [];
   mesasCurrentPage: number = 0;

   // Controlar la vista activa
  activeView: string = 'mesas'; // 'productos' o 'mesas'

  /**
   * Constructor de la clase HomeComponent
   * @param publicoService publicoService para manejar la lógica de negocio relacionada con el cliente
   * @param formBuilder formBuilder para construir formularios reactivos
   */
  constructor(private publicoService: PublicoService, private formBuilder: FormBuilder) {
    this.productos = [];
    this.mesas = [
      {
        idMesa: '1',
        nombre: 'Mesa 1',
        estado: 'disponible',
        capacidad: 4,
        localidad: 'Zona 1',
        precioReserva: 100,
        imagenReferencial: 'https://reimse.mx/wp-content/uploads/2020/02/mesa-madera-exteriores-ata-160.jpg'
      },
      {
        idMesa: '2',
        nombre: 'Mesa 2',
        estado: 'reservada',
        capacidad: 6,
        localidad: 'Zona 2',
        precioReserva: 150,
        imagenReferencial: 'https://rimax.vtexassets.com/arquivos/ids/160176-800-auto?v=638792130136770000&width=800&height=auto&aspect=true'
      },
      {
        idMesa: '3',
        nombre: 'Mesa 3',
        estado: 'disponible',
        capacidad: 8,
        localidad: 'Zona 3',
        precioReserva: 200,
        imagenReferencial: 'https://media.istockphoto.com/id/1250026682/es/foto/mesa-de-centro-aislada-sobre-fondo-blanco-con-trayectoria-de-recorte-incluida-renderizado-3d.jpg?s=612x612&w=0&k=20&c=ZcsccUB2uQC0q1jwJF7Mo2529loph2fonVAotzsm8Ps='
      }
    ];
    this.obtenerProductos(this.currentPage);
    this.obtenerMesas(this.mesasCurrentPage); // Inicializa la lista de mesas
    this.obtenerCategorias();
    this.obtenerUbicaciones();
    this.createForm();
    this.createMesaForm();
    this.seleccionados = [];
    
  }

  /**
   * Método para inicializar el componente
   */
  ngOnInit(): void {
    this.createForm();
    this.createMesaForm();
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
   * Método para cambiar entre la vista de productos y mesas
   * @param view Vista a activar ('productos' o 'mesas')
   */
  changeView(view: string) {
    this.activeView = view;
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
   * Método para obtener las mesas paginadas
   * @param page Número de página
   */
  public obtenerMesas(page: number) {
    this.publicoService.listarMesas(page).subscribe({
      next: (data) => {
        console.log(data);
        this.mesasPages = Array.from({ length: data.reply.totalPaginas }, (_, i) => i + 1);
        this.mesas = data.reply.mesas;
        this.mesasCurrentPage = page;
        this.actualizarMesasDisponibles();
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
   * Método para obtener las ubicaciones de mesas
   */
  public obtenerUbicaciones() {
    // Simular que obtenemos ubicaciones desde un servicio
    this.ubicaciones = ['Terraza', 'Interior', 'Zona VIP', 'Jardín'];
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
   * Método para crear el formulario reactivo de mesas
   */
  createMesaForm() {
    this.mesaFilterForm = this.formBuilder.group({
      nombre: [''],
      capacidad: ['', [Validators.min(0)]],
      ubicacion: [''],
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
   * Método para aplicar el filtro a las mesas
   * @param page Página actual
   */
  public filterMesas(page: number) {
    // Lógica para filtrar mesas
    this.mesaFilterUsed = true;
    // Implementación del filtro...
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
   * Método para ir a la siguiente página de mesas
   */
  public nextPageMesas() {
    this.mesasCurrentPage++;
    if (this.mesaFilterUsed) {
      this.filterMesas(this.mesasCurrentPage);
    } else {
      this.obtenerMesas(this.mesasCurrentPage);
    }
    this.actualizarMesasDisponibles();
  }

  /**
   * Método para ir a la página anterior de mesas
   */
  public previousPageMesas() {
    this.mesasCurrentPage--;
    if (this.mesaFilterUsed) {
      this.filterMesas(this.mesasCurrentPage);
    } else {
      this.obtenerMesas(this.mesasCurrentPage);
    }
  }

  /**
   * Metodo para actualizar la disponibilidad de productos
   */
  public actualizarProductosDisponibles() {
    this.productosDisponibles = this.currentPage < this.pages.length - 1;
  }

  /**
   * Método para actualizar la disponibilidad de mesas
   */
  public actualizarMesasDisponibles() {
    this.mesasDisponibles = this.mesasCurrentPage < this.mesasPages.length - 1;
  }

  /**
   * Metodo para reiniciar el formulario de filtro
   */
  public resetForm() {
    this.filterForm.reset();
  }

  /**
   * Método para reiniciar el formulario de filtro de mesas
   */
  public resetMesaForm() {
    this.mesaFilterForm.reset();
  }


  /**
   * Método para navegar al detalle de una mesa
   * @param id ID de la mesa
   */
  public irADetalleMesa(id: number) {
    // Implementación de navegación al detalle de la mesa
  }
}