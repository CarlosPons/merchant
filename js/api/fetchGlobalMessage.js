// Módulo para consultar los mensajes globales y mostrar el nombre del emisor junto a su ubicación
async function fetchGlobalMessagesTable(tableHead, dataBody) {
    const headers = { 
        'apikey': SUPABASE_KEY, 
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation' // Fuerza a Supabase a tratar el JSON estrictamente como inserción de datos
    };
    
    // Filtramos los mensajes que van a globales (destinationMerchant IS NULL y isValid IS TRUE)
    const urlMessages = `${BASE_REST_URL}/Message?destinationMerchant=is.null&isValid=eq.true&order=creationDate.desc`;
    // Traemos id, name y la ciudad actual del Merchant
    const urlMerchants = `${BASE_REST_URL}/Merchant?select=id,name,currentCity`;
    // Traemos los nombres de las ciudades para mapearlos
    const urlCities = `${BASE_REST_URL}/City?select=id,name`;

    let messageContainer = document.getElementById('specific-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'specific-container';
        messageContainer.style.marginBottom = '20px';
        messageContainer.style.padding = '15px';
        messageContainer.style.backgroundColor = '#1a1a1a';
        messageContainer.style.borderRadius = '6px';
        messageContainer.style.border = '1px solid #333';
        
        const tableElement = tableHead.closest('table');
        if (tableElement) {
            tableElement.parentNode.insertBefore(messageContainer, tableElement);
        }
    }
    
    // Solo inyectamos el HTML del formulario si el contenedor existe y no está ya dibujado
    if (messageContainer) {
        messageContainer.innerHTML = `
            <div style="margin-bottom: 10px; font-size: 13px; color: #b3a285; display: flex; align-items: center; gap: 8px;">
                <span>📢</span>
                <em><strong>Tablón de Anuncios:</strong> Envía un mensaje público a todos los rincones del mundo conocido.</em>
            </div>
            <div style="display: flex; gap: 10px; align-items: center; width: 100%; max-width: 700px; margin-bottom: 20px;">
                <input type="text" id="global-message-text" placeholder="Escribe un anuncio para el tablón global..." maxlength="150" 
                    style="flex-grow: 1; padding: 10px 12px; background: #2a2a2a; color: #fff; border: 1px solid #444; border-radius: 4px; font-family: inherit; font-size: 13px;">
                <button id="btn-send-global-message" 
                    style="padding: 10px 18px; background: #dbb98a; color: #111; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 13px; transition: background 0.2s;">
                    Publicar
                </button>
            </div>
        `;

        const btnSend = document.getElementById('btn-send-global-message');
        const inputMessage = document.getElementById('global-message-text');

        // Efectos visuales del botón
        btnSend.addEventListener('mouseenter', () => btnSend.style.backgroundColor = '#cfa673');
        btnSend.addEventListener('mouseleave', () => btnSend.style.backgroundColor = '#dbb98a');

        // Evento de envío del mensaje
        btnSend.addEventListener('click', async () => {
            const textValue = inputMessage.value.trim();
            if (!textValue) return;

            btnSend.disabled = true;

            try {
                const response = await fetch(`${BASE_REST_URL}/Message`, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({
                        text: textValue, // Tu columna de tipo text
                        originMerchant: MERCHANT_ID, 
                        destinationMerchant: null,    
                        isValid: true
                    })
                });

                if (!response.ok) throw new Error('Error al insertar el mensaje');

                // Limpiamos el cuadro de texto tras el éxito
                inputMessage.value = ''; 
                
                // Refrescamos la vista llamando a la propia función principal con sus argumentos activos
                fetchGlobalMessagesTable(tableHead, dataBody);

            } catch (error) {
                console.error('Error al enviar el mensaje:', error);
            } finally {
                btnSend.disabled = false;
            }
        });
    }

    try {
        // Consultamos las tres tablas en paralelo para mantener el máximo rendimiento
        const [resMessages, resMerchants, resCities] = await Promise.all([
            fetch(urlMessages, { headers }).then(r => r.json()),
            fetch(urlMerchants, { headers }).then(r => r.json()),
            fetch(urlCities, { headers }).then(r => r.json())
        ]);

        tableHead.innerHTML = `
            <tr>
                <th style="width: 15%;">Fecha / Hora</th>
                <th style="width: 20%;">Emisor (Ubicación)</th>
                <th style="width: 65%;">Mensajes (más recientes primero)</th>
            </tr>
        `;

        if (resMessages.length === 0) {
            dataBody.innerHTML = `<tr><td colspan="3" class="no-data">No hay mensajes disponibles en este momento.</td></tr>`;
            return;
        }

        // Limpiamos el contenedor antes de añadir las nuevas filas
        dataBody.innerHTML = '';

        // 1. Creamos el mapa de ciudades: id -> nombre de la ciudad
        const cityMap = {};
        resCities.forEach(c => { cityMap[c.id] = c.name; });

        // 2. Creamos el mapa de comerciantes guardando un objeto con su nombre y el ID de su ciudad
        const merchantMap = {};
        resMerchants.forEach(m => { 
            merchantMap[m.id] = {
                name: m.name,
                cityId: m.currentCity
            };
        });

        resMessages.forEach(msg => {
            // Formateamos la fecha del timestampz
            const dateFormatted = new Date(msg.creationDate).toLocaleString();
            
            // Construimos la identificación del emisor: "Nombre(Ciudad)"
            let senderDisplay = `Jugador #${msg.originMerchant}`;
            
            const merchantData = merchantMap[msg.originMerchant];
            if (merchantData) {
                const cityName = cityMap[merchantData.cityId] || `Puerto #${merchantData.cityId}`;
                senderDisplay = `${merchantData.name} (${cityName})`;
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="message-date">${dateFormatted}</span></td>
                <td><span class="merchant-tag">${senderDisplay}</span></td>
                <td>${msg.text}</td>
            `;
            dataBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error al obtener los mensajes, comerciantes o ciudades:", error);
        dataBody.innerHTML = `<tr><td colspan="3" class="no-data">Error al cargar el tablón de mensajes.</td></tr>`;
    }
}

window.fetchGlobalMessagesTable = fetchGlobalMessagesTable;