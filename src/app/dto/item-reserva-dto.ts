import { MesaDTO } from "./mesa-dto"

export interface ItemReservaDTO {
    emailUsuaio: string,
    fechaReserva: Date,
    estadoReserva: string
    paymentType: string,
    status: string,
    paymentDate: Date,
    transactionValue: number,
    idReserva : string
    total: number,
    cantidadPersonas: number
    mesas: MesaDTO[]
}