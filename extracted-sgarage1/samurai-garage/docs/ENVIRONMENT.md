# Environment Configuration Guide

Complete guide for configuring environment variables in Samurai Garage.

## 🚀 Quick Setup

### Required Variables
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/samurai_garage
SESSION_SECRET=your-secure-session-secret-change-me-in-production
```

### Optional Enhanced Features
```bash
# Google Cloud Storage
GCS_BUCKET=your-bucket-name
GCS_SERVICE_ACCOUNT_KEY={"type":"service_account"...}

# Email Notifications
SENDGRID_API_KEY=SG.your-sendgrid-key

# Payment Processing
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# CORS Configuration
CORS_ORIGIN=https://your-frontend.example
```

## 📋 Complete Environment Variables

### Core Application
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✅ | `development` | Application environment |
| `PORT` | ✅ | `5000` | Server port |
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | - | Session encryption key |

### Security & CORS
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CORS_ORIGIN` | ❌ | `*` | Allowed CORS origins |
| `RATE_LIMIT_WINDOW_MS` | ❌ | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | ❌ | `100` | Max requests per window |

### File Storage
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GCS_BUCKET` | ❌ | - | Google Cloud Storage bucket |
| `GCS_SERVICE_ACCOUNT_KEY` | ❌ | - | GCS service account JSON |

### Email Service
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENDGRID_API_KEY` | ❌ | - | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | ❌ | - | Default sender email |

### Payment Processing
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | ❌ | - | Stripe secret key |
| `VITE_STRIPE_PUBLIC_KEY` | ❌ | - | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | ❌ | - | Stripe webhook secret |

### Performance & Monitoring
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PERFORMANCE_MONITORING` | ❌ | `true` | Enable performance tracking |
| `LOG_LEVEL` | ❌ | `info` | Logging level |
| `HELMET_ENABLED` | ❌ | `true` | Security headers |
| `COMPRESSION_ENABLED` | ❌ | `true` | Response compression |

## 🔧 Platform-Specific Setup

### Replit Configuration
Replit automatically provides these variables:
```bash
# Auto-configured by Replit
DATABASE_URL=postgresql://...
REPL_ID=your-repl-id
REPL_SLUG=your-repl-slug
REPLIT_DOMAINS=your-domain.replit.app
```

To add secrets on Replit:
1. Go to "Secrets" tab in your Repl
2. Add environment variables as key-value pairs
3. Restart your application

### Local Development
1. Copy `.env.example` to `.env`
2. Update values for your local setup
3. Ensure PostgreSQL is running locally

### Production Deployment
- Use strong, unique `SESSION_SECRET`
- Set `NODE_ENV=production`
- Configure proper `CORS_ORIGIN`
- Use production API keys for services

## 🔐 Security Best Practices

### Session Security
```bash
# Generate secure session secret
SESSION_SECRET=$(openssl rand -base64 32)
```

### CORS Configuration
```bash
# Single domain
CORS_ORIGIN=https://yourdomain.com

# Multiple domains (JSON array)
CORS_ORIGIN=["https://yourdomain.com","https://api.yourdomain.com"]

# Development (allow all)
CORS_ORIGIN=*
```

### API Keys
- Never commit real API keys to version control
- Use different keys for development and production
- Regularly rotate sensitive keys
- Monitor API key usage and alerts

## 🌐 Service Configuration Guides

### Google Cloud Storage Setup
1. Create GCS bucket:
   ```bash
   gsutil mb gs://your-bucket-name
   ```

2. Create service account:
   ```bash
   gcloud iam service-accounts create samurai-garage
   ```

3. Grant permissions:
   ```bash
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:samurai-garage@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.admin"
   ```

4. Generate key:
   ```bash
   gcloud iam service-accounts keys create key.json \
     --iam-account=samurai-garage@PROJECT_ID.iam.gserviceaccount.com
   ```

### SendGrid Email Setup
1. Sign up at [SendGrid](https://sendgrid.com)
2. Create API key in Settings > API Keys
3. Verify sender identity
4. Add to environment:
   ```bash
   SENDGRID_API_KEY=SG.your-api-key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

### Stripe Payment Setup
1. Create account at [Stripe](https://stripe.com)
2. Get API keys from Dashboard > Developers
3. For testing:
   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   ```
4. For production:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   VITE_STRIPE_PUBLIC_KEY=pk_live_...
   ```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check DATABASE_URL format
DATABASE_URL=postgresql://user:password@host:port/database

# Test connection
psql $DATABASE_URL
```

#### CORS Errors
```bash
# Check CORS_ORIGIN setting
CORS_ORIGIN=https://your-exact-domain.com

# For development, temporarily use:
CORS_ORIGIN=*
```

#### File Upload Issues
```bash
# Check GCS bucket permissions
gsutil iam get gs://your-bucket-name

# Verify service account key format
echo $GCS_SERVICE_ACCOUNT_KEY | jq .
```

#### Email Not Sending
```bash
# Verify SendGrid API key
curl -X GET https://api.sendgrid.com/v3/user/profile \
  -H "Authorization: Bearer $SENDGRID_API_KEY"
```

### Environment Validation
The application includes built-in environment validation that will warn about missing or incorrect configuration at startup.

## 📊 Environment Examples

### Development
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://localhost:5432/samurai_garage_dev
SESSION_SECRET=dev-secret-key-change-me
CORS_ORIGIN=http://localhost:5000
```

### Staging
```bash
NODE_ENV=staging
PORT=5000
DATABASE_URL=postgresql://staging-db:5432/samurai_garage
SESSION_SECRET=staging-secret-key
CORS_ORIGIN=https://staging.yourdomain.com
SENDGRID_API_KEY=SG.staging-key
```

### Production
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://prod-db:5432/samurai_garage
SESSION_SECRET=super-secure-production-secret
CORS_ORIGIN=https://yourdomain.com
GCS_BUCKET=prod-samurai-garage-storage
SENDGRID_API_KEY=SG.production-key
STRIPE_SECRET_KEY=sk_live_production_key
```

---

Need help with configuration? Check our [support channels](../README.md#support) or refer to the platform-specific deployment guides.