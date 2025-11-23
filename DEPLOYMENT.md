# Deployment Guide for CTPM Tool

Your application is a **Single Page Application (SPA)** built with Vite and React. I have prepared the production build and configuration files for the most popular static hosting platforms.

## Option 1: Netlify (Recommended - Easiest)

1.  **Locate the Build Folder**:
    *   Open your file explorer to: `d:\antigravity\CTPMtool\dist`
    *   This folder contains your optimized website.

2.  **Deploy**:
    *   Go to [https://app.netlify.com/drop](https://app.netlify.com/drop).
    *   Drag and drop the `dist` folder onto the page.
    *   Netlify will upload and publish your site instantly.

*Note: I have already created a `netlify.toml` file in your project root. If you connect this repository to Netlify via Git in the future, it will automatically use the correct settings.*

## Option 2: Vercel

1.  **Install Vercel CLI** (if you want to deploy from command line):
    *   Run `npm i -g vercel`
    *   Run `vercel deploy`

2.  **Via Dashboard**:
    *   Push your code to GitHub/GitLab.
    *   Import the project in Vercel.
    *   Vercel will detect Vite and deploy automatically.
    *   *I have added `vercel.json` to ensure routing works correctly.*

## Option 3: Local Preview

To test the production build locally before deploying:

```bash
npm run preview
```
