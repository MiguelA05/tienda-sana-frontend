const { writeFileSync } = require('fs');
const dotenv = require('dotenv');
const result = dotenv.config();
const env = result.parsed || process.env;

if (!env.AUTH_SERVICE_URL) {
  console.error('❌ No se encontraron variables de entorno necesarias');
  process.exit(1);
}

const template = (prod) => `
export const environment = {
  production: ${prod},
  authServiceUrl: '${env.AUTH_SERVICE_URL}',
  clienteServiceUrl: '${env.CLIENTE_SERVICE_URL}',
  cuentaServiceUrl: '${env.CUENTA_SERVICE_URL}',
  publicoServiceUrl: '${env.PUBLICO_SERVICE_URL}'
};
`;

writeFileSync('src/environments/environment.ts', template(false));
writeFileSync('src/environments/environment.prod.ts', template(true));

console.log('✅ Archivos de environment generados correctamente.');
