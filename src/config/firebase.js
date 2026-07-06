import { initializeApp } from 'firebase-admin/app';
import { cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./src/config/firebase-service-account.json', 'utf-8')
);

initializeApp({
  credential: cert(serviceAccount),
});

export const messaging = getMessaging();