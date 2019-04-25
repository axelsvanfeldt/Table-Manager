(() => {
    'use strict';
    
    const options = {
        initialize: () => {
            options.addListeners();
            options.renderOptions();
        },
        listeners: ['extension_enabled', 'extension_functions', 'row_limit', 'sort_ascending', 'save_url', 'save_footer', "save_csv"],
        addListeners: () => {
            chrome.storage.onChanged.addListener((changes, namespace) => {
                options.renderOptions();
            }); 
            document.getElementById('reset').onclick = (e) => {
                options.resetOptions();
            }
            const listenerCount = options.listeners.length;
            for (let i = 0; i < listenerCount; i++) {
                let inputs = document.querySelectorAll(`input[name="${options.listeners[i]}"]`);
                if (inputs) {
                    for (let j = 0; j < inputs.length; j++) {
                        inputs[j].onchange = (e) => {
                            let input;
                            switch (options.listeners[i]) {
                                case "extension_enabled":
                                    input = document.querySelector('input[name="extension_enabled"]:checked');
                                    if (input) {
                                        let value = JSON.parse(input.value);
                                        value ? chrome.browserAction.setBadgeText({text: "ON"}) : chrome.browserAction.setBadgeText({text: ""});
                                        chrome.storage.sync.set({extension_enabled: value});
                                    }
                                    break;
                                case "extension_functions":
                                   input = document.querySelectorAll('input[name="extension_functions"]:checked');
                                        let storageValue = [];
                                        for (let c = 0; c < input.length; c++) {
                                            storageValue.push(input[c].value);
                                        }
                                        chrome.storage.sync.set({extension_functions: storageValue});
                                    break;
                                case "row_limit":
                                    chrome.storage.sync.set({row_limit: parseInt(e.target.value)});
                                    break;
                                default:
                                    input = document.querySelector(`input[name="${options.listeners[i]}"]:checked`);
                                    if (input) {
                                        let storageData = {};
                                        storageData[options.listeners[i]] = JSON.parse(input.value);
                                        chrome.storage.sync.set(storageData);
                                    }
                            }                             
                        };                
                    }
                }
            }       
        },
        renderOptions: () => {
            const optionCount = options.listeners.length;
            for (let i = 0; i < optionCount; i++) {
                let option = options.listeners[i];
                chrome.storage.sync.get(option, (data) => {
                    if (data.hasOwnProperty(option)) {
                        switch (option) {
                            case "extension_functions":
                                document.getElementById("extension_functions_sort").checked = false;
                                document.getElementById("extension_functions_download").checked = false;
                                if (data[option].indexOf("sort") === -1) {
                                    document.getElementById("extension_functions_sort").checked = false;
                                }
                                else {
                                    document.getElementById("extension_functions_sort").checked = true;
                                }
                                if (data[option].indexOf("download") === -1) {
                                    document.getElementById("extension_functions_download").checked = false;
                                }
                                else {
                                    document.getElementById("extension_functions_download").checked = true;
                                }
                                break;
                            case "row_limit":
                                document.getElementById("row_limit").value = data[option];
                                break;
                            default:
                                document.getElementById(`${option}_${JSON.stringify(data[option])}`).checked = true;
                        }
                    }
                });
            }
        },
        resetOptions: () => {
            chrome.browserAction.setBadgeText({text: "ON"});
            chrome.storage.sync.set({extension_enabled: true});
            chrome.storage.sync.set({extension_functions: ["sort", "download"]});
            chrome.storage.sync.set({sort_ascending: true});
            chrome.storage.sync.set({save_url: false});
            chrome.storage.sync.set({save_footer: false});
            chrome.storage.sync.set({save_csv: true});
            chrome.storage.sync.set({row_limit: 0});
            options.renderOptions();
        }        
    };
    
    options.initialize();
    
})();