import { MesaDTO } from "./mesa-dto"

export interface ItemReservaDTO {
    emailUsuaio: string,
    fechaReserva: Date | null,
    fechaFinReserva?: Date | null,
    estadoReserva: string
    paymentType: string,
    status: string,
    paymentDate: Date | null,
    transactionValue: number,
    idReserva : string
    total: number,
    cantidadPersonas: number
    mesas: MesaDTO[]
}