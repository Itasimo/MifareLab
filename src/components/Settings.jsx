import React, { useState, useEffect } from 'react';

/**
 * SettingToggle component - Renders a toggle switch for boolean settings
 * 
 * @param {Object} settingInfo - Object containing title and description of the setting
 * @param {string} settingName - Key used to store the setting in localStorage
 * @param {boolean} needsRestart - Whether the app needs restart for changes to take effect
 * @returns {JSX.Element} - Toggle switch setting component
 */
function SettingToggle({ settingInfo, settingName, needsRestart }) {
    // Initialize state from localStorage, default to false if not found
    const [isChecked, setIsChecked] = useState(localStorage.getItem("settings") ? JSON.parse(localStorage.getItem("settings"))[settingName] : false);    

    /**
     * Handles toggle switch state change
     * Updates component state and persists changes to localStorage
     */
    const handleToggleChange = () => {
        setIsChecked(!isChecked);
        
        // Get current settings from localStorage or default to null
        const oldSetting = JSON.parse(localStorage.getItem('settings')) || null;
        // Create new settings object with updated value
        const newSetting = { ...oldSetting, [settingName]: !isChecked };
        localStorage.setItem('settings', JSON.stringify(newSetting));
    }

    // Get current active setting from sessionStorage for comparison
    const currentSetting = sessionStorage.getItem("settings") ? JSON.parse(sessionStorage.getItem("settings"))[settingName] : false;

    // Determine if restart icon should be displayed based on setting changes
    const shouldDisplayRestartIcon = needsRestart && currentSetting !== isChecked;

    const { title, description } = settingInfo;

    return (
        <div className='flex flex-col items-start justify-start w-full p-2'>
            <h2 className="text-xl font-inconsolata text-light-text dark:text-dark-text">
                {title}
            </h2>

            <div className="flex flex-row items-center justify-between w-full p-2">
                <div className="flex flex-row items-center justify-start w-full h-full gap-2">
                    <label htmlFor={settingName} className="text-light-text dark:text-dark-text">{description}</label>
                    {/* Display warning icon if setting change requires restart */}
                    { shouldDisplayRestartIcon && (
                        <div className="flex items-center mr-2">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path 
                                    fill="#FFBF00" 
                                    d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99z" 
                                />
                                <path 
                                    fill="#FFBF00" 
                                    d="M11 16h2v2h-2zm0-7h2v5h-2z" 
                                />
                            </svg>
                        </div>
                    )}
                </div>
                
                <input
                    type="checkbox"
                    id={settingName}
                    checked={isChecked}
                    onChange={handleToggleChange}
                />
                <label htmlFor={settingName} className="toggle-switch"></label>
            </div>
        </div>
    );
}

/**
 * SettingRadio component - Renders radio buttons for settings with multiple options
 * 
 * @param {Object} settingInfo - Object containing title, description and options for the setting
 * @param {string} settingName - Key used to store the setting in localStorage
 * @param {boolean} needsRestart - Whether the app needs restart for changes to take effect
 * @returns {JSX.Element} - Radio button setting component
 */
function SettingRadio({ settingInfo, settingName, needsRestart }){
    console.log(settingInfo, settingName, needsRestart);
    
    // Initialize state from localStorage, default to first option (0) if not found
    const [selectedOption, setSelectedOption] = useState(
        localStorage.getItem("settings") ? 
        JSON.parse(localStorage.getItem("settings"))[settingName] : 0
    );

    /**
     * Handles radio button selection change
     * Updates component state and persists changes to localStorage
     * 
     * @param {Event} event - The change event from the radio input
     */
    function handleRadioChange(event) {
        const value = parseInt(event.target.value);
        setSelectedOption(value);
        
        // Save to localStorage
        const oldSetting = JSON.parse(localStorage.getItem('settings')) || {};
        const newSetting = { ...oldSetting, [settingName]: value };
        localStorage.setItem('settings', JSON.stringify(newSetting));
    }

    // Get current active setting from sessionStorage for comparison
    const currentSetting = sessionStorage.getItem("settings") ? JSON.parse(sessionStorage.getItem("settings"))[settingName] : false;

    // Determine if restart icon should be displayed based on setting changes
    const shouldDisplayRestartIcon = needsRestart && currentSetting !== selectedOption;

    const { title, description } = settingInfo;

    return (
        <div className='flex flex-col items-start justify-start w-full p-2'>
            <h2 className="text-xl font-inconsolata text-light-text dark:text-dark-text">
                {title}
            </h2>

            <div className="flex flex-row items-center justify-between w-full p-2">
                <div className="flex flex-row items-center justify-start w-full h-full gap-2">
                    <label htmlFor={settingName} className="text-light-text dark:text-dark-text">{description}</label>
                    {/* Display warning icon if setting change requires restart */}
                    { shouldDisplayRestartIcon && (
                        <div className="flex items-center mr-2">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path 
                                    fill="#FFBF00" 
                                    d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99z"
                                    />
                                    <path 
                                        fill="#FFBF00" 
                                        d="M11 16h2v2h-2zm0-7h2v5h-2z" 
                                    />
                                </svg>
                            </div>
                        )}
                </div>

                <div className="radio-inputs">
                    {/* Render radio buttons for each option */}
                    {
                        settingInfo.options.map((option, index) => (
                            <label key={index}>
                                <input
                                    type="radio"
                                    name={settingName}
                                    value={index}
                                    id={`${settingName}-${index}`}
                                    onChange={handleRadioChange}
                                    checked={selectedOption === index}
                                />
                                <span htmlFor={`${settingName}-${index}`}>{option}</span>
                            </label>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}

/**
 * Settings component - Main settings page that renders various setting controls
 * 
 * Displays application settings grouped by type (toggle switches, radio buttons)
 * Handles language localization and navigation
 * 
 * @returns {JSX.Element} - Settings page component
 */
function Settings() {
    // State to manage UI localization strings, retrieved from sessionStorage
    const [language, setLanguage] = useState(JSON.parse(sessionStorage.getItem('language')) || null);
    
    /**
     * Load language settings from sessionStorage when component mounts
     * This ensures the UI displays text in the user's preferred language
     */
    useEffect(() => {
        const loadLanguage = async () => {
            const files = sessionStorage.getItem('language') ? JSON.parse(sessionStorage.getItem('language')) : null;
            setLanguage(files);
        };
        loadLanguage();
    }, []);

    /**
     * Handles closing the settings panel
     * Posts a message to parent window to close settings
     * 
     * @param {Event} event - The click event from the back button
     */
    const handleCloseSettings = (event) => {
        window.postMessage({
            type: 'closeSettings'
        });
    };
    
    return (
        <div className="w-full">
            <div className="flex flex-row items-center">
                {/* Back button */}
                <button onClick={handleCloseSettings}>
                    <svg
                        className="aspect-square w-8 h-8 m-2"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="12 8 6 12 12 16" />
                    </svg>
                </button>
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <h1 className="text-3xl font-inconsolata text-light-text dark:text-dark-text">{language.Menu[1]}</h1>
                </div>
            </div>
            {/* Settings controls container */}
            <div className="flex flex-col items-start justify-start w-full p-5">
                <SettingToggle settingInfo={language.Settings[0]} settingName="devTools" needsRestart={true} />
                <SettingRadio settingInfo={language.Settings[1]} settingName="theme" needsRestart={true} />
                <SettingRadio settingInfo={language.Settings[2]} settingName="lang" needsRestart={true} />
            </div>
        </div>
    );
}

export default Settings;