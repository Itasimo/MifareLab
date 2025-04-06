/**
 * Preload Script - Secure bridge between renderer process and main process
 * 
 * This file exposes specific Electron APIs to the renderer process through the contextBridge.
 * It creates a secure channel for IPC (Inter-Process Communication) while maintaining
 * contextual isolation.
 */
const { contextBridge, ipcRenderer } = require("electron");

// Expose specific APIs from Electron to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
    /**
     * Sets the title bar overlay with the provided options
     * @param {Object} options - Title bar overlay configuration options
     */
    setTitleBarOverlay: (options) => ipcRenderer.send("set-title-bar-overlay", options),
    
    /**
     * Opens a native file dialog for selecting files
     * Sends an IPC message to the main process
     */
    openFileDialog: () => ipcRenderer.send("open-file-dialog"),
    
    /**
     * Reads a file from the given file path
     * @param {string} filePath - Path of the file to read
     * @returns {Promise} - Promise that resolves with the file content
     */
    readFile: (filePath) => ipcRenderer.invoke("read-file", filePath),
    
    /**
     * Registers a callback to be called when files are selected from the file dialog
     * @param {Function} callback - Function to call when files are selected
     */
    onFileSelected: (callback) => {
        ipcRenderer.on("file-selected", (event, filePaths) => {
            callback(filePaths);
        });
    },
});

/**
 * Executes when the DOM content is loaded
 * Updates specific elements with the versions of Chrome, Node.js and Electron
 */
window.addEventListener("DOMContentLoaded", () => {
    /**
     * Replaces the text content of an element with the given selector
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
