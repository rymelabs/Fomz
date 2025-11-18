#!/usr/bin/env node
import admin from 'firebase-admin';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('apply', {
    type: 'boolean',
    description: 'Apply the changes instead of a dry-run',
    default: false,
  })
  .help()
  .argv;

// Initialize firebase-admin; rely on GOOGLE_APPLICATION_CREDENTIALS env var or 
// set via admin.credential.cert(serviceAccountKey)
try {
  admin.initializeApp();
} catch (err) {
  console.error('Failed to initialize firebase-admin; make sure GOOGLE_APPLICATION_CREDENTIALS is set or provide a service account JSON');
  process.exit(1);
}

const db = admin.firestore();

(async () => {
  console.log('Starting migration: migrate root `published` -> `settings.published`');

  const formsRef = db.collection('forms');
  const snapshot = await formsRef.where('published', '==', true).get();
  console.log(`Found ${snapshot.size} docs with root 'published: true'`);

  let changed = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const settings = data.settings || {};
    if (settings.published === true) {
      console.log(`Skipping ${doc.id} (settings.published already true)`);
      continue;
    }
    console.log(`Would update ${doc.id}: set settings.published = true`);
    if (argv.apply) {
      await doc.ref.update({ settings: { ...settings, published: true } });
      changed++;
      console.log(`Applied update to ${doc.id}`);
    }
  }

  console.log(`Done. ${argv.apply ? 'Updated' : 'Planned to update'} ${argv.apply ? changed : snapshot.size} documents.`);
})();
