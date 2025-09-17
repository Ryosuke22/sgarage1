# Configuration Guide - Samurai Garage

## Environment Variables Reference

Based on your setup, here are the key environment variables for Samurai Garage:

### Core Configuration
```bash
NODE_ENV=development
PORT=5000
GCS_BUCKET=your-bucket
SESSION_SECRET=change_me
CORS_ORIGIN=https://your-frontend.example
```

### Database
```bash
# Automatically configured on Replit
DATABASE_URL=postgresql://user:password@host:port/database
```

### Auction Settings
```bash
# Soft close configuration
SOFT_CLOSE_WINDOW_SEC=600         # 10 minutes before close
SOFT_CLOSE_EXTEND_BY_SEC=600      # Extend by 10 minutes  
SOFT_CLOSE_MAX_EXTENSIONS=12      # Maximum extensions
AUTOBID_FIRE_OFFSET_SEC=300       # Auto-bid 5 minutes before close
```

### Optional Services
```bash
# Email notifications
SENDGRID_API_KEY=SG.your-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Payment processing
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# Cloud storage
GCS_BUCKET=your-bucket-name
GCS_SERVICE_ACCOUNT_KEY={"type":"service_account"...}
```

## Quick Setup Guide

### 1. Basic Setup (Replit)
- Fork the repository on Replit
- No additional configuration needed for basic functionality
- Database and authentication are auto-configured

### 2. Enhanced Features
Add these secrets in Replit for additional features:

**Google Cloud Storage**
```bash
GCS_BUCKET=your-bucket-name
```

**Email Notifications**
```bash
SENDGRID_API_KEY=your-sendgrid-key
```

**Payment Processing**
```bash
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

### 3. Custom Domain Setup
```bash
CORS_ORIGIN=https://your-custom-domain.com
```

## Security Configuration

### Session Security
```bash
# Generate secure session secret
SESSION_SECRET=$(openssl rand -base64 32)
```

### CORS Setup
```bash
# Single domain
CORS_ORIGIN=https://yourdomain.com

# Multiple domains (comma-separated)
CORS_ORIGIN=https://yourdomain.com,https://api.yourdomain.com

# Development (localhost)
CORS_ORIGIN=http://localhost:5000
```

### Rate Limiting
```bash
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # 100 requests per window
```

## Performance Settings

### Caching Configuration
- **Query Cache**: 30 seconds stale time, 5 minutes garbage collection
- **Static Assets**: 24 hours browser cache
- **API Responses**: Intelligent invalidation

### Bundle Optimization
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: WebP/JPEG with multiple sizes
- **Compression**: Gzip compression enabled

### Monitoring
```bash
PERFORMANCE_MONITORING=true
LOG_LEVEL=info
```

## Service Integration Guides

### Google Cloud Storage
1. Create bucket: `gsutil mb gs://your-bucket-name`
2. Create service account with Storage Admin role
3. Generate JSON key file
4. Add `GCS_BUCKET` and `GCS_SERVICE_ACCOUNT_KEY` to secrets

### SendGrid Email
1. Create SendGrid account
2. Generate API key
3. Verify sender identity
4. Add `SENDGRID_API_KEY` to secrets

### Stripe Payments
1. Create Stripe account
2. Get API keys from dashboard
3. Add `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLIC_KEY`
4. Set up webhooks for production

## Troubleshooting

### Common Issues

**CORS Errors**
- Check `CORS_ORIGIN` matches your domain exactly
- Include protocol (https://)
- No trailing slash

**Database Connection**
- Replit auto-configures PostgreSQL
- Check `DATABASE_URL` format if using external database

**File Upload Issues**
- Verify GCS bucket permissions
- Check service account key format
- Ensure bucket exists and is accessible

**Email Not Working**
- Verify SendGrid API key is active
- Check sender email is verified
- Confirm email quotas

### Environment Validation
The application includes startup validation that checks for:
- Required environment variables
- Database connectivity
- External service availability
- Security configuration

### Performance Monitoring
Access real-time performance metrics at:
- `/admin/performance` - Performance dashboard
- Browser DevTools - Network and Performance tabs
- Server logs - Structured logging with performance data

## Production Checklist

### Security
- [ ] Strong `SESSION_SECRET` (32+ characters)
- [ ] Proper `CORS_ORIGIN` configuration
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers enabled

### Performance
- [ ] Code splitting enabled
- [ ] Image optimization configured
- [ ] Caching strategies implemented
- [ ] Performance monitoring active
- [ ] Bundle size optimized

### Services
- [ ] Database connection verified
- [ ] Email service configured
- [ ] File storage set up
- [ ] Payment processing tested
- [ ] Monitoring alerts configured

---

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)