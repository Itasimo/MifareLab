/**
 * Main application entry point
 * Handles theme setup, language loading, and page rendering
 */

import { createRoot } from 'react-dom/client'
import { lazy, Suspense, useEffect } from 'react'
import './css/index.css'
import Loader from './components/Loader.jsx'
import HotBar from './components/HotBar.jsx'

/**
 * Theme initialization
 * ------------------------------
 */
// Get theme from localStorage or use dark theme as default
const theme = localStorage.getItem('theme') || 'dark'
// Add the theme class to html element
document.documentElement.classList.add(theme)

// Create React root element
const root = createRoot(document.getElementById('root'))

/**
 * File handling configuration
 * ------------------------------
 */
// Store file data between page reloads
let currentFileData = null;

/**
 * Setup Electron IPC event listener for file restoration
 * This allows the main process to send file content to be displayed
 */
if (window.electronAPI) {
    window.electronAPI.onRestoreFile((filePath, content) => {
        console.log('File restoration event received:', filePath);
        currentFileData = { path: filePath, content };
        
        // If page is already loaded, notify the View component about the restored file
        if (sessionStorage.getItem('Current-Page') === 'View') {
            window.dispatchEvent(new CustomEvent('file-restored', { 
                detail: { filePath, content } 
            }));
        } else {
            // If we're on a different page, switch to View and it will handle the file
            loadPage('View');
        }
    });
}

/**
 * Settings initialization
 * ------------------------------
 */
const settings = localStorage.getItem('settings') ? JSON.parse(localStorage.getItem('settings')) : null
if (settings) {
    console.log('settings', settings);
    
    // If settings exist in localStorage, use them
    sessionStorage.setItem('settings', JSON.stringify(settings))

    // Load the language based on the settings
    setLanguage();
} else {
    // If no settings are found, load the default settings file (settings.json)
    import('../src/settings/DefalutSettings.json')
        .then((module) => {
            const settings = module.default
            
            // Store the settings in sessionStorage for future use
            sessionStorage.setItem('settings', JSON.stringify(settings))
            
            // Save the settings to localStorage for persistence
            localStorage.setItem('settings', JSON.stringify(settings))
        })
        .catch((error) => {
            console.error('Error loading settings file:', error)
        })
        .then(() => {
            setLanguage();
        });
}

/**
 * Loads and initializes the language based on user settings
 * Imports the appropriate language file and stores it in session and local storage
 * After language is loaded, initializes the application with the View page
 */
function setLanguage() {
    // Get language setting from stored settings
    const initializeLanguage = JSON.parse(localStorage.getItem('settings')).lang

    // Dynamically import the language file
    import(`../src/lang/${initializeLanguage}.json`)
        .then((module) => {
            const language = module.default
            // Store the language in sessionStorage for current session
            sessionStorage.setItem('language', JSON.stringify(language))
            
            // Save the language to localStorage for persistence between sessions
            localStorage.setItem('language', JSON.stringify(language))

            // Initialize application with the View page
            loadPage('View')
        })
        .catch((error) => {
            console.error('Error loading language file:', error)
        })
}

/**
 * Dynamically loads and renders a page component
 * @param {string} page - The name of the page component to load
 */
function loadPage(page) {
    // Store current page name in sessionStorage
    sessionStorage.setItem('Current-Page', page);

    // Use lazy loading for code splitting - only loads the required page component
    const PageComponent = lazy(() => import(`./pages/${page}.jsx`));

    // Render the application layout with HotBar and the dynamic page component
    root.render(
        <div className="w-screen h-screen flex flex-col">
            {/* HotBar navigation component */}
            <HotBar selectedPage={page} />
            {/* Page content area with fallback loader during component loading */}
            <div id='PageComponent' className="w-full h-full flex-1 dark:bg-dark-primary bg-light-primary overflow-hidden">
                <Suspense fallback={<Loader transparentBackground />}>
                    <PageComponentWrapper Component={PageComponent} fileData={currentFileData} />
                </Suspense>
            </div>
        </div>
    );

    // Notify other components that the page has changed
    window.dispatchEvent(new Event('LoadPage'));
}

/**
 * Wrapper component that passes file data to loaded components
 * @param {Object} props - Component props
 * @param {React.Component} props.Component - The page component to render
 * @param {Object|null} props.fileData - File data to pass to the component (if available)
 * @returns {JSX.Element} The wrapped component
 */
function PageComponentWrapper({ Component, fileData }) {
    useEffect(() => {
        // If we have file data and we're on the View page, pass the data via an event
        // Small timeout ensures the component is fully mounted before receiving the event
        if (fileData && sessionStorage.getItem('Current-Page') === 'View') {
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('file-restored', { 
                    detail: { filePath: fileData.path, content: fileData.content } 
                }));
            }, 100);
        }
    }, [fileData]);
    
    return <Component />;
}

// Export loadPage function to be used in other components
export { loadPage }
