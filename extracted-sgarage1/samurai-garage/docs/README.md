# Samurai Garage - Japanese Classic Vehicle Auction Platform

A sophisticated, enterprise-grade auction platform for Japanese classic cars and motorcycles, built with modern web technologies and commercial-grade infrastructure.

## 🚀 Live Demo

**Demo URL**: [https://samurai-garage-demo.replit.app](https://samurai-garage-demo.replit.app)

## 📸 Screenshots

| Feature | Screenshot |
|---------|------------|
| Homepage | ![Homepage](screenshots/homepage.png) |
| Auction Detail | ![Auction Detail](screenshots/auction-detail.png) |
| Admin Dashboard | ![Admin Dashboard](screenshots/admin-dashboard.png) |
| Performance Dashboard | ![Performance](screenshots/performance.png) |

## ✨ Key Features

### 🏎️ Auction System
- **Real-time Bidding**: WebSocket-powered live bidding with instant updates
- **Soft Close Logic**: Dynamic auction extensions to prevent sniping
- **Reserve Pricing**: Professional reserve price handling
- **Auto-bidding**: Intelligent proxy bidding system
- **Commercial UI**: Professional BidBar with fee calculations

### 🔐 Enterprise Security
- **Production Middleware**: Helmet.js, CORS, compression
- **PostgreSQL Sessions**: Secure session management with 7-day TTL
- **Role-based Access**: Admin privileges and user management
- **Rate Limiting**: Comprehensive request throttling

### ☁️ Cloud Infrastructure
- **Dual Storage**: Google Cloud Storage + Replit Object Storage
- **Automated Processing**: Content scanning, thumbnail generation
- **Object Management**: Professional admin tools for file lifecycle
- **CDN Optimization**: Multi-format image delivery (WebP/JPEG)

### ⚡ Performance Optimization
- **Code Splitting**: Route-based lazy loading
- **Intelligent Caching**: 30s stale time, 5min garbage collection
- **Performance Monitoring**: Real-time metrics dashboard
- **Adaptive Loading**: Connection speed-aware strategies

### 🤖 Automation
- **Cron Jobs**: Auction processing (1min), object scanning (10min), thumbnails (15min)
- **Email Notifications**: Winner/seller contact automation
- **Content Moderation**: Automatic quarantine system
- **Database Cleanup**: Automated maintenance tasks

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build optimization
- **TanStack Query** for state management
- **shadcn/ui** + Radix UI components
- **Tailwind CSS** for styling
- **Wouter** for routing

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **WebSocket** real-time communication
- **Sharp** for image processing
- **Node-cron** for scheduled tasks

### Infrastructure
- **Google Cloud Storage** for file hosting
- **Replit Auth** for authentication
- **SendGrid** for email delivery
- **Stripe** for payment processing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Google Cloud Storage account (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/samurai-garage
cd samurai-garage

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Google Cloud Storage (optional)
GCS_BUCKET=your-bucket-name
GCS_SERVICE_ACCOUNT_KEY={"type":"service_account"...}

# Email (optional)
SENDGRID_API_KEY=your-sendgrid-key

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

## 📖 User Guide

### For Sellers
1. **Create Account**: Sign up via Replit Auth
2. **Submit Listing**: Upload photos, add vehicle details
3. **Admin Review**: Wait for listing approval
4. **Auction Goes Live**: Track bids and communicate with winners

### For Buyers
1. **Browse Listings**: Filter by make, model, year
2. **Watch Items**: Add to watchlist for notifications
3. **Place Bids**: Real-time bidding with increment validation
4. **Win Auction**: Automatic winner notification and seller contact

### For Administrators
1. **Approve Listings**: Review and approve submitted auctions
2. **Manage Users**: User administration and role management
3. **Monitor Objects**: File upload management and content moderation
4. **Performance**: Real-time performance monitoring dashboard

## 🔧 Development Guide

### Project Structure
```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and configurations
│   │   └── utils/        # Helper functions
├── server/               # Express backend
│   ├── routes/           # API endpoints
│   ├── jobs/             # Cron jobs and background tasks
│   ├── middleware/       # Express middleware
│   └── realtime/         # WebSocket handlers
├── shared/               # Shared types and schemas
└── docs/                 # Documentation
```

### Key Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema changes
npm run db:studio    # Open database studio
npm test             # Run tests
npm run lint         # Lint code
```

### Database Schema
The application uses Drizzle ORM with PostgreSQL. Key tables:
- `users` - User accounts and profiles
- `listings` - Auction listings and details
- `bids` - Bid history and auto-bidding
- `watches` - User watchlists
- `comments` - Listing comments and Q&A

## 🚀 Deployment

### Replit Deployment (Recommended)
1. Fork this repository on Replit
2. Configure environment variables in Secrets
3. Click "Deploy" button
4. Your app will be live at `your-repl-name.replit.app`

### Manual Deployment
```bash
# Build the application
npm run build

# Set NODE_ENV to production
export NODE_ENV=production

# Start the server
npm start
```

## 📊 Performance Benchmarks

### Loading Performance
- **Page Load Time**: < 1000ms (target)
- **First Contentful Paint**: < 1000ms
- **Time to Interactive**: < 2500ms
- **Bundle Size**: Optimized with code splitting

### Caching Strategy
- **Static Assets**: 24 hours cache
- **API Responses**: 30 seconds stale time
- **User Data**: 5 minutes cache
- **Real-time Data**: 10 seconds cache

## 🔒 Security Features

### Authentication
- Replit Auth integration
- Session-based authentication
- Role-based access control

### Data Protection
- Input validation with Zod
- SQL injection prevention
- XSS protection with Helmet.js
- CSRF protection

### File Security
- Upload validation and scanning
- Automatic content moderation
- Quarantine system for suspicious files

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See `/docs` folder
- **Issues**: GitHub Issues
- **Discord**: [Community Server](https://discord.gg/samurai-garage)

## 🎯 Roadmap

### Upcoming Features
- [ ] Mobile app development
- [ ] Advanced search filters
- [ ] International shipping calculator
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations

---

Built with ❤️ for the classic vehicle community