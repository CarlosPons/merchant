// Module to fetch and render standard tables (Resource, City)
async function fetchStandardTable(table, tableHead, dataBody) {
    const response = await fetch(`${BASE_REST_URL}/${table}?select=*`, {
        method: 'GET',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    
    const data = await response.json();
    if (data.length === 0) {
        tableHead.innerHTML = `<tr><th>Información</th></tr>`;
        dataBody.innerHTML = `<tr><td class="no-data">La tabla "${table}" está vacía actualmente.</td></tr>`;
        return;
    }

    const columns = Object.keys(data[0]);
    const tr = document.createElement('tr');
    
    // Setup specific user-friendly headers
    columns.forEach(col => { 
        const th = document.createElement('th');
        if (col === 'name') th.textContent = 'Nombre';
        else if (col === 'description') th.textContent = 'Descripción';
        else if (col === 'group') th.textContent = 'Grupo';
        else if (table === 'City' && col === 'shipImprovement') th.textContent = 'Ampliación de la Bodega';
        else if (table === 'City' && col === 'addMarket') th.textContent = 'Añadir demanda';
        else if (table === 'City' && col === 'addProduction') th.textContent = 'Añadir producción';
        else if (table === 'City' && col === 'addSpy') th.textContent = 'Reclutar espía';
        else if (table === 'City' && col === 'goldFest') th.textContent = 'Organizar juegos';
        else th.textContent = col;
        tr.appendChild(th); 
    });

    if (table === 'Resource') {
        const thPrice = document.createElement('th');
        thPrice.textContent = 'Precio base';
        tr.appendChild(thPrice);
    }
    tableHead.appendChild(tr);

    // Sorting block
    data.sort((a, b) => {
        if (table === 'Resource') {
            const groupA = Number(a.group || 0);
            const groupB = Number(b.group || 0);
            if (groupA !== groupB) return groupA - groupB;
        }
        return Number(a.id || 0) - Number(b.id || 0);
    });

    // Content rows mapping
    data.forEach(item => {
        const row = document.createElement('tr');
        let emptyValues = 0;

        columns.forEach(col => {
            const td = document.createElement('td');

            if (table === 'City') {
                if ((col === 'shipImprovement' || col === 'addMarket' || col === 'addProduction' || col === 'addSpy' || col === 'goldFest') && item[col] === 0) {
                    emptyValues++;
                }
                if (item[col] === 1) {
                    td.innerHTML = `<span style="margin-left: 15px;">✅</span>`;
                } else {
                    td.textContent = item[col] !== null ? (item[col] !== 0 ? item[col] : ' ') : '-';
                }
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

        // Filtering condition logic for specific empty records
        if (emptyValues !== 5) {
            dataBody.appendChild(row);
        }
    });
}

// Expose functions globally to maintain system capability across tabs
window.fetchStandardTable = fetchStandardTable;