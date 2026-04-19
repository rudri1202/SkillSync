# SkillSync — Setup & Deployment Guide

## 1. Firebase Setup (5 min)

1. Go to https://console.firebase.google.com → Create a project (e.g. `skillsync-mvp`)
2. **Authentication** → Sign-in method → Enable **Google**
3. **Firestore** → Create database → Start in **test mode** (then apply security rules)
4. **Storage** → Get started → Start in **test mode**
5. **Project Settings** → Your apps → Add web app → Copy config values

## 2. Create `.env.local`

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Fill in Firebase values from step 1, and API keys below.

## 3. GitHub Token (for collaborator invites)

1. Go to https://github.com/settings/tokens → Generate new token (classic)
2. Scopes needed: `repo` (full control of private repositories)
3. Copy the token → paste as `GITHUB_TOKEN` in `.env.local`

> Note: For collaborator invites to work, this token must belong to the repo owner,
> OR the token account must have admin access to the project repo.

## 4. Gemini API Key (for AI features)

1. Go to https://makersuite.google.com/app/apikey
2. Create API key → copy it
3. Paste as `GEMINI_API_KEY` in `.env.local`

## 5. Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## 6. Deploy to Vercel

### Option A: Vercel CLI
```bash
npm i -g vercel
vercel
# Follow prompts
```

### Option B: GitHub + Vercel Dashboard
1. Push this repo to GitHub
2. Go to https://vercel.com → New Project → Import repo
3. Framework: Vite
4. Add environment variables in Vercel dashboard:
   - All `VITE_FIREBASE_*` vars (from your `.env`)
   - `GITHUB_TOKEN`
   - `GEMINI_API_KEY`         ← used by /api/gemini serverless function
   - `VITE_GEMINI_API_KEY`    ← same key, used by browser-direct AI calls
5. Deploy!

## 7. Firebase Security Rules

After testing, apply the production rules from `firestore.rules`:

1. Go to Firebase Console → Firestore → Rules
2. Paste the contents of `firestore.rules`
3. Publish

## 8. Firebase Storage Rules (apply in console)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid
        && request.resource.contentType.matches('image/.*')
        && request.resource.size < 2 * 1024 * 1024;
    }
    match /resumes/{uid}.pdf {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null && request.auth.uid == uid
        && request.resource.contentType == 'application/pdf'
        && request.resource.size < 5 * 1024 * 1024;
    }
    match /project-images/{projectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.contentType.matches('image/.*')
        && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

## Required Firestore Indexes

Create these composite indexes in Firebase Console → Firestore → Indexes:

| Collection | Fields | Query scope |
|---|---|---|
| `projects` | `status` ASC, `createdAt` DESC | Collection |
| `projects` | `status` ASC, `type` ASC, `createdAt` DESC | Collection |
| `joinRequests` | `projectId` ASC, `createdAt` DESC | Collection |
| `joinRequests` | `requesterId` ASC, `createdAt` DESC | Collection |
| `joinRequests` | `projectId` ASC, `status` ASC | Collection |
