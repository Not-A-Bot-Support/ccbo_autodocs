/* script.js

Standard Notes Generator Version 5.0.000000
Developed & Designed by: QA Ryan */

// FIRST LOAD CHECK
document.addEventListener("DOMContentLoaded", async () => {
    const hasPrompted = sessionStorage.getItem("hasCheckedNotes");

    if (!hasPrompted) {
        const savedData = JSON.parse(localStorage.getItem("tempDatabase") || "{}");

        if (Object.keys(savedData).length > 0) {
            const shouldClear = await showConfirm1(
                "Existing saved notes have been detected on this workstation.\n\nHow would you like to proceed?"
            );

            if (shouldClear) {
                localStorage.removeItem("tempDatabase");
                showAlert("Previously saved notes (old records) have been deleted.");
            }
        }

        sessionStorage.setItem("hasCheckedNotes", "true");
    }
});

// Case Origin, Concern Type, and VOC Options
const LOB_OPTIONS = [
    { value: "", text: "" },
    // { value: "TECH", text: "TECH" },
    { value: "NON-TECH", text: "NON-TECH" }
];

const TECH_VOC_ALLOWED = [
    "COMPLAINT", 
    "FOLLOW-UP", 
    "REQUEST", 
    "OTHERS"
];

const TECH_COMPLAINT_GROUPS = [
    "Always On",
    "No Dial Tone and No Internet Connection",
    "No Internet Connection",
    "Slow Internet/Intermittent Connection",
    "No Dial Tone",
    "Poor Call Quality/Noisy Telephone Line",
    "Cannot Make a Call",
    "Cannot Receive a Call",
    "Selective Browsing Complaints",
    "No Audio/Video Output",
    "Poor Audio/Video Quality",
    "Missing Set-Top-Box Functions",
    "Streaming Apps Issues",
    "formCompMyHomeWeb",
    "formCompPersonnelIssue"
];

const NON_TECH_GROUP_MAP = {
    "INQUIRY": "inquiry",
    "COMPLAINT": "complaint",
    "FOLLOW-UP": "follow-up",
    "REQUEST": "request",
    // "OTHERS": "others"
};

// Global variables
let lobSelect, vocSelect, intentSelect;
let serviceIDRow, option82Row, intentWocasRow, wocasRow;
let allLobOptions, allVocOptions, allIntentChildren, placeholderClone;

function initializeFormElements() {
    lobSelect = document.getElementById("lob");
    vocSelect = document.getElementById("voc");
    intentSelect = document.getElementById("selectIntent");
    serviceIDRow = document.getElementById("service-id-row");
    option82Row = document.getElementById("option82-row");
    intentWocasRow = document.getElementById("intent-wocas-row");
    // wocasRow = document.getElementById("wocas-row");

    if (!lobSelect || !vocSelect || !intentSelect) {
        console.error("Required form elements not found");
        return;
    }

    allVocOptions = Array.from(vocSelect.options).map(opt => opt.cloneNode(true));
    vocSelect.innerHTML = "";

    const placeholder = allVocOptions.find(opt => opt.value === "");
    if (placeholder) {
        vocSelect.appendChild(placeholder);
    }

    allIntentChildren = Array.from(intentSelect.children).map(el => el.cloneNode(true));

    const placeholderOption = allIntentChildren.find(el => el.tagName === "OPTION" && el.value === "");
    placeholderClone = placeholderOption ? placeholderOption.cloneNode(true) : null;

    allLobOptions = LOB_OPTIONS;

    // Start LOB with only blank option
    lobSelect.innerHTML = "";
    const blankOption = document.createElement("option");
    blankOption.value = "";
    blankOption.textContent = "";
    blankOption.disabled = true;
    blankOption.selected = true;
    lobSelect.appendChild(blankOption);
}

function showRowAndScroll(rowElement) {
    if (rowElement) {
        rowElement.style.display = "";
        rowElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

function hideRow(rowElement) {
    if (rowElement) {
        rowElement.style.display = "none";
    }
}

const caseOriginField = document.getElementById("caseOrigin");

if (caseOriginField) {
    caseOriginField.addEventListener("change", () => {
        lobSelect.innerHTML = "";

        // Always show the non-selectable blank option first
        const blankOption = document.createElement("option");
        blankOption.value = "";
        blankOption.textContent = "";
        blankOption.disabled = true;
        blankOption.selected = true;
        lobSelect.appendChild(blankOption);

        if (caseOriginField.value !== "") {
            // Show only valid LOBs when case origin is selected
            allLobOptions.forEach(optData => {
                if (optData.value !== "") { // skip the blank
                    const opt = document.createElement("option");
                    opt.value = optData.value;
                    opt.textContent = optData.text;
                    lobSelect.appendChild(opt);
                }
            });
        }

        vocSelect.innerHTML = "";  // Reset VOC
    });
}

function handleLobChange() {
    const lobSelectedValue = lobSelect.value;

    vocSelect.innerHTML = "";

    const placeholder = allVocOptions.find(opt => opt.value === "");
    if (placeholder) {
        vocSelect.appendChild(placeholder);
    }

    allVocOptions.forEach(option => {
        if (
            (lobSelectedValue === "TECH" && TECH_VOC_ALLOWED.includes(option.value)) ||
            (lobSelectedValue === "NON-TECH" && NON_TECH_GROUP_MAP[option.value])
        ) {
            vocSelect.appendChild(option);
        }
    });

    vocSelect.selectedIndex = 0;

    handleVocChange();
}

function handleVocChange() {
    resetForm2ContainerAndRebuildButtons();

    const lobValue = lobSelect.value;
    const vocValue = vocSelect.value;

    hideRow(serviceIDRow);
    hideRow(option82Row);
    hideRow(intentWocasRow);
    // hideRow(wocasRow);

    if (vocValue === "") {
        intentSelect.innerHTML = "";
        if (placeholderClone) {
            intentSelect.appendChild(placeholderClone.cloneNode(true));
        }
        return;
    }

    // Show-Hide Rows
    updateRowsVisibility(lobValue, vocValue);

    // Show only blank option
    intentSelect.innerHTML = "";
    if (placeholderClone) {
        intentSelect.appendChild(placeholderClone.cloneNode(true));
    }

    // Populate Intent/WOCAS Options
    populateIntentSelect(lobValue, vocValue);

    intentSelect.selectedIndex = 0;
}

function updateRowsVisibility(lobValue, vocValue) {
    if (lobValue === "TECH") {
        if (vocValue === "FOLLOW-UP") {
            // showRowAndScroll(wocasRow);
            hideRow(serviceIDRow);
            hideRow(option82Row);
            showRowAndScroll(intentWocasRow);
        } else if (vocValue === "COMPLAINT" || vocValue === "REQUEST") {
            showRowAndScroll(serviceIDRow);
            showRowAndScroll(option82Row);
            showRowAndScroll(intentWocasRow);
            // showRowAndScroll(wocasRow);
        } else { // INQUIRY & OTHERS
            // hideRow(wocasRow);
            hideRow(serviceIDRow);
            hideRow(option82Row);
            showRowAndScroll(intentWocasRow);
        }
    } else if (lobValue === "NON-TECH") {
        // hideRow(wocasRow);
        hideRow(serviceIDRow);
        hideRow(option82Row);
        showRowAndScroll(intentWocasRow);
    }
}

function populateIntentSelect(lobValue, vocValue) {
    if (lobValue === "TECH") {
        if (vocValue === "COMPLAINT") {
            allIntentChildren.forEach(el => {
                if (el.tagName === "OPTGROUP" && TECH_COMPLAINT_GROUPS.includes(el.label)) {
                    intentSelect.appendChild(el.cloneNode(true));
                } else if (el.tagName === "OPTION" && TECH_COMPLAINT_GROUPS.includes(el.value)) {
                    intentSelect.appendChild(el.cloneNode(true));
                }
            });
        } else if (vocValue === "FOLLOW-UP") {
            allIntentChildren.forEach(el => {
                if (el.tagName === "OPTION" && el.value === "formFfupRepair") {
                    intentSelect.appendChild(el.cloneNode(true));
                }
            });
        } else if (vocValue === "REQUEST") {
            allIntentChildren.forEach(el => {
                if (el.tagName === "OPTGROUP" && el.label === "Change Configuration - Data") {
                    intentSelect.appendChild(el.cloneNode(true));
                }
            });
        } else {
            const group = "others";
            populateByGroup(group);
        }
    } else if (lobValue === "NON-TECH") {
        const group = NON_TECH_GROUP_MAP[vocValue];
        populateByGroup(group, vocValue);
    }
}

function populateByGroup(group, vocValue = null) {
    allIntentChildren.forEach(el => {
        if (el.tagName === "OPTION" && el.dataset.group === group) {
            intentSelect.appendChild(el.cloneNode(true));
        } else if (el.tagName === "OPTGROUP") {
            let matchingOptions;
            // Special handling for REQUEST + "Change Configuration - Data"
            if (vocValue === "REQUEST" && el.label === "Change Configuration - Data") {
                matchingOptions = Array.from(el.children);
            } else {
                matchingOptions = Array.from(el.children).filter(opt => opt.dataset.group === group);
            }
            if (matchingOptions.length > 0) {
                const newGroup = el.cloneNode(false);
                matchingOptions.forEach(opt => newGroup.appendChild(opt.cloneNode(true)));
                intentSelect.appendChild(newGroup);
            }
        }
    });
}

function registerEventHandlers() {
    if (lobSelect && vocSelect) {
        lobSelect.addEventListener("change", handleLobChange);
        vocSelect.addEventListener("change", handleVocChange);
    }
}

// Typewriter Effect
let typingInterval;

function typeWriter(text, element, delay = 50) {
    let index = 0;
    element.innerHTML = "";

    if (typingInterval) {
        clearInterval(typingInterval);
    }

    typingInterval = setInterval(() => {
        if (index < text.length) {            
            element.innerHTML += text.charAt(index);
            index++;
        } else {
            clearInterval(typingInterval);
        }
    }, delay);
}

// Auto-Expand Textarea field
function autoExpandTextarea(event) {
    if (event.target.tagName === 'TEXTAREA') {
        const textarea = event.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight + 1}px`;
    }
}

document.addEventListener('input', autoExpandTextarea);

// Copy to Clipboard Command
function resolveCopyValue(rawValue = "", type = null) {
    if (typeof rawValue !== "string") {
        rawValue = String(rawValue || "");
    }

    let normalized = rawValue.trim();

    if (type === "node") {
        normalized = normalized.toUpperCase().split("_")[0];
    }

    return normalized;
}

function copyValue(button) {
    const input = button.previousElementSibling || document.getElementById("option82");
    if (!input) return;

    const type = input.dataset?.type || (input.id === "option82" ? "option82" : null);
    const rawValue = input.value || "";

    const valueToCopy = type === "option82"
        ? resolveCopyValue(rawValue, "opt82")?.split("_")[0]
        : resolveCopyValue(rawValue);

    copyToClipboard(valueToCopy);
}

// LOAD DATA & FORM 1 COPY FUNCTION
document.addEventListener("DOMContentLoaded", () => {
    const caseField = document.querySelector('[name="sfCaseNum"]');

    if (!caseField) return;

    caseField.addEventListener("change", loadFormData);

    document.addEventListener("click", (e) => {

        // DROPDOWN TOGGLE
        const btn = e.target.closest(".copy-btn");
        if (btn) {
            e.stopPropagation();

            const dropdown = btn.closest(".copy-dropdown");

            document.querySelectorAll(".copy-dropdown").forEach(d => {
                if (d !== dropdown) d.classList.remove("active");
            });

            dropdown.classList.toggle("active");
            return;
        }

        // DROPDOWN OPTIONS (Node / Option82)
        const option = e.target.closest(".copy-option");
        if (option) {
            e.preventDefault();
            e.stopPropagation();

            const type = option.dataset.type;
            const container = option.closest(".form1DivInput");
            const input = container.querySelector("input");

            if (!input) return;

            const resolved = resolveCopyValue(input.value, type);
            copyToClipboard(resolved);

            option.closest(".copy-dropdown").classList.remove("active");
            return;
        }

        // REGULAR COPY BUTTON (fallback)
        const regularCopyBtn = e.target.closest(
            "button.input-and-button:not(.copy-btn):not(.copy-option)"
        );

        if (regularCopyBtn) {
            const container = regularCopyBtn.closest(".form1DivInput");
            const input = container?.querySelector("input");

            if (!input) return;

            const resolved = resolveCopyValue(input.value);
            copyToClipboard(resolved);
            return;
        }

        // CLICK OUTSIDE → close dropdowns
        document.querySelectorAll(".copy-dropdown").forEach(d => {
            d.classList.remove("active");
        });

    });

});

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => console.log("Copied:", text))
        .catch(err => console.error("Copy failed:", err));
}

// Show/Hide rows based on case origin selection & Timers
document.addEventListener('DOMContentLoaded', function() { 
    // ================================
    // SHOW/HIDE ROWS BASED ON CASE ORIGIN
    // ================================
    const caseOriginSelect = document.getElementById("caseOrigin");

    const rows = {
        caseAccountHeader: document.getElementById("case-and-account-header-row"),
        custName: document.getElementById("cust-name-row"),
        caseNum: document.getElementById("case-num-row"),
        accNum: document.getElementById("acc-num-row"),
        phoneNum: document.getElementById("phone-num-row"),
        lobVoc: document.getElementById("lob-and-voc-row"),
        buttonsRow: document.getElementById("buttons-row"),
        caseOrigin: document.getElementById("case-origin-row")
    };

    function updateCaseOriginRows() {
        if (!caseOriginSelect.value) return;

        const isOrdertake = caseOriginSelect.value === "Ordertake";

        rows.caseAccountHeader.style.display = "";
        rows.custName.style.display = "";
        rows.accNum.style.display = "";
        rows.phoneNum.style.display = "";
        rows.lobVoc.style.display = "";
        rows.caseNum.style.display = isOrdertake ? "none" : "";
        rows.buttonsRow.style.display = "";
    }

    caseOriginSelect?.addEventListener("change", updateCaseOriginRows);

    // Run once on load
    updateCaseOriginRows();

    if (typeof initializeFormElements === "function") initializeFormElements();
    if (typeof registerEventHandlers === "function") registerEventHandlers();

    // ================================
    // MAIN TIMER
    // ================================
    let timerInterval;
    let startTime;
    let elapsedTime = 0;
    let isRunning = false;

    const timerDisplay = document.getElementById('timerDisplay');
    const timerToggleButton = document.getElementById('timerToggleButton');
    const timerResetButton = document.getElementById('timerResetButton');

    if (timerDisplay) timerDisplay.textContent = formatTime(0);

    function formatTime(seconds) {
        const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const secs = String(seconds % 60).padStart(2, '0');
        return `${hrs}:${mins}:${secs}`;
    }

    function updateDisplay() {
        const now = Date.now();
        const totalElapsedSeconds = Math.floor((now - startTime + elapsedTime) / 1000);
        timerDisplay.textContent = formatTime(totalElapsedSeconds);
    }

    function handleTimer(action) {
        if (action === 'start' && !isRunning) {
            startTime = Date.now();
            timerInterval = setInterval(updateDisplay, 1000);
            isRunning = true;
            timerToggleButton.textContent = 'Pause';
        } else if (action === 'pause' && isRunning) {
            clearInterval(timerInterval);
            elapsedTime += Date.now() - startTime;
            isRunning = false;
            timerToggleButton.textContent = 'Resume';
        } else if (action === 'reset') {
            showConfirm2("Are you sure you want to reset the timer?")
            .then((confirmReset) => {
                if (!confirmReset) return;

                clearInterval(timerInterval);
                elapsedTime = 0;
                timerDisplay.textContent = formatTime(0);
                isRunning = false;
                timerToggleButton.textContent = 'Start';
            });
        }
    }

    timerToggleButton?.addEventListener('click', function() {
        if (isRunning) {
            handleTimer('pause');
        } else {
            handleTimer('start');
        }
    });

    timerResetButton?.addEventListener('click', function() {
        handleTimer('reset');
    });

    // ================================
    // TICKET CREATION TIMER
    // ================================
    // let ticketTimerInterval = null;
    // let ticketSeconds = 0;

    // const ticketTimer = document.getElementById("ticketTimer");
    // const ticketDisplay = document.getElementById("ticketTimerDisplay");

    // function formatTicketTime(sec) {
    //     const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    //     const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    //     const s = String(sec % 60).padStart(2, "0");
    //     return `${h}:${m}:${s}`;
    // }

    // function startTicketTimer() {
    //     if (ticketTimerInterval) return;
    //     ticketTimerInterval = setInterval(() => {
    //         ticketSeconds++;
    //         if (ticketDisplay) ticketDisplay.textContent = formatTicketTime(ticketSeconds);
    //     }, 1000);
    //     console.log("▶️ Ticket Timer started");
    // }

    // function stopTicketTimer() {
    //     clearInterval(ticketTimerInterval);
    //     ticketTimerInterval = null;
    //     console.log("⏸ Ticket Timer stopped");
    // }

    // function resetTicketTimer() {
    //     clearInterval(ticketTimerInterval);
    //     ticketTimerInterval = null;
    //     ticketSeconds = 0;
    //     if (ticketDisplay) ticketDisplay.textContent = formatTicketTime(0);
    //     console.log("♻️ Ticket Timer reset");
    // }

    // window.stopTicketTimer = stopTicketTimer;
    // window.resetTicketTimer = resetTicketTimer;
    // window.startTicketTimer = startTicketTimer;

    // function isVisible(el) {
    //     if (!el) return false;
    //     let cur = el;
    //     while (cur && cur.nodeType === 1) {
    //         const cs = window.getComputedStyle(cur);
    //         if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) {
    //             return false;
    //         }
    //         cur = cur.parentElement;
    //     }
    //     const rect = el.getBoundingClientRect();
    //     return !(rect.width === 0 && rect.height === 0);
    // }

    // function checkStopConditions() {
    //     const landmarks = document.querySelector("input[name='landmarks'], textarea[name='landmarks'], #landmarks");
    //     const cbr = document.querySelector("input[name='cbr'], textarea[name='cbr'], #cbr");

    //     const landmarksVisible = isVisible(landmarks);
    //     const landmarksHasValue = landmarks && landmarks.value.trim() !== "";
    //     const cbrHasValue = cbr && cbr.value.trim() !== "";

    //     if (landmarksVisible) {
    //         if (landmarksHasValue) stopTicketTimer();
    //     } else {
    //         if (cbrHasValue) stopTicketTimer();
    //     }
    // }

    // document.addEventListener("change", function (e) {
    //     const t = e.target;

    //     if (t.matches("select[name='issueResolved'], #issueResolved") ||
    //         t.matches("select[name='outageStatus'], #outageStatus")) {

    //         const issueResolved = document.querySelector("select[name='issueResolved']")?.value || "";
    //         const outageStatus = document.querySelector("select[name='outageStatus']")?.value || "";

    //         if (issueResolved === "No - for Ticket Creation" || outageStatus === "Yes") {
    //             if (ticketTimer) ticketTimer.style.display = "block";
    //             startTicketTimer();
    //         } else {
    //             stopTicketTimer();
    //             resetTicketTimer();
    //             if (ticketTimer) {
    //                 ticketTimer.style.display = "none";
    //             }
    //         }
    //     }

    //     if (t.matches("input[name='landmarks'], textarea[name='landmarks'], #landmarks")) checkStopConditions();
    //     if (t.matches("input[name='cbr'], textarea[name='cbr'], #cbr")) {
    //         const landmarks = document.querySelector("input[name='landmarks'], textarea[name='landmarks'], #landmarks");
    //         if (!isVisible(landmarks)) checkStopConditions();
    //     }
    // });

    // document.addEventListener("input", function (e) {
    //     const t = e.target;

    //     if (t.matches("input[name='landmarks'], textarea[name='landmarks'], #landmarks")) checkStopConditions();
    //     if (t.matches("input[name='cbr'], textarea[name='cbr'], #cbr")) {
    //         const landmarks = document.querySelector("input[name='landmarks'], textarea[name='landmarks'], #landmarks");
    //         if (!isVisible(landmarks)) checkStopConditions();
    //     }
    // });

    // (function makeDraggable(el) {
    //     if (!el) return;
    //     let offsetX = 0, offsetY = 0, isDown = false;
    //     const header = el.querySelector("#ticketTimerHeader") || el;
    //     header.style.cursor = "grab";

    //     header.addEventListener("mousedown", dragMouseDown);
    //     document.addEventListener("mouseup", closeDragElement);
    //     document.addEventListener("mousemove", elementDrag);

    //     function dragMouseDown(e) {
    //         e.preventDefault();
    //         isDown = true;
    //         offsetX = e.clientX - el.offsetLeft;
    //         offsetY = e.clientY - el.offsetTop;
    //         header.style.cursor = "grabbing";
    //     }

    //     function elementDrag(e) {
    //         if (!isDown) return;
    //         e.preventDefault();
    //         el.style.left = (e.clientX - offsetX) + "px";
    //         el.style.top = (e.clientY - offsetY) + "px";
    //     }

    //     function closeDragElement() {
    //         isDown = false;
    //         header.style.cursor = "grab";
    //     }
    // })(ticketTimer);

    // window.__checkTicketStop = checkStopConditions;
});

// Reset Dropdown options to default
function resetAllFields(excludeFields = []) {
    const selects = document.querySelectorAll("#form2Container select");
    selects.forEach(select => {
        if (!excludeFields.includes(select.name)) { 
            select.selectedIndex = 0; 
        }
    });
}

// Hide specific fields
function hideSpecificFields(fieldNames) {
    const allRows = document.querySelectorAll("tr");
    fieldNames.forEach(name => {
        allRows.forEach(row => {
            const field = row.querySelector(`[name="${name}"]`);
            if (field) {
                row.style.display = "none";
            }
        });
    });
}

// Show specific fields
function showFields(fieldNames) {
    const allRows = document.querySelectorAll("tr");
    fieldNames.forEach(name => {
        allRows.forEach(row => {
            const field = row.querySelector(`[name="${name}"]`);
            if (field) {
                row.style.display = "table-row";
            }
        });
    });
}

// Check if field is visible
function isFieldVisible(fieldName) {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return false;

    const fieldRow = field.closest("tr");
    const fieldStyle = window.getComputedStyle(field);

    return field.offsetParent !== null &&  
        !(fieldRow?.style.display === "none" ||
            fieldStyle.display === "none" ||
            fieldStyle.visibility === "hidden" ||
            fieldStyle.opacity === "0");
}

// Get Field value only if it is visible
function getFieldValueIfVisible(fieldName) {
    if (!isFieldVisible(fieldName)) return "";

    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return "";

    let value = field.value.trim();

    if (field.tagName.toLowerCase() === "textarea") {
        value = value.replace(/\r?\n|\|/g, "/ ");
    }

    return value;
}

// Declare global variables
function initializeVariables() {
    const q = (selector) => {
        const field = document.querySelector(selector);
        return field && isFieldVisible(field.name) ? field.value.trim() : "";
    };

    const selectIntentElement = document.querySelector("#selectIntent");
    const selectedIntentText = selectIntentElement 
        ? selectIntentElement.selectedOptions[0].textContent.trim() 
        : "";
    
    let selectedOptGroupLabel = "";
    if (selectIntentElement && selectIntentElement.selectedOptions.length > 0) {
        const selectedOption = selectIntentElement.selectedOptions[0];
        if (selectedOption.parentElement.tagName.toLowerCase() === "optgroup") {
            selectedOptGroupLabel = selectedOption.parentElement.label;
        }
    }

    return {
        selectedIntent: q("#selectIntent"),
        selectedIntentText,
        selectedOptGroupLabel,
        caseOrigin: q("#caseOrigin"),
        custName: q('[name="custName"]'),
        sfCaseNum: q('[name="sfCaseNum"]'),
        selectVOC: q('[name="selectVOC"]'),
        WOCAS: q('[name="WOCAS"]'),
        projRed: q('[name="projRed"]'),
        outageStatus: q('[name="outageStatus"]'),
        Option82: q('[name="Option82"]'),
        rptCount: q('[name="rptCount"]'),
        investigation1: q('[name="investigation1"]'),
        investigation2: q('[name="investigation2"]'),
        investigation3: q('[name="investigation3"]'),
        investigation4: q('[name="investigation4"]'),
        accountStatus: q('[name="accountStatus"]'),
        facility: q('[name="facility"]'),
        resType: q('[name="resType"]'),
        pcNumber: q('[name="pcNumber"]'),
        issueResolved: q('[name="issueResolved"]'),
        pldtUser: q('[name="pldtUser"]'),
        ticketStatus: q('[name="ticketStatus"]'),
        offerALS: q('[name="offerALS"]'),
        accountNum: q('[name="accountNum"]'),
        landlineNum: q('[name="landlineNum"]'),
        remarks: q('[name="remarks"]'),
        cepCaseNumber: q('[name="cepCaseNumber"]'),
        specialInstruct: q('[name="specialInstruct"]'),
        meshtype: q('[name="meshtype"]'),
        accountType: q('[name="accountType"]'),
        custAuth: q('[name="custAuth"]'),
        custConcern: q('[name="custConcern"]'),
        srNum: q('[name="srNum"]'),
        contactName: q('[name="contactName"]'),
        cbr: q('[name="cbr"]'),
        availability: q('[name="availability"]'),
        address: q('[name="address"]'),
        landmarks: q('[name="landmarks"]'),
        subject1: q('[name="subject1"]'),
        resolution: q('[name="resolution"]'),
        paymentChannel: q('[name="paymentChannel"]'),
        personnelType: q('[name="personnelType"]'),
        planDetails: q('[name="planDetails"]'),
        ffupStatus: q('[name="ffupStatus"]'),
        queue: q('[name="queue"]'),
        ffupCount: q('[name="ffupCount"]'),
        ticketAge: q('[name="ticketAge"]'),
        findings: q('[name="findings"]'),
        disputeType: q('[name="disputeType"]'),
        approver: q('[name="approver"]'),
        subType: q('[name="subType"]'),
        onuSerialNum: q('[name="onuSerialNum"]'),
        rxPower: q('[name="rxPower"]'),
        affectedTool: q('[name="affectedTool"]'),
        requestType: q('[name="requestType"]'),
        vasProduct: q('[name="vasProduct"]'),
    };
}

// Create the dynamic forms based on the selected intent/WOCAS
function createIntentBasedForm() {
    const selectIntent = document.getElementById("selectIntent");
    const form2Container = document.getElementById("form2Container");

    form2Container.innerHTML = "";

    const selectedValue = selectIntent.value;
    // const caseOriginField = document.getElementById("caseOrigin");

    var form = document.createElement("form");
    form.setAttribute("id", "Form2");

    const selectedOption = selectIntent.options[selectIntent.selectedIndex];
    const lobValue = document.getElementById("lob").value;

    let introText = selectedOption.textContent;

    if (lobValue === "NON-TECH") {
        const optgroupElement = selectedOption.parentElement;

        if (optgroupElement && optgroupElement.tagName === "OPTGROUP") {
            const optgroupLabel = optgroupElement.label;
            introText = `${optgroupLabel} - ${introText}`;
        }
    }

    if (fabMessage) {
        fabMessage.classList.remove("hide");
        stopTyping = false;

        typeWriter(introText, fabMessage, 35);
    }

    const voiceAndDataForms = [
        "form100_1", "form100_2", "form100_3", "form100_4", "form100_5", "form100_6", "form100_7"
    ]

    const voiceForms = [
        "form101_1", "form101_2", "form101_3", "form101_4",
        "form102_1", "form102_2", "form102_3", "form102_4",
        "form102_5", "form102_6", "form102_7",
        "form103_1", "form103_2", "form103_3", "form103_4", "form103_5"
    ];

    const nicForms = [
        "form500_1", "form500_2", "form500_3", "form500_4"
    ];

    const sicForms = [
        "form501_1", "form501_2", "form501_3", "form501_4"
    ];

    const selectiveBrowseForms = [
        "form502_1", "form502_2"
    ];

    const iptvForms = [
        "form510_1", "form510_2", "form510_3", "form510_4", "form510_5", "form510_6", "form510_7", "form510_8",
        "form511_1", "form511_2", "form511_3", "form511_4", "form511_5",
        "form512_1", "form512_2", "form512_3"
    ]

    const mrtForms = [
        "form300_1", "form300_2", "form300_3", "form300_4", "form300_5", "form300_6", "form300_7", "form300_8"
    ];

    const streamAppsForms = [
        "formStrmApps_1", "formStrmApps_2", "formStrmApps_3", "formStrmApps_4", "formStrmApps_5"
    ]

    const alwaysOnForms = [
        "form500_5", "form501_7", "form101_5", "form510_9", "form500_6"
    ]

    const upgradeDowngradeForms = [
        "formReqDowngrade", "formReqUpgrade", "formInqDowngrade", "formInqUpgrade", "formFfupDowngrade", "formFfupUpgrade"
    ];

    // Non-Tech Intents
    if (selectedValue === "formReqBillAdjust" || selectedValue === "formFfupBillAdjust") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Type of Request", type: "select", name: "requestType", options: [
                "", 
                "Rebate Non Service",
                "Rentals - MSF",
                "Rentals - Lionsgate play/Netflix",
                "Rentals - NRC- Cost of Unit/Gadgets",
                "Rentals- Service Connection Charge",
                "Usage - Tolls (UnliFam Call)",
                "Usage - Other Tolls"
            ] },
            { label: "Request Status", type: "select", name: "ffupStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA"
            ]},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Requests or follow-ups related to disputes or rebate processing for charges involving non-service periods, Monthly Service Fees (MSF), Value-Added Services (VAS), and toll usage.";
            ul.appendChild(li);

            div.appendChild(header);
            div.appendChild(ul);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", ""); // cleaner display

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                showFields(["requestType", "remarks", "srNum", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);

                if (selectedValue === "formFfupBillAdjust") {
                    showFields(["ffupStatus"]);
                } else {
                    hideSpecificFields(["ffupStatus"]);
                }
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["requestType", "ffupStatus", "newAddress", "landmarks", "remarks", "srNum"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (selectedValue === "formInqBill") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Type of Inquiry", type: "select", name: "requestType", options: [
                "", 
                "Account Balance",
                "Payment Details",
                "Payment Posting"
            ] },
            { label: "Account Balance for", type: "select", name: "subType", options: [
                "", 
                "Downgrade Fee", 
                "Existing Customer",
                "Modem & Installation Fee",
                "New Connect",
                "Payment Adjustment",
                "Rebate",
                "Refund",
                "SCC (Transfer fee, Reroute, Change Unit)",
                
            ]},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            // { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Billing Inquiries on Payment Details, Payment Posting, and Account Balance";
            ul.appendChild(li);

            div.appendChild(header);
            div.appendChild(ul);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", ""); // cleaner display

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                showFields(["requestType", "remarks", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["requestType", "newAddress", "landmarks", "remarks"]);
            }
            updateToolLabelVisibility();
        });

        const requestType = document.querySelector("[name='requestType']");
        requestType.addEventListener("change", () => {
            resetAllFields(["calloutAttempt", "requestType"]);
            if (requestType.selectedIndex === 1) {
                showFields(["subType"]);
            } else {
                hideSpecificFields(["subType"]);
            }
        });

        updateToolLabelVisibility();

    } else if (selectedValue === "formReqCignalIPTV") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Request Status", type: "select", name: "ffupStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA"
            ]},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Requests or follow-ups related to Cignal/IPTV activation.";
            ul.appendChild(li);

            div.appendChild(header);
            div.appendChild(ul);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", ""); // cleaner display

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                if (selectedValue === "formFfupCignalIPTV") {
                    showFields(["ffupStatus"]);
                } else {
                    hideSpecificFields(["ffupStatus"]);
                }
                showFields(["remarks", "srNum", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["ffupStatus", "remarks", "srNum"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (selectedValue === "formReqSupRetAccNum" || selectedValue === "formReqSupChangeAccNum" || selectedValue === "formFfupChangeOwnership") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Type of Request", type: "select", name: "requestType", options: [
                "", 
                "Straight or Plain Supersedure",
                "Supersedure with Clause"
            ] },
            { label: "Request Status", type: "select", name: "ffupStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA"
            ]},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Requests or follow-ups related to service relocation.";
            ul.appendChild(li);

            const promptHeader = document.createElement("p");
            promptHeader.textContent = "Required Documents";
            promptHeader.className = "checklist-header";

            const promptList = document.createElement("ul");
            promptList.className = "checklist";

            const items = [
                "Signed Affidavit Form by the incoming customer",
                "Signed Service Request Form (SRF) & Subs Declaration ",
                "LOA if the application/request is through an authorized representative ",
                "Valid ID of incoming and outgoing customers"
            ];

            items.forEach(text => {
                const li = document.createElement("li");
                li.textContent = text;
                promptList.appendChild(li);
            });

            // Append everything in order
            div.appendChild(header);
            div.appendChild(ul);
            div.appendChild(promptHeader);
            div.appendChild(promptList);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", ""); // cleaner display

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                if (selectedValue === "formFfupChangeOwnership") {
                    showFields(["ffupStatus"]);
                    hideSpecificFields(["requestType", "newAddress", "landmarks"]);
                } else {
                    showFields(["requestType", "newAddress", "landmarks"]);
                    hideSpecificFields(["ffupStatus"]);
                }
                showFields(["remarks", "srNum", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["ffupStatus", "requestType", "newAddress", "landmarks", "remarks", "srNum"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (selectedValue === "formReqChangeTelNum" || selectedValue === "formInqChangeTelNum" || selectedValue === "formFfupChangeTelNum") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Request Status", type: "select", name: "ffupStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA"
            ]},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Requests, inquiries or follow-ups related to change of telephone number.";
            ul.appendChild(li);

            const promptHeader = document.createElement("p");
            promptHeader.textContent = "Required Documents";
            promptHeader.className = "checklist-header";

            const promptList = document.createElement("ul");
            promptList.className = "checklist";

            const mainItems = [
                "Service Request Form (if required for the feature being requested)",
                "Subscription Certificate (if required for the feature being requested)",
                "For Non-SOR - Refer to ",
                "Signed document should be sent back to proceed with the SO creation"
            ];

            mainItems.forEach((text, index) => {
                const li = document.createElement("li");

                if (index === 2) {
                    li.append(text);

                    const link = document.createElement("a");
                    link.href = "https://pldt365.sharepoint.com/sites/PLDTHome/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FPLDTHome%2FShared%20Documents%2F2026%2FPDF%2F02FEBRUARY%2FWEBFORM%5FHANDLING%5FCHANGE%5FTELEPHONE%5FNUMBER%20%281%29%2Epdf&parent=%2Fsites%2FPLDTHome%2FShared%20Documents%2F2026%2FPDF%2F02FEBRUARY";
                    link.textContent = "PLDT Guidelines in Handling Non-SOR Aftersales Request";
                    link.target = "_blank";

                    li.appendChild(link);
                    li.append(" for the guidelines");
                } else {
                    li.textContent = text;
                }

                if (index === 3) {
                    const subList = document.createElement("ul");

                    const subItems = [
                        "Authorization letter signed by the customer on record",
                        "Valid ID of the customer on record",
                        "Valid ID of the authorized requestor"
                    ];

                    subItems.forEach(subText => {
                        const subLi = document.createElement("li");
                        subLi.textContent = subText;
                        subList.appendChild(subLi);
                    });

                    li.appendChild(subList);
                }

                promptList.appendChild(li);
            });

            // Assemble
            div.appendChild(header);
            div.appendChild(ul);
            div.appendChild(promptHeader);
            div.appendChild(promptList);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", "");

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                if (selectedValue === "formFfupChangeTelNum") {
                    showFields(["ffupStatus"]);
                } else {
                    hideSpecificFields(["ffupStatus"]);
                }
                showFields(["remarks", "srNum", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["ffupStatus", "remarks", "srNum"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (upgradeDowngradeForms.includes(selectedValue)) { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Request Status", type: "select", name: "ffupStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA"
            ]},
            { label: "Current Plan", type: "text", name: "currentPlan"},
            { label: "New Plan", type: "text", name: "newPlan"},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Requests, inquiries or follow-ups related to downgrade/upgrade of plans or services.";
            ul.appendChild(li);

            const promptHeader = document.createElement("p");
            promptHeader.textContent = "Pre-condition";
            promptHeader.className = "checklist-header";

            const promptList = document.createElement("ul");
            promptList.className = "checklist";

            const items = [
                "Account is not under treatment.",
                "Account has no outstanding balance.",
                "No open SO",
                "Not part of Inhibit/Fraud Accounts declared by Fraud Management",
                "Agent is trained and can process requests through CSP."
            ];

            items.forEach(text => {
                const li = document.createElement("li");
                li.textContent = text;
                promptList.appendChild(li);
            });

            // Append everything in order
            div.appendChild(header);
            div.appendChild(ul);
            div.appendChild(promptHeader);
            div.appendChild(promptList);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", ""); // cleaner display

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                if (selectedValue === "formFfupDowngrade" || selectedValue === "formFfupUpgrade") {
                    showFields(["ffupStatus", "srNum"]);
                    hideSpecificFields(["currentPlan", "newPlan"]);
                } else if (selectedValue === "formReqDowngrade" || selectedValue === "formReqUpgrade") {
                    showFields(["currentPlan", "newPlan", "srNum"]);
                    hideSpecificFields(["ffupStatus"]);
                } else {
                    hideSpecificFields(["ffupStatus", "currentPlan", "newPlan", "srNum"]);
                }

                showFields(["remarks", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["ffupStatus", "currentPlan", "newPlan", "remarks", "srNum"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (selectedValue === "formReqInmove") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Request Status", type: "select", name: "ffupStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA"
            ]},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Requests or follow-ups related to In-move transfers";
            ul.appendChild(li);

            const promptHeader = document.createElement("p");
            promptHeader.textContent = "Required Documents";
            promptHeader.className = "checklist-header";

            const promptList = document.createElement("ul");
            promptList.className = "checklist";

            const mainItems = [
                "For SOR – None (Passed Customer Authentication)",
                "For Non-SOR – please click "
            ];

            mainItems.forEach((text, index) => {
                const li = document.createElement("li");

                if (index === 1) {
                    // Text + link
                    li.appendChild(document.createTextNode(text));

                    const link = document.createElement("a");
                    link.href = "https://pldt365.sharepoint.com/sites/PLDTHome/SitePages/PLDT_GUIDELINES_HANDLING_NON_SOR_AFTERSALES_REQUEST.aspx";
                    link.textContent = "HERE";
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";

                    li.appendChild(link);
                    li.appendChild(document.createTextNode(" for the guidelines"));

                    // Sublist
                    const subList = document.createElement("ul");

                    const subItems = [
                        "Service Request Form or Letter of Authorization signed by the customer on record",
                        "Signed Subscription Certificate",
                        "Valid ID of Customer on Record",
                        "Valid ID of the requestor/Non-SOR"
                    ];

                    subItems.forEach(subText => {
                        const subLi = document.createElement("li");
                        subLi.textContent = subText;
                        subList.appendChild(subLi);
                    });

                    li.appendChild(subList);
                } else {
                    li.textContent = text;
                }

                promptList.appendChild(li);
            });

            div.appendChild(header);
            div.appendChild(ul);
            div.appendChild(promptHeader);
            div.appendChild(promptList);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", "");

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                if (selectedValue === "formFfupInmove") {
                    showFields(["ffupStatus"]);
                } else {
                    hideSpecificFields(["ffupStatus"]);
                }
                showFields(["remarks", "srNum", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["ffupStatus", "remarks", "srNum"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (selectedValue === "formCompMisappPay" || selectedValue === "formFfupMisappPay") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Request Status", type: "select", name: "ffupStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA"
            ]},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Complaints or follow-ups related to misapplied payments.";
            ul.appendChild(li);

            const promptHeader = document.createElement("p");
            promptHeader.textContent = "Required Documents";
            promptHeader.className = "checklist-header";

            const promptList = document.createElement("ul");
            promptList.className = "checklist";

            const mainItems = [
                "Proof of payment(Make sure copy is clear & readable indicating account number, payment amount and date of payment):",
                "Signed Letter of Request (LOR) for SOR/Letter of Authorization (LOA) for Non-SOR with one (1) signature.",
                "Valid ID with three (3) specimen signatures.",
                "For Non-SOR - Valid ID of SOR with three (3) specimen signatures and ID of the authorized representative"
            ];

            mainItems.forEach((text, index) => {
                const li = document.createElement("li");
                li.textContent = text;

                if (index === 0) {
                    const subList = document.createElement("ul");

                    const subItems = [
                        "CFSI - collection receipt provided by the CFSI tellers, machine-validated",
                        "Paybox/Other APC - Acknowledgement Receipt",
                        "Banks - A payment slip with machine validation",
                        "Online - A payment confirmation email",
                        "ATM - A copy of the ATM payment slip"
                    ];

                    subItems.forEach(subText => {
                        const subLi = document.createElement("li");
                        subLi.textContent = subText;
                        subList.appendChild(subLi);
                    });

                    li.appendChild(subList);
                }

                promptList.appendChild(li);
            });

            // Assemble
            div.appendChild(header);
            div.appendChild(ul);
            div.appendChild(promptHeader);
            div.appendChild(promptList);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", "");

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                if (selectedValue === "formFfupInmove") {
                    showFields(["ffupStatus"]);
                } else {
                    hideSpecificFields(["ffupStatus"]);
                }
                showFields(["remarks", "srNum", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["ffupStatus", "remarks", "srNum"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (selectedValue === "formCompMistreat") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Personnel Being Reported", type: "select", name: "requestType", options: [
                "", 
                "Delivery Courier Service", 
                "Hotline Agent",
                "Sales Agent",
                "Social Media Agent",
                "SSC Personnel",
                "Technician",
                "Telesales"
            ]},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Complaints filed by subscribers or non-subscribers involving personnel-related concerns.";
            ul.appendChild(li);

            div.appendChild(header);
            div.appendChild(ul);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", ""); // cleaner display

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                showFields(["requestType", "remarks", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["requestType", "remarks"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (selectedValue === "formReqPermaDisco" || selectedValue === "formFfupPermaDisco") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Request Status", type: "select", name: "ffupStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA"
            ]},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Requests or follow-ups related to permanent disconnection.";
            ul.appendChild(li);

            const promptHeader = document.createElement("p");
            promptHeader.textContent = "Required Documents";
            promptHeader.className = "checklist-header";

            const promptList = document.createElement("ul");
            promptList.className = "checklist";

            const mainItems = [
                "Letter of request signed by the authorized signatory / Email request using official Company email domain",
                "Valid ID - Company ID or Government issued ID (if LOR do not contain Company Letterhead or Email Request not from Company Email)"
            ];

            mainItems.forEach((text, index) => {
                const li = document.createElement("li");
                li.textContent = text;
                promptList.appendChild(li);
            });

            // Assemble
            div.appendChild(header);
            div.appendChild(ul);
            div.appendChild(promptHeader);
            div.appendChild(promptList);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", "");

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                if (selectedValue === "formFfupPermaDisco") {
                    showFields(["ffupStatus"]);
                } else {
                    hideSpecificFields(["ffupStatus"]);
                }
                showFields(["remarks", "srNum", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["ffupStatus", "remarks", "srNum"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (selectedValue === "formReqReconnect" || selectedValue === "formFfupReconnect") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Type of Request", type: "select", name: "requestType", options: [
                "", 
                "Reconnection - CK",
                "Reconnection - TD",
                "Reconnection from PD w/in 6 mos"
            ] },
            { label: "Request Status", type: "select", name: "ffupStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA"
            ]},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Requests or follow-ups related to reconnection of service.";
            ul.appendChild(li);

            const promptHeader = document.createElement("p");
            promptHeader.textContent = "Required Documents";
            promptHeader.className = "checklist-header";

            const promptList = document.createElement("ul");
            promptList.className = "checklist";

            const mainItems = [
                "Proof payment (if payment is not posted)",
                "Proof of identification of Reconnection from PD within 6 months."
            ];

            mainItems.forEach((text, index) => {
                const li = document.createElement("li");
                li.textContent = text;
                promptList.appendChild(li);
            });

            // Assemble
            div.appendChild(header);
            div.appendChild(ul);
            div.appendChild(promptHeader);
            div.appendChild(promptList);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", ""); // cleaner display

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                if (selectedValue === "formFfupReconnect") {
                    showFields(["ffupStatus"]);
                } else {
                    hideSpecificFields(["ffupStatus"]);
                }
                showFields(["requestType", "remarks", "srNum", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["ffupStatus", "requestType", "remarks", "srNum"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (selectedValue === "formReqRelocation" || selectedValue === "formFfupReloc") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Request Status", type: "select", name: "ffupStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA"
            ]},
            { label: "Type of Request", type: "select", name: "requestType", options: [
                "", 
                "Cancelled SO - Bypass SO",
                "CID Creation",
                "Relocation - SO Creation"
            ] },
            { label: "New Address", type: "textarea", name: "newAddress"},
            { label: "Landmarks", type: "textarea", name: "landmarks"},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Requests or follow-ups related to service relocation.";
            ul.appendChild(li);

            const promptHeader = document.createElement("p");
            promptHeader.textContent = "Pre-condition";
            promptHeader.className = "checklist-header";

            const promptList = document.createElement("ul");
            promptList.className = "checklist";

            const items = [
                "Account must be active",
                "No outstanding balance",
                "No account treatment",
                "No open SO",
                "Not part of Inhibit/Fraud Accounts declared by Fraud Management"
            ];

            items.forEach(text => {
                const li = document.createElement("li");
                li.textContent = text;
                promptList.appendChild(li);
            });

            // Append everything in order
            div.appendChild(header);
            div.appendChild(ul);
            div.appendChild(promptHeader);
            div.appendChild(promptList);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", ""); // cleaner display

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                if (selectedValue === "formReqRelocation") {
                    showFields(["requestType", "newAddress", "landmarks", ]);
                } else {
                    showFields(["ffupStatus"]);
                }
                showFields(["remarks", "srNum", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["ffupStatus", "requestType", "newAddress", "landmarks", "remarks", "srNum"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (selectedValue === "formReqSpecFeat" || selectedValue === "formInqSpecialFeatures" || selectedValue === "formFfupSpecialFeat") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Special Features", type: "select", name: "requestType", options: [
                "", 
                "DDD",
                "IDD",
                "NDD",
                "Super Bundle",
                "Caller ID Bundle",
                "Others"
            ] },
            { label: "Request Status", type: "select", name: "ffupStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA"
            ]},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Requests, inquiries or follow-ups concerning the activation and proper use of landline special features.";
            ul.appendChild(li);

            const promptHeader = document.createElement("p");
            promptHeader.textContent = "Required Documents";
            promptHeader.className = "checklist-header";

            const promptList = document.createElement("ul");
            promptList.className = "checklist";

            const mainItems = [
                "Service Request Form (if required for the feature being requested)",
                "Subscription Certificate (if required for the feature being requested)",
                "For Non-SOR - Refer to ",
                "Signed document should be sent back to proceed with the SO creation"
            ];

            mainItems.forEach((text, index) => {
                const li = document.createElement("li");

                if (index === 2) {
                    li.append(text);

                    const link = document.createElement("a");
                    link.href = "https://pldt365.sharepoint.com/sites/PLDTHome/Shared%20Documents/Forms/AllItems.aspx?id=%2Fsites%2FPLDTHome%2FShared%20Documents%2F2026%2FPDF%2F02FEBRUARY%2FWEBFORM%5FHANDLING%5FCHANGE%5FTELEPHONE%5FNUMBER%20%281%29%2Epdf&parent=%2Fsites%2FPLDTHome%2FShared%20Documents%2F2026%2FPDF%2F02FEBRUARY";
                    link.textContent = "PLDT Guidelines in Handling Non-SOR Aftersales Request";
                    link.target = "_blank";

                    li.appendChild(link);
                    li.append(" for the guidelines");
                } else {
                    li.textContent = text;
                }

                if (index === 3) {
                    const subList = document.createElement("ul");

                    const subItems = [
                        "Authorization letter signed by the customer on record",
                        "Valid ID of the customer on record",
                        "Valid ID of the authorized requestor"
                    ];

                    subItems.forEach(subText => {
                        const subLi = document.createElement("li");
                        subLi.textContent = subText;
                        subList.appendChild(subLi);
                    });

                    li.appendChild(subList);
                }

                promptList.appendChild(li);
            });

            // Assemble
            div.appendChild(header);
            div.appendChild(ul);
            div.appendChild(promptHeader);
            div.appendChild(promptList);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", ""); // cleaner display

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                if (selectedValue === "formFfupSpecialFeat") {
                    showFields(["ffupStatus"]);
                } else {
                    hideSpecificFields(["ffupStatus"]);
                }
                showFields(["requestType", "remarks", "srNum", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["requestType", "ffupStatus", "newAddress", "landmarks", "remarks", "srNum"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (selectedValue === "formReqTempDisco" || selectedValue === "formFfupTempDisco") { 
        const table = document.createElement("table");

        const fields = [
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "Type of Request", type: "select", name: "requestType", options: [
                "",
                "Early Resumption",
                "Holiday Disconnection",
                "Voluntary Temporary Disconnection"
            ] },
            { label: "Request Status", type: "select", name: "ffupStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA"
            ]},
            { label: "Actions Taken/ Remarks", type: "textarea", name: "remarks", placeholder: "Please input all actions taken, details/information shared, or any additional remarks to assist the customer. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "SO/SR", type: "text", name: "srNum"},
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createDefinitionRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const div = document.createElement("div");
            div.className = "form2DivDefinition";

            const header = document.createElement("p");
            header.textContent = "Definition";
            header.className = "definition-header";

            const ul = document.createElement("ul");
            ul.className = "checklist";

            const li = document.createElement("li");
            li.textContent = "Requests or follow-ups related to Holiday Disconnection/Voluntary Temporary Disconnection.";
            ul.appendChild(li);

            const promptHeader = document.createElement("p");
            promptHeader.textContent = "Pre-condition";
            promptHeader.className = "checklist-header";

            const promptList = document.createElement("ul");
            promptList.className = "checklist";

            const mainItems = [
                "Account must be active.",
                "Account should have no outstanding balance upon request for voluntary temporary disconnection (VTD)."
            ];

            mainItems.forEach((text, index) => {
                const li = document.createElement("li");
                li.textContent = text;

                // Attach sublist to the SECOND item (index 1)
                if (index === 1) {
                    const subList = document.createElement("ul");

                    const subItems = [
                        "If with outstanding balance, the customer will need to settle any outstanding balance first, prior to processing the request and issuance of the suspend order."
                    ];

                    subItems.forEach(subText => {
                        const subLi = document.createElement("li");
                        subLi.textContent = subText;
                        subList.appendChild(subLi);
                    });

                    li.appendChild(subList);
                }

                promptList.appendChild(li);
            });

            div.appendChild(header);
            div.appendChild(ul);
            div.appendChild(promptHeader);
            div.appendChild(promptList);

            td.appendChild(div);
            row.appendChild(td);

            return row;
        }

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "calloutAttempt" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const row = document.createElement("tr");
                row.className = "tool-label-row";
                row.dataset.relatedTo = field.relatedTo;

                const td = document.createElement("td");
                const div = document.createElement("div");

                div.className = "formToolLabel";
                div.textContent = field.label.replace("// ", ""); // cleaner display

                td.appendChild(div);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") 
                        ? 6 
                        : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");
        
        table.appendChild(createDefinitionRow());

        enhancedFields.forEach((field) => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["Generate Notes", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            nontechNotesButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];
        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                if (selectedValue === "formFfupTempDisco") {
                    showFields(["ffupStatus"]);
                } else {
                    hideSpecificFields(["ffupStatus"]);
                }
                showFields(["requestType", "remarks", "srNum", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes"]);
                hideSpecificFields(["requestType", "ffupStatus", "newAddress", "landmarks", "remarks", "srNum"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    }

    // Tech Follow-Up
    else if (selectedValue === "formFfupRepair") { 
        const table = document.createElement("table");

        const fields = [
            // Visual Audit
            { label: "Callout Attempt", type: "select", name: "calloutAttempt", options: [
                "", 
                "1st", 
                "2nd"
            ]},
            { label: "CEP Case Number", type: "number", name: "cepCaseNumber" },
            { label: "Parent Case", type: "number", name: "pcNumber", placeholder: "Leave blank if not applicable" },
            { label: "Status Reason", type: "select", name: "statusReason", options: [
                "", 
                "Awaiting Cignal Resolution", 
                "Dispatched to Field Technician",
                "Dispatched to Field Technician - Re-Open",
                "Escalated to 3rd Party Vendor",
                "Escalated to CCARE CIGNAL SUPPORT",
                "Escalated to CCBO", 
                "Escalated to L2", 
                "Escalated to Network", 
                "Escalated to Network - Re-Open", 
                "TOK No Answer", 
                "TOK Under Observation" ]},
            { label: "Sub Status", type: "select", name: "subStatus", options: [
                "", 
                "Associated with the Parent Case",
                "Disassociated from the Parent Case",
                "Extracted to OFSC",
                "Extracted to SDM",
                "Extracted to SDM - Re-Open",
                "Extraction to OFSC Failed - Fallout",
                "Extraction to OFSC Failed - Retry Limit Exceeded",
                "Extraction to SDM Failed - Fallout",
                "Extraction to SDM Failed - Retry Limit Exceeded",
                "Last Mile Resolved - Confirmed in OFSC",
                "Network Resolved - Awaiting Customer Confirmation",
                "Network Resolved - Last Mile",
                "Non Tech Escalation - Return Ticket",
                "Non Tech Escalation - Return Ticket Last Mile",
                "Not Done - Return Ticket",
                "Not Done - Return Ticket Network Outage" ]},
            { label: "Subject 1", type: "select", name: "subject1", options: [
                "", 
                "Data", 
                "IPTV",
                "Voice",
                "Voice and Data" ]},
            { label: "Queue", type: "select", name: "queue", options: [
                "", 
                "FM POLL", 
                "CCARE OFFBOARD",
                "SDM CHILD",
                "SDM", 
                "FSMG", 
                "OFSC", 
                "PMA", 
                "SYSTEM SUPPORT", 
                "VAS SUPPORT", 
                "CCARE CIGNAL", 
                "L2 RESOLUTION", 
                "Default Entity Queue" ]}, 
            { label: "Auto Ticket (Red Tagging)", type: "select", name: "projRed", options: [
                "", 
                "Yes", 
                "No" ]},
            { label: "Case Status", type: "select", name: "ticketStatus", options: [
                "", 
                "Beyond SLA", 
                "Within SLA" ]},
            // Offer Alternative Services
            { label: "Offer ALS", type: "select", name: "offerALS", options: [
                "", 
                "Offered ALS/Accepted", 
                "Offered ALS/Declined", 
                "Offered ALS/No Confirmation", 
                "Previous Agent Already Offered ALS",
                "Not Applicable" // Tickets beyond 24 hrs but still within the 36 hrs threshold for offering ALS.
            ]},
            { label: "Alternative Services Package Offered", type: "textarea", name: "alsPackOffered", placeholder: "(i.e. 10GB Open Access data, 5GB/day for Youtube, NBA, Cignal and iWantTFC, Unlimited call to Smart/TNT/SUN, Unlimited text to all network and 500MB of data for Viber, Messenger, WhatsApp and Telegram valid for 7 days)" },
            { label: "Effectivity Date", type: "date", name: "effectiveDate" },
            { label: "Nominated Mobile Number", type: "number", name: "nomiMobileNum" },
            { label: "No. of Follow-Up(s)", type: "select", name: "ffupCount", options: ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "Multiple" ]},
            { label: "Case Age (HH:MM)", type: "text", name: "ticketAge" },
            { label: "Notes to Tech/ Actions Taken/ Decline Reason for ALS", type: "textarea", name: "remarks", placeholder: "Ensure that all actions performed in each tool are properly documented. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "Issue Resolved", type: "select", name: "issueResolved", options: [
                "", 
                "Yes", 
                "No"
            ]},

            // CEP Investigation Tagging
            { label: "Investigation 1", type: "select", name: "investigation1", options: [
                "— Modem Light Status —",
                "Normal Status",
                "Blinking/No PON/FIBR/ADSL light",
                "No Internet Light",
                "No LAN light",
                "No Power Light",
                "No VoIP/Tel/Phone Light",
                "No WLAN light",
                "Not Applicable-Copper",
                "Not Applicable-Defective CPE",
                "Red LOS",
                "Unable to provide information"
            ]},
            { label: "Investigation 2", type: "select", name: "investigation2", options: [
                "— NMS Skin Result", 
                "Correct profile at Voice NMS",
                "Correct SG7K profile",
                "Failed RX",
                "Idle Status – FEOL",
                "LOS/Down",
                "No acquired IP address - Native",
                "No or incomplete profile at Voice NMS",
                "No SG7K profile",
                "Not Applicable – InterOp",
                "Not Applicable – NCE/InterOp",
                "Not Applicable – NMS GUI",
                "Not Applicable – Voice only – Fiber",
                "Null Value",
                "Passed RX",
                "Power is Off/Down",
                "Register – Failed Status – FEOL",
                "Up/Active",
                "VLAN configuration issue"                    
            ]},
            { label: "Investigation 3", type: "select", name: "investigation3", options: [
                "— Clearview Reading —",
                "Defective/Faulty ONU",
                "Failed to collect line card information",
                "Fiber cut LCP to NAP",
                "Fiber cut NAP to ONU",
                "Fiber cut OLT to LCP",
                "Fix bad splices",
                "Missing Micro-Filter",
                "Not applicable - Voice issue",
                "No recommended action",
                "Others/Error code",
                "Rogue ONU",
                "Severely Degraded",
                "The ONU appears to be disconnected",
                "The ONU is off",
                "The ONU is out of service",
                "The ONU performance is degraded",
                "Unbalanced Pair",
                "Without line problem detected",
                "Without line problem detected – Link quality degraded",
            ]},
            { label: "Investigation 4", type: "select", name: "investigation4", options: [
                "— Select applicable Investigation 4 —",
                "Aligned Record",
                "Broken/Damaged Modem/ONU",
                "Broken/Damaged STB/SC",
                "Broken/Damaged telset",
                "Cannot Browse",
                "Cannot Browse via Mesh",
                "Cannot Browse via LAN",
                "Cannot Browse via WiFi",
                "Cannot Make Call",
                "Cannot Make/Receive Call",
                "Cannot Reach Specific Website",
                "Cannot Read Smart Card",
                "Cannot Receive Call",
                "Change Set Up Route to Bridge and vice-versa",
                "Change Set Up Route to Bridge and vice-versa – InterOp",
                "Cignal IRN Created – Missing Channel",
                "Cignal IRN Created – No Audio/Video Output",
                "Cignal IRN Created – Poor Audio/Video Quality",
                "Content",
                "Data Bind Port",
                "Defective STB/SC/Accessories/Physical Set Up",
                "Defective Wifi Mesh/Physical Set Up",
                "Fast Busy/ With Recording",
                "Freeze",
                "High Latency",
                "Individual Trouble",
                "IPTV Trouble",
                "Loopback",
                "Misaligned Record",
                "Missing Channel/s",
                "Network Trouble – Cannot Browse",
                "Network Trouble – Cannot Browse via Mesh",
                "Network Trouble – High Latency",
                "Network Trouble – Selective Browsing",
                "Network Trouble – Slow Internet Connection",
                "Network Trouble – Slow/Intermittent Browsing",
                "No Audio/Video Output with Test Channel",
                "No Audio/Video Output without Test Channel",
                "No Ring Back Tone",
                "Node Down",
                "Noisy Line",
                "Out of Sync",
                "Pixelated",
                "Primary Trouble",
                "Recording Error",
                "Redirected to PLDT Sites",
                "Remote Control Issues",
                "Request Modem/ONU GUI Access",
                "Request Modem/ONU GUI Access – InterOp",
                "Secondary Trouble",
                "Slow/Intermittent Browsing",
                "STB not Synched",
                "Too Long to Boot Up",
                "With Historical Alarms",
                "With Ring Back Tone",
                "Without Historical Alarms"
            ] },
            { label: "SLA / ETR", type: "text", name: "sla", placeholder: "Leave blank if not applicable" },
            
            // Special Instructions
            { label: "Contact Person", type: "text", name: "contactName" },
            { label: "Contact Number", type: "number", name: "cbr" },
            { label: "Preferred Date & Time", type: "text", name: "availability" },
            { label: "Address", type: "textarea", name: "address" },
            { label: "Landmarks", type: "textarea", name: "landmarks" },
            { label: "Repeats w/in 30 Days", type: "text", name: "rptCount" },
            { label: "Re-Open Status Reason", type: "textarea", name: "reOpenStatsReason", placeholder: "Indicate the reason for re-opening the ticket (Dispatched to Field Technician - Re-Open or Escalated to Network - Re-Open)." },
            // Callout Details - Primary
            { label: "Primary Number", type: "number", name: "primaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime1" },
            { label: "Message", type: "text", name: "message1" },
            { label: "Result", type: "select", name: "outboundResult1", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Secondary
            { label: "Secondary Number", type: "text", name: "secondaryNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime2" },
            { label: "Message", type: "text", name: "message2" },
            { label: "Result", type: "select", name: "outboundResult2", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            // Landline
            { label: "Landline Number", type: "number", name: "landlineNumber" },
            { label: "Arrival Time", type: "text", name: "arrivalTime3" },
            { label: "Message", type: "text", name: "message3" },
            { label: "Result", type: "select", name: "outboundResult3", options: [
                "", 
                "Answered",
                "No Answer",
                "Unattended"
            ] },
            { label: "Outbound Result", type: "select", name: "outboundResult4", options: [
                "", 
                "Successful",
                "Unsuccessful"
            ] },
            { label: "Outbound Notes", type: "textarea", name: "obNotes", placeholder: "Enter any additional notes here." },
        ];

        function createInstructionsRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const instructionsDiv = document.createElement("div");
            instructionsDiv.className = "form2DivInstructions"; 

            const header = document.createElement("p");
            header.textContent = "Reference Link";
            header.className = "instructions-header";
            instructionsDiv.appendChild(header);

            const ul = document.createElement("ul");
            ul.className = "instructions-list";

            const li5 = document.createElement("li");
            li5.textContent = "See ";

            const link = document.createElement("a");

            let url = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url = "https://pldt365.sharepoint.com/sites/LIT365/PLDT_INTERACTIVE_TROUBLESHOOTING_GUIDE/Pages/FOLLOW_UP_REPAIR.aspx?csf=1&web=1&e=NDfTRV";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url = "https://pldt365.sharepoint.com/sites/LIT365/files/2023Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F07JULY%2FPLDT%5FWI%2FSOCMED%5FGENUINE%5FREPAIR%5FFFUP%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2023Advisories%2F07JULY%2FPLDT%5FWI";
            }

            link.textContent = "Handling of Repair Follow-up";
            link.style.color = "lightblue";
            link.href = "#";

            link.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li5.appendChild(link);
            li5.appendChild(document.createTextNode(" for detailed work instructions."));
            ul.appendChild(li5);

            instructionsDiv.appendChild(ul);

            td.appendChild(instructionsDiv);
            row.appendChild(td);

            return row;
        }

        function insertNoteRow(fields, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName) + 1,
                0,
                {
                    type: "noteRow",
                    name: "defaultEntityQueue",
                    relatedTo: relatedFieldName
                }
            );
        }      

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Visual Audit", "cepCaseNumber");
        insertNoteRow(enhancedFields, "queue");
        insertToolLabel(enhancedFields, "Alternative Services", "offerALS");
        insertToolLabel(enhancedFields, "CEP Investigation Tagging", "investigation1");
        insertToolLabel(enhancedFields, "Special Instructions", "contactName");
        insertToolLabel(enhancedFields, "Primary Contact", "primaryNumber");
        insertToolLabel(enhancedFields, "Secondary Contact", "secondaryNumber");
        insertToolLabel(enhancedFields, "Landline", "landlineNumber");
        insertToolLabel(enhancedFields, "------------------------------------------------------------------", "outboundResult4");

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = (field.name === "calloutAttempt") ? "table-row" : "none";

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}:`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "noteRow") {
                const row = document.createElement("tr");
                row.classList.add("note-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const checklistDiv = document.createElement("div");
                checklistDiv.className = "form2DivPrompt";

                const req = document.createElement("p");
                req.textContent = "Note:";
                req.className = "note-header";
                checklistDiv.appendChild(req);

                const ulReq = document.createElement("ul");
                ulReq.className = "note";

                const li1 = document.createElement("li");
                li1.textContent = "Delete investigation 1 to 4 value and click Save.";
                ulReq.appendChild(li1);

                const li2 = document.createElement("li");
                li2.textContent = "Utilize the appropriate tools. Handle customer concern based on What Our Customers Are Saying (WOCAS) and update details of Investigation 1-4.";
                ulReq.appendChild(li2);

                checklistDiv.appendChild(ulReq);
                td.appendChild(checklistDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "toolLabel") {
                const toolLabelRow = document.createElement("tr");
                toolLabelRow.classList.add("tool-label-row");
                toolLabelRow.dataset.relatedTo = field.relatedTo;
                toolLabelRow.style.display = "none";

                const td = document.createElement("td");
                const div = document.createElement("div");
                div.className = "formToolLabel";
                div.textContent = field.label.replace(/^\/\/\s*/, "");

                td.appendChild(div);
                toolLabelRow.appendChild(td);
                return toolLabelRow;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach(optionText => {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;
                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows =
                    (field.name === "remarks") ? 5 :
                    (field.name === "alsPackOffered") ? 4 :
                    (field.name === "reOpenStatsReason") ? 3 :
                    2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;

                if (field.type === "date" && input.showPicker) {
                    input.addEventListener("focus", () => input.showPicker());
                    input.addEventListener("click", () => input.showPicker());
                }
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        table.appendChild(createInstructionsRow()); 
        enhancedFields.forEach(field => table.appendChild(createFieldRow(field)));

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row, .esca-checklist-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["CEP", "SF/FUSE", "Endorse", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            ffupButtonHandler, 
            techNotesButtonHandler,
            endorsementForm,
            saveFormData,
            resetButtonHandler,
        ];

        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const calloutAttempt = document.querySelector("[name='calloutAttempt']");
        calloutAttempt.addEventListener("change", () => {
            resetAllFields(["calloutAttempt"]);
            if (calloutAttempt.selectedIndex === 1) {
                showFields(["cepCaseNumber", "pcNumber", "subject1", "subject2", "queue", "statusReason", "subStatus" ]);
                hideSpecificFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes" ]);
            } else {
                showFields(["primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes" ]);
                hideSpecificFields(["cepCaseNumber", "pcNumber", "subject1", "subject2", "queue", "statusReason", "subStatus"]);
            }
            updateToolLabelVisibility();
        });
        
        const queue = document.querySelector("[name='queue']");
        queue.addEventListener("change", () => {
            resetAllFields(["calloutAttempt", "subject1", "statusReason","subStatus", "queue"]);
            if (queue.value === "FM POLL" || queue.value === "CCARE OFFBOARD") {
                showFields(["ticketStatus", "ffupCount", "ticketAge", "remarks", "issueResolved", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes" ]);
                hideSpecificFields(["projRed", "offerALS", "alsPackOffered", "effectiveDate", "nomiMobileNum", "investigation1", "investigation2", "investigation3", "investigation4", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "reOpenStatsReason" ]);

                updateToolLabelVisibility();

            }else if (queue.value === "Default Entity Queue") {
                showFields(["ffupCount", "ticketAge", "remarks", "issueResolved", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes" ]);
                hideSpecificFields(["projRed", "ticketStatus", "offerALS", "alsPackOffered", "effectiveDate", "nomiMobileNum", "investigation1", "investigation2", "investigation3", "investigation4", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "reOpenStatsReason" ]);

                updateToolLabelVisibility();

            } else {
                showFields(["projRed" ]);
                hideSpecificFields(["ticketStatus", "offerALS", "alsPackOffered", "effectiveDate", "nomiMobileNum", "ffupCount", "ticketAge", "remarks", "issueResolved", "investigation1", "investigation2", "investigation3", "investigation4", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "reOpenStatsReason", "upsell", "productsOffered", "declineReason", "notEligibleReason", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes" ]);

                updateToolLabelVisibility();
            }

            updateToolLabelVisibility();

            const noteRow = document.querySelector(".note-row[data-related-to='queue']");
            if (queue.value === "Default Entity Queue") {
                if (noteRow) noteRow.style.display = "table-row";
            } else {
                if (noteRow) noteRow.style.display = "none";
            }
        });

        const projRed = document.querySelector("[name='projRed']");
        projRed.addEventListener("change", () => {
            resetAllFields(["calloutAttempt", "subject1", "statusReason","subStatus", "queue", "projRed"]);
            if (projRed.value === "Yes") {
                if (queue.value === "SDM CHILD" || queue.value ==="SDM" || queue.value ==="FSMG" || queue.value ==="L2 RESOLUTION" ) {
                    showFields(["ticketStatus", "ffupCount", "ticketAge", "remarks", "sla", "contactName", "cbr", "rptCount", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes" ]);
                    hideSpecificFields(["offerALS", "alsPackOffered", "effectiveDate", "nomiMobileNum", "issueResolved", "investigation1", "investigation2", "investigation3", "investigation4", "availability", "address", "landmarks", "reOpenStatsReason" ]);
                } else {
                    showFields(["ticketStatus", "ffupCount", "ticketAge", "remarks", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes" ]);
                    hideSpecificFields(["offerALS", "alsPackOffered", "effectiveDate", "nomiMobileNum", "issueResolved", "investigation1", "investigation2", "investigation3", "investigation4", "reOpenStatsReason" ]);
                }

                updateToolLabelVisibility();

            } else if (projRed.value === "No"){
                showFields(["ticketStatus", "ffupCount", "ticketAge", "remarks", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes" ]);
                hideSpecificFields(["offerALS", "alsPackOffered", "effectiveDate", "nomiMobileNum", "issueResolved", "investigation1", "investigation2", "investigation3", "investigation4", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "reOpenStatsReason" ]);

                updateToolLabelVisibility();

            } else {
                hideSpecificFields(["ticketStatus", "offerALS", "alsPackOffered", "effectiveDate", "nomiMobileNum", "ffupCount", "ticketAge", "remarks", "issueResolved", "investigation1", "investigation2", "investigation3", "investigation4", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "reOpenStatsReason", "primaryNumber", "arrivalTime1", "message1", "outboundResult1", "secondaryNumber", "arrivalTime2", "message2", "outboundResult2", "landlineNumber", "arrivalTime3", "message3", "outboundResult3", "outboundResult4", "obNotes" ]);

                updateToolLabelVisibility();
            }
            updateToolLabelVisibility();
        });

        const ticketStatus = document.querySelector("[name='ticketStatus']");
        ticketStatus.addEventListener("change", () => {
            if (ticketStatus.value === "Beyond SLA") {
                showFields(["offerALS" ]);
                updateToolLabelVisibility();
            } else {
                hideSpecificFields(["offerALS", "alsPackOffered", "effectiveDate", "nomiMobileNum" ]);
                updateToolLabelVisibility();
            }
            updateToolLabelVisibility();
        });

        const offerALS = document.querySelector("[name='offerALS']");
        offerALS.addEventListener("change", () => {
            if (offerALS.value === "Offered ALS/Accepted") {
                showFields(["alsPackOffered", "effectiveDate", "nomiMobileNum" ]);
            } else if (offerALS.value === "Offered ALS/Declined") {
                showFields(["alsPackOffered" ]);
                hideSpecificFields(["effectiveDate", "nomiMobileNum" ]);
            } else {
                hideSpecificFields(["alsPackOffered", "effectiveDate", "nomiMobileNum" ]);
            }
        });

        const issueResolved = document.querySelector("[name='issueResolved']");
        issueResolved.addEventListener("change", () => {
            if (issueResolved.value === "No") {
                showFields(["investigation1", "investigation2", "investigation3", "investigation4", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "reOpenStatsReason" ]);
                updateToolLabelVisibility();
            } else {
                hideSpecificFields(["investigation1", "investigation2", "investigation3", "investigation4", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "reOpenStatsReason" ]);
                updateToolLabelVisibility();
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } 

    // Tech Complaints
    else if (voiceAndDataForms.includes(selectedValue)) { 
        
        const table = document.createElement("table");

        const fields = [
            // Visual Audit
            { label: "Account/Facility Type", type: "select", name: "facility", options: [
                "", 
                "Fiber", 
                "Fiber - Radius", 
                "Copper VDSL", 
                "Copper HDSL/NGN" 
            ]},
            { label: "Res. Vertical Address", type: "select", name: "resType", options: [
                "Bldg., Condo, etc.", 
                "Yes", 
                "No"
            ]},
            { label: "Network Outage", type: "select", name: "outageStatus", options: ["", "Yes", "No"] },
            { label: "Source Reference", type: "select", name: "outageReference", options: [
                "— Network Outage Source —", 
                "FUSE Outage Tab", 
                "Lit365 Downtime Advisory",
                "Clearview",
                "CEP Affected Services Tab"
            ]},
            { label: "Parent Case", type: "text", name: "pcNumber", placeholder: "Leave blank if Awaiting Parent Case" },
            { label: "Modem/ONU Serial # (L2)", type: "text", name: "onuSerialNum", placeholder: "Available in FUSE/CV/DMS."},
            { label: "Modem Lights Status", type: "select", name: "modemLights", options: [
                "", 
                "Red Power Light", 
                "No Power Light",
                "PON Light Blinking",
                "Red LOS",
                "NO LOS light / Power and PON Lights Steady Green"
            ]},
            // BSMP/Clearview
            { label: "SMP/Clearview Reading", type: "textarea", name: "cvReading", placeholder: "e.g. Line Problem Detected - OLT to LCP, LCP to NAP, NAP to ONU" },
            { label: "Latest RTA Request (L2)", type: "text", name: "rtaRequest"},
            // NMS Skin
            { label: "ONU Status/RUNSTAT", type: "select", name: "onuRunStats", options: [
                "", 
                "UP",
                "Active",
                "LOS",
                "Down",
                "Power is Off",
                "Power is Down",
                "/N/A"
            ]},
            { label: "RX Power", type: "number", name: "rxPower", step: "any"},
            { label: "VLAN (L2)", type: "text", name: "vlan"},
            { label: "Option82 Config", type: "select", name: "option82Config", options: [
                "", 
                "Aligned", 
                "Misaligned"
            ]},
            { label: "Actions Taken in NMS Skin", type: "textarea", name: "nmsSkinRemarks", placeholder: "Include the RA and DC action results here. If no action was taken, leave this field blank." },
            { label: "Actual Experience (L2)", type: "textarea", name: "actualExp", placeholder: "Please input the customer's actual experience in detail.\ne.g. “NDT-NIC with red LOS” DO NOT input the WOCAS!"},
            { label: "Other Actions Taken/ Troubleshooting/ Remarks", type: "textarea", name: "remarks", placeholder: "Ensure that all actions performed in each tool are properly documented. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "Issue Resolved? (Y/N)", type: "select", name: "issueResolved", options: [
                "", 
                "Yes", 
                "No - for Ticket Creation",
                "No - Customer is Unresponsive",
                "No - Customer is Not At Home",
                "No - Customer Declined Further Assistance",
                "No - System Ended Chat"
            ] },
            { label: "FLM Findings / Resolution", type: "select", name: "resolution", options: [
                "",
                "Defective Modem / Missing Modem",
                "Defective Splitter / Defective Microfilter",
                "LOS",
                "Manual Troubleshooting",
                "NMS Refresh / Configuration",
                "No Configuration / Wrong Configuration",
                "No PON Light",
                "Self-Restored",
                "Network / Outage",
                "Zone"
            ]},
            // CEP Investigation Tagging
            { label: "Investigation 1", type: "select", name: "investigation1", options: [
                "— Modem Light Status —",
                "Red LOS",
                "Blinking/No PON/FIBR/ADSL",
                "Normal Status",
                "No Power Light",
                "Not Applicable [Copper]",
                "Not Applicable [Defective CPE]",
                "Not Applicable [via Store]",
                "Unable to provide information"
            ]},
            { label: "Investigation 2", type: "select", name: "investigation2", options: [
                "— NMS: ONU Status/RUNSTAT —", 
                "UP/Active", 
                "LOS/Down", 
                "Power is Off/Down", 
                "Null Value",
                "Not Applicable [via Store]",
                "Not Applicable [NMS GUI]",
                "Passed RX",
                "Failed RX"
            ]},
            { label: "Investigation 3", type: "select", name: "investigation3", options: [
                "— Clearview Reading —",
                "Defective/Faulty ONU",
                "Failed to collect line card information", 
                "Fibercut LCP to NAP", 
                "Fibercut NAP to ONU", 
                "Fibercut OLT to LCP", 
                "Fix bad splices",
                "No recommended action", 
                "Not Applicable",
                "Others/Error Code", 
                "The ONU appears to be disconnected", 
                "The ONU is OFF", 
                "The ONU is out of service", 
                "The ONU performance is degraded",
                "Without Line Problem Detected", 
            ]},
            { label: "Investigation 4", type: "select", name: "investigation4", options: [
                "— Select applicable Investigation 4 —",
                "Aligned Record", 
                "Awaiting Parent Case", 
                "Broken/Damaged Modem/ONU", 
                "Cannot Browse",
                "Cannot Browse via Mesh",
                "Cannot Connect via LAN",
                "Cannot Connect via WiFi",
		        "Data Bind Port",
                "FCR - Cannot Browse", 
                "FCR - Cannot Connect via LAN", 
                "FCR - Cannot Connect via WiFi", 
                "FCR - Device - Advised Physical Set-Up",
                "FCR - Low BW profile",
                "FCR - Slow/Intermittent Browsing",
                "Individual Trouble", 
                "Misaligned Record",
                "Network Trouble - Cannot Browse",
                "Network Trouble - Cannot Browse via Mesh",
                "Node Down",
                "Not Applicable [via Store]",
                "Redirected to PLDT Sites",
                "Node Down", 
                "Not Applicable [via Store]", 
                "Primary Trouble", 
                "Secondary Trouble"
            ] },
            // Ticket Details
            { label: "CEP Case Number", type: "number", name: "cepCaseNumber" },
            { label: "SLA / ETR", type: "text", name: "sla" },
            // Special Instructions
            { label: "Contact Person", type: "text", name: "contactName" },
            { label: "Contact Number", type: "number", name: "cbr" },
            { label: "Preferred Date & Time", type: "text", name: "availability" },
            { label: "Address", type: "textarea", name: "address" },
            { label: "Landmarks", type: "textarea", name: "landmarks" },
            { label: "Repeats w/in 30 Days", type: "text", name: "rptCount" },
            // Cross-Sell/Upsell
            { label: "Upsell", type: "select", name: "upsell", options: [
                "", 
                "Yes - Accepted", 
                "Yes - Pending Req. (For callback)",
                "No - Declined",
                "No - Ignored",
                "NA - Not Eligible"
            ]},
            { label: "Product/Services Offered", type: "select", name: "productsOffered", options: [
                "", 
                "Always On"
            ]},
            { label: "Decline Reason", type: "select", name: "declineReason", options: [
                "", 
                "Cannot decide at the moment", 
                "Contract terms concerns", 
                "Disconnected Call/Chat", 
                "Financial constraints", 
                "Lack of confidence in the offer", 
                "Lack of trust in the offer", 
                "Needs time to think it over", 
                "Negative past experience", 
                "No perceived need or benefit",
                "Not authorized", 
                "Not interested at this time", 
                "Price too high", 
                "Product difficulty to use", 
                "Satisfied with current plan", 
                "Satisfied with current service", 
                "Service difficulty to use", 
                "Service reliability concerns"
            ]},
            { label: "Not Eligible Reason", type: "select", name: "notEligibleReason", options: [
                "", 
                // "Account has pending issues", 
                // "Account is barred", 
                // "Account is inhibited", 
                // "Account is not yet active", 
                // "Account is restricted",
                "Customer already availed the product", 
                "Customer already availed the service", 
                "Customer already upgraded their plan", 
                "Customer is in a hurry", 
                "Customer is irate", 
                "Customer is requesting a supervisor", 
                "Customer is requesting a manager", 
                "Customer is requesting to downgrade", 
                "Disconnection concerns", 
                "LOB is not applicable", 
                "Microbusiness Account", 
                "Plan not eligible for upsell", 
                "Poor LTE signal strength in the area", 
                "Poor payment history", 
                "Potential crisis", 
                "Prepaid Fiber",
                "Technical incompatibility", 
                "Temporary Disconnection concerns",
                "Time is limited",
                "Unresolved AFTERSALES complaints", 
                "Unresolved AFTERSALES concerns", 
                "VTD concerns"
            ]},
        ];

        function createInstructionsRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const instructionsDiv = document.createElement("div");
            instructionsDiv.className = "form2DivInstructions"; 

            const header = document.createElement("p");
            header.textContent = "Reference Link";
            header.className = "instructions-header";
            instructionsDiv.appendChild(header);

            const ul = document.createElement("ul");
            ul.className = "instructions-list";

            const li5 = document.createElement("li");
            li5.textContent = "See ";

            const link1 = document.createElement("a");

            let url1 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            }

            link1.textContent = "CEP: Troubleshooting Guide";
            link1.style.color = "lightblue";
            link1.href = "#";

            link1.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url1, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li5.appendChild(link1);
            li5.appendChild(document.createTextNode(" for Main PLDT Repair Work Instruction"));
            ul.appendChild(li5);

            const li6 = document.createElement("li");
            li6.textContent = "See ";

            const link2 = document.createElement("a");

            let url2 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            }

            link2.textContent = "Gamma: Troubleshooting Guide";
            link2.style.color = "lightblue";
            link2.href = "#";

            link2.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url2, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li6.appendChild(link2);
            li6.appendChild(document.createTextNode(" for Main Gamma Repair Work Instruction"));
            ul.appendChild(li6);

            instructionsDiv.appendChild(ul);

            td.appendChild(instructionsDiv);
            row.appendChild(td);

            return row;
        }
                    
        function insertNoteRow(fields, toolLabelName) {
            const index = fields.findIndex(f => f.name === toolLabelName);
            if (index !== -1) {
                fields.splice(index + 1, 0, {
                    type: "noteRow",
                    name: "onuStatChecklist",
                    relatedTo: "onuRunStats"
                });
            }
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        function insertEscaChecklistRow(fields, relatedFieldName) {
            const index = fields.findIndex(f => f.name === relatedFieldName);
            if (index !== -1) {
                fields.splice(index, 0, {
                    type: "escaChecklistRow",
                    name: "escaChecklist",
                    relatedTo: relatedFieldName
                });
            }
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Visual Audit", "facility");
        insertEscaChecklistRow(enhancedFields, "outageStatus");
        insertToolLabel(enhancedFields, "NMS Skin", "onuRunStats");
        insertNoteRow(enhancedFields, "toolLabel-nms-skin");      
        insertToolLabel(enhancedFields, "BSMP/Clearview", "cvReading");
        insertToolLabel(enhancedFields, "Probe & Troubleshoot", "actualExp");
        insertToolLabel(enhancedFields, "CEP Investigation Tagging", "investigation1");
        insertToolLabel(enhancedFields, "Ticket Details", "cepCaseNumber");
        insertToolLabel(enhancedFields, "Special Instructions", "contactName");
        insertToolLabel(enhancedFields, "Cross-Sell/Upsell", "upsell");
        

        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "facility" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "noteRow") {
                const row = document.createElement("tr");
                row.classList.add("note-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const noteDiv = document.createElement("div");
                noteDiv.className = "form2DivPrompt";

                const note = document.createElement("p");
                note.textContent = "Note:";
                note.className = "note-header";
                noteDiv.appendChild(note);

                const ulNote = document.createElement("ul");
                ulNote.className = "note";

                const li1 = document.createElement("li");
                li1.textContent = "Check Option82 configuration in NMS Skin (BMSP, SAAA and EAAA), Clearview, CEP, and FUSE.";
                ulNote.appendChild(li1);

                const li2 = document.createElement("li");
                li2.textContent = "If NMS Skin result (ONU Status/RunStat) is “-/N/A” (null value), select “LOS/Down” for Investigation 2.";
                ulNote.appendChild(li2);

                const li3 = document.createElement("li");
                li3.textContent = "If NMS Skin result (ONU Status/RunStat) is unavailable, use DMS (Device status > Online status) section.";
                const nestedUl = document.createElement("ul");
                ["Check Mark = Up/Active", "X Mark = LOS/Down"].forEach(text => {
                    const li = document.createElement("li");
                    li.textContent = text;
                    nestedUl.appendChild(li);
                });
                li3.appendChild(nestedUl);
                ulNote.appendChild(li3);

                const li4 = document.createElement("li");
                li4.textContent = "If NMS Skin and DMS is unavailable, select “LOS/Down” for Investigation 2 and notate “NMS Skin and DMS result unavailable” at Case Notes in Timeline.";
                ulNote.appendChild(li4);

                const li5 = document.createElement("li");
                li5.textContent = "Any misalignment observed in Clearview, NMS Skin (BSMP, EAAA, or SAAA), or CEP MUST be documented in the “Remarks” field to avoid misdiagnosis.";
                ulNote.appendChild(li5);

                noteDiv.appendChild(ulNote);
                td.appendChild(noteDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "escaChecklistRow") {
                const row = document.createElement("tr");
                row.classList.add("esca-checklist-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const checklistDiv = document.createElement("div");
                checklistDiv.className = "form2DivPrompt";

                const checklistHeader = document.createElement("p");
                checklistHeader.textContent = "L2/Zone/Network Escalation Checklist:";
                checklistHeader.className = "esca-checklist-header";
                checklistDiv.appendChild(checklistHeader);

                const ulChecklist = document.createElement("ul");
                ulChecklist.className = "esca-checklist";

                const li6 = document.createElement("li");
                li6.textContent = "Network Downtime Checking";
                ulChecklist.appendChild(li6);

                const li7 = document.createElement("li");
                li7.textContent = "Power Light Checking";
                ulChecklist.appendChild(li7);

                const li8 = document.createElement("li");
                li8.textContent = "PON Light Checking";
                ulChecklist.appendChild(li8);

                const li9 = document.createElement("li");
                li9.textContent = "LOS Light Checking";
                ulChecklist.appendChild(li9);

                const li10 = document.createElement("li");
                li10.textContent = "NMS Skin Result";
                ulChecklist.appendChild(li10);

                const li11 = document.createElement("li");
                li11.textContent = "Clear View Result";
                ulChecklist.appendChild(li11);

                const li12 = document.createElement("li");
                li12.textContent = "Option 82 Alignment Checking";
                ulChecklist.appendChild(li12);

                const li13 = document.createElement("li");
                li13.textContent = "Fiber Optic Cable / Patchcord Checking";
                ulChecklist.appendChild(li13);

                checklistDiv.appendChild(ulChecklist);

                const checklistInstruction = document.createElement("p");
                checklistInstruction.textContent = "Note: It is not necessary to complete every item in this escalation checklist. Refer to the LIT365 work instructions for proper guidance.\n\nMaintain clear and detailed documentation to prevent potential misdiagnosis.";
                checklistInstruction.className = "esca-checklist-instruction";
                checklistDiv.appendChild(checklistInstruction);

                td.appendChild(checklistDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "toolLabel") {
                const toolLabelRow = document.createElement("tr");
                toolLabelRow.classList.add("tool-label-row");
                toolLabelRow.dataset.relatedTo = field.relatedTo;
                toolLabelRow.style.display = "none";

                const td = document.createElement("td");
                const div = document.createElement("div");
                div.className = "formToolLabel";
                div.textContent = field.label.replace(/^\/\/\s*/, "");

                td.appendChild(div);
                toolLabelRow.appendChild(td);
                return toolLabelRow;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                if (field.name === "onuRunStats") {
                    input.id = field.name;
                }
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") ? 5 : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        table.appendChild(createInstructionsRow()); 
        enhancedFields.forEach(field => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row, .note-row, .esca-checklist-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["CEP", "SF/FUSE", "Endorse", "SF Tagging", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            ffupButtonHandler, 
            techNotesButtonHandler, 
            endorsementForm, 
            sfTaggingButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];

        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const facility = document.querySelector("[name='facility']");
        facility.addEventListener("change", () => {
            resetAllFields(["facility"]);
            if (facility.value === "Fiber") {
                if (selectedValue === "form100_1" || selectedValue === "form100_2" || selectedValue === "form100_3") {
                    showFields(["outageStatus"]);
                    hideSpecificFields(["resType", "outageReference", "pcNumber", "onuSerialNum", "modemLights", "option82Config", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "actualExp", "remarks", "issueResolved", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                } else if (selectedValue === "form100_4" || selectedValue === "form100_5") {
                    showFields(["onuSerialNum", "modemLights", "actualExp", "remarks", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                    hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "option82Config", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "issueResolved", "productsOffered", "declineReason", "notEligibleReason"]);

                    if (caseOriginField.value === "CDT-SOCMED") {
                        showFields(["resolution"]);
                    } else {
                        hideSpecificFields(["resolution"]);
                    }
                } else {
                    showFields(["onuSerialNum", "modemLights", "remarks", "issueResolved"]);
                    hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "option82Config", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "actualExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                }
            } else if (facility.value === "Fiber - Radius") {
                if (selectedValue === "form100_1" || selectedValue === "form100_2" || selectedValue === "form100_3") {
                    showFields(["remarks", "issueResolved"]);
                    hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "option82Config", "modemLights", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "actualExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                } else if (selectedValue === "form100_4" || selectedValue === "form100_5") {
                    showFields(["remarks", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                    hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "option82Config", "modemLights", "onuRunStats", "rxPower", "vlan", "cvReading", "rtaRequest", "actualExp", "issueResolved", "productsOffered", "declineReason", "notEligibleReason"]);

                    if (caseOriginField.value === "CDT-SOCMED") {
                        showFields(["resolution"]);
                    } else {
                        hideSpecificFields(["resolution"]);
                    }
                } else {
                    showAlert("This form is currently unavailable for customers with Fiber - Radius service.");
                    hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "option82Config", "modemLights", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "investigation1", "investigation2", "investigation3", "investigation4", "actualExp", "remarks", "resolution", "issueResolved", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);

                    const facilityField = document.querySelector('[name="facility"]');
                    if (facilityField) facilityField.value = "";
                    return;
                }
            } else if (facility.value === "Copper VDSL") {
                showFields(["resType"]);
                hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "onuSerialNum", "option82Config", "modemLights", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "investigation1", "investigation2", "investigation3", "investigation4", "actualExp", "remarks", "resolution", "issueResolved", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
            } else {
                showFields(["remarks"]);
                hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "option82Config", "modemLights", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "investigation1", "investigation2", "investigation3", "investigation4", "actualExp", "remarks", "issueResolved", "resolution", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
            }
            updateToolLabelVisibility();
        });
    
        const resType = document.querySelector("[name='resType']");
        resType.addEventListener("change", () => {
            resetAllFields(["facility", "resType"]);
            if (resType.value === "Yes") {
                if (selectedValue === "form100_1" || selectedValue === "form100_2" || selectedValue === "form100_3") {
                    showFields(["outageStatus"]);
                    hideSpecificFields(["outageReference", "pcNumber", "onuSerialNum", "option82Config", "modemLights", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "actualExp", "remarks", "issueResolved", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                } else if (selectedValue === "form100_4" || selectedValue === "form100_5") {
                    showFields(["remarks", "issueResolved"]);
                    hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "onuSerialNum", "option82Config", "modemLights", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "actualExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                } else {
                    showAlert("This form is currently unavailable for customers with Fiber - DSL service.");
                    hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "onuSerialNum", "option82Config", "modemLights", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "investigation1", "investigation2", "investigation3", "investigation4", "actualExp", "remarks", "resolution", "issueResolved", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);

                    const resTypeField = document.querySelector('[name="resType"]');
                    if (resTypeField) resTypeField.value = "";
                    return;
                }
            } else {
                showFields(["remarks"]);
                hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "onuSerialNum", "option82Config", "modemLights", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "investigation1", "investigation2", "investigation3", "investigation4", "actualExp", "resolution", "issueResolved", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
            }
            updateToolLabelVisibility();
        });
    
        const outageStatus = document.querySelector("[name='outageStatus']");
        outageStatus.addEventListener("change", () => {
            resetAllFields(["facility", "resType", "outageStatus"]);
            if (outageStatus.value === "Yes") {
                showFields(["outageReference", "pcNumber", "remarks", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "rptCount", "upsell"]);
                hideSpecificFields(["onuSerialNum", "option82Config", "modemLights", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "actualExp", "issueResolved", "availability", "address", "landmarks", "productsOffered", "declineReason", "notEligibleReason"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            } else {
                if (facility.value === "Fiber") {
                    showFields(["onuSerialNum", "modemLights", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "cvReading", "rtaRequest", "actualExp", "remarks", "issueResolved"]);
                    hideSpecificFields(["outageReference", "pcNumber", "option82Config", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                } else {
                    showFields(["onuSerialNum", "modemLights", "cvReading", "rtaRequest", "remarks", "issueResolved"]);
                    hideSpecificFields(["outageReference", "pcNumber", "onuRunStats", "rxPower", "vlan", "nmsSkinRemarks", "option82Config", "actualExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                }
                
            }
            updateToolLabelVisibility();
        });

        const onuRunStats = document.querySelector("[name='onuRunStats']");
        onuRunStats.addEventListener("change", () => {
            if (onuRunStats.value === "UP" || onuRunStats.value === "Active") {
                showFields(["option82Config"]);
            } else {
                hideSpecificFields(["option82Config"]);
            }
            updateToolLabelVisibility();
        });
    
        const issueResolved = document.querySelector("[name='issueResolved']");
        issueResolved.addEventListener("change", () => {
            if (issueResolved.selectedIndex === 2) {
                showFields(["resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            } else {
                showFields(["upsell"]);
                hideSpecificFields(["investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount"]);
            }

            if (caseOriginField.value === "CDT-SOCMED") {
                showFields(["resolution"]);
            } else {
                hideSpecificFields(["resolution"]);
            }
            updateToolLabelVisibility();
        });

        const upsell = document.querySelector("[name='upsell']");
        upsell.addEventListener("change", () => {

            showFields(["productsOffered"]);
            if (upsell.selectedIndex === 1 || upsell.selectedIndex === 2) {
                hideSpecificFields(["declineReason", "notEligibleReason"]);
            } else if (upsell.selectedIndex === 3) {
                showFields(["declineReason"]);
                hideSpecificFields(["notEligibleReason"]);
            } else if (upsell.selectedIndex === 4) {
                hideSpecificFields(["declineReason", "notEligibleReason"]);
            } else if (upsell.selectedIndex === 5) {
                showFields(["notEligibleReason"]);
                hideSpecificFields(["productsOffered", "declineReason"]);
            }
        });

        updateToolLabelVisibility();

    } else if (voiceForms.includes(selectedValue)) { 
        const table = document.createElement("table");

        const fields = [
            // Visual Audit
            { label: "Account/Facility Type", type: "select", name: "facility", options: [
                "", 
                "Fiber", 
                "Fiber - Radius", 
                "Copper VDSL", 
                "Copper HDSL/NGN" 
            ]},
            { label: "Res. Vertical Address", type: "select", name: "resType", options: [
                "Bldg., Condo, etc.", 
                "Yes", 
                "No"
            ]},
            { label: "Service Status", type: "select", name: "serviceStatus", options: [
                "", 
                "Active", 
                "Barred", 
            ]},
            { label: "Services", type: "select", name: "services", options: [
                "", 
                "Bundled", 
                "Voice Only", 
            ]},
            { label: "Network Outage", type: "select", name: "outageStatus", options: ["", "Yes", "No"] },
            { label: "Source Reference", type: "select", name: "outageReference", options: [
                "— Network Outage Source —", 
                "FUSE Outage Tab", 
                "Lit365 Downtime Advisory",
                "Clearview",
                "CEP Affected Services Tab"
            ]},
            { label: "Parent Case", type: "text", name: "pcNumber", placeholder: "Leave blank if Awaiting Parent Case" },
            { label: "Modem/ONU Serial # (L2)", type: "text", name: "onuSerialNum", placeholder: "Available in FUSE/CV/DMS."},
            { label: "Modem Lights Status", type: "select", name: "modemLights", options: [
                "", 
                "Red Power Light", 
                "No Power Light",
                "PON Light Blinking",
                "Red LOS",
                "No VoIP Light",
                "No Tel Light",
                "No Phone1 Light",
                "NO LOS light / Power and PON Lights Steady Green / VoIP/Tel/Phone1 Steady Green",
                "NO LOS light / Power and PON Lights Steady Green / VoIP/Tel/Phone1 Blinking Green"
            ]},
            { label: "Call Type", type: "select", name: "callType", options: [
                "", 
                "Local", 
                "Domestic",
                "International"
            ]},
            // NMS Skin
            { label: "OLT & ONU Conn. Type", type: "select", name: "oltAndOnuConnectionType", options: [
                "", 
                "FEOL - InterOp", 
                "FEOL - Non-interOp", 
                "HUOL - InterOp",
                "HUOL - Non-interOp"
            ]},
            { label: "FXS1 Status", type: "text", name: "fsx1Status" },
            { label: "Routing Index", type: "text", name: "routingIndex" },
            { label: "Call Source", type: "text", name: "callSource" },
            { label: "LDN Set", type: "text", name: "ldnSet" },
            { label: "Actions Taken in NMS Skin", type: "textarea", name: "nmsSkinRemarks", placeholder: "Include the RA and DC action results here. If no action was taken, leave this field blank." },
            // DMS
            { label: "Voice Status", type: "text", name: "dmsVoipServiceStatus" },
            { label: "Actions Taken in DMS", type: "textarea", name: "dmsRemarks", placeholder: "Leave this field blank if no action was taken." },
            { label: "Actual Experience (L2)", type: "textarea", name: "actualExp", placeholder: "Please input the customer's actual experience in detail.\ne.g. “Busy tone when dialing”. DO NOT input the WOCAS!"},
            { label: "Other Actions Taken/ Troubleshooting/ Remarks", type: "textarea", name: "remarks", placeholder: "Ensure that all actions performed in each tool are properly documented. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "Issue Resolved? (Y/N)", type: "select", name: "issueResolved", options: [
                "", 
                "Yes", 
                "No - for Ticket Creation",
                "No - Customer is Unresponsive",
                "No - Customer is Not At Home",
                "No - Customer Declined Further Assistance",
                "No - System Ended Chat"
            ] },
            { label: "FLM Findings / Resolution", type: "select", name: "resolution", options: [
                "",
                "Defective Cable / Cord",
                "Defective Telset / Missing Telset",
                "Manual Troubleshooting",
                "No Configuration / Wrong Configuration",
                "Self-Restored",
                "Network / Outage",
                "Zone",
                "Defective Telset",
                "Defective Modem / Missing Modem",
                "NMS Configuration" 
            ]},
            // CEP Investigation Tagging
            { label: "Investigation 1", type: "select", name: "investigation1", options: [
                "— Modem Light Status —",
                "Blinking/No PON/FIBR/ADSL",
                "No VoIP/Phone/Tel Light",
                "Normal Status",
                "Not Applicable [Copper]",
                "Not Applicable [Defective CPE]",
                "Not Applicable [via Store]",
                "RED LOS",
                "Unable to provide information"
            ]},
            { label: "Investigation 2", type: "select", name: "investigation2", options: [
                "— NMS Parameters —",
                "Correct profile at VOICE NMS",
                "Correct SG7K profile",
                "Idle Status [FEOL]",
                "Misaligned Routing Index",
                "No or incomplete profile at VOICE NMS",
                "Not Applicable [Copper]",
                "Not Applicable [NCE/InterOP]",
                "Not Applicable [NMS GUI]",
                "Not Applicable [via Store]",
                "Not Applicable [Voice Only - Fiber]",
                "Register- failed Status [FEOL]"                    
            ]},
            { label: "Investigation 3", type: "select", name: "investigation3", options: [
                "— Clearview Reading —",
                "Not Applicable",
                "Not Applicable [Voice Issue]",
                "The ONU performance is degraded"
            ]},
            { label: "Investigation 4", type: "select", name: "investigation4", options: [
                "— Select applicable Investigation 4 —",
                "Awaiting Parent Case",
                "Primary Trouble",
                "Secondary Trouble",
                "Broken/Damaged Modem/ONU",
                "Broken/Damaged Telset",
                "Cannot Make Call",
                "Cannot Make/Receive Call",
                "Fast Busy/With Recording",
                "FCR - Cannot Receive Call",
                "FCR - With Ring Back Tone",
                "No Ring Back tone",
                "Noisy Line",
                "Not Applicable [via Store]",
                "With Ring Back Tone"
            ] },
            // Ticket Details
            { label: "CEP Case Number", type: "number", name: "cepCaseNumber" },
            { label: "SLA / ETR", type: "text", name: "sla" },
            // Special Instructions
            { label: "Contact Person", type: "text", name: "contactName" },
            { label: "Contact Number", type: "number", name: "cbr" },
            { label: "Preferred Date & Time", type: "text", name: "availability" },
            { label: "Address", type: "textarea", name: "address" },
            { label: "Landmarks", type: "textarea", name: "landmarks" },
            { label: "Repeats w/in 30 Days", type: "text", name: "rptCount" },
            // Cross-Sell/Upsell
            { label: "Upsell", type: "select", name: "upsell", options: [
                "", 
                "Yes - Accepted", 
                "No - Declined",
                "No - Ignored",
                "NA - Not Eligible"
            ]}
        ];

        function createInstructionsRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const instructionsDiv = document.createElement("div");
            instructionsDiv.className = "form2DivInstructions"; 

            const header = document.createElement("p");
            header.textContent = "Reference Link";
            header.className = "instructions-header";
            instructionsDiv.appendChild(header);

            const ul = document.createElement("ul");
            ul.className = "instructions-list";

            const li5 = document.createElement("li");
            li5.textContent = "See ";

            const link1 = document.createElement("a");

            let url1 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            }

            link1.textContent = "CEP: Troubleshooting Guide";
            link1.style.color = "lightblue";
            link1.href = "#";

            link1.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url1, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li5.appendChild(link1);
            li5.appendChild(document.createTextNode(" for Main PLDT Repair Work Instruction"));
            ul.appendChild(li5);

            const li6 = document.createElement("li");
            li6.textContent = "See ";

            const link2 = document.createElement("a");

            let url2 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            }

            link2.textContent = "Gamma: Troubleshooting Guide";
            link2.style.color = "lightblue";
            link2.href = "#";

            link2.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url2, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li6.appendChild(link2);
            li6.appendChild(document.createTextNode(" for Main Gamma Repair Work Instruction"));
            ul.appendChild(li6);

            instructionsDiv.appendChild(ul);

            td.appendChild(instructionsDiv);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldNames) {
            const names = Array.isArray(relatedFieldNames)
                ? relatedFieldNames
                : [relatedFieldNames];

            const indices = names
                .map(name => fields.findIndex(f => f.name === name))
                .filter(i => i >= 0);

            if (indices.length === 0) return;

            const insertAt = Math.min(...indices);

            fields.splice(insertAt, 0, {
                label: `// ${label}`,
                type: "toolLabel",
                name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                relatedTo: names.join(",")
            });
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Visual Audit", "facility");
        insertToolLabel(enhancedFields, "NMS Skin", ["oltAndOnuConnectionType", "routingIndex"]);
        insertToolLabel(enhancedFields, "Probe & Troubleshoot", "actualExp");
        insertToolLabel(enhancedFields, "DMS", "dmsVoipServiceStatus");
        insertToolLabel(enhancedFields, "CEP Investigation Tagging", "investigation1");
        insertToolLabel(enhancedFields, "Ticket Details", "cepCaseNumber");
        insertToolLabel(enhancedFields, "Special Instructions", "contactName");
        insertToolLabel(enhancedFields, "Cross-Sell/Upsell", "upsell");
        
        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "facility" ? "table-row" : "none";

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;

            if (field.type === "toolLabel") {
                const toolLabelRow = document.createElement("tr");
                toolLabelRow.classList.add("tool-label-row");
                toolLabelRow.dataset.relatedTo = field.relatedTo;
                toolLabelRow.style.display = "none";

                const td = document.createElement("td");
                const div = document.createElement("div");
                div.className = "formToolLabel";
                div.textContent = field.label.replace(/^\/\/\s*/, "");

                td.appendChild(div);
                toolLabelRow.appendChild(td);
                return toolLabelRow;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";

                let optionsToUse = field.options;

                if (field.name === "resolution") {
                    if (["form101_1", "form101_2", "form101_3", "form101_4"].includes(selectedValue)) {
                        optionsToUse = field.options.filter((opt, idx) => idx === 0 || (idx >= 1 && idx <= 7));
                    } else if (["form102_1", "form102_2", "form102_3", "form102_4"].includes(selectedValue)) {
                        optionsToUse = [field.options[0], field.options[1], field.options[3], field.options[8]];
                    } else if (["form103_1", "form103_2", "form103_3", "form103_4", "form103_5"].includes(selectedValue)) {
                        optionsToUse = [field.options[0], field.options[2], field.options[3], field.options[4], field.options[9], field.options[10]];
                    }
                }

                optionsToUse.forEach((optionText, index) => {
                const option = document.createElement("option");
                option.value = optionText;
                option.textContent = optionText;

                if (index === 0) {
                    option.disabled = true;
                    option.selected = true;
                    option.style.fontStyle = "italic";
                }

                input.appendChild(option);
                });

            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") ? 5 : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }

        table.appendChild(createInstructionsRow()); 
        enhancedFields.forEach(field => {
            const row = createFieldRow(field);
            table.appendChild(row);
        });

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedNamesRaw = labelRow.dataset.relatedTo || "";
                const relatedNames = relatedNamesRaw.split(",").map(s => s.trim()).filter(Boolean);

                const shouldShow = relatedNames.some(name => {
                const relatedInput = document.querySelector(`[name="${name}"]`);
                if (!relatedInput) return false;
                const relatedRow = relatedInput.closest("tr");
                return relatedRow && relatedRow.style.display !== "none";
                });

                labelRow.style.display = shouldShow ? "table-row" : "none";
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["CEP", "SF/FUSE", "Endorse", "SF Tagging", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            ffupButtonHandler, 
            techNotesButtonHandler,
            endorsementForm, 
            sfTaggingButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];

        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);
        
        const facility = document.querySelector("[name='facility']");
        facility.addEventListener("change", () => {
            resetAllFields(["facility"]);
            if (facility.value === "Fiber") {
                if (selectedValue === "form101_1" || selectedValue === "form101_2" || selectedValue === "form101_3" || selectedValue === "form102_1" || selectedValue === "form102_2" || selectedValue === "form102_3") {
                    showFields(["outageStatus"]);
                    hideSpecificFields(["resType", "serviceStatus", "services", "outageReference", "pcNumber", "onuSerialNum", "modemLights", "callType", "dmsVoipServiceStatus", "dmsRemarks", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "actualExp", "remarks", "issueResolved", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                } else if (selectedValue === "form103_1" || selectedValue === "form103_2") {
                    showFields(["serviceStatus", "onuSerialNum", "callType", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "actualExp", "remarks", "issueResolved"]);
                    hideSpecificFields(["resType", "services", "outageStatus", "outageReference", "pcNumber", "modemLights", "fsx1Status", "dmsVoipServiceStatus", "dmsRemarks", "oltAndOnuConnectionType", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                }  else if (selectedValue === "form103_4" || selectedValue === "form103_5") {
                    showFields(["onuSerialNum", "actualExp", "remarks", "issueResolved"]);
                    hideSpecificFields(["resType", "services", "outageStatus", "outageReference", "pcNumber", "modemLights", "callType", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "dmsVoipServiceStatus", "dmsRemarks", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                } else {
                    showFields(["remarks", "issueResolved"]);
                    hideSpecificFields(["resType", "serviceStatus", "services", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "modemLights", "callType", "dmsVoipServiceStatus", "dmsRemarks", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "actualExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                }
            } else if (facility.value === "Fiber - Radius") {
                showFields(["remarks", "issueResolved"]);
                hideSpecificFields(["resType", "serviceStatus", "services", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "modemLights", "callType", "dmsVoipServiceStatus", "dmsRemarks", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "actualExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            } else if (facility.value === "Copper VDSL") {
                showFields(["resType"]);
                hideSpecificFields(["serviceStatus", "services", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "modemLights", "callType", "dmsVoipServiceStatus", "dmsRemarks", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "actualExp", "remarks", "investigation1", "investigation2", "investigation3", "investigation4", "resolution", "issueResolved", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            } else {
                showFields(["remarks"]);
                hideSpecificFields(["resType", "serviceStatus", "services", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "modemLights", "callType", "dmsVoipServiceStatus", "dmsRemarks", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "investigation1", "investigation2", "investigation3", "investigation4", "issueResolved", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            }

            updateToolLabelVisibility();
        });
    
        const resType = document.querySelector("[name='resType']");
        resType.addEventListener("change", () => {
            resetAllFields(["facility", "resType"]);
            if (resType.value === "Yes") {
                if (selectedValue === "form101_1" || selectedValue === "form101_2") {
                    showFields(["outageStatus"]);
                    hideSpecificFields(["serviceStatus", "services", "outageReference", "pcNumber", "onuSerialNum", "modemLights", "callType", "oltAndOnuConnectionType", "dmsVoipServiceStatus", "dmsRemarks", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "actualExp", "remarks", "issueResolved", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                } else if (selectedValue === "form101_3") {
                    showFields(["services", "outageStatus"]);
                    hideSpecificFields(["serviceStatus", "outageReference", "pcNumber", "onuSerialNum", "modemLights", "callType", "dmsVoipServiceStatus", "dmsRemarks", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "actualExp", "remarks", "issueResolved", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                } else {
                    showFields(["remarks", "issueResolved"]);
                    hideSpecificFields(["serviceStatus", "services", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "modemLights", "callType", "dmsVoipServiceStatus", "dmsRemarks", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "actualExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                }
            } else {
                showFields(["remarks"]);
                hideSpecificFields(["serviceStatus", "services", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "modemLights", "callType", "dmsVoipServiceStatus", "dmsRemarks", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "actualExp", "issueResolved", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            }
            updateToolLabelVisibility();
        });

        const outageStatus = document.querySelector("[name='outageStatus']");
        outageStatus.addEventListener("change", () => {
            resetAllFields(["facility", "resType", "services", "serviceStatus", "outageStatus"]);
            if (outageStatus.value === "No" && facility.value === "Fiber") {
                if (selectedValue === "form101_1" || selectedValue === "form101_2" || selectedValue === "form101_3") {
                    showFields(["onuSerialNum", "modemLights", "oltAndOnuConnectionType", "actualExp", "remarks", "issueResolved"]);
                    hideSpecificFields(["outageReference", "pcNumber", "callType", "dmsVoipServiceStatus", "dmsRemarks", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                } else {
                    showFields(["remarks", "issueResolved"]);
                    hideSpecificFields(["outageReference", "pcNumber", "onuSerialNum", "modemLights", "callType", "dmsVoipServiceStatus", "dmsRemarks", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "actualExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                }
                updateToolLabelVisibility();
            } else if (outageStatus.value === "No" && facility.value === "Copper VDSL") {
                if (selectedValue === "form101_1" || selectedValue === "form101_2" || selectedValue === "form101_3") {
                    showFields(["onuSerialNum", "actualExp", "remarks", "issueResolved"]);
                    hideSpecificFields(["outageReference", "pcNumber", "modemLights", "callType", "oltAndOnuConnectionType", "dmsVoipServiceStatus", "dmsRemarks", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                } else {
                    showFields(["remarks", "issueResolved"]);
                    hideSpecificFields(["outageReference", "pcNumber", "onuSerialNum", "modemLights", "callType", "dmsVoipServiceStatus", "dmsRemarks", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "actualExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                }
                updateToolLabelVisibility();
            } else if (resType.value === "Yes" && services.value === "Voice Only" && outageStatus.value === "No") {
                if (selectedValue === "form101_3") {
                    showFields(["onuSerialNum", "dmsVoipServiceStatus", "dmsRemarks", "actualExp", "remarks", "issueResolved"]);
                    hideSpecificFields(["outageReference", "pcNumber", "modemLights", "callType", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                }
                updateToolLabelVisibility();
            } else if (resType.value === "Yes" && services.value === "Bundled" && outageStatus.value === "No") {
                showFields(["onuSerialNum", "remarks", "issueResolved"]);
                hideSpecificFields(["outageReference", "pcNumber", "modemLights", "callType", "dmsVoipServiceStatus", "dmsRemarks", "oltAndOnuConnectionType", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);

                updateToolLabelVisibility();
            } else {
                showFields(["outageReference", "pcNumber", "remarks", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "rptCount", "upsell"]);
                hideSpecificFields(["onuSerialNum", "modemLights", "callType", "oltAndOnuConnectionType", "dmsVoipServiceStatus", "dmsRemarks", "fsx1Status", "routingIndex", "callSource", "ldnSet", "nmsSkinRemarks", "actualExp", "issueResolved", "availability", "address", "landmarks"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
                updateToolLabelVisibility();
            }

            updateToolLabelVisibility();
        });

        const services = document.querySelector("[name='services']");
        services.addEventListener("change", () => {
            if (services.value === "Voice Only") {
                if (outageStatus.value === "No") {
                    showFields(["dmsVoipServiceStatus"])
                }
            } else {
                hideSpecificFields(["dmsVoipServiceStatus"])
            }
        });

        const oltAndOnuConnectionType = document.querySelector("[name='oltAndOnuConnectionType']");
        oltAndOnuConnectionType.addEventListener("change", () => {
            if (oltAndOnuConnectionType.value === "FEOL - Non-interOp") {
                showFields(["fsx1Status"]);
            } else {
                hideSpecificFields(["fsx1Status"]);
            }
        });
    
        const issueResolved = document.querySelector("[name='issueResolved']");
        issueResolved.addEventListener("change", () => {
            if (issueResolved.selectedIndex === 2) {
                showFields(["investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            } else {
                showFields(["upsell"]);
                hideSpecificFields(["investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount"]);
            }
            
            if (caseOriginField.value === "CDT-SOCMED") {
                showFields(["resolution"]);
            } else {
                hideSpecificFields(["resolution"]);
            }

            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (nicForms.includes(selectedValue)) { 
        const table = document.createElement("table");

        const fields = [
            // Visual Audit
            { label: "Account/Facility Type", type: "select", name: "facility", options: [
                "", 
                "Fiber", 
                "Fiber - Radius", 
                "Copper VDSL", 
                "Copper HDSL/NGN" 
            ]},
            { label: "Res. Vertical Address", type: "select", name: "resType", options: [
                "Bldg., Condo, etc.", 
                "Yes", 
                "No"
            ]},
            { label: "Network Outage", type: "select", name: "outageStatus", options: ["", "Yes", "No"]},
            { label: "Source Reference", type: "select", name: "outageReference", options: [
                "— Network Outage Source —", 
                "FUSE Outage Tab", 
                "Lit365 Downtime Advisory",
                "Clearview",
                "CEP Affected Services Tab"
            ]},
            { label: "Parent Case", type: "text", name: "pcNumber", placeholder: "Leave blank if Awaiting Parent Case"},
            { label: "Equipment Brand", type: "select", name: "equipmentBrand", options: [
                "", 
                "FEOL", 
                "HUOL"
            ]},
            { label: "Modem Brand", type: "select", name: "modemBrand", options: [
                "", 
                "FHTT", 
                "HWTC", 
                "ZTEG",
                "AZRD",
                "PRLN",
                "Other Brands"
            ]},
            { label: "ONU Connection Type", type: "select", name: "onuConnectionType", options: [
                "", 
                "InterOp", 
                "Non-interOp"
            ]},
            { label: "ONU Model (L2)", type: "text", name: "onuModel", placeholder: "Available in DMS."},
            { label: "Modem/ONU Serial # (L2)", type: "text", name: "onuSerialNum", placeholder: "Available in FUSE/CV/DMS."},
            { label: "Internet Light Status", type: "select", name: "intLightStatus", options: [
                "", 
                "Steady Green", 
                "Blinking Green",
                "No Light",
                "No Internet Light Indicator"
            ]},
            { label: "WAN Light Status", type: "select", name: "wanLightStatus", options: [
                "", 
                "Steady Green", 
                "Blinking Green",
                "No Light"
            ]},
            // Clearview
            { label: "SMP/Clearview Reading", type: "textarea", name: "cvReading", placeholder: "e.g. Line Problem Detected - OLT to LCP, LCP to NAP, NAP to ONU" },
            { label: "Latest RTA Request (L2)", type: "text", name: "rtaRequest"},
            // NMS Skin
            { label: "ONU Status/RUNSTAT", type: "select", name: "onuRunStats", options: [
                "", 
                "UP",
                "Active",
                "LOS",
                "Down",
                "Power is Off",
                "Power is Down",
                "/N/A"
            ]},
            { label: "RX Power", type: "number", name: "rxPower", step: "any", placeholder: "Also available in DMS"},
            { label: "VLAN (L2)", type: "text", name: "vlan", placeholder: "Also available in DMS"},
            { label: "IP Address (L2)", type: "text", name: "ipAddress", placeholder: "Also available in DMS"},
            { label: "No. of Conn. Devices (L2)", type: "text", name: "connectedDevices", placeholder: "Also available in DMS"},
            { label: "Option82 Config (L2)", type: "select", name: "option82Config", options: [
                "", 
                "Aligned", 
                "Misaligned"
            ]},
            { label: "Actions Taken in NMS Skin", type: "textarea", name: "nmsSkinRemarks", placeholder: "Include the RA and DC action results here. If no action was taken, leave this field blank." },
            // DMS
            { label: "Internet/Data Status(L2)", type: "select", name: "dmsInternetStatus", options: ["", "Online", "Offline" ]},
            { label: "Performed Self Heal?", type: "select", name: "dmsSelfHeal", options: [
                "", 
                "Yes/Resolved", 
                "Yes/Unresolved", 
                "No"
            ]},
            { label: "Other Actions Taken in DMS", type: "textarea", name: "dmsRemarks", placeholder: "Leave this field blank if no action was taken." },
            // Probing
            { label: "Connection Method", type: "select", name: "connectionMethod", options: [
                "", 
                "WiFi", 
                "LAN"
            ]},
            { label: "WiFi State (DMS)", type: "select", name: "dmsWifiState", options: [
                "", 
                "On", 
                "Off"
            ]},
            { label: "LAN Port Status (DMS)", type: "select", name: "dmsLanPortStatus", options: [
                "", 
                "Disabled", 
                "Enabled"
            ]},
            { label: "Mesh Type", type: "select", name: "meshtype", options: [
                "", 
                "TP-LINK", 
                "Tenda"
            ]},
            { label: "Mesh Ownership", type: "select", name: "meshOwnership", options: [
                "", 
                "PLDT-owned", 
                "Subs-owned"
            ]},
            { label: "Actual Experience (L2)", type: "textarea", name: "actualExp", placeholder: "Please input the customer's actual experience in detail.\ne.g. “NIC using WiFi”. DO NOT input the WOCAS!"},
            { label: "Other Actions Taken/ Troubleshooting/ Remarks", type: "textarea", name: "remarks", placeholder: "Ensure that all actions performed in each tool are properly documented. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "Issue Resolved? (Y/N)", type: "select", name: "issueResolved", options: [
                "", 
                "Yes", 
                "No - for Ticket Creation",
                "No - Customer is Unresponsive",
                "No - Customer is Not At Home",
                "No - Customer Declined Further Assistance",
                "No - System Ended Chat"
            ] },
            { label: "FLM Findings / Resolution", type: "select", name: "resolution", options: [
                "",
                "Tested Ok",
                "Cannot Browse",
                "Defective Mesh",
                "Defective Modem / Missing Modem",
                "Manual Troubleshooting",
                "Mesh Configuration",
                "Mismatch Option 82 / Service ID",
                "NMS Refresh / Configuration",
                "No Configuration / Wrong Configuration",
                "No or Blinking DSL Light",
                "Self-Restored",
                "Zone",
                "Network / Outage"
            ]},
            { label: "Tested Ok? (Y/N)", type: "select", name: "testedOk", options: [
                "", 
                "Yes", 
                "No"
            ] },
            // CEP Investigation Tagging
            { label: "Investigation 1", type: "select", name: "investigation1", options: [
                "— Modem Light Status —",
                "No Internet Light",
                "No LAN light",
                "No WLAN light",
                "Normal Status",
                "Not Applicable [Copper]",
                "Not Applicable [via Store]",
                "Unable to provide information"
            ]},
            { label: "Investigation 2", type: "select", name: "investigation2", options: [
                "— NMS Parameters —",
                "VLAN Configuration issue",
                "Up/Active",
                "Null Value",
                "Not Applicable [NMS GUI]",
                "Not Applicable [InterOP]",
                "Not Applicable [via Store]",
                "No acquired IP address [Native]",
                "Failed RX",
            ]},
            { label: "Investigation 3", type: "select", name: "investigation3", options: [
                "— Clearview Reading —",
                "Failed to collect line card information",
                "Fix bad splices",
                "Missing Micro-Filter",
                "Others/Error Code",
                "Rogue ONU",
                "Severely Degraded",
                "The ONU performance is degraded",
                "Unbalanced Pair",
                "Without Line Problem Detected"
            ]},
            { label: "Investigation 4", type: "select", name: "investigation4", options: [
                "— Select applicable Investigation 4 —",
                "Awaiting Parent Case",
                "Cannot Browse",
                "Cannot Browse via Mesh",
                "Cannot Connect via LAN",
                "Cannot Connect via WiFi",
                "Data Bind Port",
                "FCR - Cannot Browse",
                "FCR - Cannot Connect via LAN",
                "FCR - Cannot Connect via Mesh",
                "FCR - Cannot Connect via WiFi",
                "FCR - Device - Advised Physical Set-Up",
                "FCR - Device for Replacement in Store",
                "FCR - Redirected to PLDT Sites",
                "Individual Trouble",
                "Network Trouble - Cannot Browse",
                "Network Trouble - Cannot Browse via Mesh",
                "Node Down",
                "Not Applicable [via Store]",
                "Redirected to PLDT Sites",
                "Secondary Trouble"
            ]},
            // Ticket Details
            { label: "CEP Case Number", type: "number", name: "cepCaseNumber" },
            { label: "SLA / ETR", type: "text", name: "sla" },
            // Special Instructions
            { label: "Contact Person", type: "text", name: "contactName" },
            { label: "Contact Number", type: "number", name: "cbr" },
            { label: "Preferred Date & Time", type: "text", name: "availability" },
            { label: "Address", type: "textarea", name: "address" },
            { label: "Landmarks", type: "textarea", name: "landmarks" },
            { label: "Repeats w/in 30 Days", type: "text", name: "rptCount"},
            // Cross-Sell/Upsell
            { label: "Upsell", type: "select", name: "upsell", options: [
                "", 
                "Yes - Accepted", 
                "Yes - Pending Req. (For callback)",
                "No - Declined",
                "No - Ignored",
                "NA - Not Eligible"
            ]},
            { label: "Product/Services Offered", type: "select", name: "productsOffered", options: [
                "", 
                "Always On",
            ]},
            { label: "Decline Reason", type: "select", name: "declineReason", options: [
                "", 
                "Cannot decide at the moment", 
                "Contract terms concerns", 
                "Disconnected Call/Chat", 
                "Financial constraints", 
                "Lack of confidence in the offer", 
                "Lack of trust in the offer", 
                "Needs time to think it over", 
                "Negative past experience", 
                "No perceived need or benefit",
                "Not authorized", 
                "Not interested at this time", 
                "Price too high", 
                "Product difficulty to use", 
                "Satisfied with current plan", 
                "Satisfied with current service", 
                "Service difficulty to use", 
                "Service reliability concerns"
            ]},
            { label: "Not Eligible Reason", type: "select", name: "notEligibleReason", options: [
                "", 
                // "Account has pending issues", 
                // "Account is barred", 
                // "Account is inhibited", 
                // "Account is not yet active", 
                // "Account is restricted",
                "Customer already availed the product", 
                "Customer already availed the service", 
                "Customer already upgraded their plan", 
                "Customer is in a hurry", 
                "Customer is irate", 
                "Customer is requesting a supervisor", 
                "Customer is requesting a manager", 
                "Customer is requesting to downgrade", 
                "Disconnection concerns", 
                "LOB is not applicable", 
                "Microbusiness Account", 
                "Plan not eligible for upsell", 
                "Poor LTE signal strength in the area", 
                "Poor payment history", 
                "Potential crisis", 
                "Prepaid Fiber",
                "Technical incompatibility", 
                "Temporary Disconnection concerns",
                "Time is limited",
                "Unresolved AFTERSALES complaints", 
                "Unresolved AFTERSALES concerns", 
                "VTD concerns"
            ]},
        ];

        function createInstructionsRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const instructionsDiv = document.createElement("div");
            instructionsDiv.className = "form2DivInstructions"; 

            const header = document.createElement("p");
            header.textContent = "Reference Link";
            header.className = "instructions-header";
            instructionsDiv.appendChild(header);

            const ul = document.createElement("ul");
            ul.className = "instructions-list";

            const li5 = document.createElement("li");
            li5.textContent = "See ";

            const link1 = document.createElement("a");

            let url1 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            }

            link1.textContent = "CEP: Troubleshooting Guide";
            link1.style.color = "lightblue";
            link1.href = "#";

            link1.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url1, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li5.appendChild(link1);
            li5.appendChild(document.createTextNode(" for Main PLDT Repair Work Instruction"));
            ul.appendChild(li5);

            const li6 = document.createElement("li");
            li6.textContent = "See ";

            const link2 = document.createElement("a");

            let url2 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            }

            link2.textContent = "Gamma: Troubleshooting Guide";
            link2.style.color = "lightblue";
            link2.href = "#";

            link2.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url2, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li6.appendChild(link2);
            li6.appendChild(document.createTextNode(" for Main Gamma Repair Work Instruction"));
            ul.appendChild(li6);

            instructionsDiv.appendChild(ul);

            td.appendChild(instructionsDiv);
            row.appendChild(td);

            return row;
        }

        function insertNoteRow(fields, toolLabelName) {
            const index = fields.findIndex(f => f.name === toolLabelName);
            if (index !== -1) {
                fields.splice(index + 1, 0, {
                    type: "noteRow",
                    name: "onuStatChecklist",
                    relatedTo: "onuRunStats"
                });
            }
        }

        function insertToolLabel(fields, label, relatedFieldNames) {
            const names = Array.isArray(relatedFieldNames)
                ? relatedFieldNames
                : [relatedFieldNames];

            const indices = names
                .map(name => fields.findIndex(f => f.name === name))
                .filter(i => i >= 0);

            if (indices.length === 0) return;

            const insertAt = Math.min(...indices);

            fields.splice(insertAt, 0, {
                label: `// ${label}`,
                type: "toolLabel",
                name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                relatedTo: names.join(",")
            });
        }

        function insertEscaChecklistRow(fields, relatedFieldName) {
            const index = fields.findIndex(f => f.name === relatedFieldName);
            if (index !== -1) {
                fields.splice(index, 0, {
                    type: "escaChecklistRow",
                    name: "escaChecklist",
                    relatedTo: relatedFieldName
                });
            }
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Visual Audit", "facility");
        insertEscaChecklistRow(enhancedFields, "outageStatus");
        insertToolLabel(enhancedFields, "NMS Skin", ["onuRunStats", "nmsSkinRemarks"]);
        insertNoteRow(enhancedFields, "toolLabel-nms-skin");
        insertToolLabel(enhancedFields, "BSMP/Clearview", "cvReading");
        insertToolLabel(enhancedFields, "DMS", "dmsInternetStatus");
        insertToolLabel(enhancedFields, "Probe & Troubleshoot", ["connectionMethod", "meshtype"]);
        insertToolLabel(enhancedFields, "CEP Investigation Tagging", "investigation1");
        insertToolLabel(enhancedFields, "Ticket Details", "cepCaseNumber");
        insertToolLabel(enhancedFields, "Special Instructions", "contactName");
        insertToolLabel(enhancedFields, "Cross-Sell/Upsell", "upsell");
        
        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "facility" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "noteRow") {
                const row = document.createElement("tr");
                row.classList.add("note-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const checklistDiv = document.createElement("div");
                checklistDiv.className = "form2DivPrompt";

                const noteHeader = document.createElement("p");
                noteHeader.textContent = "Note:";
                noteHeader.className = "note-header";
                checklistDiv.appendChild(noteHeader);

                const ulNote = document.createElement("ul");
                ulNote.className = "note";

                const li1 = document.createElement("li");
                li1.textContent = "For the InterOp ONU connection type, only the Running ONU Statuses and RX parameters have values on the NMS Skin while VLAN, IP Address and Connected Users/Online Devices normally have no values. However, these parameters can be checked using DMS.";
                ulNote.appendChild(li1);

                const li2 = document.createElement("li");
                li2.textContent = "If the ONU Status/RUNSTAT is not “Up” or “Active,” proceed with the No Dial Tone and No Internet Connection intent and follow the corresponding work instructions.";
                ulNote.appendChild(li2);

                const li3 = document.createElement("li");
                li3.textContent = "Check Option82 configuration in NMS Skin (BMSP, SAAA and EAAA), Clearview, CEP, and FUSE.";
                ulNote.appendChild(li3);

                checklistDiv.appendChild(ulNote);

                td.appendChild(checklistDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "escaChecklistRow") {
                const row = document.createElement("tr");
                row.classList.add("esca-checklist-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const checklistDiv = document.createElement("div");
                checklistDiv.className = "form2DivPrompt";

                const checklistHeader = document.createElement("p");
                checklistHeader.textContent = "L2/Zone/Network Escalation Checklist:";
                checklistHeader.className = "esca-checklist-header";
                checklistDiv.appendChild(checklistHeader);

                const ulChecklist = document.createElement("ul");
                ulChecklist.className = "esca-checklist";

                const li4 = document.createElement("li");
                li4.textContent = "Complaint Coverage Checking";
                ulChecklist.appendChild(li4);

                const li5 = document.createElement("li");
                li5.textContent = "Option 82 Checking";
                ulChecklist.appendChild(li5);

                const li6 = document.createElement("li");
                li6.textContent = "Network Downtime Checking";
                ulChecklist.appendChild(li6);

                const li7 = document.createElement("li");
                li7.textContent = "Internet/Fiber/ADSL Light Checking";
                ulChecklist.appendChild(li7);

                const li8 = document.createElement("li");
                li8.textContent = "VLAN Result";
                ulChecklist.appendChild(li8);

                const li9 = document.createElement("li");
                li9.textContent = "DMS Online Status and IP Address Result";
                ulChecklist.appendChild(li9);

                const li10 = document.createElement("li");
                li10.textContent = "Connected Devices Result";
                ulChecklist.appendChild(li10);

                const li11 = document.createElement("li");
                li11.textContent = "Unbar S.O. Checking";
                ulChecklist.appendChild(li11);

                const li12 = document.createElement("li");
                li12.textContent = "SPS-UI SAAA Checking";
                ulChecklist.appendChild(li12);

                const li13 = document.createElement("li");
                li13.textContent = "Performed RA/Restart/Self-Heal";
                ulChecklist.appendChild(li13);

                const li14 = document.createElement("li");
                li14.textContent = "LAN/Wi-Fi or Mesh Troubleshooting";
                ulChecklist.appendChild(li14);

                const li15 = document.createElement("li");
                li15.textContent = "LAN side or Wi-Fi Status End Result";
                ulChecklist.appendChild(li15);

                const li16 = document.createElement("li");
                li16.textContent = "RX Parameter Result";
                ulChecklist.appendChild(li16);

                const li17 = document.createElement("li");
                li17.textContent = "Rogue ONU Checking";
                ulChecklist.appendChild(li17);

                const li18 = document.createElement("li");
                li18.textContent = "NMS Skin Result";
                ulChecklist.appendChild(li18);

                const li19 = document.createElement("li");
                li19.textContent = "Clear View Result";
                ulChecklist.appendChild(li19);

                checklistDiv.appendChild(ulChecklist);

                const checklistInstruction = document.createElement("p");
                checklistInstruction.textContent = "Note: It is not necessary to complete every item in this escalation checklist. Refer to the LIT365 work instructions for proper guidance.\n\nMaintain clear and detailed documentation to prevent potential misdiagnosis.";
                checklistInstruction.className = "esca-checklist-instruction";
                checklistDiv.appendChild(checklistInstruction);

                td.appendChild(checklistDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "toolLabel") {
                const toolLabelRow = document.createElement("tr");
                toolLabelRow.classList.add("tool-label-row");
                toolLabelRow.dataset.relatedTo = field.relatedTo;
                toolLabelRow.style.display = "none";

                const td = document.createElement("td");
                const div = document.createElement("div");
                div.className = "formToolLabel";
                div.textContent = field.label.replace(/^\/\/\s*/, "");

                td.appendChild(div);
                toolLabelRow.appendChild(td);
                return toolLabelRow;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") ? 5 : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }
        
        table.appendChild(createInstructionsRow()); 
        enhancedFields.forEach(field => table.appendChild(createFieldRow(field))); 

        function updateToolLabelVisibility() {
            const updateVisibility = (selector) => {
                document.querySelectorAll(selector).forEach(row => {
                    const relatedNamesRaw = row.dataset.relatedTo || "";
                    const relatedNames = relatedNamesRaw.split(",").map(s => s.trim()).filter(Boolean);

                    const shouldShow = relatedNames.some(name => {
                        const relatedInput = document.querySelector(`[name="${name}"]`);
                        if (!relatedInput) return false;
                        const relatedRow = relatedInput.closest("tr");
                        return relatedRow && relatedRow.style.display !== "none";
                    });

                    row.style.display = shouldShow ? "table-row" : "none";
                });
            };

            updateVisibility(".tool-label-row");
            updateVisibility(".note-row");
            updateVisibility(".esca-checklist-row");
        }

        form2Container.appendChild(table);

        const buttonLabels = ["CEP", "SF/FUSE", "Endorse", "SF Tagging", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            ffupButtonHandler, 
            techNotesButtonHandler,
            endorsementForm, 
            sfTaggingButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];

        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const facility = document.querySelector("[name='facility']");
        facility.addEventListener("change", () => {
            resetAllFields(["facility"]);
            if (facility.value === "Fiber") {
                if (selectedValue === "form500_1") {
                    showFields(["outageStatus"]);
                    hideSpecificFields(["resType", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "connectionMethod", "meshtype", "meshOwnership", "actualExp", "remarks", "issueResolved", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                } else if (selectedValue === "form500_2") {
                    showFields(["nmsSkinRemarks", "dmsRemarks", "actualExp", "remarks", "issueResolved"]);
                    hideSpecificFields(["resType", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "connectionMethod", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                } else {
                    showFields(["meshtype", "meshOwnership", "remarks", "issueResolved"]);
                    hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "connectionMethod", "actualExp", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                }

                updateToolLabelVisibility();
            } else if (facility.value === "Fiber - Radius") {
                if (selectedValue === "form500_1") {
                    showFields(["connectionMethod", "remarks", "issueResolved"]);
                    hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "meshtype", "meshOwnership", "actualExp", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                } else if (selectedValue === "form500_3" || selectedValue === "form500_4") {
                    showFields(["meshtype", "meshOwnership", "remarks", "issueResolved"]);
                    hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "connectionMethod", "actualExp", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                } else {
                    showAlert("This form is currently unavailable for customers with Fiber - Radius service.");
                    resetAllFields([]);
                    hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "connectionMethod", "meshtype", "meshOwnership", "actualExp", "remarks", "issueResolved", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);

                    const facilityField = document.querySelector('[name="facility"]');
                    if (facilityField) facilityField.value = "";
                    return;
                }
                
                updateToolLabelVisibility();
            } else if (facility.value === "Copper VDSL") {
                showFields(["resType"]);
                hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "connectionMethod", "meshtype", "meshOwnership", "actualExp", "remarks", "issueResolved", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
            } else {
                showFields(["remarks"]);
                hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "connectionMethod", "meshtype", "meshOwnership", "actualExp", "issueResolved", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
            }

            updateToolLabelVisibility();
        });
    
        const resType = document.querySelector("[name='resType']");
        resType.addEventListener("change", () => {
            resetAllFields(["facility", "resType"]);
            if (resType.value === "Yes") {
                if (selectedValue=== "form500_1") {
                    showFields(["outageStatus"]);
                    hideSpecificFields(["outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "connectionMethod", "meshtype", "meshOwnership", "actualExp", "remarks", "issueResolved", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                } else if (selectedValue === "form500_2") {
                    showFields(["remarks", "issueResolved"]);
                    hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "connectionMethod", "meshtype", "meshOwnership", "actualExp", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                } else {
                    showFields(["meshtype", "meshOwnership", "remarks", "issueResolved"]);
                    hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "connectionMethod", "actualExp", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                }
                
                updateToolLabelVisibility();
            } else {
                showFields(["remarks", "issueResolved"]);
                hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "connectionMethod", "meshtype", "meshOwnership", "actualExp", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
            }

            updateToolLabelVisibility();
        });

        const outageStatus = document.querySelector("[name='outageStatus']");
        outageStatus.addEventListener("change", () => {
            resetAllFields(["facility", "resType", "outageStatus"]);
            if (selectedValue === "form500_1" && facility.value === "Fiber" && outageStatus.value === "No") {
                showFields(["equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "onuModel", "dmsInternetStatus", "dmsSelfHeal", "dmsRemarks", "connectionMethod", "actualExp", "remarks", "issueResolved"]);
                hideSpecificFields(["outageReference", "pcNumber", "option82Config", "dmsWifiState", "dmsLanPortStatus", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
            } else if (selectedValue === "form500_1" && facility.value === "Copper VDSL" && outageStatus.value === "No") {
                showFields(["onuSerialNum", "intLightStatus", "wanLightStatus", "connectionMethod", "remarks", "issueResolved"]);
                hideSpecificFields(["outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "option82Config", "onuRunStats", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "actualExp", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
            } else {
                showFields(["outageReference", "pcNumber", "remarks", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "rptCount", "upsell"]);
                hideSpecificFields(["equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "intLightStatus", "wanLightStatus", "onuRunStats", "option82Config", "rxPower", "vlan", "ipAddress", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "dmsInternetStatus", "onuModel", "dmsWifiState", "dmsLanPortStatus", "dmsSelfHeal", "dmsRemarks", "connectionMethod", "actualExp", "issueResolved", "testedOk", "availability", "address", "landmarks", "productsOffered", "declineReason", "notEligibleReason"]);
                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            }
            updateToolLabelVisibility();
        });

        const onuRunStats = document.querySelector("[name='onuRunStats']");
        onuRunStats.addEventListener("change", () => {
            if (onuRunStats.value === "UP" || onuRunStats.value === "Active") {
                showFields(["option82Config"]);
            } else {
                hideSpecificFields(["option82Config"]);
            }
            updateToolLabelVisibility();
        });

        const equipmentBrand = document.querySelector("[name='equipmentBrand']");
        const modemBrand = document.querySelector("[name='modemBrand']");
        const onuConnectionType = document.querySelector("[name='onuConnectionType']");

        function updateONUConnectionType() {
            if (!equipmentBrand.value || !modemBrand.value) {
                onuConnectionType.value = ""; 
                onuConnectionType.dispatchEvent(new Event("change")); 
                return;
            }

            const newValue =
                (equipmentBrand.value === "FEOL" && modemBrand.value === "FHTT") ||
                (equipmentBrand.value === "HUOL" && modemBrand.value === "HWTC")
                    ? "Non-interOp"
                    : "InterOp";

            if (onuConnectionType.value !== newValue) {
                onuConnectionType.value = ""; 
                onuConnectionType.dispatchEvent(new Event("change")); 

                setTimeout(() => {
                    onuConnectionType.value = newValue; 
                    onuConnectionType.dispatchEvent(new Event("change")); 
                }, 0);
            }
        }

        onuConnectionType.addEventListener("mousedown", (event) => {
            event.preventDefault();
        });

        equipmentBrand.addEventListener("change", updateONUConnectionType);
        modemBrand.addEventListener("change", updateONUConnectionType);

        updateONUConnectionType();

        onuConnectionType.addEventListener("change", () => {
            if (onuConnectionType.value === "Non-interOp") {
                showFields(["vlan", "ipAddress", "connectedDevices"]);
            } else {
                hideSpecificFields(["vlan", "ipAddress", "connectedDevices"]);
            }
            updateToolLabelVisibility();
        });
    
        const connectionMethod = document.querySelector("[name='connectionMethod']");
        connectionMethod.addEventListener("change", () => {
            if (connectionMethod.value === "WiFi") {
                showFields(["dmsWifiState"]);
                hideSpecificFields(["dmsLanPortStatus"]);
            } else if (connectionMethod.value === "LAN") {
                showFields(["dmsLanPortStatus"]);
                hideSpecificFields(["dmsWifiState"]);
            } else {
                hideSpecificFields(["dmsWifiState", "dmsLanPortStatus"]);
            }
        });
        
        const issueResolved = document.querySelector("[name='issueResolved']");
        issueResolved.addEventListener("change", () => {
            if (issueResolved.selectedIndex === 2) {
                showFields(["investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                    hideSpecificFields(["testedOk"]);
                } else {
                    showFields(["testedOk"]);
                    hideSpecificFields(["resolution"]);
                }
            } else {
                showFields(["upsell"]);
                hideSpecificFields(["testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            }
            updateToolLabelVisibility();
        });

        const upsell = document.querySelector("[name='upsell']");
        upsell.addEventListener("change", () => {

            showFields(["productsOffered"]);
            if (upsell.selectedIndex === 1 || upsell.selectedIndex === 2) {
                hideSpecificFields(["declineReason", "notEligibleReason"]);
            } else if (upsell.selectedIndex === 3) {
                showFields(["declineReason"]);
                hideSpecificFields(["notEligibleReason"]);
            } else if (upsell.selectedIndex === 4) {
                hideSpecificFields(["declineReason", "notEligibleReason"]);
            } else if (upsell.selectedIndex === 5) {
                showFields(["notEligibleReason"]);
                hideSpecificFields(["productsOffered", "declineReason"]);
            }
        });

        const resolution = document.querySelector("[name='resolution']");
        const testedOk = document.querySelector("[name='testedOk']");

        function testedOkReso() {
            if (resolution.value === "Tested Ok" || testedOk.value === "Yes") {
                hideSpecificFields(["availability", "address", "landmarks"]);
            } else {
                showFields(["availability", "address", "landmarks"]);
            }
            updateToolLabelVisibility();
        }

        resolution.addEventListener("change", testedOkReso);
        testedOk.addEventListener("change", testedOkReso);

        updateToolLabelVisibility();
    } else if (sicForms.includes(selectedValue)) { 
        const table = document.createElement("table");

        const fields = [
            // Visual Audit
            { label: "Account/Facility Type", type: "select", name: "facility", options: [
                "", 
                "Fiber", 
                "Fiber - Radius", 
                "Copper VDSL", 
                "Copper HDSL/NGN" 
            ]},
            { label: "Res. Vertical Address", type: "select", name: "resType", options: [
                "Bldg., Condo, etc.", 
                "Yes", 
                "No"
            ]},
            { label: "Network Outage", type: "select", name: "outageStatus", options: ["", "Yes", "No"]},
            { label: "Source Reference", type: "select", name: "outageReference", options: [
                "— Network Outage Source —", 
                "FUSE Outage Tab", 
                "Lit365 Downtime Advisory",
                "Clearview",
                "CEP Affected Services Tab"
            ]},
            { label: "Parent Case", type: "text", name: "pcNumber", placeholder: "Leave blank if Awaiting Parent Case"},
            { label: "Plan Details (L2)", type: "textarea", name: "planDetails", placeholder: "Please specify the plan details as indicated in FUSE.\ne.g. “Plan 2699 at 1GBPS”" },
            { label: "ONU Model (L2)", type: "text", name: "onuModel", placeholder: "Available in DMS."},
            { label: "Modem/ONU Serial # (L2)", type: "text", name: "onuSerialNum", placeholder: "Available in FUSE/CV/DMS."},
            // NMS Skin
            { label: "RX Power", type: "number", name: "rxPower", step: "any", placeholder: "Also available in Clearview."},
            { label: "Option82 Config", type: "select", name: "option82Config", options: [
                "", 
                "Aligned", 
                "Misaligned"
            ]},
            { label: "SAAA BW Code (L2)", type: "text", name: "saaaBandwidthCode"},
            { label: "Connected Devices (L2)", type: "text", name: "connectedDevices", placeholder: "e.g. 2 on 2.4G, 3 on 5G, 2 LAN(Desktop/Laptop and Mesh)"},
            { label: "Actions Taken in NMS Skin", type: "textarea", name: "nmsSkinRemarks", placeholder: "Include the RA and DC action results here. If no action was taken, leave this field blank." },
            // DMS
            { label: "Internet/Data Status(L2)", type: "select", name: "dmsInternetStatus", options: ["", "Online", "Offline" ]},
            { label: "Device's WiFi Band (L2)", type: "select", name: "deviceWifiBand", options: [
                "", 
                "Device Found in 2.4G Wi-Fi", 
                "Device Found in 5G Wi-Fi" 
            ]},
            { label: "Bandsteering (L2)", type: "select", name: "bandsteering", options: ["", "Enabled", "Disabled"]},
            { label: "Actions Taken in DMS", type: "textarea", name: "dmsRemarks", placeholder: "Leave this field blank if no action was taken." },
            // BSMP/Clearview
            { label: "SMP/Clearview Reading", type: "textarea", name: "cvReading", placeholder: "e.g. Line Problem Detected - OLT to LCP, LCP to NAP, NAP to ONU" },
            { label: "Latest RTA Request (L2)", type: "text", name: "rtaRequest"},
            // Probing
            { label: "Connection Method", type: "select", name: "connectionMethod", options: [
                "", 
                "WiFi", 
                "LAN"
            ]},
            { label: "Device Brand & Model", type: "text", name: "deviceBrandAndModel", placeholder: "Galaxy S25, Dell Latitude 3420"},
            { label: "Ping Test Result", type: "number", name: "pingTestResult", step: "any"},
            { label: "Speedtest Result", type: "number", name: "speedTestResult", step: "any"},
            { label: "Actual Experience (L2)", type: "textarea", name: "actualExp", placeholder: "Please input the customer's actual experience in detail.\ne.g. “Only Acquiring 180MBPS.” DO NOT input the WOCAS!"},
            { label: "Other Actions Taken/ Troubleshooting/ Remarks", type: "textarea", name: "remarks", placeholder: "Ensure that all actions performed in each tool are properly documented. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "Issue Resolved? (Y/N)", type: "select", name: "issueResolved", options: [
                "", 
                "Yes", 
                "No - for Ticket Creation",
                "No - Customer is Unresponsive",
                "No - Customer is Not At Home",
                "No - Customer Declined Further Assistance",
                "No - System Ended Chat"
            ] },
            { label: "FLM Findings / Resolution", type: "select", name: "resolution", options: [
                "",
                "Tested Ok",
                "Failed RX",
                "High Latency / Ping",
                "Manual Troubleshooting",
                "Mismatch Option 82 / Service ID",
                "NMS Refresh / Configuration",
                "Slow Browsing",
                "Zone",
                "Network / Outage"
            ]},
            { label: "Tested Ok? (Y/N)", type: "select", name: "testedOk", options: [
                "", 
                "Yes", 
                "No"
            ] },
            // CEP Investigation Tagging
            { label: "Investigation 1", type: "select", name: "investigation1", options: [
                "— Modem Light Status —",
                "Normal Status",
                "Not Applicable [Copper]",
                "Not Applicable [via Store]",
                "Unable to provide information"
            ]},
            { label: "Investigation 2", type: "select", name: "investigation2", options: [
                "— NMS Parameters —",
                "Passed RX",
                "Failed RX",
                "Up/Active",
                "Not Applicable [NMS GUI]",
                "Not Applicable [via Store]",
            ]},
            { label: "Investigation 3", type: "select", name: "investigation3", options: [
                "— Clearview Reading —",
                "Fix bad splices",
                "Missing Micro-Filter",
                "Others/Error Code",
                "Rogue ONU",
                "Severely Degraded",
                "The ONU performance is degraded",
                "Unbalanced Pair",
                "Without Line Problem Detected",
                "Without Line Problem Detected - Link Quality Degraded"
            ]},
            { label: "Investigation 4", type: "select", name: "investigation4", options: [
                "— Select applicable Investigation 4 —",
                "FCR - Low BW profile",
                "FCR - Slow/Intermittent Browsing",
                "High Latency",
                "High Utilization OLT/PON Port",
                "Individual Trouble",
                "Misaligned Record",
                "Network Trouble - High Latency",
                "Network Trouble - Slow Internet Connection",
                "Network Trouble - Slow/Intermittent Browsing",
                "Not Applicable [via Store]",
                "ONU Replacement to Latest Model",
                "Slow/Intermittent Browsing",
                "With historical alarms",
                "Without historical alarms"
            ]},
            { label: "CEP Case Number", type: "number", name: "cepCaseNumber" },
            { label: "SLA / ETR", type: "text", name: "sla" },
            // Special Instructions
            { label: "Contact Person", type: "text", name: "contactName" },
            { label: "Contact Number", type: "number", name: "cbr" },
            { label: "Preferred Date & Time", type: "text", name: "availability" },
            { label: "Address", type: "textarea", name: "address" },
            { label: "Landmarks", type: "textarea", name: "landmarks" },
            { label: "Repeats w/in 30 Days", type: "text", name: "rptCount"},
            // Cross-Sell/Upsell
            { label: "Upsell", type: "select", name: "upsell", options: [
                "", 
                "Yes - Accepted", 
                "Yes - Pending Req. (For callback)",
                "No - Declined",
                "No - Ignored",
                "NA - Not Eligible"
            ]},
            { label: "Product/Services Offered", type: "select", name: "productsOffered", options: [
                "", 
                "Mesh",
                "Plan Upgrade"
            ]},
            { label: "Decline Reason", type: "select", name: "declineReason", options: [
                "", 
                "Cannot decide at the moment", 
                "Contract terms concerns", 
                "Disconnected Call/Chat", 
                "Financial constraints", 
                "Lack of confidence in the offer", 
                "Lack of trust in the offer", 
                "Needs time to think it over", 
                "Negative past experience", 
                "No perceived need or benefit",
                "Not authorized", 
                "Not interested at this time", 
                "Price too high", 
                "Product difficulty to use", 
                "Satisfied with current plan", 
                "Satisfied with current service", 
                "Service difficulty to use", 
                "Service reliability concerns"
            ]},
            { label: "Not Eligible Reason", type: "select", name: "notEligibleReason", options: [
                "", 
                // "Account has pending issues", 
                // "Account is barred", 
                // "Account is inhibited", 
                // "Account is not yet active", 
                // "Account is restricted",
                "Case is escalated",
                "Customer already availed the product", 
                "Customer already availed the service", 
                "Customer already upgraded their plan", 
                "Customer is in a hurry", 
                "Customer is irate", 
                "Customer is requesting a supervisor", 
                "Customer is requesting a manager", 
                "Customer is requesting to downgrade", 
                "Disconnection concerns", 
                "LOB is not applicable", 
                "Microbusiness Account", 
                "Plan not eligible for upsell", 
                "Poor LTE signal strength in the area", 
                "Poor payment history", 
                "Potential crisis", 
                "Prepaid Fiber",
                "Technical incompatibility", 
                "Temporary Disconnection concerns",
                "Time is limited",
                "Unresolved AFTERSALES complaints", 
                "Unresolved AFTERSALES concerns", 
                "VTD concerns"
            ]},
        ];

        function createInstructionsRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const instructionsDiv = document.createElement("div");
            instructionsDiv.className = "form2DivInstructions"; 

            const header = document.createElement("p");
            header.textContent = "Reference Link";
            header.className = "instructions-header";
            instructionsDiv.appendChild(header);

            const ul = document.createElement("ul");
            ul.className = "instructions-list";

            const li5 = document.createElement("li");
            li5.textContent = "See ";

            const link1 = document.createElement("a");

            let url1 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            }

            link1.textContent = "CEP: Troubleshooting Guide";
            link1.style.color = "lightblue";
            link1.href = "#";

            link1.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url1, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li5.appendChild(link1);
            li5.appendChild(document.createTextNode(" for Main PLDT Repair Work Instruction"));
            ul.appendChild(li5);

            const li6 = document.createElement("li");
            li6.textContent = "See ";

            const link2 = document.createElement("a");

            let url2 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            }

            link2.textContent = "Gamma: Troubleshooting Guide";
            link2.style.color = "lightblue";
            link2.href = "#";

            link2.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url2, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li6.appendChild(link2);
            li6.appendChild(document.createTextNode(" for Main Gamma Repair Work Instruction"));
            ul.appendChild(li6);

            instructionsDiv.appendChild(ul);

            td.appendChild(instructionsDiv);
            row.appendChild(td);

            return row;
        }

        function insertNoteRow(fields, toolLabelName) {
            const index = fields.findIndex(f => f.name === toolLabelName);
            if (index !== -1) {
                fields.splice(index, 0, {
                    type: "noteRow",
                    name: "probingChecklist",
                    relatedTo: "rxPower"
                });
            }
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName 
                }
            );
        }

        function insertEscaChecklistRow(fields, relatedFieldName) {
            const index = fields.findIndex(f => f.name === relatedFieldName);
            if (index !== -1) {
                fields.splice(index, 0, {
                    type: "escaChecklistRow",
                    name: "escaChecklist",
                    relatedTo: relatedFieldName
                });
            }
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Visual Audit", "facility");
        insertEscaChecklistRow(enhancedFields, "outageStatus");
        insertToolLabel(enhancedFields, "NMS Skin", "rxPower");
        insertNoteRow(enhancedFields, "toolLabel-nms-skin");
        insertToolLabel(enhancedFields, "BSMP/Clearview", "cvReading");
        insertToolLabel(enhancedFields, "DMS", "dmsInternetStatus");
        insertToolLabel(enhancedFields, "Probe & Troubleshoot", "connectionMethod");
        insertToolLabel(enhancedFields, "CEP Investigation Tagging", "investigation1");
        insertToolLabel(enhancedFields, "Ticket Details", "cepCaseNumber");
        insertToolLabel(enhancedFields, "Special Instructions", "contactName");
        insertToolLabel(enhancedFields, "Cross-Sell/Upsell", "upsell");
        
        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "facility" ? "table-row" : "none";

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "noteRow") {
                const row = document.createElement("tr");
                row.classList.add("note-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const checklistDiv = document.createElement("div");
                checklistDiv.className = "form2DivPrompt";

                const noteHeader = document.createElement("p");
                noteHeader.textContent = "Note:";
                noteHeader.className = "note-header";
                checklistDiv.appendChild(noteHeader);

                const ulNote = document.createElement("ul");
                ulNote.className = "note";

                const li1 = document.createElement("li");
                li1.textContent = "Between NMS Skin and SMP/Clearview, always prioritize the RX parameter with lower value and ignore the zero value. If both have zero value, check RX parameter via DMS.";
                ulNote.appendChild(li1);

                const li2 = document.createElement("li");
                li2.textContent = "All Wi-Fi 5 and Wi-Fi 6 modems have Band Steering enabled by default.";
                ulNote.appendChild(li2);

                const li3 = document.createElement("li");
                li3.textContent = "If using laptop or desktop, advise customer to type “netsh wlan show driver” at command prompt and check Radio types supported IEEE Standard.";
                ulNote.appendChild(li3);

                const li4 = document.createElement("li");
                li4.textContent = "If using mobile, check the reference table in the work instruction for common devices.";
                ulNote.appendChild(li4);

                const li5 = document.createElement("li");
                li5.textContent = "If not listed in the reference table, advise customer to search via internet for the Device Specs or go to www.gsmarena.com (type the device name and model > select the device > scroll down at Comms > then see WLAN section for the Wi-Fi standard).";
                ulNote.appendChild(li5);

                const li6 = document.createElement("li");
                li6.textContent = "Before running a speed test, ensure the device is connected to the 5 GHz Wi-Fi frequency and positioned close to the modem. Make sure no other applications or activities are running on the device during the test.";
                ulNote.appendChild(li6);

                const li7 = document.createElement("li");
                li7.textContent = "Speed Test can also be done via DMS if customer can't follow or refused the instruction.";
                ulNote.appendChild(li7);

                checklistDiv.appendChild(ulNote);

                td.appendChild(checklistDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "toolLabel") {
                const toolLabelRow = document.createElement("tr");
                toolLabelRow.classList.add("tool-label-row");
                toolLabelRow.dataset.relatedTo = field.relatedTo;
                toolLabelRow.style.display = "none";

                const td = document.createElement("td");
                const div = document.createElement("div");
                div.className = "formToolLabel";
                div.textContent = field.label.replace(/^\/\/\s*/, "");

                td.appendChild(div);
                toolLabelRow.appendChild(td);
                return toolLabelRow;
            } else if (field.type === "escaChecklistRow") {
                const row = document.createElement("tr");
                row.classList.add("esca-checklist-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const checklistDiv = document.createElement("div");
                checklistDiv.className = "form2DivPrompt";

                const checklistHeader = document.createElement("p");
                checklistHeader.textContent = "L2/Zone/Network Escalation Checklist:";
                checklistHeader.className = "esca-checklist-header";
                checklistDiv.appendChild(checklistHeader);

                const ulChecklist = document.createElement("ul");
                ulChecklist.className = "esca-checklist";

                const li6 = document.createElement("li");
                li6.textContent = "Complaint Coverage Checking";
                ulChecklist.appendChild(li6);

                const li7 = document.createElement("li");
                li7.textContent = "Option 82 Checking";
                ulChecklist.appendChild(li7);

                const li8 = document.createElement("li");
                li8.textContent = "RX Parameter Result";
                ulChecklist.appendChild(li8);

                const li9 = document.createElement("li");
                li9.textContent = "Network Downtime Checking";
                ulChecklist.appendChild(li9);

                const li10 = document.createElement("li");
                li10.textContent = "Slowdown during Peak Hour Checking";
                ulChecklist.appendChild(li10);

                const li11 = document.createElement("li");
                li11.textContent = "Rogue/Degraded ONU/Degraded Link Checking";
                ulChecklist.appendChild(li11);

                const li12 = document.createElement("li");
                li12.textContent = "Bandwidth Code Checking";
                ulChecklist.appendChild(li12);

                const li13 = document.createElement("li");
                li13.textContent = "Performed RA/Restart/Self-Heal";
                ulChecklist.appendChild(li13);

                const li14 = document.createElement("li");
                li14.textContent = "ONU and Device Brand and Model";
                ulChecklist.appendChild(li14);

                const li15 = document.createElement("li");
                li15.textContent = "ONU and Device Max WiFi Speed Checking";
                ulChecklist.appendChild(li15);

                const li16 = document.createElement("li");
                li16.textContent = "5G WiFi Frequency Checking";
                ulChecklist.appendChild(li16);

                const li17 = document.createElement("li");
                li17.textContent = "Activities Performed Checking";
                ulChecklist.appendChild(li17);

                const li18 = document.createElement("li");
                li18.textContent = "Connected Devices Result";
                ulChecklist.appendChild(li18);

                const li19 = document.createElement("li");
                li19.textContent = "Ping Test Result";
                ulChecklist.appendChild(li19);

                const li20 = document.createElement("li");
                li20.textContent = "NMS Skin Result";
                ulChecklist.appendChild(li20);

                const li21 = document.createElement("li");
                li21.textContent = "Clear View Result";
                ulChecklist.appendChild(li21);

                checklistDiv.appendChild(ulChecklist);

                const checklistInstruction = document.createElement("p");
                checklistInstruction.textContent = "Note: It is not necessary to complete every item in this escalation checklist. Refer to the LIT365 work instructions for proper guidance.\n\nMaintain clear and detailed documentation to prevent potential misdiagnosis.";
                checklistInstruction.className = "esca-checklist-instruction";
                checklistDiv.appendChild(checklistInstruction);

                td.appendChild(checklistDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") ? 6 : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }
        
        table.appendChild(createInstructionsRow()); 
        enhancedFields.forEach(field => table.appendChild(createFieldRow(field))); 

        function updateToolLabelVisibility() {
            const updateVisibility = (selector) => {
                document.querySelectorAll(selector).forEach(row => {
                    const relatedNamesRaw = row.dataset.relatedTo || "";
                    const relatedNames = relatedNamesRaw.split(",").map(s => s.trim()).filter(Boolean);

                    const shouldShow = relatedNames.some(name => {
                        const relatedInput = document.querySelector(`[name="${name}"]`);
                        if (!relatedInput) return false;
                        const relatedRow = relatedInput.closest("tr");
                        return relatedRow && relatedRow.style.display !== "none";
                    });

                    row.style.display = shouldShow ? "table-row" : "none";
                });
            };

            updateVisibility(".tool-label-row");
            updateVisibility(".note-row");
            updateVisibility(".esca-checklist-row");
        }

        updateToolLabelVisibility();

        form2Container.appendChild(table);

        const buttonLabels = ["CEP", "SF/FUSE", "Endorse", "SF Tagging", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            ffupButtonHandler, 
            techNotesButtonHandler,
            endorsementForm, 
            sfTaggingButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];

        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const facility = document.querySelector("[name='facility']");
        facility.addEventListener("change", () => {
            resetAllFields(["facility"]);
            if (facility.value === "Fiber") {
                showFields(["outageStatus"]);
                hideSpecificFields(["resType", "planDetails", "outageReference", "pcNumber", "onuSerialNum", "rxPower", "option82Config", "saaaBandwidthCode", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "onuModel", "dmsInternetStatus", "deviceWifiBand", "bandsteering", "dmsRemarks", "connectionMethod", "deviceBrandAndModel", "pingTestResult", "speedTestResult", "actualExp", "remarks", "issueResolved", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
                updateToolLabelVisibility(); 
            } else if (facility.value === "Fiber - Radius") {
                showFields(["planDetails", "connectionMethod", "pingTestResult", "speedTestResult", "remarks", "issueResolved"]);
                hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "rxPower", "option82Config", "saaaBandwidthCode", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "onuModel", "dmsInternetStatus", "deviceWifiBand", "bandsteering", "dmsRemarks", "connectionMethod", "deviceBrandAndModel", "pingTestResult", "speedTestResult", "actualExp", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
            } else if (facility.value === "Copper VDSL") {
                showFields(["resType"]);
                hideSpecificFields(["planDetails", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "rxPower", "option82Config", "saaaBandwidthCode", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "onuModel", "dmsInternetStatus", "deviceWifiBand", "bandsteering", "dmsRemarks", "connectionMethod", "deviceBrandAndModel", "pingTestResult", "speedTestResult", "actualExp", "remarks","issueResolved", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            } else {
                showFields(["remarks"]);
                hideSpecificFields(["resType", "planDetails", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "rxPower", "option82Config", "saaaBandwidthCode", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "onuModel", "dmsInternetStatus", "deviceWifiBand", "bandsteering", "dmsRemarks", "connectionMethod", "deviceBrandAndModel", "pingTestResult", "speedTestResult", "investigation1", "investigation2", "investigation3", "investigation4", "actualExp", "resolution", "testedOk" ,"issueResolved", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
            }
            updateToolLabelVisibility(); 
        });
    
        const resType = document.querySelector("[name='resType']");
        resType.addEventListener("change", () => {
            resetAllFields(["facility", "resType"]);
            if (resType.value === "Yes") {
                showFields(["outageStatus"]);
                hideSpecificFields(["planDetails", "outageReference", "pcNumber", "onuSerialNum", "rxPower", "option82Config", "saaaBandwidthCode", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "onuModel", "dmsInternetStatus", "deviceWifiBand", "bandsteering", "dmsRemarks", "connectionMethod", "deviceBrandAndModel", "pingTestResult", "speedTestResult", "actualExp", "remarks", "issueResolved", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
            } else {
                showFields(["remarks"]);
                hideSpecificFields(["planDetails", "outageStatus", "outageReference", "pcNumber", "onuSerialNum", "rxPower", "option82Config", "saaaBandwidthCode", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "onuModel", "dmsInternetStatus", "deviceWifiBand", "bandsteering", "dmsRemarks", "connectionMethod", "deviceBrandAndModel", "pingTestResult", "speedTestResult", "actualExp", "issueResolved", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);
            }
            updateToolLabelVisibility(); 
        });

        const outageStatus = document.querySelector("[name='outageStatus']");
        outageStatus.addEventListener("change", () => {
            resetAllFields(["facility", "resType", "outageStatus"]);
            if (outageStatus.value === "Yes") {
                showFields(["outageReference", "pcNumber", "remarks", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "rptCount", "upsell"]);
                hideSpecificFields(["planDetails", "onuSerialNum", "rxPower", "option82Config", "saaaBandwidthCode", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "onuModel", "dmsInternetStatus", "deviceWifiBand", "bandsteering", "dmsRemarks", "connectionMethod", "deviceBrandAndModel", "pingTestResult", "speedTestResult", "actualExp", "issueResolved", "testedOk", "availability", "address", "landmarks", "productsOffered", "declineReason", "notEligibleReason"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            } else {
                if (facility.value === "Fiber") {
                    showFields(["planDetails", "onuSerialNum", "rxPower", "option82Config", "saaaBandwidthCode", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "onuModel", "dmsInternetStatus", "deviceWifiBand", "bandsteering", "dmsRemarks", "connectionMethod", "pingTestResult", "speedTestResult", "actualExp", "remarks", "issueResolved"]);
                    hideSpecificFields(["resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "outageReference", "pcNumber", "deviceBrandAndModel", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);

                } else {
                    showFields(["planDetails", "connectionMethod", "pingTestResult", "speedTestResult", "remarks", "issueResolved"]);
                    hideSpecificFields(["outageReference", "pcNumber", "onuSerialNum", "rxPower", "option82Config", "saaaBandwidthCode", "connectedDevices", "nmsSkinRemarks", "cvReading", "rtaRequest", "onuModel", "dmsInternetStatus", "deviceWifiBand", "bandsteering", "dmsRemarks", "deviceBrandAndModel", "actualExp", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell", "productsOffered", "declineReason", "notEligibleReason"]);   
                }
                updateToolLabelVisibility(); 
            }

            updateToolLabelVisibility(); 
        });

        const connectionMethod = document.querySelector("[name='connectionMethod']");
        connectionMethod.addEventListener("change", () => {
            if (connectionMethod.value === "WiFi") {
                showFields(["deviceBrandAndModel"]);
            } else {
                hideSpecificFields(["deviceBrandAndModel"]);
            }
        });

        const issueResolved = document.querySelector("[name='issueResolved']");
        issueResolved.addEventListener("change", () => {
            if (issueResolved.selectedIndex === 2) {
                showFields(["investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                    hideSpecificFields(["testedOk"]);
                } else {
                    showFields(["testedOk"]);
                    hideSpecificFields(["resolution"]);
                }
            } else {
                showFields(["upsell"]);
                hideSpecificFields(["testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            }
            updateToolLabelVisibility();
        });

        const upsell = document.querySelector("[name='upsell']");
        upsell.addEventListener("change", () => {

            showFields(["productsOffered"]);
            if (upsell.selectedIndex === 1 || upsell.selectedIndex === 2) {
                hideSpecificFields(["declineReason", "notEligibleReason"]);
            } else if (upsell.selectedIndex === 3) {
                showFields(["declineReason"]);
                hideSpecificFields(["notEligibleReason"]);
            } else if (upsell.selectedIndex === 4) {
                hideSpecificFields(["declineReason", "notEligibleReason"]);
            } else if (upsell.selectedIndex === 5) {
                showFields(["notEligibleReason"]);
                hideSpecificFields(["productsOffered", "declineReason"]);
            }
        });

        const resolution = document.querySelector("[name='resolution']");
        const testedOk = document.querySelector("[name='testedOk']");
        function testedOkReso() {
            if (resolution.value === "Tested Ok" || testedOk.value === "Yes") {
                hideSpecificFields(["availability", "address", "landmarks"]);
            } else {
                showFields(["availability", "address", "landmarks"]);
            }
            updateToolLabelVisibility();
        }

        resolution.addEventListener("change", testedOkReso);
        testedOk.addEventListener("change", testedOkReso);

        updateToolLabelVisibility();
    } else if (selectedValue === "form501_5" || selectedValue === "form501_6") { 
        const table = document.createElement("table");

        const fields = [
            // Visual Audit
            { label: "Network Outage", type: "select", name: "outageStatus", options: ["", "Yes", "No"]},
            { label: "Source Reference", type: "select", name: "outageReference", options: [
                "— Network Outage Source —", 
                "FUSE Outage Tab", 
                "Lit365 Downtime Advisory",
                "Clearview",
                "CEP Affected Services Tab"
            ]},
            { label: "Parent Case", type: "text", name: "pcNumber", placeholder: "Leave blank if Awaiting Parent Case"},
            { label: "Modem/ONU Serial # (L2)", type: "text", name: "onuSerialNum", placeholder: "Available in FUSE/CV/DMS."},
            // BSMP/Clearview
            { label: "SMP/Clearview Reading", type: "textarea", name: "cvReading", placeholder: "e.g. Line Problem Detected - OLT to LCP, LCP to NAP, NAP to ONU" },
            { label: "Latest RTA Request (L2)", type: "text", name: "rtaRequest"},
            // NMS Skin
            { label: "RX Power", type: "number", name: "rxPower", step: "any"},
            // Probing & Remote Troubleshooting
            { label: "Specific Timeframe", type: "text", name: "specificTimeframe", placeholder: "High latency/lag is being experienced."},
            { label: "Ping Test Result", type: "text", name: "pingTestResult", placeholder: "Speedtest"},
            { label: "Game Name and Server", type: "text", name: "gameNameAndServer", placeholder: "e.g. Dota2 - Singapore server"},
            { label: "Game Server IP Address", type: "text", name: "gameServerIP", placeholder: "e.g. 103.10.124.118"},
            { label: "Ping Test Result", type: "text", name: "pingTestResult2", placeholder: "Game Server IP Address"},
            { label: "Traceroute PLDT side (Game Server IP Address)", type: "textarea", name: "traceroutePLDT", placeholder: "Hops with static.pldt.net suffix results. e.g. Hop 3 = PASS, Hop 4 = FAIL(RTO), Hop 5 = FAIL (42 ms), etc." },
            { label: "Traceroute External side (Game Server IP Address)", type: "textarea", name: "tracerouteExt", placeholder: "Last Hop Result. e.g. Hop 10 = PASS" },
            { label: "Other Actions Taken/ Troubleshooting/ Remarks", type: "textarea", name: "remarks", placeholder: "Ensure that all actions performed in each tool are properly documented. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "Issue Resolved? (Y/N)", type: "select", name: "issueResolved", options: [
                "", 
                "Yes", 
                "No - for Ticket Creation",
                "No - Customer is Unresponsive",
                "No - Customer is Not At Home",
                "No - Customer Declined Further Assistance",
                "No - System Ended Chat"
            ] },
            { label: "FLM Findings / Resolution", type: "select", name: "resolution", options: [
                "",
                "Webpage Not Loading",
                "Failed RX",
                "High Latency / Ping",
                "Network / Outage",
                "Zone"
            ]},
            // CEP Investigation Tagging
            { label: "Investigation 1", type: "select", name: "investigation1", options: [
                "— Modem Light Status —",
                "Normal Status",
                "Unable to provide information"
            ]},
            { label: "Investigation 2", type: "select", name: "investigation2", options: [
                "— NMS Parameters —",
                "Failed RX",
                " Passed RX" ,
                "Up/Active"
            ]},
            { label: "Investigation 3", type: "select", name: "investigation3", options: [
                "— Clearview Reading —",
                "Severely Degraded",
                "The ONU performance is degraded",
                "Without Line Problem Detected",
                "Others/Error Code"
            ]},
            { label: "Investigation 4", type: "select", name: "investigation4", options: [
                "— Select applicable Investigation 4 —",
                "Individual Trouble",
                "Network Trouble - High Latency",
                "Network Trouble - Slow/Intermittent Browsing",
                "High Latency",
                "Cannot Reach Specific Website"
            ]},
            // Ticket Details
            { label: "CEP Case Number", type: "number", name: "cepCaseNumber" },
            { label: "SLA / ETR", type: "text", name: "sla" },
            // Special Instructions
            { label: "Contact Person", type: "text", name: "contactName" },
            { label: "Contact Number", type: "number", name: "cbr" },
            { label: "Preferred Date & Time", type: "text", name: "availability" },
            { label: "Address", type: "textarea", name: "address" },
            { label: "Landmarks", type: "textarea", name: "landmarks" },
            { label: "Repeats w/in 30 Days", type: "text", name: "rptCount"},
            // Cross-Sell/Upsell
            { label: "Upsell", type: "select", name: "upsell", options: [
                "", 
                "Yes - Accepted", 
                "No - Declined",
                "No - Ignored",
                "NA - Not Eligible"
            ]},
        ];

        function createInstructionsRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const instructionsDiv = document.createElement("div");
            instructionsDiv.className = "form2DivInstructions"; 

            const header = document.createElement("p");
            header.textContent = "Reference Link";
            header.className = "instructions-header";
            instructionsDiv.appendChild(header);

            const ul = document.createElement("ul");
            ul.className = "instructions-list";

            const li5 = document.createElement("li");
            li5.textContent = "See ";

            const link1 = document.createElement("a");

            let url1 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            }

            link1.textContent = "CEP: Troubleshooting Guide";
            link1.style.color = "lightblue";
            link1.href = "#";

            link1.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url1, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li5.appendChild(link1);
            li5.appendChild(document.createTextNode(" for Main PLDT Repair Work Instruction"));
            ul.appendChild(li5);

            const li6 = document.createElement("li");
            li6.textContent = "See ";

            const link2 = document.createElement("a");

            let url2 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            }

            link2.textContent = "Gamma: Troubleshooting Guide";
            link2.style.color = "lightblue";
            link2.href = "#";

            link2.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url2, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li6.appendChild(link2);
            li6.appendChild(document.createTextNode(" for Main Gamma Repair Work Instruction"));
            ul.appendChild(li6);

            instructionsDiv.appendChild(ul);

            td.appendChild(instructionsDiv);
            row.appendChild(td);

            return row;
        }

        function insertNoteRow(fields, toolLabelName) {
            const index = fields.findIndex(f => f.name === toolLabelName);
            if (index !== -1) {
                fields.splice(index + 1, 0, { // 👈 insert AFTER the tool label
                    type: "noteRow",
                    name: "probingChecklist",
                    relatedTo: "rxPower"
                });
            } else {
                console.warn(`insertNoteRow: Tool label "${toolLabelName}" not found.`);
            }
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName 
                }
            );
        }

        function insertEscaChecklistRow(fields, relatedFieldName) {
            const index = fields.findIndex(f => f.name === relatedFieldName);
            if (index !== -1) {
                fields.splice(index, 0, {
                    type: "escaChecklistRow",
                    name: "escaChecklist",
                    relatedTo: relatedFieldName
                });
            }
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Visual Audit", "outageStatus");
        insertEscaChecklistRow(enhancedFields, "outageStatus");
        insertToolLabel(enhancedFields, "NMS Skin", "rxPower");
        insertToolLabel(enhancedFields, "BSMP/Clearview Reading", "cvReading");
        insertToolLabel(enhancedFields, "Probe & Troubleshoot", "specificTimeframe");
        insertNoteRow(enhancedFields, "toolLabel-probing-&-troubleshooting");
        insertToolLabel(enhancedFields, "CEP Investigation Tagging", "investigation1");
        insertToolLabel(enhancedFields, "Ticket Details", "cepCaseNumber");
        insertToolLabel(enhancedFields, "Special Instructions", "contactName");
        insertToolLabel(enhancedFields, "Cross-Sell/Upsell", "upsell");
        
        function createFieldRow(field) {
            const row = document.createElement("tr");
            const showFields = ["outageStatus"];

            row.style.display = showFields.includes(field.name) ? "table-row" : "none";

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "noteRow") {
                const row = document.createElement("tr");
                row.classList.add("note-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const checklistDiv = document.createElement("div");
                checklistDiv.className = "form2DivPrompt";

                const noteHeader = document.createElement("p");
                noteHeader.textContent = "Note:";
                noteHeader.className = "note-header";
                checklistDiv.appendChild(noteHeader);

                const ulNote = document.createElement("ul");
                ulNote.className = "note";

                const li1 = document.createElement("li");
                li1.textContent = "Between NMS Skin and SMP/Clearview, always prioritize the RX parameter with lower value and ignore the zero value. If both have zero value, check RX parameter via DMS.";
                ulNote.appendChild(li1);

                const li2 = document.createElement("li");
                li2.textContent = "Via Wi-Fi: Ensure that device is connected via 5G WiFi frequency and near the modem.";
                ulNote.appendChild(li2);

                const li3 = document.createElement("li");
                li3.textContent = "Via Wi-Fi or LAN: Make sure that there are no other activities performed in the device that will conduct speedtest.";
                ulNote.appendChild(li3);

                const li4 = document.createElement("li");
                li4.textContent = "Make sure that no other devices/user is connected in the modem";
                ulNote.appendChild(li4);

                const li5 = document.createElement("li");
                li5.textContent = "If with multiple devices are connected, advise customer to isolate connection before performing speedtest";
                ulNote.appendChild(li5);

                const li6 = document.createElement("li");
                li6.textContent = "If DMS is not available, advise the customer to open command prompt, type “ping <IP address of the game server>” for ping, press enter (to check for Packet Loss). Type “tracert <IP address of the game server>” for trace route, press enter (to check for hop with High Latency) and ask the results.";
                ulNote.appendChild(li6);

                const li7 = document.createElement("li");
                li7.textContent = "Indicate Game Name and Server, Game Server IP Address, Ping (Game Server IP Address) <%loss and average ms> Example: 0% loss (32ms), Traceroute PLDT side (Game Server IP Address), Traceroute External side (Game Server IP Address) parameters in Case Notes in Timeline: ";
                ulNote.appendChild(li7);

                checklistDiv.appendChild(ulNote);

                td.appendChild(checklistDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "toolLabel") {
                const toolLabelRow = document.createElement("tr");
                toolLabelRow.classList.add("tool-label-row");
                toolLabelRow.dataset.relatedTo = field.relatedTo;
                toolLabelRow.style.display = "none";

                const td = document.createElement("td");
                const div = document.createElement("div");
                div.className = "formToolLabel";
                div.textContent = field.label.replace(/^\/\/\s*/, "");

                td.appendChild(div);
                toolLabelRow.appendChild(td);
                return toolLabelRow;
            } else if (field.type === "escaChecklistRow") {
                const row = document.createElement("tr");
                row.classList.add("esca-checklist-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const checklistDiv = document.createElement("div");
                checklistDiv.className = "form2DivPrompt";

                const checklistHeader = document.createElement("p");
                checklistHeader.textContent = "Network Escalation Checklist:";
                checklistHeader.className = "esca-checklist-header";
                checklistDiv.appendChild(checklistHeader);

                const ulChecklist = document.createElement("ul");
                ulChecklist.className = "esca-checklist";

                const li6 = document.createElement("li");
                li6.textContent = "Network Downtime Checking";
                ulChecklist.appendChild(li6);

                const li7 = document.createElement("li");
                li7.textContent = "RX Parameter Result";
                ulChecklist.appendChild(li7);

                const li8 = document.createElement("li");
                li8.textContent = "Slowdown during Peak Hour Checking";
                ulChecklist.appendChild(li8);

                const li9 = document.createElement("li");
                li9.textContent = "5G WiFi Frequency Checking";
                ulChecklist.appendChild(li9);

                const li10 = document.createElement("li");
                li10.textContent = "Activities Performed Checking";
                ulChecklist.appendChild(li10);

                const li11 = document.createElement("li");
                li11.textContent = "Connected Devices Result";
                ulChecklist.appendChild(li11);

                const li12 = document.createElement("li");
                li12.textContent = "Speed Test Ping Result";
                ulChecklist.appendChild(li12);

                const li13 = document.createElement("li");
                li13.textContent = "NMS Skin Result";
                ulChecklist.appendChild(li13);

                const li14 = document.createElement("li");
                li14.textContent = "Clear View Result";
                ulChecklist.appendChild(li14);

                const li15 = document.createElement("li");
                li15.textContent = "Game Name and Server";
                ulChecklist.appendChild(li15);

                const li16 = document.createElement("li");
                li16.textContent = "Game Server IP Address";
                ulChecklist.appendChild(li16);

                const li17 = document.createElement("li");
                li17.textContent = "Ping (Game Server IP Address)";
                ulChecklist.appendChild(li17);

                const li18 = document.createElement("li");
                li18.textContent = "Traceroute PLDT side (Game Server IP Address)";
                ulChecklist.appendChild(li18);

                const li19 = document.createElement("li");
                li19.textContent = "Traceroute External side (Game Server IP Address)";
                ulChecklist.appendChild(li19);

                checklistDiv.appendChild(ulChecklist);

                const checklistInstruction = document.createElement("p");
                checklistInstruction.textContent = "Note: It is not necessary to complete every item in this escalation checklist. Refer to the LIT365 work instructions for proper guidance.\n\nMaintain clear and detailed documentation to prevent potential misdiagnosis.";
                checklistInstruction.className = "esca-checklist-instruction";
                checklistDiv.appendChild(checklistInstruction);

                td.appendChild(checklistDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") ? 5 : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }
        
        table.appendChild(createInstructionsRow()); 
        enhancedFields.forEach(field => table.appendChild(createFieldRow(field))); 

        function updateToolLabelVisibility() {
            const updateVisibility = (selector) => {
                document.querySelectorAll(selector).forEach(row => {
                    const relatedNamesRaw = row.dataset.relatedTo || "";
                    const relatedNames = relatedNamesRaw.split(",").map(s => s.trim()).filter(Boolean);

                    const shouldShow = relatedNames.some(name => {
                        const relatedInput = document.querySelector(`[name="${name}"]`);
                        if (!relatedInput) return false;
                        const relatedRow = relatedInput.closest("tr");
                        return relatedRow && relatedRow.style.display !== "none";
                    });

                    row.style.display = shouldShow ? "table-row" : "none";
                });
            };

            updateVisibility(".tool-label-row");

            document.querySelectorAll(".note-row").forEach(row => {
                const outageStatusInput = document.querySelector('[name="outageStatus"]');
                const outageStatusValue = outageStatusInput ? outageStatusInput.value.trim().toLowerCase() : "";

                if (outageStatusValue === "no") {
                    row.style.display = "table-row";
                } else {
                    row.style.display = "none";
                }
            });

            document.querySelectorAll(".esca-checklist-row").forEach(row => {
                const outageStatusInput = document.querySelector('[name="outageStatus"]');
                const outageStatusValue = outageStatusInput ? outageStatusInput.value.trim().toLowerCase() : "";

                if (outageStatusValue === "yes") {
                    row.style.display = "none";
                } else {
                    const relatedNamesRaw = row.dataset.relatedTo || "";
                    const relatedNames = relatedNamesRaw.split(",").map(s => s.trim()).filter(Boolean);

                    const shouldShow = relatedNames.some(name => {
                        const relatedInput = document.querySelector(`[name="${name}"]`);
                        if (!relatedInput) return false;
                        const relatedRow = relatedInput.closest("tr");
                        return relatedRow && relatedRow.style.display !== "none";
                    });

                    row.style.display = shouldShow ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["CEP", "SF/FUSE", "Endorse", "SF Tagging", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            ffupButtonHandler, 
            techNotesButtonHandler,
            endorsementForm, 
            sfTaggingButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];

        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const outageStatus = document.querySelector("[name='outageStatus']");
        const issueResolved = document.querySelector("[name='issueResolved']");

        outageStatus.addEventListener("change", () => {
            resetAllFields(["outageStatus"]);
            if (outageStatus.value === "Yes") {
                showFields(["outageReference", "pcNumber", "remarks", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "rptCount", "upsell"]);
                hideSpecificFields(["onuSerialNum", "rxPower", "cvReading", "rtaRequest", "specificTimeframe", "pingTestResult", "gameNameAndServer", "gameServerIP", "pingTestResult2", "traceroutePLDT", "tracerouteExt", "issueResolved", "availability", "address", "landmarks"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            } else if (outageStatus.value === "No") {
                showFields(["onuSerialNum", "rxPower", "cvReading", "rtaRequest", "specificTimeframe", "pingTestResult", "gameNameAndServer", "gameServerIP", "pingTestResult2", "traceroutePLDT", "tracerouteExt", "remarks", "issueResolved"]);
                hideSpecificFields(["outageReference", "pcNumber", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            }
            updateToolLabelVisibility();
        });
    
        issueResolved.addEventListener("change", () => {
            if (issueResolved.selectedIndex === 2) {
                showFields(["investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            } else {
                showFields(["upsell"]);
                hideSpecificFields(["investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount"]);
            }

            if (caseOriginField.value === "CDT-SOCMED") {
                showFields(["resolution"]);
            } else {
                hideSpecificFields(["resolution"]);
            }
            updateToolLabelVisibility(); 
        });

        updateToolLabelVisibility();

    } else if (selectiveBrowseForms.includes(selectedValue)) { 
        const table = document.createElement("table");

        const fields = [
            // Visual Audit
            { label: "Account/Facility Type", type: "select", name: "facility", options: [
                "", 
                "Fiber", 
                "Fiber - Radius", 
                "Copper VDSL", 
                "Copper HDSL/NGN" 
            ]},
            { label: "Res. Vertical Address", type: "select", name: "resType", options: [
                "Bldg., Condo, etc.", 
                "Yes", 
                "No"
            ]},
            { label: "Network Outage", type: "select", name: "outageStatus", options: ["", "Yes", "No"]},
            { label: "Source Reference", type: "select", name: "outageReference", options: [
                "— Network Outage Source —", 
                "FUSE Outage Tab", 
                "Lit365 Downtime Advisory",
                "Clearview",
                "CEP Affected Services Tab"
            ]},
            { label: "Parent Case", type: "text", name: "pcNumber", placeholder: "Leave blank if Awaiting Parent Case"},
            // NMS Skin
            { label: "RX Power (L2)", type: "number", name: "rxPower", step: "any"},
            { label: "IP Address (L2)", type: "text", name: "ipAddress"},
            // DMS
            { label: "Internet/Data Status(L2)", type: "select", name: "dmsInternetStatus", options: ["", "Online", "Offline" ]},
            { label: "Connected Devices (L2)", type: "text", name: "connectedDevices"},
            // Probe & Troubleshoot
            { label: "Website/App/VPN Name", type: "textarea", name: "websiteURL", placeholder: "Complete site address or name of Application or VPN"}, 
            { label: "Error Message (L2)", type: "textarea", name: "errMsg", placeholder: "Error when accessing site, Application or VPN"},
            { label: "Other Device/Browser Test?", type: "select", name: "otherDevice", options: [
                "",
                "Yes - Working on Other Devices",
                "Yes - Working on Other Browsers",
                "Yes - Working on Other Devices and Browsers",
                "Yes - Not Working",
                "No Other Device or Browser Available"
            ] },
            { label: "VPN Blocking Issue? (L2)", type: "select", name: "vpnBlocking", options: [
                "", 
                "Yes", 
                "No"
            ] },
            { label: "Access Requires VPN? (L2)", type: "select", name: "vpnRequired", options: [
                "", 
                "Yes", 
                "No"
            ] },
            { label: "Result w/ Other ISP (L2)", type: "select", name: "otherISP", options: [
                "", 
                "Yes - Working", 
                "Yes - Not Working", 
                "No Other ISP"
            ] },
            { label: "Has IT Support? (L2)", type: "select", name: "itSupport", options: [
                "", 
                "Yes", 
                "None"
            ] },
            { label: "IT Support Remarks (L2)", type: "textarea", name: "itRemarks" },
            { label: "Other Actions Taken/ Troubleshooting/ Remarks", type: "textarea", name: "remarks", placeholder: "Ensure that all actions performed in each tool are properly documented. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "Issue Resolved? (Y/N)", type: "select", name: "issueResolved", options: [
                "", 
                "Yes", 
                "No - for Ticket Creation",
                "No - Customer is Unresponsive",
                "No - Customer is Not At Home",
                "No - Customer Declined Further Assistance",
                "No - System Ended Chat"
            ] },
            { label: "FLM Findings / Resolution", type: "select", name: "resolution", options: [
                "",
                "Tested Ok",
                "Manual Troubleshooting",
                "Request Timed Out",
                "Webpage Not Loading"
            ]},
            { label: "Tested Ok? (Y/N)", type: "select", name: "testedOk", options: [
                "", 
                "Yes", 
                "No"
            ] },
            // CEP Investigation Tagging
            { label: "Investigation 1", type: "select", name: "investigation1", options: [
                "— Modem Light Status —",
                "Normal Status",
                "Not Applicable [via Store]",
                "Unable to provide information"
            ]},
            { label: "Investigation 2", type: "select", name: "investigation2", options: [
                "— NMS Parameters —",
                "Up/Active",
                "Not Applicable [via Store]",
            ]},
            { label: "Investigation 3", type: "select", name: "investigation3", options: [
                "— Clearview Reading —",
                "The ONU performance is degraded",
                "Without Line Problem Detected",
            ]},
            { label: "Investigation 4", type: "select", name: "investigation4", options: [
                "— Select applicable Investigation 4 —",
                "Network Trouble - Selective Browsing",
                "Cannot Reach Specific Website",
                "FCR - Cannot Browse",
                "Not Applicable [via Store]",
            ]},
            // Ticket Details
            { label: "CEP Case Number", type: "number", name: "cepCaseNumber" },
            { label: "SLA / ETR", type: "text", name: "sla" },
            // Special Instructions
            { label: "Contact Person", type: "text", name: "contactName" },
            { label: "Contact Number", type: "number", name: "cbr" },
            { label: "Preferred Date & Time", type: "text", name: "availability" },
            { label: "Address", type: "textarea", name: "address" },
            { label: "Landmarks", type: "textarea", name: "landmarks" },
            { label: "Repeats w/in 30 Days", type: "text", name: "rptCount"},
            // Cross-Sell/Upsell
            { label: "Upsell", type: "select", name: "upsell", options: [
                "", 
                "Yes - Accepted", 
                "No - Declined",
                "No - Ignored",
                "NA - Not Eligible"
            ]},
        ];

        function createInstructionsRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const instructionsDiv = document.createElement("div");
            instructionsDiv.className = "form2DivInstructions"; 

            const header = document.createElement("p");
            header.textContent = "Reference Link";
            header.className = "instructions-header";
            instructionsDiv.appendChild(header);

            const ul = document.createElement("ul");
            ul.className = "instructions-list";

            const li5 = document.createElement("li");
            li5.textContent = "See ";

            const link1 = document.createElement("a");

            let url1 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            }

            link1.textContent = "CEP: Troubleshooting Guide";
            link1.style.color = "lightblue";
            link1.href = "#";

            link1.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url1, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li5.appendChild(link1);
            li5.appendChild(document.createTextNode(" for Main PLDT Repair Work Instruction"));
            ul.appendChild(li5);

            const li6 = document.createElement("li");
            li6.textContent = "See ";

            const link2 = document.createElement("a");

            let url2 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            }

            link2.textContent = "Gamma: Troubleshooting Guide";
            link2.style.color = "lightblue";
            link2.href = "#";

            link2.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url2, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li6.appendChild(link2);
            li6.appendChild(document.createTextNode(" for Main Gamma Repair Work Instruction"));
            ul.appendChild(li6);

            instructionsDiv.appendChild(ul);

            td.appendChild(instructionsDiv);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName 
                }
            );
        }

        function insertEscaChecklistRow(fields, relatedFieldName) {
            const index = fields.findIndex(f => f.name === relatedFieldName);
            if (index !== -1) {
                fields.splice(index, 0, {
                    type: "escaChecklistRow",
                    name: "escaChecklist",
                    relatedTo: relatedFieldName
                });
            }
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Visual Audit", "facility");
        insertEscaChecklistRow(enhancedFields, "outageStatus");
        insertToolLabel(enhancedFields, "NMS Skin", "rxPower");
        insertToolLabel(enhancedFields, "DMS", "dmsInternetStatus");
        insertToolLabel(enhancedFields, "Probe & Troubleshoot", "websiteURL");
        insertToolLabel(enhancedFields, "CEP Investigation Tagging", "investigation1");
        insertToolLabel(enhancedFields, "Ticket Details", "cepCaseNumber");
        insertToolLabel(enhancedFields, "Special Instructions", "contactName");
        insertToolLabel(enhancedFields, "Cross-Sell/Upsell", "upsell");
        
        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "facility" ? "table-row" : "none";
            // row.style.display = "table-row";

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const toolLabelRow = document.createElement("tr");
                toolLabelRow.classList.add("tool-label-row");
                toolLabelRow.dataset.relatedTo = field.relatedTo;
                toolLabelRow.style.display = "none";

                const td = document.createElement("td");
                const div = document.createElement("div");
                div.className = "formToolLabel";
                div.textContent = field.label.replace(/^\/\/\s*/, "");

                td.appendChild(div);
                toolLabelRow.appendChild(td);
                return toolLabelRow;
            } else if (field.type === "escaChecklistRow") {
                const row = document.createElement("tr");
                row.classList.add("esca-checklist-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const checklistDiv = document.createElement("div");
                checklistDiv.className = "form2DivPrompt";

                const checklistHeader = document.createElement("p");
                checklistHeader.textContent = "Network Escalation Checklist:";
                checklistHeader.className = "esca-checklist-header";
                checklistDiv.appendChild(checklistHeader);

                const ulChecklist = document.createElement("ul");
                ulChecklist.className = "esca-checklist";

                const li6 = document.createElement("li");
                li6.textContent = "Network Downtime Checking";
                ulChecklist.appendChild(li6);

                const li7 = document.createElement("li");
                li7.textContent = "Possible VPN Blocking";
                ulChecklist.appendChild(li7);

                const li8 = document.createElement("li");
                li8.textContent = "Complaint Coverage Checking";
                ulChecklist.appendChild(li8);

                const li9 = document.createElement("li");
                li9.textContent = "Possible PLDT Blocking";
                ulChecklist.appendChild(li9);

                const li10 = document.createElement("li");
                li10.textContent = "Ping/Tracert/NSlookup of Website Result";
                ulChecklist.appendChild(li10);

                const li11 = document.createElement("li");
                li11.textContent = "Performed Clear Cache";
                ulChecklist.appendChild(li11);

                const li12 = document.createElement("li");
                li12.textContent = "Other ISP Checking";
                ulChecklist.appendChild(li12);

                checklistDiv.appendChild(ulChecklist);

                const checklistInstruction = document.createElement("p");
                checklistInstruction.textContent = "Note: It is not necessary to complete every item in this escalation checklist. Refer to the LIT365 work instructions for proper guidance.\n\nMaintain clear and detailed documentation to prevent potential misdiagnosis.";
                checklistInstruction.className = "esca-checklist-instruction";
                checklistDiv.appendChild(checklistInstruction);

                td.appendChild(checklistDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") ? 5 : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }
        
        table.appendChild(createInstructionsRow()); 
        enhancedFields.forEach(field => table.appendChild(createFieldRow(field))); 

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row, .esca-checklist-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["CEP", "SF/FUSE", "Endorse", "SF Tagging", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            ffupButtonHandler, 
            techNotesButtonHandler,
            endorsementForm, 
            sfTaggingButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];

        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const facility = document.querySelector("[name='facility']");
        const resType = document.querySelector("[name='resType']");
        const outageStatus = document.querySelector("[name='outageStatus']");
        const itSupport = document.querySelector("[name='itSupport']");
        const issueResolved = document.querySelector("[name='issueResolved']");
        const resolution = document.querySelector("[name='resolution']");
        const testedOk = document.querySelector("[name='testedOk']");

        facility.addEventListener("change", () => {
            resetAllFields(["facility"]);
            if (facility.value === "Copper VDSL") {
                showFields(["resType"]);
                hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "rxPower", "ipAddress", "dmsInternetStatus", "connectedDevices", "websiteURL", "errMsg", "otherDevice", "vpnBlocking", "vpnRequired", "otherISP", "itSupport", "itRemarks", "remarks", "issueResolved", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            } else if (facility.value === "Copper HDSL/NGN") {
                showFields(["remarks"]);
                hideSpecificFields(["resType", "outageStatus", "outageReference", "pcNumber", "rxPower", "ipAddress", "dmsInternetStatus", "connectedDevices", "websiteURL", "errMsg", "otherDevice", "vpnBlocking", "vpnRequired", "otherISP", "itSupport", "itRemarks", "issueResolved", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            } else {
                showFields(["outageStatus"]);
                hideSpecificFields(["resType", "outageReference", "pcNumber", "rxPower", "ipAddress", "dmsInternetStatus", "connectedDevices", "websiteURL", "errMsg", "otherDevice", "vpnBlocking", "vpnRequired", "otherISP", "itSupport", "itRemarks", "remarks", "issueResolved", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            }
            updateToolLabelVisibility();
        });
    
        resType.addEventListener("change", () => {
            resetAllFields(["facility", "resType"]);
            if (resType.value === "Yes") {
                showFields(["outageStatus"]);
                hideSpecificFields(["outageReference", "pcNumber", "rxPower", "ipAddress", "dmsInternetStatus", "connectedDevices", "websiteURL", "errMsg", "otherDevice", "vpnBlocking", "vpnRequired", "otherISP", "itSupport", "itRemarks", "remarks", "issueResolved", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            } else {
                showFields(["remarks"]);
                hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "rxPower", "ipAddress", "dmsInternetStatus", "connectedDevices", "websiteURL", "errMsg", "otherDevice", "vpnBlocking", "vpnRequired", "otherISP", "itSupport", "itRemarks", "issueResolved", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            }

            updateToolLabelVisibility();
        });

        outageStatus.addEventListener("change", () => {
            resetAllFields(["facility", "resType", "outageStatus"]);
            if (outageStatus.value === "Yes") {
                showFields(["outageReference", "pcNumber", "remarks", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "rptCount", "upsell"]);
                hideSpecificFields(["rxPower", "ipAddress", "dmsInternetStatus", "connectedDevices", "websiteURL", "errMsg", "otherDevice", "vpnBlocking", "vpnRequired", "otherISP", "itSupport", "itRemarks", "issueResolved", "testedOk", "availability", "address", "landmarks"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            } else if (facility.value === "Fiber" && outageStatus.value === "No") {
                showFields(["rxPower", "ipAddress", "dmsInternetStatus", "connectedDevices", "websiteURL", "errMsg", "otherDevice", "vpnBlocking", "vpnRequired", "otherISP", "itSupport", "remarks", "issueResolved"]);
                hideSpecificFields(["outageReference", "pcNumber", "itRemarks", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            } else if ((facility.value === "Fiber - Radius" || facility.value === "Copper VDSL") && outageStatus.value === "No") {
                showFields(["websiteURL", "errMsg", "otherDevice", "vpnBlocking", "vpnRequired", "otherISP", "itSupport", "remarks", "issueResolved"]);
                hideSpecificFields(["outageReference", "pcNumber", "rxPower", "ipAddress", "dmsInternetStatus", "connectedDevices", "itRemarks", "resolution", "testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            }
            updateToolLabelVisibility();
        });

        itSupport.addEventListener("change", () => {
            if (itSupport.value === "Yes") {
                showFields(["itRemarks"]);
            } else {
                hideSpecificFields(["itRemarks"]);
            }
        });
    
        issueResolved.addEventListener("change", () => {
            if (issueResolved.selectedIndex === 2) {
                showFields(["investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                    hideSpecificFields(["testedOk"]);
                } else {
                    showFields(["testedOk"]);
                    hideSpecificFields(["resolution"]);
                }
            } else {
                showFields(["upsell"]);
                hideSpecificFields(["testedOk", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount"]);

                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            }
            updateToolLabelVisibility();
        });

        function testedOkReso() {
            if (resolution.value === "Tested Ok" || testedOk.value === "Yes") {
                hideSpecificFields(["availability", "address", "landmarks"]);
            } else {
                showFields(["availability", "address", "landmarks"]);
            }
            updateToolLabelVisibility();
        }

        resolution.addEventListener("change", testedOkReso);
        testedOk.addEventListener("change", testedOkReso);

        updateToolLabelVisibility();
    } else if (iptvForms.includes(selectedValue)) { 
        const table = document.createElement("table");

        const fields = [
            // Visual Audit
            { label: "Account Type", type: "select", name: "accountType", options: [
                "", 
                "PLDT", 
                "RADIUS"
            ]},
            { label: "Network Outage", type: "select", name: "outageStatus", options: ["", "Yes", "No"]},
            { label: "Source Reference", type: "select", name: "outageReference", options: [
                "— Network Outage Source —", 
                "FUSE Outage Tab", 
                "Lit365 Downtime Advisory",
                "Clearview",
                "CEP Affected Services Tab"
            ]},
            { label: "Parent Case", type: "text", name: "pcNumber", placeholder: "Leave blank if Awaiting Parent Case"},
            { label: "Equipment Brand", type: "select", name: "equipmentBrand", options: [
                "", 
                "FEOL", 
                "HUOL"
            ]},
            { label: "Modem Brand", type: "select", name: "modemBrand", options: [
                "", 
                "FHTT", 
                "HWTC", 
                "ZTEG",
                "AZRD",
                "PRLN",
                "Other Brands"
            ]},
            { label: "ONU Connection Type", type: "select", name: "onuConnectionType", options: [
                "", 
                "InterOp", 
                "Non-interOp"
            ]},
            { label: "Modem/ONU Serial # (L2)", type: "text", name: "onuSerialNum", placeholder: "Available in FUSE/CV/DMS."},
            // NMS Skin
            { label: "ONU Status/RUNSTAT", type: "select", name: "onuRunStats", options: [
                "", 
                "UP",
                "Active",
                "LOS",
                "Down",
                "Power is Off",
                "Power is Down",
                "/N/A"
            ]},
            { label: "RX Power", type: "number", name: "rxPower", step: "any"},
            { label: "WAN NAME_3", type: "text", name: "wanName_3"},
            { label: "SRVCTYPE_3", type: "text", name: "srvcType_3"},
            { label: "CONNTYPE_3", type: "text", name: "connType_3"},
            { label: "WANVLAN_3/LAN 4 Unicast", type: "text", name: "vlan_3"},
            { label: "Actions Taken in NMS Skin", type: "textarea", name: "nmsSkinRemarks", placeholder: "Include the RA and DC action results here. If no action was taken, leave this field blank." },
            // DMS
            { label: "LAN 4 Status", type: "text", name: "dmsLan4Status"},
            { label: "Actions Taken in DMS", type: "textarea", name: "dmsRemarks", placeholder: "Leave this field blank if no action was taken." }, 
            // Request for Retracking
            { label: "Request for Retracking?", type: "select", name: "req4retracking", options: ["", "Yes", "No"]},
            { label: "Set-Top-Box ID", type: "text", name: "stbID"},
            { label: "Smartcard ID", type: "text", name: "smartCardID"},
            { label: "Cignal Plan", type: "text", name: "cignalPlan"},
            { label: "Set-Top-Box IP Address", type: "text", name: "stbIpAddress"},
            { label: "Tuned Services Multicast Address", type: "textarea", name: "tsMulticastAddress"},
            { label: "Actual Experience", type: "textarea", name: "exactExp", placeholder: "Please input the customer's actual experience. e.g. “With IP but no tune service multicast” DO NOT input the WOCAS!"},
            { label: "Actions Taken/ Troubleshooting/ Remarks", type: "textarea", name: "remarks", placeholder: "Ensure that all actions performed in each tool are properly documented. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "Issue Resolved? (Y/N)", type: "select", name: "issueResolved", options: [
                "", 
                "Yes", 
                "No - for Ticket Creation",
                "No - Customer is Unresponsive",
                "No - Customer is Not At Home",
                "No - Customer Declined Further Assistance",
                "No - System Ended Chat"
            ] },
            { label: "FLM Findings / Resolution", type: "select", name: "resolution", options: [
                "",
                "Cignal Retracking",
                "Defective Cignal Accessories / Missing Cignal Accessories",
                "Defective Set Top Box / Missing Set Top Box",
                "Manual Troubleshooting",
                "Network Configuration",
                "Defective Remote Control"
            ]},
            // CEP Investigation Tagging
            { label: "Investigation 1", type: "select", name: "investigation1", options: [
                "— Modem Light Status —",
                "Normal Status",
                "Not Applicable [Defective CPE]",
                "Not Applicable [via Store]",
                "Unable to provide information"
            ]},
            { label: "Investigation 2", type: "select", name: "investigation2", options: [
                "— NMS Parameters —",
                "Not Applicable [NMS GUI]",
                "Not Applicable [via Store]",
                "Up/Active"
            ]},
            { label: "Investigation 3", type: "select", name: "investigation3", options: [
                "— Clearview Reading —",
                "Not Applicable",
                "The ONU performance is degraded",
                "Without Line Problem Detected"
            ]},
            { label: "Investigation 4", type: "select", name: "investigation4", options: [
                "— Select applicable Investigation 4 —",
                "IPTV Trouble",
                "Broken/Damaged STB/SC",
                "Cannot Read Smart Card",
                "Cignal IRN created - Missing Channels",
                "Cignal IRN created - No Audio/Video Output",
                "Cignal IRN created - Poor Audio/Video Quality",
                "Defective STB/SC/Accessories/Physical Set-up",
                "FCR - Cannot Read Smart Card",
                "FCR - Freeze",
                "FCR - Loop Back",
                "FCR - Missing Channels",
                "FCR - No Audio/Video Output w/ Test Channel",
                "FCR - Out-of-Sync",
                "FCR - Pixelated",
                "FCR - Too long to Boot Up",
                "Freeze",
                "Loop Back",
                "No Audio/Video Output w/ Test Channel",
                "No Audio/Video Output w/o Test Channel",
                "Not Applicable [via Store]",
                "Out-of-Sync",
                "Pixelated",
                "Recording Error",
                "Remote Control Issues",
                "STB Not Synched",
                "Too long to Boot Up"
            ]},
            // Ticket Details
            { label: "CEP Case Number", type: "number", name: "cepCaseNumber" },
            { label: "SLA / ETR", type: "text", name: "sla" },
            // Special Instructions
            { label: "Contact Person", type: "text", name: "contactName" },
            { label: "Contact Number", type: "number", name: "cbr" },
            { label: "Preferred Date & Time", type: "text", name: "availability" },
            { label: "Address", type: "textarea", name: "address" },
            { label: "Landmarks", type: "textarea", name: "landmarks" },
            { label: "Repeats w/in 30 Days", type: "text", name: "rptCount"},
            // Cross-Sell/Upsell
            { label: "Upsell", type: "select", name: "upsell", options: [
                "", 
                "Yes - Accepted", 
                "No - Declined",
                "No - Ignored",
                "NA - Not Eligible"
            ]},
        ];

        function createInstructionsRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const instructionsDiv = document.createElement("div");
            instructionsDiv.className = "form2DivInstructions"; 

            const header = document.createElement("p");
            header.textContent = "Reference Link";
            header.className = "instructions-header";
            instructionsDiv.appendChild(header);

            const ul = document.createElement("ul");
            ul.className = "instructions-list";

            const li5 = document.createElement("li");
            li5.textContent = "See ";

            const link1 = document.createElement("a");

            let url1 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            }

            link1.textContent = "CEP: Troubleshooting Guide";
            link1.style.color = "lightblue";
            link1.href = "#";

            link1.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url1, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li5.appendChild(link1);
            li5.appendChild(document.createTextNode(" for Main PLDT Repair Work Instruction"));
            ul.appendChild(li5);

            const li6 = document.createElement("li");
            li6.textContent = "See ";

            const link2 = document.createElement("a");

            let url2 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            }

            link2.textContent = "Gamma: Troubleshooting Guide";
            link2.style.color = "lightblue";
            link2.href = "#";

            link2.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url2, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li6.appendChild(link2);
            li6.appendChild(document.createTextNode(" for Main Gamma Repair Work Instruction"));
            ul.appendChild(li6);

            instructionsDiv.appendChild(ul);

            td.appendChild(instructionsDiv);
            row.appendChild(td);

            return row;
        }

        function insertNoteRow(fields, toolLabelName) {
            const index = fields.findIndex(f => f.name === toolLabelName);
            if (index !== -1) {
                fields.splice(index + 1, 0, {
                    type: "noteRow",
                    name: "nmsSkinChecklist",
                    relatedTo: "onuRunStats"
                });
            }
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Visual Audit", "accountType");
        insertToolLabel(enhancedFields, "NMS Skin", "onuRunStats");
        insertNoteRow(enhancedFields, "toolLabel-nms-skin");  
        insertToolLabel(enhancedFields, "DMS", "dmsLan4Status");
        insertToolLabel(enhancedFields, "Request for Retracking", "req4retracking");
        insertToolLabel(enhancedFields, "CEP Investigation Tagging", "investigation1");
        insertToolLabel(enhancedFields, "Ticket Details", "cepCaseNumber");
        insertToolLabel(enhancedFields, "Special Instructions", "contactName");
        insertToolLabel(enhancedFields, "Cross-Sell/Upsell", "upsell");
        
        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = field.name === "accountType" ? "table-row" : "none"; 

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "noteRow") {
                const row = document.createElement("tr");
                row.classList.add("note-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const noteDiv = document.createElement("div");
                noteDiv.className = "form2DivPrompt";

                const note = document.createElement("p");
                note.textContent = "Note:";
                note.className = "note-header";
                noteDiv.appendChild(note);

                const ulNote = document.createElement("ul");
                ulNote.className = "note";

                const li1 = document.createElement("li");
                li1.textContent = "For the InterOp ONU connection type, only the Running ONU Statuses and RX parameters have values on the NMS Skin. VLAN normally have no value on the NMS Skin.";
                ulNote.appendChild(li1);

                const li2 = document.createElement("li");
                li2.textContent = "Between NMS Skin and SMP/Clearview, always prioritize the RX parameter with lower value and ignore the zero value. If both have zero value, check RX parameter via DMS.";
                ulNote.appendChild(li2);

                noteDiv.appendChild(ulNote);
                td.appendChild(noteDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "escaChecklistRow") {
                const row = document.createElement("tr");
                row.classList.add("esca-checklist-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const checklistDiv = document.createElement("div");
                checklistDiv.className = "form2DivPrompt";

                const checklistHeader = document.createElement("p");
                checklistHeader.textContent = "L2/Zone/Network Escalation Checklist:";
                checklistHeader.className = "esca-checklist-header";
                checklistDiv.appendChild(checklistHeader);

                const ulChecklist = document.createElement("ul");
                ulChecklist.className = "esca-checklist";

                const li6 = document.createElement("li");
                li6.textContent = "Network Downtime Checking";
                ulChecklist.appendChild(li6);

                const li7 = document.createElement("li");
                li7.textContent = "Power Light Checking";
                ulChecklist.appendChild(li7);

                const li8 = document.createElement("li");
                li8.textContent = "PON Light Checking";
                ulChecklist.appendChild(li8);

                const li9 = document.createElement("li");
                li9.textContent = "LOS Light Checking";
                ulChecklist.appendChild(li9);

                const li10 = document.createElement("li");
                li10.textContent = "NMS Skin Result";
                ulChecklist.appendChild(li10);

                const li11 = document.createElement("li");
                li11.textContent = "Clear View Result";
                ulChecklist.appendChild(li11);

                const li12 = document.createElement("li");
                li12.textContent = "Option 82 Alignment Checking";
                ulChecklist.appendChild(li12);

                const li13 = document.createElement("li");
                li13.textContent = "Fiber Optic Cable / Patchcord Checking";
                ulChecklist.appendChild(li13);

                checklistDiv.appendChild(ulChecklist);

                const checklistInstruction = document.createElement("p");
                checklistInstruction.textContent = "Note: It is not necessary to complete every item in this escalation checklist. Refer to the LIT365 work instructions for proper guidance.\n\nMaintain clear and detailed documentation to prevent potential misdiagnosis.";
                checklistInstruction.className = "esca-checklist-instruction";
                checklistDiv.appendChild(checklistInstruction);

                td.appendChild(checklistDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "toolLabel") {
                const toolLabelRow = document.createElement("tr");
                toolLabelRow.classList.add("tool-label-row");
                toolLabelRow.dataset.relatedTo = field.relatedTo;
                toolLabelRow.style.display = "none";

                const td = document.createElement("td");
                const div = document.createElement("div");
                div.className = "formToolLabel";
                div.textContent = field.label.replace(/^\/\/\s*/, "");

                td.appendChild(div);
                toolLabelRow.appendChild(td);
                return toolLabelRow;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";

                let optionsToUse = field.options;

                if (field.name === "resolution") {
                    if (["form510_1", "form510_2", "form510_3", "form510_4", "form510_5", "form510_6", "form510_7", "form510_8"].includes(selectedValue)) {
                        optionsToUse = field.options.filter((opt, idx) => idx === 0 || (idx >= 1 && idx <= 5));
                    } else if (["form511_1", "form511_2", "form511_3", "form511_4", "form511_5"].includes(selectedValue)) {
                        optionsToUse = [field.options[0], field.options[1], field.options[4]];
                    } else if (["form512_1", "form512_2", "form512_3"].includes(selectedValue)) {
                        optionsToUse = [field.options[0], field.options[1], field.options[4], field.options[6]];
                    }
                }

                optionsToUse.forEach((optionText, index) => {
                const option = document.createElement("option");
                option.value = optionText;
                option.textContent = optionText;

                if (index === 0) {
                    option.disabled = true;
                    option.selected = true;
                    option.style.fontStyle = "italic";
                }

                input.appendChild(option);
                });

            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") ? 5 : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }
        
        table.appendChild(createInstructionsRow()); 
        enhancedFields.forEach(field => table.appendChild(createFieldRow(field))); 

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row, .note-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["CEP", "SF/FUSE", "Endorse", "SF Tagging", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            ffupButtonHandler, 
            techNotesButtonHandler,
            endorsementForm, 
            sfTaggingButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];

        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const accountType = document.querySelector("[name='accountType']");
        const outageStatus = document.querySelector("[name='outageStatus']");
        const equipmentBrand = document.querySelector("[name='equipmentBrand']");
        const modemBrand = document.querySelector("[name='modemBrand']");
        const onuConnectionType = document.querySelector("[name='onuConnectionType']");
        const req4retracking = document.querySelector("[name='req4retracking']");
        const issueResolved = document.querySelector("[name='issueResolved']");

        accountType.addEventListener("change", () => {
            resetAllFields(["accountType"]);
            if (accountType.value === "PLDT") {
                if (selectedValue === "form510_1" || selectedValue === "form510_2") {
                    showFields(["outageStatus"]);
                    hideSpecificFields(["outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "onuRunStats", "rxPower", "wanName_3", "srvcType_3", "connType_3", "vlan_3", "nmsSkinRemarks", "dmsLan4Status", "dmsRemarks", "req4retracking", "stbID", "smartCardID", "cignalPlan", "stbIpAddress", "tsMulticastAddress", "exactExp", "remarks", "issueResolved", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                } else if (selectedValue === "form511_1" || selectedValue === "form511_2" || selectedValue === "form511_3" || selectedValue === "form511_4" || selectedValue === "form511_5") {
                    showFields(["rxPower", "req4retracking", "remarks", "issueResolved"]);
                    hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "onuRunStats", "wanName_3", "srvcType_3", "connType_3", "vlan_3", "nmsSkinRemarks", "dmsLan4Status", "dmsRemarks", "stbID", "smartCardID", "cignalPlan", "stbIpAddress", "tsMulticastAddress", "exactExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                } else if (selectedValue === "form512_1") {
                    showFields(["req4retracking", "remarks", "issueResolved"]);
                    hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "onuRunStats", "rxPower", "wanName_3", "srvcType_3", "connType_3", "vlan_3", "nmsSkinRemarks", "dmsLan4Status", "dmsRemarks", "stbID", "smartCardID", "cignalPlan", "stbIpAddress", "tsMulticastAddress", "exactExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                } else if (selectedValue === "form510_7") {
                    showFields(["stbID", "smartCardID", "stbIpAddress", "tsMulticastAddress", "exactExp", "remarks", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "rptCount", "upsell"]);
                    hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "onuRunStats", "rxPower", "wanName_3", "srvcType_3", "connType_3", "vlan_3", "nmsSkinRemarks", "dmsLan4Status", "dmsRemarks", "req4retracking", "cignalPlan", "issueResolved", "availability", "address", "landmarks"]);

                    if (caseOriginField.value === "CDT-SOCMED") {
                        showFields(["resolution"]);
                    } else {
                        hideSpecificFields(["resolution"]);
                    }
                } else {
                    showFields(["remarks", "issueResolved"]);
                    hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "onuRunStats", "rxPower", "wanName_3", "srvcType_3", "connType_3", "vlan_3", "nmsSkinRemarks", "dmsLan4Status", "dmsRemarks", "req4retracking", "stbID", "smartCardID", "cignalPlan", "stbIpAddress", "tsMulticastAddress", "exactExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                }
                updateToolLabelVisibility();
            } else if (accountType.value === "RADIUS") {
                if (selectedValue === "form510_1" || selectedValue === "form510_2" || selectedValue === "form511_1" || selectedValue === "form511_2" || selectedValue === "form511_3" || selectedValue === "form511_4" || selectedValue === "form511_5" || selectedValue === "form512_1") {
                    showFields(["req4retracking", "remarks", "issueResolved"]);
                    hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "onuRunStats", "rxPower", "wanName_3", "srvcType_3", "connType_3", "vlan_3", "nmsSkinRemarks", "dmsLan4Status", "dmsRemarks", "stbID", "smartCardID", "cignalPlan", "stbIpAddress", "tsMulticastAddress", "exactExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                } else {
                    showFields(["remarks", "issueResolved"]);
                    hideSpecificFields(["outageStatus", "outageReference", "pcNumber", "equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "onuRunStats", "rxPower", "wanName_3", "srvcType_3", "connType_3", "vlan_3", "nmsSkinRemarks", "dmsLan4Status", "dmsRemarks", "req4retracking", "stbID", "smartCardID", "cignalPlan", "stbIpAddress", "tsMulticastAddress", "exactExp", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                }
                updateToolLabelVisibility();
            }
        });
    
        outageStatus.addEventListener("change", () => {
            resetAllFields(["accountType", "outageStatus"]);
            if (outageStatus.value === "Yes") {
                showFields(["outageReference", "pcNumber", "remarks", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "rptCount", "upsell"]);
                hideSpecificFields(["equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "onuRunStats", "rxPower", "wanName_3", "srvcType_3", "connType_3", "vlan_3", "nmsSkinRemarks", "dmsLan4Status", "dmsRemarks", "req4retracking", "stbID", "smartCardID", "cignalPlan", "stbIpAddress", "tsMulticastAddress", "exactExp", "issueResolved", "availability", "address", "landmarks"]);
                if (caseOriginField.value === "CDT-SOCMED") {
                    showFields(["resolution"]);
                } else {
                    hideSpecificFields(["resolution"]);
                }
            } else {
                showFields(["equipmentBrand", "modemBrand", "onuConnectionType", "onuSerialNum", "onuRunStats", "rxPower", "nmsSkinRemarks", "dmsLan4Status", "dmsRemarks", "req4retracking", "exactExp", "remarks", "issueResolved"]);
                hideSpecificFields(["outageReference", "pcNumber", "wanName_3", "srvcType_3", "connType_3", "vlan_3", "stbID", "smartCardID", "cignalPlan", "stbIpAddress", "tsMulticastAddress", "resolution", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            }
            updateToolLabelVisibility();
        });

        function updateONUConnectionType() {
            if (!equipmentBrand.value || !modemBrand.value) {
                onuConnectionType.value = ""; 
                onuConnectionType.dispatchEvent(new Event("change")); 
                return;
            }

            const newValue =
                (equipmentBrand.value === "FEOL" && modemBrand.value === "FHTT") ||
                (equipmentBrand.value === "HUOL" && modemBrand.value === "HWTC")
                    ? "Non-interOp"
                    : "InterOp";

            if (onuConnectionType.value !== newValue) {
                onuConnectionType.value = ""; 
                onuConnectionType.dispatchEvent(new Event("change")); 

                setTimeout(() => {
                    onuConnectionType.value = newValue; 
                    onuConnectionType.dispatchEvent(new Event("change")); 
                }, 0);
            }
        }

        onuConnectionType.addEventListener("mousedown", (event) => {
            event.preventDefault();
        });

        equipmentBrand.addEventListener("change", updateONUConnectionType);
        modemBrand.addEventListener("change", updateONUConnectionType);

        updateONUConnectionType();

        onuConnectionType.addEventListener("change", () => {
            if (onuConnectionType.value === "Non-interOp" && equipmentBrand.value === "FEOL") {
                showFields(["vlan_3"]);
                hideSpecificFields(["wanName_3", "srvcType_3", "connType_3"]);                 
            } else if (onuConnectionType.value === "Non-interOp" && equipmentBrand.value === "HUOL") {
                showFields(["wanName_3", "srvcType_3", "connType_3", "vlan_3"]);
            } else {
                hideSpecificFields(["wanName_3", "srvcType_3", "connType_3", "vlan_3"]);
            }
        });
    
        req4retracking.addEventListener("change", () => {
            const isForm510 = selectedValue === "form510_1" || selectedValue === "form510_2";

            if (isForm510 && req4retracking.value === "Yes") {
                if (accountType.value === "PLDT") {
                    showFields(["stbID", "smartCardID", "cignalPlan"]);
                } else if (accountType.value === "RADIUS") {
                    showFields(["stbID", "smartCardID", "cignalPlan", "exactExp"]);
                }
            } else if (isForm510 && req4retracking.value === "No") {
                if (accountType.value === "PLDT") {
                    hideSpecificFields(["stbID", "smartCardID", "cignalPlan"]);
                } else if (accountType.value === "RADIUS") {
                    hideSpecificFields(["stbID", "smartCardID", "cignalPlan", "exactExp"]);
                }
            }
            updateToolLabelVisibility();
        });

        issueResolved.addEventListener("change", () => {
            if (issueResolved.selectedIndex === 2) {
                showFields(["investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            } else {
                showFields(["upsell"]);
                hideSpecificFields(["investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount"]);
            }

            if (caseOriginField.value === "CDT-SOCMED") {
                showFields(["resolution"]);
            } else {
                hideSpecificFields(["resolution"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    } else if (streamAppsForms.includes(selectedValue)) { 
        const table = document.createElement("table");

        const fields = [
            { label: "Actions Taken/ Troubleshooting/ Remarks", type: "textarea", name: "remarks", placeholder: "Ensure that all actions performed in each tool are properly documented. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "Issue Resolved? (Y/N)", type: "select", name: "issueResolved", options: [
                "", 
                "Yes", 
                "No - for Ticket Creation",
                "No - Customer is Unresponsive",
                "No - Customer is Not At Home",
                "No - Customer Declined Further Assistance",
                "No - System Ended Chat"
            ] },
            // CEP Investigation Tagging
            { label: "Investigation 1", type: "select", name: "investigation1", options: [
                "— Select applicable Investigation 1 —",
                "Normal Status"
            ]},
            { label: "Investigation 2", type: "select", name: "investigation2", options: [
                "— Select applicable Investigation 2 —",
                "Up/Active"                  
            ]},
            { label: "Investigation 3", type: "select", name: "investigation3", options: [
                "— Select applicable Investigation 3 —",
                "Without Line Problem Detected"
            ]},
            { label: "Investigation 4", type: "select", name: "investigation4", options: [
                "— Select applicable Investigation 4 —",
                "Content",
                "FCR - Device - Advised Physical Set Up",
                "FCR - Device for Replacement in Store"
            ]},
            // Ticket Details
            { label: "CEP Case Number", type: "number", name: "cepCaseNumber" },
            // Special Instructions
            { label: "Contact Person", type: "text", name: "contactName" },
            { label: "Contact Number", type: "number", name: "cbr" },
            { label: "Preferred Date & Time", type: "text", name: "availability" },
            { label: "Address", type: "textarea", name: "address" },
            { label: "Landmarks", type: "textarea", name: "landmarks" },
            // Cross-Sell/Upsell
            { label: "Upsell", type: "select", name: "upsell", options: [
                "", 
                "Yes - Accepted", 
                "No - Declined",
                "No - Ignored",
                "NA - Not Eligible"
            ]},
        ];

        function createInstructionsRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const instructionsDiv = document.createElement("div");
            instructionsDiv.className = "form2DivInstructions"; 

            const header = document.createElement("p");
            header.textContent = "Reference Link";
            header.className = "instructions-header";
            instructionsDiv.appendChild(header);

            const ul = document.createElement("ul");
            ul.className = "instructions-list";

            const li5 = document.createElement("li");
            li5.textContent = "See ";

            const link1 = document.createElement("a");

            let url1 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            }

            link1.textContent = "CEP: Troubleshooting Guide";
            link1.style.color = "lightblue";
            link1.href = "#";

            link1.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url1, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li5.appendChild(link1);
            li5.appendChild(document.createTextNode(" for Main PLDT Repair Work Instruction"));
            ul.appendChild(li5);

            const li6 = document.createElement("li");
            li6.textContent = "See ";

            const link2 = document.createElement("a");

            let url2 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            }

            link2.textContent = "Gamma: Troubleshooting Guide";
            link2.style.color = "lightblue";
            link2.href = "#";

            link2.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url2, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li6.appendChild(link2);
            li6.appendChild(document.createTextNode(" for Main Gamma Repair Work Instruction"));
            ul.appendChild(li6);

            instructionsDiv.appendChild(ul);

            td.appendChild(instructionsDiv);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName 
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Probe & Troubleshoot", "remarks");
        insertToolLabel(enhancedFields, "CEP Investigation Tagging", "investigation1");
        insertToolLabel(enhancedFields, "Ticket Details", "cepCaseNumber");
        insertToolLabel(enhancedFields, "Special Instructions", "contactName");
        insertToolLabel(enhancedFields, "Cross-Sell/Upsell", "upsell");
        
        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = (["remarks", "issueResolved"].includes(field.name)) ? "table-row" : "none";

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const toolLabelRow = document.createElement("tr");
                toolLabelRow.classList.add("tool-label-row");
                toolLabelRow.dataset.relatedTo = field.relatedTo;
                toolLabelRow.style.display = "none";

                const td = document.createElement("td");
                const div = document.createElement("div");
                div.className = "formToolLabel";
                div.textContent = field.label.replace(/^\/\/\s*/, "");

                td.appendChild(div);
                toolLabelRow.appendChild(td);
                return toolLabelRow;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") ? 5 : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }
        
        table.appendChild(createInstructionsRow()); 
        enhancedFields.forEach(field => table.appendChild(createFieldRow(field))); 

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["CEP", "SF/FUSE", "Endorse", "SF Tagging", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            ffupButtonHandler, 
            techNotesButtonHandler, 
            endorsementForm, 
            sfTaggingButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];

        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const issueResolved = document.querySelector("[name='issueResolved']");
    
        issueResolved.addEventListener("change", () => {
            if (issueResolved.selectedIndex === 2) {
                showFields(["investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            } else {
                showFields(["upsell"]);
                hideSpecificFields(["investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "contactName", "cbr", "availability", "address", "landmarks", "rptCount"]);
            }
            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();
    } else if (alwaysOnForms.includes(selectedValue)) { 
        const table = document.createElement("table");

        const fields = [
            // Visual Audit
            { label: "SIM Light Status", type: "select", name: "simLight", options: [
                "— Modem Light Status —", 
                "On", 
                "Off"
            ]},
            { label: "MIN #", type: "number", name: "minNumber", placeholder: "0999XXXXXXX"},
            { label: "Modem/ONU Serial #", type: "text", name: "onuSerialNum", placeholder: "Also available in DMS."},
            // Probe & Troubleshoot
            { label: "Actions Taken/ Troubleshooting/ Remarks", type: "textarea", name: "remarks", placeholder: "Ensure that all actions performed in each tool are properly documented. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "Issue Resolved? (Y/N)", type: "select", name: "issueResolved", options: [
                "", 

            ] },
            // CEP Investigation Tagging
            { label: "Investigation 1", type: "select", name: "investigation1", options: [
                "— Modem Light Status —",
                "Not Applicable [Defective CPE]"
            ]},
            { label: "Investigation 2", type: "select", name: "investigation2", options: [
                "— NMS Parameters —",
                "Not Applicable [NMS GUI]"
            ]},
            { label: "Investigation 3", type: "select", name: "investigation3", options: [
                "— Clearview Reading —",
                "Not Applicable"
            ]},
            { label: "Investigation 4", type: "select", name: "investigation4", options: [
                "— Select applicable Investigation 4 —",
                "Broken/Damaged Modem/ONU"
            ]},
            // Ticket Details
            { label: "CEP Case Number", type: "number", name: "cepCaseNumber" },
            { label: "SLA / ETR", type: "text", name: "sla" },
            // Special Instructions
            { label: "Contact Person", type: "text", name: "contactName" },
            { label: "Contact Number", type: "number", name: "cbr" },
            { label: "Preferred Date & Time", type: "text", name: "availability" },
            { label: "Address", type: "textarea", name: "address" },
            { label: "Landmarks", type: "textarea", name: "landmarks" },
            { label: "Repeats w/in 30 Days", type: "text", name: "rptCount"},
            // Cross-Sell/Upsell
            { label: "Upsell", type: "select", name: "upsell", options: [
                "", 
                "Yes - Accepted", 
                "No - Declined",
                "No - Ignored",
                "NA - Not Eligible"
            ]},
        ];

        function createInstructionsRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const instructionsDiv = document.createElement("div");
            instructionsDiv.className = "form2DivInstructions"; 

            const header = document.createElement("p");
            header.textContent = "Reference Link";
            header.className = "instructions-header";
            instructionsDiv.appendChild(header);

            const ul = document.createElement("ul");
            ul.className = "instructions-list";

            const li5 = document.createElement("li");
            li5.textContent = "See ";

            const link1 = document.createElement("a");

            let url1 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            }

            link1.textContent = "CEP: Troubleshooting Guide";
            link1.style.color = "lightblue";
            link1.href = "#";

            link1.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url1, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li5.appendChild(link1);
            li5.appendChild(document.createTextNode(" for Main PLDT Repair Work Instruction"));
            ul.appendChild(li5);

            instructionsDiv.appendChild(ul);

            td.appendChild(instructionsDiv);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            const index = fields.findIndex(f => f.name === relatedFieldName);
            if (index !== -1) {
                fields.splice(index, 0, {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName
                });
            } else {
                console.warn(`insertToolLabel: related field "${relatedFieldName}" not found`);
            }
        }

        function insertEscaChecklistRow(fields, relatedFieldName) {
            const index = fields.findIndex(f => f.name === relatedFieldName);
            if (index !== -1) {
                fields.splice(index, 0, {
                    type: "escaChecklistRow",
                    name: "escaChecklist",
                    relatedTo: relatedFieldName
                });
            }
        }

        const enhancedFields = [...fields];

        insertEscaChecklistRow(enhancedFields, "simLight");
        insertToolLabel(enhancedFields, "Probe & Troubleshoot", "simLight");
        insertToolLabel(enhancedFields, "CEP Investigation Tagging", "investigation1");
        insertToolLabel(enhancedFields, "Ticket Details", "cepCaseNumber");
        insertToolLabel(enhancedFields, "Special Instructions", "contactName");
        insertToolLabel(enhancedFields, "Cross-Sell/Upsell", "upsell");
        
        function createFieldRow(field) {
            const row = document.createElement("tr");
            const showFields = ["simLight", "remarks", "issueResolved"];

            row.style.display = showFields.includes(field.name) ? "table-row" : "none";

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;                
            if (field.type === "toolLabel") {
                const toolLabelRow = document.createElement("tr");
                toolLabelRow.classList.add("tool-label-row");
                toolLabelRow.dataset.relatedTo = field.relatedTo;
                toolLabelRow.style.display = "none";

                const td = document.createElement("td");
                const div = document.createElement("div");
                div.className = "formToolLabel";
                div.textContent = field.label.replace(/^\/\/\s*/, "");

                td.appendChild(div);
                toolLabelRow.appendChild(td);
                return toolLabelRow;
            } else if (field.type === "escaChecklistRow") {
                const row = document.createElement("tr");
                row.classList.add("esca-checklist-row");
                row.dataset.relatedTo = field.relatedTo;
                row.style.display = "none";

                const td = document.createElement("td");
                const checklistDiv = document.createElement("div");
                checklistDiv.className = "form2DivPrompt";

                const checklistHeader = document.createElement("p");
                checklistHeader.textContent = "Note:";
                checklistHeader.className = "esca-checklist-header";
                checklistDiv.appendChild(checklistHeader);

                const ulChecklist = document.createElement("ul");
                ulChecklist.className = "esca-checklist";

                const li1 = document.createElement("li");
                li1.textContent = "Always verify if the Fiber services are working before proceeding to ensure the correct resolution is provided.";
                ulChecklist.appendChild(li1);

                const li2 = document.createElement("li");
                li2.textContent = "Verify if the customer is experiencing issues with their backup Wi-Fi (Always On).";
                ulChecklist.appendChild(li2);

                const li3 = document.createElement("li");
                li3.textContent = "For endorsements to the Prepaid Fiber Fixed Wireless Operations team, click the “Endorse” button to submit the escalation.";
                ulChecklist.appendChild(li3);

                checklistDiv.appendChild(ulChecklist);

                td.appendChild(checklistDiv);
                row.appendChild(td);

                return row;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                field.options.forEach((optionText, index)=> {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });
            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") ? 5 : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }
        
        table.appendChild(createInstructionsRow()); 
        enhancedFields.forEach(field => table.appendChild(createFieldRow(field))); 

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row, .esca-checklist-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["CEP", "SF/FUSE", "Endorse", "SF Tagging", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            ffupButtonHandler, 
            techNotesButtonHandler,
            endorsementForm, 
            sfTaggingButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];

        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        function updateIssueResolvedOptions(selectedValue) {
            const issueResolved = document.querySelector("[name='issueResolved']");
            if (!issueResolved) return;

            issueResolved.innerHTML = "";

            const defaultOption = document.createElement("option");
            defaultOption.textContent = "";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            issueResolved.appendChild(defaultOption);

            const options =
                selectedValue === "form500_6" ||
                selectedValue === "form101_5" ||
                selectedValue === "form510_9"
                    ? [
                        "Yes",
                        "No - Customer is Unresponsive",
                        "No - Customer is Not At Home",
                        "No - Customer Declined Further Assistance",
                        "No - System Ended Chat"
                    ]
                    : [
                        "Yes",
                        "No - for Endorsement",
                        "No - Customer is Unresponsive",
                        "No - Customer is Not At Home",
                        "No - Customer Declined Further Assistance",
                        "No - System Ended Chat"
                    ];

            options.forEach(text => {
                const opt = document.createElement("option");
                opt.value = text;
                opt.textContent = text;
                issueResolved.appendChild(opt);
            });
        }


        const simLight = document.querySelector("[name='simLight']");
        const issueResolved = document.querySelector("[name='issueResolved']");

        simLight.addEventListener("change", () => {
            resetAllFields(["simLight"]);
            if (simLight.value === "Off" && selectedValue === "form500_6") {
                showFields(["minNumber", "onuSerialNum", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
                hideSpecificFields(["issueResolved"]);
            } else {
                showFields(["issueResolved"]);
                hideSpecificFields(["minNumber", "onuSerialNum", "investigation1", "investigation2", "investigation3", "investigation4", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "rptCount", "upsell"]);
            }
            updateToolLabelVisibility();
        });
    
        issueResolved.addEventListener("change", () => {
            if (issueResolved.value !== "No - for Ticket Creation") {
                showFields(["upsell"]);
            }
            updateToolLabelVisibility(); 
        });

        updateIssueResolvedOptions(selectedValue);
        updateToolLabelVisibility();

    }

    // Tech Modem Request Transactions
    else if (mrtForms.includes(selectedValue)) { 
        const table = document.createElement("table");

        const fields = [
            // Visual Audit
            { label: "Account Type", type: "select", name: "accountType", options: [
                "", 
                "PLDT", 
                "RADIUS"
            ]},
            { label: "Customer Authentication", type: "select", name: "custAuth", options: [
                "", 
                "Failed", 
                "Passed",
            ]},
            { label: "Equipment Brand", type: "select", name: "equipmentBrand", options: [
                "", 
                "FEOL", 
                "HUOL"
            ]},
            { label: "Modem Brand", type: "select", name: "modemBrand", options: [
                "", 
                "FHTT", 
                "HWTC", 
                "ZTEG",
                "AZRD",
                "PRLN",
                "Other Brands"
            ]},
            { label: "ONU Connection Type", type: "select", name: "onuConnectionType", options: [
                "", 
                "InterOp", 
                "Non-interOp"
            ]},
            { label: "LAN Port Number", type: "number", name: "lanPortNum" },
            // DMS
            { label: "DMS: LAN Port Status", type: "text", name: "dmsLanPortStatus"},
            // CEP Investigation Tagging
            { label: "Investigation 1", type: "select", name: "investigation1", options: [
                "— Select applicable Investigation 1 —",
                "Normal Status",
                "Not Applicable [via Store]"
            ]},
            { label: "Investigation 2", type: "select", name: "investigation2", options: [
                "— Select applicable Investigation 2 —",
                "Up/Active",
                "VLAN Configuration issue",
                "Not Applicable [via Store]"                    
            ]},
            { label: "Investigation 3", type: "select", name: "investigation3", options: [
                "— Select applicable Investigation 5 —",
                "Without Line Problem Detected",
                "The ONU performance is degraded"
            ]},
            { label: "Investigation 4", type: "select", name: "investigation4", options: [
                "— Select applicable Investigation 4 —",
                "Cannot Browse",
                "Change set-up Route to Bridge and Vice Versa",
                "Change set-up Route to Bridge and Vice Versa [InterOP]",
                "Data Bind Port",
                "Device and Website IP Configuration",
                "FCR - Change WiFi SSID UN/PW",
                "Not Applicable [via Store]",
                "Request Modem/ONU GUI Access",
                "Request Modem/ONU GUI Access [InterOP]"
            ]},
            { label: "Actions Taken/ Troubleshooting/ Remarks", type: "textarea", name: "remarks", placeholder: "Ensure that all actions performed in each tool are properly documented. Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”. You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency." },
            { label: "FLM Findings / Resolution", type: "select", name: "resolution", options: [
                "",
                "Defective Modem",
                "Manual Troubleshooting",
                "NMS Configuration",
            ]},
            { label: "Issue Resolved? (Y/N)", type: "select", name: "issueResolved", options: [
                "", 
                "Yes", 
                "No - for Ticket Creation",
                "No - Customer is Unresponsive",
                "No - Customer is Not At Home",
                "No - Customer Declined Further Assistance",
                "No - System Ended Chat"
            ] },
            { label: "CEP Case Number", type: "number", name: "cepCaseNumber" },
            { label: "SLA / ETR", type: "text", name: "sla" },
            // Special Instructions
            { label: "Contact Person", type: "text", name: "contactName" },
            { label: "Contact Number", type: "number", name: "cbr" },
            { label: "Preferred Date & Time", type: "text", name: "availability" },
            { label: "Address", type: "textarea", name: "address" },
            { label: "Landmarks", type: "textarea", name: "landmarks" }
        ];

        function createInstructionsRow() {
            const row = document.createElement("tr");
            const td = document.createElement("td");

            const instructionsDiv = document.createElement("div");
            instructionsDiv.className = "form2DivInstructions"; 

            const header = document.createElement("p");
            header.textContent = "Reference Link";
            header.className = "instructions-header";
            instructionsDiv.appendChild(header);

            const ul = document.createElement("ul");
            ul.className = "instructions-list";

            const li5 = document.createElement("li");
            li5.textContent = "See ";

            const link1 = document.createElement("a");

            let url1 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url1 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP%2FCEP%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20CEP";
            }

            link1.textContent = "CEP: Troubleshooting Guide";
            link1.style.color = "lightblue";
            link1.href = "#";

            link1.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url1, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li5.appendChild(link1);
            li5.appendChild(document.createTextNode(" for Main PLDT Repair Work Instruction"));
            ul.appendChild(li5);

            const li6 = document.createElement("li");
            li6.textContent = "See ";

            const link2 = document.createElement("a");

            let url2 = "#";
            if (caseOriginField.value === "CDT-HOTLINE") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FHOTLINE%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            } else if (caseOriginField.value === "CDT-SOCMED") {
                url2 = "https://pldt365.sharepoint.com/sites/LIT365/files/2025Advisories/Forms/AllItems.aspx?id=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA%2FGAMMA%5FSOCMED%5FTROUBLESHOOTING%5FGUIDE%2Epdf&parent=%2Fsites%2FLIT365%2Ffiles%2F2025Advisories%2F02FEBRUARY%2FPLDT%20%2D%20GAMMA";
            }

            link2.textContent = "Gamma: Troubleshooting Guide";
            link2.style.color = "lightblue";
            link2.href = "#";

            link2.addEventListener("click", (event) => {
                event.preventDefault();
                window.open(url2, "_blank", "width=1500,height=800,scrollbars=yes,resizable=yes");
            });

            li6.appendChild(link2);
            li6.appendChild(document.createTextNode(" for Main Gamma Repair Work Instruction"));
            ul.appendChild(li6);

            instructionsDiv.appendChild(ul);

            td.appendChild(instructionsDiv);
            row.appendChild(td);

            return row;
        }

        function insertToolLabel(fields, label, relatedFieldName) {
            fields.splice(
                fields.findIndex(f => f.name === relatedFieldName),
                0,
                {
                    label: `// ${label}`,
                    type: "toolLabel",
                    name: `toolLabel-${label.toLowerCase().replace(/\s/g, "-")}`,
                    relatedTo: relatedFieldName 
                }
            );
        }

        const enhancedFields = [...fields];

        insertToolLabel(enhancedFields, "Visual Audit", "accountType");
        insertToolLabel(enhancedFields, "DMS", "dmsLanPortStatus");
        insertToolLabel(enhancedFields, "CEP Investigation Tagging", "investigation1");
        insertToolLabel(enhancedFields, "Special Instructions", "contactName");
        
        function createFieldRow(field) {
            const row = document.createElement("tr");
            row.style.display = (field.name === "accountType" || field.name === "custAuth") ? "table-row" : "none";

            const td = document.createElement("td");
            const divInput = document.createElement("div");
            divInput.className = field.type === "textarea" ? "form2DivTextarea" : "form2DivInput";

            const label = document.createElement("label");
            label.textContent = `${field.label}`;
            label.className = field.type === "textarea" ? "form2-label-textarea" : "form2-label";
            label.setAttribute("for", field.name);

            let input;
            if (field.type === "toolLabel") {
                const toolLabelRow = document.createElement("tr");
                toolLabelRow.classList.add("tool-label-row");
                toolLabelRow.dataset.relatedTo = field.relatedTo;
                toolLabelRow.style.display = "none";

                const td = document.createElement("td");
                const div = document.createElement("div");
                div.className = "formToolLabel";
                div.textContent = field.label.replace(/^\/\/\s*/, "");

                td.appendChild(div);
                toolLabelRow.appendChild(td);
                return toolLabelRow;
            } else if (field.type === "select") {
                input = document.createElement("select");
                input.name = field.name;
                input.className = "form2-input";
                
                let optionsToUse = field.options;

                if (field.name === "resolution") {
                    if (["form300_1"].includes(selectedValue)) {
                        optionsToUse = [field.options[0], field.options[2], field.options[3]];
                    } else if (["form300_2"].includes(selectedValue)) {
                        optionsToUse = [field.options[0], field.options[1], field.options[2], field.options[3]];
                    } else if (["form300_3"].includes(selectedValue)) {
                        optionsToUse = [field.options[0], field.options[3]];
                    } else if (["form300_4", "form300_5", "form300_7", "form300_8"].includes(selectedValue)) {
                        optionsToUse = [field.options[0], field.options[1], field.options[3]];
                    } else if (["form300_6"].includes(selectedValue)) {
                        optionsToUse = [field.options[0], field.options[1], field.options[3]];
                    }
                }

                optionsToUse.forEach((optionText, index) => {
                    const option = document.createElement("option");
                    option.value = optionText;
                    option.textContent = optionText;

                    if (index === 0) {
                        option.disabled = true;
                        option.selected = true;
                        option.style.fontStyle = "italic";
                    }

                    input.appendChild(option);
                });

            } else if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.name = field.name;
                input.className = "form2-textarea";
                input.rows = (field.name === "remarks") ? 6 : 2;
                if (field.placeholder) input.placeholder = field.placeholder;
            } else {
                input = document.createElement("input");
                input.type = field.type;
                input.name = field.name;
                input.className = "form2-input";
                if (field.step) input.step = field.step;
                if (field.placeholder) input.placeholder = field.placeholder;
            }

            divInput.appendChild(label);
            divInput.appendChild(input);
            td.appendChild(divInput);
            row.appendChild(td);

            return row;
        }
        
        table.appendChild(createInstructionsRow()); 
        enhancedFields.forEach(field => table.appendChild(createFieldRow(field))); 

        function updateToolLabelVisibility() {
            const allToolLabels = document.querySelectorAll(".tool-label-row");
            allToolLabels.forEach(labelRow => {
                const relatedName = labelRow.dataset.relatedTo;
                const relatedInput = document.querySelector(`[name="${relatedName}"]`);
                if (relatedInput) {
                    const relatedRow = relatedInput.closest("tr");
                    labelRow.style.display = (relatedRow && relatedRow.style.display !== "none") ? "table-row" : "none";
                }
            });
        }

        form2Container.appendChild(table);

        const buttonLabels = ["CEP", "SF/FUSE", "Endorse", "SF Tagging", "💾 Save", "🔄 Reset"];
        const buttonHandlers = [
            ffupButtonHandler, 
            techNotesButtonHandler, 
            endorsementForm, 
            sfTaggingButtonHandler,
            saveFormData,
            resetButtonHandler,
        ];

        const buttonTable = createButtons(buttonLabels, buttonHandlers);
        form2Container.appendChild(buttonTable);

        const accountType = document.querySelector("[name='accountType']");
        const custAuth = document.querySelector("[name='custAuth']");
        const equipmentBrand = document.querySelector("[name='equipmentBrand']");
        const modemBrand = document.querySelector("[name='modemBrand']");
        const onuConnectionType = document.querySelector("[name='onuConnectionType']");
        const issueResolved = document.querySelector("[name='issueResolved']");

        function handleCustAuthAndAccountTypeChange() {
            if (!custAuth.value || !accountType.value) {
                return;
            }
            resetAllFields(["accountType", "custAuth"]);

            if (custAuth.value === "Passed" && accountType.value === "PLDT") {
                if (selectedValue === "form300_1") {
                    showFields(["equipmentBrand", "modemBrand", "onuConnectionType", "investigation1", "investigation2", "investigation3", "investigation4", "remarks", "issueResolved", "resolution"]);
                    hideSpecificFields(["cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks"]);

                    updateToolLabelVisibility();
                } else if (["form300_2", "form300_3", "form300_4", "form300_5"].includes(selectedValue)) {
                    showFields(["equipmentBrand", "modemBrand", "onuConnectionType", "investigation1", "investigation2", "investigation3", "investigation4", "remarks", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "resolution"]);  

                    updateToolLabelVisibility();
                } else if (selectedValue === "form300_6") {
                    showFields(["lanPortNum", "dmsLanPortStatus", "investigation1", "investigation2", "investigation3", "investigation4", "remarks", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "resolution"]);    
                    
                    updateToolLabelVisibility();
                } else {
                    showFields(["investigation1", "investigation2", "investigation3", "investigation4", "remarks", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "resolution"]);

                    updateToolLabelVisibility();
                }

                updateToolLabelVisibility();
            } else if (custAuth.value === "Passed" && accountType.value === "RADIUS") {
                if (selectedValue === "form300_1") {
                    showFields(["investigation1", "investigation2", "investigation3", "investigation4", "remarks", "issueResolved", "resolution"]);
                    hideSpecificFields(["equipmentBrand", "modemBrand", "onuConnectionType", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks"]);

                    updateToolLabelVisibility();
                } else if (["form300_2", "form300_3", "form300_4", "form300_5"].includes(selectedValue)) {
                    showFields(["investigation1", "investigation2", "investigation3", "investigation4", "remarks", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "resolution"]);
                    hideSpecificFields(["equipmentBrand", "modemBrand", "onuConnectionType"]);

                    updateToolLabelVisibility();
                } else if (selectedValue === "form300_6") {
                    showFields(["investigation1", "investigation2", "investigation3", "investigation4", "remarks", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "resolution"]);
                    hideSpecificFields(["lanPortNum", "dmsLanPortStatus"]);

                    updateToolLabelVisibility();
                } else {
                    showFields(["investigation1", "investigation2", "investigation3", "investigation4", "remarks", "cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks", "resolution"]);

                    updateToolLabelVisibility();
                }
            } else {
                showFields(["remarks"]);
                hideSpecificFields([
                    "equipmentBrand", "modemBrand", "onuConnectionType", "lanPortNum", "dmsLanPortStatus",
                    "investigation1", "investigation2", "investigation3", "investigation4", "issueResolved",
                    "cepCaseNumber", "sla", "resolution", "contactName", "cbr", "availability", "address", "landmarks"
                ]);

                updateToolLabelVisibility();
            }

            updateToolLabelVisibility();
        }

        custAuth.addEventListener("change", handleCustAuthAndAccountTypeChange);
        accountType.addEventListener("change", handleCustAuthAndAccountTypeChange);

        function updateONUConnectionType() {
            if (!equipmentBrand.value || !modemBrand.value) {
                onuConnectionType.value = ""; 
                onuConnectionType.dispatchEvent(new Event("change")); 
                return;
            }

            const newValue =
                (equipmentBrand.value === "FEOL" && modemBrand.value === "FHTT") ||
                (equipmentBrand.value === "HUOL" && modemBrand.value === "HWTC")
                    ? "Non-interOp"
                    : "InterOp";

            if (onuConnectionType.value !== newValue) {
                onuConnectionType.value = ""; 
                onuConnectionType.dispatchEvent(new Event("change")); 

                setTimeout(() => {
                    onuConnectionType.value = newValue; 
                    onuConnectionType.dispatchEvent(new Event("change")); 
                }, 0);
            }
        }

        onuConnectionType.addEventListener("mousedown", (event) => {
            event.preventDefault();
        });

        equipmentBrand.addEventListener("change", updateONUConnectionType);
        modemBrand.addEventListener("change", updateONUConnectionType);

        updateONUConnectionType();
    
        issueResolved.addEventListener("change", () => {
            if (issueResolved.selectedIndex === 2) {
                showFields(["cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks"]);

                updateToolLabelVisibility();
            } else {
                hideSpecificFields(["cepCaseNumber", "sla", "contactName", "cbr", "availability", "address", "landmarks"]);

                updateToolLabelVisibility();
            }

            updateToolLabelVisibility();
        });

        updateToolLabelVisibility();

    }
}

document.getElementById("selectIntent").addEventListener("change", createIntentBasedForm);

// Create Buttons helper
function createButtons(buttonLabels, buttonHandlers) {
    const vars = initializeVariables();

    const caseOriginField = document.getElementById("caseOrigin").value;
    const lobField = document.getElementById("lob").value;
    const isNonTech = lobField === "NON-TECH";

    const buttonTable = document.createElement("table");
    let buttonIndex = 0;

    for (let rowIndex = 0; rowIndex < 3; rowIndex++) {
        const row = document.createElement("tr");
        let hasButton = false;

        for (let colIndex = 0; colIndex < 4; colIndex++) {
            const cell = document.createElement("td");

            // NON-TECH layout
            if (isNonTech) {

                // 1st button → spans col 0 & 1
                if (buttonIndex === 0 && colIndex === 0) {
                    const button = document.createElement("button");
                    button.textContent = buttonLabels[buttonIndex];
                    button.onclick = buttonHandlers[buttonIndex];
                    button.classList.add("form2-button");

                    cell.colSpan = 2; // span 2 columns
                    cell.appendChild(button);
                    row.appendChild(cell);

                    buttonIndex++;
                    hasButton = true;

                    colIndex++; // skip next column (already occupied)
                    continue;
                }

                // Skip column 1 (handled by colspan)
                if (colIndex === 1) {
                    continue;
                }

                // 2nd button → col 2
                if (buttonIndex === 1 && colIndex === 2) {
                    const button = document.createElement("button");
                    button.textContent = buttonLabels[buttonIndex];
                    button.onclick = buttonHandlers[buttonIndex];
                    button.classList.add("form2-button");

                    cell.appendChild(button);
                    row.appendChild(cell);

                    buttonIndex++;
                    hasButton = true;
                    continue;
                }

                // 3rd button → col 3
                if (buttonIndex === 2 && colIndex === 3) {
                    const button = document.createElement("button");
                    button.textContent = buttonLabels[buttonIndex];
                    button.onclick = buttonHandlers[buttonIndex];
                    button.classList.add("form2-button");

                    cell.appendChild(button);
                    row.appendChild(cell);

                    buttonIndex++;
                    hasButton = true;
                    continue;
                }

                // empty cells
                row.appendChild(cell);
                continue;
            }

            // EXISTING LOGIC (TECH stays unchanged)
            while (buttonIndex < buttonLabels.length) {
                let label = buttonLabels[buttonIndex];

                if (vars.selectedIntent === "formFfupRepair" && label === "SF/FUSE") {
                    label = "SF & FUSE";
                }

                const button = document.createElement("button");
                button.textContent = label;
                button.onclick = buttonHandlers[buttonIndex];
                button.classList.add("form2-button");

                cell.appendChild(button);
                row.appendChild(cell);

                buttonIndex++;
                hasButton = true;
                break;
            }

            if (!cell.hasChildNodes()) {
                row.appendChild(cell);
            }
        }

        if (hasButton) {
            buttonTable.appendChild(row);
        }
    }

    return buttonTable;
}

// Notes Generation helper
function optionNotAvailable() {
    const vars = initializeVariables();

    if (isFieldVisible("facility")) {
        if (vars.facility === "") {
            showAlert("Please complete the form.");
            return true;
        }
    }

    if (isFieldVisible("issueResolved")) {
        if (vars.issueResolved === "") {
            alert('Please indicate whether the issue is resolved or not.');
            return true;
        } else if (vars.issueResolved !=="Yes" && vars.issueResolved !=="No - for Ticket Creation") {
            alert('This option is not available. Please use Salesforce or FUSE button.');
            return true;
        }
    }

    return false;
}

// Generate FUSE notes for Non-Tech Intents
function getFuseFieldValueIfVisible(fieldName) {
    const vars = initializeVariables();
    
    if (!isFieldVisible(fieldName)) return "";

    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return "";

    let value = field.value.trim();

    if (field.tagName.toLowerCase() === "textarea") {
        if (
            vars.selectedIntent === "formFfupRepair" &&
            vars.ticketStatus === "Beyond SLA" &&
            (vars.offerALS !== "Offered ALS/Accepted" && vars.offerALS !== "Offered ALS/Declined")
        ) {
            value = value.replace(/\n/g, " / ");
        } else {
            value = value.replace(/\n/g, "/ ");
        }
    }

    return value;
}

function nontechNotesButtonHandler(showFloating = true) {
    const vars = initializeVariables();

    let concernCopiedText = "";
    let actionsTakenCopiedText = "";
    let outboundDetailsCopiedText = "";

    function constructFuseOutput() {
        const fields = [
            { name: "remarks" },
            { name: "newAddress", label: "NEW  SERVICE ADDRESS" },
            { name: "landmarks", label: "LANDMARK" },
            { name: "srNum", label: "SO" },
        ];

        const seenFields = new Set();
        let actionsTakenParts = [];

        fields.forEach(field => {
            const inputElement = document.querySelector(`[name="${field.name}"]`);
            let value = getFuseFieldValueIfVisible(field.name);

            if (field.name === "paymentChannel") {
                const paymentChannelValue = getFuseFieldValueIfVisible("paymentChannel");
                if (paymentChannelValue === "Others") {
                    const otherPaymentChannelValue = getFuseFieldValueIfVisible("otherPaymentChannel");
                    value = otherPaymentChannelValue || "Others";
                } else {
                    value = paymentChannelValue;
                }
            } else {
                value = getFuseFieldValueIfVisible(field.name);
            }

            if (inputElement && inputElement.tagName === "SELECT" && inputElement.selectedIndex === 0) {
                return;
            }

            if (field.name === "custAuth" && value === "NA") {
                return;
            }

            if (value && !seenFields.has(field.name)) {
                seenFields.add(field.name);
                actionsTakenParts.push((field.label ? `${field.label}: ` : "") + value);
            }
        });

        const affectedTool = getFuseFieldValueIfVisible("affectedTool");
        const otherTool = getFuseFieldValueIfVisible("otherTool");

        if (affectedTool) {
            const toolName = affectedTool === "Other PLDT tools" ? otherTool : affectedTool;
            if (toolName) {
                actionsTakenParts.push(`${toolName} Downtime`);
            }
        }

        // Construct final Actions Taken note
        let actionsTaken = "A: " + actionsTakenParts.join("/ ");

        const eSnowTicketNum = getFuseFieldValueIfVisible("eSnowTicketNum");
        if (eSnowTicketNum) {
            actionsTaken += eSnowTicketNum;
        }

        return actionsTaken.trim();
    }

    function formatField(label, name, prefix = " -") {
        if (!isFieldVisible(name) || !vars[name]) return "";

        const prefixPart = prefix ? `${prefix} ` : "";
        const labelPart = label ? `${label}: ` : "";

        return `${prefixPart}${labelPart}${vars[name]}`;
    }

    function buildLine(label, number, time, message, result) {
        return [
            number && `${label}: ${number.toUpperCase()}`,
            time && `ARRIVAL TIME: ${time.toUpperCase()}`,
            message && `MESSAGE: ${message}`, // keep original case
            result && result.toUpperCase()
        ].filter(Boolean).join(" / ");
    }

    function constructOutboundDetails() {
        const calloutAttempt = getFuseFieldValueIfVisible("calloutAttempt");

        const primary = buildLine(
            "PRIMARY #",
            getFuseFieldValueIfVisible("primaryNumber"),
            getFuseFieldValueIfVisible("arrivalTime1"),
            getFuseFieldValueIfVisible("message1"),
            getFuseFieldValueIfVisible("outboundResult1")
        );

        const secondary = buildLine(
            "SECONDARY #",
            getFuseFieldValueIfVisible("secondaryNumber"),
            getFuseFieldValueIfVisible("arrivalTime2"),
            getFuseFieldValueIfVisible("message2"),
            getFuseFieldValueIfVisible("outboundResult2")
        );

        const landline = buildLine(
            "LANDLINE #",
            getFuseFieldValueIfVisible("landlineNumber"),
            getFuseFieldValueIfVisible("arrivalTime3"),
            getFuseFieldValueIfVisible("message3"),
            getFuseFieldValueIfVisible("outboundResult3")
        );

        const finalAttempt = getFuseFieldValueIfVisible("outboundResult4");
        const notes = getFuseFieldValueIfVisible("obNotes");

        const lines = [primary, secondary, landline].filter(Boolean);

        let output = "";

        if (lines.length) {
            output += `${(calloutAttempt || "").toUpperCase()} CALLOUT `;
            output += lines.join("\n") + "\n";
        }

        const footer = [finalAttempt, notes]
            .filter(Boolean)
            .map(v => v.toUpperCase())
            .join(" / ");

        if (footer) {
            output += `${(calloutAttempt || "").toUpperCase()} CALLOUT ${footer}`;
        }

        return output.trim();
    }

    const selectOriginValue = getFuseFieldValueIfVisible("selectOrigin");
    const selectOrigin = selectOriginValue ? `/ ${selectOriginValue}` : "";
    const sfCaseNum = formatField("CASE #", "sfCaseNum");

    const basedOnSelectedIntentText = [
        "formReqRelocation", "formReqChangeTelNum", "formInqChangeTelNum", "formReqDowngrade", "formReqUpgrade", "formInqDowngrade", "formInqUpgrade", "formReqInmove", "formCompMisappPay", "formReqPermaDisco"
    ];

    const basedOnSelectedIntentAndRequestType = [
        "formReqBillAdjust", "formInqBill", "formCompMistreat", "formReqSpecFeat", "formInqSpecialFeatures"
    ];

    const basedOnSelectedOptGroupLabel = [
        "formReqSupRetAccNum", "formReqSupChangeAccNum"
    ];

    const basedOnRequestType = [
        "formReqTempDisco", "formReqReconnect"
    ];

    const ffupBasedOnSelectedIntent = [
        "formFfupReloc", "formFfupDowngrade", "formFfupUpgrade", "formFfupInmove", "formFfupChangeTelNum", "formFfupMisappPay", "formFfupPermaDisco", "formFfupCignalIPTV"
    ];

    const ffupBasedOnSelectedIntentAndRequestType = [
        "formFfupBillAdjust", "formFfupSpecialFeat"
    ];

    const ffupBasedOnOptGroupLabel = [
        "formFfupChangeOwnership"
    ];

    const ffupBasedOnRequestType = [
        "formFfupTempDisco", "formFfupReconnect", "formFfupTempDisco"
    ];
    
    // Non-Tech Requests
    if (basedOnSelectedIntentText.includes(vars.selectedIntent)) {
        concernCopiedText = `CNDT_CCBO ${selectOrigin}${sfCaseNum}\n\nC: ${vars.selectedIntentText}`;
        actionsTakenCopiedText = constructFuseOutput();
        outboundDetailsCopiedText = constructOutboundDetails();
    } else if (basedOnSelectedIntentAndRequestType.includes(vars.selectedIntent)) {
        concernCopiedText = `CNDT_CCBO ${selectOrigin}${sfCaseNum}\n\nC: ${vars.selectedIntentText} - ${vars.requestType}`;
        actionsTakenCopiedText = constructFuseOutput();
        outboundDetailsCopiedText = constructOutboundDetails();
    } else if (basedOnSelectedOptGroupLabel.includes(vars.selectedIntent)) {
        concernCopiedText = `CNDT_CCBO ${selectOrigin}${sfCaseNum}\n\nC: ${vars.selectedOptGroupLabel} - ${vars.selectedIntentText}`;
        actionsTakenCopiedText = constructFuseOutput();
        outboundDetailsCopiedText = constructOutboundDetails();
    } else if (basedOnRequestType.includes(vars.selectedIntent)) {
        concernCopiedText = `CNDT_CCBO ${selectOrigin}${sfCaseNum}\n\nC: ${vars.requestType}`;
        actionsTakenCopiedText = constructFuseOutput();
        outboundDetailsCopiedText = constructOutboundDetails();
    }

    // Non-Tech Follow-ups
    else if (ffupBasedOnSelectedIntent.includes(vars.selectedIntent)) {
        concernCopiedText = `CNDT_CCBO ${selectOrigin}${sfCaseNum}\n\nC: FOLLOW-UP ${vars.ffupStatus} - ${vars.selectedIntentText}`;
        actionsTakenCopiedText = constructFuseOutput();
        outboundDetailsCopiedText = constructOutboundDetails();
    } else if (ffupBasedOnSelectedIntentAndRequestType.includes(vars.selectedIntent)) {
        concernCopiedText = `CNDT_CCBO ${selectOrigin}${sfCaseNum}\n\nC: FOLLOW-UP ${vars.ffupStatus} - ${vars.selectedIntentText} (${vars.requestType})`;
        actionsTakenCopiedText = constructFuseOutput();
        outboundDetailsCopiedText = constructOutboundDetails();
    } else if (ffupBasedOnOptGroupLabel.includes(vars.selectedIntent)) {
        concernCopiedText = `CNDT_CCBO ${selectOrigin}${sfCaseNum}\n\nC: FOLLOW-UP ${vars.ffupStatus} - ${vars.selectedOptGroupLabel}`;
        actionsTakenCopiedText = constructFuseOutput();
        outboundDetailsCopiedText = constructOutboundDetails();
    } else if (ffupBasedOnRequestType.includes(vars.selectedIntent)) {
        concernCopiedText = `CNDT_CCBO ${selectOrigin}${sfCaseNum}\n\nC: FOLLOW-UP ${vars.ffupStatus} - ${vars.requestType}`;
        actionsTakenCopiedText = constructFuseOutput();
        outboundDetailsCopiedText = constructOutboundDetails();
    } 


    concernCopiedText = concernCopiedText.toUpperCase();
    actionsTakenCopiedText = actionsTakenCopiedText.toUpperCase();

    const calloutAttempt = getFuseFieldValueIfVisible("calloutAttempt");

    let textToCopyGroups;

    if (calloutAttempt && calloutAttempt !== "1st") {
        // Only outbound details
        textToCopyGroups = [
            outboundDetailsCopiedText
        ].filter(Boolean);
    } else {
        // Full output
        textToCopyGroups = [
            [
                concernCopiedText,
                actionsTakenCopiedText,
                outboundDetailsCopiedText
            ].filter(Boolean).join("\n")
        ].filter(Boolean);
    }

    if (showFloating) {
        if (calloutAttempt && calloutAttempt !== "1st") {
            showFuseFloatingDiv("", "", outboundDetailsCopiedText);
        } else {
            showFuseFloatingDiv(concernCopiedText, actionsTakenCopiedText, outboundDetailsCopiedText);
        }
    }

    return textToCopyGroups;
}

function showFuseFloatingDiv(concernCopiedText, actionsTakenCopiedText, outboundDetailsCopiedText) {
    const floatingDiv = document.getElementById("floatingDiv");
    const overlay = document.getElementById("overlay");

    let floatingDivHeader = document.getElementById("floatingDivHeader");
    if (!floatingDivHeader) {
        floatingDivHeader = document.createElement("div");
        floatingDivHeader.id = "floatingDivHeader";
        floatingDiv.prepend(floatingDivHeader);
    }
    floatingDivHeader.textContent = "CASE DOCUMENTATION: Click the text to copy!";

    const copiedValues = document.getElementById("copiedValues");
    copiedValues.innerHTML = "";

    const seenSections = new Set();

    function addUniqueText(text) {
        if (text && !seenSections.has(text)) {
            seenSections.add(text);
            return text;
        }
        return null;
    }

    const combinedSections = [
        [addUniqueText(concernCopiedText), addUniqueText(actionsTakenCopiedText), addUniqueText(outboundDetailsCopiedText)].filter(Boolean).join("\n"),
    ];

    combinedSections.forEach(text => {
        if (text.trim()) {
            const section = document.createElement("div");
            section.style.marginTop = "5px";
            section.style.padding = "10px";
            section.style.border = "1px solid #ccc";
            section.style.borderRadius = "4px";
            section.style.cursor = "pointer";
            section.style.whiteSpace = "pre-wrap";
            section.style.transition = "background-color 0.2s, transform 0.1s ease";
            section.textContent = text;

            section.addEventListener("mouseover", () => {
                section.style.backgroundColor = "#edf2f7";
            });
            section.addEventListener("mouseout", () => {
                section.style.backgroundColor = "";
            });

            section.onclick = () => {
                section.style.transform = "scale(0.99)";
                navigator.clipboard.writeText(text).then(() => {
                    section.style.backgroundColor = "#ddebfb";
                    setTimeout(() => {
                        section.style.transform = "scale(1)";
                        section.style.backgroundColor = "";
                    }, 150);
                }).catch(err => {
                    console.error("Copy failed:", err);
                });
            };

            copiedValues.appendChild(section);
        }
    });

    overlay.style.display = "block";
    floatingDiv.style.display = "block";

    setTimeout(() => {
        floatingDiv.classList.add("show");
    }, 10);

    const closeButton = document.getElementById("okButton");
    closeButton.textContent = "Close";

    closeButton.onclick = () => {
        floatingDiv.classList.remove("show");
        setTimeout(() => {
            floatingDiv.style.display = "none";
            overlay.style.display = "none";
        }, 300);
    };
}

// Generating Follow-up Notes
function ffupButtonHandler(showFloating = true, enableValidation = true, includeSpecialInst = true, showSpecialInstSection = true) {
    const vars = initializeVariables();

    const missingFields = [];
    if (!vars.caseOrigin) missingFields.push("caseOrigin");
    if (!vars.pldtUser) missingFields.push("PLDT Username");

    if (enableValidation && missingFields.length > 0) {
        alert(`Please fill out the following fields: ${missingFields.join(", ")}`);
        return;
    }

    function constructOutputFFUP(fields) {
        const seenFields = new Set();
        let output = "";

        const channel = getFieldValueIfVisible("selectChannel");
        const pldtUser = getFieldValueIfVisible("pldtUser");
        if (channel && pldtUser) {
            output += `${channel}_${pldtUser}\n`;
            seenFields.add("selectChannel");
            seenFields.add("pldtUser");
        } else if (channel) {
            output += `Channel: ${channel}\n`;
            seenFields.add("selectChannel");
        }

        let remarks = "";
        let offerALS = "";
        let sla = "";

        fields.forEach(field => {
            const fieldElement = document.querySelector(`[name="${field.name}"]`);
            let value = getFieldValueIfVisible(field.name);

            if (!value || seenFields.has(field.name)) return;

            seenFields.add(field.name);

            if (fieldElement && fieldElement.tagName.toLowerCase() === "textarea") {
                value = value.replace(/\n/g, "/ ");
            }

            switch (field.name) {
                case "remarks":
                    remarks = value;
                    break;
                
                case "alsPackOffered":
                    output += `${field.label?.toUpperCase() || field.name.toUpperCase()}: Offered ${value}\n`;
                    break;

                case "offerALS":
                    offerALS = value;

                    let alsStatusNotes = "";

                    if (value === "Offered ALS/Accepted") {
                        alsStatusNotes = "Offered ALS and Customer Accepted";
                    } else if (value === "Offered ALS/Declined") {
                        alsStatusNotes = "Offered ALS but Customer Declined";
                    } else if (value === "Offered ALS/No Confirmation") {
                        alsStatusNotes = "Offered ALS but No Confirmation";
                    } else if (value === "Previous Agent Already Offered ALS") {
                        alsStatusNotes = "Prev Agent Already Offered ALS";
                    }

                    if (alsStatusNotes) {
                        offerALS = alsStatusNotes;
                    }
                    break;

                case "sla":
                    sla = value;
                    break;

                default:
                    output += `${field.label?.toUpperCase() || field.name.toUpperCase()}: ${value}\n`;
            }
        });

        const issueResolvedValue = document.querySelector('[name="issueResolved"]')?.value || "";

        const filteredRemarks = [remarks, sla, offerALS].filter(field => field?.trim());

        if (issueResolvedValue === "Yes") {
            filteredRemarks.push("Resolved");
        }

        const finalRemarks = filteredRemarks.join(" / ");

        if (finalRemarks) {
        output += `REMARKS: ${finalRemarks}`;
        }

        return output;
    }

    const fields = [
        { name: "selectChannel" },
        { name: "pldtUser" },
        { name: "sfCaseNum", label: "SF#" },
        { name: "cepCaseNumber", label: "Case #" },
        { name: "pcNumber", label: "Parent Case" },
        { name: "ticketStatus", label: "Case Status" },
        { name: "ffupCount", label: "No. of Follow-Up(s)" },
        { name: "statusReason", label: "STATUS REASON" },
        { name: "subStatus", label: "SUB STATUS" },
        { name: "queue", label: "QUEUE" },
        { name: "ticketAge", label: "Ticket Age" },
        { name: "investigation1", label: "Investigation 1" },
        { name: "investigation2", label: "Investigation 2" },
        { name: "investigation3", label: "Investigation 3" },
        { name: "investigation4", label: "Investigation 4" },
        { name: "remarks", label: "Remarks" },
        { name: "sla", label: "SLA" },
    ];

    const ffupCopiedText = constructOutputFFUP(fields).toUpperCase();
    const specialInstCopiedText1 = (specialInstButtonHandler(false) || "").toUpperCase();
    const specialInstCopiedText2 = (specialInstButtonHandler(true) || "").toUpperCase();

    let combinedFollowUpText = ffupCopiedText;

    if (includeSpecialInst && specialInstCopiedText1.trim()) {
        combinedFollowUpText += `\n\n${specialInstCopiedText1}`;
    }

    const sections = [combinedFollowUpText];
    const sectionLabels = ["Follow-Up Case Notes"];

    if (showSpecialInstSection && specialInstCopiedText2.trim()) {
        sections.push(specialInstCopiedText2);
        sectionLabels.push("Special Instructions");
    }

    if (showFloating) {
        showFfupFloatingDiv(sections, sectionLabels);
    }

    return sections.join("\n\n");

}

function showFfupFloatingDiv(sections, sectionLabels) {
    const floatingDiv = document.getElementById("floatingDiv");
    const overlay = document.getElementById("overlay");
    const copiedValues = document.getElementById("copiedValues");

    if (!floatingDiv || !overlay || !copiedValues) {
        console.error("Required DOM elements are missing");
        return;
    }

    let floatingDivHeader = document.getElementById("floatingDivHeader");
    if (!floatingDivHeader) {
        floatingDivHeader = document.createElement("div");
        floatingDivHeader.id = "floatingDivHeader";
        floatingDiv.appendChild(floatingDivHeader);
    }

    floatingDivHeader.textContent = "CASE DOCUMENTATION: Click the text to copy!";

    copiedValues.innerHTML = "";

    sections.forEach((sectionText, index) => {
        const label = document.createElement("div");
        label.style.fontWeight = "bold";
        label.style.marginTop = index === 0 ? "0" : "10px";
        label.textContent = sectionLabels[index] || `SECTION ${index + 1}`;
        copiedValues.appendChild(label);

        const section = document.createElement("div");
        section.style.marginTop = "5px";
        section.style.padding = "10px";
        section.style.border = "1px solid #ccc";
        section.style.borderRadius = "4px";
        section.style.cursor = "pointer";
        section.style.whiteSpace = "pre-wrap";
        section.style.transition = "background-color 0.2s, transform 0.1s ease";
        section.classList.add("noselect");

        section.textContent = sectionText;

        section.addEventListener("mouseover", () => {
        section.style.backgroundColor = "#edf2f7";
        });
        section.addEventListener("mouseout", () => {
        section.style.backgroundColor = "";
        });

        section.onclick = () => {
        section.style.transform = "scale(0.99)";
        navigator.clipboard.writeText(sectionText).then(() => {
            section.style.backgroundColor = "#ddebfb";
            setTimeout(() => {
            section.style.transform = "scale(1)";
            section.style.backgroundColor = "";
            }, 150);
        }).catch(err => {
            console.error("Copy failed:", err);
        });
        };

        copiedValues.appendChild(section);
    });

    overlay.style.display = "block";
    floatingDiv.style.display = "block";

    setTimeout(() => {
        floatingDiv.classList.add("show");
    }, 10);

    const closeButton = document.getElementById("okButton");
    closeButton.textContent = "Close";

    closeButton.onclick = () => {
        floatingDiv.classList.remove("show");
        setTimeout(() => {
        floatingDiv.style.display = "none";
        overlay.style.display = "none";
        }, 300);
    };
}

// Generating CEP Notes
function cepCaseTitle() {
    const vars = initializeVariables();

    let caseTitle = "";

    const intentGroups = {
        group1: { intents: ["form100_1", "form100_2", "form100_3", "form100_4", "form100_5", "form100_6", "form100_7"], title: "NO DIAL TONE AND NO INTERNET CONNECTION" },
        group2: { intents: ["form101_1", "form101_2", "form101_3", "form101_4"], title: "NO DIAL TONE" },
        group3: { intents: ["form102_1", "form102_2", "form102_3", "form102_4", "form102_5", "form102_6", "form102_7"], title: "NOISY LINE" },
        group4: { intents: ["form103_1", "form103_2", "form103_3"], title: "CANNOT MAKE CALLS" },
        group5: { intents: ["form103_4", "form103_5"], title: "CANNOT RECEIVE CALLS" },
        group6: { intents: ["form500_1", "form500_2"], title: "NO INTERNET CONNECTION" },
        group7: { intents: ["form500_3", "form500_4"], title: () => vars.meshtype.toUpperCase() },
        group8: { intents: ["form501_1", "form501_2", "form501_3"], title: "SLOW INTERNET CONNECTION" },
        group9: { intents: ["form501_4"], title: "FREQUENT DISCONNECTION" },
        group10: { intents: ["form501_5"], title: "Gaming - High Latency" },
        group11: { intents: ["form501_5"], title: "Gaming - Lag" },
        group12: { intents: ["form502_1", "form502_2"], title: "SELECTIVE BROWSING" },
        group13: { intents: ["form510_1", "form510_2", "form510_3", "form510_4", "form510_5", "form510_6", "form510_7", "form510_8"], title: "IPTV NO AUDIO VIDEO OUTPUT", useAccountType: true },
        group14: { intents: ["form511_1", "form511_2", "form511_3", "form511_4", "form511_5"], title: "IPTV POOR AUDIO VIDEO QUALITY", useAccountType: true },
        group15: { intents: ["form512_1", "form512_2", "form512_3"], title: "IPTV MISSING SET-TOP-BOX FUNCTIONS", useAccountType: true },
        group16: { intents: ["form300_1", "form300_2", "form300_3"], title: "REQUEST MODEM/ONU GUI ACCESS", useAccountType: true },
        group17: { intents: ["form300_4", "form300_5"], title: "REQUEST CHANGE MODEM ONU CONNECTION MODE", useAccountType: true },
        group18: { intents: ["form300_6"], title: "REQUEST DATA BIND PORT", useAccountType: true },
        group19: { intents: ["form300_7"], title: "REQUEST FOR PUBLIC IP", useAccountType: true },
        group20: { intents: ["form300_8"], title: "REQUEST FOR PRIVATE IP", useAccountType: true },
        group21: { intents: ["formStrmApps_1"], title: "EUFY", useGamma: false },
        group22: { intents: ["formStrmApps_2"], title: "STREAM TV", useGamma: false },
        group23: { intents: ["formStrmApps_3"], title: "NETFLIX", useGamma: false },
        group24: { intents: ["formStrmApps_4"], title: "VIU", useGamma: false },
        group25: { intents: ["formStrmApps_5"], title: "HBO MAX", useGamma: false },
        group26: { intents: ["form500_6"], title: "NO SIM LIGHT", alwaysOn: true },
    };

    for (const group of Object.values(intentGroups)) {
        if (group.intents.includes(vars.selectedIntent)) {
            const prefix = group.useAccountType
                ? (vars.accountType === "RADIUS " ? "GAMMA " : "")
                : (group.useGamma === false ? "" : (vars.facility === "Fiber - Radius" ? "GAMMA " : ""));

            let title;
            if (vars.selectedIntent === "form501_5" || vars.selectedIntent === "form501_6") {
                if ([
                    "Individual Trouble", 
                    "Network Trouble - High Latency", 
                    "Network Trouble - Slow/Intermittent Browsing", 
                    "High Latency"
                ].includes(vars.investigation4)) {
                    title = "SLOW INTERNET CONNECTION";
                } else if (vars.investigation4 === "Cannot Reach Specific Website") {
                    title = "HIGH LATENCY OR LAG GAMING";
                } else {
                    showAlert("Please fill out Investigation 4 to proceed.");
                    return "";
                }
            } else {
                title = typeof group.title === "function" ? group.title() : group.title;
            }

            if (group.alwaysOn) {
                caseTitle = `ALWAYS ON-${vars.caseOrigin} - ${title}`;
            } else {
                caseTitle = `${prefix}${vars.caseOrigin} - ${title}`;
            }

            break;
        }
    }

    return caseTitle;

}

function cepCaseDescription(showAddlDetails = true) {
    const vars = initializeVariables();

    const techIntents = [
        "form100_1","form100_2","form100_3","form100_4","form100_5","form100_6","form100_7",
        "form101_1","form101_2","form101_3","form101_4",
        "form102_1","form102_2","form102_3","form102_4","form102_5","form102_6","form102_7",
        "form103_1","form103_2","form103_3","form103_4","form103_5",
        "form500_1","form500_2","form500_3","form500_4","form500_6",
        "form501_1","form501_2","form501_3","form501_4","form501_5",
        "form502_1","form502_2",
        "form510_1","form510_2","form510_3","form510_4","form510_5","form510_6","form510_7","form510_8",
        "form511_1","form511_2","form511_3","form511_4","form511_5",
        "form512_1","form512_2","form512_3",
        "formStrmApps_1","formStrmApps_2","formStrmApps_3","formStrmApps_4","formStrmApps_5",
        "form300_1","form300_2","form300_3","form300_4","form300_5","form300_6","form300_7", "form300_8"
    ];

    let caseDescription = "";
    if (!techIntents.includes(vars.selectedIntent)) return caseDescription;

    const selectedValue = vars.selectedIntent;
    const selectedIntent = document.querySelector("#selectIntent")?.value.trim() || "";
    const reso = document.querySelector('[name="resolution"]')?.value.trim() || "";
    const testedOk = document.querySelector('[name="testedOk"]')?.value.trim() || "";
    const selectedOption = document.querySelector(`#selectIntent option[value="${selectedValue}"]`);
    const investigation3Index = document.querySelector('[name="investigation3"]');
    const visibleFields = [];

    const getValueIfVisible = (name) => {
        const el = document.querySelector(`[name="${name}"]`);
        if (!el || !isFieldVisible(name)) return "";
        const val = el.value?.trim();
        return val ? val : "";
    };

    if (selectedOption) {
        const optionText = selectedValue === "form500_6"
            ? "Back-up wi-Fi not working - No Sim light"
            : selectedOption.textContent.trim();

        visibleFields.push(reso === "Tested Ok" ? `${optionText} - ${reso}` : optionText);
    }

    if (isFieldVisible("cvReading") && vars.cvReading) {
        visibleFields.push(vars.cvReading);
    } else if (
        vars.facility !== "Fiber - Radius" &&
        vars.accountType !== "RADIUS" &&
        isFieldVisible("investigation3") &&
        investigation3Index &&
        investigation3Index.selectedIndex > 0 &&
        vars.investigation3 &&
        !vars.investigation3.startsWith("Not Applicable")
    ) {
        visibleFields.push(investigation3Index.options[investigation3Index.selectedIndex].textContent);
    }

    if (getValueIfVisible("Option82")) 
        visibleFields.push(getValueIfVisible("Option82"));

    if (getValueIfVisible("rxPower"))
        visibleFields.push(`RX: ${vars.rxPower}`);

    if (
        vars.investigation1 === "Blinking/No PON/FIBR/ADSL" &&
        (!vars.investigation2 || vars.investigation2 === "Null Value") &&
        ["Failed to collect line card information", "Without Line Problem Detected"].includes(vars.investigation3) &&
        vars.investigation4 === "Individual Trouble" &&
        vars.onuSerialNum
    ) visibleFields.push(vars.onuSerialNum);

    const pushFormFields = (fields) => {
        fields.forEach(f => {
            const val = getValueIfVisible(f.name);
            if (val) visibleFields.push(f.label ? `${f.label}: ${val}` : val);
        });
    };

    if (showAddlDetails) {
        if (reso === "Tested Ok" || testedOk === "Yes") {
            if (selectedIntent === "form500_1") {
                pushFormFields([
                    { name: "dmsInternetStatus", label: "DMS Internet/Data Status" },
                    { name: "connectedDevices", label: "No of devices connected" },
                    { name: "dmsSelfHeal", label: "Self Heal Result" },
                    { name: "onuModel", label: "ONU Model" },
                    { name: "onuSerialNum", label: "SN" },
                    { name: "dmsWifiState", label: "DMS Wifi Status" }
                ]);
            } else if (selectedIntent === "form501_1" || selectedIntent === "form501_2") {
                pushFormFields([
                    { name: "dmsInternetStatus", label: "DMS Internet/Data Status" },
                    { name: "connectedDevices", label: "No of devices connected" },
                    { name: "dmsSelfHeal", label: "Self Heal Result" },
                    { name: "onuModel", label: "ONU Model" },
                    { name: "onuSerialNum", label: "SN" },
                    { name: "speedTestResult", label: "Initial Speedtest Result" },
                    { name: "bandsteering", label: "Bandsteering" },
                    { name: "saaaBandwidthCode", label: "NMS Skin BW Code" }
                ]);
            } else if (selectedIntent === "form502_1") {
                pushFormFields([
                    { name: "ipAddress", label: "IP Address" },
                    { name: "dmsInternetStatus", label: "DMS Internet/Data Status" },
                    { name: "connectedDevices", label: "No of devices connected" },
                    { name: "websiteURL", label: "Affected Site, Application or VPN" },
                    { name: "errMsg", label: "Error" },
                    { name: "vpnBlocking", label: "Possible VPN Blocking issue" },
                    { name: "vpnRequired", label: "Using VPN in accessing site or app" },
                    { name: "otherISP", label: "Result using other ISP" },
                    { name: "itSupport", label: "Has IT support" },
                    { name: "itRemarks", label: "IT Support Remarks" }
                ]);
            }
        }
    }

    if (getValueIfVisible("contactName"))
        visibleFields.push("CONTACT PERSON: " + vars.contactName);

    if (getValueIfVisible("cbr"))
        visibleFields.push("CBR: " + vars.cbr);

    if ((showAddlDetails && reso !== "Tested Ok") || testedOk === "No") {
        pushFormFields([
            { name: "availability", label: "PREFERRED DATE AND TIME" },
            { name: "address" },
            { name: "landmarks", label: "LANDMARK" },
            { name: "rptCount", label: "REPEATER" }
        ]);
    }

    if (getValueIfVisible("WOCAS"))
        visibleFields.push("WOCAS: " + vars.WOCAS);

    caseDescription = visibleFields.join("/ ");
    return caseDescription;
}

function cepCaseNotes() {
    const vars = initializeVariables();

    const techIntents = [
        "form100_1", "form100_2", "form100_3", "form100_4", "form100_5", "form100_6", "form100_7",
        "form101_1", "form101_2", "form101_3", "form101_4",
        "form102_1", "form102_2", "form102_3", "form102_4", "form102_5", "form102_6", "form102_7",
        "form103_1", "form103_2", "form103_3", "form103_4", "form103_5",
        "form300_1", "form300_2", "form300_3", "form300_4", "form300_5", "form300_6", "form300_7", "form300_8",
        "form500_1", "form500_2", "form500_3", "form500_4", "form500_6",
        "form501_1", "form501_2", "form501_3", "form501_4", "form501_5",
        "form502_1", "form502_2",
        "form510_1", "form510_2", "form510_3", "form510_4", "form510_5", "form510_6", "form510_7", "form510_8",
        "form511_1", "form511_2", "form511_3", "form511_4", "form511_5",
        "form512_1", "form512_2", "form512_3",
        "formStrmApps_1", "formStrmApps_2", "formStrmApps_3", "formStrmApps_4", "formStrmApps_5"
    ];

    if (!techIntents.includes(vars.selectedIntent)) {
        return "";
    }

    function constructCaseNotes() {
        const fields = [
            // CEP Investigation Tagging
            { name: "investigation1", label: "Investigation 1" },
            { name: "investigation2", label: "Investigation 2" },
            { name: "investigation3", label: "Investigation 3" },
            { name: "investigation4", label: "Investigation 4" },

            // Other Details
            { name: "sfCaseNum", label: "SF" },
            { name: "outageStatus", label: "Outage" },
            { name: "outageReference", label: "Source Reference" },
            { name: "custAuth", label: "Cust Auth" },
            { name: "simLight", label: "Sim Light Status" },
            { name: "minNumber", label: "MIN" },
            { name: "onuModel", label: "ONU Model" },
            { name: "onuSerialNum", label: "ONU SN" },
            { name: "Option82" },
            { name: "modemLights"},
            { name: "intLightStatus", label: "Internet Light" },
            { name: "wanLightStatus", label: "WAN Light" },
            { name: "onuConnectionType" },

            // Clearview
            { name: "cvReading", label: "CV" },
            { name: "rtaRequest", label: "Real-time Request" },

            //NMS Skin
            { name: "onuRunStats", label: "NMS Skin ONU Status" },
            { name: "rxPower", label: "RX" },
            { name: "vlan", label: "VLAN" },
            { name: "ipAddress", label: "IP Address" },
            { name: "connectedDevices", label: "No. of Connected Devices" },
            { name: "fsx1Status", label: "FXS1" },
            { name: "wanName_3", label: "WAN NAME_3" },
            { name: "srvcType_3", label: "SRVCTYPE_3" },
            { name: "connType_3", label: "CONNTYPE_3" },
            { name: "vlan_3", label: "WANVLAN_3" },
            { name: "saaaBandwidthCode" },
            { name: "routingIndex", label: "Routing Index" },
            { name: "callSource", label: "Call Source" },
            { name: "ldnSet", label: "LDN Set" },
            { name: "option82Config", label: "Option82 Config" },
            { name: "nmsSkinRemarks", label: "NMS" },
            
            // DMS
            { name: "dmsInternetStatus", label: "DMS Internet/Data Status" },
            { name: "deviceWifiBand"},
            { name: "bandsteering", label: "Bandsteering" },
            { name: "dmsVoipServiceStatus", label: "VoIP Status in DMS" },
            { name: "dmsLanPortStatus", label: "LAN Port Status in DMS" },
            { name: "dmsWifiState", label: "Wi-Fi State in DMS" },
            { name: "dmsLan4Status", label: "LAN Port Status in DMS" },
            { name: "dmsSelfHeal"},
            { name: "dmsRemarks", label: "DMS"  },

            // Probe & Troubleshoot
            { name: "callType", label: "Call Type" },
            { name: "lanPortNum", label: "LAN Port Number" },
            { name: "serviceStatus", label: "Voice Service Status" },
            { name: "services", label: "Service(s)" },
            { name: "connectionMethod", label: "Connected via" },
            { name: "deviceBrandAndModel", label: "Device Brand and Model" },
            { name: "specificTimeframe"},
            { name: "speedTestResult", label: "Initial Speedtest Result" },
            { name: "pingTestResult", label: "Ping" },
            { name: "gameNameAndServer"},
            { name: "gameServerIP", label: "Game Server IP Address" },
            { name: "pingTestResult2", label: "Game Server IP Address Ping Test Result" },
            { name: "traceroutePLDT", label: "Tracerout PLDT" },
            { name: "tracerouteExt", label: "Tracerout External" },
            { name: "meshtype" },
            { name: "meshOwnership", label: "Mesh" },
            { name: "websiteURL", label: "Website Address" },
            { name: "errMsg", label: "Error Message" },
            { name: "otherDevice", label: "Tested on Other Devices or Browsers" },
            { name: "vpnBlocking", label: "Possible VPN Blocking Issue" },
            { name: "vpnBlocking", label: "VPN Required When Accessing Website or App" },
            { name: "otherISP", label: "Result Using Other ISP" },
            { name: "itSupport", label: "Has IT Support" },
            { name: "itRemarks", label: "IT Support Remarks" },

            { name: "actualExp", label: "Actual Experience"},
            { name: "remarks", label: "Actions Taken" },

            // Ticket Details
            { name: "pcNumber", label: "Parent Case" },
            { name: "cepCaseNumber" },
            { name: "sla" },

            // For Retracking
            { name: "stbID", label: "STB Serial Number" },
            { name: "smartCardID", label: "Smartcard ID" },
            { name: "accountNum", label: "PLDT Account Number" },
            { name: "cignalPlan", label: "CIGNAL TV Plan" },
            { name: "stbIpAddress", label: "STB IP Address"}, 
            { name: "tsMulticastAddress", label: "Tuned Service Multicast Address"}, 
            { name: "exactExp", label: "Exact Experience"}, 
        ];

        const seenFields = new Set();
        let output = "";
        let retrackingOutput = "";
        let actionsTakenParts = [];

        const req4retrackingValue = document.querySelector('[name="req4retracking"]')?.value || "";
        const retrackingFields = ["stbID", "smartCardID", "accountNum", "cignalPlan", "exactExp"];

        fields.forEach(field => {
            // Skip retracking fields unless request is Yes or specific intent with stbID/smartCardID
            if (
                req4retrackingValue !== "Yes" &&
                retrackingFields.includes(field.name) &&
                !(vars.selectedIntent === "form510_7" && (field.name === "stbID" || field.name === "smartCardID"))
            ) return;

            const inputElement = document.querySelector(`[name="${field.name}"]`);
            let value = getFieldValueIfVisible(field.name);

            // Skip empty selects
            if (inputElement?.tagName === "SELECT" && inputElement.selectedIndex === 0) return;

            if (value && !seenFields.has(field.name)) {
                seenFields.add(field.name);

                // Add units if needed
                let displayValue = value;
                switch (field.name) {
                    case "pingTestResult":
                        displayValue += " MS";
                        break;
                    case "speedTestResult":
                        displayValue += " MBPS";
                        break;
                }

                // Handle field-specific logic
                switch (true) {
                    case field.name.startsWith("investigation"):
                        output += `${field.label}: ${displayValue}\n`;
                        break;

                    case field.name === "outageStatus":
                        if (displayValue === "Yes") {
                            actionsTakenParts.push("Affected by a network outage");
                        } else if (displayValue === "No") {
                            actionsTakenParts.push("Not part of network outage");
                        }

                        break;

                    case field.name === "dmsSelfHeal":
                        if (displayValue === "Yes/Resolved") {
                            actionsTakenParts.push("Performed Self Heal and the Issue was Resolved");
                        } else if (displayValue === "Yes/Unresolved") {
                            actionsTakenParts.push("Performed Self Heal but Issue was still Unresolved");
                        }

                        break;

                    default:
                        actionsTakenParts.push((field.label ? `${field.label}: ` : "") + displayValue);
                }
            }
        });

        if (req4retrackingValue === "Yes") {
            retrackingOutput = "REQUEST FOR RETRACKING\n";
            retrackingFields.forEach(field => {
                const fieldValue = getFieldValueIfVisible(field);
                if (fieldValue) {
                    const label = fields.find(f => f.name === field)?.label || field;
                    retrackingOutput += `${label}: ${fieldValue}\n`;
                }
            });
        }

        const issueResolvedValue = document.querySelector('[name="issueResolved"]')?.value || "";
        if (issueResolvedValue === "Yes") 
            actionsTakenParts.push("Resolved");
        else if (issueResolvedValue === "No - Customer is Unresponsive") 
            actionsTakenParts.push("Customer is Unresponsive");
        else if (issueResolvedValue === "No - Customer is Not At Home") 
            actionsTakenParts.push("Customer is Not At Home");
        else if (issueResolvedValue === "No - Customer Declined Further Assistance") 
            actionsTakenParts.push("Customer Declined Further Assistance");
        else if (issueResolvedValue === "No - System Ended Chat") 
            actionsTakenParts.push("System Ended Chat");

        const facilityValue = document.querySelector('[name="facility"]')?.value || "";
        if (facilityValue === "Copper VDSL") 
            actionsTakenParts.push("Copper");

        const actionsTaken = actionsTakenParts.join("/ ");

        const finalNotes = [output.trim(), retrackingOutput.trim(), actionsTaken.trim()]
            .filter(section => section)
            .join("\n\n");

        return finalNotes;
    }

    const notes = constructCaseNotes();
    return notes;

    // If Special Instructions is needed in the future
    // const specialInst = includeSpecialInst ? (specialInstButtonHandler(false) || "").toUpperCase() : "";

    // return [notes, specialInst].filter(Boolean).join("\n\n");

}

function specialInstButtonHandler(includeWocas = true) {
    const vars = initializeVariables();

    const allFields = [
        { name: "contactName", label: "Person to Contact" },
        { name: "cbr", label: "CBR" },
        { name: "availability", label: "Preferred Date & Time" },
        { name: "address", label: "Address" },
        { name: "landmarks", label: "Landmarks" },
        { name: "rptCount", label: "Repeater" },
        { name: "rxPower", label: "RX" },
        { name: "WOCAS", label: "WOCAS" },
        { name: "reOpenStatsReason", label: "Action Taken" },
    ];

    const fieldsToProcess = includeWocas
        ? allFields
        : allFields.filter(field => field.name !== "WOCAS" && field.name !== "rxPower");

    const contactName = getFieldValueIfVisible("contactName");
    const cbr = getFieldValueIfVisible("cbr");

    if (!contactName && !cbr) {
        return "";
    }

    const parts = fieldsToProcess.map(field => {
        if (!isFieldVisible(field.name)) return "";
        const value = getFieldValueIfVisible(field.name);
        if (!value) return "";
        const formattedValue = value.replace(/\n/g, "/ ");
        return `${field.label}: ${formattedValue}`;
    }).filter(Boolean);

    let specialInstCopiedText = parts.join("/ ");

    return specialInstCopiedText.toUpperCase();
}

function validateRequiredFields(filter = []) {
    const fieldLabels = {
        // Description
        "Option82": "Option82",
        "investigation3": "Investigation 3",

        // Case Notes in Timeline
        "facility": "Facility",
        "resType": "Residential Type",
        "outageStatus": "Network Outage Status",
        "accountType": "Account Type",
        "WOCAS": "WOCAS",
        "investigation1": "Investigation 1",
        "investigation2": "Investigation 2",
        "investigation4": "Investigation 4",
        "req4retracking": "Request for Retracking",
        "stbID": "Set-Top-Box ID",
        "smartCardID": "Smartcard ID",
        "cignalPlan": "Cignal TV Plan",
        "onuSerialNum": "Modem/ONU Serial #",
        "onuRunStats": "NMS Skin ONU Status",
        "cvReading": "Clearview Reading",

        // Special Instructions
        "specialInstruct": "Special Instructions",
        "contactName": "Contact Person",
        "cbr": "CBR",
        "availability": "Availability",
        // "address": "Complete Address",
        // "landmarks": "Nearest Landmarks"
    };

    const emptyFields = [];

    for (const field in fieldLabels) {
        const inputField = document.querySelector(`[name="${field}"]`);
        if (isFieldVisible(field)) {
        const isEmpty =
            !inputField ||
            inputField.value.trim() === "" ||
            (inputField.tagName === "SELECT" && inputField.selectedIndex === 0);

        if (isEmpty) {
            emptyFields.push(fieldLabels[field]);
        }
        }
    }

    let alertFields = [];

    if (filter.length === 0 || filter.includes("Title")) {
        // Don't alert for anything
        alertFields = [];
    } else if (filter.includes("Description")) {
        // Only alert for Option82 and Investigation 3 if they're missing
        const importantKeys = ["Option82", "Investigation 3"];
        alertFields = emptyFields.filter(field => importantKeys.includes(field));
    } else if (filter.includes("Case Notes in Timeline")) {
        const importantKeys = ["Facility", "Residential Type", "Network Outage Status", "Account Type", "WOCAS", "Investigation 1", "Investigation 2", "Investigation 3", "Investigation 4", "Request for Retracking", "Set-Top-Box Serial Number", "Smartcard ID", "Cignal TV Plan", "Modem/ONU Serial #", "NMS Skin ONU Status", "Clearview Reading"];
        alertFields = emptyFields.filter(field => importantKeys.includes(field));
    } else if (filter.includes("Special Instructions")) {
        const importantKeys = ["Network Outage Status", "Special Instructions", "Contact Person", "CBR", "Availability", "Complete Address", "Nearest Landmarks"];
        alertFields = emptyFields.filter(field => importantKeys.includes(field));
    }

    if (alertFields.length > 0) {
        alert(`Please complete the following field(s): ${alertFields.join(", ")}`);
    }

    return { emptyFields, alertFields };
}

function cepButtonHandler(showFloating = true, filter = []) {
    const vars = initializeVariables();

    if (!vars.selectedIntent) return;

    const techIntents = [
        "form100_1", "form100_2", "form100_3", "form100_4", "form100_5", "form100_6", "form100_7",
        "form101_1", "form101_2", "form101_3", "form101_4",
        "form102_1", "form102_2", "form102_3", "form102_4", "form102_5", "form102_6", "form102_7",
        "form103_1", "form103_2", "form103_3", "form103_4", "form103_5",
        "form500_1", "form500_2", "form500_3", "form500_4", "form500_6",
        "form501_1", "form501_2", "form501_3", "form501_4", "form501_5",
        "form502_1", "form502_2",
        "form510_1", "form510_2", "form510_3", "form510_4", "form510_5", "form510_6", "form510_7", "form510_8",
        "form511_1", "form511_2", "form511_3", "form511_4", "form511_5",
        "form512_1", "form512_2", "form512_3",
        "formStrmApps_1", "formStrmApps_2", "formStrmApps_3", "formStrmApps_4", "formStrmApps_5",
        "form300_1", "form300_2", "form300_3", "form300_4", "form300_5", "form300_6", "form300_7", "form300_8"
    ];

    if (!techIntents.includes(vars.selectedIntent)) return;

    if (optionNotAvailable()) return "";

    if (vars.selectedIntent.startsWith("form300") && vars.custAuth === "Failed") {
        showAlert("This option is not available. Please use the Salesforce or FUSE button.");
        return;
    }

    const { emptyFields, alertFields } = validateRequiredFields(filter);
    if (alertFields.length > 0) return;

    const dataMap = {
        Title: (cepCaseTitle() || "").toUpperCase(),
        Description: (cepCaseDescription(true) || "").toUpperCase(),
        "Case Notes in Timeline": (cepCaseNotes() || "").toUpperCase(),
        "Special Instructions": (specialInstButtonHandler(true) || "").toUpperCase()
    };

    const filtered = filter.length ? filter : Object.keys(dataMap);
    const textToCopy = filtered.map(key => dataMap[key]).filter(Boolean);

    if (showFloating) {
        showCepFloatingDiv(filtered, textToCopy);
    }

    return textToCopy;
}

function showCepFloatingDiv(labels, textToCopy) {
    const floatingDiv = document.getElementById("floatingDiv");
    const overlay = document.getElementById("overlay");

    let floatingDivHeader = document.getElementById("floatingDivHeader");
    if (!floatingDivHeader) {
        floatingDivHeader = document.createElement("div");
        floatingDivHeader.id = "floatingDivHeader";
        floatingDiv.prepend(floatingDivHeader);
    }

    floatingDivHeader.textContent = "CASE DOCUMENTATION: Click the text to copy!";
    const copiedValues = document.getElementById("copiedValues");
    copiedValues.innerHTML = "";

    textToCopy.forEach((text, index) => {
        if (!text) return;

        const wrapper = document.createElement("div");
        wrapper.style.marginBottom = "10px";

        const label = document.createElement("strong");
        label.textContent = labels[index];
        label.style.marginLeft = "10px";
        wrapper.appendChild(label);

        const section = document.createElement("div");
        section.style.marginTop = "5px";
        section.style.padding = "10px";
        section.style.border = "1px solid #ccc";
        section.style.borderRadius = "4px";
        section.style.cursor = "pointer";
        section.style.whiteSpace = "pre-wrap";
        section.style.transition = "background-color 0.2s, transform 0.1s ease";
        section.classList.add("noselect");
        section.textContent = text;

        section.addEventListener("mouseover", () => section.style.backgroundColor = "#edf2f7");
        section.addEventListener("mouseout", () => section.style.backgroundColor = "");
        section.onclick = () => {
            section.style.transform = "scale(0.99)";
            navigator.clipboard.writeText(text).then(() => {
                section.style.backgroundColor = "#ddebfb";
                setTimeout(() => {
                    section.style.transform = "scale(1)";
                    section.style.backgroundColor = "";
                }, 150);
            });
        };

        wrapper.appendChild(section);
        copiedValues.appendChild(wrapper);
    });

    overlay.style.display = "block";
    floatingDiv.style.display = "block";

    setTimeout(() => floatingDiv.classList.add("show"), 10);

    const closeButton = document.getElementById("okButton");
    closeButton.textContent = "Close";
    closeButton.onclick = () => {
        floatingDiv.classList.remove("show");
        setTimeout(() => {
            floatingDiv.style.display = "none";
            overlay.style.display = "none";
        }, 300);
    };
}

// Generate FUSE and SF notes for Tech Intents
function getSfFieldValueIfVisible(fieldName) {
    const vars = initializeVariables();
    
    if (!isFieldVisible(fieldName)) return "";

    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return "";

    let value = field.value.trim();

    if (field.tagName.toLowerCase() === "textarea") {
        value = value.replace(/\n/g, "/ ");
    }

    return value;
}

function techNotesButtonHandler(showFloating = true) {
    const vars = initializeVariables(); 

    let concernCopiedText = "";
    let actionsTakenCopiedText = "";
    let otherDetailsCopiedText = "";

    const optGroupIntents = [
        "form100_1", "form100_2", "form100_3", "form100_4", "form100_5", "form100_6", "form100_7",
        "form500_1", "form500_2", "form500_3", "form500_4",
        "form502_1", "form502_2",
    ];

    const optTextIntents = [
        "form101_1", "form101_2", "form101_3", "form101_4",
        "form102_1", "form102_2", "form102_3", "form102_4", "form102_5", "form102_6", "form102_7",
        "form103_1", "form103_2", "form103_3", "form103_4", "form103_5",
        "form500_1", "form500_2", "form500_3", "form500_4",
        "form501_1", "form501_2", "form501_3", "form501_4", "form501_5",
        "form510_1", "form510_2", "form510_3", "form510_4", "form510_5", "form510_6", "form510_7", "form510_8",
        "form511_1", "form511_2", "form511_3", "form511_4", "form511_5",
        "form512_1", "form512_2", "form512_3",
        "formStrmApps_1", "formStrmApps_2", "formStrmApps_3", "formStrmApps_4", "formStrmApps_5",
        "form300_1", "form300_2", "form300_3", "form300_4", "form300_5", "form300_6", "form300_7", "form300_8"
    ];

    const alwaysOnIntents = [
        "form500_5", "form501_7", "form101_5", "form510_9", "form500_6"
    ]

    function validateRequiredFields() {
        const fieldLabels = {
            "WOCAS": "WOCAS",
            "remarks": "Actions Taken",
            "upsell": "Upsell",
        };

        let requiredFields = Object.keys(fieldLabels);

        const emptyFields = [];

        requiredFields.forEach(field => {
            const inputField = document.querySelector(`[name="${field}"]`);
            if (isFieldVisible(field)) {
                if (!inputField || inputField.value.trim() === "" ||
                    (inputField.tagName === "SELECT" && inputField.selectedIndex === 0)) {
                    emptyFields.push(fieldLabels[field]);
                }
            }
        });

        if (emptyFields.length > 0) {
            alert(`Please complete the following field(s): ${emptyFields.join(", ")}`);
        }

        return emptyFields;
    }

    function constTechCAOutput() {
        const fields = [

            // Remarks
            { name: "nmsSkinRemarks" },
            { name: "dmsRemarks" },
            { name: "remarks" },

            // Alternative Services
            { name: "offerALS"},
            { name: "alsPackOffered"},
            { name: "effectiveDate", label: "Effectivity Date" },
            { name: "nomiMobileNum", label: "MOBILE #" },

            // Upsell
            { name: "productsOffered", label: "OFFERED" },
            { name: "declineReason", label: "DECLINE REASON" },
            { name: "notEligibleReason", label: "NOT ELIGIBLE FOR UPSELL DUE TO" },
        ];

        const seenFields = new Set();
        let actionsTakenParts = [];

        fields.forEach(field => {
            const inputElement = document.querySelector(`[name="${field.name}"]`);
            let value = getSfFieldValueIfVisible(field.name);

            value = getSfFieldValueIfVisible(field.name);

            if (inputElement && inputElement.tagName === "SELECT" && inputElement.selectedIndex === 0) {
                return;
            }

            const offerALS = document.querySelector('[name="offerALS"]')?.value || "";
            const alsPackValue = getSfFieldValueIfVisible("alsPackOffered");

            if (value && !seenFields.has(field.name)) {
                seenFields.add(field.name);

                if (field.name === "offerALS") {
                    const alsMessages = {
                        "Offered ALS/Accepted": `Customer Accepted ${alsPackValue || "ALS"} Offer`,
                        "Offered ALS/Declined": "Offered ALS But Customer Declined",
                        "Offered ALS/No Confirmation": "Offered ALS But No Confirmation",
                        "Previous Agent Already Offered ALS": "Previous Agent Already Offered ALS"
                        // "Not Applicable" intentionally omitted to skip
                    };

                    const alsValue = alsMessages[offerALS];

                    if (alsValue) actionsTakenParts.push(alsValue);
                } else {
                    if (field.name === "productsOffered" || field.name === "notEligibleReason") {
                        actionsTakenParts.push((field.label ? `${field.label} ` : "") + value);
                    } else {
                        actionsTakenParts.push((field.label ? `${field.label}: ` : "") + value);
                    }
                }
            }
        });

        const issueResolvedValue = document.querySelector('[name="issueResolved"]')?.value || "";

        const issueResolvedMap = {
            "Yes": "Resolved",
            "No - Customer is Unresponsive": "Customer is Unresponsive",
            "No - Customer Declined Further Assistance": "Customer Declined Further Assistance",
            "No - System Ended Chat": "System Ended Chat"
        };

        if (issueResolvedMap[issueResolvedValue]) {
            actionsTakenParts.push(issueResolvedMap[issueResolvedValue]);
        }

        const upsellValue = document.querySelector('[name="upsell"]')?.value || "";

        const upsellMap = {
            "Yes - Accepted": "#CDNTUPGACCEPTED",
            "Yes - Pending Req. (For callback)": "#CDNTUPGFORCALLBACK",
            "No - Declined": "#CDNTUPGDECLINED",
            "No - Ignored": "#CDNTUPGIGNORED",
            "NA - Not Eligible": "#CDNTUPGNOTELIGIBLE"
        };

        const upsellNote = upsellMap[upsellValue] || "";

        let actionsTaken = "A: " + actionsTakenParts.join("/ ");

        if (upsellNote) {
            actionsTaken += "\n\n" + upsellNote;
        }

        return actionsTaken.trim();
    }

    function constOtherDetails() {
        const fields = [
            { name: "investigation1", label: "INVESTIGATION 1" },
            { name: "investigation2", label: "INVESTIGATION 2" },
            { name: "investigation3", label: "INVESTIGATION 3" },
            { name: "investigation4", label: "INVESTIGATION 4" },

            // Other Details
            { name: "custAuth", label: "CUST AUTH" },
            { name: "simLight", label: "Sim Light Status" },
            { name: "minNumber", label: "MIN" },
            { name: "onuModel" },
            { name: "onuSerialNum", label: "ONU SN" },
            { name: "Option82" },
            
            // Network Outage Status
            { name: "outageStatus", label: "OUTAGE" },

            // ONU Lights Status and Connection Type
            { name: "modemLights"},
            { name: "intLightStatus", label: "Internet Light Status" },
            { name: "wanLightStatus", label: "WAN Light Status" },
            { name: "onuConnectionType" },

            // Clearview
            { name: "cvReading", label: "CV" },
            { name: "rtaRequest", label: "Real-time Request" },

            //NMS Skin
            { name: "onuRunStats", label: "NMS Skin ONU Status" },
            { name: "rxPower", label: "RX" },
            { name: "vlan", label: "VLAN" },
            { name: "ipAddress", label: "IP Address" },
            { name: "connectedDevices", label: "No. of Connected Devices" },
            { name: "fsx1Status", label: "FXS1" },
            { name: "wanName_3", label: "WAN NAME_3" },
            { name: "srvcType_3", label: "SRVCTYPE_3" },
            { name: "connType_3", label: "CONNTYPE_3" },
            { name: "vlan_3", label: "WANVLAN_3" },
            { name: "saaaBandwidthCode" },
            { name: "routingIndex", label: "Routing Index" },
            { name: "callSource", label: "Call Source" },
            { name: "ldnSet", label: "LDN Set" },
            { name: "option82Config", label: "Option82 Config" },
            { name: "nmsSkinRemarks", label: "NMS"  },
            
            // DMS
            { name: "dmsInternetStatus", label: "DMS Internet/Data Status" },
            { name: "deviceWifiBand", label: "Device used found in"},
            { name: "bandsteering", label: "Bandsteering" },
            { name: "dmsVoipServiceStatus", label: "VoIP Status in DMS" },
            { name: "dmsLanPortStatus", label: "LAN Port Status in DMS" },
            { name: "dmsWifiState", label: "Wi-Fi State in DMS" },
            { name: "dmsLan4Status", label: "LAN Port Status in DMS" },
            { name: "dmsSelfHeal", label: "Performed Self Heal" },
            { name: "dmsRemarks", label: "DMS" },

            // Probe & Troubleshoot
            { name: "callType", label: "Call Type" },
            { name: "lanPortNum", label: "LAN Port Number" },
            { name: "serviceStatus", label: "Voice Service Status" },
            { name: "services", label: "Service(s)" },
            { name: "outageStatus", label: "Outage" },
            { name: "outageReference", label: "Source Reference" },
            { name: "connectionMethod", label: "Connected via" },
            { name: "deviceBrandAndModel", label: "Device Brand and Model" },
            { name: "specificTimeframe"},
            { name: "speedTestResult", label: "Initial Speedtest Result" },
            { name: "pingTestResult", label: "Ping" },
            { name: "gameNameAndServer"},
            { name: "gameServerIP", label: "Game Server IP Address" },
            { name: "pingTestResult2", label: "Game Server IP Address Ping Test Result" },
            { name: "traceroutePLDT", label: "Tracerout PLDT" },
            { name: "tracerouteExt", label: "Tracerout External" },
            { name: "meshtype" },
            { name: "meshOwnership", label: "Mesh" },
            { name: "websiteURL", label: "Website Address" },
            { name: "errMsg", label: "Error Message" },
            { name: "otherDevice", label: "Tested on Other Devices or Browsers" },
            { name: "vpnBlocking", label: "Possible VPN Blocking Issue" },
            { name: "vpnBlocking", label: "VPN Required When Accessing Website or App" },
            { name: "otherISP", label: "Result Using Other ISP" },
            { name: "itSupport", label: "Has IT Support" },
            { name: "itRemarks", label: "IT Support Remarks" },
            { name: "actualExp", label: "Actual Experience"},

            // For Retracking
            { name: "stbID", label: "STB Serial Number" },
            { name: "smartCardID", label: "Smartcard ID" },
            { name: "accountNum", label: "PLDT Account Number" },
            { name: "cignalPlan", label: "CIGNAL TV Plan" },
            { name: "stbIpAddress", label: "STB IP Address"}, 
            { name: "tsMulticastAddress", label: "Tuned Service Multicast Address"}, 
            { name: "exactExp", label: "Exact Experience"},

            // Ticket Details
            { name: "cepCaseNumber" },
            { name: "pcNumber", label: "PARENT" },
            { name: "sla", label: "SLA" },

            // Special Instructions
            { name: "contactName", label: "CONTACT PERSON" },
            { name: "cbr", label: "CBR" },
            { name: "availability", label: "AVAILABILITY" },
            { name: "address"},
            { name: "landmarks", label: "NEAREST LANDMARK" },
            { name: "rptCount", label: "REPEATER" },
            { name: "WOCAS", label: "WOCAS" }
        ];

        const seenFields = new Set();
        let output = "";
        let retrackingOutput = "";
        let actionsTakenParts = [];

        const req4retrackingValue = document.querySelector('[name="req4retracking"]')?.value || "";
        const retrackingFields = ["stbID", "smartCardID", "accountNum", "cignalPlan", "exactExp"];

        fields.forEach(field => {
            // Skip retracking fields unless request is Yes or specific intent with stbID/smartCardID
            if (
                req4retrackingValue !== "Yes" &&
                retrackingFields.includes(field.name) &&
                !(vars.selectedIntent === "form510_7" && (field.name === "stbID" || field.name === "smartCardID"))
            ) return;

            const inputElement = document.querySelector(`[name="${field.name}"]`);
            const value = getFieldValueIfVisible(field.name);

            // Skip empty selects or custAuth = NA
            if ((inputElement?.tagName === "SELECT" && inputElement.selectedIndex === 0) || (field.name === "custAuth" && value === "NA")) return;

            if (value && !seenFields.has(field.name)) {
                seenFields.add(field.name);

                // Add units if needed
                let displayValue = value;
                if (field.name === "pingTestResult") displayValue += "MS";
                if (field.name === "speedTestResult") displayValue += " MBPS";

                // Determine action part
                let actionPart = (field.label ? `${field.label}: ` : "") + displayValue;

                // Special cases
                switch (field.name) {
                    case "outageStatus":
                        actionPart = value === "Yes"
                            ? "Affected by a network outage"
                            : "Not part of a network outage";
                        break;
                    case "dmsSelfHeal":
                        actionPart = value === "Yes/Resolved"
                            ? "Performed self-heal and the issue was resolved"
                            : value === "Yes/Unresolved"
                                ? "Performed self-heal but the issue was still unresolved"
                                : "Unable to perform self-heal";
                        break;
                }

                // Push action
                actionsTakenParts.push(req4retrackingValue === "Yes"
                    ? "Request for retracking submitted"
                    : actionPart
                );
            }
        });

        const facilityValue = document.querySelector('[name="facility"]')?.value || "";
        if (facilityValue === "Copper VDSL") actionsTakenParts.push("Copper");

        const actionsTaken = actionsTakenParts.join("/ ");

        const finalNotes = [output.trim(), retrackingOutput.trim(), actionsTaken.trim()]
            .filter(section => section)
            .join("\n\n");

        return finalNotes;
    }

    function formatField(label, name) {
        if (!isFieldVisible(name) || !vars[name]) return "";

        const labelPart = label ? `${label}: ` : "";
        return `${labelPart}${vars[name]}`;
    }

    const custName = formatField("CUST NAME", "custName");
    const sfCaseNum = formatField("SF", "sfCaseNum");
    // const pcNumber = formatField("PARENT", "pcNumber");
    // const cepCaseNumber = formatField("", "cepCaseNumber");
    const minNumber = formatField("/ AFFECTED MIN", "minNumber");

    const combinedInfo = [
        custName, sfCaseNum, minNumber
        // , pcNumber, cepCaseNumber
    ]
        .filter(Boolean)
        .join("/ "); 

    const selectedOptGroupLabel = vars.selectedOptGroupLabel ? `/ ${vars.selectedOptGroupLabel}` : "";
    const selectedIntentText = vars.selectedIntentText ? `/ ${vars.selectedIntentText}` : "";
    const queue = formatField("/ QUEUE", "queue");
    const ffupCount = formatField("/ FFUP COUNT", "ffupCount");
    const ticketAge = formatField("/ CASE AGE", "ticketAge");
    // const wocas = formatField("/ WOCAS", "WOCAS");

    const emptyFields = validateRequiredFields();
    if (emptyFields.length > 0) return;

    if (vars.selectedIntent === "formFfupRepair") {
        concernCopiedText = `${combinedInfo}\nC: ${vars.channel}_${vars.pldtUser}/ FOLLOW-UP REPAIR ${vars.ticketStatus}${queue}${ffupCount}${ticketAge}`;
        actionsTakenCopiedText = constTechCAOutput();
    } else if (optGroupIntents.includes(vars.selectedIntent)) {
        concernCopiedText = `${combinedInfo}\nC: ${vars.channel}${selectedOptGroupLabel}`;
        actionsTakenCopiedText = constTechCAOutput();
        if (vars.channel === "CDT-HOTLINE") {
            otherDetailsCopiedText = constOtherDetails();
        }
    } else if (optTextIntents.includes(vars.selectedIntent)) {
        concernCopiedText = `${combinedInfo}\nC: ${vars.channel}${selectedIntentText}`;
        actionsTakenCopiedText = constTechCAOutput();
        if (vars.channel === "CDT-HOTLINE") {
            otherDetailsCopiedText = constOtherDetails();
        }
    } else if (alwaysOnIntents.includes(vars.selectedIntent)) {
        concernCopiedText = `${combinedInfo}\nC: ${vars.channel}${selectedIntentText} (ALWAYS ON)`;
        actionsTakenCopiedText = constTechCAOutput();
        if (vars.channel === "CDT-HOTLINE") {
            otherDetailsCopiedText = constOtherDetails();
        }
    }

    concernCopiedText = concernCopiedText.toUpperCase();
    actionsTakenCopiedText = actionsTakenCopiedText.toUpperCase();
    otherDetailsCopiedText = otherDetailsCopiedText.toUpperCase();
    
    let otherDetailsSections = [];
    if (otherDetailsCopiedText) {
        otherDetailsSections = splitIntoSections(otherDetailsCopiedText, 250);
    }

    const notes_part1 = [
        concernCopiedText,
        actionsTakenCopiedText
    ].filter(Boolean)
    .join("\n");

    const textToCopy = [
        notes_part1,
        otherDetailsSections.join("\n\n")
    ].filter(Boolean).join("\n");

    if (showFloating) {
        showTechNotesFloatingDiv(notes_part1, otherDetailsSections);
    }

    return textToCopy;

}

// Split FUSE notes into sections for Hotline agents
function splitIntoSections(text, maxChars = 250) {
    const sections = [];
    let currentSection = "";

    text.split("/ ").forEach(part => {
        const nextPart = currentSection ? `/ ${part}` : part;
        if ((currentSection + nextPart).length > maxChars) {
            sections.push(currentSection.trim());
            currentSection = part;
        } else {
            currentSection += nextPart;
        }
    });

    if (currentSection.trim()) sections.push(currentSection.trim());
    return sections;
}

function showTechNotesFloatingDiv(notes_part1, notes_part2 = "") {

    const vars = initializeVariables();
    const floatingDiv = document.getElementById("floatingDiv");
    const overlay = document.getElementById("overlay");

    let floatingDivHeader = document.getElementById("floatingDivHeader");
    if (!floatingDivHeader) {
        floatingDivHeader = document.createElement("div");
        floatingDivHeader.id = "floatingDivHeader";
        floatingDiv.prepend(floatingDivHeader);
    }
    floatingDivHeader.textContent = "CASE DOCUMENTATION: Click any section to copy!";

    const copiedValues = document.getElementById("copiedValues");
    copiedValues.innerHTML = "";

    function createCopySection(title, text) {
        const sectionWrapper = document.createElement("div");
        sectionWrapper.style.marginTop = "10px";

        if (title) { 
            const sectionTitle = document.createElement("div");
            sectionTitle.textContent = title;
            sectionTitle.style.fontWeight = "bold";
            sectionTitle.style.marginBottom = "4px";
            sectionWrapper.appendChild(sectionTitle);
        }

        const sectionContent = document.createElement("div");
        sectionContent.textContent = text;
        sectionContent.style.padding = "10px";
        sectionContent.style.border = "1px solid #ccc";
        sectionContent.style.borderRadius = "4px";
        sectionContent.style.cursor = "pointer";
        sectionContent.style.whiteSpace = "pre-wrap";
        sectionContent.style.transition = "background-color 0.2s, transform 0.1s ease";
        sectionContent.classList.add("noselect");

        sectionContent.addEventListener("mouseover", () => {
            sectionContent.style.backgroundColor = "#edf2f7";
        });
        sectionContent.addEventListener("mouseout", () => {
            sectionContent.style.backgroundColor = "";
        });
        sectionContent.onclick = () => {
            sectionContent.style.transform = "scale(0.99)";
            navigator.clipboard.writeText(text).then(() => {
                sectionContent.style.backgroundColor = "#ddebfb";
                setTimeout(() => {
                    sectionContent.style.transform = "scale(1)";
                    sectionContent.style.backgroundColor = "";
                }, 150);
            }).catch(err => {
                console.error("Copy failed:", err);
            });
        };

        sectionWrapper.appendChild(sectionContent);
        return sectionWrapper;
    }

    const isHotline = vars.channel === "CDT-HOTLINE";
    const isFollowUpRepair = vars.selectedIntent === "formFfupRepair";

    if (isHotline && isFollowUpRepair) {
        if (notes_part1.trim()) {
            copiedValues.appendChild(createCopySection("", notes_part1));
        }
    } else if (isHotline) {
        if (notes_part1.trim()) {
            copiedValues.appendChild(createCopySection("Part 1", notes_part1));
        }

        if (Array.isArray(notes_part2) && notes_part2.length > 0) {
            notes_part2.forEach((section, i) => {
                copiedValues.appendChild(createCopySection(`Part ${i + 2}`, section));
            });
        } else if (typeof notes_part2 === "string" && notes_part2.trim()) {
            copiedValues.appendChild(createCopySection("Part 2", notes_part2));
        }
    } else {
        if (notes_part1.trim()) {
            copiedValues.appendChild(createCopySection("", notes_part1));
        }
    }
 
    overlay.style.display = "block";
    floatingDiv.style.display = "block";
    setTimeout(() => floatingDiv.classList.add("show"), 10);

    const closeButton = document.getElementById("okButton");
    closeButton.textContent = "Close";
    closeButton.onclick = () => {
        floatingDiv.classList.remove("show");
        setTimeout(() => {
            floatingDiv.style.display = "none";
            overlay.style.display = "none";
        }, 300);
    };
}

// Generate Bantay Kable notes
function bantayKableButtonHandler(showFloating = true) {
    const vars = initializeVariables();

    function insertCustConcern(value) {
        return value && value !== "" ? `/ ${value}` : "";
    }

    const sfCaseNum = (isFieldVisible("sfCaseNum") && vars.sfCaseNum) 
        ? `/ SF#: ${vars.sfCaseNum}` 
        : "";

    const accountNum = (isFieldVisible("accountNum") && vars.accountNum) 
        ? `/ ACC#: ${vars.accountNum}` 
        : "";

    function constructOutput(fields) {
        const seenFields = new Set();
        let section1 = "";
        let section2 = "";

        let custConcern = vars.custConcern || "";
        const custConcernElement = document.querySelector(`[name="custConcern"]`);
        if (custConcernElement && custConcernElement.tagName.toLowerCase() === "textarea") {
            custConcern = custConcern.replace(/\n/g, "/ ");
        }
        custConcern = custConcern.trim().toUpperCase();

        let remarks = vars.remarks || "";
        const remarksElement = document.querySelector(`[name="remarks"]`);
        if (remarksElement && remarksElement.tagName.toLowerCase() === "textarea") {
            remarks = remarks.replace(/\n/g, "/ ");
        }
        remarks = remarks.trim().toUpperCase();

        section1 += `C: ${vars.channel}${sfCaseNum}${accountNum}${insertCustConcern(custConcern)}\n`;
        section1 += `A: ${remarks}`;

        fields.forEach(field => {
            if (field.name === "custConcern" || field.name === "remarks") return;

            let value = getFieldValueIfVisible(field.name);
            if (!value || seenFields.has(field.name)) return;
            seenFields.add(field.name);

            const fieldElement = document.querySelector(`[name="${field.name}"]`);
            if (fieldElement && fieldElement.tagName.toLowerCase() === "textarea") {
                value = value.replace(/\n/g, " / ");
            }

            value = value.toUpperCase();

            section2 += `${field.label?.toUpperCase() || field.name.toUpperCase()}: ${value}\n`;
        });

        return { section1, section2 };
    }

    const fields = [
        { name: "custConcern", label: "Concern" },
        { name: "remarks", label: "Actions Taken/Remarks" },
        { name: "telNum164", label: "Telephone Number" },
        { name: "callerName", label: "Customer/Caller Name" },
        { name: "contactName", label: "Contact Person" },
        { name: "cbr", label: "Contact Number" },
        { name: "emailAdd", label: "Active Email Address" },
        { name: "address", label: "Address/Landmarks" },
        { name: "concern164", label: "Concern" },
    ];

    const { section1, section2 } = constructOutput(fields);

    const sections = [section1.trim(), section2.trim()];
    const sectionLabels = ["Case Notes", "Endorse to TL or SME (attach a photo of the concern)"];

    if (showFloating) {
        showBantayKableFloatingDiv(sections, sectionLabels);
    }

    return sections.join("\n\n");
}

function showBantayKableFloatingDiv(sections, sectionLabels) {
    const floatingDiv = document.getElementById("floatingDiv");
    const overlay = document.getElementById("overlay");
    const copiedValues = document.getElementById("copiedValues");

    if (!floatingDiv || !overlay || !copiedValues) {
        console.error("Required DOM elements are missing");
        return;
    }

    let floatingDivHeader = document.getElementById("floatingDivHeader");
    if (!floatingDivHeader) {
        floatingDivHeader = document.createElement("div");
        floatingDivHeader.id = "floatingDivHeader";
        floatingDiv.appendChild(floatingDivHeader);
    }

    floatingDivHeader.textContent = "CASE DOC & ENDORSEMENT: Click the text to copy!";
    copiedValues.innerHTML = "";

    sections.forEach((sectionText, index) => {
        const label = document.createElement("div");
        label.style.fontWeight = "bold";
        label.style.marginTop = index === 0 ? "0" : "10px";
        label.textContent = sectionLabels[index] || `SECTION ${index + 1}`;
        copiedValues.appendChild(label);

        const section = document.createElement("div");
        section.style.marginTop = "5px";
        section.style.padding = "10px";
        section.style.border = "1px solid #ccc";
        section.style.borderRadius = "4px";
        section.style.cursor = "pointer";
        section.style.whiteSpace = "pre-wrap";
        section.style.transition = "background-color 0.2s, transform 0.1s ease";
        section.classList.add("noselect");

        section.textContent = sectionText;

        section.onclick = () => {
            section.style.transform = "scale(0.99)";
            navigator.clipboard.writeText(sectionText).then(() => {
                section.style.backgroundColor = "#ddebfb";
                setTimeout(() => {
                    section.style.transform = "scale(1)";
                    section.style.backgroundColor = "";
                }, 150);
            }).catch(err => {
                console.error("Copy failed:", err);
            });
        };

        copiedValues.appendChild(section);
    });

    overlay.style.display = "block";
    floatingDiv.style.display = "block";

    setTimeout(() => {
        floatingDiv.classList.add("show");
    }, 10);

    const closeButton = document.getElementById("okButton");
    closeButton.textContent = "Close";
    closeButton.onclick = () => {
        floatingDiv.classList.remove("show");
        setTimeout(() => {
            floatingDiv.style.display = "none";
            overlay.style.display = "none";
        }, 300);
    };
}

// Generate Endorsement form and notes
function endorsementForm() {
    const vars = initializeVariables();

    if (vars.selectedIntent === "form500_5" || vars.selectedIntent === "form501_7") {
        window.open(
            "https://forms.office.com/pages/responsepage.aspx?id=UzSk3GO58U-fTXXA3_2oOdfxlbG-2mJDqefhFxYwjdNUNVpIMTVMU0VLWU1OVFg2Q04wSEhGQjc0Ry4u&route=shorturl",
            "_blank"
        );
        return;
    }
    
    const overlay = document.getElementById("overlay");
    overlay.style.display = "block"; 

    const floating2Div = document.createElement("div");
    floating2Div.id = "floating2Div"; 

    const header = document.createElement("div");
    header.id = "floating2DivHeader";
    header.innerText = "Endorsement Details";
    floating2Div.appendChild(header);

    const form3Container = document.createElement("div");
    form3Container.id = "form3Container";

    floating2Div.appendChild(form3Container);

    const table = document.createElement("table");
    table.id = "form2Table";

    const formFields = [
        { label: "Endorsement Type", type: "select", name: "endorsementType", options: ["", "Zone", "Network", "Potential Crisis", "Sup Call"]},
        { label: "WOCAS", type: "textarea", name: "WOCAS2" },
        { label: "SF Case #", type: "number", name: "sfCaseNum2" },
        { label: "Account Name", type: "text", name: "accOwnerName" },
        { label: "Account #", type: "number", name: "accountNum2" },
        { label: "Telephone #", type: "number", name: "landlineNum2" },
        { label: "Contact Person", type: "text", name: "contactName2" },
        { label: "Mobile #/CBR", type: "number", name: "cbr2" },
        { label: "Preferred Date & Time", type: "text", name: "availability2" },
        { label: "Address", type: "textarea", name: "address2" },
        { label: "Landmarks", type: "textarea", name: "landmarks2" },
        { label: "CEP Case #", type: "number", name: "cepCaseNumber2" },
        { label: "Queue", type: "text", name: "queue2" },
        { label: "Ticket Status", type: "text", name: "ticketStatus2" },
        { label: "Agent Name", type: "text", name: "agentName2" },
        { label: "Team Leader", type: "text", name: "teamLead2" },
        { label: "Reference #", type: "", name: "refNumber2"},
        { label: "Payment Channel", type: "", name: "paymentChannel2"},
        { label: "Amount Paid", type: "", name: "amountPaid2"},
        { label: "Date", type: "date", name: "date" },
        { label: "Escalation Remarks", type: "textarea", name: "remarks2", placeholder: "Please indicate the specific reason for escalation. Do NOT include actions taken in this field." },
    ];

    formFields.forEach(field => {
        const row = document.createElement("tr");
        row.style.display = field.name === "endorsementType" ? "table-row" : "none"; 

        const td = document.createElement("td");
        td.colSpan = 2;

        const divInput = document.createElement("div");
        divInput.className = field.type === "textarea" ? "form3DivTextarea" : "form3DivInput";

        const label = document.createElement("label");
        label.textContent = field.label;
        label.className = field.type === "textarea" ? "form3-label-textarea" : "form3-label";
        label.setAttribute("for", field.name);

        let input;

        if (field.type === "select") {
            input = document.createElement("select");
            input.name = field.name;
            input.className = "form3-input";
            
            field.options.forEach(optionValue => {
                const option = document.createElement("option");
                option.value = optionValue;
                option.textContent = optionValue;
                input.appendChild(option);
            });
        } else if (field.type === "textarea") {
            input = document.createElement("textarea");
            input.name = field.name;
            input.className = "form3-textarea";
            input.rows = field.name === "remarks2" ? 4 : 2;

            if (field.placeholder) {
                input.placeholder = field.placeholder;
            }
        } else {
            input = document.createElement("input");
            input.type = field.type;
            input.name = field.name;
            input.className = "form3-input";

            if (field.type === "date" && input.showPicker) {
                input.addEventListener("focus", () => input.showPicker());
                input.addEventListener("click", () => input.showPicker());
            }
        }

        divInput.appendChild(label);
        divInput.appendChild(input);
        td.appendChild(divInput);
        row.appendChild(td);
        table.appendChild(row);
    });

    form3Container.appendChild(table);

    const autofillMappings = [
        { source: "WOCAS", target: "WOCAS2" },
        { source: "sfCaseNum", target: "sfCaseNum2" },
        { source: "accountNum", target: "accountNum2" },
        { source: "landlineNum", target: "landlineNum2" },
        { source: "contactName", target: "contactName2" },
        { source: "cbr", target: "cbr2" },
        { source: "availability", target: "availability2" },
        { source: "address", target: "address2" },
        { source: "landmarks", target: "landmarks2" },
        { source: "cepCaseNumber", target: "cepCaseNumber2" },
        { source: "queue", target: "queue2" },
        { source: "ticketStatus", target: "ticketStatus2" },
        { source: "agentName", target: "agentName2" },
        { source: "teamLead", target: "teamLead2" },
    ];

    autofillMappings.forEach(({ source, target }) => {
        const sourceElement = document.querySelector(`#form1Container [name='${source}']`) ||
                              document.querySelector(`#form2Container [name='${source}']`);
        const targetElement = table.querySelector(`[name='${target}']`);

        if (sourceElement && targetElement) {
            let value = sourceElement.value;
            targetElement.value = value.toUpperCase();
        }
    });

    const buttonsRow = document.createElement("tr");

    const buttonsTd = document.createElement("td");
    buttonsTd.colSpan = 2;
    buttonsTd.style.padding = "10px";

    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "flex-end"; // align right
    buttonContainer.style.gap = "10px"; // space between buttons

    // Generate Button
    const generateButton = document.createElement("button");
    generateButton.className = "form3-button";
    generateButton.innerText = "Generate Notes";

    generateButton.onclick = () => {

    floating2Div.classList.remove("show");

    setTimeout(() => {
        floating2Div.style.display = "none";
    }, 300);

        const textParts = [];

        const endorsementTypeInput = table.querySelector('select[name="endorsementType"]');
        const endorsementTypeLabel = table.querySelector('label[for="endorsementType"]');

        if (endorsementTypeInput && endorsementTypeLabel) {
            const labelText = endorsementTypeLabel.textContent.trim().toUpperCase();
            const valueText = (endorsementTypeInput.value || "NOT PROVIDED").toUpperCase();
            textParts.push(`${labelText}: ${valueText}`);
        }

        const visibleFields = Array.from(table.querySelectorAll("textarea, input"))
            .filter(input => input.offsetParent !== null);

        visibleFields.forEach(input => {
            const label = table.querySelector(`label[for="${input.name}"]`);
            if (!label) return;

            const labelText = label.textContent.trim().toUpperCase();
            const valueText = (input.value || "").toUpperCase();
            if (!valueText) return;

            textParts.push(`${labelText}: ${valueText}`);
        });

        const finalText = textParts.join("\n");
        showFloating3Div(finalText, floating2Div);
    };

    // Close Button
    const closeButton = document.createElement("button");
    closeButton.className = "form3-button";
    closeButton.innerText = "Close";

    closeButton.onclick = function () {
        floating2Div.classList.remove("show");
        setTimeout(() => {
            floating2Div.style.display = "none";
            overlay.style.display = "none";
            document.body.removeChild(floating2Div);
        }, 300);
    };

    buttonContainer.appendChild(generateButton);
    buttonContainer.appendChild(closeButton);
    buttonsTd.appendChild(buttonContainer);
    buttonsRow.appendChild(buttonsTd);

    table.appendChild(buttonsRow);

    document.body.appendChild(floating2Div);
    floating2Div.style.display = "block";
    setTimeout(() => {
        floating2Div.classList.add("show");
    }, 10);

    const endorsementType = table.querySelector("[name='endorsementType']");

    // ALWAYS visible fields
    const alwaysVisibleFields = [
        "WOCAS2",
        "accOwnerName",
        "accountNum2",
        "landlineNum2",
        "contactName2",
        "cbr2",
        "availability2",
        "agentName2",
        "teamLead2",
        "date",
        "remarks2"
    ];

    // CONDITIONAL fields (mirror previous form visibility)
    const visibilityMap = {
        sfCaseNum2: "sfCaseNum",
        address2: "address",
        landmarks2: "landmarks",
        cepCaseNumber2: "cepCaseNumber",
        queue2: "queue",
        ticketStatus2: "ticketStatus",
        refNumber2: "refNumber",
        paymentChannel2: "paymentChannel",
        amountPaid2: "amountPaid",
    };

    function syncFieldVisibility() {

        // ALWAYS visible fields
        alwaysVisibleFields.forEach(fieldName => {

            const input = table.querySelector(`[name="${fieldName}"]`);
            if (!input) return;

            const row = input.closest("tr");
            if (row) row.style.display = "table-row";

        });

        // CONDITIONAL fields
        Object.entries(visibilityMap).forEach(([targetName, sourceName]) => {

            const sourceElement =
                document.querySelector(`#form1Container [name="${sourceName}"]`) ||
                document.querySelector(`#form2Container [name="${sourceName}"]`);

            const targetElement =
                table.querySelector(`[name="${targetName}"]`);

            if (!targetElement) return;

            const row = targetElement.closest("tr");
            if (!row) return;

            if (sourceElement && sourceElement.offsetParent !== null) {
                row.style.display = "table-row";
            } else {
                row.style.display = "none";
            }

        });

    }

    endorsementType.addEventListener("change", function () {

        if (!this.value) return;

        requestAnimationFrame(syncFieldVisibility);

    });
}

function showFloating3Div(finalText, floating2Div) {

    const overlay = document.getElementById("overlay");
    if (overlay) overlay.style.display = "block";

    const existing = document.getElementById("floating3Div");
    if (existing) existing.remove();

    const floating3Div = document.createElement("div");
    floating3Div.id = "floating3Div";

    const header = document.createElement("div");
    header.id = "floating3DivHeader";
    header.innerText = "ENDORSEMENT SUMMARY: Click the text to copy!";
    floating3Div.appendChild(header);

    const contentWrapper = document.createElement("div");
    contentWrapper.style.padding = "15px 15px 5px 15px";
    contentWrapper.style.display = "flex";
    contentWrapper.style.flexDirection = "column";
    contentWrapper.style.gap = "12px"; // consistent spacing

    const copiedValues = document.createElement("div");

    const section = document.createElement("div");
    section.style.padding = "10px";
    section.style.border = "1px solid #ccc";
    section.style.borderRadius = "4px";
    section.style.cursor = "pointer";
    section.style.whiteSpace = "pre-wrap";
    section.style.transition = "background-color 0.2s ease, transform 0.1s ease";
    section.classList.add("noselect");

    // normalize line endings (important)
    finalText = finalText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    section.textContent = finalText;

    section.addEventListener("mouseover", () => {
        section.style.backgroundColor = "#edf2f7";
    });

    section.addEventListener("mouseout", () => {
        section.style.backgroundColor = "";
    });

    section.onclick = () => {
        section.style.transform = "scale(0.99)";

        navigator.clipboard.writeText(finalText)
            .then(() => {
                section.style.backgroundColor = "#ddebfb";

                setTimeout(() => {
                    section.style.transform = "scale(1)";
                    section.style.backgroundColor = "";
                }, 150);
            });
    };

    copiedValues.appendChild(section);

    // Close button
    const closeButton = document.createElement("button");
    closeButton.className = "form3-button";
    closeButton.innerText = "Close";

    closeButton.style.width = "auto";
    closeButton.style.textTransform = "none";
    closeButton.style.padding = "0 16px";

    closeButton.onclick = () => {
        floating3Div.classList.remove("show");

        setTimeout(() => {
            floating3Div.remove();

            // Restore floating2Div smoothly
            floating2Div.style.display = "block";
            setTimeout(() => {
                floating2Div.classList.add("show");
            }, 10);

        }, 300);
    };

    contentWrapper.appendChild(copiedValues);
    contentWrapper.appendChild(closeButton);
    floating3Div.appendChild(contentWrapper);

    document.body.appendChild(floating3Div);

    // Trigger animation
    setTimeout(() => {
        floating3Div.classList.add("show");
    }, 10);
}

// Reset form and rebuild buttons and show Export and Dellete All buttons
function resetForm2ContainerAndRebuildButtons() {
    const form2Container = document.getElementById("form2Container");
    form2Container.innerHTML = "";

    const buttonTable = document.createElement("table");
    buttonTable.id = "form2ButtonTable";

    const row = document.createElement("tr");

    const buttonData = [
        { label: "💾 Save", handler: saveFormData },
        { label: "🔄 Reset", handler: resetButtonHandler },
        // { label: "📄 Export", handler: exportDataAsTxt },
        // { label: "🗑️ Delete All", handler: deleteAllData }
    ];

    buttonData.forEach(({ label, handler }) => {
        const td = document.createElement("td");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "form1-button";
        btn.tabIndex = -1;
        btn.innerHTML = label;
        btn.addEventListener("click", handler);
        td.appendChild(btn);
        row.appendChild(td);
    });

    buttonTable.appendChild(row);
    form2Container.appendChild(buttonTable);
}

// Reset forms
function resetButtonHandler() {
    showConfirm2("Are you sure you want to reset the form?")
    .then((userChoice) => {
        if (!userChoice) return;

        const agentName = document.getElementsByName("agentName")[0]; 
        const teamLead = document.getElementsByName("teamLead")[0]; 
        const pldtUser = document.getElementsByName("pldtUser")[0]; 
        const selectOrigin = document.getElementsByName("selectOrigin")[0];

        const agentNameValue = agentName.value;
        const teamLeadValue = teamLead.value;
        const pldtUserValue = pldtUser.value;
        const selectOriginValue = selectOrigin.value;

        document.getElementById("frm1").reset();

        agentName.value = agentNameValue;
        teamLead.value = teamLeadValue;
        pldtUser.value = pldtUserValue;
        selectOrigin.value = selectOriginValue;

        resetForm2ContainerAndRebuildButtons();

        // Reset + hide saved notes row
        const savedNotesRow = document.getElementById("saved-notes-row");

        if (savedNotesRow) {
            savedNotesRow.style.display = "none";
        }

        const rowsToHide = [
            "landline-num-row",
            "service-id-row",
            "option82-row",
            "intent-wocas-row",
            "wocas-row"
        ];

        rowsToHide.forEach(id => {
            const row = document.getElementById(id);
            if (row) row.style.display = "none";
        });

        
        // --- RESET LOB ---
        lobSelect.innerHTML = "";
        const blankLobOption = document.createElement("option");
        blankLobOption.value = "";
        blankLobOption.textContent = "";
        blankLobOption.disabled = true;
        blankLobOption.selected = true;
        lobSelect.appendChild(blankLobOption);

        // Only repopulate LOB if channel already has a value
        if (selectOriginValue !== "") {
            allLobOptions.forEach(optData => {
                if (optData.value !== "") {
                    const opt = document.createElement("option");
                    opt.value = optData.value;
                    opt.textContent = optData.text;
                    lobSelect.appendChild(opt);
                }
            });
        }

        // Reset VOC
        vocSelect.innerHTML = "";
        const placeholder = allVocOptions.find(opt => opt.value === "");
        if (placeholder) {
            vocSelect.appendChild(placeholder.cloneNode(true));
        }

        allVocOptions.forEach(option => {
            if (option.value !== "") {
                vocSelect.appendChild(option.cloneNode(true));
            }
        });

        const footerElement = document.getElementById("footerValue");
        const footerText = "Standard Notes Generator Version 5.0.000000";
        typeWriter(footerText, footerElement, 50);

        setTimeout(function() {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });
        }, 100);
    });
}

let lastLoadedNotes = "";

// Save generated notes to localStorage
function saveFormData() {
    const caseOrigin = document.getElementById("caseOrigin")?.value?.trim();
    const sfCaseNumberElement = document.querySelector('[name="sfCaseNum"]');
    const sfCaseNumber = (sfCaseNumberElement?.value || "").trim();

    const customerNameElement = document.querySelector('[name="custName"]');
    const customerName = customerNameElement?.value.trim();

    const accountNumberElement = document.querySelector('[name="accountNum"]');
    const accountNumber = accountNumberElement?.value.trim();

    const calloutAttempt = document.querySelector('[name="calloutAttempt"]')?.value || "";

    const missingFields = [];

    if (!sfCaseNumberElement) {
        showAlert("Case number field is missing on the form.");
        return;
    }

    if (!customerName) missingFields.push("Customer Name");
    if (!accountNumber) missingFields.push("Account Number");

    if (caseOrigin !== "ORDERTAKE") {
        if (!sfCaseNumber) missingFields.push("SF Case Number");
    }

    if (missingFields.length > 0) {
        showAlert(`We couldn’t save your notes. Please fill out the following fields: ${missingFields.join(", ")}`);
        return;
    }

    const vars = initializeVariables();
    const ffupNotes = ffupButtonHandler(false, false, false, false);
    
    const newTicketNotes = [
        cepCaseTitle(),
        cepCaseDescription(false),
        cepCaseNotes(),
        specialInstButtonHandler(false)
    ].filter(Boolean);

    const techNotes = techNotesButtonHandler(false);
    const nontechNotes = nontechNotesButtonHandler(false);

    const fuseNotes = Array.isArray(techNotes)
        ? `SF/FUSE NOTES:\n${techNotes.join("\n")}`
        : techNotes
            ? `SF/FUSE NOTES:\n${techNotes}`
            : "";

    const cepNotes = newTicketNotes.length
        ? `CEP NOTES:\n${newTicketNotes.join("\n")}`
        : "";

    const bantayKableNotes = bantayKableButtonHandler(false);
    const nonTechIntents = [    
        // Request
        "formReqBillAdjust", "formReqRelocation", "formReqSupRetAccNum", "formReqSupChangeAccNum", "formReqChangeTelNum", "formReqDowngrade", "formReqUpgrade", "formReqTempDisco", "formReqInmove", "formCompMisappPay", "formCompMistreat", "formReqPermaDisco", "formReqReconnect", "formReqSpecFeat",

        // Inquiry
        "formInqBill", "formInqChangeTelNum", "formInqDowngrade", "formInqUpgrade", "formInqSpecialFeatures",

        // Follow-up
        "formFfupReloc", "formFfupBillAdjust", "formFfupCignalIPTV", "formFfupChangeOwnership", "formFfupDowngrade", "formFfupUpgrade", "formFfupInmove", "formFfupChangeTelNum", "formFfupMisappPay", "formFfupPermaDisco", "formFfupReconnect", "formFfupSpecialFeat", "formFfupTempDisco"
    ];

    let combinedNotes = "";

    if (nonTechIntents.includes(vars.selectedIntent)) {
        combinedNotes = nontechNotes || bantayKableNotes || "";
    } else if (vars.selectedIntent === "formFfupRepair") {
        const labeledFfup = ffupNotes ? `CEP NOTES:\n${ffupNotes}` : "";
        const labeledTech = techNotes ? `SF/FUSE NOTES:\n${techNotes}` : "";
        combinedNotes = [labeledFfup, labeledTech].filter(Boolean).join("\n\n");
    } else {
        combinedNotes = [fuseNotes, cepNotes].filter(Boolean).join("\n\n");
    }

    combinedNotes = (combinedNotes || "").toString().trim();

    const now = new Date();
    const timestamp = now.toLocaleString();
    const fallbackKey = `NOCASE-${now.getTime()}`;

    const uniqueKey = (caseOrigin === 'ORDERTAKE' || !sfCaseNumber)
        ? fallbackKey
        : sfCaseNumber;
    const intentSelect = document.querySelector('[name="selectIntentForms"]');

    const intentText = intentSelect
        ? intentSelect.options[intentSelect.selectedIndex]?.text || ""
        : "";

    function getValue(name) {
        return (document.querySelector(`[name="${name}"]`)?.value || "")
            .trim()
            .toUpperCase();
    }

    const savedEntry = {
        timestamp: timestamp,
        selectOrigin: getValue("selectOrigin"),
        agentName: getValue("agentName"),
        teamLead: getValue("teamLead"),
        sfCaseNumber: sfCaseNumber,
        custName: getValue("custName"),
        selectLOB: getValue("selectLOB"),
        selectVOC: getValue("selectVOC"),
        selectIntent: intentText.trim().toUpperCase(),
        accountNum: getValue("accountNum"),
        landlineNum: getValue("landlineNum"),
        serviceID: getValue("serviceID"),
        Option82: getValue("Option82"),
        WOCAS: getValue("WOCAS"),
        combinedNotes: combinedNotes
    };

    if (!combinedNotes) {
        showAlert("Cannot save empty notes.");
        return;
    }

    const savedData = JSON.parse(localStorage.getItem("tempDatabase") || "{}");

    // Check if entry already exists
    if (savedData[uniqueKey]) {
        const existing = savedData[uniqueKey];

        const normalize = str => (str || "").replace(/\s+/g, " ").trim();

        const normalizedCurrentNotes = normalize(savedEntry.combinedNotes);

        // Block empty notes
        if (!normalizedCurrentNotes) {
            showAlert("Cannot save empty notes.");
            return;
        }

        // Block accidental save after load (no changes)
        if (lastLoadedNotes && currentNotes === normalize(lastLoadedNotes)) {
            showAlert("No changes detected. Notes have not been updated.");
            return;
        }

        const existingNotes = normalize(existing.combinedNotes);
        const newNotes = normalize(savedEntry.combinedNotes);

        let finalNotes = existing.combinedNotes;
        let alertMessage = "";

        // CASE 1: 2nd callout attempt → append
        if (calloutAttempt === "2nd") {

            // Prevent duplicate append
            if (existingNotes === newNotes) {
                showAlert("No changes detected. Notes have not been updated.");
                return;
            }

            finalNotes = [
                existing.combinedNotes || "",
                savedEntry.combinedNotes || ""
            ].filter(Boolean).join("\n\n");

            alertMessage = "New notes added.";

        } else {
            // CASE 2: normal update

            const hasChanges = existingNotes !== newNotes;

            if (!hasChanges) {
                showAlert("No changes detected. Notes have not been updated.");
                return;
            }

            finalNotes = savedEntry.combinedNotes;

            alertMessage = "Changes saved successfully!";
        }

        // SAVE FIRST
        savedData[uniqueKey] = {
            ...existing,
            ...savedEntry,
            combinedNotes: finalNotes,
            lastUpdated: new Date().toLocaleString()
        };

        showAlert(alertMessage);

    } else {
        savedData[uniqueKey] = {
            ...savedEntry,
            createdAt: savedEntry.timestamp
        };

        showAlert("All set! Your notes have been saved.");
    }

    // Save back to localStorage
    localStorage.setItem("tempDatabase", JSON.stringify(savedData));

}

// Load saved notes from localStorage
function loadFormData() {
    const rawInput = document.querySelector('[name="sfCaseNum"]')?.value || "";
    const sfCaseNumber = rawInput.trim();

    const savedData = JSON.parse(localStorage.getItem("tempDatabase")) || {};

    console.log("Looking for:", sfCaseNumber);
    console.log("Keys:", Object.keys(savedData));

    let savedEntry = savedData[sfCaseNumber];

    if (!savedEntry && sfCaseNumber) {
        savedEntry = Object.values(savedData).find(entry =>
            (entry.sfCaseNumber || "") === sfCaseNumber
        );
    }

    if (!savedEntry) {
        console.log("No match found.");
        return;
    }

    console.log("Match found:", savedEntry);

    const setValue = (name, value) => {
        const el = document.querySelector(`[name="${name}"]`);
        if (el && value !== undefined && value !== null) {
            el.value = value;

            if (el.tagName === 'TEXTAREA') {
                setTimeout(() => {
                    autoExpandTextarea({ target: el });
                }, 0);
            }
        }
    };

    setValue("sfCaseNum", savedEntry.sfCaseNumber);
    setValue("custName", savedEntry.custName);
    setValue("accountNum", savedEntry.accountNum);
    setValue("landlineNum", savedEntry.landlineNum);

    const buildSavedNotes = (entry) => {
        const parts = [];

        if (entry.timestamp) parts.push(`SAVED ON: ${entry.timestamp}`);
        if (entry.lastUpdated) parts.push(`LAST MODIFIED: ${entry.lastUpdated}`);
        if (entry.selectLOB) parts.push(`LOB: ${entry.selectLOB}`);
        if (entry.selectVOC) parts.push(`VOC: ${entry.selectVOC}`);
        if (entry.selectIntent) parts.push(`INTENT: ${entry.selectIntent}`);
        if (entry.serviceID) parts.push(`SERVICE ID: ${entry.serviceID}`);
        if (entry.Option82) parts.push(`OPTION82: ${entry.Option82}`);
        if (entry.WOCAS) parts.push(`WOCAS: ${entry.WOCAS}`);

        if (entry.combinedNotes) {
            parts.push(`\n${entry.combinedNotes}`);
        }

        return parts.join("\n");
    };

    setValue("savedNotes", buildSavedNotes(savedEntry));

    lastLoadedNotes = (savedEntry.combinedNotes || "").trim();

    const notesRow = document.getElementById("saved-notes-row");

    if (savedEntry && savedEntry.combinedNotes?.trim()) {
        if (notesRow) notesRow.style.display = "table-row";
    }
}

// Export saved notes as a text file, sorted by timestamp
function exportDataAsTxt() {
    const savedData = JSON.parse(localStorage.getItem("tempDatabase") || "{}");
    
    if (Object.keys(savedData).length === 0) {
        showAlert("No data available to export.");
        return;
    }

    const sortedEntries = Object.entries(savedData).sort((a, b) => {
        const timeA = new Date(a[1].timestamp).getTime();
        const timeB = new Date(b[1].timestamp).getTime();
        return timeA - timeB;
    });

    let notepadContent = "";

    for (const [key, entry] of sortedEntries) {
        notepadContent += `SAVED ON: ${entry.timestamp}\n`;
        if (entry.lastUpdated) {
            notepadContent += `LAST MODIFIED: ${entry.lastUpdated}\n`;
        }

        const appendIfValid = (label, value) => {
            if (value !== undefined && value !== "undefined") {
                notepadContent += `${label}: ${value}\n`;
            }
        };

        appendIfValid("CASE ORIGIN", entry.selectOrigin);
        appendIfValid("SF CASE #", entry.sfCaseNumber);
        appendIfValid("CUSTOMER NAME", entry.custName);
        appendIfValid("LOB", entry.selectLOB);
        appendIfValid("VOC", entry.selectVOC);
        appendIfValid("INTENT", entry.selectIntent);
        appendIfValid("ACCOUNT #", entry.accountNum);
        appendIfValid("LANDLINE #", entry.landlineNum);

        const lob = entry.selectLOB ? entry.selectLOB : "";
        const voc = entry.selectVOC ? entry.selectVOC : "";

        if (lob === "NON-TECH") {

        } else {
            if (voc === "COMPLAINT") {
                appendIfValid("SERVICE ID", entry.serviceID);
                appendIfValid("OPTION82", entry.Option82);
            } else if (voc === "REQUEST") {
                appendIfValid("SERVICE ID", entry.serviceID);
                appendIfValid("OPTION82", entry.Option82);
            } else if (voc === "FOLLOW-UP") {
                // Nothing to Append
            } else {
                appendIfValid("SERVICE ID", entry.serviceID);
                appendIfValid("OPTION82", entry.Option82);
            }
        }

        notepadContent += `\nCASE NOTES:\n${entry.combinedNotes}\n`;
        notepadContent += "=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=\n\n";
    }

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];

    const blob = new Blob([notepadContent], { type: "text/plain" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    
    link.download = `Saved Notes_${formattedDate}.txt`;

    link.click();
    
    showAlert("Notes exported successfully!");
}

// Export saved notes as an excel file, sorted by timestamp
function exportDataAsExcel() {
    const savedData = JSON.parse(localStorage.getItem("tempDatabase") || "{}");
    
    if (Object.keys(savedData).length === 0) {
        showAlert("No data available to export.");
        return;
    }

    const sortedEntries = Object.entries(savedData).sort((a, b) => {
        const timeA = new Date(a[1].timestamp).getTime();
        const timeB = new Date(b[1].timestamp).getTime();
        return timeA - timeB;
    });

    const excelData = [];

    for (const [key, entry] of sortedEntries) {

        const lob = entry.selectLOB || "";
        const voc = entry.selectVOC || "";

        let serviceID = "";
        let option82 = "";

        if (lob !== "NON-TECH" && voc !== "FOLLOW-UP") {
            serviceID = entry.serviceID || "";
            option82 = entry.Option82 || "";
        }

        excelData.push({
            "Saved On": entry.timestamp || "",
            "Last Modified": entry.lastUpdated || "",
            "Case Origin": entry.selectOrigin || "",
            "Agent Name": entry.agentName || "", 
            "Team Leader": entry.teamLead || "", 
            "SF Case #": entry.sfCaseNumber || "",  
            "Customer Name": entry.custName || "",
            "LOB": entry.selectLOB || "",
            "VOC": entry.selectVOC || "",
            "Intent": entry.selectIntent || "",
            "Account #": entry.accountNum || "",
            "Landline #": entry.landlineNum || "",
            "Service ID": serviceID,
            "Option82": option82,
            "Case Notes": entry.combinedNotes || ""
        });
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    /* =======================
       COLUMN WIDTHS
    ======================= */
    const headers = Object.keys(excelData[0] || {});

    const colWidths = headers.map(key => ({
        wch: Math.max(
            key.length,
            ...excelData.map(row => String(row[key] || "").length)
        )
    }));

    // Dynamically target "Case Notes" width
    const caseNotesIndex = headers.indexOf("Case Notes");

    if (caseNotesIndex !== -1) {
        colWidths[caseNotesIndex].wch = 40;
    }

    worksheet["!cols"] = colWidths;

    /* =======================
       EXPORT
    ======================= */
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Saved Notes");

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];

    XLSX.writeFile(workbook, `Saved Notes_${formattedDate}.xlsx`);

    showAlert("Notes exported successfully as Excel file!");
}

// Delete all saved data in localStorage
function deleteAllData() {
    showConfirm2("Are you sure you want to delete all saved records in this workstation?")
    .then((userChoice) => {
        if (!userChoice) return;

        localStorage.clear();
        showAlert("All data has been deleted successfully.");
    });
}

// Show appropriate buttons based on form state
const primaryButtons = {
  saveButton: saveFormData,
  resetButton: resetButtonHandler
//   exportButton: exportDataAsTxt,
//   deleteButton: deleteAllData
};

Object.entries(primaryButtons).forEach(([id, handler]) => {
  document.getElementById(id)?.addEventListener("click", handler);
});

// Form Container Scrollbar Behavior
const container = document.querySelector('.divsContainer');
const scrollbar = document.querySelector('.customScrollbar');

let hideTimeout;
let isDragging = false;
let dragOffset = 0;

// Update scrollbar size & position
function updateScrollbar() {
    const containerHeight = container.clientHeight;
    const contentHeight = container.scrollHeight;

    if (contentHeight <= containerHeight) {
        scrollbar.style.display = 'none';
        return;
    } else {
        scrollbar.style.display = 'block';
    }

    const ratio = containerHeight / contentHeight;
    const thumbHeight = Math.max(ratio * containerHeight, 20);
    scrollbar.style.height = thumbHeight + 'px';

    const maxThumbTop = containerHeight - thumbHeight;
    const scrollPercent = container.scrollTop / (contentHeight - containerHeight);
    scrollbar.style.top = scrollPercent * maxThumbTop + 'px';
}

// Show scrollbar temporarily (scroll, hover, drag)
function showScrollbar() {
    scrollbar.classList.add('active');

    if (hideTimeout) clearTimeout(hideTimeout);

    hideTimeout = setTimeout(() => {
        if (!isDragging) {
            scrollbar.classList.remove('active');
        }
    }, 800);
}

// Dragging
scrollbar.addEventListener('mousedown', e => {
    isDragging = true;
    scrollbar.classList.add('active');
    dragOffset = e.clientY - scrollbar.getBoundingClientRect().top;
    document.body.style.userSelect = 'none';
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        scrollbar.classList.remove('active');
    }
    document.body.style.userSelect = 'auto';
});

document.addEventListener('mousemove', e => {
    if (!isDragging) return;

    const containerHeight = container.clientHeight;
    const contentHeight = container.scrollHeight;
    const thumbHeight = scrollbar.clientHeight;
    const maxThumbTop = containerHeight - thumbHeight;

    // Thumb position follows cursor with dragOffset
    let newThumbTop = e.clientY - container.getBoundingClientRect().top - dragOffset;
    newThumbTop = Math.max(0, Math.min(maxThumbTop, newThumbTop));

    container.scrollTop = (newThumbTop / maxThumbTop) * (contentHeight - containerHeight);
    scrollbar.style.top = newThumbTop + 'px';
});

// Scroll event
container.addEventListener('scroll', () => { updateScrollbar(); showScrollbar(); });
window.addEventListener('resize', () => { updateScrollbar(); showScrollbar(); });

// Observe dynamic content in all children
const mutationObserver = new MutationObserver(() => { updateScrollbar(); showScrollbar(); });
mutationObserver.observe(container, { childList: true, subtree: true, characterData: true });

// Observe height changes of any child dynamically
const resizeObserver = new ResizeObserver(() => { updateScrollbar(); showScrollbar(); });
Array.from(container.children).forEach(child => resizeObserver.observe(child));

updateScrollbar();

// Updates Container
function renderUpdates(containerId, instructions, versions) {
    const container = document.getElementById(containerId);
    if (!container) return console.error(`Container with ID '${containerId}' not found.`);

    // --- Instructions Section ---
    const instructionsDiv = document.createElement("div");
    instructionsDiv.classList.add("updateItem");
    instructionsDiv.innerHTML = `
        <h3>Instructions</h3>
        <ul>${instructions.map(item => `<li>${item}</li>`).join("")}</ul>
    `;
    container.appendChild(instructionsDiv);

    // --- Updates Sections ---
    versions.forEach(({ version, updates }) => {

        const updatesDiv = document.createElement("div");
        updatesDiv.classList.add("updateItem");

        // clickable title
        const title = document.createElement("h3");
        title.classList.add("updateTitle");
        title.textContent = `${version} Update`;

        // collapsible container
        const content = document.createElement("div");
        content.classList.add("updateContent");

        updates.forEach((section, index) => {

            const sectionDiv = document.createElement("div");

            sectionDiv.innerHTML = `
                <strong>${section.title}</strong>
                <ul>${section.items.map(i => `<li>${i}</li>`).join("")}</ul>
            `;

            content.appendChild(sectionDiv);
        });

        // click toggle
        title.addEventListener("click", () => {
            updatesDiv.classList.toggle("active");
        });

        updatesDiv.appendChild(title);
        updatesDiv.appendChild(content);
        container.appendChild(updatesDiv);
    });
}

const instructions = [
    "Open the tool using the provided link or through smart assistant (Saya). Avoid using the browser's ‘Duplicate Tab’ to ensure the DOM scripts load properly.",
    "To ensure data accuracy, delete any previously saved records on this workstation before saving new ones.",
    "Always utilize the LIT365 work instructions to ensure accurate, consistent, and up-to-date handling of every intent. These guidelines outline the correct process flow and required checks, so make sure to utilize them before completing any action.",
    "Fill out all required fields.",
    "If a field is not required (e.g. L2 fields), leave it blank. Avoid entering 'NA' or any unnecessary details.",
    "Ensure that the information is accurate.",
    "Review your inputs before generating the notes."
];

const versions = [
    // {
    //     version: "V5.3.270326",
    //     updates: [
    //         { title: "Improvements", items: [
    //             "Added startup detection of existing saved notes with options to keep or delete them before saving new ones.",
    //             "Added an option to export saved notes to Excel in the Smart Assistant (Saya).",
    //             "Enhanced note parsing to replace “|” with “/” for consistent formatting."
    //         ]},
    //     ]
    // },
    // {
    //     version: "V5.3.230326",
    //     updates: [
    //         { title: "🎉 Introducing Saya", items: [
    //             "Meet <strong>Saya</strong>, your smart assistant that provides helpful tips, suggests actions, and makes your workflow faster and easier.",
    //         ]},
    //         { title: "🎨 UI Improvements", items: [
    //             "Improved the layout of alerts and confirmation messages for better clarity",
    //             "Fixed buttons alignment for a cleaner and more consistent look",
    //             "Enhanced how pop-ups appear and close for a smoother experience",
    //             "Reduced screen clutter to help you stay focused",
    //             "Added NIC Investigation 4 options under NIC-NDT",
    //             "Enhanced the Option82 field to allow agents to copy either the node or the complete Option82 value."
    //         ]},
    //         { title: "🛠️ Fixes", items: [
    //             "Fixed errors caused by missing functions to improve stability",
    //             "Corrected NDT intent logic for Copper VDSL accounts under network outage conditions.",
    //         ]},
    //         { title: "🚀 Overall Impact", items: [
    //             "Smoother and more seamless interactions",
    //             "Cleaner and more organized interface",
    //             "Faster and more responsive assistant behavior",
    //             "Easier to understand and use"
    //         ]},
    //     ]
    // },
    // {
    //     version: "V5.3.130326",
    //     updates: [
    //         { title: "✨ Enhancements", items: [
    //             "Main form behavior updated to display the correct fields based on the selected agent channel.",
    //             "Improved <strong>Updates</strong> section for better visuals.",
    //             "Expanded <strong>Notepad</strong> section to provide more space for notes and improve usability.",
    //             "Improved Upsell Notes integration to capture reasons for declined and ineligible offers for <strong>NIC-NDT</strong>, <strong>NIC</strong>, <strong>SIC</strong> and all <strong>Non-Tech</strong> intents."
    //         ]},
    //         { title: "➕ Added", items: [
    //             "Ordertake option for NSR and Relocation added for tracking purposes.",
    //             "Upsell <strong>Pending Req. (For callback)</strong> option added.",
    //             "Non-Tech request intents(<strong>Inmove</strong>, <strong>DDE</strong>, <strong>Migration</strong>, <strong>Misapplied Payment</strong>, <strong>Occular Inspection/Amend SAM</strong>, <strong>Proof of PLDT Subscription</strong>, and <strong>Unreflected Payment</strong>).",
    //             "<strong>NIC Intent</strong>: Reintroduced Equipment and Modem Brand fields to enable easier identification of the ONU connection type (InterOp vs. Non-InterOp).",
    //             "Added NIC Investigation 4 options for NIC-NDT intent."
    //         ]},
    //         { title: "🛠️ Fixes", items: [
    //             "Resolved a bug causing decline and ineligibility reasons to not display in the generated notes for all non-technical intents.",
    //         ]},
    //     ]
    // },
    // {
    //     version: "V5.2.040326",
    //     updates: [
    //     { title: "➕ Added", items: [
    //         "Non-Tech Request intents: <strong>Address Modification (Record), Disconnection, Dispute, Refund, Relocation, Special Features, Speed Add On 500, Unli Fam Call, Upgrade, VAS, Withholding Tax Adjustment,</strong> and <strong>Wire Re-Route</strong>.",
    //         "<strong>Service ID</strong> is now included in the generated notes for Non-Tech intents.",
    //         "Enabled <strong>ESA tagging</strong> for all Non-Tech intents (Hotline agents).",
    //     ]},
    //     ]
    // },
    // {
    //     version: "V5.2.160226",
    //     updates: [
    //     { title: "🛠️ Fixed", items: [
    //         "Formatting issue causing generated endorsement notes to be incorrectly split into multiple sections." ]},
    //     { title: "✨ Improvements", items: [
    //         "Enhanced the Endorsement Form to dynamically display only relevant fields based on the selected endorsement type, improving clarity and reducing unnecessary inputs." ]}
    //     ]
    // },
    // {
    //     version: "V5.2.140226",
    //     updates: [
    //     { title: "✨ Improvements", items: [
    //         "Enhanced Endorsement Form UI", 
    //         "Improved generating endorsement notes" ]},
    //     { title: "➕ Added", items: [
    //         "Non-Tech Request intents: <strong>Downgrade</strong> and <strong>Reconnection</strong>.", 
    //         "<strong>Repeater count</strong> field under FFUP intent.", 
    //         "<strong>“Not Applicable”</strong> option for ALS offering. This applies to tickets beyond the 24-hour SLA but still within the 36-hour ALS eligibility threshold." ]},
    //     { title: "🐞 Bug Fixes", items: [
    //         "Resolved layout overflow issue" ]},
    //     { title: "➖ Removed", items: [
    //         "ALS Offering notation from the CEP tool. ALS details will be available exclusively in FUSE or Salesforce (SF) notation.",
    //         "Ticket creation timer" ]}
    //     ]
    // },
    // {
    //     version: "V5.2.101225",
    //     updates: [
    //     { title: "➕ Added", items: ["Instructions to always utilize LIT365 work instructions for proper guidance", "Investigation 4 options for SIC (High Utilization OLT/PON Port)", "DC and RA Exec status fields in the NMS skin"] },
    //     { title: "✨ Improvements", items: ["UI enhancements for better usability", "Save and Export function enhancements to ensure accurate notation is saved and exported", "Special Instructions functionality", "Case Notes timeline formatting", "Enabled FCR notation for CEP tool"] },
    //     { title: "🐞 Bug Fixes", items: ["Fixed minor bugs in generated notes", "Resolved SF Tagging issue for SOCMED agents"] }
    //     ]
    // },
    // {
    //     version: "V5.2.131125",
    //     updates: [
    //     { title: "➕ Added Non-Tech Follow-up Intents", items: ["Refund", "Relocation", "Relocation - CID Creation", "Special Features", "Speed Add On 500", "Temporary Disconnection (VTD/HTD)", "Unreflected Payment", "Upgrade", "VAS", "Wire Re-Route", "Withholding Tax Adjustment"] }
    //     ]
    // },
    // {
    //     version: "V5.2.301025",
    //     updates: [
    //     { title: "✨ Generated FUSE Notes (Hotline)", items: ["Generated notes are automatically divided into sections, eliminating the need for manual formatting or separation"] },
    //     { title: "🛠️ Fixes", items: ["Resolved issue on Concern Type options not displaying correctly", "Fixed scrolling behavior for smoother navigation through form sections"] },
    //     { title: "✨ Improvements", items: ["Refined interface for smoother visuals and seamless workflow", "Enhanced user experience for more user-friendly navigation"] },
    //     ]
    // },
    // {
    //     version: "V5.2.291025",
    //     updates: [
    //     { title: "➖ Removed fields", items: ["Equipment Brand, Modem Brand, and ONU Connection Type (NIC)"] },
    //     { title: "➕ Added Intents", items: ["Request for Private IP", "Gaming - High Latency/Lag"] },
    //     { title: "➕ Added fields", items: ["Clearview Latest real-time request completion date", "Tested OK for Hotline Agents (NIC/SIC/Selective Browsing intents)"] },
    //     { title: "➕ Added CEP Investigation 4 tagging", items: ["Device and Website IP Configuration (Request for Public/Private IP)", "No Audio/Video Output w/ Test Channel (IPTV Intents)"] },
    //     { title: "✨ Updated field labels", items: ["'DMS Status' to 'Internet/Data Status'", "'RX Power/OPTICSRXPOWER' to 'RX Power'", "'No. of Connected Devices (L2)' to 'No. of Conn. Devices (L2)'"] },
    //     { title: "🛠️ Fix", items: ["Resolved Offer ALS notation bug"] },
    //     { title: "🎨 UI Enhancements", items: ["Slight tweaks for a fresher, more modern feel.", "New Instructions and Updates section: Your quick guide to staying informed!"] }
    //     ]
    // }
];

renderUpdates("updatesContainer", instructions, versions);

// FAB MENU ELEMENT REFERENCES
const panel = document.getElementById("floatingPanel");
const fabButton = document.getElementById("fabButton");
const fabMenu = document.getElementById("fabMenu");
const fabMessage = document.getElementById("fabMessage");

const intro = "Hi! I’m Saya. Click me to explore more features.";

// Guard (prevents runtime errors)
if (!panel || !fabButton || !fabMenu || !fabMessage) {
    console.warn("FAB Assistant: Missing required elements.");
}

// CONFIGURATION
const FabConfig = {
    typingSpeed: 35,
    hideDelay: 7500,
    randomInterval: 600000,
    actionDelay: 120
};

// PANEL TOGGLE
fabButton?.addEventListener("click", () => {
    panel.classList.toggle("open");
});

// TYPEWRITER
let typingTimer = null;
let isTyping = false;
let stopTyping = false;
let isMessageActive = false;
let messageQueue = [];
let isProcessingQueue = false;
let hideTimer = null;

function typeWriter(text, element, speed, hideDelay = FabConfig.hideDelay, callback) {
    if (!element) return;

    clearTimeout(typingTimer);
    clearTimeout(hideTimer);

    element.classList.remove("hide");

    isTyping = true;
    element.innerHTML = "";

    let i = 0;

    function type() {
        if (stopTyping) {
            element.innerHTML = "";
            isTyping = false;
            if (callback) callback();
            return;
        }

        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            typingTimer = setTimeout(type, speed);
        } else {
            isTyping = false;

            hideTimer = setTimeout(() => {
                element.classList.add("hide");

                if (callback) callback(); // 👈 trigger next step AFTER full lifecycle
            }, hideDelay);
        }
    }

    type();
}

function processQueue() {
    if (isProcessingQueue) return;
    if (messageQueue.length === 0) return;

    isProcessingQueue = true;

    const { text, delay, continueLoop } = messageQueue.shift();

    typeWriter(text, fabMessage, FabConfig.typingSpeed, delay, () => {
        isProcessingQueue = false;

        if (continueLoop) {
            setTimeout(() => {
                enqueueRandomMessage();
            }, FabConfig.randomInterval);
        } else {
            processQueue(); // continue queue only
        }
    });
}

function enqueueMessage(text, delay = FabConfig.hideDelay, continueLoop = true) {
    if (!text) return;

    messageQueue.push({ text, delay, continueLoop });
    processQueue();
}

// HOVER BEHAVIOR
fabButton?.addEventListener("mouseenter", () => {
    stopTyping = true;
    clearTimeout(typingTimer);
    fabMessage?.classList.add("hide");
});

fabButton?.addEventListener("mouseleave", () => {
    stopTyping = false;
});

// MENU VISIBILITY (CLASS-BASED)
panel?.addEventListener("mouseenter", () => {
    fabMenu.classList.add("show");
});

panel?.addEventListener("mouseleave", () => {
    fabMenu.classList.remove("show");
});

function runFabAction(action) {
    fabMenu.classList.remove("show");
    setTimeout(action, FabConfig.actionDelay);
}

// BUTTON ACTIONS
function openDuplicateTab() {
    window.open(
        "https://not-a-bot-support.github.io/autodocs/",
        "_blank"
    );
}

// RANDOM MESSAGES
const assistantMessages = {
    tips: [
        // Tips
        "💡You can duplicate this tab anytime. Just click me and select 'Duplicate Tab'!",
        "💡You can use the Notepad section to store temporary notes or frequently used spiels for quick access.",
        "💡To ensure data accuracy, I highly recommend deleting any previously saved records on this workstation before saving new ones.",
        "💡When filling out the form, make sure all required fields are completed.",
        "💡If a field isn’t required (like L2 fields), you can leave it blank, no need to enter “NA” or extra unnecessary details.",

        // DYKs
        "🧠 Did you know? I can help you export your saved notes as a text file. Just click me and select 'Export Saved Notes'!",
        "🧠 Did you know? You can clear saved records in this workstation from my menu.",

        // Reminders
        "ℹ️ LIT365 work instructions outline the correct process flow and required checks, so make sure to utilize them before completing any action.",
        "ℹ️ Always remember! Review your inputs carefully and ensure all information is accurate before generating the notes.",
        "👋 Hey there! Just a quick reminder, I’m here to help with your standard notation, but I’m not a work instruction.",
        "ℹ️ For accurate and up-to-date handling, always utilize the LIT365 Work Instructions.",
        "ℹ️ Always ensure that all actions performed in each tool are properly documented.",
        "ℹ️ Avoid using generic notations such as “ACK CX”,“PROVIDE EMPATHY”, “CONDUCT VA”, or “CONDUCT BTS”.",
        "ℹ️ You may also include any SNOW or E-Solve tickets raised for tool-related issues or latency under the “Other Actions Taken” field.",
    ],

    quotes: [
        "❤️ Every call or case is an opportunity to turn frustration into trust.",
        "❤️ Great agents don’t just answer calls or cases, they solve problems and create better experiences.",
        "❤️ Difficult calls or cases don’t define you; how you handle them does.",
        "❤️ One calm response can change an entire customer experience.",
        "❤️ Consistency, patience, and empathy are the true KPIs of a great agent.",
        "❤️ Every resolved issue is proof that your effort matters.",
        "❤️ Service excellence starts with listening.",
        "❤️ The best agents turn complaints into compliments.",
        "❤️ Stay calm, stay professional, and let your solutions speak for you.",
        "❤️ Behind every ‘thank you for your help’ is a job well done.",
        "❤️ Every conversation is a chance to make someone’s day better.",
        "❤️ A calm response can turn a frustrated customer into a loyal one.",
        "❤️ Great customer service isn’t about having all the answers, it's about caring enough to find them.",
        "❤️ One solved issue today can build a customer’s trust for years.",
        "❤️ Behind every successful team are team members who care about the customer experience.",
        "❤️ Not every call will be easy, but every call is an opportunity to grow.",
        "❤️ Stay calm, stay kind, and let your professionalism lead the way.",
        "❤️ Difficult customers test your patience, but they also sharpen your skills.",
        "❤️ The strongest agents stay composed even when the queue is full.",
        "❤️ Empathy turns service into a positive experience.",
        "❤️ Empathy turns tension into cooperation.",
        "❤️ Your patience today can turn a complaint into appreciation.",
        "❤️ Professionalism shines brightest in challenging conversations.",
        "❤️ Take a deep breath, stay composed, and guide the customer to a solution.",
        "❤️ Respectful communication can soften even the toughest interactions.",
        "❤️ Let empathy guide the conversation, not frustration.",
        "❤️ Difficult moments reveal the strength of a great support agent.",
        "❤️ Handling difficult customers well is a skill that builds true service excellence.",
        "❤️ Empathy can diffuse tension faster than explanations.",
        "❤️ When you understand the customer, the solution becomes obvious.",
        "❤️ Empathy turns difficult calls into manageable conversations.",
        "❤️ Empathy is your most powerful de-escalation tool.",
        "❤️ Understanding saves time, assumptions waste it.",
        "❤️ When you lead with empathy, control follows naturally.",
        "❤️ Empathy isn’t soft, it’s strategic.",
        "❤️ A calm customer starts with a calm, understanding agent.",
        "❤️ The better you connect, the faster you resolve.",
        "❤️ Empathy lowers stress, for both the customer and you.",
        "❤️ Customers cooperate more when they feel heard.",
        "❤️ Empathy builds trust, and trust speeds up every interaction.",
        "❤️ When customers feel understood, they stop resisting solutions.",
        "❤️ Empathy helps you handle calls, not absorb them.",
        "❤️ Empathy improves customer experience without increasing your average handling time.",
        "❤️ The right words early save minutes later.",
        "❤️ One empathetic sentence can prevent a long escalation.",
        "❤️ Customers remember how you made them feel, score that.",
        "❤️ Empathy is the bridge between script and success.",
        "❤️ A smooth call starts with emotional alignment.",
        "❤️ Empathy helps you respond, not react.",
        "❤️ Empathy gives you control in chaotic conversations.",
        "❤️ Empathy is a skill that grows your career, not just your metrics.",
        "❤️ Great agents don’t just solve problems, they understand people.",
        "❤️ Your ability to connect is your competitive advantage.",
        "❤️ Empathy today builds leadership tomorrow.",
        "❤️ The best communicators are the best listeners.",
        "❤️ Empathy sharpens emotional intelligence, your lifelong asset.",
        "❤️ Every call is practice in mastering human interaction.",
        "❤️ Every case is practice in mastering human interaction.",
        "❤️ Empathy doesn’t mean absorbing emotions, it means understanding them.",
        "❤️ You can care without carrying the weight.",
        "❤️ Professional empathy protects your energy.",
        "❤️ Listen deeply, but detach wisely.",
        "❤️ Your role is to guide, not to take things personally.",
        "❤️ You are there to help, not to be affected.",
        "❤️ Strong agents feel, but don’t fall.",
        "❤️ One good conversation can turn someone’s entire day around.",
        "❤️ Small moments of understanding create big impact.",
        "❤️ You don’t just answer calls, you improve experiences.",
        "❤️ Your voice can turn frustration into relief.",
        "❤️ Every interaction is an opportunity to stand out.",
        "❤️ You are the human side of the business.",
        "❤️ Quality is doing it right every time.",
        "🌡️ Behind every angry customer is an unmet expectation.",
        "🌡️ Frustrated customer? Don’t take it personally, take it professionally.",
        "🌡️ Frustration is a signal, not an attack.",
        "🌡️ The louder the customer, the more they need to feel heard.",
        "🌡️ You don’t fix emotions, but you can acknowledge them.",
        "👂 Acknowledging the issue early saves you from explaining twice later.",
        "👂 When customers feel heard, they stop repeating, and you gain control of the call.",
        "👂 A strong acknowledgement sets the tone, you lead the conversation from the start.",
        "👂 Recognition builds cooperation faster than solutions alone.",
        "👂 The first 10 seconds of empathy can save 10 minutes of handling time.",
        "👂 Acknowledging emotions is not extra, it’s strategic efficiency.",
        "👂 When you name the problem clearly, you reduce confusion instantly.",
        "👂 Customers don’t need perfection, they need to feel understood.",
        "👂 A good acknowledgement turns frustration into focus.",
        "👂 Listen to understand, not to respond!",
        "🤝 When you sound in control, the customer feels secure.",
        "🤝 Reassurance turns uncertainty into cooperation.",
        "🤝 Confidence in your words creates confidence in your solution.",
        "🤝 Customers don’t just need answers, they need certainty.",
        "🤝 Your assurance stabilizes the entire interaction.",
        "🤝 When customers trust you, resolution becomes easier.",
        "🤝 Guide the call, don’t let uncertainty take over.",
        "🤝 Reassurance prevents escalation.",
        "🤝 Confidence is part of the solution.",
    ],

    advice: [
        "🌟 Focus on solutions, not just the problem.",
        "🌟 Listen carefully; sometimes customers only need to feel heard.",
        "🌟 When customers raise their voice, raise your patience.",
        "🌟 Respond with solutions, not emotions.",
        "🌟 A calm agent can de-escalate even the most stressful situations.",
        "🌟 Focus on the issue, not the attitude.",
        "🌟 Keep your tone kind, even when the situation isn’t.",
        "🌟 Acknowledge the customer’s concern before offering the solution.",
        "🌟 Focus on helping, not on winning the argument.",
        "🌟 Sometimes the best solution begins with simply listening.",
        "🌟 Keep your responses professional, your tone sets the direction of the conversation.",
        "🌟 A calm explanation can clear confusion and rebuild trust.",
        "🌟 Treat every customer with respect, even when the conversation is challenging.",
        "🌟 Guide the conversation toward solutions with patience and clarity.",
        "🌟 Listen with patience, respond with empathy, and resolve with confidence.",
        "🌟 Listening patiently is the first step to de-escalating any situation.",
        "🌟 Lower your tone, slow the conversation, and guide it toward resolution.",
        "🌟 Let the customer feel heard before you try to be understood.",
        "🌟 Respond with clarity and respect, even when emotions run high.",
        "🌟 Take control of the conversation by staying professional and composed.",
        "🌟 Guide the conversation gently from frustration to resolution.",
        "🌟 Listen to understand, not just to reply. Pay attention to the customer’s real concern so you can provide the most accurate solution.",
        "🌟 Queues get heavy and customers may be frustrated. Remain calm, professional, and solution-focused even during difficult interactions.",
        "🌟 The more you know about the service or system, the faster you can resolve issues. Confidence comes from knowledge.",
        "🌟 Customers want to feel understood. Simple phrases like “I understand how difficult or challenging that must be” can immediately improve the interaction.",
        "🌟 Know how to balance speed and accuracy. Handle each case carefully while keeping an eye on response times.",
        "🌟 Each call or chat is a chance to improve. Successful agents review mistakes, accept feedback, and continuously grow.",
        "🌟 Use clear, polite, and structured responses. A professional tone builds trust and prevents misunderstandings.",
        "🌟 Even when the shift is long, maintaining a positive attitude helps you stay motivated and deliver better service.",
        "🌟 Customers contact support because they need help. Instead of focusing on the problem, focus on what you can do to resolve it.",
    ],

    jokes: [
        // Jokes
        "😆 Keep calm and clear the queue.",
        "😆 Powered by coffee and customer complaints.",
        "😆 The queue never sleeps.",
        "😆 Customer service: where patience becomes a career.",
        "😆 I don’t have anger issues, I just work in customer support.",
        "😆 My job is to turn ‘I want to speak to your manager’ into ‘Thank you for your help!’",
        "😆 Customer support: the art of keeping calm while everything is on fire.",
        "😆 I’m not just an agent, I’m a professional problem solver.",
        "😆 I don’t always handle difficult customers, but when I do, I prefer to do it with a smile.",
        "😆 Customer support: where every day is a new adventure in patience.",
        "😆 I’m not saying I’m a superhero, but have you ever seen me and a superhero in the same room?",
        "😆 My superpower? Turning frustrated customers into satisfied ones.",
        "😆 Customer: ‘I’ve been waiting for hours!\nChat start Time: 20 seconds ago.",
        "😆 Customer: ‘Calm down.\nAgent: Hindi naman ako galit bago ka nag-chat.",
        "😆 Customer: ‘You’re not listening to me!’\nAgent: ‘I’m sorry, I can barely hear you over the sound of your frustration.’",
        "😆 Agent life: Nagso-sorry sa problemang hindi mo naman ginawa.",
        "😆 Customer: “Why is this happening?” \nAgent: Also wondering why.",
        "😆 Customer: ‘Are you still there?’\nAgent: <i>Nagbabasa pa lang ng concern.</i>",
        "😆 Typing… deleting… typing ulit… para lang maging professional.",

        // Suspicious
        "🤔 Avail… suspicious.",
        "🤔 No irate customers today… suspicious.",
        "🤔 Customer says ‘no rush’… suspicious.",
        "🤔 Everything is working fine… suspicious.",
        "🤔 No escalations today… suspicious.",
        "🤔 Customer understood on first explanation… suspicious.",
        "🤔 Call ended in 2 minutes… suspicious.",
        "🤔 QA gave 100% score… suspicious.",
        "🤔 TL said ‘good job’ only… suspicious.",
        "🤔 Shift ended peacefully… suspicious.",
        "🤔 No ‘can I speak to your supervisor?’… suspicious.",
        "🤔 Customer says ‘I’m calm’… suspicious.",
        "🤔 Customer: ‘I won’t take much of your time’… suspicious.",
        "🤔 Customer understood the policy… suspicious.",
        "🤔 Customer read the instructions… suspicious.",
        "🤔 Customer didn’t interrupt… suspicious.",
        "🤔 Customer accepted resolution immediately… suspicious.",
        "🤔 Tools loaded fast… suspicious.",
        "🤔 No downtime announcement… suspicious.",
        "🤔 No error message today… suspicious.",
        "👀 Avail… parang may something.",
        "👀 Walang irate today… suspicious ah.",
        "👀 Customer na-gets agad… suspicious.",
        "👀 Walang escalation buong shift… hmm suspicious.",
        "👀 Ang bilis ng call… parang may mali ah.",
        "👀 Tools walang error… grabe suspicious.",
        "👀 Perfect QA? Ay wow… suspicious.",
    ],

    hugot: [
        "🥺 Sa trabaho kaya kong mag-sorry kahit hindi ko kasalanan… pero sa relasyon, ako pa rin ang iniwan.",
        "🥺 Parang queue lang ang feelings ko, akala ko tapos na, may papasok pa pala.",
        "🥺 Akala ko okay na ako, pero parang queue, bumabalik pa rin.",
        "🥺 Kung ang puso ko may status, siguro ‘Waiting for resolution’.",
        "🥺 Parang customer concern ang feelings ko, lagi na lang unresolved.",
        "🥺 Sana may troubleshooting din para sa broken heart.",
        "🥺 Parang escalation lang tayo… dumating ka lang para ipasa ako sa iba.",
        "🥺 Parang ticket ko sa system ang love life ko, lagi na lang awaiting for resolution.",
        "🥺 Sa BPO ko lang naranasan maging kalmado kahit internally nasasaktan.",
        "🥺 Sana relasyon din natin may QA score… para alam ko kung saan ako nagkulang.",
        "🥺 Kung may recording or transcript lang sa relasyon natin, malalaman ko kung kailan nagbago.",
        "🥺 Hindi lang queue ang mahirap i-handle… pati feelings ko.",
        "🥺 Parang shift schedule lang tayo, hindi talaga nagtatagpo.",
        "🥺 Parang internet connection… akala ko stable, biglang nawawala.",
        "🥺 Sana sinabi mo na lang agad… para hindi ako nag-invest ng effort.",
        "🥺 Sana puso ko may ‘End Chat’ button… para tapos na agad.",
        "🥺 Parang queue ang memories natin, kahit ayaw ko na, bumabalik pa rin.",
        "🥺 Akala ko clear na ang queue… pati pala ikaw babalik pa.",
        "🥺 Sana feelings ko may resolution agad… hindi yung laging follow-up.",
        "🥺 Akala ko resolved na… yun pala reopen lang ulit.",
        "🥺 Parang escalation lang ako sa buhay mo, ipinasa mo lang sa iba.",
        "🥺 Akala ko ako na ang final resolution… escalation lang pala ako.",
        "🥺 Sa relasyon natin, ako ang nag-handle… pero sa iba ka nagpa-resolve.",
        "🥺 Kung may evaluation lang ang feelings mo, baka alam ko kung bakit bumagsak.",
        "🥺 Ginawa ko naman lahat… pero parang QA audit, may nakita ka pa ring mali.",
        "🥺 Sa work kaya kong i-handle ang galit ng customer… pero hindi ang pagkawala mo.",
        "🥺 Sa BPO natutunan kong maging kalmado… kahit nasasaktan na.",
        "🥺 Kaya kong i-resolve ang customer issues… pero hindi ang feelings ko.",
        "🥺 Ako night shift, ikaw day shift… siguro kaya hindi tayo nag-work.",
        "🥺 Parang customer concern lang ako sa buhay mo, nireplyan mo lang kasi kailangan.",
        "🥺 Sa customer kaya kong sabihin ‘I understand your concern’… pero hanggang ngayon hindi ko pa rin maintindihan kung bakit mo ako iniwan.",
        "🥺 Sa trabaho may QA feedback… sa’yo wala man lang explanation.",
        "🥺 Mas mabilis ko pang naintindihan ang customer issue kaysa sa relasyon natin.",
        "🥺 Sa trabaho kaya kong ayusin ang problema ng iba… pero sarili kong feelings hindi ko ma-troubleshoot.",
        "🥺 Mas mabilis pa mag-reply ang irate customer kaysa sa’yo.",
        "🥺 Parang system outage ang feelings ko sa’yo, lahat affected.",
        "🥺 Parang queue ang love life ko, laging maraming issue.",
        "🥺 Mas malinaw pa instructions ng customer kaysa sa intentions mo.",
        "🥺 Sa work may knowledge base… sa’yo wala akong reference kung ano ba talaga tayo.",
        "🥺 Parang ticket lang ako sa buhay mo, sinilip mo lang, pero hindi mo inasikaso.",
        "🥺 Mas madali pang i-handle ang escalation kaysa sa mixed signals mo.",
        "🥺 Sa customer may resolution… sa’yo puro confusion.",
        "🥺 Mas consistent pa ang queue kaysa sa effort mo.",
        "🥺 Parang system update ka… biglang nagbago nang walang notification.",
        "🥺 Mas predictable pa ang queue kaysa sa mood mo.",
        "🥺 Parang knowledge base ka… marami akong gustong malaman pero kulang ang sagot.",
        "🥺 Sa trabaho lahat ng issue may case number… sa’yo hindi ko alam kung saan magsisimula.",
        "🥺 Mas madaling intindihin ang complicated na customer kaysa sa ugali mo.",
        "🥺 Sa trabaho may escalation path… sa’yo wala akong mapuntahan.",
        "🥺 Sa trabaho may SLA… sa’yo walang timeline kung kailan magiging okay.",
        "🥺 Parang auto-reply lang ako sa buhay mo… nandiyan pero walang tunay na meaning.",
        "🥺 Sa trabaho may step-by-step troubleshooting… sa’yo puro trial and error.",
        "🥺 Mas mabilis pa ma-resolve ang customer issue kaysa sa misunderstandings natin.",
        "🥺 Mas madaling sundan ang troubleshooting steps kaysa sa mood mo.",
        "🥺 Parang loading screen ang relasyon natin, ang tagal bago maintindihan kung saan papunta.",
        "🥺 Mas madaling magpaliwanag sa irate customer kaysa ipaintindi ang halaga ko sa’yo.",
        "🥺 Sa training may nesting period… sana sa feelings ko rin may practice muna bago masaktan.",
        "🥺 Parang trainee ako sa buhay mo… laging may room for improvement pero hindi sapat.",
        "🥺 Sa training may coaching… sa’yo walang nag-guide kung saan ako nagkamali.",
        "🥺 Parang trainee lang ako sa’yo… umaasang mapansin ng trainer.",
        "🥺 Sa training may graduation… pero sa’yo parang hindi ako nakaabot.",
        "🥺 Parang trainee ako sa feelings mo… hindi pa ready for regularization.",
        "🥺 Sa training may knowledge check… sa’yo wala akong tamang sagot.",
        "🥺 Parang trainee ako sa relasyon natin… trying my best pero kulang pa rin.",
        "🥺 Sa training may feedback… sa’yo wala man lang explanation.",
        "🥺 Parang trainee ako sa’yo… maraming effort pero hindi pa rin enough.",
        "🥺 Sa training may learning curve… sa’yo parang pababa.",
        "🥺 Sa training kaya kong pumasa sa assessments… pero sa’yo parang bagsak pa rin.",
        "🥺 Sa TL may feedback… sa’yo puro mixed signals.",
        "🥺 Sa TL may guidance… sa’yo iniwan mo lang ako mag-figure out.",
        "🥺 Sa TL may team huddle… sa’yo hindi man lang tayo nag-usap.",
        "🥺 Parang TL ka sa buhay ko… lagi mo akong pinapaisip kung sapat ba ako.",
        "🥺 Sa TL may coaching plan… sa’yo walang direction.",
        "🥺 Parang TL ka sa queue… lumalapit lang kapag mabigat na.",
        "🥺 Sa TL may encouragement… sa’yo puro confusion.",
        "🥺 Parang TL ka… alam mong may mali pero hindi mo sinasabi agad.",
        "🥺 Sa TL may performance review… sa’yo hindi ko alam kung pasado ba ako.",
        "🥺 Parang TL ka sa buhay ko… may authority pero hindi ko maintindihan.",
        "🥺 Parang TL ka sa buhay ko… alam kong may sasabihin ka, kinakabahan lang ako kung ano.",
        "😉 Hindi kita binagsak, may pinapaayos lang ako — QA",
        "😉 Hindi kulang effort mo, kulang lang ng isang linya — QA",
        "😉 Alam kong kaya mo, kaya kita kino-correct — QA",
        "😉 Kung hindi kita i-coach, hindi ka magle-level up — TL",
        "😉 Hindi ako kalaban, quality lang ang pinoprotektahan ko — QA",
        "😉 I see your effort, now let’s fix the gaps — QA",
        "😉 Magaling ka na, polish na lang kulang — QA",
        "😄 Na-resolve mo… pero hindi mo na-document — QA",
        "😄 Nasa isip mo, pero wala sa call — QA",
        "😄 Nasa isip mo, pero wala sa transcript — QA",
        "😅 Kaya mo ‘yan, kaya hindi kita pinalampas — QA",
        "😉 Hindi kita pinapahirapan, tinutulungan lang kitang humusay — QA",
    ]
};

// RANDOM MESSAGE PRIO
const messagePrio = {
    tips: 0.5,
    quotes: 0.2,
    advice: 0.2,
    jokes: 0.05,
    hugot: 0.05
};

function getWeightedCategory() {
    const categories = Object.keys(messagePrio);
    const weights = Object.values(messagePrio);

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const rand = Math.random() * totalWeight;

    let cumulative = 0;

    for (let i = 0; i < categories.length; i++) {
        cumulative += weights[i];
        if (rand < cumulative) {
            return categories[i];
        }
    }

    return categories[categories.length - 1]; // fallback
}

let lastMessage = "";

function randomAssistantMessage() {
    const category = getWeightedCategory();
    const messages = assistantMessages[category];

    if (!messages || messages.length === 0) return "";

    if (messages.length === 1) {
        lastMessage = messages[0];
        return messages[0];
    }

    const filtered = messages.filter(m => m !== lastMessage);
    const newMessage = filtered[Math.floor(Math.random() * filtered.length)];

    lastMessage = newMessage;
    return newMessage;
}

// MESSAGE DISPLAY
function showInitialMessage() {
    enqueueMessage(intro, 2500);
}

showInitialMessage();

function showAssistantMessage() {
    if (isTyping || !fabMessage) return;

    const text = randomAssistantMessage();
    if (!text) return;

    stopTyping = false;
    typeWriter(text, fabMessage, FabConfig.typingSpeed);
}

function showIntentMessage(text) {
    if (!text) return;

    messageQueue = [];
    stopTyping = true;

    setTimeout(() => {
        stopTyping = false;
        enqueueMessage(text, 2500, false);
    }, 50);
}

function enqueueRandomMessage() {
    if (panel.classList.contains("open")) return;

    const text = randomAssistantMessage();
    if (!text) return;

    enqueueMessage(text);
}

// CUSTOM ALERT
function showAlert(message) {
  const overlay = document.getElementById("customAlert");
  const messageBox = document.getElementById("alertMessage");
  const okBtn = document.getElementById("alertOkBtn");

  messageBox.textContent = message;

  // SHOW (fade in)
  overlay.classList.remove("hide");
  overlay.style.display = "flex";
  requestAnimationFrame(() => {
    overlay.classList.add("show");
  });

  const closeAlert = () => {
    overlay.classList.remove("show");
    overlay.classList.add("hide");

    setTimeout(() => {
      overlay.style.display = "none";
      overlay.classList.remove("hide");
    }, 300); // match CSS transition
  };

  okBtn.onclick = closeAlert;
}

// CUSTOM CONFIRM
function showConfirm1(message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("customConfirm1");

    const messageBox = overlay.querySelector("#confirmMessage1");
    const okBtn = overlay.querySelector("#confirmDelete");
    const cancelBtn = overlay.querySelector("#confirmKeep");

    messageBox.textContent = message;

    overlay.classList.remove("hide");
    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.classList.add("show"));

    const cleanup = (result) => {
      overlay.classList.remove("show");
      overlay.classList.add("hide");

      setTimeout(() => {
        overlay.style.display = "none";
        overlay.classList.remove("hide");
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        resolve(result);
      }, 300);
    };

    okBtn.onclick = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
  });
}

function showConfirm2(message) {
  return new Promise((resolve) => {
    const overlay = document.getElementById("customConfirm2");

    const messageBox = overlay.querySelector("#confirmMessage2");
    const okBtn = overlay.querySelector("#confirmOk");
    const cancelBtn = overlay.querySelector("#confirmCancel");

    messageBox.textContent = message;

    overlay.classList.remove("hide");
    overlay.style.display = "flex";
    requestAnimationFrame(() => overlay.classList.add("show"));

    const cleanup = (result) => {
      overlay.classList.remove("show");
      overlay.classList.add("hide");

      setTimeout(() => {
        overlay.style.display = "none";
        overlay.classList.remove("hide");
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        resolve(result);
      }, 300);
    };

    okBtn.onclick = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
  });
}