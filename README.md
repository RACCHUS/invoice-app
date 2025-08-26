# Invoice App

A modern, responsive invoice management application built with React and Firebase. Create, manage, and track invoices with ease.

![Invoice App](https://img.shields.io/badge/React-19+-blue) ![Firebase](https://img.shields.io/badge/Firebase-v11-orange) ![Vite](https://img.shields.io/badge/Vite-6+-purple)

## Features

- **Authentication**: Secure login and registration
- **Invoice Management**: Create, edit, delete, and view invoices
- **Quote Management**: Create quotes and convert them to invoices
- **Client Management**: Add and manage clients
- **PDF Export**: High-quality PDF generation with optimized file sizes
- **Modern UI**: Clean, professional interface with Tailwind CSS
- **Responsive**: Works great on desktop and mobile
- **Firebase Integration**: Real-time data sync

## Getting Started

### Prerequisites
- Node.js 18+ 
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoice-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   ```bash
   firebase login
   firebase use --add  # Select your Firebase project
   ```

4. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Add your Firebase configuration

### Development

## 🚀 Available Tasks & Scripts

### VS Code Tasks (Ctrl+Shift+P → "Tasks: Run Task")

- **🚀 Start Development Environment** - Runs both client and Firebase emulators in parallel
- **Start Client (Vite Dev Server)** - Starts only the React development server
- **Start Firebase Emulators** - Starts only Firebase emulators
- **Build Production** - Creates production build
- **Preview Production Build** - Previews production build locally
- **Deploy to Firebase** - Builds and deploys to Firebase hosting
- **Lint Code** - Runs ESLint code analysis

### NPM Scripts

```bash
# Development
npm run dev                 # Start Vite dev server (client only)
npm run start:client        # Same as dev
npm run start:emulators     # Start Firebase emulators only
npm run start:dev           # 🔥 Start BOTH client and emulators

# Production
npm run build              # Build for production
npm run preview            # Preview production build
npm run deploy             # Build and deploy to Firebase

# Code Quality
npm run lint               # Run ESLint

# Utilities
npm run clean              # Clean build artifacts
npm run reinstall          # Clean reinstall of dependencies
```

### Quick Start Options

**Option 1: Using VS Code Tasks (Recommended)**
1. Open VS Code
2. Press `Ctrl+Shift+P`
3. Type "Tasks: Run Task"
4. Select "🚀 Start Development Environment"

**Option 2: Using NPM Scripts**
```bash
npm run start:dev
```

**Option 3: Manual (separate terminals)**
```bash
# Terminal 1 - Client
npm run dev

# Terminal 2 - Firebase Emulators  
npm run start:emulators
```

### Development URLs

- **Client**: http://localhost:5173
- **Firebase Emulator UI**: http://localhost:4000
- **Firestore Emulator**: http://localhost:8080

## Tech Stack

- **Frontend**: React 19.1.0 + Vite 6.3.5
- **Styling**: Tailwind CSS
- **Backend**: Firebase Firestore
- **PDF Generation**: jsPDF (text-based, optimized)
- **Drag & Drop**: @hello-pangea/dnd
- **Routing**: React Router DOM 7.6.2

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── InvoiceForm.jsx     # Invoice/Quote creation form
│   ├── InvoiceTable.jsx    # Invoice list table
│   ├── InvoicePDF.jsx      # PDF template component
│   └── ...
├── pages/              # Page components
│   ├── Dashboard.jsx      # Main dashboard
│   ├── Invoices.jsx       # Invoice management
│   ├── Quotes.jsx         # Quote management
│   └── ...
├── services/           # API services
│   ├── firebase.js        # Firebase configuration
│   ├── InvoiceServices.js  # Invoice CRUD operations
│   └── ...
├── utils/              # Utility functions
│   ├── pdfGenerator.js     # Optimized PDF generation
│   ├── formatters.js       # Data formatting utilities
│   └── ...
├── styles/             # Global styles
└── contexts/           # React contexts
```

## Recent Improvements

- ✅ **PDF File Size Optimization**: Reduced from 2-10MB to 50-200KB
- ✅ **Export Consistency**: Standardized PDF output from all export points
- ✅ **Quote-to-Invoice Conversion**: One-click conversion workflow
- ✅ **Status System Cleanup**: Removed unnecessary "draft" status
- ✅ **Development Workflow**: Enhanced VS Code tasks and npm scripts

## Deployment

### Firebase Hosting
```bash
npm run deploy
```

### Build for Other Platforms
```bash
npm run build
# Built files will be in /dist directory
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` to check code quality
5. Submit a pull request

## License

MIT
