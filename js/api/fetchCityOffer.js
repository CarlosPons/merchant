// Módulo para interactuar con el comercio local (Ofertas y Demandas de la Ciudad)

async function fetchCityOffer(tableHead, dataBody) {
    const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };
    const merchantResponse = await fetch(`${BASE_REST_URL}/Merchant?id=eq.${MERCHANT_ID}&select=currentCity`, { headers });
    const merchants = await merchantResponse.json();
    
    if (merchants.length === 0) {
        tableHead.innerHTML = `<tr><th>Información</th></tr>`;
        dataBody.innerHTML = `<tr><td class="no-data">No se ha podido encontrar al mercader.</td></tr>`;
        return;
    }
    
    const cityId = merchants[0].currentCity;

    const [resInventory, resResources, resCities] = await Promise.all([
        fetch(`${BASE_REST_URL}/CityInventory?idCity=eq.${cityId}&quantity=gt.0&select=*&order=idResource.asc`, { headers }).then(r => r.json()),
        fetch(`${BASE_REST_URL}/Resource?select=*&order=group.asc`, { headers }).then(r => r.json()),
        fetch(`${BASE_REST_URL}/City?id=eq.${cityId}&select=name`, { headers }).then(r => r.json())
    ]);

    const cityName = resCities.length > 0 ? resCities[0].name : `Ciudad #${cityId}`;
    tableHead.innerHTML = `<tr><th>Nombre Ciudad</th><th>Recurso Disponible</th><th>Cantidad en Stock</th><th>Precio unidad</th><th>Acción</th></tr>`;

    if (resInventory.length === 0) {
        dataBody.innerHTML = `<tr><td colspan="5" class="no-data">No hay mercancías disponibles con stock positivo en ${cityName} actualmente.</td></tr>`;
        return;
    }

    const resourceMap = {};
    resResources.forEach(r => { 
        const groupValue = parseInt(r.group);
        const priceCalculated = parseInt(0.9 * (groupValue * 10) * (groupValue * 0.1 + 1));
        resourceMap[r.id] = {
            name: r.name,
            price: isNaN(priceCalculated) ? 0 : priceCalculated
        };
    });

    resInventory.forEach(item => {
        const row = document.createElement('tr');
        
        const tdCityName = document.createElement('td'); tdCityName.textContent = cityName;
        const tdResource = document.createElement('td'); tdResource.innerHTML = `<strong>${resourceMap[item.idResource]?.name || `Recurso #${item.idResource}`}</strong>`;
        const tdQty = document.createElement('td'); tdQty.textContent = `Disponibles ${item.quantity}`; tdQty.style.color = '#2dff54';
        const tdPrice = document.createElement('td'); tdPrice.textContent = `${resourceMap[item.idResource]?.price} Oro`; tdPrice.style.fontWeight = '600';
        
        const tdAction = document.createElement('td');
        const btnBuy = document.createElement('button');
        btnBuy.textContent = 'Comprar';
        btnBuy.style = 'background: #2dff54; color: #121214; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-weight: 600;';

        btnBuy.addEventListener('click', async () => {
            if (item.quantity <= 0) { alert('¡Esta mercancía ya se ha agotado!'); return; }
            btnBuy.disabled = true; btnBuy.textContent = '...';
            
            try {
                const price = resourceMap[item.idResource]?.price || 0;
                const merchantRes = await fetch(`${BASE_REST_URL}/Merchant?id=eq.${MERCHANT_ID}&select=gold`, { headers });
                const merchantData = await merchantRes.json();
                const currentGold = merchantData[0]?.gold || 0;
                
                if (currentGold < price) {
                    alert(`¡No tienes suficiente oro!`);
                    btnBuy.disabled = false; btnBuy.textContent = 'Comprar';
                    return;
                }

                const merchantInvRes = await fetch(`${BASE_REST_URL}/MerchantInventory?merchant_id=eq.${MERCHANT_ID}&resource_id=eq.${item.idResource}&select=quantity`, { headers });
                const merchantInvData = await merchantInvRes.json();
                const currentMerchantQty = merchantInvData[0]?.quantity || 0;

                const updateMerchant = await fetch(`${BASE_REST_URL}/Merchant?id=eq.${MERCHANT_ID}`, {
                    method: 'PATCH',
                    headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                    body: JSON.stringify({ gold: currentGold - price })
                });

                const updateMerchantInventory = await fetch(`${BASE_REST_URL}/MerchantInventory?merchant_id=eq.${MERCHANT_ID}&resource_id=eq.${item.idResource}`, {
                    method: 'PATCH',
                    headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                    body: JSON.stringify({ quantity: currentMerchantQty + 1 }) 
                });

                const updateInventory = await fetch(`${BASE_REST_URL}/CityInventory?idCity=eq.${cityId}&idResource=eq.${item.idResource}`, {
                    method: 'PATCH',
                    headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                    body: JSON.stringify({ quantity: item.quantity - 1 }) 
                });

                if (updateMerchant.ok && updateMerchantInventory.ok && updateInventory.ok) {
                    // Accedemos a la función global de refresco alojada en app.js
                    window.refreshCurrentTable();
                } else {
                    alert('Error al procesar la compra.');
                    btnBuy.disabled = false; btnBuy.textContent = 'Comprar';
                }
            } catch (err) {
                console.error(err);
                btnBuy.disabled = false; btnBuy.textContent = 'Comprar';
            }
        });

        tdAction.appendChild(btnBuy);
        row.appendChild(tdCityName); row.appendChild(tdResource); row.appendChild(tdQty); row.appendChild(tdPrice); row.appendChild(tdAction);
        dataBody.appendChild(row);
    });
}

async function fetchCityDemand(tableHead, dataBody) {
    const headers = { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` };
    const merchantResponse = await fetch(`${BASE_REST_URL}/Merchant?id=eq.${MERCHANT_ID}&select=currentCity`, { headers });
    const merchants = await merchantResponse.json();
    
    if (merchants.length === 0) return;
    const cityId = merchants[0].currentCity;

    const [resInventory, resResources, resCities] = await Promise.all([
        fetch(`${BASE_REST_URL}/CityInventory?idCity=eq.${cityId}&quantity=lte.0&select=*`, { headers }).then(r => r.json()),
        fetch(`${BASE_REST_URL}/Resource?select=*`, { headers }).then(r => r.json()),
        fetch(`${BASE_REST_URL}/City?id=eq.${cityId}&select=name`, { headers }).then(r => r.json())
    ]);

    const cityName = resCities.length > 0 ? resCities[0].name : `Ciudad #${cityId}`;
    
    if (resInventory.length === 0) {
        const rowEmpty = document.createElement('tr');
        rowEmpty.innerHTML = `<td colspan="5" class="no-data">La ciudad ${cityName} no tiene demandas urgentes en este momento.</td>`;
        dataBody.appendChild(rowEmpty);
        return;
    }

    const resourceMap = {};
    resResources.forEach(r => { 
        const rawGroup = r.group !== undefined ? r.group : r.group_id;
        const groupValue = parseInt(rawGroup, 10);
        let priceCalculated = 0;
        if (!isNaN(groupValue) && groupValue > 0) {
            priceCalculated = parseInt(1.1 * (groupValue * 10) * (groupValue * 0.1 + 1), 10);
        }
        resourceMap[r.id] = {
            name: r.name,
            price: priceCalculated,
            group: !isNaN(groupValue) ? groupValue : 0
        };
    });

    resInventory.sort((a, b) => {
        const groupA = resourceMap[a.idResource]?.group || 0;
        const groupB = resourceMap[b.idResource]?.group || 0;
        if (groupA !== groupB) return groupA - groupB;
        return Number(a.idResource || 0) - Number(b.idResource || 0);
    });

    resInventory.forEach(item => {
        if (item.quantity === 0) return;

        const row = document.createElement('tr');
        
        const tdCityName = document.createElement('td'); tdCityName.textContent = cityName;
        const tdResource = document.createElement('td'); tdResource.innerHTML = `<strong>${resourceMap[item.idResource]?.name || `Recurso #${item.idResource}`}</strong>`;
        
        const tdQty = document.createElement('td');
        if (item.quantity < 0) {
            tdQty.textContent = `Necesitan ${Math.abs(item.quantity)}`; tdQty.style.color = '#f75a5a';
        } 
                
        const tdPrice = document.createElement('td'); tdPrice.textContent = `${resourceMap[item.idResource]?.price || 0} Oro`; tdPrice.style.fontWeight = '600';

        const tdAction = document.createElement('td');
        const btnSell = document.createElement('button');
        btnSell.textContent = 'Vender';
        btnSell.style = 'background: #882f1c; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-weight: 600;';

        btnSell.addEventListener('click', async () => {
            btnSell.disabled = true; btnSell.textContent = '...';
            
            try {
                const price = resourceMap[item.idResource]?.price || 0;
                const merchantInvRes = await fetch(`${BASE_REST_URL}/MerchantInventory?merchant_id=eq.${MERCHANT_ID}&resource_id=eq.${item.idResource}&select=quantity`, { headers });
                const merchantInvData = await merchantInvRes.json();
                const currentMerchantQty = merchantInvData[0]?.quantity || 0;

                if (currentMerchantQty <= 0) {
                    alert('¡No puedes vender este recurso porque no te queda stock en la bodega!');
                    btnSell.disabled = false; btnSell.textContent = 'Vender';
                    return;
                }

                const merchantRes = await fetch(`${BASE_REST_URL}/Merchant?id=eq.${MERCHANT_ID}&select=gold`, { headers });
                const merchantData = await merchantRes.json();
                const currentGold = merchantData[0]?.gold || 0;

                const updateMerchantInventory = await fetch(`${BASE_REST_URL}/MerchantInventory?merchant_id=eq.${MERCHANT_ID}&resource_id=eq.${item.idResource}`, {
                    method: 'PATCH',
                    headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                    body: JSON.stringify({ quantity: currentMerchantQty - 1 }) 
                });

                const updateMerchant = await fetch(`${BASE_REST_URL}/Merchant?id=eq.${MERCHANT_ID}`, {
                    method: 'PATCH',
                    headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                    body: JSON.stringify({ gold: currentGold + price })
                });

                const updateInventory = await fetch(`${BASE_REST_URL}/CityInventory?idCity=eq.${cityId}&idResource=eq.${item.idResource}`, {
                    method: 'PATCH',
                    headers: { ...headers, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                    body: JSON.stringify({ quantity: item.quantity + 1 }) 
                });

                if (updateMerchantInventory.ok && updateMerchant.ok && updateInventory.ok) {
                    window.refreshCurrentTable();
                } else {
                    alert('Error al procesar la transacción.');
                    btnSell.disabled = false; btnSell.textContent = 'Vender';
                }
            } catch (err) {
                console.error(err);
                btnSell.disabled = false; btnSell.textContent = 'Vender';
            }
        });

        tdAction.appendChild(btnSell);
        row.appendChild(tdCityName); row.appendChild(tdResource); row.appendChild(tdQty); row.appendChild(tdPrice); row.appendChild(tdAction);
        dataBody.appendChild(row);                
    });
}

window.fetchCityOffer = fetchCityOffer;
window.fetchCityDemand = fetchCityDemand;
