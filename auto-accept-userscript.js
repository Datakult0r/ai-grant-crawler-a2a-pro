// ==UserScript==
// @name         Auto-Accept Agent Laboratory
// @namespace    http://localhost/
// @version      1.0
// @description  Automatically clicks START AGENT LAB button
// @author       AI Grant Crawler
// @match        http://localhost:5173/*
// @match        http://localhost:*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    console.log('🤖 Auto-Accept Agent Laboratory - ACTIVATED');

    // Configuration
    const CHECK_INTERVAL = 1000; // Check every 1 second
    const BUTTON_TEXT = 'START AGENT LAB';

    // Auto-click function
    function autoClickStartButton() {
        // Find all buttons
        const buttons = document.querySelectorAll('button');

        for (const button of buttons) {
            // Check if this is the START AGENT LAB button
            if (button.textContent.includes(BUTTON_TEXT) && !button.disabled) {
                console.log(`✨ [${new Date().toLocaleTimeString()}] Auto-clicking START AGENT LAB!`);
                button.click();
                return true;
            }
        }
        return false;
    }

    // Set up interval to continuously check and click
    setInterval(() => {
        autoClickStartButton();
    }, CHECK_INTERVAL);

    console.log(`👀 Monitoring for "${BUTTON_TEXT}" button every ${CHECK_INTERVAL}ms`);
})();
