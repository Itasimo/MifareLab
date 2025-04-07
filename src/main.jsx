/**
 * Main application entry point
 * Handles theme setup, language loading, and page rendering
 */

import { createRoot } from 'react-dom/client'
import { lazy, Suspense, useEffect } from 'react'
import './css/index.css'
import Loader from './components/Loader.jsx'
import HotBar from './components/HotBar.jsx'

// Get theme from localStorage or use dark theme as default
const theme = localStorage.getItem('theme') || 'dark'
// Add the theme class to html element
document.documentElement.classList.add(theme)

// Create React root element
const root = createRoot(document.getElementById('root'))

// Store file data between page reloads
let currentFileData = null;

// Setup file restoration handler
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

// Load language settings from sessionStorage
const language = localStorage.getItem('language') ? JSON.parse(localStorage.getItem('language')) : null
if (language) {
    // If language exists in sessionStorage, use it
    sessionStorage.setItem('language', JSON.stringify(language))
    
    // Initialize application with the View page
    loadPage('View')
} else {
    // If no language is found, load the default language file (en.json)
    import('../public/lang/en.json')
        .then((module) => {
            const language = module.default
            // Store the language in sessionStorage for future use
            sessionStorage.setItem('language', JSON.stringify(language))
            
            // Save the language to localStorage for persistence
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

    // Use lazy loading for code splitting
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

// Wrapper component to pass file data to the loaded component
function PageComponentWrapper({ Component, fileData }) {
    useEffect(() => {
        // If we have file data and we're on the View page, pass the data
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
