direnv: loading ~/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/.envrc              
direnv: export +NEXT_PUBLIC_API_URL ~DATABASE_URL ~JWT_EXPIRES_IN ~JWT_SECRET ~PATH
rag_envYousef@MacBook-Pro-tilhrende-Yousef gcp-migration % chmod +x test-cloud-functionality-mac.sh

rag_envYousef@MacBook-Pro-tilhrende-Yousef gcp-migration % ./test-cloud-functionality-mac.sh


🧪 OMFATTENDE CLOUD RAG TEST (macOS)
====================================
🌐 Testing: https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app

📋 FASE 1: GRUNDLÆGGENDE CONNECTIVITY
----------------------------------------
🔍 Test: Basic Connectivity
❌ Basic Connectivity
   Exit code: 0
      Output: {"detail":"Not Found"}
rag_envYousef@MacBook-Pro-tilhrende-Yousef gcp-migration % # Test 1: Health check
curl https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app/health

# Test 2: MCP tools list
curl -X POST https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'

# Test 3: Analyze code
curl -X POST https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "analyze_code", "arguments": {"code": "print(\"hello\")", "language": "python"}}}'
{"status":"ok"}{"detail":"Not Found"}{"detail":"Not Found"}%                                    
rag_envYousef@MacBook-Pro-tilhrende-Yousef gcp-migration % curl https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app/health

{"status":"ok"}%                                                                                
rag_envYousef@MacBook-Pro-tilhrende-Yousef gcp-migration % curl -X POST https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
{"detail":"Not Found"}%                                                                         
rag_envYousef@MacBook-Pro-tilhrende-Yousef gcp-migration % curl -X POST https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "analyze_code", "arguments": {"code": "print(\"hello\")", "language": "python"}}}'



{"detail":"Not Found"}%                                                                         
rag_envYousef@MacBook-Pro-tilhrende-Yousef gcp-migration % chmod +x diagnose-deployment.sh

rag_envYousef@MacBook-Pro-tilhrende-Yousef gcp-migration % ./diagnose-deployment.sh

🚀 HURTIG RE-DEPLOYMENT
=======================
ℹ️ Verificerer filer...
✅ Nødvendige filer fundet
ℹ️ Tjekker MCP server konfiguration...
✅ MCP endpoint fundet i kode
ℹ️ Bygger ny Docker image...
[+] Building 8.6s (13/13) FINISHED                                         docker:desktop-linux
 => [internal] load build definition from Dockerfile.minimal                               0.0s
 => => transferring dockerfile: 701B                                                       0.0s
 => [internal] load metadata for docker.io/library/python:3.11-slim                        1.4s
 => [auth] library/python:pull token for registry-1.docker.io                              0.0s
 => [internal] load .dockerignore                                                          0.0s
 => => transferring context: 2B                                                            0.0s
 => [1/6] FROM docker.io/library/python:3.11-slim@sha256:dbf1de478a55d6763afaa39c2f3d7b54  0.0s
 => => resolve docker.io/library/python:3.11-slim@sha256:dbf1de478a55d6763afaa39c2f3d7b54  0.0s
 => [internal] load build context                                                          0.0s
 => => transferring context: 710B                                                          0.0s
 => CACHED [2/6] RUN apt-get update && apt-get install -y     curl     && rm -rf /var/lib  0.0s
 => CACHED [3/6] WORKDIR /app                                                              0.0s
 => CACHED [4/6] RUN pip install fastapi uvicorn                                           0.0s
 => CACHED [5/6] COPY src/ ./src/                                                          0.0s
 => CACHED [6/6] RUN echo 'from fastapi import FastAPI\napp = FastAPI()\n@app.get("/healt  0.0s
 => exporting to image                                                                     7.1s
 => => exporting layers                                                                    0.0s
 => => exporting manifest sha256:b93ec4f9c72bebe08fc72e300c8847effa4e00b254ff0a4d50fb6f23  0.0s
 => => exporting config sha256:dd28e77f57d35b9617b4173f03c014ce2b218e142a21b377139d8d23c4  0.0s
 => => exporting attestation manifest sha256:86c1acaf56473d70b876d1ad0bb9cc57a7eb0745a3da  0.0s
 => => exporting manifest list sha256:38c45fc6c5937bd1c0b88c3f1148513edc96ca554587d4af0b5  0.0s
 => => naming to gcr.io/code-assistant-rag/code-assistant-rag:v5-fixed                     0.0s
 => => pushing layers                                                                      4.8s
 => => pushing manifest for gcr.io/code-assistant-rag/code-assistant-rag:v5-fixed@sha256:  2.1s
 => [auth] code-assistant-rag/code-assistant-rag:pull,push code-assistant-rag/gcr.io/code  0.0s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/iy5w0062l9h9k2ngtywhmk0as
✅ Docker image bygget og pushed
ℹ️ Re-deployer til Google Cloud Run...
Deploying container to Cloud Run service [code-assistant-rag] in project [code-assistant-rag] region [europe-west1]
✓ Deploying... Done.                                                                           
  ✓ Creating Revision...                                                                       
  ✓ Routing traffic...                                                                         
  ✓ Setting IAM Policy...                                                                      
Done.                                                                                          
Service [code-assistant-rag] revision [code-assistant-rag-00008-8mg] has been deployed and is serving 100 percent of traffic.
Service URL: https://code-assistant-rag-1032418337364.europe-west1.run.app
✅ Re-deployment OK
ℹ️ Venter på service start...
ℹ️ Tester endpoints...
Service URL: https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app

🔍 Testing health endpoint:
{"status":"ok"}
🔍 Testing MCP endpoint:
{"detail":"Not Found"}
🎉 RE-DEPLOYMENT FÆRDIG!

📋 TEST URLS:
Health: https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app/health
MCP: https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app/mcp
Docs: https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app/docs

🧪 TEST KOMMANDOER:
curl 'https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app/health'
curl -X POST 'https://code-assistant-rag-e2dk6hr2ja-ew.a.run.app/mcp' -H 'Content-Type: application/json' -d '{"method": "tools/list"}'
rag_envYousef@MacBook-Pro-tilhrende-Yousef gcp-migration % 