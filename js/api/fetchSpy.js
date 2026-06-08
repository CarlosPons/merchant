// Módulo para consultar los Espías del jugador
async function fetchSpyTable(tableHead, dataBody) {
    const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };
    const [resSpies, resCities] = await Promise.all([
        fetch(`${BASE_REST_URL}/Spy?merchant_id=eq.${MERCHANT_ID}`, { headers }).then(r => r.json()),
        fetch(`${BASE_REST_URL}/City?select=id,name`, { headers }).then(r => r.json())
    ]);

    tableHead.innerHTML = `<tr><th>ID</th><th>Nombre Espía</th><th>Coste</th><th>Ciudad Asignada</th></tr>`;

    if (resSpies.length === 0) {
        dataBody.innerHTML = `<tr><td colspan="4" class="no-data">No tienes ningún espía contratado bajo tu mando.</td></tr>`;
        return;
    }

    const cityMap = {};
    resCities.forEach(c => { cityMap[c.id] = c.name; });

    resSpies.forEach(spy => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${spy.id}</strong></td>
            <td>${spy.name}</td>
            <td>${spy.cost_per_turn} Monedas de Oro</td>
            <td>${cityMap[spy.city_id] || `Ciudad #${spy.city_id}`}</td>
        `;
        dataBody.appendChild(row);
    });
}

window.fetchSpyTable = fetchSpyTable;
