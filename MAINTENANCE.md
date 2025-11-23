# CTPM Tool - Project Maintenance Guide

This document provides a comprehensive guide to understanding, maintaining, and deploying the CTPM (Capacity & Team Planning Management) Tool.

## 1. Project Overview

**CTPM Tool** is a Single Page Application (SPA) designed for resource planning and project management.

### Technology Stack
- **Framework**: React 18 (via Vite)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Routing**: React Router DOM
- **State Management**: Zustand
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: GitHub Pages

## 2. Getting Started (Local Development)

If you need to work on this project on a new machine, follow these steps:

### Prerequisites
- **Node.js**: Version 18 or higher recommended.
- **Git**: For version control.
- **VS Code**: Recommended editor.

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/lekoon/CTPMtool.git
    cd CTPMtool
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

## 3. Project Structure

```
CTPMtool/
├── dist/                # Production build output (generated)
├── public/              # Static assets (favicon, etc.)
├── src/
│   ├── components/      # Reusable UI components (Layout, etc.)
│   ├── pages/           # Page components (Dashboard, Projects, etc.)
│   ├── store/           # Global state management (Zustand stores)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper functions and algorithms
│   ├── App.tsx          # Main application component & Routing
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles & Tailwind directives
├── package.json         # Dependencies and scripts
├── vite.config.ts       # Vite configuration
└── tsconfig.json        # TypeScript configuration
```

## 4. Key Features & Implementation

### Routing
- Defined in `src/App.tsx`.
- Uses `react-router-dom` with **HashRouter**.
- **Why HashRouter?**: This is used to ensure compatibility with GitHub Pages, which doesn't support client-side routing (pushState) out of the box for SPAs. URLs will look like `/#/dashboard`.

### State Management
- Managed by `src/store/useStore.ts` using `zustand`.
- Persists data to `localStorage` so data remains after refresh.

### Styling
- Uses TailwindCSS utility classes.
- Global styles in `src/index.css`.

## 5. Deployment (GitHub Pages)

The project is configured to automatically deploy to GitHub Pages using the `gh-pages` package.

### How to Deploy Updates
1.  **Make your changes** in the code.
2.  **Commit and push** your changes to the `main` branch:
    ```bash
    git add .
    git commit -m "Description of your changes"
    git push
    ```
3.  **Run the deploy script**:
    ```bash
    npm run deploy
    ```

### What `npm run deploy` does:
1.  Runs `npm run build` (compiles TypeScript and builds the app to `dist/`).
2.  Runs `gh-pages -d dist` (pushes the `dist/` folder to the `gh-pages` branch on GitHub).

### Troubleshooting Deployment
- **Blank Page**: Usually caused by incorrect `base` path in `vite.config.ts`.
- **Hash URLs**: You will see `#` in the URL (e.g., `.../CTPMtool/#/`). This is normal and expected for this deployment method.

## 6. Common Tasks

### Adding a New Page
1.  Create the component in `src/pages/NewPage.tsx`.
2.  Add a route in `src/App.tsx`:
    ```tsx
    <Route path="/new-page" element={
      <ProtectedRoute>
        <Layout>
          <NewPage />
        </Layout>
      </ProtectedRoute>
    } />
    ```
3.  Add a navigation link in `src/components/Layout.tsx`.

### Modifying the Data Model
1.  Update types in `src/types/index.ts`.
2.  Update the store in `src/store/useStore.ts` to handle the new data.

## 7. Configuration Files

- **vite.config.ts**:
    - `base: '/CTPMtool/'`: Crucial for GitHub Pages.
- **package.json**:
    - `"deploy": "gh-pages -d dist"`: The deployment script.
