import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para guardar datos en el servicio
 * Contiene los metodos para guardar y obtener datos
 */
export class DataService {

  private data: any;

  constructor(){
    this.data = "";
  }

  /**
   * Metodo para guardar datos en el servicio
   * @param data datos a guardar
   */
  setData(data: any) {
    this.data = data;
  }

  /**
   * Metodo para obtener los datos guardados en el servicio
   * @returns datos guardados
   */
  getData() {
    return this.data;
  }
}
