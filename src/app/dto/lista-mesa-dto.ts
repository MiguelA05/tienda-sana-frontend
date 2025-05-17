import { ItemMesaDTO } from "./item-mesa-dto";

export interface ListaMesaDTO {
    totalPaginas: number,
    mesas: ItemMesaDTO[]
}