import { ItemMesaDTO } from "./item-mesa-dto";

export interface ListaMesaDTO {
    paginasTotates: number,
    mesas: ItemMesaDTO[]
}