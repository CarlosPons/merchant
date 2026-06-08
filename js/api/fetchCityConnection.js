// Module tailored exclusively for the paths and routes between cities
async function fetchCityConnectionTable(tableHead, dataBody) {
    const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };
    
    // Fetch both connections and city names concurrently to gain performance
    const [citiesResponse, connectionsResponse] = await Promise.all([
        fetch(`${BASE_REST_URL}/City?select=id,name`, { headers }),
        fetch(`${BASE_REST_URL}/CityConnection?select=*`, { headers })
    ]);

    if (!connectionsResponse.ok) throw new Error(`Status: ${connectionsResponse.status}`);
    
    let resCities = [];
    if (citiesResponse.ok) {
        resCities = await citiesResponse.json();
    }
    const cityMap = {};
    resCities.forEach(c => { cityMap[c.id] = c.name; });

    const data = await connectionsResponse.json();
    if (data.length === 0) {
        tableHead.innerHTML = `<tr><th>Información</th></tr>`;
        dataBody.innerHTML = `<tr><td class="no-data">La tabla "CityConnection" está vacía actualmente.</td></tr>`;
        return;
    }

    const columns = Object.keys(data[0]);
    const tr = document.createElement('tr');
    
    // Setup clean dedicated columns
    columns.forEach(col => {
        const th = document.createElement('th');
        if (col === 'id') th.textContent = 'id';
        else if (col === 'city_a_id') th.textContent = 'Ciudad Origen';
        else if (col === 'city_b_id') th.textContent = 'Ciudad Destino';
        else th.textContent = col;
        tr.appendChild(th); 
    });
    tableHead.appendChild(tr);

    // Default sorting by connection primary key
    data.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    // Render connection rows
    data.forEach(item => {
        const row = document.createElement('tr');

        columns.forEach(col => {
            const td = document.createElement('td');
            if (col === 'city_a_id' || col === 'city_b_id') {
                const cityId = item[col];
                td.textContent = cityMap[cityId] || `Ciudad #${cityId}`;
            } else {
                td.textContent = item[col] !== null ? item[col] : '-';
            }
            row.appendChild(td);                   
        });

        dataBody.appendChild(row);
    });
}

window.fetchCityConnectionTable = fetchCityConnectionTable;