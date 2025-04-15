import { ItemProductoDTO } from "./item-producto-dto";

export interface ListaProductoDTO {
    paginasTotales: number,
    productos: ItemProductoDTO[]
}