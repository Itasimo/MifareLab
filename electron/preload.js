const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
    setTitleBarOverlay: (options) => ipcRenderer.send("set-title-bar-overlay", options),
    openFileDialog: () => ipcRenderer.send("open-file-dialog"), // Expose the openFileDialog function
    readFile: (filePath) => ipcRenderer.invoke("read-file", filePath), // Expose the readFile function
    onFileSelected: (callback) => {
        ipcRenderer.on("file-selected", (event, filePaths) => {
            callback(filePaths);
        });
    },
    // Add handler to receive file restoration data after reload
    onRestoreFile: (callback) => {
        ipcRenderer.on("restore-file", (event, filePath, content) => {
            callback(filePath, content);
        });
    },
});

window.addEventListener("DOMContentLoaded", () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const dependency of ["chrome", "node", "electron"]) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});
