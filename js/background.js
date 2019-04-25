'use strict';

const executeContentScript = (tabId, tabUrl) => {
    if (tabUrl.indexOf("chrome://") === -1) {
        chrome.tabs.executeScript(tabId, {
            allFrames: true,
            file: 'js/content.js',
            runAt: 'document_end'
        });
    }
}

chrome.runtime.onInstalled.addListener(() => {

    chrome.browserAction.setBadgeBackgroundColor({color: "#666"});

    chrome.storage.sync.get("extension_enabled", (data) => {
        let badgeText = "ON";
        if (data.hasOwnProperty("extension_enabled")) {
            if (data.extension_enabled === false) {
                badgeText = "";
            }
        }
        chrome.browserAction.setBadgeText({text: badgeText});
    });
    
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        executeContentScript(tabId, tab.url);
    }
});

chrome.tabs.onActivated.addListener((tab) => {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        executeContentScript(tabs[0].id, tabs[0].url);
    });
});
