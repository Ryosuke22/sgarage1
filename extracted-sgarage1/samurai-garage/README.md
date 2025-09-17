# 🏎️ Samurai Garage - Japanese Classic Vehicle Auction Platform

**3分で体験できる本格的なオークションプラットフォーム**

[![Deploy on Replit](https://replit.com/badge/github/your-username/samurai-garage)](https://replit.com/@your-username/samurai-garage)

## 🚀 What is Samurai Garage?

Samurai Garage is a **commercial-grade Japanese classic vehicle auction platform** inspired by Bring a Trailer (BaT). Experience real-time bidding on rare JDM cars and motorcycles with enterprise-level features.

### ✨ Key Features
- 🔥 **Real-time bidding** with WebSocket connectivity
- 🎯 **Soft close mechanics** (auctions extend when bids come in)
- 🤖 **Auto-bidding system** with snipe and incremental strategies  
- 💳 **Payment processing** (Stripe integration)
- 📧 **Email notifications** for winners and sellers
- 🌐 **Dual language support** (Japanese/English)
- 🏆 **Admin moderation** tools
- 📱 **Responsive design** with dark theme

### 🎮 Try it Now (3-minute experience)

1. **Fork this Repl** ← Click the fork button above
2. **Hit Run** ← The app starts automatically with sample data
3. **Browse auctions** ← See live JDM classics (NSX, RX-7, GT-R)
4. **Place bids** ← Real-time bidding with live updates
5. **Watch soft close** ← Auctions extend when bids come in late

**Sample accounts ready to use:**
- **Email Login**: `samuraigarage1@gmail.com` / `password123`
- **Seller**: `ClassicCarCollector` / `TokyoDrifter`  
- **Buyer**: `VintageHunter`
- **Admin**: `Admin`

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast builds
- **TanStack Query** for intelligent caching
- **shadcn/ui** + **Tailwind CSS** for beautiful UI
- **Wouter** for lightweight routing

### Backend  
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **WebSocket** for real-time updates
- **Node-cron** for auction automation
- **Replit Auth** for seamless authentication

### Infrastructure
- **Replit Object Storage** + **Google Cloud Storage**
- **SendGrid** for email notifications
- **Stripe** for payment processing
- **Helmet.js** for security headers

## 📊 Sample Data Included

The platform comes pre-loaded with realistic auction data:

### 🚗 Featured Vehicles
1. **1993 Honda NSX Type R** - Championship White, 87k km
2. **1994 Mazda RX-7 FD3S** - Twin-turbo rotary, Vintage Red
3. **1985 Honda VF1000R** - Rare factory superbike
4. **1990 Nissan Skyline GT-R R32** - Unmodified "Godzilla"

### 💰 Live Auction Activity
- **Real bid history** with competitive pricing
- **Active watchers** and comment discussions
- **Reserve prices** and soft close mechanics
- **Email notifications** for auction events

## ⚡ Quick Start Guide

### Option 1: Replit (Recommended - 30 seconds)
```bash
# Just hit the "Run" button - everything is pre-configured!
# Sample data loads automatically
# Authentication works out of the box
```

### Option 2: Local Development
```bash
# Clone and setup
git clone <repository-url>
cd samurai-garage
npm install

# Setup environment
cp .env.example .env
# Edit .env with your PostgreSQL connection

# Initialize database and sample data
npm run db:push
tsx server/seed.ts

# Start development server
npm run dev
```

### Option 3: Production Deployment
See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for comprehensive deployment guide.

## 🔧 Configuration

### Required Environment Variables
```bash
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secure-secret
```

### Optional Enhanced Features
```bash
# Cloud Storage
GCS_BUCKET=your-bucket-name

# Email Notifications  
SENDGRID_API_KEY=SG.your-api-key

# Payment Processing
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

Complete configuration guide: [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)

## 🎯 Key User Flows

### For Bidders
1. **Browse listings** - Filter by category, make, price
2. **Watch items** - Get notifications on bid activity  
3. **Place bids** - Real-time updates with increment validation
4. **Set auto-bids** - Snipe or incremental strategies
5. **Win auctions** - Email contact facilitation with seller

### For Sellers  
1. **Submit listings** - Rich description with photo gallery
2. **Admin approval** - Moderated quality control
3. **Monitor bidding** - Real-time dashboard with analytics
4. **Auction close** - Automatic winner determination
5. **Contact buyer** - Facilitated communication

### For Admins
1. **Review submissions** - Approve/reject with feedback
2. **Monitor platform** - User activity and auction health
3. **Content moderation** - Photo scanning and approval
4. **Analytics dashboard** - Performance metrics and insights

## 📈 Performance Features

- **Sub-1000ms load times** with code splitting
- **Intelligent caching** (30s stale, 5min GC)  
- **Lazy loading** for optimal bundle size
- **Real-time updates** without page refresh
- **Adaptive loading** based on connection speed

## 🔐 Security Features

- **Production-ready security** headers (Helmet.js)
- **PostgreSQL sessions** with secure cookies
- **Rate limiting** on critical endpoints
- **CORS configuration** for domain restrictions
- **Structured logging** with sensitive data masking

## 🌐 Internationalization

- **Japanese-first design** with cultural considerations
- **Automatic locale detection** based on browser
- **Currency formatting** (JPY/USD)
- **Date/time localization** for auction schedules

## 📱 Mobile Experience

- **Responsive design** optimized for mobile bidding
- **Touch-friendly interfaces** for auction interaction
- **Progressive Web App** capabilities
- **Offline capability** for browsing (coming soon)

## 🚀 Production Readiness

### Monitoring & Logging
- **Structured logging** with Pino.js
- **Error tracking** with email notifications
- **Performance monitoring** dashboard
- **Health checks** for all services

### Scalability
- **Database indexing** for query optimization
- **Connection pooling** for high concurrency
- **CDN-ready** asset organization
- **Horizontal scaling** patterns

## 📚 Documentation

- [🚀 Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions
- [⚙️ Environment Setup](docs/ENVIRONMENT.md) - Configuration reference
- [🔧 Configuration Guide](docs/CONFIGURATION.md) - Platform-specific setup
- [📋 API Documentation](docs/API.md) - REST API reference
- [🎨 UI Guidelines](docs/UI.md) - Design system documentation

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎌 About

Built with ❤️ for the Japanese classic vehicle community. Inspired by the legendary cars and motorcycles that defined Japan's automotive golden age.

---

**Ready to experience the thrill of JDM auctions? [Click Run and start bidding!](https://replit.com/@your-username/samurai-garage) 🏁**