// set-env.js
const { writeFileSync } = require('fs');
const dotenv = require('dotenv');

// Cargar .env solo en local
dotenv.config(); // Esto pobla process.env

// Validar que existan las variables requeridas
const requiredVars = [
  'AUTH_SERVICE_URL',
  'CLIENTE_SERVICE_URL',
  'CUENTA_SERVICE_URL',
  'PUBLICO_SERVICE_URL',
];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`❌ Faltan variables de entorno: ${missing.join(', ')}`);
  process.exit(1);
}

const template = (prod) => `export const environment = {
  production: ${prod},
  authServiceUrl: '${process.env.AUTH_SERVICE_URL}',
  clienteServiceUrl: '${process.env.CLIENTE_SERVICE_URL}',
  cuentaServiceUrl: '${process.env.CUENTA_SERVICE_URL}',
  publicoServiceUrl: '${process.env.PUBLICO_SERVICE_URL}'
};`;

// Escribir archivos
writeFileSync('src/environments/environment.ts', template(false));
writeFileSync('src/environments/environment.prod.ts', template(true));
console.log('✅ environment.ts y environment.prod.ts actualizados');
