# MifareLab

MifareLab is a desktop application built with Electron and React for analyzing and manipulating MIFARE card dumps. It provides a user-friendly interface to view, analyze, and compare MIFARE card data.

## About MIFARE Technology

MIFARE is a series of contactless smart card chips widely used in access control systems, public transportation cards, student IDs, and payment systems worldwide. These NFC-compatible cards store data in a structured format across multiple sectors, each protected by different access keys and conditions.

MifareLab helps security researchers, system administrators, and enthusiasts understand the structure and content of these cards through its analysis tools.

## Key Capabilities

### Deep Card Analysis
MifareLab provides comprehensive analysis of MIFARE Classic 1K/4K and MIFARE Ultralight card dumps, revealing:
- Hidden manufacturer data and card identifiers
- Sector-by-sector breakdown of card contents
- Detailed access condition interpretation
- Value block identification and decoding


## Technical Implementation

MifareLab leverages modern web technologies within a desktop application framework:

- **React + Vite**: Uses React 19's latest features including concurrent rendering for responsive UI
- **Electron**: Provides cross-platform desktop capabilities with native system access
- **Crypto-JS**: Implements MIFARE-specific cryptographic operations
- **TailwindCSS**: Enables responsive design with dark/light theme support

The application architecture follows a clear separation of concerns:
- Card data parsing and processing is isolated in dedicated service modules
- UI components follow atomic design principles for consistency
- IPC communication channels manage secure data flow between Electron and React

## Future Development

The roadmap for MifareLab includes:
- Settings page for application configuration and preferences
- Help page with documentation and tutorials
- Diff page supporting simultaneous comparison of up to 4 files using color coding
- Collaborative analysis features for team research
- Marker system for highlighting and saving references to important bytes

## Community and Contributions

MifareLab welcomes contributions from the security research and development community. Areas especially in need of collaboration include:
- Additional card type support
- UI/UX enhancements
- Documentation and examples

Please see the contribution guidelines before submitting pull requests.

## Technologies Used

### Core Dependencies
- `react` ^19.0.0 - UI framework
- `react-dom` ^19.0.0 - React DOM rendering
- `electron` ^35.0.3 - Desktop application framework
- `crypto-js` ^4.2.0 - Cryptographic functions
- `tailwindcss` ^4.0.15 - CSS framework
- `@tailwindcss/vite` ^4.0.15 - Tailwind CSS Vite plugin

### Development Dependencies
- `vite` ^6.2.0 - Build tool and dev server
- `@vitejs/plugin-react` ^4.3.4 - React plugin for Vite
- `eslint` ^9.21.0 - Code linting
- `@eslint/js` ^9.21.0 - ESLint JavaScript support
- `eslint-plugin-react-hooks` ^5.1.0 - React Hooks linting
- `eslint-plugin-react-refresh` ^0.4.19 - React Refresh support

### Build Tools
- `concurrently` ^9.1.2 - Run multiple commands concurrently
- `cross-env` ^7.0.3 - Cross-platform environment variables
- `wait-on` ^8.0.3 - Wait for resources to become available

## Getting Started

1. Install dependencies:
```sh
npm install
```

2. Start development server:
```sh
npm run electron:dev
```

3. Build for production:
```sh
npm run app:build
```

## Available Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build the React application
- `npm run serve` - Preview the built application
- `npm run electron` - Start Electron in development mode
- `npm run electron:pack` - Package the application
- `npm run electron:dev` - Start development environment
- `npm run electron:builder` - Build the Electron application
- `npm run build:for:electron` - Build React for Electron
- `npm run app:build` - Build the complete application

## Project Structure

```
├── electron/          # Electron main process files
├── public/           
│   ├── fonts/        # Font files
│   ├── lang/         # Language files
│   └── vite.svg      # Application icon
├── src/
│   ├── assets/       # Static assets
│   ├── components/   # React components
│   ├── css/          # CSS styles
│   ├── pages/        # Page components
│   └── utils/        # Utility functions
```

## Contributing


## License

This project is licensed under the GNU General Public License v2.0.