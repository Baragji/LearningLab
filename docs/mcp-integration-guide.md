# MCP Integration Guide for LearningLab Platform

Denne guide beskriver hvordan Model Context Protocol (MCP) servere er integreret i LearningLab platformen for at accelerere udvikling og forbedre funktionalitet gennem alle implementeringsfaser.

## Oversigt

MCP servere giver LearningLab platformen kraftfulde værktøjer til:
- Filhåndtering og materiale management
- Automatiseret testing og kodevalidering
- AI-drevet content analyse og quiz generering
- Deployment automation og monitoring
- Versionsstyring og samarbejde

## Arkitektur

```
LearningLab Platform
├── Trae AI Agent
│   ├── MCP Client
│   └── Tool Orchestration
├── MCP Servers
│   ├── Phase 1: Core (filesystem, git, testing)
│   ├── Phase 2: AI (jupyter, data-analysis)
│   ├── Phase 3: Analytics (grafana)
│   └── Phase 4: Deployment (kubernetes, portainer)
└── Security Layer
    ├── Authentication (OAuth, API Keys)
    ├── Authorization (Role-based)
    └── Rate Limiting
```

## Installation

### Quick Start

```bash
# Install all Phase 1 servers (recommended for development)
./scripts/setup-mcp.sh --phase 1 --env development

# Start MCP servers
yarn mcp:start

# Check status
yarn mcp:status
```

### Advanced Installation

```bash
# Install specific phase servers
./scripts/setup-mcp.sh --phase 2 --env testing

# Skip Docker-based servers (if Docker not available)
./scripts/setup-mcp.sh --skip-docker

# Production setup
./scripts/setup-mcp.sh --phase 4 --env production
```

## Configuration

### Environment Variables

1. Copy environment template:
```bash
cp .env.mcp .env.mcp.local
```

2. Fill in your API keys and configuration:
```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Monitoring
GRAFANA_API_KEY=glsa_...
PORTAINER_API_KEY=ptr_...
```

### Server Configuration

MCP servers are configured in `.trae/mcp-config.json`. Each server includes:

- **Command**: Executable command
- **Args**: Command arguments
- **Env**: Environment variables
- **Phase**: Implementation phase (1-4)
- **Priority**: Installation priority (high/medium/low)

## MCP Servers by Implementation Phase

### Phase 1: Grundlæggende Funktionalitet

#### Filesystem Server
**Purpose**: File upload system, materiale management
**Usage**: 
```typescript
// Upload PDF materials
const uploadResult = await mcpClient.call('filesystem', 'writeFile', {
  path: './uploads/materials/lesson1.pdf',
  content: pdfBuffer
});

// Read course materials
const materials = await mcpClient.call('filesystem', 'readDir', {
  path: './uploads/materials'
});
```

#### Git Server
**Purpose**: Version control, code review, change tracking
**Usage**:
```typescript
// Get repository status
const status = await mcpClient.call('git', 'status', {});

// Create feature branch
const branch = await mcpClient.call('git', 'createBranch', {
  name: 'feature/ai-quiz-generation'
});

// Get commit history
const history = await mcpClient.call('git', 'log', {
  limit: 10
});
```

#### Python Sandbox
**Purpose**: Sikker kodeudførelse, testing, validation
**Usage**:
```typescript
// Run Python tests
const testResult = await mcpClient.call('python-sandbox', 'execute', {
  code: `
import pytest
result = pytest.main(['-v', './tests/'])
print(f'Test result: {result}')
  `,
  timeout: 30
});
```

#### OpenAPI Server
**Purpose**: API testing, integration validation
**Usage**:
```typescript
// Test API endpoints
const apiTest = await mcpClient.call('openapi', 'testEndpoint', {
  method: 'POST',
  path: '/api/courses',
  data: { title: 'Test Course', description: 'Test' }
});
```

### Phase 2: AI Integration & Intelligence

#### Jupyter Server
**Purpose**: AI development, content analysis, model training
**Usage**:
```typescript
// Create AI analysis notebook
const notebook = await mcpClient.call('jupyter', 'createNotebook', {
  name: 'content-analysis',
  kernel: 'python3'
});

// Execute AI code
const analysis = await mcpClient.call('jupyter', 'executeCell', {
  notebookId: notebook.id,
  code: `
import openai
from sklearn.feature_extraction.text import TfidfVectorizer

# Analyze course content for quiz generation
content = load_course_content()
questions = generate_quiz_questions(content)
print(f'Generated {len(questions)} questions')
  `
});
```

#### Data Analysis Server
**Purpose**: Multi-source data processing, learning analytics
**Usage**:
```typescript
// Analyze student performance data
const analytics = await mcpClient.call('data-analysis', 'query', {
  source: 'postgresql://localhost/learninglab',
  query: `
    SELECT 
      course_id,
      AVG(quiz_score) as avg_score,
      COUNT(*) as attempts
    FROM quiz_attempts 
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY course_id
  `
});

// Process CSV data
const csvAnalysis = await mcpClient.call('data-analysis', 'processCsv', {
  path: './data/student-engagement.csv',
  operations: ['describe', 'correlations']
});
```

### Phase 3: Avancerede Features & Gamification

#### Grafana Server
**Purpose**: Learning analytics, performance monitoring
**Usage**:
```typescript
// Create learning analytics dashboard
const dashboard = await mcpClient.call('grafana', 'createDashboard', {
  title: 'Student Engagement Analytics',
  panels: [
    {
      title: 'Quiz Completion Rate',
      type: 'stat',
      targets: [{
        expr: 'quiz_completions_total / quiz_attempts_total * 100'
      }]
    },
    {
      title: 'Learning Progress',
      type: 'graph',
      targets: [{
        expr: 'avg(student_progress_percent) by (course)'
      }]
    }
  ]
});

// Query metrics
const metrics = await mcpClient.call('grafana', 'queryMetrics', {
  query: 'student_engagement_score',
  timeRange: '7d'
});
```

### Phase 4: Template System & Deployment

#### Kubernetes Server
**Purpose**: Production deployment, scaling, management
**Usage**:
```typescript
// Deploy LearningLab to production
const deployment = await mcpClient.call('kubernetes', 'apply', {
  manifest: {
    apiVersion: 'apps/v1',
    kind: 'Deployment',
    metadata: {
      name: 'learninglab-api',
      namespace: 'learninglab'
    },
    spec: {
      replicas: 3,
      selector: {
        matchLabels: { app: 'learninglab-api' }
      },
      template: {
        metadata: {
          labels: { app: 'learninglab-api' }
        },
        spec: {
          containers: [{
            name: 'api',
            image: 'learninglab/api:latest',
            ports: [{ containerPort: 3000 }]
          }]
        }
      }
    }
  }
});

// Scale deployment
const scaling = await mcpClient.call('kubernetes', 'scale', {
  deployment: 'learninglab-api',
  replicas: 5
});
```

#### Portainer Server
**Purpose**: Container management, CI/CD integration
**Usage**:
```typescript
// Manage Docker containers
const containers = await mcpClient.call('portainer', 'listContainers', {
  filters: { label: ['app=learninglab'] }
});

// Deploy stack
const stack = await mcpClient.call('portainer', 'deployStack', {
  name: 'learninglab-production',
  composeFile: './docker-compose.prod.yml',
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL
  }
});
```

## Security

### Authentication

MCP servere understøtter flere autentifikationsmetoder:

1. **OAuth 2.0** (Google, GitHub)
2. **API Keys** med automatisk rotation
3. **JWT Tokens** for session management

### Authorization

Rollebaseret adgangskontrol:

```json
{
  "roles": {
    "developer": {
      "permissions": ["filesystem:read", "git:read", "python-sandbox:execute"]
    },
    "admin": {
      "permissions": ["*"]
    },
    "ai-engineer": {
      "permissions": ["jupyter:*", "data-analysis:*", "filesystem:read"]
    }
  }
}
```

### Rate Limiting

- **100 requests/minute** per bruger
- **20 burst requests** tilladt
- Automatisk throttling ved overskridelse

## Monitoring & Logging

### Health Checks

```bash
# Check MCP server status
yarn mcp:status

# View logs
yarn mcp:logs

# Check specific server
tail -f logs/filesystem.log
```

### Telemetry

Alle MCP servere sender telemetri til Grafana:

- Request latency
- Error rates
- Resource usage
- API call patterns

### Alerting

Automatiske alerts for:

- Server downtime
- High error rates (>5%)
- Resource exhaustion
- Security violations

## Development Workflow

### Daily Development

1. **Start MCP servers**:
   ```bash
   yarn mcp:start
   ```

2. **Develop with AI assistance**:
   - File operations via filesystem server
   - Code testing via sandbox servers
   - Git operations via git server

3. **Test AI features**:
   - Content analysis via Jupyter
   - Data processing via data-analysis server

4. **Monitor progress**:
   - Check logs: `yarn mcp:logs`
   - View metrics in Grafana

### CI/CD Integration

MCP servere integreres i GitHub Actions:

```yaml
# .github/workflows/ci.yml
name: CI with MCP

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup MCP servers
        run: |
          ./scripts/setup-mcp.sh --phase 1 --env testing
          yarn mcp:start
      
      - name: Run tests with MCP
        run: |
          # Tests can now use MCP servers for file operations, etc.
          yarn test
      
      - name: AI-powered code analysis
        run: |
          # Use Jupyter server for code quality analysis
          yarn mcp:analyze-code
```

## Troubleshooting

### Common Issues

#### Server Won't Start

```bash
# Check logs
tail -f logs/[server-name].log

# Verify dependencies
which python3
which node
which docker

# Restart server
yarn mcp:stop
yarn mcp:start
```

#### Permission Errors

```bash
# Check file permissions
ls -la scripts/setup-mcp.sh

# Fix permissions
chmod +x scripts/setup-mcp.sh
chmod +x scripts/start-mcp-servers.sh
```

#### API Key Issues

```bash
# Verify environment variables
cat .env.mcp.local

# Test API connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

### Performance Optimization

1. **Caching**: Enable Redis caching for frequent operations
2. **Connection Pooling**: Use connection pools for database operations
3. **Async Operations**: Use async/await for non-blocking operations
4. **Resource Limits**: Set appropriate memory and CPU limits

## Best Practices

### Development

1. **Start Small**: Begin with Phase 1 servers only
2. **Test Incrementally**: Test each server individually
3. **Monitor Resources**: Watch CPU and memory usage
4. **Use Logging**: Enable detailed logging for debugging

### Production

1. **Security First**: Always use HTTPS and API keys
2. **Monitor Everything**: Set up comprehensive monitoring
3. **Backup Configurations**: Version control all configurations
4. **Plan for Scale**: Design for horizontal scaling

### AI Integration

1. **Cost Management**: Monitor AI API usage and costs
2. **Quality Control**: Implement human review for AI outputs
3. **Fallback Strategies**: Have manual processes as backup
4. **Continuous Learning**: Regularly retrain and improve models

## Examples

### Complete File Upload Workflow

```typescript
// 1. Upload file via filesystem server
const uploadResult = await mcpClient.call('filesystem', 'writeFile', {
  path: './uploads/materials/advanced-chemistry.pdf',
  content: fileBuffer
});

// 2. Process content via Jupyter
const analysis = await mcpClient.call('jupyter', 'executeCell', {
  notebookId: 'content-processor',
  code: `
import PyPDF2
import openai

# Extract text from PDF
with open('./uploads/materials/advanced-chemistry.pdf', 'rb') as file:
    reader = PyPDF2.PdfReader(file)
    text = ''.join([page.extract_text() for page in reader.pages])

# Generate quiz questions
questions = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{
        "role": "user",
        "content": f"Generate 10 quiz questions from this content: {text[:2000]}"
    }]
)

print(f"Generated {len(questions.choices[0].message.content)} questions")
  `
});

// 3. Save to database via API
const saveResult = await mcpClient.call('openapi', 'request', {
  method: 'POST',
  path: '/api/quizzes',
  data: {
    courseId: 'advanced-chemistry',
    questions: analysis.output
  }
});

// 4. Track in Git
const gitResult = await mcpClient.call('git', 'add', {
  files: ['./uploads/materials/advanced-chemistry.pdf']
});
```

### Automated Deployment Pipeline

```typescript
// 1. Run tests
const testResult = await mcpClient.call('python-sandbox', 'execute', {
  code: 'pytest ./tests/ -v --coverage'
});

if (testResult.exitCode === 0) {
  // 2. Build and deploy
  const deployment = await mcpClient.call('kubernetes', 'apply', {
    manifest: './k8s/production.yaml'
  });
  
  // 3. Monitor deployment
  const monitoring = await mcpClient.call('grafana', 'createAlert', {
    name: 'deployment-health',
    condition: 'avg(up{job="learninglab"}) < 0.9',
    duration: '5m'
  });
  
  // 4. Send notification
  await mcpClient.call('email', 'send', {
    to: 'team@learninglab.com',
    subject: 'Deployment Successful',
    body: `LearningLab deployed successfully at ${new Date()}`
  });
}
```

## Roadmap

### Short Term (1-2 måneder)
- [ ] Complete Phase 1 server integration
- [ ] Basic AI content analysis
- [ ] Automated testing pipeline

### Medium Term (3-6 måneder)
- [ ] Advanced AI features (adaptive learning)
- [ ] Comprehensive analytics dashboard
- [ ] Multi-environment deployment

### Long Term (6+ måneder)
- [ ] Custom MCP server development
- [ ] Advanced security features
- [ ] Multi-tenant support
- [ ] Edge deployment capabilities

## Support

For support og spørgsmål:

1. **Documentation**: Læs denne guide grundigt
2. **Logs**: Check `logs/` directory for fejlmeddelelser
3. **GitHub Issues**: Opret issue i LearningLab repository
4. **Team Chat**: Kontakt udviklingsteamet

---

*Denne guide opdateres løbende efterhånden som nye MCP servere tilføjes og eksisterende forbedres.*