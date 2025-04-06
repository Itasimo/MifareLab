import React, { useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';

/**
 * Renders an array of bytes in hexadecimal format
 * @param {Object} props - Component props
 * @param {Array<number>} props.byteArray - Array of bytes to render
 * @returns {JSX.Element} React component
 */
function Bytes({ byteArray }) {
    /**
     * Converts an integer to a hexadecimal string, padded to 2 characters
     * @param {number} i - Integer to convert
     * @returns {string} Hex string padded to 2 characters
     */
    function int2hex(i) {
        return i.toString(16).padStart(2, '0');
    }

    return (
        <>
            {
                // Map over the byte array and render each byte as a hexadecimal string
                byteArray.map((byte, index) => (
                    <span key={index}>{int2hex(byte)}</span>
                ))
            }
        </>
    );
}

/**
 * Renders an array of bytes as text with configurable character encoding
 * @param {Object} props - Component props
 * @param {Array<number>} props.byteArray - Array of bytes to render as text
 * @returns {JSX.Element} React component
 */
function TextBytes({ byteArray }) {
    const [encoding, setEncoding] = useState('ASCII'); // State to store the selected encoding

    /**
     * Decodes a byte to a character based on the selected encoding
     * @param {number} byte - Byte to decode
     * @returns {string} Character representation or '.' for non-printable characters
     */
    function decodeByte(byte) {
        switch (encoding) {
            case 'UTF-8':
                return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
            case 'UTF-16':
                return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
            case 'Latin-1':
                return byte >= 32 && byte <= 255 ? String.fromCharCode(byte) : '.';
            case 'Latin-2':
                return byte >= 32 && byte <= 255 ? String.fromCharCode(byte) : '.';
            case 'ANSI':
                return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
            case 'Unicode':
                return byte >= 32 ? String.fromCharCode(byte) : '.';
            default: // ASCII
                return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
        }
    }

    return (
        <div>
            {/* Dropdown to select encoding - currently disabled
            <select value={encoding} onChange={(e) => setEncoding(e.target.value)}>
                <option value="ANSI">ANSI</option>
                <option value="UTF-8">UTF-8</option>
                <option value="UTF-16">UTF-16</option>
                <option value="Latin-1">Latin-1</option>
                <option value="Latin-2">Latin-2</option>
                <option value="ASCII">ASCII</option>
                <option value="Unicode">Unicode</option>
            </select> */}
            <div>
                {
                    // Map over the byte array and render as text or '.' for non-printable characters
                    byteArray.map((byte, index) => (
                        <span key={index}>{decodeByte(byte)}</span>
                    ))
                }
            </div>
        </div>
    );
}

/**
 * Generates hover behavior functions based on block type and access conditions
 * @param {Object} props - Function props
 * @param {string} props.type - Block type ('V' for value, 'M' for manufacturer, 'T' for trailer)
 * @param {Array<string>} props.options - Access conditions for determining hover behavior
 * @returns {Object} Object containing hover start and end function arrays
 */
function GetHoverFunction({ type, options }) {
    const onHoverStart = []; // Array of functions to execute on hover start
    const onHoverEnd = []; // Array of functions to execute on hover end

    /**
     * Dynamically adds CSS rules to the document
     * @param {string} selector - CSS selector
     * @param {Object} styles - Object containing CSS rules
     */
    const addRule = (selector, styles) => {
        const styleSheet = document.styleSheets[0] || document.createElement('style');
        if (!document.styleSheets.length) {
            document.head.appendChild(styleSheet);
        }
        const cssString = `${selector} { ${Object.entries(styles).map(([key, value]) => `${key}: ${value};`).join(' ')} }`;
        styleSheet.insertRule(cssString, styleSheet.cssRules.length);
    };

    /**
     * Computes a consistent highlight color for an element based on its data-link attribute
     * @param {HTMLElement} elem - DOM element to compute color for
     * @returns {string} CSS rgba color string
     */
    const computeHighlightColor = (elem) => {
        const hash = CryptoJS.MD5(elem.dataset.link).toString(CryptoJS.enc.Hex);
        const r = parseInt(hash.slice(0, 2), 16) % 256;
        const g = parseInt(hash.slice(2, 4), 16) % 256;
        const b = parseInt(hash.slice(4, 6), 16) % 256;
        return `rgba(${r}, ${g}, ${b}, 0.5)`; // Semi-transparent color
    }

    /**
     * Analyzes access conditions for a given key and determines block permissions
     * @param {Array<string>} accessConditions - Array of access condition strings
     * @param {string} key - Key type ('A' or 'B')
     * @returns {Object} Object containing arrays of block indices with different permissions
     */
    function analyzeAccessConditions(accessConditions, key) {
        const result = {
            read: [], // Blocks that can be read
            write: [], // Blocks that can be written
            increment: [], // Blocks that can be incremented
            DTR: [], // Blocks that can be decremented, transferred, or restored
        };

        // Interpret access conditions based on MIFARE Classic access rules
        accessConditions.forEach((AC, index) => {
            if (key === 'A') {
                // Key A permissions logic
                if (AC !== '111' && AC !== '011' && AC !== '101') {
                    result.read.push(index);
                }
                if (AC === '000') {
                    result.write.push(index);
                    result.increment.push(index);
                }
                if (AC === '000' || AC === '110' || AC === '001') {
                    result.DTR.push(index);
                }
            } else if (key === 'B') {
                // Key B permissions logic
                if (AC !== '111') {
                    result.read.push(index);
                }
                if (['000', '110', '100', '011'].includes(AC)) {
                    result.write.push(index);
                }
                if (['000', '110'].includes(AC)) {
                    result.increment.push(index);
                }
                if (['000', '110', '001'].includes(AC)) {
                    result.DTR.push(index);
                }
            }
        });      

        return result;
    }

    /**
     * Adds highlight styling to elements with matching data-link
     * @param {HTMLElement} elem - DOM element to highlight
     * @param {string} [color] - Optional color to use for highlighting
     */
    function AddhighlightElem(elem, color) {
        // Find all elements with matching data-link in parent container
        const elems = elem.closest('.HEXblock').parentElement.querySelectorAll(`[data-link="${elem.dataset.link}"]`);
        elems.forEach((element) => {
            element.dataset.hover = 'true';
            if (color) {
                element.style.backgroundColor = color;
            } else {
                element.style.backgroundColor = computeHighlightColor(element);
            };
        });
    }
    
    /**
     * Removes highlight styling from elements with matching data-link
     * @param {HTMLElement} elem - DOM element to remove highlight from
     */
    function RemovehighlightElem(elem) {        
        const elems = elem.closest('.HEXblock').parentElement.querySelectorAll(`[data-link="${elem.dataset.link}"]`);
        elems.forEach((element) => {
            element.dataset.hover = 'false';
            element.style.backgroundColor = 'transparent';
        });
    }

    /**
     * Highlights all elements with the same data-link in the current block
     * @param {HTMLElement} elem - DOM element that triggered the highlight
     */
    function AddHighlightSameDataLink(elem) {
        const dataLink = elem.dataset.link;
        const block = elem.closest('.HEXblock');
        const elementsToHighlight = block.querySelectorAll(`[data-link="${dataLink}"]`);
        elementsToHighlight.forEach((element) => {
            AddhighlightElem(element);
        });
    }
    
    /**
     * Removes highlight from all elements with the same data-link in the current block
     * @param {HTMLElement} elem - DOM element that triggered the highlight removal
     */
    function RemoveHighlightSameDataLink(elem) {
        const dataLink = elem.dataset.link;
        const block = elem.closest('.HEXblock');
        const elementsToHighlight = block.querySelectorAll(`[data-link="${dataLink}"]`);
        elementsToHighlight.forEach((element) => {
            RemovehighlightElem(element);
        });
    }

    /**
     * Highlights all blocks affected by a specific key's permissions
     * @param {HTMLElement} elem - DOM element representing the key (A or B)
     */
    function AddHighlightKey(elem) {
        const key = elem.dataset.key; // Get key type ('A' or 'B')

        const HighlightColor = computeHighlightColor(elem);
        AddhighlightElem(elem, HighlightColor);

        // Find all blocks in the current sector
        const sector = elem.closest('.HEXblock').parentElement.parentElement;
        const elementsToHighlight = sector.querySelectorAll(`.HEXblock[data-block]`);
        const accessConditions = analyzeAccessConditions(options, key);

        elementsToHighlight.forEach((element, index) => {
            const finalACs = [];

            // Build access condition indicators (R, W, I, D/T/R)
            accessConditions.read.includes(index) ? finalACs.push('R') : finalACs.push('\u00A0');
            accessConditions.write.includes(index) ? finalACs.push('W') : finalACs.push('\u00A0');
            accessConditions.increment.includes(index) ? finalACs.push('I') : finalACs.push('\u00A0');
            accessConditions.DTR.includes(index) ? finalACs.push('D/T/R') : finalACs.push('\u00A0\u00A0\u00A0\u00A0\u00A0');

            // Remove trailing non-breaking spaces for cleaner display
            while (finalACs.length > 0 && finalACs[finalACs.length - 1] === '\u00A0') {
                finalACs.pop();
            }

            // If no permissions, add spaces for consistent layout
            if (finalACs.length === 0) {
                finalACs.push('\u00A0', '\u00A0', '\u00A0', '\u00A0\u00A0\u00A0\u00A0\u00A0');
            }

            // Add pseudo-element showing access permissions
            addRule(`span[data-link="${element.dataset.link}"]::after`, {
                content: `'${finalACs.join(' ')}'`,
                position: 'relative',
            });

            AddhighlightElem(element, HighlightColor);
        });
    }
    
    /**
     * Removes highlights and access info from blocks affected by a key
     * @param {HTMLElement} elem - DOM element representing the key
     */
    function RemoveHighlightKey(elem) {
        const sector = elem.closest('.HEXblock').parentElement.parentElement;
        const elementsToHighlight = sector.querySelectorAll(`.HEXblock[data-block]`);
        RemovehighlightElem(elem);
        
        elementsToHighlight.forEach((element) => {
            RemovehighlightElem(element);

            // Remove the :after pseudo-element by deleting the CSS rule
            const dataLink = element.dataset.link;
            const styleSheet = [...document.styleSheets].find(sheet =>
                [...sheet.cssRules].some(rule => rule.selectorText === `span[data-link="${dataLink}"]::after`)
            );
            if (styleSheet) {
                const ruleIndex = [...styleSheet.cssRules].findIndex(rule => rule.selectorText === `span[data-link="${dataLink}"]::after`);
                if (ruleIndex !== -1) {
                    styleSheet.deleteRule(ruleIndex);
                }
            }
        });
    }

    /**
     * Highlights blocks and displays detailed access conditions for both keys
     * @param {HTMLElement} elem - DOM element that triggered the highlight (usually access bits)
     */
    function AddHighlightACs(elem) {
        const sector = elem.closest('.HEXblock').parentElement.parentElement;
        const elementsToHighlight = sector.querySelectorAll(`.HEXblock[data-block]`);

        const HighlightColor = computeHighlightColor(elem);
        AddhighlightElem(elem, HighlightColor);

        // Process each block in the sector
        elementsToHighlight.forEach((element, index) => {
            const keyAAccess = analyzeAccessConditions(options, 'A');
            const keyBAccess = analyzeAccessConditions(options, 'B');

            // Store which keys have which permissions
            const attributes = {
                R: [],      // Read permissions
                W: [],      // Write permissions
                I: [],      // Increment permissions
                'D/T/R': [] // Decrement/Transfer/Restore permissions
            };

            // Determine which keys have which permissions for this block
            ['read', 'write', 'increment', 'DTR'].forEach((attr, i) => {
                if (keyAAccess[attr].includes(index)) attributes[Object.keys(attributes)[i]].push('A');
                if (keyBAccess[attr].includes(index)) attributes[Object.keys(attributes)[i]].push('B');
            });

            // Check if the block has any access permissions
            const hasAccess = Object.values(attributes).some((value) => value.length > 0);

            if (hasAccess) {
                // Build tooltip content showing permissions for both keys
                const afterContent = Object.entries(attributes)
                    .map(([key, value]) => {
                        const accessKey = value.length ? value.join('|') : 'null'
                        const content = `${key}: ${accessKey}`;
                        const padding = '\u00A0'.repeat(Math.max(0, 5 - accessKey.length));                        
                        return `${content}; ${padding} `;
                    })
                    .join('');

                // Add the CSS rule for displaying the tooltip
                addRule(`[data-link="${element.dataset.link}"]::after`, {
                    content: `'${afterContent}'`,
                    position: 'relative'
                });

                AddhighlightElem(element, HighlightColor);
            }
        });
    }
    
    /**
     * Removes highlights and access condition tooltips from blocks
     * @param {HTMLElement} elem - DOM element that triggered the highlight removal
     */
    function RemoveHighlightACs(elem) {
        const sector = elem.closest('.HEXblock').parentElement.parentElement;
        const elementsToHighlight = sector.querySelectorAll(`.HEXblock[data-block]`);
        RemovehighlightElem(elem);
        
        elementsToHighlight.forEach((element) => {
            RemovehighlightElem(element);

            // Remove the :after pseudo-element by deleting the CSS rule
            const dataLink = element.dataset.link;
            const styleSheet = [...document.styleSheets].find(sheet =>
                [...sheet.cssRules].some(rule => rule.selectorText === `[data-link="${dataLink}"]::after`)
            );
            if (styleSheet) {
                const ruleIndex = [...styleSheet.cssRules].findIndex(rule => rule.selectorText === `[data-link="${dataLink}"]::after`);
                if (ruleIndex !== -1) {
                    styleSheet.deleteRule(ruleIndex);
                }
            }
        });
    }

    // Configure hover behavior based on block type
    switch (type) {
        case 'V': // Value block
            // For value blocks, highlight related data segments
            onHoverStart.push(AddHighlightSameDataLink, AddhighlightElem, AddHighlightSameDataLink, AddHighlightSameDataLink, AddHighlightSameDataLink, AddHighlightSameDataLink, AddHighlightSameDataLink);
            onHoverEnd.push(RemoveHighlightSameDataLink, RemovehighlightElem, RemoveHighlightSameDataLink, RemoveHighlightSameDataLink, RemoveHighlightSameDataLink, RemoveHighlightSameDataLink, RemoveHighlightSameDataLink);
            break;
        case 'M': // Manufacturer block
            // For manufacturer blocks, highlight individual components
            onHoverStart.push(AddhighlightElem, AddhighlightElem, AddhighlightElem, AddhighlightElem, AddhighlightElem);
            onHoverEnd.push(RemovehighlightElem, RemovehighlightElem, RemovehighlightElem, RemovehighlightElem, RemovehighlightElem);
            break;
        case 'T': // Trailer block
            // For trailer blocks, highlight keys and show access condition details
            onHoverStart.push(AddHighlightKey, AddHighlightACs, AddhighlightElem, AddHighlightKey);
            onHoverEnd.push(RemoveHighlightKey, RemoveHighlightACs, RemovehighlightElem, RemoveHighlightKey);
            break;
        default:
            // Default case for other block types
            onHoverStart.push(null);
            onHoverEnd.push(null);
            break;
    }

    return {
        onHoverStart,
        onHoverEnd
    };
}

/**
 * Renders a block of MIFARE card data with appropriate formatting based on block type
 * @param {Object} props - Component props
 * @param {Array|Object} props.block - Block data to render
 * @param {string} props.type - Block type ('V' for value, 'M' for manufacturer, 'T' for trailer)
 * @param {number} props.blockIndex - Index of the block within its sector
 * @returns {JSX.Element} React component
 */
function Block({ block, type, blockIndex }) {
    let ParsedBlock;
    const { onHoverStart, onHoverEnd } = GetHoverFunction({ type, options: block.accessConditions?.parsed });

    // Parse the block data based on its type for proper display
    switch (type) {
        case 'V': // Value block
            // Value blocks are split into data segments according to MIFARE spec
            ParsedBlock = [block.slice(0, 4), block.slice(4, 8), block.slice(8, 12), [block[12]], [block[13]], [block[14]], [block[15]]];
            break;
        case 'M': // Manufacturer block
            // Extract UID components not included in NUID
            const filteredUid = block.uid.filter(byte => !block.nuid.includes(byte));
            ParsedBlock = [block.nuid, ...(filteredUid.length > 0 ? [filteredUid] : []), block.bcc, block.sak, block.ataq, block.data];
            break;
        case 'T': // Trailer block
            // Sector trailer contains keys and access bits
            ParsedBlock = [block.keyA, block.accessConditions.unParsed, block.userdata, block.keyB];
            break;
        default: // Standard data block
            ParsedBlock = [block];
            break;
    }

    return (
        <div className='flex gap-10 w-fit flex-row'>
            {/* Hex representation of the block */}
            <span
                className='HEXblock'
                data-type={type}
                data-block={blockIndex}
                data-link={CryptoJS.SHA256(ParsedBlock.join('') + Date.now() + Math.random()).toString()}
            > 
                {
                    // Render each parsed byte array as a hoverable span
                    ParsedBlock.map((byteArray, index) => (
                        <span
                            key={index}
                            data-link={CryptoJS.SHA256(byteArray.join('') + blockIndex).toString()}
                            {... type === 'T' && [0, 3].includes(index) ? { 'data-key': index === 0 ? 'A' : 'B' } : {}}
                            onMouseEnter={(e) => {onHoverStart[index] && onHoverStart[index](e.currentTarget)}}
                            onMouseLeave={(e) => {onHoverEnd[index] && onHoverEnd[index](e.currentTarget)}}
                        >
                            <Bytes byteArray={byteArray} />
                        </span>
                    ))
                }
            </span>
            
            {/* ASCII/text representation of the block */}
            <span
                className='TEXTblock'
                data-type={type}
                data-block={blockIndex}
                data-link={CryptoJS.SHA256(ParsedBlock.join('') + Date.now() + Math.random()).toString()}
            > 
                {
                    // Render text representation of each byte array
                    ParsedBlock.map((byteArray, index) => (
                        <span
                            key={index}
                            data-link={CryptoJS.SHA256(byteArray.join('') + blockIndex).toString()}
                            {... type === 'T' && [0, 3].includes(index) ? { 'data-key': index === 0 ? 'A' : 'B' } : {}}
                        >
                            <TextBytes byteArray={byteArray} />
                        </span>
                    ))
                }
            </span>
        </div>
    );
}

/**
 * Main component to analyze and render MIFARE card data
 * Loads card dump file and displays sector and block data with interactive features
 * @returns {JSX.Element} React component
 */
function Analyze() {
    // Load file data from sessionStorage or initialize as null
    const [fileData, setFileData] = useState(JSON.parse(sessionStorage.getItem('fileJSON')) || null);

    // State to adjust bottom padding based on HotBar UI element height
    const [paddingBottomValue, setPaddingBottomValue] = useState(0);

    // Load language settings for UI localization
    const [language, setLanguage] = useState(JSON.parse(sessionStorage.getItem('language')) || null);
    useEffect(() => {
        const loadLanguage = async () => {
            const files = sessionStorage.getItem('language') ? JSON.parse(sessionStorage.getItem('language')) : null;
            setLanguage(files);
        };
        loadLanguage();
    }, []);

    // useEffect hook to handle side effects such as DOM manipulation and event listeners
    useEffect(() => {
        // Select the HotBar element from the DOM
        const hotBar = document.querySelector('#HotBar');
        if (hotBar) {
            // Retrieve the spacing value from CSS custom properties (CSS variables)
            const spacing = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--spacing')) || 0;

            // Helper function to convert rem units to pixels
            const remToPx = (rem) => rem * parseFloat(getComputedStyle(document.documentElement).fontSize);

            // Calculate the padding-bottom value by adding the HotBar height and spacing (multiplied by 5 for additional spacing)
            setPaddingBottomValue(hotBar.offsetHeight + remToPx(spacing) * 5);
        }

        // Event handler for the 'message' event, triggered when a file is loaded
        const handleFileLoad = (event) => {
            const { type, data } = event.data;

            // Check if the event type is 'fileLoaded'
            if (type === 'fileLoaded') {
                // Toggle the visibility of the hamburger menu when a file is loaded
                const menu = document.querySelector('#hamburgerMenu');
                menu.classList.toggle('hidden');

                const data = JSON.parse(sessionStorage.getItem('fileJSON'));

                // Update the fileData state with the loaded file data
                setFileData(data);
            }
        };

        // Add the event listener for the 'message' event when the component mounts
        window.addEventListener('message', handleFileLoad);

        // Cleanup function to remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('message', handleFileLoad);
        };
    }, []); // Empty dependency array ensures this effect runs only once when the component mounts

    return (
        // Main container with dynamic padding-bottom based on the HotBar height
        <div className='w-full h-screen p-5 pr-1 font-inconsolata dark:text-dark-text text-light-text' style={{ paddingBottom: paddingBottomValue }}>
            <div className='h-full overflow-auto flex flex-col gap-5'>
                {
                    // Conditional rendering: If fileData exists, display its contents; otherwise, show a "No file loaded" message
                    fileData ? (
                        <>
                            {/* Iterate over the sectors in the fileData and render their contents */}
                            {fileData.sectors.map((sector, index) => (
                                <div key={index} className='flex flex-col gap-2 w-fit'>
                                    <h1 className='text-2xl dark:text-dark-text text-light-text w-fit font-bold'>
                                        {language.Sector} {index}
                                    </h1>
                                    <div className='flex flex-col gap-2 w-fit'>
                                        {/* Iterate over the blocks in the sector and render their contents */}
                                        {
                                            Array(4).fill(0).map((_, blockIndex) => {

                                                const isManifacturerBlock = blockIndex === 0 && index === 0; // Check if the block is the manufacturer block
                                                const isSectorTrailerBlock = blockIndex === 3; // Check if the block is the sector trailer block
                                                const type = isManifacturerBlock ? 'M' : isSectorTrailerBlock ? 'T' : sector.dataTypes[blockIndex]; // Determine the block type based on its index
                                                const block = isManifacturerBlock ? fileData.manifacturer : isSectorTrailerBlock ? sector.sectorTrailer : index === 0 ? sector.dataValues[blockIndex -1] : sector.dataValues[blockIndex]; // Get the block data based on its type
                                                
                                                return (
                                                    <Block
                                                        key={blockIndex}
                                                        block={block}
                                                        type={type}
                                                        blockIndex={blockIndex}
                                                    />
                                                );
                                            }
                                        )}
                                    </div>
                                    {/* Render a horizontal line to separate sectors */}
                                    <hr className='border-t mt-2 dark:border-dark-text border-light-text w-full' />
                                </div>
                            ))}
                        </>
                    ) : (
                        // Display a message when no file is loaded
                        <div className='flex justify-center items-center h-full'>
                            <h1 className='text-2xl dark:text-dark-text text-light-text'>{language.NoFile}</h1>
                        </div>
                    )
                }
            </div>
        </div>
    );
}

export default Analyze;