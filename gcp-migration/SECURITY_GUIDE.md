# 🔐 Security Guide for OpenAI API Key Management

## ✅ What We've Implemented

### 1. Environment Variable Storage
- API key is stored in `.env` file (never committed to git)
- Loaded automatically by the application
- Separate from source code

### 2. Git Protection
- `.gitignore` includes `.env` and all environment files
- `.env.example` provides template without sensitive data
- Real API key never appears in version control

### 3. Application Security
- API key is loaded using `os.getenv()` at runtime
- Graceful degradation when API key is missing
- No hardcoded credentials in source code

## 🚨 Security Best Practices

### DO ✅

1. **Use Environment Variables**
   ```bash
   # In .env file
   OPENAI_API_KEY=sk-proj-...
   ```

2. **Keep .env in .gitignore**
   ```gitignore
   .env
   .env.local
   .env.production
   ```

3. **Use .env.example for Templates**
   ```bash
   # Safe to commit
   OPENAI_API_KEY=your-api-key-here
   ```

4. **Rotate Keys Regularly**
   - Generate new API keys monthly
   - Revoke old keys immediately
   - Monitor usage in OpenAI dashboard

5. **Limit API Key Permissions**
   - Use project-specific keys when possible
   - Set usage limits in OpenAI dashboard
   - Monitor for unusual activity

### DON'T ❌

1. **Never Hardcode API Keys**
   ```python
   # ❌ NEVER DO THIS
   openai.api_key = "sk-proj-abc123..."
   ```

2. **Never Commit .env Files**
   ```bash
   # ❌ NEVER DO THIS
   git add .env
   git commit -m "Add config"
   ```

3. **Never Share Keys in Chat/Email**
   - Use secure password managers
   - Share through encrypted channels only

4. **Never Log API Keys**
   ```python
   # ❌ NEVER DO THIS
   logger.info(f"Using API key: {api_key}")
   ```

## 🚀 Deployment Security

### Local Development
```bash
# 1. Copy template
cp .env.example .env

# 2. Edit with your key
vim .env

# 3. Verify .env is in .gitignore
grep -q ".env" .gitignore && echo "✅ Protected" || echo "❌ Add .env to .gitignore"
```

### Production Deployment

#### Docker
```dockerfile
# Use build args or runtime environment
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
```

#### Cloud Platforms
- **Google Cloud**: Use Secret Manager
- **AWS**: Use Systems Manager Parameter Store
- **Azure**: Use Key Vault
- **Heroku**: Use Config Vars

#### Kubernetes
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: openai-secret
type: Opaque
data:
  api-key: <base64-encoded-key>
```

## 🔍 Security Monitoring

### 1. OpenAI Dashboard
- Monitor API usage patterns
- Set up usage alerts
- Review access logs

### 2. Application Logs
- Log authentication failures (without keys)
- Monitor unusual request patterns
- Track API quota usage

### 3. Git History Scanning
```bash
# Check for accidentally committed secrets
git log --all --full-history -- .env
git log -p | grep -i "sk-proj"
```

## 🆘 Incident Response

### If API Key is Compromised:

1. **Immediate Actions**
   ```bash
   # 1. Revoke the key in OpenAI dashboard
   # 2. Generate new key
   # 3. Update .env file
   # 4. Restart application
   ```

2. **Investigation**
   - Check OpenAI usage logs
   - Review application logs
   - Scan git history for leaks

3. **Prevention**
   - Rotate all related keys
   - Review access controls
   - Update security procedures

## 📋 Security Checklist

- [ ] API key stored in `.env` file
- [ ] `.env` file in `.gitignore`
- [ ] `.env.example` template created
- [ ] No hardcoded keys in source code
- [ ] Application loads key via `os.getenv()`
- [ ] Graceful handling of missing keys
- [ ] Regular key rotation scheduled
- [ ] Usage monitoring enabled
- [ ] Team trained on security practices

## 🔗 Additional Resources

- [OpenAI API Security Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_credentials)
- [Git Secrets Prevention](https://github.com/awslabs/git-secrets)

---

**Remember**: Security is everyone's responsibility. When in doubt, ask the team!