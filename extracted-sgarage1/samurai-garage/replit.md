# Overview

Samurai Garage is a commercial-grade Japanese classic car and motorcycle auction platform, managing the complete auction lifecycle from submission and review to bidding and completion. Inspired by Bring a Trailer (BaT), it features a Japanese-first UI, moderated listings, real-time bidding via WebSockets, commercial auction components, and comprehensive auction management. The platform specializes in classic and historical vehicles from 2001 and earlier, with an extensive database covering **34 total car manufacturers** including Japanese, European luxury, and French automotive brands. Its core ambition is to be the world's most comprehensive classic automotive database, offering an authentic bilingual experience with precise year-to-model mapping and authentic Japanese model names (DS, 2CV, A110, EB110, etc.).

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with Vite
- **Routing**: Wouter
- **UI Components**: shadcn/ui with Radix UI primitives and Tailwind CSS
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form with Zod validation
- **Real-time Updates**: Server-Sent Events (SSE) for live bidding updates.
- **UI/UX Decisions**: Dark theme aesthetic (black/gray backgrounds, gradient-neutral, glass header, white text). Streamlined forms prioritize vehicle details with comprehensive dropdowns for category, make, and model, supporting custom input. Professional UI components include BidBar, ReserveBadge, and FeeHint.

## Backend Architecture
- **Runtime**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth using OpenID Connect
- **File Storage**: Replit Object Storage with optional Google Cloud Storage integration
- **Scheduled Jobs**: node-cron for automated auction closing and cleanup
- **API Design**: RESTful endpoints with rate limiting and centralized, modular route registration. Vehicle data uses a year-range mapping system for 1960-2000 Japanese classics, with authentic Japanese model names.

## Database Design
- **User Management**: Supports user and admin roles.
- **Auction Workflow**: Status-driven listing management (draft → submitted → approved → published → ended).
- **Bidding System**: Atomic bid processing with soft close mechanics, increment validation, and auto-bidding.
- **Content Management**: Photo galleries, comments, and watch lists.
- **Vehicle Data**: Comprehensive historical database covering major Japanese and European luxury manufacturers with authentic model names and precise year-to-model mapping (1931-1995 for Japanese, 1948-1995 for European). **Motorcycle Database Expansion**: Added extensive motorcycle models from 25 major manufacturers spanning Japanese, American, German, British, and Italian heritage - Suzuki (82 models), Kawasaki (69 models), Harley-Davidson (35 models), BMW (55 models), Ducati (27 models), Triumph (21 models), Moto Guzzi (31 models), Aprilia (17 models), Cagiva (13 models), Bimota (18 models), MV Agusta (12 models), Laverda (10 models), Moto Morini (8 models), Benelli (9 models), Piaggio (11 models), Vespa (17 models), Gilera (10 models), Norton (12 models), BSA (14 models), Royal Enfield (10 models), Ariel (5 models), Matchless (6 models), AJS (5 models), Velocette (7 models), and Vincent (4 models) spanning 1946-1995, including legendary series like Katana, Gamma, Z1, Ninja, Zephyr, Electra Glide, Sportster, Softail, Fat Boy, R-series, 916, Monster, Bonneville, Daytona, California, Le Mans, Pegaso, Jota, SFC, Sei, PX series, Commando, Gold Star, Black Shadow, Square Four, and classic British racing heritage with authentic model names.

## Real-time Features
- **Live Bidding**: WebSocket connections for instant bid updates with SSE fallback.
- **Commercial Bidding Interface**: Sticky BidBar with real-time price updates and fee calculations.
- **Auction Status**: Real-time notifications and auction state management.
- **Soft Close Logic**: Dynamic auction extension with memory-based auction system.

## Security & Authorization
- **Production Security**: Helmet.js for security headers, CORS configuration, and compression middleware.
- **Enterprise Session Management**: PostgreSQL-backed sessions using connect-pg-simple with secure cookie configuration.
- **Role-based Access**: Admin privileges for listing approval.
- **Rate Limiting**: Throttling for bid and comment submissions.
- **Object Storage ACL**: Fine-grained access control for uploaded images.
- **Structured Logging**: Request/response logging with sensitive data masking.

## Business Logic
- **Auction Mechanics**: Reserve price handling, bid increment validation, and soft close.
- **Automated Processing**: Cron jobs for auction expiration, auto-bid execution, winner determination, object scanning/moderation, and thumbnail generation.
- **Email Automation**: Comprehensive notification system for winners, sellers, and transaction guidance.
- **Moderation Tools**: Admin dashboard for listing approval and user management.
- **Real-time Broadcasting**: SSE/WebSocket notifications for auction state changes.
- **File Upload System**: Supports 100MB file uploads including RAW photos (HEIC, HEIF, AVIF, WebP) via signed URLs and server-side multipart processing.
- **Vehicle Index Building**: Automated script system using make files and vPIC API with Wikidata fallback for comprehensive model data generation.

# External Dependencies

## Core Services
- **Replit Auth**: OpenID Connect authentication.
- **Replit Object Storage**: Primary image hosting.
- **PostgreSQL**: Primary database.

## Third-party Libraries
- **shadcn/ui + Radix UI**: Component library.
- **TanStack Query**: Data fetching and caching.
- **Uppy**: File upload handling.
- **Drizzle ORM**: Type-safe database operations.
- **Zod**: Runtime type validation.
- **Nodemailer**: Email notification system.
- **node-cron**: For scheduled jobs.