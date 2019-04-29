(() => {
    'use strict';

const content = {
    options: {
        extension_enabled: false,
        extension_functions: ["sort", "download"],
        sort_ascending: true,
        row_limit: 0,
        save_url: false,
        save_footer: false,
        save_csv: true
    },      
    setOptions: () => {
        const options = [
            "extension_enabled",
            "extension_functions",
            "sort_ascending",
            "row_limit",
            "save_url",
            "save_footer",
            "save_csv"
        ];
        const optionCount = options.length;
        for (let i = 0; i < optionCount; i++) {
            let option = options[i];
            chrome.storage.sync.get(option, (data) => {
                if (data.hasOwnProperty(option)) {
                    content.options[option] = data[option];
                    content.optionsChanged();
                }
            });
        }
    },
    optionsChanged: () => {
        if (content.options.extension_enabled) {
            content.addListeners();
            (content.options.extension_functions.indexOf("sort") === -1) ? content.editCss(false) : content.editCss(true);
        }
        else {
            content.editCss(false);
        }
    },    
    listenersAdded: false,
    addListeners: () => {
        if (!content.listenersAdded) {
            content.listenersAdded = true;
            document.addEventListener('mousemove', (e) => {
                if (content.options.extension_enabled && content.options.extension_functions.indexOf("download") !== -1) {
                    let table = content.getParentTag("TABLE", e.path);
                    table ? content.renderDownloadBtn(table) : content.removeDownloadBtn();
                }
            });
            document.addEventListener('click', (e) => {
                if (content.options.extension_enabled && content.options.extension_functions.indexOf("sort") !== -1) {
                    let header = content.getParentTag("TH", e.path);
                    if (header) {
                        let table = content.getParentTag("TABLE", e.path);
                        if (table) {
                            content.getTableData(table, header);
                        }
                    }
                }
            });
        }
    },
    editCss: (add) => {
        let style = document.getElementById("table-manager-style");
        if (add) {
            if (style === null) {
                const head = document.head || document.getElementsByTagName('head')[0];
                let style = document.createElement('style');
                style.id = "table-manager-style";
                style.innerHTML = 'th {cursor:pointer;}';
                head.appendChild(style);
            }
        }
        else {
            if (style) {
                style.parentElement.removeChild(style);
            }            
        }
    },    
    getParentTag: (tag, path) => {
        const pathLength = path.length;
        for (let i = 0; i < pathLength; i++) {
            if (path[i].tagName == tag) {
                return path[i];
            }
        }
        return false;
    },
    renderDownloadBtn: (table) => {
        if (document.getElementById("table-manager-download") === null) {
            let btn = document.createElement('div');
            btn.style.position = "absolute";
            btn.style["z-index"] = "10000";
            btn.style["text-align"] = "center";
            btn.style["border-radius"] = "2px";
            btn.style["font-size"] = "18px";
            btn.style["line-height"] = "18px";
            btn.style["text-shadow"] = "0 0 4px #000";
            btn.style.padding = "2px 0 0 0";
            btn.style.cursor = "pointer";
            btn.style.width = "24px";
            btn.style.height = "22px";
            btn.style.background = "#006699";
            btn.style.color = "#FFF";
            btn.style.left = `${table.offsetLeft}px`;
            btn.style.top = `${table.offsetTop}px`;
            btn.id = "table-manager-download";
            btn.innerHTML = "&#8681;";
            btn.title = "Click here to export table data";
            table.parentElement.appendChild(btn);
            btn.onclick = (e) => {
                content.getCsv(table.rows);
            }
        }
    },
    removeDownloadBtn: () => {
        let btn = document.getElementById("table-manager-download");
        if (btn) {
            if (btn.matches(":hover") === false) {
                btn.parentElement.removeChild(btn);
            }
        }        
    },
    getTableData: (table, sortHeader) => {
        //This function should be changed to enable sorting even if headers does not exist - and disable table sort if colspans differ
        const headers = table.getElementsByTagName("th");
        const headersCount = headers.length;
        const displayHeaders = [];
        let ascending = true;
        if (sortHeader.classList.contains("table-manager-asc")) {
            ascending = false;
        }
        else if (sortHeader.classList.contains("table-manager-desc")) {
            ascending = true;
        }
        else {
           ascending = content.options.sort_ascending; 
        }
        for (let i = 0; i < headersCount; i++) {
            displayHeaders.push(headers[i].textContent);
            headers[i].classList.remove("table-manager-asc", "table-manager-desc");
        }
        let data = [];
        const rows = table.rows;
        const rowsCount = rows.length - 1;
        let rowParent = rows[0].parentElement;
        for (let i = rowsCount; i >= 0; i--) {
            if (rows[i].parentElement.tagName !== "TFOOT") {
                const rowData = {};
                const columns = rows[i].getElementsByTagName("td");
                const columnsCount = columns.length;
                if (columnsCount) {
                    for (let c = 0; c < columnsCount; c++) {
                        if (c < headersCount) {
                            const colHeader = displayHeaders[c];
                            rowData[colHeader] = columns[c].textContent;
                        }
                    }
                    data.push({
                        elements: rows[i], 
                        content: rowData
                    });
                    rows[i].parentElement.removeChild(rows[i]);
                }
            }
        }
        data = content.sortTable(data, sortHeader, ascending);
        const dataCount = data.length;
        for (let i = 0; i < dataCount; i++) {
            rowParent.appendChild(data[i].elements);
        }
    },
    sortTable: (data, header, ascending) => {
        let aText = "";
        let bText = "";
        data.sort((a, b) => {
            
            if (a.content.hasOwnProperty(header.textContent)) {
                aText = a.content[header.textContent];
            }
            if (b.content.hasOwnProperty(header.textContent)) {
                bText = b.content[header.textContent];
            }
            aText = content.removeFirstCharacter(aText);
            bText = content.removeFirstCharacter(bText);   
            if (isNaN(aText) === false && isNaN(bText) === false) {
                return parseFloat(aText) - parseFloat(bText);
            }
            else if (isNaN(Date.parse(aText)) === false && isNaN(Date.parse(bText)) === false) {
                return Date.parse(aText) - Date.parse(bText);
            }
            else {
                if (isNaN(aText.replace(",", "")) === false && isNaN(bText.replace(",", "")) === false) {
                    return parseFloat(aText) - parseFloat(bText);
                }
                else if (isNaN(aText.replace(".", "")) === false && isNaN(bText.replace(".", "")) === false) {
                    return parseFloat(aText) - parseFloat(bText);
                }
                else if (isNaN(aText.replace(" ", "")) === false && isNaN(bText.replace(" ", "")) === false) {
                    return parseFloat(aText) - parseFloat(bText);
                }
                else {
                    return (aText.toLowerCase() > bText.toLowerCase()) ? 1 : -1;
                }                
            }
        });        
        if (ascending) {
            header.classList.add("table-manager-asc");
        }
        else {
            header.classList.add("table-manager-desc");
            data.reverse();
        }        
        return data;
    },
    removeFirstCharacter: (val) => {
        if (val) {
            const blacklist = ["£", "€", "$", "<", ">", "+", "#"];
            if (blacklist.indexOf(val.charAt(0)) !== -1) {
                val = val.substr(1);
            }
        }
        return val;
    },
    getCsv: (rows) => {
        let minLimit = Math.min(rows.length, content.options.row_limit);
        let limit = minLimit ? minLimit : rows.length;
        let csv = [];
        for (let i = 0; i < limit; i++) {
            if (content.save_footer === false && rows[i].parentElement.tagName === "TFOOT") {
                continue;
            }
            let row = [];
            const cols = rows[i].querySelectorAll("td, th");
            for (let j = 0; j < cols.length; j++) {
                let colValue = cols[j].textContent.trim();
                if (content.options.save_url) {
                    let links = cols[j].getElementsByTagName("a");
                    if (links) {
                        colValue = links[0].textContent.trim();
                    }
                } 
                else {
                    colValue = colValue.replace(/(\r\n|\n|\r)/gm, "");
                }
                row.push(colValue);
            }
            csv.push(row.join(","));
        }
        csv = csv.join("\n");
        let file = content.options.save_csv ? new Blob([csv], {type: "text/csv"}) : new Blob([csv], {type: "text/plain;charset=utf-8"});
        let extension = content.options.save_csv ? 'csv' : 'txt';
        let downloadLink = document.createElement("a");
        downloadLink.download = `table-manager-data.${extension}`;
        downloadLink.href = window.URL.createObjectURL(file);
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();   
        downloadLink.parentElement.removeChild(downloadLink);
    } 
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    for (let key in changes) {
        let storageChange = changes[key];
        content.options[key] = storageChange.newValue;
    }
    content.optionsChanged();
});

content.setOptions();
    
})();