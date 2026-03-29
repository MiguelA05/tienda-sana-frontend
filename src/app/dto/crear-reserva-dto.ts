import { MesaDTO } from "./mesa-dto";

export interface CrearReservaDTO {
    emailUsuario: string,
    fechaReserva: string,
    cantidadPersonas: number,
    mesas: MesaDTO[],
}