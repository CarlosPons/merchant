from supabase import create_client, Client

# Comments in the code should always be in English.
# Output displayed on the screen for the end-user should always be in French.

SUPABASE_URL = "https://ykwzucdbjywtzbunpxqi.supabase.co"
SUPABASE_KEY = "sb_secret_1SfuRetjKfTAZDhRzeraMw_BBIk8scl"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def procesar_turno_sdk(id_ciudad):
    # 1. Fetch what the city produces
    prod_res = supabase.table("CityProducer").select("idResource, quantity").eq("idCity", id_ciudad).execute()
    produccion = prod_res.data
    
    # Fetch what the city consumes
    cons_res = supabase.table("CityConsumer").select("idResource, quantity").eq("idCity", id_ciudad).execute()
    consumo = cons_res.data
    
    # 2. Fetch the current inventory of the city to merge it
    inv_res = supabase.table("CityInventory").select("idResource, quantity").eq("idCity", id_ciudad).execute()
    inventario_actual = {item['idResource']: item['quantity'] for item in inv_res.data}
    
    # Dictionary to keep track of changes for all affected resources in this turn
    net_changes = {}
    
    # Add production quantities
    for prod in produccion:
        id_res = prod['idResource']
        net_changes[id_res] = net_changes.get(id_res, 0) + prod['quantity']
        
    # Subtract consumption quantities
    for cons in consumo:
        id_res = cons['idResource']
        net_changes[id_res] = net_changes.get(id_res, 0) - cons['quantity']
    
    # 3. Calculate new totals (allowing negative values)
    datos_actualizados = []
    for id_res, cambio in net_changes.items():
        cant_actual = inventario_actual.get(id_res, 0)
        
        # We directly apply the change, allowing it to drop below 0
        nuevo_total = cant_actual + cambio
            
        datos_actualizados.append({
            "idCity": id_ciudad,
            "idResource": id_res,
            "quantity": nuevo_total
        })
    
    # 4. Bulk Upsert back to Supabase
    if datos_actualizados:
        supabase.table("CityInventory").upsert(datos_actualizados).execute()
        print(f"Actualizada la ciudad {id_ciudad}.")

# Execute
procesar_turno_sdk(2)