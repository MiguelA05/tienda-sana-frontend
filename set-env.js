const { writeFileSync, mkdirSync, existsSync } = require('fs');
const dotenv = require('dotenv');

// Cargar variables de entorno desde .env (opcional en local)
dotenv.config();

// Validar variables necesarias
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

// Crear carpeta si no existe
const envDir = 'src/environments';
if (!existsSync(envDir)) {
  mkdirSync(envDir, { recursive: true });
}

// Plantilla
const template = (prod) => `export const environment = {
  production: ${prod},
  authServiceUrl: '${process.env.AUTH_SERVICE_URL}',
  clienteServiceUrl: '${process.env.CLIENTE_SERVICE_URL}',
  cuentaServiceUrl: '${process.env.CUENTA_SERVICE_URL}',
  publicoServiceUrl: '${process.env.PUBLICO_SERVICE_URL}'
};`;

// Crear archivos
writeFileSync(`${envDir}/environment.ts`, template(false));
writeFileSync(`${envDir}/environment.prod.ts`, template(true));
console.log('✅ Archivos de entorno generados correctamente.');
