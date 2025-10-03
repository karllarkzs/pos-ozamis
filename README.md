# Pharmacy POS Frontend

React + Vite + Mantine frontend for the Pharmacy POS system.

## Features

- **Responsive Design**: Works on both desktop Electron app and web browsers
- **Smart Access Control**: POS features only available in Electron, inventory accessible everywhere  
- **Modern UI**: Built with Mantine components for professional look
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Mantine 7** - UI component library
- **React Router** - Client-side routing
- **TypeScript** - Type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- Yarn package manager

### Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production  
- `yarn preview` - Preview production build
- `yarn lint` - Run ESLint

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/         # Page components
│   ├── POSPage.tsx       # Point of sale (Electron only)
│   ├── InventoryPage.tsx # Inventory management
│   └── SettingsPage.tsx  # Application settings
├── hooks/         # Custom React hooks
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
├── theme.ts       # Mantine theme configuration
└── main.tsx       # App entry point
```

## Access Control

- **POS Functions**: Only available when running inside Electron desktop app
- **Inventory & Settings**: Available in both Electron and web browser
- The app automatically detects the environment and shows appropriate features

## Development

When developing, run both the Vite dev server and Electron shell:

1. Start this frontend: `yarn dev` (port 5173)
2. In the pos-shell directory: `yarn dev` 

The Electron app will automatically load the Vite dev server.
