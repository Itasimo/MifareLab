import React, { useState, useEffect } from 'react';

function Diff() {

        
    // State to manage UI localization strings, retrieved from sessionStorage
    const [language, setLanguage] = useState(JSON.parse(sessionStorage.getItem('language')) || null);
    
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

    return (
        <div className='w-full h-full p-5 font-inconsolata dark:text-dark-text text-light-text'>
            <h1>{language.ComingSoon}</h1>
        </div>
    )
}

export default Diff