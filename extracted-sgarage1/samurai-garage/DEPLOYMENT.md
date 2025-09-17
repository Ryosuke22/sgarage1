# Samurai Garage - Deployment Guide

## 🚀 Quick Deploy on Replit

### One-Click Deployment
1. **Fork this repository** on Replit
2. **Configure Secrets** (optional for basic features):
   ```
   GCS_BUCKET=your-bucket-name
   SENDGRID_API_KEY=your-sendgrid-key
   STRIPE_SECRET_KEY=sk_test_...
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   ```
3. **Click Deploy** - Your app will be live at `your-repl-name.replit.app`

### What's Included Out-of-the-Box
- ✅ **PostgreSQL Database** (automatically configured)
- ✅ **User Authentication** (Replit Auth)
- ✅ **File Storage** (Replit Object Storage)
- ✅ **SSL Certificate** (automatic HTTPS)
- ✅ **Performance Monitoring** (`/admin/performance`)
- ✅ **Real-time Bidding** (WebSocket support)

### Optional Enhancements
Add these secrets for enhanced features:
- **Email Notifications**: `SENDGRID_API_KEY`
- **Payment Processing**: `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`
- **Cloud Storage**: `GCS_BUCKET`, `GCS_SERVICE_ACCOUNT_KEY`

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5000
```

## 📊 Features Showcase

### Enterprise-Grade Infrastructure
- **Real-time Bidding**: WebSocket-powered auction system
- **Intelligent Caching**: 30s stale time, 5min garbage collection
- **Code Splitting**: Route-based lazy loading for optimal performance
- **Automated Processing**: Content scanning, thumbnail generation, auction management

### Commercial Auction Features
- **Soft Close Logic**: Prevents bid sniping with dynamic extensions
- **Reserve Pricing**: Professional reserve price handling
- **Fee Calculations**: Transparent buyer/seller fee display
- **Auto-bidding**: Proxy bidding system with increment validation

### Content Management System
- **Dual Storage**: Google Cloud Storage + Replit Object Storage
- **Automated Scanning**: Object classification and quarantine (every 10 minutes)
- **Thumbnail Generation**: Multiple formats (150px, 300px, 800px) in JPEG/WebP
- **Admin Tools**: Professional file management and moderation

### Performance Optimizations
- **Route-based Code Splitting**: Lazy loading for all major components
- **Advanced Query Caching**: Smart retry logic with exponential backoff
- **Performance Dashboard**: Real-time monitoring of load times and memory usage
- **Adaptive Loading**: Connection speed-aware strategies

## 🎯 Quick Start Guide

### For Sellers
1. Sign up with Replit Auth
2. Create listing with photos and details
3. Wait for admin approval
4. Track auction progress and communicate with winners

### For Buyers
1. Browse featured auctions
2. Add items to watchlist
3. Place bids in real-time
4. Receive winner notifications

### For Administrators
1. Access admin dashboard at `/admin`
2. Approve listings at `/admin/users`
3. Monitor storage at `/admin/objects`
4. Check performance at `/admin/performance`

## 📱 Technical Highlights

### Modern Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + PostgreSQL + Drizzle ORM
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **Real-time**: WebSocket + Server-Sent Events
- **Image Processing**: Sharp for thumbnails and optimization

### Production-Ready Security
- **Helmet.js**: Security headers and XSS protection
- **Rate Limiting**: Comprehensive request throttling
- **Session Management**: PostgreSQL-backed sessions with 7-day TTL
- **Role-based Access**: Admin privileges and user management
- **Input Validation**: Zod schemas throughout the application

## 🔧 Customization

### Branding
- Update `client/src/components/Layout.tsx` for navigation
- Modify `client/src/pages/Landing.tsx` for homepage
- Customize colors in `client/src/index.css`

### Business Logic
- Auction rules in `server/cronJobs.ts`
- Fee calculations in `server/routes/fees.ts`
- Email templates in `server/email/`

### Integrations
- Payment processing: `server/routes/stripe.ts`
- File storage: `server/lib/storage.ts`
- Email service: `server/email/emailService.ts`

## 📈 Monitoring & Analytics

### Built-in Performance Dashboard
Visit `/admin/performance` to monitor:
- Page load times and First Contentful Paint
- Memory usage and cache efficiency
- Query performance and cache hit rates
- Real-time metrics with automatic refresh

### Production Metrics
- **Load Time**: < 1000ms target
- **Cache Hit Rate**: > 90% efficiency
- **Memory Usage**: Optimized with garbage collection
- **Bundle Size**: Minimized with code splitting

## 🆘 Support & Documentation

- **Full Documentation**: See `/docs` folder
- **API Reference**: Available in development mode
- **Performance Guide**: `/docs/performance.md`
- **Deployment Options**: `/docs/DEPLOYMENT.md`

---

**Ready to deploy?** Just click the Deploy button on Replit and your auction platform will be live in minutes!