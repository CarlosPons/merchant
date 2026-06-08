import sys
import argparse
from supabase import create_client, Client

# Global configuration constants for the Supabase project
# (Using the credentials provided in your client-side architecture)
SUPABASE_URL = "https://ykwzucdbjywtzbunpxqi.supabase.co"
SUPABASE_KEY = "sb_publishable_kX7Z5YPErZX_fJCllney9A_qeYYU6ur"

def main():
    # Setup command line argument parser to receive the Merchant ID
    parser = argparse.ArgumentParser(description="Inicializa el inventario de un mercader con cantidad cero para todos los recursos.")
    parser.add_argument("merchant_id", type=int, help="ID numérico del Merchant a inicializar")
    args = parser.parse_args()

    merchant_id = args.merchant_id
    print(f"[*] Iniciando proceso de inicialización para el Merchant ID: {merchant_id}")

    # Initialize Supabase client
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"[!] Error al conectar con Supabase: {e}")
        sys.exit(1)

    # 1. Fetch all available items from the 'Resource' table
    print("[*] Recuperando el catálogo de recursos...")
    res_resources = supabase.table("Resource").select("id").execute()
    all_resource_ids = [item["id"] for item in res_resources.data]
    
    if not all_resource_ids:
        print("[!] No se encontraron recursos en la tabla 'Resource'.")
        sys.exit(1)
    print(f"[+] Se han encontrado {len(all_resource_ids)} recursos globales disponibles.")

    # 2. Fetch already existing inventory slots for this specific merchant
    # This acts as a safety guard to prevent breaking unique constraints or duplicating data
    print(f"[*] Comprobando registros actuales en 'MerchantInventory' para el mercader {merchant_id}...")
    res_existing = supabase.table("MerchantInventory") \
        .select("resource_id") \
        .eq("merchant_id", merchant_id) \
        .execute()
    
    existing_resource_ids = {item["resource_id"] for item in res_existing.data}
    print(f"[+] El mercader ya cuenta con asignación para {len(existing_resource_ids)} recursos.")

    # 3. Filter and discover which resources are missing from the merchant's ship hold
    missing_resource_ids = [r_id for r_id in all_resource_ids if r_id not in existing_resource_ids]

    if not missing_resource_ids:
        print(f"[+] ¡Operación omitida! El Merchant {merchant_id} ya tiene asignados todos los recursos existentes.")
        return

    # 4. Build payload batch entries with quantity initialized to zero
    payload = [
        {
            "merchant_id": merchant_id,
            "resource_id": resource_id,
            "quantity": 0
        }
        for resource_id in missing_resource_ids
    ]

    # 5. Bulk insert new transaction records via Supabase REST API
    print(f"[*] Insertando {len(payload)} nuevos asientos con cantidad 0 en la base de datos...")
    try:
        response = supabase.table("MerchantInventory").insert(payload).execute()
        if response.data:
            print(f"[+] Éxito: Se ha inicializado la bodega para el Merchant {merchant_id}.")
        else:
            print("[!] La inserción terminó sin devolver datos de confirmación.")
    except Exception as e:
        print(f"[!] Error crítico durante la inserción en 'MerchantInventory': {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
