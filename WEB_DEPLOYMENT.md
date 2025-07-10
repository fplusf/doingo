# Web Deployment Guide

This guide explains how to deploy the Optimal ADHD app as a web version to GitHub Pages.

## Overview

The app has been configured to run both as an Electron desktop application and as a web application. The web version excludes Electron-specific features and is optimized for browser deployment.

## Files Created for Web Deployment

1. **`vite.web.config.ts`** - Vite configuration for web builds
2. **`index.web.html`** - Web-specific HTML entry point
3. **`src/renderer.web.tsx`** - Web-specific React entry point
4. **`.github/workflows/deploy.yml`** - GitHub Actions deployment workflow

## Local Development

### Start the web development server:

```bash
npm run start:web
```

### Build for production:

```bash
npm run build:web:prod
```

### Preview the production build:

```bash
npm run preview:web
```

## GitHub Pages Deployment

### Automatic Deployment

The app is configured for automatic deployment to GitHub Pages. When you push changes to the `main` branch, the GitHub Actions workflow will:

1. Install dependencies
2. Generate routes
3. Build the web version
4. Deploy to GitHub Pages

### Manual Deployment

If you prefer manual deployment:

1. Build the web version:

   ```bash
   npm run build:web:prod
   ```

2. The built files will be in the `dist/` directory

3. Deploy the contents of `dist/` to your web hosting service

## Configuration Details

### Base Path

- Development: `/` (root)
- Production: `/optimal-adhd-react/` (GitHub Pages subdirectory)

### Build Output

- Output directory: `dist/`
- Optimized for web browsers
- Excludes Electron-specific features

### Features

- ✅ React Router with TanStack Router
- ✅ TailwindCSS styling
- ✅ Radix UI components
- ✅ Excalidraw integration
- ✅ Responsive design
- ❌ Electron-specific features (disabled for web)

## Troubleshooting

### Common Issues

1. **Build fails with Electron imports**

   - The web build excludes Electron-specific code
   - Check that all imports are web-compatible

2. **Routing issues on GitHub Pages**

   - The base path is automatically configured for GitHub Pages
   - Ensure your router is configured for the subdirectory

3. **Assets not loading**
   - Check that the `public/` directory contains required assets
   - Verify asset paths in the build configuration

### Development vs Production

- **Development**: Uses `/` as base path for local development
- **Production**: Uses `/optimal-adhd-react/` for GitHub Pages deployment

## Customization

### Changing the Repository Name

If you change your repository name, update:

1. `vite.web.config.ts` - Update the base path
2. `.github/workflows/deploy.yml` - Update the cname

### Adding Custom Domain

1. Add your custom domain to GitHub Pages settings
2. Update the `cname` in the deployment workflow
3. Update the base path in `vite.web.config.ts`

## Performance Optimization

The web build includes:

- Code splitting with manual chunks
- Vendor bundle optimization
- UI component bundling
- Source map disabled for production
- Optimized asset loading

## Security

- Content Security Policy configured for web
- Electron-specific security policies removed
- Standard web security practices applied
