// Módulo para consultar la ficha del Mercader y sus pertenencias
async function fetchMerchantWithInventory(tableHead, dataBody) {
    const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };
    const [resMerchants, resInventory, resResources, resCities] = await Promise.all([
        fetch(`${BASE_REST_URL}/Merchant?select=*`, { headers }).then(r => r.json()),
        fetch(`${BASE_REST_URL}/MerchantInventory?select=*`, { headers }).then(r => r.json()),
        fetch(`${BASE_REST_URL}/Resource?select=*`, { headers }).then(r => r.json()),
        fetch(`${BASE_REST_URL}/City?select=id,name`, { headers }).then(r => r.json())
    ]);

    // Buscamos directamente el mercader que coincide con nuestro MERCHANT_ID
    const merchant = resMerchants.find(m => m.id === MERCHANT_ID);

    if (!merchant) {
        tableHead.innerHTML = `<tr><th>Información</th></tr>`;
        dataBody.innerHTML = `<tr><td class="no-data">No se ha encontrado el mercader activo en la base de datos.</td></tr>`;
        return;
    }

    // Construcción del mapa de recursos con su grupo y precio calculado
    const resourceMap = {};
    resResources.forEach(r => { 
        const rawGroup = r.group !== undefined ? r.group : r.group_id;
        const groupValue = parseInt(rawGroup, 10);
        let priceCalculated = 0;
        if (!isNaN(groupValue) && groupValue > 0) {
            priceCalculated = parseInt(0.9 * (groupValue * 10) * (groupValue * 0.1 + 1), 10);
        }
        resourceMap[r.id] = {
            name: r.name,
            price: priceCalculated,
            group: !isNaN(groupValue) ? groupValue : 0
        };
    });

    const cityMap = {};
    resCities.forEach(c => { cityMap[c.id] = c.name; });

    // 1. Renderizar cabecera principal del mercader
    tableHead.innerHTML = `<tr><th>Nombre Mercader</th><th>Ciudad Actual</th><th>Oro en el Cofre</th></tr>`;

    const merchantStock = resInventory.filter(inv => inv.merchant_id === merchant.id);
    const cityName = cityMap[merchant.currentCity] || `Ciudad #${merchant.currentCity}`;
    
    // 2. Insertar fila única con las estadísticas del mercader
    const rowMerchant = document.createElement('tr');
    rowMerchant.innerHTML = `
        <td>${merchant.name}</td>
        <td>${cityName}</td>
        <td>${merchant.gold !== undefined ? `${merchant.gold} Monedas de Oro` : '0 Monedas'}</td>
    `;
    dataBody.appendChild(rowMerchant);

    // 3. Subcabecera para la sección de la bodega
    const rowSubHeader = document.createElement('tr');
    rowSubHeader.innerHTML = `<th colspan="3" style="background-color: #1c1c1f; color: #c4c4cc; padding: 10px 15px;">Mercancías en la bodega del navío</th>`;
    dataBody.appendChild(rowSubHeader);

    const rowInventory = document.createElement('tr');
    const tdInvContainer = document.createElement('td');
    tdInvContainer.setAttribute('colspan', '3');

    // Contenedor Grid configurado explícitamente a 3 columnas fijas
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    gridContainer.style.gap = '8px';
    gridContainer.style.padding = '10px 0';

    if (merchantStock.length === 0) {
        tdInvContainer.innerHTML = '<span class="no-data">Inventario no inicializado.</span>';
    } else {
        // Ordenación explícita por grupo de menor a mayor
        merchantStock.sort((a, b) => {
            const groupA = resourceMap[a.resource_id]?.group || 0;
            const groupB = resourceMap[b.resource_id]?.group || 0;
            if (groupA !== groupB) return groupA - groupB;
            return Number(a.resource_id || 0) - Number(b.resource_id || 0);
        });

        // Generar elementos alineados
        merchantStock.forEach(stock => {
            const resourceObj = resourceMap[stock.resource_id];
            const resourceName = resourceObj?.name || `Recurso #${stock.resource_id}`;
            
            const itemDiv = document.createElement('div');
            // Reutilizamos tus clases CSS visuales y añadimos flexbox para empujar la cantidad a la derecha
            itemDiv.className = `inventory-item ${stock.quantity > 0 ? 'has-stock' : ''}`;
            itemDiv.style.display = 'flex';
            itemDiv.style.justifyContent = 'space-between';
            itemDiv.style.alignItems = 'center';
            itemDiv.style.padding = '6px 12px';

            // Estructura interna: Nombre a la izquierda, Cantidad a la derecha
            itemDiv.innerHTML = `
                <span>${resourceName}</span>
                <span style="font-weight: 600; text-align: right;">${stock.quantity}</span>
            `;
            
            gridContainer.appendChild(itemDiv);
        });
        tdInvContainer.appendChild(gridContainer);
    }
    
    rowInventory.appendChild(tdInvContainer);
    dataBody.appendChild(rowInventory);
}

window.fetchMerchantWithInventory = fetchMerchantWithInventory;