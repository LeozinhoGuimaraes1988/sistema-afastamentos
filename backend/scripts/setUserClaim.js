import admin from 'firebase-admin';
// import serviceAccount from '../firebaseServiceAccountKey.json' assert { type: 'json' };

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// UID do usuário e servidorId que ele pode acessar
const uid = 'sL5PqPoCPcPHf3YlGIpF4yxAsnH3';
const servidorId = 'servidor_unidade_1';

admin
  .auth()
  .setCustomUserClaims(uid, {
    autorizado: true,
    servidorId,
    admin: true,
  })
  .then(() => {
    console.log(`✅ Claims aplicadas para o usuário ${uid}`);
    process.exit();
  })
  .catch((error) => {
    console.error('❌ Erro ao definir claims:', error);
    process.exit(1);
  });
