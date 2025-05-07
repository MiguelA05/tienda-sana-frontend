import { MesaDTO } from "./mesa-dto";

export interface CrearReservaDTO {
    emailUsuario: string,
    fechaReserva: Date,
    cantidadPersonas: number,
    mesas: MesaDTO[],
}