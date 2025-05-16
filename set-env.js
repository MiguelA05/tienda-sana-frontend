const { writeFileSync } = require('fs');
const dotenv = require('dotenv');
const result = dotenv.config();

const env = result.parsed;

if (!env) {
  console.error('❌ No se encontró .env o está vacío');
  process.exit(1);
}

const template = (prod) => `export const environment = {
  production: ${prod},
  authServiceUrl: '${env.AUTH_SERVICE_URL}',
  clienteServiceUrl: '${env.CLIENTE_SERVICE_URL}',
  cuentaServiceUrl: '${env.CUENTA_SERVICE_URL}',
  publicoServiceUrl: '${env.PUBLICO_SERVICE_URL}'
};
`;

writeFileSync('src/environments/environment.ts', template(false));
writeFileSync('src/environments/environment.prod.ts', template(true));

console.log('✅ environment.ts y environment.prod.ts actualizados');
console.log('🌱 Variables cargadas desde .env:', env);
