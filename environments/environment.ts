import { config } from 'dotenv';

config(); // Carga las variables del archivo .env

export const environment = {
  production: false,
  authServiceUrl: process.env['AUTH_SERVICE_URL'] || '',
  clienteServiceUrl: process.env['CLIENTE_SERVICE_URL'] || '',
  cuentaServiceUrl: process.env['CUENTA_SERVICE_URL'] || '',
  publicoServiceUrl: process.env['PUBLICO_SERVICE_URL'] || ''
};