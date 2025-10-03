# 🚀 Deployment Guide - OCT POS Frontend

This guide covers local development setup and Netlify deployment configuration, based on the [official Netlify Vite documentation](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).

## 🔧 Local Development Setup

### 1. Environment Variables

Copy the environment template and configure for your local backend:

```bash
yarn setup-env  # Creates .env from template
# OR manually: cp env.template .env
```

Update the `.env` file with your local backend URL:

```env
# Your local backend configuration
VITE_API_URL=http://localhost:5288/api
VITE_NODE_ENV=development
VITE_APP_NAME=OCT POS System
VITE_APP_VERSION=1.0.0
```

### 2. Install Dependencies & Start Development Server

```bash
yarn install
yarn dev  # Uses official @netlify/vite-plugin for enhanced local dev
```

The frontend will be available at `http://localhost:5173`

### 3. Enhanced Local Development with Netlify Plugin

The official `@netlify/vite-plugin` provides **full emulation** of Netlify's production platform in your local dev server:

**✨ Local Netlify Features Available:**
- 🔧 **Serverless functions** - Test API endpoints locally
- ⚡ **Edge functions** - Fast, globally distributed functions  
- 💾 **Blobs storage** - File storage and retrieval
- 🚀 **Cache API** - High-performance caching
- 🖼️ **Image CDN** - Automatic image optimization
- 🔀 **Redirects & rewrites** - URL routing rules
- 🔒 **Headers** - Security and performance headers
- 🌍 **Environment variables** - Same as production

**Key Benefit**: No need to use Netlify CLI for local development - everything works directly with `yarn dev`!

---

## 🌐 Netlify Deployment

### 1. Automatic Framework Detection

Netlify **automatically detects** Vite projects and suggests optimal settings:
- **Build command**: `yarn build` (auto-detected)
- **Publish directory**: `dist` (auto-detected)  
- **Node version**: `18` or later

You can override these in your dashboard or use the `netlify.toml` file (already configured).

### 2. Environment Variables

In your Netlify dashboard, go to **Site Settings > Environment variables** and add:

#### Required Variables:
```
VITE_API_URL = https://your-production-api.com/api
VITE_NODE_ENV = production
VITE_APP_NAME = OCT POS System
VITE_APP_VERSION = 1.0.0
```

#### Optional Variables:
```
VITE_DEBUG = false
VITE_ENABLE_DEVTOOLS = false
```

### 3. Netlify Configuration

The `netlify.toml` file is already configured with:
- ✅ **SPA redirect rule** - Essential for React Router (serves `index.html` for all routes)
- ✅ **Security headers** - X-Frame-Options, XSS Protection, etc.
- ✅ **Cache optimization** - Long-term caching for assets, no cache for `index.html`  
- ✅ **Build settings** - Yarn build command and Node.js version

**Key feature**: The redirect rule prevents 404 errors when users visit direct URLs like `/login` or `/pos`.

### 4. Deploy Steps

1. **Connect Repository**: Link your Git repository to Netlify
2. **Configure Build Settings**: Set build command and publish directory
3. **Add Environment Variables**: Configure production API URL
4. **Deploy**: Netlify will automatically build and deploy

---

## 🔒 Security Considerations

### Environment Variables
- **Never commit `.env` files** - They're already in `.gitignore`
- **Use different API URLs** for development and production
- **Keep sensitive values** in Netlify environment variables

### API Configuration
- **CORS Setup**: Ensure your backend allows requests from your Netlify domain
- **Authentication**: Review token storage and expiration
- **HTTPS**: Use HTTPS for production API endpoints

---

## 📊 Environment URLs

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|-------------|-------------|---------|
| **Local** | `http://localhost:5173` | `http://localhost:5288/api` | Development |
| **Netlify** | `https://your-app.netlify.app` | `https://your-api.com/api` | Production |

---

## 🐛 Troubleshooting

### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist
yarn install
yarn build
```

### API Connection Issues
1. Check `VITE_API_URL` environment variable
2. Verify backend is running and accessible
3. Check browser network tab for CORS errors
4. Confirm API endpoints match your backend routes

### Netlify Specific Issues
- **Functions timeout**: Increase function timeout in Netlify settings
- **Large bundles**: Consider code splitting for better performance
- **Environment variables**: Ensure all required variables are set in Netlify dashboard

---

## ⚡ Performance Optimization

### Code Splitting
Consider implementing dynamic imports for large features:
```tsx
const Reports = lazy(() => import('./pages/Reports'));
```

### Bundle Analysis
Analyze your bundle size:
```bash
yarn build --analyze
```

### Caching Strategy
- **API responses**: TanStack Query handles this automatically
- **Static assets**: Netlify provides automatic caching
- **Service worker**: Consider adding for offline support

---

## 🔄 CI/CD Pipeline

### Automatic Deployments
Netlify will automatically deploy when you push to your main branch:

1. **Push code** to your repository
2. **Netlify detects** changes
3. **Build runs** with your environment variables
4. **Deploy completes** automatically

### Preview Deployments
- **Pull requests** get preview URLs automatically
- **Branch deployments** for testing features
- **Deploy previews** with production environment variables

---

## 📝 Checklist for Go-Live

### Pre-deployment:
- [ ] Environment variables configured in Netlify
- [ ] Production API URL set correctly
- [ ] Backend CORS configured for Netlify domain
- [ ] All features tested in preview deployment
- [ ] Error handling tested with production API

### Post-deployment:
- [ ] Verify login functionality works
- [ ] Test product catalog loading
- [ ] Confirm transactions process correctly
- [ ] Check error handling and fallbacks
- [ ] Monitor performance and bundle size

---

## 🆘 Support

If you encounter issues:

1. **Check logs**: Netlify function logs and browser console
2. **Verify environment**: Compare local vs production variables
3. **Test API**: Use tools like Postman to verify backend endpoints
4. **Review CORS**: Ensure backend accepts requests from your domain

**Ready to deploy!** 🚀
