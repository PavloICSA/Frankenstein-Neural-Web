# Deploying to Netlify

Your Frankenstein Neural Web app is ready to deploy to Netlify for free!

## Quick Start

### Option 1: Git Integration (Recommended)

1. **Push to GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com) and sign up/login
   - Click "Add new site" → "Import an existing project"
   - Connect your Git provider (GitHub/GitLab)
   - Select your repository

3. **Configure Build Settings**
   - Netlify will auto-detect the `netlify.toml` configuration
   - Build command: `chmod +x build_netlify.sh && ./build_netlify.sh`
   - Publish directory: `dist`
   - Click "Deploy site"

4. **Wait for Build**
   - Netlify will install Emscripten and compile your WebAssembly
   - First build takes ~2-3 minutes
   - You'll get a live URL like `https://your-app-name.netlify.app`

**Note**: The `build_netlify.sh` script compiles the WASM and copies all files to a `dist/` directory for deployment.

### Option 2: Manual Deploy (Drag & Drop) - EASIEST!

1. **Build the deployment folder**
   ```bash
   build_for_netlify.bat
   ```
   This creates a `dist/` folder with all files ready to deploy.

2. **Deploy to Netlify**
   - Go to [app.netlify.com/drop](https://app.netlify.com/drop)
   - Drag the entire `dist` folder to the upload area
   - Get instant deployment with a live URL!

3. **Done!**
   - Your app is live immediately
   - No Git, no build configuration needed
   - You get a URL like `https://random-name-123.netlify.app`
   - You can claim the site and rename it in your Netlify dashboard

## What's Configured

The `netlify.toml` file handles:
- ✅ Automatic Emscripten installation (v3.1.47)
- ✅ WebAssembly compilation with SIMD support
- ✅ Copying build artifacts to the web directory
- ✅ SPA routing (if needed in the future)
- ✅ Production and preview builds

## Troubleshooting

**Build fails with "emcc not found"**
- Netlify automatically installs Emscripten, but if it fails, check the build logs
- The EMSDK_VERSION is set to 3.1.47 in netlify.toml

**WASM file not loading**
- Check browser console for 404 errors
- Verify `neurobrain.wasm` is in the same directory as `index.html`
- Check that the build command copied files correctly

**SIMD not supported**
- Modern browsers (Chrome 91+, Firefox 89+, Safari 16.4+) support WASM SIMD
- Older browsers will show an error in the console

## Custom Domain

After deployment, you can add a custom domain:
1. Go to Site settings → Domain management
2. Add your custom domain
3. Follow DNS configuration instructions

## Free Tier Limits

Netlify's free tier includes:
- ✅ 100 GB bandwidth/month
- ✅ 300 build minutes/month
- ✅ Automatic HTTPS
- ✅ Continuous deployment from Git
- ✅ Instant rollbacks

Perfect for your neural network app!
