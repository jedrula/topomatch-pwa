# topomatch-pwa

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Firebase Storage CORS Configuration

For hold detection functionality to work, Firebase Storage CORS must be configured. See [FIREBASE_CORS_SETUP.md](./FIREBASE_CORS_SETUP.md) for detailed instructions.

**Quick setup:**
```bash
gsutil cors set cors.json gs://topomatch-pwa.firebasestorage.app
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
