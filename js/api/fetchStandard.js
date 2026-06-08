// Módulo para consultar tablas estándar (Resource, City, CityConnection)
async function fetchStandardTable(table, tableHead, dataBody) {
    let resCities = [];
    if (table === 'CityConnection') {
        const citiesResponse = await fetch(`${BASE_REST_URL}/City?select=id,name`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (citiesResponse.ok) {
            resCities = await citiesResponse.json();
        }
    }

    const cityMap = {};
    resCities.forEach(c => { cityMap[c.id] = c.name; });

    const response = await fetch(`${BASE_REST_URL}/${table}?select=*`, {
        method: 'GET',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    if (!response.ok) throw new Error(`Estado: ${response.status}`);
    
    const data = await response.json();
    if (data.length === 0) {
        tableHead.innerHTML = `<tr><th>Información</th></tr>`;
        dataBody.innerHTML = `<tr><td class="no-data">La tabla "${table}" está vacía actualmente.</td></tr>`;
        return;
    }

    const columns = Object.keys(data[0]);
    const tr = document.createElement('tr');
    
    columns.forEach(col => { 
        const th = document.createElement('th');
        if (col === 'name') th.textContent = 'Nombre';
        else if (col === 'description') th.textContent = 'Descripción';
        else if (col === 'group') th.textContent = 'Grupo';
        else if (table === 'CityConnection' && col === 'city_a_id') th.textContent = 'Ciudad Origen';
        else if (table === 'CityConnection' && col === 'city_b_id') th.textContent = 'Ciudad Destino';
        else if (table === 'City' && col === 'shipImprovement') th.textContent = 'Ampliación de la Bodega';
        else if (table === 'City' && col === 'addMarket') th.textContent = 'Añadir demanda';
        else if (table === 'City' && col === 'addProduction') th.textContent = 'Añadir producción';
        else if (table === 'City' && col === 'addSpy') th.textContent = 'Reclutar espía';
        else if (table === 'City' && col === 'goldFest') th.textContent = 'Organizar juegos';
        else th.textContent = col;
        tr.appendChild(th); 
    });

    if (table === 'Resource' || table === 'City' || table === 'CityConnection') {
        const thPrice = document.createElement('th');
        thPrice.textContent = 'Precio base';
        tr.appendChild(thPrice);
    }
    tableHead.appendChild(tr);

    data.sort((a, b) => {
        if (table === 'Resource') {
            const groupA = Number(a.group || 0);
            const groupB = Number(b.group || 0);
            if (groupA !== groupB) return groupA - groupB;
        }
        return Number(a.id || 0) - Number(b.id || 0);
    });

    data.forEach(item => {
        const row = document.createElement('tr');
        let emptyValues = 0;

        columns.forEach(col => {
            const td = document.createElement('td');

            if (table === 'City') {
                if ((col === 'shipImprovement' || col === 'addMarket' || col === 'addProduction' || col === 'addSpy' || col === 'goldFest') && item[col] === 0) emptyValues++;
                if (item[col] === 1) {
                    td.innerHTML = `<span style="margin-left: 15px;">✅</span>`;
                } else {
                    td.textContent = item[col] !== null ? (item[col] !== 0 ? item[col] : ' ') : '-';
                }
            }
            else if (table === 'CityConnection' && (col === 'city_a_id' || col === 'city_b_id')) {
                const cityId = item[col];
                td.textContent = cityMap[cityId] || `Ciudad #${cityId}`;
            } else {
                td.textContent = item[col] !== null ? (item[col] !== 0 ? item[col] : '-') : '-';
            }

            row.appendChild(td);                   
        });

        if (table === 'Resource') {
            const tdPrice = document.createElement('td');
            const groupValue = Number(item['group'] !== undefined ? item['group'] : (item['group_id'] !== undefined ? item['group_id'] : 0));
            const priceCalculated = parseInt((groupValue * 10) * (groupValue * 0.1 + 1));
            
            tdPrice.textContent = !isNaN(priceCalculated) && groupValue > 0 ? `${priceCalculated} Oro` : '-';
            tdPrice.style.fontWeight = '600';
            row.appendChild(tdPrice);
        }

        if (emptyValues !== 5) {
            dataBody.appendChild(row);
        }
    });
}

// Lo exponemos globalmente
window.fetchStandardTable = fetchStandardTable;
