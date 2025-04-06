/**
 * HotBar.jsx
 * This component renders the application's navigation bar at the top of the window.
 * It provides access to main pages and a hamburger menu for additional options.
 * It also handles loading files, managing the title bar, and theme display.
 */
import React, { useEffect, useState } from 'react';
import { loadPage } from "../main";
import { DumpToJson } from "../utils/NFCDumptoJSON";
import { convertUint8ToArray } from "../utils/convertUint8ToArray";

/**
 * HotBar component 
 * @param {Object} props - Component props
 * @param {string} props.selectedPage - Currently selected page to highlight in navigation
 * @returns {JSX.Element} - HotBar navigation component
 */
function HotBar({ selectedPage }) {
    // State to store language preferences from session storage
    const [language, setLanguage] = useState(JSON.parse(sessionStorage.getItem('language')) || null);
    
    // Load language settings on component mount
    useEffect(() => {
        const loadLanguage = async () => {
            const files = sessionStorage.getItem('language') ? JSON.parse(sessionStorage.getItem('language')) : null;
            setLanguage(files);
        };
        loadLanguage();
    }, []);

    // Get localized text for navigation items
    const pages = language.HotBar;
    const menuItems = language.Menu;

    // Actual page names and menu item functions used internally
    const pagesRed = [ "View", "Analyze", "Diff" ]
    const menuItemsRed = ['Import File', 'Settings', 'Help'];

    // Set up title bar overlay and adjust page margin based on hotbar height
    useEffect(() => {
        const hotBar = document.querySelector('#HotBar');
        const htmlClass = document.documentElement.className;
        const isDarkTheme = htmlClass.includes('dark');
        const symbolColor = isDarkTheme ? 'dark-text' : 'light-text';

        // Adjust the main content area to account for hotbar height
        document.getElementById('PageComponent').style.marginTop = hotBar.offsetHeight + 'px';

        // Configure Electron title bar overlay with appropriate theme colors
        window.electronAPI.setTitleBarOverlay({
            height: hotBar.offsetHeight,
            color: "rgba(0, 0, 0, 0)",
            symbolColor: getComputedStyle(document.documentElement).getPropertyValue('--color-' + symbolColor).trim(),
        });
    }, []);

    // Set up file selection handler
    useEffect(() => {
        window.electronAPI?.onFileSelected((filePaths) => {
            console.log("Selected file paths:", filePaths);
            if (filePaths.length > 0) {
                // Read selected file and process its contents
                window.electronAPI?.readFile(filePaths[0]).then((hexContents) => {
                    // Convert hex dump to JSON format
                    const json = convertUint8ToArray(DumpToJson(hexContents));

                    // Store processed file in session storage
                    sessionStorage.setItem('fileJSON', JSON.stringify(json));

                    // Notify application that a file has been loaded
                    window.postMessage({
                        type: 'fileLoaded',
                        data: json
                    });
                });
            }
        });
    }, []);

    /**
     * Opens file dialog to import NFC dump files
     * This function is exposed on the window object to be called from menu items
     */
    window.Import_File = async () => {
        window.electronAPI?.openFileDialog();
    };

    return (
        <div id="HotBar" className='hotbar flex fixed w-full bg-light-secondary dark:bg-dark-secondary'>
            {/* Hamburger menu button and dropdown */}
            <div className="relative">
                <button
                    className="m-2 p-1 font-inconsolata rounded-lg hover:bg-neutral-600/40 dark:text-dark-text text-light-text bg-light-secondary dark:bg-dark-secondary"
                    onClick={() => {
                        const menu = document.querySelector('#hamburgerMenu');
                        menu.classList.toggle('hidden');
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5"
                        />
                    </svg>
                </button>
                {/* Dropdown menu for additional options */}
                <div
                    id="hamburgerMenu"
                    className="absolute top-full left-0 mt-1 ml-1 p-1 w-max bg-light-secondary dark:bg-dark-secondary shadow-lg rounded-lg hidden"
                >
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            className="block w-full text-left px-4 py-2 hover:bg-neutral-600/40 rounded-lg dark:text-dark-text text-light-text"
                            onClick={() => {
                                // Call the corresponding function based on menu item
                                if (typeof window[menuItemsRed[index].replace(' ', '_')] === 'function') {
                                    window[menuItemsRed[index].replace(' ', '_')]();
                                } else {
                                    console.warn(`Function ${menuItemsRed[index].replace(' ', '_')} is not defined`);
                                }
                            }}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>
            {/* Main navigation buttons */}
            {pages.map((page, index) => (
                <button
                    key={index}
                    className={`m-2 p-2 py-1 font-inconsolata rounded-lg hover:bg-neutral-600/40 dark:text-dark-text text-light-text ${
                        selectedPage === pagesRed[index]
                            ? '!bg-blue-500/40 !text-sky-400 rounded-md underline'
                            : ''
                    }`}
                    onClick={() => loadPage(pagesRed[index])} // Trigger page change
                >
                    {page}
                </button>
            ))}
        </div>
    );
}

export default HotBar;