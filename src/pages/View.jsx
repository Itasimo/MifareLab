import React, { useEffect, useState } from 'react';


/**
 * The `View` component is responsible for rendering a dynamic interface that displays
 * the contents of a file loaded from an external source. It adjusts its layout based
 * on the presence of a "HotBar" element and listens for file load events to update its state.
 *
 * @component
 *
 * @description
 * - Dynamically calculates and applies padding to the bottom of the container based on the height of the "HotBar" element.
 * - Listens for `message` events to handle file loading and updates the UI accordingly.
 * - Displays the contents of the loaded file, including sectors, data blocks, and sector trailers.
 * - Provides special handling for the first sector to display manufacturer data.
 *
 * @returns {JSX.Element} The rendered `View` component.
 *
 * @example
 * // Example usage of the View component
 * import View from './View';
 *
 * function App() {
 *   return <View />;
 * }
 *
 * @state {Object|null} fileData - Stores the file data received from an external source. Defaults to `null`.
 * @state {number} paddingBottomValue - Dynamically adjusts the padding-bottom of the container. Defaults to `0`.
 * @state {Object|null} language - Stores the localization strings for UI elements. Retrieved from sessionStorage.
 *
 * @hook {useEffect} - Handles side effects such as DOM manipulation and event listeners.
 *
 * @function int2hex
 * Converts an integer to a hexadecimal string, padded to 2 characters.
 * @param {number} i - The integer to convert.
 * @returns {string} The hexadecimal representation of the integer.
 */
function View() {
    // State to store the file data received from an external source (e.g., a message event).
    const [fileData, setFileData] = useState(JSON.parse(sessionStorage.getItem('fileJSON')) || null);

    // State to dynamically adjust the padding at the bottom of the container based on the height of the HotBar element.
    const [paddingBottomValue, setPaddingBottomValue] = useState(0);

    // State to manage UI localization strings, retrieved from sessionStorage
    const [language, setLanguage] = useState(JSON.parse(sessionStorage.getItem('language')) || null);

    // State to store the file content and file path for restored files
    const [fileContent, setFileContent] = useState(null);
    const [filePath, setFilePath] = useState(null);
    
    /**
     * useEffect hook to load language settings from sessionStorage when component mounts.
     * This ensures the UI displays text in the user's preferred language.
     */
    useEffect(() => {
        const loadLanguage = async () => {
            const files = sessionStorage.getItem('language') ? JSON.parse(sessionStorage.getItem('language')) : null;
            setLanguage(files);
        };
        loadLanguage();
    }, []);

    // useEffect hook to handle side effects such as DOM manipulation and event listeners.
    useEffect(() => {
        // Select the HotBar element from the DOM.
        const hotBar = document.querySelector('#HotBar');
        if (hotBar) {
            // Retrieve the spacing value from CSS custom properties (CSS variables).
            const spacing = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spacing')) || 0;

            // Helper function to convert rem units to pixels.
            const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

            // Calculate the padding-bottom value by adding the HotBar height and spacing (multiplied by 5 for additional spacing).
            setPaddingBottomValue(hotBar.offsetHeight + remToPx(spacing) * 5);
        }

        // Event handler for the 'message' event, triggered when a file is loaded.
        const handleFileLoad = (event) => {
            const { type, data } = event.data;

            // Check if the event type is 'fileLoaded'.
            if (type === 'fileLoaded') {
                // Toggle the visibility of the hamburger menu when a file is loaded.
                const menu = document.querySelector('#hamburgerMenu');
                menu.classList.toggle('hidden');

                const data = JSON.parse(sessionStorage.getItem('fileJSON'));

                // Update the fileData state with the loaded file data.
                setFileData(data);
            }
        };

        // Add the event listener for the 'message' event when the component mounts.
        window.addEventListener('message', handleFileLoad);

        // Cleanup function to remove the event listener when the component unmounts.
        return () => {
            window.removeEventListener('message', handleFileLoad);
        };
    }, []); // Empty dependency array ensures this effect runs only once when the component mounts.

    // Add file selection handler
    useEffect(() => {
        // Handle file selection from dialog
        window.electronAPI?.onFileSelected((filePaths) => {
            if (filePaths && filePaths.length > 0) {
                handleFileOpen(filePaths[0]);
            }
        });
        
        // Handle file restoration after reload
        const handleFileRestored = (event) => {
            console.log('File restored event received in View');
            const { filePath, content } = event.detail;
            setFilePath(filePath);
            setFileContent(content);
            
            // Process the file content as needed
            processFileContent(content);
        };
        
        window.addEventListener('file-restored', handleFileRestored);
        
        return () => {
            window.removeEventListener('file-restored', handleFileRestored);
        };
    }, []);
    
    // Function to handle file opening
    const handleFileOpen = async (path) => {
        try {
            const content = await window.electronAPI.readFile(path);
            setFilePath(path);
            setFileContent(content);
            
            // Process file content
            processFileContent(content);
        } catch (error) {
            console.error('Error reading file:', error);
        }
    };
    
    // Function to process file content and update UI
    const processFileContent = (content) => {
        // Your existing code to process the file content and update the UI
    };

    /**
     * Converts an integer to a 2-character hexadecimal string.
     * Used for displaying byte values in hexadecimal format throughout the UI.
     * 
     * @param {number} i - The integer value to convert
     * @returns {string} A 2-character hexadecimal string (e.g., "0A", "FF")
     */
    function int2hex(i) {
        return i.toString(16).padStart(2, '0');
    }

    return (
        // Main container with dynamic padding-bottom based on the HotBar height.
        <div className='w-full h-screen p-5 pr-1 font-inconsolata dark:text-dark-text text-light-text' style={{ paddingBottom: paddingBottomValue }}>
            <div className='h-full overflow-auto flex flex-col gap-5'>
                {
                    // Conditional rendering: If fileData exists, display its contents; otherwise, show a "No file loaded" message.
                    fileData ? (
                        <>
                            {/* 
                              * Render each sector from the loaded file data
                              * Each sector contains data blocks and a sector trailer
                            */}
                            {fileData.sectors.map((sector, index) => (
                                <div key={index} className='flex flex-col gap-2 w-fit'>
                                    {/* Display the sector index as a header. */}
                                    <h1 className='text-2xl dark:text-dark-text text-light-text w-fit font-bold'>{language.Sector} {index}</h1>
                                    <div className='flex flex-col gap-2 w-fit'>
                                        {/* Special handling for the first sector (index 0). */}
                                        {index === 0 ? (
                                            <>
                                                {/* Render manufacturer data for the first sector. */}
                                                <span>
                                                    <span>{fileData.manifacturer.uid.map(int2hex).join(' ')} {fileData.manifacturer.bcc.map(int2hex)} {fileData.manifacturer.sak.map(int2hex)} {fileData.manifacturer.ataq.map(int2hex).join(' ')} {fileData.manifacturer.data.map(int2hex).join(' ')}</span>
                                                </span>
                                                {/* Render data blocks for the first sector. */}
                                                {
                                                    sector.dataValues.map((block, index) => (
                                                        <span key={index} data-type={sector.dataTypes[index]}>
                                                            <span>{block.map(int2hex).join(' ')}</span>
                                                        </span>
                                                    ))
                                                }
                                                {/* Render the sector trailer for the first sector. */}
                                                <span>
                                                    <span>{sector.sectorTrailer.keyA.map(int2hex).join(' ')} {sector.sectorTrailer.accessConditions.unParsed.map(int2hex).join(' ')} {sector.sectorTrailer.userdata.map(int2hex)} {sector.sectorTrailer.keyB.map(int2hex).join(' ')}</span>
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                {/* Render data blocks for other sectors. */}
                                                {sector.dataValues.map((block, index) => (
                                                    <span key={index} data-type={sector.dataTypes[index]}>
                                                        <span> {block.map(int2hex).join(' ')} </span>
                                                    </span>
                                                ))}
                                                {/* Render the sector trailer for other sectors. */}
                                                <span>
                                                    <span>{sector.sectorTrailer.keyA.map(int2hex).join(' ')} {sector.sectorTrailer.accessConditions.unParsed.map(int2hex).join(' ')} {sector.sectorTrailer.userdata.map(int2hex)} {sector.sectorTrailer.keyB.map(int2hex).join(' ')}</span>
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    {/* Render a horizontal line to separate sectors. */}
                                    <hr className='border-t mt-2 dark:border-dark-text border-light-text w-full' />
                                </div>
                            ))}
                        </>
                    ) : (
                        // Display a message when no file is loaded, using the appropriate language string
                        <div className='flex justify-center items-center h-full'>
                            <h1 className='text-2xl dark:text-dark-text text-light-text'>{language.NoFile}</h1>
                        </div>
                    )
                }
            </div>
        </div>
    );
}

export default View;