Her er en detaljeret trin-for-trin plan (på dansk), som du kan sende til din AI Agent. Den guider skridt for skridt fra kodereview over containerisering til deployment og drift, så I når frem til en avanceret enterprise-niveau RAG+MCP-opsætning på GCP.

---

## Fase 1: Forberedelse og arkitektur­design

1. **Gennemgå eksisterende kodebase**

   * Læs og forstå `mcp_server_with_rag.py`, `rag_engine_openai.py` og `test_e2e.py`.
   * Bekræft, at alle “tool”-metoder i MCP-serveren (initialize, tools/list, tools/call) overholder JSON-RPC 2.0-spec’en.
   * Tjek, at RAG-engine-delen korrekt udfører: chunking, embeddings-generering, vektorsøgning (ChromaDB) og ChatCompletion-kald til OpenAI.
   * Notér steder, hvor der mangler fejlhåndtering, batching, caching eller autentificering.

2. **Definer krav og mål for enterprise-opsætning**

   * Udpeg hvilke datakilder, dokumenttyper og mængder I skal kunne håndtere (f.eks. PDF’er, kode-repositories, interne wikier).
   * Beslut hvilke serviceniveauer (SLA) I har brug for: svartid (f.eks. 200–500 ms for simple retrieval), oppetid (99,9%), gennemsnitlig gennemløbstid for RAG-spørgsmål, maximal belastning (f.eks. 500 samtidige forespørgsler).
   * Fastlæg sikkerhedskrav: GDPR-overholdelse, IAM-politikker, kryptering af både “in transit” og “at rest” data, network-isolation, audit-logs.
   * Kortlæg ønskede GCP-tjenester: Cloud Run eller GKE til selve serveren, Secret Manager til API-nøgler, Persistent Disk eller Cloud Storage til ChromaDB-data, Cloud Build/Terraform til CI/CD og infrastruktur-opsætning, samt Cloud Monitoring/Logging til observability.

3. **Opsæt en mappestruktur og versionskontrol**

   * Organisér repository med følgende overordnede mapper:

     ```
     project-root/
     ├── src/
     │   ├── mcp_server_with_rag.py
     │   ├── rag_engine_openai.py
     │   └── … evt. helper‐moduler
     ├── tests/
     │   └── test_e2e.py
     ├── infra/
     │   ├── terraform/
     │   └── cloudbuild/
     ├── docker/
     │   └── Dockerfile
     ├── .github/workflows/
     │   └── ci_cd.yaml
     ├── requirements.txt
     ├── env.example
     └── README.md
     ```
   * Opret en `.gitignore` der undlader at tjekke ind:

     * Faktiske API-nøgler (`.env`)
     * Lokale ChromaDB-mapper (f.eks. `data/chromadb/`)
     * Virtuelle miljøer (`venv/`, `__pycache__/` osv.).

---

## Fase 2: Forbedringer af RAG-engine og MCP-server

4. **Batching af embeddings­generering**

   * Opdater `rag_engine_openai.py` så det genererer embeddings i batches fremfor én og én chunk.

     ```python
     # Eksempel på batching:
     chunks = [ “tekst1”, “tekst2”, … ]
     resp = openai.Embedding.create(model=self.embedding_model, input=chunks)
     for idx, data in enumerate(resp["data"]):
         vector = data["embedding"]
         metadata = { "document_id": doc_id, "chunk_id": idx, "text": chunks[idx] }
         self.collection.add(ids=[f"{doc_id}_{idx}"], embeddings=[vector], metadatas=[metadata])
     ```
   * Sørg for, at `add_document(...)` kalder denne batch-funktion, når et dokument splittes i flere chunks.

5. **Implementer caching af query­embeddings og retrieve­resultater**

   * Tilføj en simpel LRU-cache (fx `functools.lru_cache`) eller en Redis-cache til at gemme seneste N queries’ embedding + retrieve-hits. 
   * I `retrieve_code(query, top_k)` kan I for eksempel:

     ```python
     @functools.lru_cache(maxsize=128)
     def _get_query_embedding(query: str):
         resp = openai.Embedding.create(model=self.embedding_model, input=[query])
         return resp["data"][0]["embedding"]

     def retrieve_code(query: str, top_k: int = 5):
         vector = _get_query_embedding(query)
         results = self.collection.query(query_embeddings=[vector], n_results=top_k)
         return results
     ```
   * Dokumentér, hvordan cachen indstilles (TTL, maxstørrelse). Hvis I bruger Redis, tilføj opsætning i `requirements.txt` (`redis`) og en simpel wrapper til opsætning af en global Redis-forbindelse i `rag_engine_openai.py`.

6. **Stram fejlhåndtering og autentificering af MCP**

   * I MCP-serveren (`mcp_server_with_rag.py`), tilføj et “tjek” i begyndelsen af hver request–håndtering:

     ```python
     async def verify_token(request: Request):
         auth_header = request.headers.get("Authorization", "")
         if not auth_header.startswith("Bearer "):
             raise HTTPException(status_code=401, detail="Missing Bearer token")
         token = auth_header.split("Bearer ")[1]
         if token != os.getenv("MCP_BEARER_TOKEN"):
             raise HTTPException(status_code=403, detail="Invalid token")
     ```
   * Anvend FastAPI’s `Depends(verify_token)` på `/mcp`-endpointet. 
   * Udvid hver `handle_tool_call(...)` med try/except-blokke, der indfanger:

     * `openai.OpenAIError` → Returner JSON-RPC error med `code = -32000` (server error) og detalje fra exception.
     * `chromadb.errors.ChromaError` → Returner `code = -32001` og beskrivelse.
     * `ValueError` eller `jsonschema.ValidationError` (hvis du validér input mod `inputSchema`) → `code = -32602` (Invalid params).

7. **Udvid `test_e2e.py` med negative tests og schema­validering**

   * Tilføj tests, der kalder `tools/call` med:

     1. Ugyldigt værktøjsnavn (forvent JSON-RPC error “Method not found”, kode -32601).
     2. Manglende argumenter (f.eks. `{"name":"add_document","arguments":{}}`) → JSON-RPC error -32602.
     3. Fejlagtigt datatype (fx `{"name":"retrieve_code","arguments":{"query":123}}`) → schema-valideringsfejl.
   * Implementer i `test_e2e.py` JSON-RPC-schema-validering med fx `jsonschema.validate()`, så I tjekker, at svar “result” matcher det deklarerede `outputSchema` for hvert tool.
   * Sørg for, at tests kører både synchront (sunde scenarier) og asynchront (kan fx kalde 10 retrieve-forespørgsler parallelt for at teste concurrency).

---

## Fase 3: Container­isering og lokalt setup

8. **Skriv en Dockerfile til MCP-serveren**

   * Opret filen `docker/Dockerfile` med indhold:

     ```dockerfile
     FROM python:3.10-slim

     # Systemafhængigheder (hvis fx ChromaDB kræver libabhv)
     RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

     WORKDIR /app

     # Kopiér requirements og installer
     COPY requirements.txt .
     RUN pip install --no-cache-dir -r requirements.txt

     # Kopiér resten af koden
     COPY . .

     # Eksponer port (matcher env.example / uvicorn default)
     EXPOSE 8080

     # Kommandolinje til at starte MCP-server
     CMD ["uvicorn", "src.mcp_server_with_rag:app", "--host", "0.0.0.0", "--port", "8080"]
     ```
   * I `requirements.txt` skal du sikre, at “fastapi”, “uvicorn\[standard]”, “chromadb”, “openai”, “langdetect”, “python-dotenv” osv. er korrekt listet.

9. **Lav en lokal docker-build og test**

   * Byg image lokalt:

     ```bash
     cd project-root
     docker build -f docker/Dockerfile -t rag-mcp-server:latest .
     ```
   * Start container og mount evt. en lokal `./data/chromadb` som volume:

     ```bash
     docker run -d -p 8080:8080 \
       -v $(pwd)/data/chromadb:/app/data/chromadb \
       --env-file env \
       --name rag_mcp rag-mcp-server:latest
     ```
   * Kør jeres `test_e2e.py` mod `http://localhost:8080` for at sikre, at alle tests pass’er i container-miljøet.
   * Hvis en test fejler, ret konfiguration (f.eks. sti til ChromaDB, miljøvariabler) indtil alt er grønt.

---

## Fase 4: Opsæt GCP infrastruktur med Terraform og Cloud Build

10. **Initialiser Terraform backend og state**

    * Under `infra/terraform/` opret følgende filer:

      * `main.tf`: definér provider, GCP-projekt, region, samt de ressourcer I har brug for. Eksempel:

        ```hcl
        terraform {
          required_version = ">= 1.1.0"
          backend "gcs" {
            bucket = "mit-terraform-state-bucket"
            prefix = "rag-mcp"
          }
        }

        provider "google" {
          project = var.gcp_project
          region  = var.gcp_region
        }

        # Opret Secret Manager til OpenAI nøgle
        resource "google_secret_manager_secret" "openai_api_key" {
          secret_id = "OPENAI_API_KEY"
          replication {
            automatic = true
          }
        }

        resource "google_secret_manager_secret_version" "openai_api_key_version" {
          secret      = google_secret_manager_secret.openai_api_key.id
          secret_data = var.openai_api_key  # indsættes som variabel
        }

        # Opret VPC-network (hvis nødvendigt)
        resource "google_compute_network" "vpc_network" {
          name                    = "rag-mcp-network"
          auto_create_subnetworks = false
        }
        resource "google_compute_subnetwork" "subnet" {
          name          = "rag-mcp-subnet"
          ip_cidr_range = "10.10.0.0/24"
          network       = google_compute_network.vpc_network.id
          region        = var.gcp_region
        }

        # Opret Persistent Disk til ChromaDB
        resource "google_compute_disk" "chromadb_disk" {
          name  = "chromadb-disk"
          type  = "pd-ssd"
          zone  = var.gcp_zone
          size  = 100  # tilpasset jeres behov
        }

        # Opret Cloud Run-service (hvis I vælger Cloud Run)
        resource "google_cloud_run_service" "rag_mcp_service" {
          name     = "rag-mcp-service"
          location = var.gcp_region

          template {
            spec {
              containers {
                image = "${var.gcr_hostname}/${var.gcp_project}/rag-mcp-server:latest"
                ports {
                  name = "http1"
                  container_port = 8080
                }
                env {
                  name  = "MCP_BEARER_TOKEN"
                  value_from {
                    secret_key_ref {
                      name = google_secret_manager_secret.openai_api_key.id
                      key  = "OPENAI_API_KEY" 
                    }
                  }
                }
                env {
                  name  = "OPENAI_EMBEDDING_MODEL"
                  value = var.openai_embedding_model
                }
                env {
                  name  = "OPENAI_LLM_MODEL"
                  value = var.openai_llm_model
                }
                env {
                  name  = "CHROMADB_PATH"
                  value = "/mnt/chromadb"
                }
              }
            }
          }

          traffics {
            percent         = 100
            latest_revision = true
          }
        }

        # Tillad offentlig adgang (for testing), lås ned senere
        resource "google_cloud_run_service_iam_member" "invoker" {
          service    = google_cloud_run_service.rag_mcp_service.name
          location   = google_cloud_run_service.rag_mcp_service.location
          role       = "roles/run.invoker"
          member     = "allUsers"
        }

        # GCR til container‐registry
        resource "google_artifact_registry_repository" "gcr" {
          provider         = google
          location         = var.gcp_region
          repository_id    = "rag-mcp-repo"
          description      = "Container repo for RAG+MCP"
          format           = "DOCKER"
        }
        ```
      * `variables.tf`: definér variabler:

        ```hcl
        variable "gcp_project" { type = string }
        variable "gcp_region"  { type = string, default = "europe-north1" }
        variable "gcp_zone"    { type = string, default = "europe-north1-a" }
        variable "openai_api_key" { type = string, sensitive = true }
        variable "openai_embedding_model" { type = string, default = "text-embedding-3-small" }
        variable "openai_llm_model" { type = string, default = "gpt-3.5-turbo" }
        variable "gcr_hostname" { type = string, default = "europe-north1-docker.pkg.dev" }
        ```
      * `outputs.tf` (valgfrit):

        ```hcl
        output "cloud_run_url" {
          value = google_cloud_run_service.rag_mcp_service.status[0].url
        }
        ```

    * Kør Terraform:

      ```bash
      cd infra/terraform
      terraform init
      terraform apply -var="gcp_project=mit-projekt-id" \
                      -var="openai_api_key=sk-xxxxx" \
                      -auto-approve
      ```

    * Når Terraform er færdig, noter URL’en (`cloud_run_url`), som I skal bruge i CI/CD.

11. **Cloud Build / GitHub Actions til CI/CD**

    * Opret `infra/cloudbuild/cloudbuild.yaml` (brug hvis I vil køre direkte via Cloud Build triggere), eksempel:

      ```yaml
      steps:
      - name: 'gcr.io/cloud-builders/docker'
        args: [ 'build', '-t', '$(params.GCR_HOSTNAME)/$(project_id)/rag-mcp-server:$SHORT_SHA', '.' ]
      - name: 'gcr.io/cloud-builders/docker'
        args: [ 'push', '$(params.GCR_HOSTNAME)/$(project_id)/rag-mcp-server:$SHORT_SHA' ]
      - name: 'gcr.io/cloud-builders/gcloud'
        args: [
          'run', 'deploy', 'rag-mcp-service',
          '--image', '$(params.GCR_HOSTNAME)/$(project_id)/rag-mcp-server:$SHORT_SHA',
          '--region', '$(params.GCP_REGION)',
          '--platform', 'managed',
          '--allow-unauthenticated',
          '--set-env-vars', 'CHROMADB_PATH=/mnt/chromadb',
          '--update-secrets', 'MCP_BEARER_TOKEN=projects/$(project_id)/secrets/OPENAI_API_KEY:latest'
        ]
      images:
      - '$(params.GCR_HOSTNAME)/$(project_id)/rag-mcp-server:$SHORT_SHA'
      ```
    * Alternativt: Opret `.github/workflows/ci_cd.yaml` med stænger:

      ```yaml
      name: CI/CD pipeline

      on:
        push:
          branches:
            - main

      jobs:
        build-and-deploy:
          runs-on: ubuntu-latest
          steps:
            - name: Checkout kode
              uses: actions/checkout@v3

            - name: Sæt op Python 3.10
              uses: actions/setup-python@v4
              with:
                python-version: "3.10"

            - name: Installér afhængigheder
              run: |
                python -m pip install --upgrade pip
                pip install -r requirements.txt

            - name: Kør enhedstests (pytest)
              run: |
                pytest --maxfail=1 --disable-warnings -q

            - name: Byg Docker image
              run: |
                docker build -f docker/Dockerfile -t ${{ secrets.GCR_HOSTNAME }}/${{ secrets.GCP_PROJECT }}/rag-mcp-server:${{ github.sha }} .

            - name: Log ind på GCP
              uses: google-github-actions/auth@v1
              with:
                credentials_json: ${{ secrets.GCP_SA_KEY_JSON }}
                token_format: "access_token"

            - name: Push til Artifact Registry
              run: |
                docker push ${{ secrets.GCR_HOSTNAME }}/${{ secrets.GCP_PROJECT }}/rag-mcp-server:${{ github.sha }}

            - name: Deploy til Cloud Run
              run: |
                gcloud run deploy rag-mcp-service \
                  --image ${{ secrets.GCR_HOSTNAME }}/${{ secrets.GCP_PROJECT }}/rag-mcp-server:${{ github.sha }} \
                  --region ${{ secrets.GCP_REGION }} \
                  --platform managed \
                  --allow-unauthenticated \
                  --set-env-vars CHROMADB_PATH=/mnt/chromadb \
                  --update-secrets MCP_BEARER_TOKEN=projects/${{ secrets.GCP_PROJECT }}/secrets/OPENAI_API_KEY:latest
      ```
    * Tilføj nødvendige GitHub-secrets:

      * `GCP_SA_KEY_JSON` (service-account JSON til at deploye)
      * `GCP_PROJECT`, `GCP_REGION`, `GCR_HOSTNAME`, evt. `OPENAI_EMBEDDING_MODEL`, `OPENAI_LLM_MODEL`.

12. **GCP: Opret Persistent Disk og mount i Cloud Run**

    * Cloud Run (fully managed) tillader ikke direkte at montere PD. I har to valg:

      1. **Skift ChromaDB til Cloud Storage**: ændr RAG-engine til at bruge en GCS-bucket i stedet for lokal disk. Når I opretter ChromaDB-klienten, sæt:

         ```python
         client = chromadb.Client(
           chroma_api_impl="rest",
           chroma_server_host="chromadb-service", # hvis I deployer selv
           chroma_server_http_port="8000",
           persist_directory="gs://mit-bucket/rag-index"
         )
         ```
      2. **Brug Cloud Run for Anthos eller GKE**: deploy på GKE med en PVC, der er bundet til PD.
    * Hvis I vælger Cloud Storage-løsningen: implementér en workflow, der på startup loader eksisterende index (fra GCS) eller initialiserer en tom lokal cache og pusher embedder tilbage til GCS ved ændringer. F.eks. i `rag_engine_openai.py`:

      ```python
      import os
      from google.cloud import storage

      def load_chromadb_from_gcs(bucket_name, prefix):
          client = storage.Client()
          bucket = client.bucket(bucket_name)
          blobs = bucket.list_blobs(prefix=prefix)
          for blob in blobs:
              local_path = os.path.join("/tmp/chromadb", os.path.relpath(blob.name, prefix))
              os.makedirs(os.path.dirname(local_path), exist_ok=True)
              blob.download_to_filename(local_path)
          return "/tmp/chromadb"

      def persist_chromadb_to_gcs(local_dir, bucket_name, prefix):
          client = storage.Client()
          bucket = client.bucket(bucket_name)
          for root, dirs, files in os.walk(local_dir):
              for file in files:
                  local_path = os.path.join(root, file)
                  blob_path = os.path.join(prefix, os.path.relpath(local_path, local_dir))
                  blob = bucket.blob(blob_path)
                  blob.upload_from_filename(local_path)
      ```

      * Kald `load_chromadb_from_gcs(...)` i `__init__` for RAG-engine før `chromadb.Client(...)`.
      * Kald `persist_chromadb_to_gcs(...)` efter `add_document(...)` og eventuelt på shutdown.

---

## Fase 5: Sikring, overvågning og drift

13. **IAM og adgangskontrol**

    * Opret en dedikeret service-account til Cloud Run med begrænsede rettigheder:

      * Tillad kun adgang til Secret Manager (læse “OPENAI\_API\_KEY”).
      * Hvis I bruger GCS, giv kun læse/skriv-rettigheder til den specifikke bucket.
      * Ingen brede “Editor”-roller; giv kun “roles/secretmanager.secretAccessor” og “roles/storage.objectViewer”/“roles/storage.objectAdmin” efter behov.
    * Opret en VPC-connector, hvis I ønsker at begrænse udgående netværk (så Cloud Run forbinder til en privat subnet).
    * Lås Cloud Run-servicen ved kun at tillade bestemte IAM-principaler at “invoke” den (fjern `allUsers`-invoker i Terraform, og erstat med “Service Account” eller “Compute Engine default” afhængigt af behovet).

14. **Opsætning af logging og overvågning**

    * **Cloud Logging**:

      * Konfigurer jeres FastAPI-app til at sende logs til stdout/stderr (standard for Cloud Run). Cloud Run videresender automatisk til Cloud Logging.
      * Log ret detaljeret i “mcp\_server\_with\_rag.py” (f.eks. `logger.info(f"Verifying token for {request.client.host}")`, `logger.error(f"Error in tool call {tool_name}: {e}")`).
    * **Cloud Monitoring / Metrics**:

      * Brug `prometheus-client` til at eksponere metrics på en endpoint (fx `/metrics`).
      * Deploy en sidecar eller et HTTP check (hvis I kører i GKE) til at scrape `/metrics`.
      * I Cloud Run kan I alternativt vælge at bruge “Cloud Run Metrics” (antallet af request, latenstid, fejlrater).
    * **Alarmer**:

      * Opret uptime-checks (HTTP check mod `/health`) i Cloud Monitoring.
      * Konfigurer alerts (f.eks. “> 5 % 5xx-fejlrate” eller “> 2 sekunders gennemsnitlig latenstid” over 5 minutter) med notifikationer til Slack eller e-mail.

15. **Backup og gendannelse af RAG-index**

    * Hvis ChromaDB-indekset ligger i GCS, skal I sætte daglige snapshots:

      * Opret en Cloud Scheduler job, som kører et skript (f.eks. Cloud Function) hver nat, der kopierer `gs://bucket/rag-index/` til `gs://bucket/rag-index-backup/<dato>/`.
    * Hvis I gemmer på PD via GKE, brug “snapshot schedules” i Compute Engine til at tage snapshots af disken dagligt.
    * Test règlelt, at en gendannelse fra backup virker (f.eks. ved at slette lokal Chromadb-mappe og genindlæse fra backup).

16. **Sikkerhedsscans og penetrationstest**

    * Kør “static code analysis” (f.eks. `bandit`, `flake8`) mod Python-kode for at fange mulige sikkerhedssårbarheder (hos os handler det mest om at undgå, at ukontrolleret input kan medføre kodeinjektion i prompts etc.).
    * Kør dependency-scanning (f.eks. GitHub Dependabot eller `pip-audit`) for at finde kendte sårbare pakker i `requirements.txt`.
    * Scheduled penetrationstest mod Cloud Run endpointet, så I bekræfter, at der ikke er servere, som lækker følsomme oplysninger (header-lækkage, verbose fejlbeskeder).

---

## Fase 6: Roll-out, træning og overdragelse

17. **Gradvis roll-out og kanarisering**

    * Udrul den nye version som en “kanary” i Cloud Run (lav en ny revision, send fx 10 % trafik til den nye revision), mens 90 % stadig går til gammel revision. Monitor performance og fejlrate.
    * Hvis alt ser tilfredsstillende ud (ingen spike i 5xx eller latenstid), gradvist øg til 100 % trafik.

18. **Dokumentation og bruger­manual**

    * Udarbejd en intern dokumentation (kan være i `README.md` eller Confluence):

      * Overordnet arkitekturdiagram: vise RAG-engine, MCP-server, GCS/PD, Cloud Run, Secret Manager, CI/CD.
      * “Hvordan tilføjer man nye dokumenter til RAG-indekset?” (beskrivelse af `add_document`-tool).
      * “Hvordan udvider vi med nye MCP-værktøjer?” (trin for trin: skriv metode i RAG-engine, deklarér schemas i MCP-server, tilføj test i `test_e2e.py`, kør CI).
      * “FAQ” om almindelige fejl (forkerte JSON-RPC-requests, manglende environment‐variables).

19. **Træning af udviklere og driftsteam**

    * Lav en intern workshop, der gennemgår:

      * Hvordan RAG-engine splitter, embedder og henter vektorer.
      * Hvordan MCP-server eksponerer værktøjer og håndterer JSON-RPC.
      * Deployment-flow i Terraform + Cloud Build + Cloud Run.
      * Overvågning i Cloud Monitoring og alarmering.
      * Hvordan man roterer `OPENAI_API_KEY` i Secret Manager og opdaterer Cloud Run.

20. **Plan for vedligeholdelse og videreudvikling**

    * Definer en roadmap for løbende forbedringer:

      1. **Performance-optimering**: benchmark detaljeret (gennem gang af 1000 samtidige RAG-spørgsmål). Justér ChromaDB’s shard-opsætning eller switch til en hosted vector service (f.eks. Pinecone).
      2. **Modelopgraderinger**: test løbende nye OpenAI-modeller (f.eks. GPT-4, embeddings version 4 osv.). Valider via A/B-test på dokument retrieval quality.
      3. **Multi-tenant-arkitektur**: hvis I skal supportere flere interne forretningsenheder, udvid MCP til at håndtere “workspace”-parametre og isolere ChromaDB-indexes per workspace.
      4. **Multimodal retrieval**: tilføj værktøjer til at hente billeder, lyd eller video (udbyg MCP-server så den kan køre Image-embedding og Video-metadata).
    * Opret månedlige retrospectives, hvor I evaluerer metrikker fra Cloud Monitoring (f.eks. 99. percentil latenstid) samt brugertilfredshed (f.eks. interne surveys).

---

### Afrunding

Når din AI Agent følger ovenstående trin, vil I ende med:

* En **containeriseret** RAG+MCP-applikation, som er **fuldt testet** via `pytest` og E2E-tests.
* En **automatiseret CI/CD-pipeline** (Terraform + Cloud Build/GitHub Actions), der deployer til **Cloud Run** (eller GKE) med en **persistent vector-store** (GCS/PD).
* En **sikker** arkitektur, der bruger **Secret Manager** til API-nøgler, **IAM-kontroller** til Cloud Run og **VPC-isolation** efter behov.
* **Observability** på log- og metriksiden (Cloud Logging + Cloud Monitoring), så I kan sætte alarmer og reagere proaktivt.
* Dokumentation, træning og roadmap, så I kan håndtere både daglig drift og løbende udvidelser i en enterprise kontekst.

Send denne plan direkte til din AI Agent, så kan den eksekvere hvert punkt, validere deltrinene og melde tilbage, når en fase er afsluttet. Held og lykke med jeres opsætning!
