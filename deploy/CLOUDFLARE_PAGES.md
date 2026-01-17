# Deploying to Cloudflare Pages

Cloudflare Pages is a free hosting platform for static sites and JAMstack
applications. It offers:

- **Free tier**: Unlimited sites, 500 builds/month, unlimited bandwidth
- **Automatic HTTPS**
- **Global CDN** with 300+ locations
- **Preview deployments** for pull requests
- **Custom domains** (free SSL)

## Prerequisites

1. A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
2. Your code pushed to GitHub (or GitLab)

## Method 1: Connect via Cloudflare Dashboard (Recommended)

### Step 1: Access Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Go to **Workers & Pages** > **Pages**
4. Click **Create application** > **Pages** > **Connect to Git**

### Step 2: Connect Repository

1. Select **GitHub** and authorize Cloudflare
2. Choose the `dannywillems/faturinha` repository
3. Click **Begin setup**

### Step 3: Configure Build Settings

| Setting | Value |
|---------|-------|
| Project name | `faturinha` |
| Production branch | `main` |
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

### Step 4: Environment Variables (Optional)

For production, you may want to set:

| Variable | Value |
|----------|-------|
| `NODE_VERSION` | `22` |

### Step 5: Deploy

1. Click **Save and Deploy**
2. Wait for the build to complete
3. Your site will be available at `faturinha.pages.dev`

## Method 2: Deploy via Wrangler CLI

### Install Wrangler

```bash
npm install -g wrangler
```

### Authenticate

```bash
wrangler login
```

### Build the Project

```bash
npm run build
```

### Deploy

```bash
# First deployment (creates the project)
wrangler pages deploy dist --project-name faturinha

# Subsequent deployments
wrangler pages deploy dist --project-name faturinha
```

## Custom Domain Setup

### Add Your Domain

1. Go to **Workers & Pages** > **faturinha** > **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `faturinha.io`)
4. Follow the DNS configuration instructions

### DNS Configuration

If your domain is on Cloudflare:
- Cloudflare will automatically configure the DNS

If your domain is elsewhere, add a CNAME record:
```
Type: CNAME
Name: @ (or www)
Target: faturinha.pages.dev
```

## Preview Deployments

Every pull request automatically gets a preview deployment at:
```
https://<commit-hash>.faturinha.pages.dev
```

This is useful for reviewing changes before merging.

## Build Caching

Cloudflare Pages caches `node_modules` between builds. First build may be
slower, subsequent builds will be faster.

## Troubleshooting

### Build Fails

Check the build logs in Cloudflare Dashboard:
1. Go to **Workers & Pages** > **faturinha**
2. Click on the failed deployment
3. View **Build log**

Common issues:
- Node version mismatch: Set `NODE_VERSION` environment variable
- Missing dependencies: Ensure `package-lock.json` is committed

### SPA Routing Issues

For single-page apps with client-side routing, create `public/_redirects`:
```
/*    /index.html   200
```

Or create `public/_headers`:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
```

## Monitoring

Cloudflare provides:
- **Analytics**: Page views, visitors, bandwidth
- **Web Analytics**: Core Web Vitals (optional, requires snippet)

Access at: **Workers & Pages** > **faturinha** > **Analytics**

## Useful Links

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Framework Guides](https://developers.cloudflare.com/pages/framework-guides/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Build Configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
