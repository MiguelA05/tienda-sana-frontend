import { Component, OnInit } from '@angular/core';
import { CardGridComponent } from "../card-grid/card-grid.component";
import { PublicoService } from '../../services/publico.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FiltroProductoDTO } from '../../dto/filtro-producto-dto';
import { FiltroMesaDTO } from '../../dto/filtro-mesa-dto'; // Ensure this path is correct
import { CommonModule } from '@angular/common';
import { CardGridMesaComponent } from '../card-grid-mesa/card-grid-mesa.component';
import Swal from 'sweetalert2';
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
  categoria: string[] = [];
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
  activeView: string = 'productos'; // 'productos' o 'mesas'

  /**
   * Constructor de la clase HomeComponent
   * @param publicoService publicoService para manejar la lógica de negocio relacionada con el cliente
   * @param formBuilder formBuilder para construir formularios reactivos
   */
  constructor(private publicoService: PublicoService, private formBuilder: FormBuilder, private route: ActivatedRoute) {
    this.productos = [];
    this.mesas = [];
    this.obtenerProductos(this.currentPage);
    this.obtenerMesas(this.mesasCurrentPage); // Inicializa la lista de mesas
    this.obtenerCategorias();
    this.obtenerLocalidades();
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
    this.route.queryParams.subscribe(params => {
      if (params['view']) {
        console.log("NOMBRE DE LA VISTA" + params['view']);
        this.activeView = params['view'];
      }
    });
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
   * Método para crear el formulario reactivo
   */
  createForm() {
    this.filterForm = this.formBuilder.group({
      nombre: [''],
      cantidad: [''],
      categoria: [''],
    });

    this.obtenerCategorias();
  }

  public obtenerCategorias() {
    this.publicoService.listarTipos().subscribe({
      next: (data) => {
        this.categoria = data.reply;
      },
      error: (error) => {
        console.error(error);
    }});
  }

  public obtenerLocalidades() {
    this.publicoService.listarLocalidades().subscribe({
      next: (data) => {
        this.ubicaciones = data.reply;
      },
      error: (error) => {
        console.error(error);
    }});
  }

  /**
   * Método para crear el formulario reactivo de mesas
   */
  createMesaForm() {
    this.mesaFilterForm = this.formBuilder.group({
      nombreMesa: [''],
      capacidad: ['', [Validators.min(0)]],
      ubicacion: [''],
    });
  }

  /**
   * Método para aplicar el filtro a los productos
   * @param pagina Página actual
   */
  public filtrarProductos(pagina: number) {
    if (this.filterForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos'
      });
      return;
    }
  
    const filtroProductoDTO = this.filterForm.value as FiltroProductoDTO;
    filtroProductoDTO.pagina = pagina;
    console.log("Caats: ", this.filterForm.value.categoria);
  
    
    
    this.publicoService.filtrarProductos(filtroProductoDTO).subscribe({
      next: (data) => {
        console.log("Data de filtro: ", data.reply.productos);
        console.log("Paginas: ", data.reply.totalPaginas);
        if (data.reply && data.reply.productos.length > 0) {
          console.log(data);
          this.pages = new Array(data.reply.totalPages);
          this.productos = data.reply.productos;
          this.currentPage = filtroProductoDTO.pagina;
          this.filterUsed = true;
          this.actualizarProductosDisponibles();
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Sin resultados',
            text: 'No se encontraron productos con los filtros seleccionados.'
          });
        }
      },
      error: (error) => {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un problema al filtrar los productos. Intente nuevamente más tarde.'
        });
      }
    });
  }



  /**
   * Método para aplicar el filtro a las mesas
   * @param page Página actual
   */
  public filterMesas(pagina: number) {
    if (this.mesaFilterForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos'
      });
      return;
    }
  
    const filtroMesaDTO = this.mesaFilterForm.value as FiltroMesaDTO;
    
    filtroMesaDTO.pagina = pagina;
  
    if (!filtroMesaDTO.localidad || filtroMesaDTO.localidad.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Seleccione una localidad de mesa'
      });
      return;
    }
  
    this.publicoService.filtrarMesas(filtroMesaDTO).subscribe({
      next: (data) => {
        if (data.reply && data.reply.mesas && data.reply.totalPages) {
          this.pages = new Array(data.reply.totalPages);
          this.mesas = data.reply.mesas;
          this.currentPage = filtroMesaDTO.pagina;
          this.mesaFilterUsed = true;
          this.actualizarMesasDisponibles();
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Sin resultados',
            text: 'No se encontraron mesas con los filtros seleccionados.'
          });
        }
      },
      error: (error) => {
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un problema al filtrar las mesas. Intente nuevamente más tarde.'
        });
      }
    });
  }

  /**
   * Método para agregar un producto a la lista de seleccionados
   * @param producto Producto a agregar
   */
  public nextPage() {
    this.currentPage++;
    if (this.filterUsed) {
      this.filtrarProductos(this.currentPage);
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
      this.filtrarProductos(this.currentPage);
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