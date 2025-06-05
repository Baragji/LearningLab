# Project Rules for MCPEnterprise Agent

## Enterprise Mission Context
1. **Primary Goal**: Transform local RAG/MCP server to enterprise-grade GCP solution
2. **Quality Standards**: Production-ready, secure, scalable, observable
3. **Scope**: RAG optimization, containerization, GCP deployment, CI/CD

## Context Flow (Enterprise Focus)
1. **Memory Search**: Start with `memory.search_nodes` using terms: "mcp", "rag", "enterprise", "deployment", "gcp"
2. **File Context**: Use `file-context-server.read_context` with: "mcp", "rag", "chromadb", "fastapi", "openai", "docker", "terraform"
3. **RAG Documentation**: Search for: "docker", "terraform", "gcp", "cloud-run", "kubernetes"
4. **Code Assistant**: Use for file operations and test execution

## Planning (Enterprise Architecture)
- Use `sequential-thinking.sequentialthinking` for ALL enterprise tasks
- Generate 5-7 concrete steps with enterprise considerations
- Include: security, scalability, monitoring, compliance
- Specify GCP services, Terraform modules, Docker configurations

## File I/O Policy (Enterprise Standards)
- **Read**: Use `code-assistant.read_files` for batch operations
- **New**: Use `code-assistant.write_file` for enterprise configs
- **Patch**: Use `code-assistant.replace_in_file` for targeted changes
- **Search**: Use `code-assistant.search_files` for pattern matching

## Execution and Tests (Enterprise Quality)
- **Commands**: Use `code-assistant.execute_command` for build/test/deploy
- **Testing**: Unit, integration, E2E, security, performance tests
- **Validation**: Use `puppeteer_screenshot` for UI components
- **Memory Logging**: Log architectural decisions and security choices

## Enterprise Commit Standards
- **Scope**: Enterprise modules (docker, terraform, gcp, security)
- **Format**: `<type>(<scope>): <description>` (feat(docker): add multi-stage build)
- **Types**: feat, fix, security, perf, refactor, test, docs, ci
- **Verification**: Security scans, tests, linting before commit

## Enterprise Test Gate
- **Unit Tests**: ≥90% coverage for core RAG/MCP logic
- **Integration Tests**: End-to-end MCP protocol testing
- **Security Tests**: SAST, dependency scanning, container scanning
- **Performance Tests**: Load testing, latency validation
- **Infrastructure Tests**: Terraform validation, GCP resource testing

## Memory Logging (Enterprise Focus)
- **Start**: Search "mcp", "enterprise", "architecture", "deployment"
- **During**: Log security decisions, performance optimizations, architectural choices
- **End**: Create entities: 'architecture', 'security', 'deployment', 'performance', 'compliance'

## Enterprise Repository Layout
```
/src/
  /mcp_server/           # Enhanced MCP server code
  /rag_engine/           # Optimized RAG engine
  /auth/                 # Authentication & authorization
  /monitoring/           # Metrics, logging, health checks
/infrastructure/
  /terraform/            # GCP infrastructure as code
  /docker/               # Container configurations
  /k8s/                  # Kubernetes manifests (if needed)
/.github/workflows/      # CI/CD pipelines
/tests/
  /unit/                 # Unit tests
  /integration/          # Integration tests
  /e2e/                  # End-to-end tests
  /security/             # Security tests
  /performance/          # Load and performance tests
/docs/
  /architecture/         # System architecture docs
  /deployment/           # Deployment guides
  /security/             # Security documentation
```

## Enterprise Component Standards
- **Python**: PEP8, type hints, async/await, dataclasses
- **Docker**: Multi-stage builds, non-root user, minimal attack surface
- **Terraform**: Modules, variables, outputs, state management
- **Security**: Input validation, secret management, least privilege
- **Monitoring**: Structured logging, metrics, distributed tracing

## Enterprise Error and Performance
- **Error Handling**: Circuit breakers, retries, graceful degradation
- **Performance**: <500ms RAG latency, 100+ concurrent requests
- **Scalability**: Auto-scaling, horizontal scaling, resource optimization
- **Observability**: Metrics, logs, traces, alerting
- **Security**: Authentication, authorization, encryption, audit logs

## GCP Enterprise Standards
- **Compute**: Cloud Run (managed) or GKE (advanced)
- **Storage**: Cloud Storage for persistence, Secret Manager for secrets
- **Networking**: VPC, private endpoints, Cloud NAT
- **Security**: IAM, service accounts, VPC isolation
- **Monitoring**: Cloud Monitoring, Cloud Logging, Error Reporting

## CI/CD Enterprise Pipeline
- **Build**: Multi-stage Docker builds, dependency caching
- **Test**: Parallel test execution, test reporting
- **Security**: SAST, DAST, dependency scanning, container scanning
- **Deploy**: Blue-green deployment, canary releases
- **Monitor**: Deployment verification, rollback automation
