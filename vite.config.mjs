import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path';

// https://vite.dev/config/
/**
 * Vite configuration for the MifareLab project.
 * 
 * @param {Object} options - Configuration options provided by Vite
 * @param {string} options.command - The command being run (e.g., 'serve' or 'build')
 * @param {string} options.mode - The mode the command is running in (e.g., 'development' or 'production')
 * @returns {Object} Complete Vite configuration object
 * 
 * @description
 * This configuration:
 * - Sets the base path to relative ('./')
 * - Configures development server to run on port 3000
 * - Sets up React and TailwindCSS plugins
 * - Configures build output to the 'dist' directory
 * - Defines the main entry point as index.html
 * 
 * @note The isElectron variable is defined but not currently used in the configuration
 */
export default defineConfig(({  }) => {
    
    return {
        base: './',
        server: {
            port: 3000,
        },
        plugins: [react(), tailwindcss()],
        build: {
            outDir: 'dist',
            emptyOutDir: true,
            assetsDir: 'assets',
            rollupOptions: {
                input: {
                    main: resolve(__dirname, 'index.html'),
                }
            }
        }
    };
});
