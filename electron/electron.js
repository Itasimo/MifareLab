/**
 * Main Electron process file for MifareLab application
 * Handles window creation, IPC communication, and file operations
 * 
 * This file orchestrates the main Electron process, setting up the application window,
 * handling inter-process communication (IPC), managing file system operations,
 * and implementing error handling and recovery mechanisms.
 */
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const url = require("url");
const fs = require("fs");

// Determine if app is running in development mode
const isDev = process.env.IS_DEV == "true" ? true : false;
// const isDev = true; // Set to true for development mode
let mainWindow = null; // Variable to hold the main window reference

/**
 * Creates and configures the main application window
 * Sets up event handlers and loads the appropriate URL
 * 
 * This function handles:
 * - Window creation and configuration
 * - Content loading and visibility management
 * - Error detection and recovery
 * - Development tools initialization
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        resizable: true,
        frame: false,
        titleBarStyle: 'hidden',
        // Apply title bar overlay on non-macOS platforms
        ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
        webPreferences: {
            nodeIntegration: false, // Disable direct Node.js integration for security
            contextIsolation: true, // Enable context isolation for improved security
            preload: path.join(__dirname, "preload.js"), // Load preload script for secure IPC
        },
        // Start window hidden until content is loaded for better UX
        show: false
    });

    // Set dark background color for window to prevent white flash during load
    mainWindow.setBackgroundColor('#121212');

    // Handle external links to open in default browser instead of new Electron window
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: "deny" }; // Prevent Electron from handling the URL
    });

    // Format URL path to the HTML entry point for the application
    const startUrl = url.format({
        pathname: path.join(__dirname, "../dist/index.html"),
        protocol: "file:",
        slashes: true,
    });

    // Validate HTML file exists before attempting to load it
    const htmlPath = path.join(__dirname, "../dist/index.html");
    console.log("Checking for HTML file at:", htmlPath);
    if (!fs.existsSync(htmlPath)) {
        console.error("ERROR: HTML file not found at", htmlPath);
        dialog.showErrorBox("Loading Error", "Could not find the application UI files. Please check your installation.");
        app.quit();
        return;
    }

    console.log("HTML file exists, loading URL:", startUrl);
    console.log("Is development mode:", isDev);
    
    // Set up window content lifecycle event handlers for debugging and UI management
    mainWindow.webContents.on('did-start-loading', () => {
        console.log("Window content started loading");
    });
    
    mainWindow.webContents.on('dom-ready', () => {
        console.log("DOM is ready");
    });
    
    mainWindow.webContents.on('did-finish-load', () => {
        console.log("Window content loaded successfully");
        // Show window once content is loaded for better user experience
        if (!mainWindow.isVisible()) {
            mainWindow.show();
        }
    });
    
    /**
     * Handle load failures with automatic recovery attempts
     * Ignores standard redirects (error code -3) and attempts reload for other errors
     */
    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
        console.error("Failed to load window content:", errorDescription, "Error code:", errorCode);
        if (errorCode !== -3) { // Ignore ERR_ABORTED which happens on normal redirects
            // Auto-reload after a short delay
            setTimeout(() => {
                console.log("Attempting to reload window content...");
                if (mainWindow) {
                    try {
                        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
                    } catch (err) {
                        console.error("Error during reload:", err);
                        mainWindow.loadURL(startUrl);
                    }
                }
            }, 1000);
        }
    });

    // Use a more reliable approach - try loadFile first, then fall back to loadURL if needed
    try {
        console.log("Loading with loadFile...");
        mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
    } catch (err) {
        console.error("Error loading with loadFile:", err);
        console.log("Falling back to loadURL...");
        mainWindow.loadURL(startUrl);
    }

    /**
     * Failsafe timeout to ensure window becomes visible even if loading events don't fire properly
     * Shows window and attempts reload if content hasn't loaded within timeout period
     */
    setTimeout(() => {
        if (mainWindow && !mainWindow.isVisible()) {
            console.log("Window content load timeout - forcing display and reload");
            mainWindow.show(); // Show anyway to avoid blank window
            
            // Try a different loading method as a fallback
            try {
                mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
            } catch (err) {
                console.error("Error during timeout reload:", err);
                mainWindow.reload();
            }
        }
    }, 3000); // 3 second timeout for better user experience

    // Development mode specific features
    if (isDev) {
        // Open DevTools automatically in development mode
        mainWindow.webContents.openDevTools();
        
        // Add keyboard shortcuts for development convenience
        mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.key === 'F5' || (input.control && input.key === 'r')) {
                console.log("Manual reload triggered");
                mainWindow.reload();
                event.preventDefault();
            }
        });
    }

    // Clean up window reference when closed
    mainWindow.on("closed", function () {
        mainWindow = null;
    });
}

/**
 * IPC handler to customize window title bar overlay appearance
 * Receives style options from the renderer process and applies them to the active window
 * 
 * @param {Object} event - IPC event object
 * @param {Object} options - Title bar overlay configuration options
 */
ipcMain.on("set-title-bar-overlay", (_event, options) => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
        window.setTitleBarOverlay(options);
    }
});

/**
 * IPC handler to open a file selection dialog
 * Allows user to select .mfd (MIFARE Dump) files and sends selected paths to renderer
 * 
 * @param {Object} event - IPC event object used to send response
 */
ipcMain.on("open-file-dialog", async (event) => {
    const result = await dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [
            { name: "MIFARE Dump Files", extensions: ["mfd"] }
        ],
    });

    if (!result.canceled) {
        console.log("Selected file paths:", result.filePaths);
        // Send selected file paths to the renderer process
        event.sender.send("file-selected", result.filePaths);
    }
});

/**
 * IPC handler to read file contents
 * Reads binary file and converts to formatted hex string representation
 * 
 * @param {Object} event - IPC event object
 * @param {string} filePath - Path to the file to be read
 * @returns {string} File contents formatted as uppercase hex string with spaces
 * @throws Will throw and forward any file read errors to the renderer
 */
ipcMain.handle("read-file", async (_event, filePath) => {
    try {
        const fileBuffer = fs.readFileSync(filePath); // Read the file as a binary buffer
        const hexArray = Array.from(fileBuffer).map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()); // Convert each byte to a 2-character hex string
        const hexString = hexArray.join(" "); // Join the hex values with spaces
        return hexString; // Return the formatted hex string to the renderer process
    } catch (error) {
        console.error("Error reading file:", error);
        throw error; // Throw the error to the renderer process
    }
});

// Listen for renderer process ready message
ipcMain.on("renderer-ready", () => {
    console.log("Renderer process reported ready");
});

/**
 * Inject error handling script into the renderer process
 * Helps catch and log errors that might prevent proper loading, with automatic recovery
 * 
 * @param {Object} webContents - The webContents object of the window to inject code into
 */
function injectErrorHandling(webContents) {
    webContents.executeJavaScript(`
        // Add global error handler for renderer process
        window.addEventListener('error', (event) => {
            console.error('Renderer Error:', event.error);
            if (event.error && event.error.toString().includes('Cannot read properties of null')) {
                // Give DOM time to fully initialize before retrying
                setTimeout(() => {
                    console.log('Attempting recovery after null property error...');
                    window.location.reload();
                }, 1000);
            }
        });

        // Ensure DOM is fully loaded before scripts execute
        if (document.readyState !== 'complete') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM fully loaded');
            });
        }
    `).catch(err => console.error('Failed to inject error handling:', err));
}

/**
 * Application lifecycle event handlers
 */

// Initialize application when Electron is ready
app.whenReady().then(() => {
    createWindow();
    
    // Secondary safety check to ensure window visibility
    setTimeout(() => {
        if (mainWindow && !mainWindow.isVisible()) {
            console.log("Force showing window after delayed check");
            mainWindow.show();
        }
        
        // Inject error handling scripts for renderer process stability
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.on('did-finish-load', () => {
                injectErrorHandling(mainWindow.webContents);
            });
            
            // For already loaded pages
            if (!mainWindow.webContents.isLoading()) {
                injectErrorHandling(mainWindow.webContents);
            }
        }
    }, 2000);

    // Set up enhanced error monitoring for renderer process
    if (mainWindow) {
        // Monitor for renderer process crashes
        mainWindow.webContents.on('render-process-gone', (_event, details) => {
            console.error('Renderer process crashed:', details.reason);
        });
        
        // Log content loading failures
        mainWindow.webContents.on('did-fail-load', (_event, _errorCode, errorDescription) => {
            console.error('Failed to load content:', errorDescription);
        });
        
        // Monitor console messages from renderer for debugging
        mainWindow.webContents.on('console-message', (_event, level, message) => {
            if (level === 2 || message.includes('error')) {
                console.log(`Renderer console ${level === 2 ? 'error' : 'log'}: ${message}`);
            }
        });
    }
});

// Handle application closure based on platform conventions
app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
});

// Re-create window when application icon is clicked (macOS behavior)
app.on("activate", function () {
    if (mainWindow === null) createWindow();
});
