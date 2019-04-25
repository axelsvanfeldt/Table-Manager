(() => {
    'use strict';
    
    const popup = {
        buttons: {
            options: document.getElementById('options-button'),
            close: document.getElementById('close-button'),
            toggle: document.getElementById('toggle-button'),            
        },
        toggleExtension: (manual) => {
            chrome.storage.sync.get("extension_enabled", (data) => {
                let status = document.getElementById('status');
                let enabled = true;
                if (data.hasOwnProperty("extension_enabled")) {
                    enabled = data.extension_enabled;
                }
                if ((manual && enabled) || (manual === false && enabled === false)) {
                    chrome.browserAction.setBadgeText({text: ""});
                    status.classList.remove("enabled");
                    status.classList.add("disabled");
                    status.innerHTML = "Disabled";
                    enabled = false;
                }
                else {
                    chrome.browserAction.setBadgeText({text: "ON"});
                    status.classList.remove("disabled");
                    status.classList.add("enabled");
                    status.innerHTML = "Enabled";
                    enabled = true;
                }
                chrome.storage.sync.set({extension_enabled: enabled});
            });
        },
        getStatus: () => {
            popup.toggleExtension(false);
            chrome.storage.sync.get("extension_functions", (data) => {
                if (data.hasOwnProperty("extension_functions")) {
                    popup.renderStatus("download", data.extension_functions);
                    popup.renderStatus("sort", data.extension_functions);
                }
            });            
        },
        renderStatus: (action, value) => {
            let status = document.getElementById(action);
            if (status) {
                if (value.indexOf(action) === -1) {
                    status.classList.remove("enabled");
                    status.classList.add("disabled");
                }
                else {
                    status.classList.remove("disabled");
                    status.classList.add("enabled");
                }
            }
        },
        
    };

    popup.buttons.options.onclick = (element) => {
        chrome.runtime.openOptionsPage();
    };

    popup.buttons.close.onclick = (element) => {    
        window.close();
    };
    
    popup.buttons.toggle.onclick = (element) => {    
        popup.toggleExtension(true);
    };
    
    popup.getStatus();  
    
})();