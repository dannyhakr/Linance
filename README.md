# Linance - Loan Management Desktop App

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview
Linance is a lightweight desktop application for managing customer loans, payments, and collateral. Built specifically for branch-level staff with zero training required.

## Architecture Diagram
```
┌─────────────────────────────────────────────┐
│                 Electron Shell              │
├─────────────────────────────────────────────┤
│    React Frontend │   IPC Communication    │
├─────────────────────────────────────────────┤
│          Business Logic Layer              │
├─────────────────────────────────────────────┤
│          SQLite Database Layer             │
└─────────────────────────────────────────────┘
```

## Quick Start
1. **Install node-gyp globally**

```bash
npm install --global node-gyp@latest
```


1. **Clone the repository**
```bash
git clone https://github.com/dannyhakr/Linance.git
cd Linance
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the application**
```bash
npm run build
```

4. **Run in development mode**
```bash
npm run dev
```

5. **Package for Windows 64-bit**
```bash
npm run package:win64
```

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run package:win64` - Create Windows installer
- `npm run package:mac` - Create macOS package
- `npm run package:linux` - Create Linux package

## Tech Stack
- **Frontend**: Electron + React + TypeScript
- **Database**: SQLite (better-sqlite3)
- **UI**: Material-UI
- **State**: React Query
- **PDF**: jsPDF
- **Builder**: Electron Builder

## Features
- Customer management with PAN & document upload
- Loan creation with auto-EMI calculation
- Collateral tracking (vehicle/property/gold)
- One-click payment collection
- PDF report generation
- Offline-first operation

## License
MIT © 2026 Linance Team