/**
 * Preload Script - Secure bridge between renderer process and main process
 * 
 * This file exposes specific Electron APIs to the renderer process through the contextBridge.
 * It creates a secure channel for IPC (Inter-Process Communication) while maintaining
 * contextual isolation.
 */
const { contextBridge, ipcRenderer } = require("electron");

/**
 * Event listener for DOM content loaded
 * Fires when the DOM structure is ready but before all resources are loaded
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM content loaded in preload script");
});

/**
 * Event listener for window fully loaded
 * Fires when all resources (images, styles, etc.) have finished loading
 */
window.addEventListener("load", () => {
    console.log("Window fully loaded in preload script");
    
    // Set up retry mechanism for component initialization
    let retryCount = 0;
    const maxRetries = 5;
    
    /**
     * Checks and attempts to fix component initialization issues
     * Implements a retry mechanism with a page reload fallback
     * 
     * @returns {boolean} - True if components are initialized properly, false otherwise
     */
    function checkAndFixComponents() {
        // Check if we need to retry component initialization
        if (retryCount < maxRetries) {
            try {
                // Check if the app container exists and has content
                const appContainer = document.querySelector("#root");
                if (!appContainer || appContainer.childElementCount === 0) {
                    console.log("App container not ready, retrying initialization...");
                    retryCount++;
                    setTimeout(checkAndFixComponents, 500);
                    return false;
                }

                /**
                 * Add global error handler to catch the specific HotBar error
                 * This fixes a known issue with HotBar component initialization
                 */
                if (!window._errorHandlerAttached) {
                    window._errorHandlerAttached = true;
                    window.addEventListener('error', (event) => {
                        if (event.error && event.error.toString().includes('Cannot read properties of null (reading \'HotBar\')')) {
                            console.log('Caught HotBar initialization error - forcing page reload');
                            // Force reload the page after a short delay
                            setTimeout(() => window.location.reload(), 100);
                        }
                    });
                }
                
            } catch (err) {
                console.log("Error checking components, retrying...", err);
                retryCount++;
                setTimeout(checkAndFixComponents, 500);
                return false;
            }
        } else if (retryCount === maxRetries) {
            console.log("Max retries reached, forcing page reload");
            retryCount++;
            window.location.reload();
            return false;
        }
        return true;
    }
    
    // Initial component check with slight delay to ensure React has started mounting
    setTimeout(checkAndFixComponents, 100);
});

// Expose specific APIs from Electron to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
    /**
     * Sets the title bar overlay with the provided options
     * Used for customizing the window title bar appearance
     * 
     * @param {Object} options - Title bar overlay configuration options
     * @param {string} [options.color] - The color of the title bar
     * @param {string} [options.symbolColor] - The color of the window controls
     */
    setTitleBarOverlay: (options) => ipcRenderer.send("set-title-bar-overlay", options),
    
    /**
     * Opens a native file dialog for selecting files
     * Sends an IPC message to the main process to show the dialog
     * Results are returned via the onFileSelected callback
     */
    openFileDialog: () => ipcRenderer.send("open-file-dialog"),
    
    /**
     * Reads a file from the given file path
     * Uses IPC invoke to asynchronously read file contents
     * 
     * @param {string} filePath - Path of the file to read
     * @returns {Promise<string|Buffer>} - Promise that resolves with the file content
     */
    readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
    
    /**
     * Registers a callback to be called when files are selected from the file dialog
     * Listens for IPC events from the main process after file selection
     * 
     * @param {Function} callback - Function to call when files are selected
     * @param {Array<string>} callback.filePaths - Array of selected file paths
     */
    onFileSelected: (callback) => {
        ipcRenderer.on("file-selected", (event, filePaths) => {
            callback(filePaths);
        });
    },
});

// Notify main process that the renderer is ready for communication
ipcRenderer.send("renderer-ready");

/**
 * DOM content loaded event handler
 * Updates version information in the UI for Electron, Chrome and Node.js
 */
window.addEventListener("DOMContentLoaded", () => {
    /**
     * Replaces the text content of an element with the given selector
     * Used to display version information in the UI
     * 
     * @param {string} selector - Element ID to target
     * @param {string} text - Text to inject into the element
     */
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    // Updates version information in the UI for each dependency
    for (const dependency of ["chrome", "node", "electron"]) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});
