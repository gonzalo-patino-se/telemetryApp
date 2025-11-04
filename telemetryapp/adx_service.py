import os
from azure.kusto.data import KustoConnectionStringBuilder, KustoClient
from dotenv import load_dotenv

load_dotenv()

cluster = os.getenv("ADX_CLUSTER_URI")
database = os.getenv("ADX_DATABASE")
client_id = os.getenv("ADX_CLIENT_ID")
client_secret = os.getenv("ADX_CLIENT_SECRET")
tenant_id = os.getenv("ADX_TENANT_ID")

# Build connection string
kcsb = KustoConnectionStringBuilder.with_aad_application_key_authentication(
    cluster, client_id, client_secret, tenant_id
)

client = KustoClient(kcsb)

def query_adx(kql_query):
    response = client.execute(database, kql_query)
    rows = []
    for row in response.primary_results[0]:
        rows.append(dict(row))
    return rows