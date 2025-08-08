// const urlParams = new URLSearchParams(window.location.search);
// const hostname = urlParams.get("hostname");

// document.getElementById("hostname").textContent = hostname;

// const spinnerLive = document.getElementById("spinner");
// const statusMsg = document.getElementById("statusMsg");

// document.getElementById("connectBtn").addEventListener("click", async () => {
//     spinnerLive.style.display = "block";
//     statusMsg.textContent = "";
//     try {
//         const res = await fetch(`${API_BASE_URL}/connect?hostname=${encodeURIComponent(hostname)}`);
//         if (!res.ok) throw new Error("Connection failed");
//         const result = await res.json();
//         statusMsg.textContent = "Connected: " + JSON.stringify(result);
//     } catch (err) {
//         statusMsg.textContent = err.message;
//     } finally {
//         spinnerLive.style.display = "none";
//     }
// });


let ws = null;
let currentHostname = '';
let expandedProcesses = new Set();
const urlParams = new URLSearchParams(window.location.search);
const hostname = urlParams.get("hostname");
document.getElementById('hostnameInput').value = hostname;

function updateStatus(connected) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    if (connected) {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
    }
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.innerHTML = `<div class="error">Error: ${message}</div>`;
    setTimeout(() => {
        errorContainer.innerHTML = '';
    }, 5000);
}

function connect() {
    if (!hostname) {
        showError('Please enter a hostname');
        return;
    }

    if (ws) {
        ws.close();
    }

    currentHostname = hostname;
    const wsUrl = `ws://52.66.248.191:8000//ws/monitor/${hostname}/`;

    try {
        ws = new WebSocket(wsUrl);

        ws.onopen = function () {
            console.log('Connected to WebSocket');
            updateStatus(true);
        };

        ws.onmessage = function (event) {
            const data = JSON.parse(event.data);
            console.log('Received data:', data);
            updateProcessDisplay(data);
        };

        ws.onclose = function () {
            console.log('WebSocket disconnected');
            updateStatus(false);
        };

        ws.onerror = function (error) {
            console.error('WebSocket error:', error);
            showError('Connection failed');
            updateStatus(false);
        };

    } catch (error) {
        showError('Failed to connect: ' + error.message);
        updateStatus(false);
    }
}

function refresh() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'refresh' }));
    }
}

function updateProcessDisplay(data) {
    const processes = data.processes || [];
    const timestamp = new Date(data.timestamp).toLocaleTimeString();

    document.getElementById('totalProcesses').textContent = countTotalProcesses(processes);
    document.getElementById('rootProcesses').textContent = processes.length;
    document.getElementById('lastUpdate').textContent = `Last update: ${timestamp}`;

    const allProcesses = flattenProcesses(processes);
    const avgCpu = allProcesses.reduce((sum, p) => sum + p.cpu_usage, 0) / allProcesses.length;
    const avgMemory = allProcesses.reduce((sum, p) => sum + p.memory_usage, 0) / allProcesses.length;

    document.getElementById('avgCpu').textContent = avgCpu.toFixed(1) + '%';
    document.getElementById('avgMemory').textContent = avgMemory.toFixed(1) + '%';

    renderProcessTree(processes);
}

function countTotalProcesses(processes) {
    let count = 0;
    for (let process of processes) {
        count += 1 + countTotalProcesses(process.children || []);
    }
    return count;
}

function flattenProcesses(processes) {
    let flat = [];
    for (let process of processes) {
        flat.push(process);
        flat = flat.concat(flattenProcesses(process.children || []));
    }
    return flat;
}

function renderProcessTree(processes) {
    const container = document.getElementById('processContainer');
    container.innerHTML = '';

    if (processes.length === 0) {
        container.innerHTML = '<div class="loading">No processes found</div>';
        return;
    }

    processes.forEach(process => {
        container.appendChild(renderProcess(process, 0));
    });
}

function renderProcess(process, depth = 0) {
    const hasChildren = process.children && process.children.length > 0;
    const isExpanded = expandedProcesses.has(process.pid);

    const processItem = document.createElement('div');
    processItem.className = 'process-item';

    const processRow = document.createElement('div');
    processRow.className = 'process-row';
    processRow.style.paddingLeft = (15 + depth * 30) + 'px';

    if (hasChildren) {
        processRow.onclick = () => toggleProcess(process.pid);
        processRow.style.cursor = 'pointer';
    }

    processRow.innerHTML = `
        <div class="process-name">
            <div class="expand-icon ${isExpanded ? 'expanded' : ''}" 
                 style="${hasChildren ? '' : 'visibility: hidden;'}">
                ${hasChildren ? '▶' : ''}
            </div>
            <div>
                <span class="process-info">${process.name}</span>
                <span class="process-pid">PID: ${process.pid}</span>
            </div>
        </div>
        <div>${process.pid}</div>
        <div>
            <div class="usage-bar">
                <div class="usage-fill cpu-usage" style="width: ${Math.min(process.cpu_usage || 0, 100)}%"></div>
            </div>
            <div class="usage-text">${(process.cpu_usage || 0).toFixed(1)}%</div>
        </div>
        <div>
            <div class="usage-bar">
                <div class="usage-fill memory-usage" style="width: ${Math.min(process.memory_usage || 0, 100)}%"></div>
            </div>
            <div class="usage-text">${(process.memory_usage || 0).toFixed(1)}%</div>
        </div>
    `;

    processItem.appendChild(processRow);

    if (hasChildren) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = `children ${isExpanded ? 'expanded' : ''}`;
        childrenContainer.id = `children-${process.pid}`;

        process.children.forEach(child => {
            childrenContainer.appendChild(renderProcess(child, depth + 1));
        });

        processItem.appendChild(childrenContainer);
    }

    return processItem;
}

function toggleProcess(pid) {
    const childrenContainer = document.getElementById(`children-${pid}`);
    const expandIcon = childrenContainer.previousElementSibling.querySelector('.expand-icon');

    if (expandedProcesses.has(pid)) {
        expandedProcesses.delete(pid);
        childrenContainer.classList.remove('expanded');
        expandIcon.classList.remove('expanded');
    } else {
        expandedProcesses.add(pid);
        childrenContainer.classList.add('expanded');
        expandIcon.classList.add('expanded');
    }
}

window.onload = function () {
    // Auto-connect if needed
    // connect();
};







