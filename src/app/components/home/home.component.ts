import { AfterViewInit, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CardGridComponent } from '../card-grid/card-grid.component';
import { PublicoService } from '../../services/publico.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FiltroProductoDTO } from '../../dto/filtro-producto-dto';
import { FiltroMesaDTO } from '../../dto/filtro-mesa-dto';
import { CommonModule } from '@angular/common';
import { CardGridMesaComponent } from '../card-grid-mesa/card-grid-mesa.component';
import { ClienteService } from '../../services/cliente.service';
import { TokenService } from '../../services/token.service';
import { AiRecommendationRequestDTO } from '../../dto/ai-recommendation-request-dto';
import { AiRecommendationResponseDTO } from '../../dto/ai-recommendation-response-dto';
import { AiComboRecommendationDTO } from '../../dto/ai-combo-recommendation-dto';
import { ItemCarritoDTO } from '../../dto/item-carrito-dto';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CardGridComponent, FormsModule, ReactiveFormsModule, RouterModule, CommonModule, CardGridMesaComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private revealObserver?: IntersectionObserver;
  private sheetTouchStartY: number | null = null;
  private sheetTouchDeltaY: number = 0;

  valorItems = [
    {
      icon: 'fa-solid fa-leaf',
      title: '100% natural',
      description: 'Ingredientes frescos de origen confiable, sin conservantes innecesarios.'
    },
    {
      icon: 'fa-solid fa-bolt',
      title: 'Entrega rapida',
      description: 'Tus productos y reservas confirmados en minutos con un flujo simple.'
    },
    {
      icon: 'fa-solid fa-heart-pulse',
      title: 'Bienestar diario',
      description: 'Comer saludable con sabor real para convertirlo en un habito sostenible.'
    }
  ];

  isLoading: boolean = false;
  currentPage: number = 0;
  filterForm!: FormGroup;
  productos: any[] = [];
  seleccionados: any[] = [];
  productosDisponibles: boolean = true;
  pages: number[] = [];
  filterUsed: boolean = false;
  categoria: string[] = [];

  mesaFilterForm!: FormGroup;
  mesas: any[] = [];
  mesasDisponibles: boolean = true;
  mesasPages: number[] = [];
  mesaFilterUsed: boolean = false;
  ubicaciones: string[] = [];
  mesasCurrentPage: number = 0;

  activeView: string = 'productos';
  productosLoaded: boolean = false;
  mesasLoaded: boolean = false;

  aiLoading: boolean = false;
  aiAddingCombo: boolean = false;
  assistantOpen: boolean = false;
  aiRecommendations: AiComboRecommendationDTO[] = [];
  aiDisclaimer: string = '';
  aiSource: string = '';
  aiSkeletonCards: number[] = [1, 2];
  readonly aiObjetivoOptions: string[] = ['Alto en proteina', 'Ligero', 'Energizante', 'Balanceado', 'Otro'];
  readonly aiRestriccionOptions: string[] = ['Sin lactosa', 'Sin gluten', 'Vegano', 'Bajo azucar', 'Sin restriccion', 'Otro'];
  readonly aiMomentoOptions: string[] = ['Desayuno', 'Almuerzo', 'Cena', 'Post entrenamiento', 'Otro'];
  readonly aiPresupuestoOptions: Array<{ label: string; value: number | null | 'other' }> = [
    { label: 'Sin limite', value: null },
    { label: 'Hasta $15k', value: 15000 },
    { label: 'Hasta $25k', value: 25000 },
    { label: 'Hasta $35k', value: 35000 },
    { label: 'Otro', value: 'other' }
  ];
  isCustomObjetivo: boolean = false;
  isCustomRestriccion: boolean = false;
  isCustomMomento: boolean = false;
  isCustomPresupuesto: boolean = false;
  customObjetivo: string = '';
  customRestriccion: string = '';
  customMomentoDia: string = '';
  customPresupuesto: number | null = null;
  aiRequest: AiRecommendationRequestDTO = {
    objetivo: '',
    restriccion: '',
    presupuestoMax: null,
    momentoDia: ''
  };

  get isLogged(): boolean {
    return this.tokenService.isLogged();
  }

  get isCliente(): boolean {
    return this.tokenService.getRol() === 'CLIENTE';
  }

  constructor(
    private publicoService: PublicoService,
    private clienteService: ClienteService,
    private tokenService: TokenService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productos = [];
    this.mesas = [];
    this.obtenerProductos(this.currentPage);
    this.obtenerMesas(this.mesasCurrentPage);
    this.obtenerCategorias();
    this.obtenerLocalidades();
    this.createForm();
    this.createMesaForm();
    this.seleccionados = [];
    this.filterUsed = false;
    this.mesaFilterUsed = false;
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    if (this.assistantOpen) {
      this.closeAiAssistant();
    }
  }

  openAiAssistant(): void {
    this.assistantOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeAiAssistant(): void {
    this.assistantOpen = false;
    this.sheetTouchStartY = null;
    this.sheetTouchDeltaY = 0;
    document.body.style.overflow = '';
  }

  toggleAiAssistant(): void {
    if (this.assistantOpen) {
      this.closeAiAssistant();
      return;
    }
    this.openAiAssistant();
  }

  seleccionarObjetivo(value: string): void {
    if (value === 'Otro') {
      this.isCustomObjetivo = !this.isCustomObjetivo;
      if (!this.isCustomObjetivo) {
        this.customObjetivo = '';
        this.aiRequest.objetivo = '';
      } else {
        this.aiRequest.objetivo = this.customObjetivo.trim();
      }
      return;
    }
    this.isCustomObjetivo = false;
    this.customObjetivo = '';
    this.aiRequest.objetivo = this.aiRequest.objetivo === value ? '' : value;
  }

  seleccionarRestriccion(value: string): void {
    if (value === 'Otro') {
      this.isCustomRestriccion = !this.isCustomRestriccion;
      if (!this.isCustomRestriccion) {
        this.customRestriccion = '';
        this.aiRequest.restriccion = '';
      } else {
        this.aiRequest.restriccion = this.customRestriccion.trim();
      }
      return;
    }
    this.isCustomRestriccion = false;
    this.customRestriccion = '';
    this.aiRequest.restriccion = this.aiRequest.restriccion === value ? '' : value;
  }

  seleccionarMomento(value: string): void {
    if (value === 'Otro') {
      this.isCustomMomento = !this.isCustomMomento;
      if (!this.isCustomMomento) {
        this.customMomentoDia = '';
        this.aiRequest.momentoDia = '';
      } else {
        this.aiRequest.momentoDia = this.customMomentoDia.trim();
      }
      return;
    }
    this.isCustomMomento = false;
    this.customMomentoDia = '';
    this.aiRequest.momentoDia = this.aiRequest.momentoDia === value ? '' : value;
  }

  seleccionarPresupuesto(value: number | null | 'other'): void {
    if (value === 'other') {
      this.isCustomPresupuesto = !this.isCustomPresupuesto;
      if (!this.isCustomPresupuesto) {
        this.customPresupuesto = null;
        this.aiRequest.presupuestoMax = null;
      } else {
        this.aiRequest.presupuestoMax = this.customPresupuesto;
      }
      return;
    }
    this.isCustomPresupuesto = false;
    this.customPresupuesto = null;
    this.aiRequest.presupuestoMax = this.aiRequest.presupuestoMax === value ? null : value;
  }

  onCustomObjetivoChange(value: string): void {
    this.customObjetivo = value;
    this.aiRequest.objetivo = value.trim();
  }

  onCustomRestriccionChange(value: string): void {
    this.customRestriccion = value;
    this.aiRequest.restriccion = value.trim();
  }

  onCustomMomentoChange(value: string): void {
    this.customMomentoDia = value;
    this.aiRequest.momentoDia = value.trim();
  }

  onCustomPresupuestoChange(value: number | null): void {
    this.customPresupuesto = value;
    this.aiRequest.presupuestoMax = value;
  }

  isObjetivoOptionActive(option: string): boolean {
    return option === 'Otro' ? this.isCustomObjetivo : !this.isCustomObjetivo && this.aiRequest.objetivo === option;
  }

  isRestriccionOptionActive(option: string): boolean {
    return option === 'Otro' ? this.isCustomRestriccion : !this.isCustomRestriccion && this.aiRequest.restriccion === option;
  }

  isMomentoOptionActive(option: string): boolean {
    return option === 'Otro' ? this.isCustomMomento : !this.isCustomMomento && this.aiRequest.momentoDia === option;
  }

  isPresupuestoOptionActive(value: number | null | 'other'): boolean {
    return value === 'other'
      ? this.isCustomPresupuesto
      : !this.isCustomPresupuesto && this.aiRequest.presupuestoMax === value;
  }

  onAiSheetTouchStart(event: TouchEvent): void {
    if (window.innerWidth > 760) {
      return;
    }
    this.sheetTouchStartY = event.touches[0]?.clientY ?? null;
    this.sheetTouchDeltaY = 0;
  }

  onAiSheetTouchMove(event: TouchEvent): void {
    if (window.innerWidth > 760 || this.sheetTouchStartY === null) {
      return;
    }
    const currentY = event.touches[0]?.clientY ?? this.sheetTouchStartY;
    this.sheetTouchDeltaY = currentY - this.sheetTouchStartY;
  }

  onAiSheetTouchEnd(): void {
    if (window.innerWidth <= 760 && this.sheetTouchDeltaY > 90) {
      this.closeAiAssistant();
    }
    this.sheetTouchStartY = null;
    this.sheetTouchDeltaY = 0;
  }

  obtenerTagsProductoIA(producto: { nombre: string; categoria: string }): string[] {
    const tags = new Set<string>();
    const categoria = (producto.categoria || '').toLowerCase();
    const nombre = (producto.nombre || '').toLowerCase();

    if (categoria.includes('ensalada')) {
      tags.add('Fresh');
    }
    if (categoria.includes('bebidas')) {
      tags.add('Hidratante');
    }
    if (categoria.includes('platos fuertes') || nombre.includes('pollo') || nombre.includes('hummus')) {
      tags.add('Proteina');
    }
    if (categoria.includes('postres')) {
      tags.add('Sweet');
    }
    if (categoria.includes('desayunos')) {
      tags.add('Morning');
    }

    if (tags.size === 0) {
      tags.add('Recomendado');
    }

    return Array.from(tags).slice(0, 2);
  }

  solicitarRecomendacionIA(): void {
    const payload: AiRecommendationRequestDTO = {
      objetivo: (this.aiRequest.objetivo || '').trim(),
      restriccion: (this.aiRequest.restriccion || '').trim(),
      presupuestoMax: this.aiRequest.presupuestoMax ?? null,
      momentoDia: (this.aiRequest.momentoDia || '').trim()
    };

    const sinCriterios = !payload.objetivo && !payload.restriccion && !payload.momentoDia && !payload.presupuestoMax;
    if (sinCriterios) {
      Swal.fire({
        icon: 'info',
        title: 'Faltan criterios',
        text: 'Escribe al menos un objetivo o un presupuesto para generar recomendaciones.'
      });
      return;
    }

    this.aiLoading = true;
    this.publicoService.recomendarCombosIA(payload).subscribe({
      next: (data) => {
        this.aiLoading = false;
        const reply = data.reply as AiRecommendationResponseDTO;
        this.aiRecommendations = reply?.recomendaciones ?? [];
        this.aiDisclaimer = reply?.aviso ?? '';
        this.aiSource = reply?.origen ?? '';

        if (this.aiRecommendations.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Sin recomendaciones',
            text: 'No fue posible generar opciones con los criterios actuales.'
          });
        }
      },
      error: (error) => {
        this.aiLoading = false;
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Error IA',
          text: 'No fue posible generar recomendaciones en este momento.'
        });
      }
    });
  }

  limpiarAsistenteIA(): void {
    this.aiRequest = {
      objetivo: '',
      restriccion: '',
      presupuestoMax: null,
      momentoDia: ''
    };
    this.aiRecommendations = [];
    this.aiDisclaimer = '';
    this.aiSource = '';
    this.isCustomObjetivo = false;
    this.isCustomRestriccion = false;
    this.isCustomMomento = false;
    this.isCustomPresupuesto = false;
    this.customObjetivo = '';
    this.customRestriccion = '';
    this.customMomentoDia = '';
    this.customPresupuesto = null;
  }

  agregarComboIAAlCarrito(combo: AiComboRecommendationDTO): void {
    if (!this.tokenService.getToken()) {
      Swal.fire({
        title: 'No estas logueado',
        text: 'Inicia sesion para agregar el combo al carrito.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Iniciar sesion',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
      return;
    }

    if (!this.isCliente) {
      Swal.fire({
        icon: 'warning',
        title: 'Accion no permitida',
        text: 'Solo las cuentas con rol CLIENTE pueden agregar productos al carrito.'
      });
      return;
    }

    if (!combo.productos || combo.productos.length === 0) {
      Swal.fire('Error', 'El combo no tiene productos para agregar.', 'error');
      return;
    }

    this.aiAddingCombo = true;
    const userId = this.tokenService.getIDCuenta();
    const requests = combo.productos.map((producto) => {
      const item: ItemCarritoDTO = {
        idUsuario: userId,
        idProducto: producto.id,
        nombreProducto: producto.nombre,
        categoria: producto.categoria,
        precio: producto.precioUnitario,
        cantidad: 1,
        total: producto.precioUnitario
      };
      return this.clienteService.agregarItemCarrito(item);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.aiAddingCombo = false;
        Swal.fire('Exito', 'Combo agregado al carrito correctamente.', 'success');
      },
      error: (error) => {
        this.aiAddingCombo = false;
        console.error(error);
        const backendMessage = error?.error?.reply || error?.error?.respuesta || 'No fue posible agregar todos los productos del combo.';
        Swal.fire('Error', backendMessage, 'error');
      }
    });
  }

  ngOnInit(): void {
    this.createForm();
    this.createMesaForm();

    this.route.queryParams.subscribe(params => {
      if (params['reset']) {
        this.resetForm();
        this.filterUsed = false;
        this.currentPage = 0;
        this.obtenerProductos(this.currentPage);
        this.resetMesaForm();
        this.mesaFilterUsed = false;
        this.mesasCurrentPage = 0;
        this.obtenerMesas(this.mesasCurrentPage);
        this.activeView = 'productos';
        this.router.navigate([], {
          queryParams: { reset: null },
          replaceUrl: true
        });
      }
    });

    this.route.fragment.subscribe((fragment) => {
      if (!fragment) {
        return;
      }
      if (fragment === 'reservas') {
        this.activeView = 'mesas';
        if (!this.mesasLoaded && !this.mesaFilterUsed) {
          this.obtenerMesas(this.mesasCurrentPage);
        }
      }
      if (fragment === 'productos') {
        this.activeView = 'productos';
        if (!this.productosLoaded && !this.filterUsed) {
          this.obtenerProductos(this.currentPage);
        }
      }
      setTimeout(() => this.scrollToSection(fragment), 60);
    });
  }

  ngAfterViewInit(): void {
    this.inicializarAnimacionesScroll();
  }

  ngOnDestroy(): void {
    this.revealObserver?.disconnect();
    document.body.style.overflow = '';
  }

  changeView(view: string) {
    this.activeView = view;
  }

  irAProductosDesdeHero(): void {
    this.activeView = 'productos';
    if (!this.productosLoaded && !this.filterUsed) {
      this.obtenerProductos(this.currentPage);
    }

    const currentFragment = this.router.parseUrl(this.router.url).fragment;
    if (currentFragment === 'productos') {
      setTimeout(() => this.scrollToSection('productos'), 0);
      return;
    }

    this.router.navigate([], {
      fragment: 'productos',
      queryParamsHandling: 'replace'
    });
  }

  irAMesasDesdeHero(): void {
    this.activeView = 'mesas';
    if (!this.mesasLoaded && !this.mesaFilterUsed) {
      this.obtenerMesas(this.mesasCurrentPage);
    }

    const currentFragment = this.router.parseUrl(this.router.url).fragment;
    if (currentFragment === 'reservas') {
      setTimeout(() => this.scrollToSection('reservas'), 0);
      return;
    }

    this.router.navigate([], {
      fragment: 'reservas',
      queryParamsHandling: 'replace'
    });
  }

  public obtenerProductos(page: number) {
    this.publicoService.listarProductos(page).subscribe({
      next: (data) => {
        this.pages = Array.from({ length: data.reply.totalPaginas }, (_, i) => i + 1);
        this.productos = data.reply.productos;
        this.currentPage = page;
        this.actualizarProductosDisponibles();
        this.productosLoaded = true;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  public obtenerMesas(page: number) {
    this.publicoService.listarMesas(page).subscribe({
      next: (data) => {
        this.mesasPages = Array.from({ length: data.reply.totalPaginas }, (_, i) => i + 1);
        this.mesas = data.reply.mesas;
        this.mesasCurrentPage = page;
        this.actualizarMesasDisponibles();
        this.mesasLoaded = true;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

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
      }
    });
  }

  public obtenerLocalidades() {
    this.publicoService.listarLocalidades().subscribe({
      next: (data) => {
        this.ubicaciones = data.reply;
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  createMesaForm() {
    this.mesaFilterForm = this.formBuilder.group({
      nombre: [''],
      capacidad: ['', [Validators.min(0)]],
      localidad: [''],
    });
  }

  public filtrarProductos(pagina: number) {
    if (this.isProductoFilterEmpty()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, completa al menos un filtro valido.'
      });
      return;
    }

    this.isLoading = true;
    this.filterUsed = true;
    const filtroProductoDTO = this.filterForm.value as FiltroProductoDTO;
    filtroProductoDTO.pagina = pagina;

    this.publicoService.filtrarProductos(filtroProductoDTO).subscribe({
      next: (data) => {
        this.isLoading = false;
        if (data.reply && data.reply.productos.length > 0) {
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
        this.isLoading = false;
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrio un problema al filtrar productos.'
        });
      }
    });
  }

  private isProductoFilterEmpty(): boolean {
    const { nombre, cantidad, categoria } = this.filterForm.value;
    return (
      (!nombre || nombre.trim() === '') &&
      (!cantidad || isNaN(Number(cantidad)) || Number(cantidad) <= 0) &&
      (!categoria || categoria.trim() === '')
    );
  }

  public filterMesas(pagina: number) {
    if (this.isMesaFilterEmpty()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Por favor, completa al menos un filtro valido.'
      });
      return;
    }

    this.isLoading = true;
    this.mesaFilterUsed = true;
    const filtroMesaDTO = this.mesaFilterForm.value as FiltroMesaDTO;
    filtroMesaDTO.pagina = pagina;

    this.publicoService.filtrarMesas(filtroMesaDTO).subscribe({
      next: (data) => {
        this.isLoading = false;
        if (data.reply && data.reply.mesas.length > 0) {
          this.mesasPages = new Array(data.reply.totalPages);
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
        this.isLoading = false;
        console.error(error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrio un problema al filtrar mesas.'
        });
      }
    });
  }

  private isMesaFilterEmpty(): boolean {
    const { nombre, capacidad, localidad } = this.mesaFilterForm.value;
    return (
      (!nombre || nombre.trim() === '') &&
      (!capacidad || isNaN(Number(capacidad)) || Number(capacidad) < 0) &&
      (!localidad || localidad.trim() === '')
    );
  }

  public nextPage() {
    this.currentPage++;
    if (this.filterUsed) {
      this.filtrarProductos(this.currentPage);
    } else {
      this.obtenerProductos(this.currentPage);
    }
    this.actualizarProductosDisponibles();
  }

  public previousPage() {
    this.currentPage--;
    if (this.filterUsed) {
      this.filtrarProductos(this.currentPage);
    } else {
      this.obtenerProductos(this.currentPage);
    }
  }

  public nextPageMesas() {
    this.mesasCurrentPage++;
    if (this.mesaFilterUsed) {
      this.filterMesas(this.mesasCurrentPage);
    } else {
      this.obtenerMesas(this.mesasCurrentPage);
    }
    this.actualizarMesasDisponibles();
  }

  public previousPageMesas() {
    this.mesasCurrentPage--;
    if (this.mesaFilterUsed) {
      this.filterMesas(this.mesasCurrentPage);
    } else {
      this.obtenerMesas(this.mesasCurrentPage);
    }
  }

  public actualizarProductosDisponibles() {
    this.productosDisponibles = this.currentPage < this.pages.length - 1;
  }

  public actualizarMesasDisponibles() {
    this.mesasDisponibles = this.mesasCurrentPage < this.mesasPages.length - 1;
  }

  public resetForm() {
    this.filterForm.reset();
  }

  public resetMesaForm() {
    this.mesaFilterForm.reset();
  }

  private scrollToSection(sectionId: string): void {
    const targetId = (sectionId === 'productos' || sectionId === 'reservas') ? 'catalogo' : sectionId;
    const section = document.getElementById(targetId);
    if (!section) {
      return;
    }

    const header = document.querySelector('.header-container') as HTMLElement | null;
    const headerOffset = header?.offsetHeight ?? 88;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;

    // Keep catalog navigation visually centered while respecting fixed header height.
    const centerOffset = Math.max((window.innerHeight - section.getBoundingClientRect().height) / 2, 0);
    const targetY = Math.max(sectionTop - headerOffset - centerOffset + 36, 0);

    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }

  private inicializarAnimacionesScroll(): void {
    const elements = Array.from(document.querySelectorAll('.reveal-on-scroll'));
    if (elements.length === 0) {
      return;
    }

    this.revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          this.revealObserver?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    elements.forEach((el) => this.revealObserver?.observe(el));
  }
}
