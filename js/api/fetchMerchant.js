// Módulo para consultar la ficha del Mercader, sus pertenencias y enviar mensajes globales
async function fetchMerchantWithInventory(tableHead, dataBody) {
    const headers = { 
        'apikey': SUPABASE_KEY, 
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    };
    
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

    // --- INTERFAZ DE ENVÍO DE MENSAJES GLOBALES (CUADRO SUPERIOR) ---
    // Usamos el contenedor fijo del HTML o lo manejamos de forma limpia como en rutas
    let messageContainer = document.getElementById('specific-container'); 
    if (messageContainer) {
        messageContainer.innerHTML = `
            <div style="margin-bottom: 10px; font-size: 13px; color: #b3a285; display: flex; align-items: center; gap: 8px;">
                <span>📢</span>
                <em><strong>Tablón del Mundo:</strong> Redacta un mensaje público. Llegará a los puertos de todos los mercaderes del juego de manera inmediata.</em>
            </div>
            <div style="display: flex; gap: 10px; align-items: center; width: 100%; max-width: 700px;">
                <input type="text" id="global-message-text" placeholder="Escribe un anuncio o mensaje global..." max-length="150" 
                    style="flex-grow: 1; padding: 10px 12px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 4px; font-family: inherit; font-size: 13px;">
                <button id="btn-send-global-message" 
                    style="padding: 10px 18px; background: #dbb98a; color: #111; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 13px; transition: background 0.2s;">
                    Enviar Mensaje
                </button>
            </div>
            <div id="message-status-feedback" style="font-size: 12px; font-weight: bold; margin-top: 8px; min-height: 16px;"></div>
        `;

        const btnSend = document.getElementById('btn-send-global-message');
        const inputMessage = document.getElementById('global-message-text');
        const statusFeedback = document.getElementById('message-status-feedback');

        // Efecto hover simple para el botón
        btnSend.addEventListener('mouseenter', () => btnSend.style.backgroundColor = '#cfa673');
        btnSend.addEventListener('mouseleave', () => btnSend.style.backgroundColor = '#dbb98a');

        // Evento de envío a Supabase (POST)
        btnSend.addEventListener('click', async () => {
            const textValue = inputMessage.value.trim();

            if (!textValue) {
                statusFeedback.style.color = '#ff4d4d';
                statusFeedback.textContent = 'No puedes enviar un mensaje vacío.';
                return;
            }

            btnSend.disabled = true;
            statusFeedback.style.color = '#e6c229';
            statusFeedback.textContent = 'Enviando mensaje...';

            try {
                const response = await fetch(`${BASE_REST_URL}/Message`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        text: textValue,
                        originMerchant: merchant.id,
                        destinationMerchant: null, // NULL significa que el mensaje es global
                        isValid: true             // Vuestro filtro de control de mensajes válidos
                    })
                });

                if (!response.ok) throw new Error('Error al insertar el mensaje');

                statusFeedback.style.color = '#5cff97';
                statusFeedback.textContent = '✅ ¡Mensaje publicado con éxito en el tablón global!';
                inputMessage.value = ''; // Limpiamos el cuadro de texto

            } catch (error) {
                console.error('Error al enviar el mensaje:', error);
                statusFeedback.style.color = '#ff4d4d';
                statusFeedback.textContent = '❌ Error de red al publicar el mensaje.';
            } finally {
                btnSend.disabled = false;
            }
        });
    }

    // --- LÓGICA EXISTENTE DEL INVENTARIO Y MERCADER ---
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
    tableHead.innerHTML = `<tr><th>Nombre Mercader</th><th>Ciudad Actual</th><th>Oro en el Cofre</th><th>Seguridad</th></tr>`;

    const merchantStock = resInventory.filter(inv => inv.merchant_id === merchant.id);
    const cityName = cityMap[merchant.currentCity] || `Ciudad #${merchant.currentCity}`;
    
    // 2. Insertar fila única con las estadísticas del mercader
    dataBody.innerHTML = ''; // Nos aseguramos de resetear las filas
    const rowMerchant = document.createElement('tr');
    rowMerchant.innerHTML = `
        <td>${merchant.name}</td>
        <td>${cityName}</td>
        <td>${merchant.gold !== undefined ? `${merchant.gold} Monedas de Oro` : '0 Monedas'}</td>
        <td>${merchant.guards !== undefined ? `${merchant.guards} Escoltas` : '0 Escoltas'}</td>
    `;
    dataBody.appendChild(rowMerchant);

    // 3. Subcabecera para la sección de la bodega
    const rowSubHeader = document.createElement('tr');
    rowSubHeader.innerHTML = `<th colspan="4" style="background-color: #1c1c1f; color: #c4c4cc; padding: 10px 15px;">Mercancías en la bodega del navío</th>`;
    dataBody.appendChild(rowSubHeader);

    const rowInventory = document.createElement('tr');
    const tdInvContainer = document.createElement('td');
    tdInvContainer.setAttribute('colspan', '4');

    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    gridContainer.style.gap = '8px';
    gridContainer.style.padding = '10px 0';

    if (merchantStock.length === 0) {
        tdInvContainer.innerHTML = '<span class="no-data">Inventario no inicializado.</span>';
    } else {
        merchantStock.sort((a, b) => {
            const groupA = resourceMap[a.resource_id]?.group || 0;
            const groupB = resourceMap[b.resource_id]?.group || 0;
            if (groupA !== groupB) return groupA - groupB;
            return Number(a.resource_id || 0) - Number(b.resource_id || 0);
        });

        merchantStock.forEach(stock => {
            const resourceObj = resourceMap[stock.resource_id];
            const resourceName = resourceObj?.name || `Recurso #${stock.resource_id}`;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = `inventory-item ${stock.quantity > 0 ? 'has-stock' : ''}`;
            itemDiv.style.display = 'flex';
            itemDiv.style.justifyContent = 'space-between';
            itemDiv.style.alignItems = 'center';
            itemDiv.style.padding = '6px 12px';

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