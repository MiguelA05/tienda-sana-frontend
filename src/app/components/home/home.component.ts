import { Component } from '@angular/core';
import { CardGridComponent } from "../card-grid/card-grid.component";
import { PublicoService } from '../../services/publico.service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {LoginDTO} from '../../dto/login-dto';
import {FiltroProductoDTO} from '../../dto/filtro-producto-dto';
import {ProductoDTO} from '../../dto/producto-dto';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CardGridComponent, FormsModule,ReactiveFormsModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  currentPage: number = 0;
  filterForm!: FormGroup;
  productos: [] = [];
  seleccionados: ProductoDTO[];
  productosDisponibles: boolean = true;
  pages: number[] = [];
  filterUsed: boolean = false;
  tipos: string[]=[];

  typeSelected: boolean = false;
  constructor(private publicoService: PublicoService, private formBuilder: FormBuilder) {
    this.productos = [];
    this.obtenerProductos(this.currentPage);
    this.obtenerCategorias();
    this.createForm();

    

    this.seleccionados = [];
    
  }

  
  public obtenerProductos(page: number) {
    
  }

  public obtenerCategorias() {
    
  }

  createForm() {
    this.filterForm = this.formBuilder.group({
      name: [''],
      city: [''],
      eventType: ['OTHER'],
    });
  }

  public filter(page: number) {
    
  }

  public nextPage() {
    this.currentPage++;
    if (this.filterUsed) {
      this.filter(this.currentPage)
    } else {
      this.obtenerProductos(this.currentPage);
    }
    this.actualizarProductosDisponibles();
  }

  public previousPage() {
    this.currentPage--;
    if (this.filterUsed) {
      this.filter(this.currentPage)
    } else {
      this.obtenerProductos(this.currentPage);
    }
  }

  public actualizarProductosDisponibles() {
    this.productosDisponibles = this.currentPage < this.pages.length-1;
  }

  public resetForm() {
    this.filterForm.reset();
  }


}

