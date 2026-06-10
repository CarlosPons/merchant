// Módulo exclusivo para gestionar las rutas y conexiones entre ciudades
async function fetchCityConnectionTable(tableHead, dataBody) {
    const headers = { 
        'apikey': SUPABASE_KEY, 
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
    };
    
    // Consultamos conexiones, ciudades y el estado del Merchant en paralelo
    const [citiesResponse, connectionsResponse, merchantResponse] = await Promise.all([
        fetch(`${BASE_REST_URL}/City?select=id,name`, { headers }),
        fetch(`${BASE_REST_URL}/CityConnection?select=*`, { headers }),
        fetch(`${BASE_REST_URL}/Merchant?id=eq.${MERCHANT_ID}`, { headers })
    ]);

    if (!connectionsResponse.ok) throw new Error(`Status: ${connectionsResponse.status}`);
    
    // 1. Mapeamos los nombres de las ciudades
    let resCities = [];
    if (citiesResponse.ok) {
        resCities = await citiesResponse.json();
    }
    const cityMap = {};
    resCities.forEach(c => { cityMap[c.id] = c.name; });
        
    // 2. Obtenemos los datos actuales del Merchant (ubicación y destino actual)
    let merchantCityId = null;
    let currentDestinationCity = null;
    if (merchantResponse.ok) {
        const merchantData = await merchantResponse.json();
        if (merchantData && merchantData.length > 0) {
            merchantCityId = merchantData[0].currentCity;
            currentDestinationCity = merchantData[0].destinationCity; // Guardamos el destino actual (puede ser id o null)
        }
    }

    const data = await connectionsResponse.json();
    
    // Al ser una sección de control, limpiamos el hilo de la tabla clásica
    tableHead.innerHTML = '';
    dataBody.innerHTML = '';

    let routeContainer = document.getElementById('specific-container');
    if (data.length === 0) {
        if (routeContainer) routeContainer.remove();
        dataBody.innerHTML = `<tr><td class="no-data">No se han encontrado rutas de navegación.</td></tr>`;
        return;
    }

    // --- GENERACIÓN DE LA INTERFAZ DE VIAJE ---
    if (!routeContainer) {
        routeContainer = document.createElement('div');
        routeContainer.id = 'specific-container';
        routeContainer.style.marginBottom = '20px';
        routeContainer.style.padding = '15px';
        routeContainer.style.backgroundColor = '#1a1a1a';
        routeContainer.style.borderRadius = '6px';
        routeContainer.style.border = '1px solid #333';
        
        const tableElement = tableHead.closest('table');
        if (tableElement) {
            tableElement.parentNode.insertBefore(routeContainer, tableElement);
        }
    }

    const merchantCityName = cityMap[merchantCityId] || `Puerto #${merchantCityId}`;

    routeContainer.innerHTML = `
        <div style="margin-bottom: 15px; font-size: 13px; color: #b3a285; display: flex; align-items: center; gap: 8px;">
            <span>⏳</span>
            <em><strong>Nota sobre el movimiento:</strong> El viaje marítimo seleccionado se hará efectivo una vez que se actualice el servidor (representando el paso del tiempo y el transcurso del turno).</em>
        </div>
        <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
            <div>
                <span style="font-size: 12px; color: #aaa; display: block; margin-bottom: 5px;">Barco fondeado en:</span>
                <div style="padding: 8px 12px; background: #222; color: #dbb98a; border: 1px solid #444; border-radius: 4px; font-weight: bold; display: inline-block; min-width: 160px;">
                    📍 ${merchantCityName}
                </div>
            </div>
            <div>
                <label for="select-destination" style="display:block; margin-bottom:5px; font-size:12px; color:#aaa;">Fijar ciudad destino:</label>
                <select id="select-destination" style="padding: 8px 12px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 4px; min-width: 200px; font-family: inherit;">
                    <option value="">-- No viajar este turno (Permanecer en puerto) --</option>
                </select>
            </div>
            <div id="route-status-feedback" style="font-size: 13px; font-weight: bold; margin-left: 10px;"></div>
        </div>
    `;

    const selectDestination = document.getElementById('select-destination');
    const statusFeedback = document.getElementById('route-status-feedback');

    // 3. Rellenamos el selector filtrando las conexiones válidas desde el puerto actual
    if (merchantCityId) {
        const validDestinations = data.filter(item => Number(item.city_a_id) === Number(merchantCityId));

        if (validDestinations.length > 0) {
            validDestinations.forEach(conn => {
                const option = document.createElement('option');
                option.value = conn.city_b_id;
                option.textContent = cityMap[conn.city_b_id] || `Ciudad #${conn.city_b_id}`;
                
                // Si en la base de datos ya hay un destino fijado que coincide, lo dejamos marcado
                if (currentDestinationCity !== null && Number(conn.city_b_id) === Number(currentDestinationCity)) {
                    option.selected = true;
                }
                
                selectDestination.appendChild(option);
            });
        } else {
            selectDestination.innerHTML = '<option value="">No hay rutas marítimas disponibles desde este puerto</option>';
            selectDestination.disabled = true;
        }
    } else {
        selectDestination.innerHTML = '<option value="">No se pudo localizar el Merchant</option>';
        selectDestination.disabled = true;
    }

    // --- ESCUCHA DE EVENTOS: ACTUALIZACIÓN INMEDIATA EN LA BASE DE DATOS ---
    selectDestination.addEventListener('change', async (e) => {
        const selectedValue = e.target.value;
        // Si vuelve a la primera opción (""), mandamos un NULL a la base de datos para anular viaje
        const destinationValue = selectedValue === "" ? null : Number(selectedValue);

        try {
            const updateResponse = await fetch(`${BASE_REST_URL}/Merchant?id=eq.${MERCHANT_ID}`, {
                method: 'PATCH',
                headers: headers,
                body: JSON.stringify({ destinationCity: destinationValue })
            });

            if (!updateResponse.ok) throw new Error('Error al actualizar el destino');
                
        } catch (error) {
            console.error('Error al guardar el destino:', error);
        }
    });

        // --- STANDARD FULL TABLE RENDER ---
    tableHead.innerHTML = '';
    dataBody.innerHTML = '';

    const columns = Object.keys(data[0]);
    const tr = document.createElement('tr');
    
    columns.forEach(col => { 
        const th = document.createElement('th');
        if (col === 'id') th.textContent = 'id';
        else if (col === 'city_a_id') th.textContent = 'Ciudad Origen';
        else if (col === 'city_b_id') th.textContent = 'Ciudad Destino';
        else th.textContent = col;
        tr.appendChild(th); 
    });
    tableHead.appendChild(tr);

    data.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));

    data.forEach(item => {
        const row = document.createElement('tr');

        // Highlight rows matching the current merchant location to make the interface cohesive
        if (Number(item.city_a_id) === Number(merchantCityId)) {
            row.style.backgroundColor = 'rgba(92, 255, 151, 0.05)';
        }

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