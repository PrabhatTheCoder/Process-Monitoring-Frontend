const urlParamsSnap = new URLSearchParams(window.location.search);
const hostId = urlParamsSnap.get("id");

const spinnerSnap = document.getElementById("spinner");
const errorMsgSnap = document.getElementById("errorMsg");
const tbody = document.querySelector("#snapshotTable tbody");
const thead = document.querySelector("#snapshotTable thead");

function formatDate(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

async function loadSnapshot() {
    // 1️⃣ Check if hostId exists
    if (!hostId) {
        errorMsgSnap.textContent = "Missing host ID in URL.";
        return;
    }

    spinnerSnap.style.display = "block";
    errorMsgSnap.textContent = "";
    tbody.innerHTML = "";

    try {
        // 2️⃣ Fetch snapshot data
        const res = await fetch(`${API_BASE_URL}/api/system-snapshot/?host_id=${encodeURIComponent(hostId)}`);
        if (!res.ok) throw new Error(`Failed to fetch snapshot (HTTP ${res.status})`);

        const snapshots = await res.json();


        // 3️⃣ If API returns empty
        if (!snapshots || Object.keys(snapshots).length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" style="text-align:center;">No snapshot data available.</td></tr>`;
            return;
        }

        const fieldsToShow = [
            { field: "hostname", label: "Hostname" },
            { field: "os", label: "Operating System" },
            { field: "processor", label: "Processor" },
            { field: "cpu_cores", label: "CPU Cores" },
            { field: "threads", label: "Threads" },
            { field: "total_ram", label: "Total RAM (GB)" },
            { field: "available_ram", label: "Available RAM (GB)" },
            { field: "used_ram", label: "Used RAM (GB)" },
            { field: "total_storage", label: "Total Storage (GB)" },
            { field: "used_storage", label: "Used Storage (GB)" },
            { field: "available_storage", label: "Available Storage (GB)" },
            { field: "created_at", label: "Date" }
        ];


        // 4️⃣ Render snapshot table rows
        thead.innerHTML = `
        <tr>
            ${fieldsToShow.map(col => `<th>${col.label}</th>`).join("")}
        </tr>
    `;

        // Build data rows
        tbody.innerHTML = snapshots.map(snapshot => `
        <tr>
            ${fieldsToShow.map(col => {
            let value = snapshot[col.field] ?? "";
            if (col.field === "created_at") value = formatDate(value);
            return `<td>${value}</td>`;
        }).join("")}
        </tr>
    `).join("");


    } catch (err) {
        errorMsgSnap.textContent = `Error: ${err.message}`;
    } finally {
        spinnerSnap.style.display = "none";
    }
}

// Run on page load
loadSnapshot();
