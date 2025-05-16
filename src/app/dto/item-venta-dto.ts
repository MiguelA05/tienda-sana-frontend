import { DetalleVentaDTO } from "./detalle-venta-dto"

export interface ItemVentaDTO {
    clienteId: string,
    fecha: Date,
    productos: DetalleVentaDTO[]
    tipoPago: string,
    estado: string,
    fechaPago: Date,
    valorTransaccion: number,
    id : string
    total: number,
    promocionId: string,
}