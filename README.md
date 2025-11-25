# Fomz — Modern Forms

Fomz is a modern, Tailwind + React + Firebase-based forms app with a drag-and-drop builder, responses, analytics, custom themes, and Fomzy—our quill-inspired AI that drafts sections, questions, and themes for you.

## Quick start

1. Copy `.env.example` to `.env` and fill your Firebase keys (see Firebase console > Project settings > Add web app).

2. Install dependencies:

```powershell
npm install
```

3. Run locally:

```powershell
npm run dev
```

4. Build for production:

```powershell
npm run build
npm run preview
```

5. Deploy to Firebase Hosting (requires `firebase-tools` login):

```powershell
# login:
npx firebase login

# set project if needed:
npx firebase use --add

# build and deploy hosting
npm run deploy:firebase
```

## Firestore & Storage rules (recommended)

These are essential to keep your app secure.

### Firestore (production-safe)
Make sure to publish these in your Firebase Console → Firestore → Rules or using the CLI:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /forms/{formId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.createdBy;
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.createdBy;
      // Allow public read for published forms (new schema uses settings.published)
      allow read: if resource.data.published == true || (resource.data.settings != null && resource.data.settings.published == true);
      match /responses/{responseId} {
        allow create: if true; // allow anonymous public submissions
        allow read, update, delete: if request.auth != null && request.auth.uid == get(/databases/$(database)/documents/forms/$(formId)).data.createdBy;
      }
    }
  }
}
```

### Storage rules (logos)

This allows form creators to upload logos to `logos/{userId}/...` and make them readable publicly:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /logos/{userId}/{allPaths=**} {
      allow write: if request.auth != null && request.auth.uid == userId;
      allow read: if true; // public read for logos
    }

    match /{allPaths=**} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

## Form sharing & embed snippet
- Save the form in the builder.
  - Publish it (`Form settings` → `Publish form`) to make it accessible with a shareable short link (e.g., `https://your-app/f/<shareId>`).
  - If you are seeing permission errors when resolving short links, make sure your Firestore rules permit public reads over `settings.published` (see rules above) and `firebase deploy --only firestore:rules` to push changes.
    - If you are seeing permission errors when resolving short links, make sure your Firestore rules permit public reads over `settings.published` (see rules above) and `firebase deploy --only firestore:rules` to push changes.
    - If you have legacy forms that used a root-level `published` boolean, those won't be accessible to the new `settings.published` rule and could cause permission errors. To migrate these docs, add a service account and run:

  ```powershell
  npm ci
  npm run migrate:published -- --apply
  ```

  This will set `settings.published = true` for documents that have a root `published: true` flag. Run without `--apply` to preview the planned changes.
    - Publish it (`Form settings` → `Publish form`) to make it accessible with a shareable short link (e.g., `https://your-app/f/<shareId>`).
    - The short-link resolver will only return forms that are published (i.e. `settings.published === true`). If you see permission errors, ensure your Firestore rules allow public reads for published forms and redeploy them; in addition, confirm that `settings.published` has been set (use the Firebase Console or emulator UI).
- You can copy a share link or an embed snippet (`iframe`) directly from the `Form settings` area or the My Forms dashboard.

## CI / Automated Deploy example (GitHub Actions)
Create `.github/workflows/deploy.yml` with a simple build & deploy step using the `firebase-tools` action and secrets for `FIREBASE_TOKEN`:

```yaml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
t        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
```

> Note: `FIREBASE_SERVICE_ACCOUNT` should be a service account JSON (base64 encoded in GitHub Actions secrets). See Firebase docs for instructions.

## Emulator and Debugging
- Start the Firebase emulator for local testing (Firestore, Auth, Storage):

```powershell
npx firebase emulators:start --only firestore,auth,storage
```

- Use the emulator UI to see data and test rules.

## Contributing
- Run `npm run lint` to check code style.
- Create feature branches and PRs.
- Run local unit tests (when added).

---

If you'd like, I can add a GitHub Actions workflow file automatically and update the README with the exact commands to set up emulator testing and CI credential creation. Tell me which CI provider you'd like (GitHub Actions, Azure Pipelines, GitLab CI) and I'll add the workflow file.
