import { onRequest } from 'firebase-functions/v2/https';
import backendApp from '../backend/server.js';

console.log('🚀 Iniciando exportação da function API');

export const api = onRequest(backendApp);
