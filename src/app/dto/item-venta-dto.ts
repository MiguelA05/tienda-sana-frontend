import { DetalleVentaDTO } from "./detalle-venta-dto"

export interface ItemVentaDTO {
    clienteId: string,
    fecha: Date | null,
    productos: DetalleVentaDTO[]
    tipoPago: string,
    estado: string,
    fechaPago: Date | null,
    valorTransaccion: number,
    id : string
    total: number,
    promocionId: string,
}