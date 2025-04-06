/**
 * Main application entry point
 * Handles theme setup, language loading, and page rendering
 */

import { createRoot } from 'react-dom/client'
import { lazy, Suspense } from 'react'
import './css/index.css'
import Loader from './components/Loader.jsx'
import HotBar from './components/HotBar.jsx'

// Get theme from localStorage or use dark theme as default
const theme = localStorage.getItem('theme') || 'dark'
// Add the theme class to html element
document.documentElement.classList.add(theme)

// Create React root element
const root = createRoot(document.getElementById('root'))

// Initialize application with the View page
loadPage('View')

// Load language settings from sessionStorage
const language = sessionStorage.getItem('language') ? JSON.parse(sessionStorage.getItem('language')) : null
if (language) {
    // If language exists in sessionStorage, use it
    sessionStorage.setItem('language', JSON.stringify(language))
} else {
    // If no language is found, load the default Italian language file
    import('../public/lang/it.json')
        .then((module) => {
            const language = module.default
            // Store the language in sessionStorage for future use
            sessionStorage.setItem('language', JSON.stringify(language))
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
                    <PageComponent />
                </Suspense>
            </div>
        </div>
    );

    // Notify other components that the page has changed
    window.dispatchEvent(new Event('LoadPage'));
}

// Export loadPage function to be used in other components
export { loadPage }
