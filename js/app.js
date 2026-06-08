// Manejo de la interfaz de usuario, control de pestañas y estados

let currentTable = 'Merchant';

document.addEventListener('DOMContentLoaded', () => {
    fetchData(currentTable);
});

document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentTable = e.target.getAttribute('data-table');
        fetchData(currentTable);
    });
});

async function fetchData(table) {
    const tableHead = document.getElementById('tableHead');
    const dataBody = document.getElementById('dataBody');
    const loadingDiv = document.getElementById('loading');

    document.getElementById('statusMessage').style.display = 'none';
    tableHead.innerHTML = '';
    dataBody.innerHTML = '';
    loadingDiv.style.display = 'block';

    try {
        if (table === 'Merchant') {
            await fetchMerchantWithInventory(tableHead, dataBody);
        } else if (table === 'Spy') {
            await fetchSpyTable(tableHead, dataBody);
        } else if (table === 'CityConnection') {
            await fetchCityConnectionTable(tableHead, dataBody);
        } else if (table === 'CityOffer') {
            await fetchCityOffer(tableHead, dataBody);
            await fetchCityDemand(tableHead, dataBody);
        } else {
            await fetchStandardTable(table, tableHead, dataBody);
        }
        loadingDiv.style.display = 'none';
    } catch (error) {
        loadingDiv.style.display = 'none';
        tableHead.innerHTML = `<tr><th>Error</th></tr>`;
        dataBody.innerHTML = `<tr><td class="no-data" style="color:#f75a5a;">Error al cargar los datos.</td></tr>`;
        showStatus(error.message, 'error');
    }
}

function showStatus(msg, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.innerText = msg;
    statusDiv.className = `status ${type}`;
}

window.refreshCurrentTable = () => {
    fetchData(currentTable);
};
