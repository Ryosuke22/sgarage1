# Deployment Guide - Samurai Garage

Complete deployment guide for the Samurai Garage auction platform.

## 🚀 Replit Deployment (Recommended)

### Prerequisites
- Replit account
- PostgreSQL database (provided by Replit)
- Optional: Google Cloud Storage account

### Step-by-Step Deployment

1. **Fork Repository**
   ```bash
   # Fork this repository on Replit
   # Or import from GitHub: https://github.com/your-org/samurai-garage
   ```

2. **Configure Environment Variables**
   
   Go to Replit Secrets and add:
   ```bash
   # Database (auto-configured by Replit)
   DATABASE_URL=postgresql://...
   
   # Optional: Google Cloud Storage
   GCS_BUCKET=your-bucket-name
   GCS_SERVICE_ACCOUNT_KEY={"type":"service_account"...}
   
   # Optional: Email service
   SENDGRID_API_KEY=your-sendgrid-key
   
   # Optional: Stripe payments
   STRIPE_SECRET_KEY=sk_test_...
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   ```

3. **Database Setup**
   ```bash
   # Replit automatically provides PostgreSQL
   # Run migrations
   npm run db:push
   ```

4. **Deploy Application**
   - Click the "Deploy" button in Replit
   - Choose "Static" deployment type
   - Configure domain (optional)
   - Your app will be live at `your-repl-name.replit.app`

### Replit-Specific Configuration

#### Automatic Features
- ✅ PostgreSQL database provisioning
- ✅ Environment variable management
- ✅ Automatic SSL certificates
- ✅ CDN integration
- ✅ Health monitoring

#### Custom Domain Setup
1. Go to Deployment settings
2. Click "Custom Domain"
3. Add your domain name
4. Configure DNS records as shown

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 5000

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/samurai_garage
    depends_on:
      - db
    
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=samurai_garage
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Deploy with Docker
```bash
# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## ☁️ Cloud Platform Deployment

### Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Configure vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.ts",
         "use": "@vercel/node"
       },
       {
         "src": "client/dist/**",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server/index.ts"
       },
       {
         "src": "/(.*)",
         "dest": "/client/dist/$1"
       }
     ]
   }
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Railway Deployment

1. **Connect Repository**
   - Go to Railway.app
   - Connect your GitHub repository

2. **Configure Environment**
   ```bash
   # Railway automatically provides PostgreSQL
   # Add other environment variables in dashboard
   ```

3. **Deploy**
   - Railway automatically builds and deploys
   - Custom domain available in Pro plan

### Heroku Deployment

1. **Create Heroku App**
   ```bash
   heroku create samurai-garage
   heroku addons:create heroku-postgresql:hobby-dev
   ```

2. **Configure Buildpacks**
   ```bash
   heroku buildpacks:add heroku/nodejs
   ```

3. **Deploy**
   ```bash
   git push heroku main
   heroku open
   ```

## 🗄️ Database Deployment

### PostgreSQL Setup

#### Managed PostgreSQL (Recommended)
- **Replit**: Automatic provisioning
- **Railway**: One-click PostgreSQL
- **Supabase**: Free tier with 500MB
- **PlanetScale**: Serverless MySQL alternative

#### Self-hosted PostgreSQL
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb samurai_garage
sudo -u postgres createuser samurai_user

# Grant permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE samurai_garage TO samurai_user;
```

### Database Migrations
```bash
# Push schema changes
npm run db:push

# Generate migrations (if needed)
npx drizzle-kit generate:pg

# Run migrations
npx drizzle-kit push:pg
```

## 📁 File Storage Deployment

### Google Cloud Storage Setup

1. **Create GCS Bucket**
   ```bash
   # Install gcloud CLI
   curl https://sdk.cloud.google.com | bash
   
   # Create bucket
   gsutil mb gs://your-bucket-name
   
   # Set public access (for public files)
   gsutil iam ch allUsers:objectViewer gs://your-bucket-name/public
   ```

2. **Service Account Setup**
   ```bash
   # Create service account
   gcloud iam service-accounts create samurai-garage-storage
   
   # Grant permissions
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:samurai-garage-storage@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.admin"
   
   # Generate key
   gcloud iam service-accounts keys create key.json \
     --iam-account=samurai-garage-storage@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

### Alternative Storage Options

#### AWS S3
```javascript
// Update server/lib/storage.ts for S3
import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
```

#### Cloudinary
```javascript
// For image optimization
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

## 📧 Email Service Setup

### SendGrid Configuration
```bash
# Environment variables
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### Alternative Email Providers

#### Resend
```bash
RESEND_API_KEY=re_your-api-key
```

#### Amazon SES
```bash
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=your-access-key
AWS_SES_SECRET_KEY=your-secret-key
```

## 💳 Payment Integration

### Stripe Setup
```bash
# Get API keys from Stripe Dashboard
STRIPE_SECRET_KEY=sk_live_...  # Use sk_test_ for testing
VITE_STRIPE_PUBLIC_KEY=pk_live_...  # Use pk_test_ for testing

# Optional: Webhook endpoint
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Webhook Configuration
```javascript
// server/routes/webhooks.ts
app.post('/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    // Handle event
    res.json({received: true});
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

## 🔍 Monitoring & Analytics

### Production Monitoring
```bash
# Environment variables for monitoring
SENTRY_DSN=https://your-sentry-dsn
GOOGLE_ANALYTICS_ID=GA-XXXXX-X
HOTJAR_ID=your-hotjar-id
```

### Performance Monitoring
```javascript
// Add to client/src/main.tsx
import { init } from '@sentry/react';

init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.NODE_ENV,
});
```

### Health Checks
```javascript
// server/routes/health.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+
```

#### Database Connection Issues
```bash
# Check connection
npx drizzle-kit introspect:pg

# Test with psql
psql $DATABASE_URL
```

#### File Upload Issues
```bash
# Check GCS permissions
gsutil iam get gs://your-bucket-name

# Test upload
gsutil cp test.jpg gs://your-bucket-name/test/
```

### Performance Optimization

#### Production Checklist
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Set up caching headers
- [ ] Enable database connection pooling
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring alerts

#### Security Checklist
- [ ] Use HTTPS in production
- [ ] Set secure environment variables
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up WAF (Web Application Firewall)
- [ ] Regular security updates

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balancer configuration
- Database read replicas
- CDN for global distribution
- WebSocket clustering

### Vertical Scaling
- Increase server resources
- Database performance tuning
- Memory optimization
- CPU optimization

---

Need help with deployment? Check our [support channels](../README.md#support) or open an issue on GitHub.