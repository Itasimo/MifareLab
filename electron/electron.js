/**
 * Main Electron process file for MifareLab application
 * Handles window creation, IPC communication, and file operations
 */
const path = require("path");
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const fs = require("fs");

// Determine if app is running in development mode
const isDev = process.env.IS_DEV == "true" ? true : false;

/**
 * Creates and configures the main application window
 * Sets up event handlers and loads the appropriate URL
 */
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1024,
        height: 650,
        autoHideMenuBar: true,
        resizable: true,
        frame: false,
        titleBarStyle: 'hidden',
        // Apply title bar overlay on non-macOS platforms
        ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
        webPreferences: {
            // Security settings for renderer process
            contextIsolation: true, // Prevents direct access to Node.js APIs from renderer
            preload: path.join(__dirname, "preload.js"), // Script that runs before renderer process
            nodeIntegration: false, // Disables Node.js integration for security reasons
        },
    });

    // Set dark background color for window
    mainWindow.setBackgroundColor('#121212');

    // Handle external links to open in default browser instead of new Electron window
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: "deny" };
    });

    // Load either development server URL or production build
    mainWindow.loadURL(
        isDev
            ? "http://localhost:3000"
            : `file://${path.join(__dirname, "../dist/index.html")}`
    );

    // Open DevTools automatically in development mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

/**
 * IPC handler to customize window title bar overlay appearance
 * Receives style options from the renderer process
 */
ipcMain.on("set-title-bar-overlay", (event, options) => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
        window.setTitleBarOverlay(options);
    }
});

/**
 * IPC handler to open a file selection dialog
 * Allows user to select .mfd (MIFARE Dump) files
 * Sends selected file paths back to renderer via 'file-selected' event
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
 * @param {string} filePath - Path to the file to be read
 * @returns {string} File contents formatted as uppercase hex string with spaces
 * @throws Will throw and forward any file read errors to the renderer
 */
ipcMain.handle("read-file", async (event, filePath) => {
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

// Application lifecycle event handlers
app.whenReady().then(() => {
    createWindow();
    // macOS specific behavior to recreate window when dock icon is clicked
    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Handle window close events
app.on("window-all-closed", () => {
    // On macOS, applications typically stay active until explicit quit
    if (process.platform !== "darwin") {
        app.quit();
    }
});
