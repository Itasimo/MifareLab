# MifareLab

MifareLab is a desktop application built with Electron and React for analyzing MIFARE card dumps. It provides a user-friendly interface to view, analyze, and compare MIFARE card data.

## About MIFARE Technology

MIFARE is a series of contactless smart card chips widely used in access control systems, public transportation cards, student IDs, and payment systems worldwide. These NFC-compatible cards store data in a structured format across multiple sectors, each protected by different access keys and conditions.

MifareLab helps security researchers, system administrators, and enthusiasts understand the structure and content of these cards through its analysis tools.

## Key Capabilities

### Deep Card Analysis
MifareLab provides comprehensive analysis of MIFARE Classic 1K/4K and MIFARE Ultralight card dumps, revealing:
- Manufacturer data and card identifiers
- Sector-by-sector breakdown of card contents
- Detailed access condition interpretation
- Value block identification and decoding


## Technical Implementation

MifareLab leverages modern web technologies within a desktop application framework:

- **React + Vite**: Uses React 19's latest features including concurrent rendering for responsive UI
- **Electron**: Provides cross-platform desktop capabilities with native system access
- **Crypto-JS**: Used only for identifying the blocks in the DOM
- **TailwindCSS**: Enables responsive design with dark/light theme support
- **Settings System**: Persistent user preferences with localized UI and theme options

The application architecture follows a clear separation of concerns:
- Card data parsing and processing is isolated in dedicated service modules
- UI components follow atomic design principles for consistency
- IPC communication channels manage secure data flow between Electron and React
- Settings management with localStorage persistence and application-wide state

## Features

### Application Settings
The settings page provides configuration options for:
- Theme selection (Dark/Light modes)
- Language preferences (English, Italian, German)
- Developer tools toggle
- Visual indicators for settings that require application restart

## Future Development

The roadmap for MifareLab includes:
- Light mode (CSS)
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
- `electron-builder` - Packaging and distribution tool for Electron applications

### Build Tools
- `concurrently` ^9.1.2 - Run multiple commands concurrently
- `cross-env` ^7.0.3 - Cross-platform environment variables
- `wait-on` ^8.0.3 - Wait for resources to become available
- `electron-builder` - Creates distributables for Windows, macOS, and Linux

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
- `npm run build` - Build the React application with TypeScript checks
- `npm run serve` - Preview the built application
- `npm run electron` - Start Electron in development mode
- `npm run electron:pack` - Package the application without creating installers
- `npm run electron:dev` - Start development environment (React + Electron)
- `npm run electron:builder` - Build distributable packages using electron-builder
- `npm run build:for:electron` - Build React specifically for Electron environment
- `npm run app:build` - Complete production build process (React build + electron-builder)

## Project Structure

```
├── dist/             # Built React application
├── dist_electron/    # Final packaged application builds
├── electron/         # Electron main process files
├── public/           
│   ├── fonts/        # Font files
│   ├── lang/         # Language files
│   └── Icon/         # Application icons
└── src/
    ├── components/   # React components
    ├── css/          # CSS styles
    ├── pages/        # Page components
    └── utils/        # Utility functions
```

## Contributing

We welcome contributions to MifareLab! This section outlines the process for contributing to the project and the coding standards we follow.

### Code Style Guidelines

- **Documentation**: Use JSDoc-style comments for functions and components
  ```jsx
  /**
   * Component description
   * 
   * @param {Object} props - Component props
   * @param {string} props.someParam - Description of the parameter
   * @returns {JSX.Element} - What the component renders
   */
  ```

- **React Components**: Use functional components with hooks
- **CSS**: Use TailwindCSS utility classes for styling, with custom CSS only when necessary
- **Naming**: Use descriptive variable and function names
  - Components should use PascalCase
  - Functions and variables should use camelCase
- **File Structure**: Place components in appropriate directories:
  - Reusable components in `/src/components`
  - Page components in `/src/pages`
  - Utility functions in `/src/utils`

### Pull Request Process

1. Create a branch for your feature: `git checkout -b feature/your-feature-name`
2. Make your changes following the code style guidelines
3. Test your changes in both development and production builds
4. Commit with clear, descriptive messages
5. Push to your fork and submit a pull request
6. Ensure your PR description clearly describes the problem and solution

### Proposing Changes

1. **For minor changes**: Submit a pull request directly with the implementation
2. **For major features**: 
   - First open an issue describing the feature
   - Discuss implementation approach with maintainers
   - Create a pull request referencing the issue

### Reporting Issues

When reporting issues, please include:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- System information (OS, browser, MifareLab version)

By contributing to MifareLab, you agree to license your code under the same GNU General Public License v3.0 that covers the project.

## License

This project is licensed under the GNU General Public License v3.0.