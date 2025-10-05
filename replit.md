# Overview

This is a real-time vehicle auction platform built with React and Express, allowing users to browse and bid on cars and motorcycles. The application features live bidding functionality with WebSocket connections, advanced filtering options, and a modern Japanese-language interface. Users can view detailed vehicle information, participate in timed auctions, and receive real-time updates on bid activities.

# Recent Changes

## Auto-Filter Shaken Expiration Dates (2025-10-05)
- **Added**: Automatic filtering of 車検 (vehicle inspection) expiration months
- **Behavior**: 
  - When selecting current year (2025), only months from current month onwards are shown
  - When selecting future years, all 12 months are available
  - Updates automatically each month (e.g., in November, only Nov-Dec shown for 2025)
- **File Modified**: `client/src/pages/CreateListing.tsx` lines 2436-2472
- **Impact**: Users can only select valid future 車検 expiration dates

## Listing Status Fix (2025-10-05)
- **Fixed**: New listings now appear in admin dashboard's "pending" tab
- **Issue**: Listings were created with status "draft" but admin dashboard only showed "submitted" listings
- **Solution**: Changed listing creation to use status "submitted" instead of "draft"
- **File Modified**: `client/src/pages/CreateListing.tsx` line 288
- **Impact**: All new listings now immediately visible to administrators for approval

## Listing Schedule Management (2025-10-05)
- **Changed**: Listing start/end dates are now set by administrators instead of sellers
- **Behavior**: When sellers create listings, `startAt` and `endAt` are set to `null`
- **Admin Control**: Administrators use the schedule dialog in AD to set auction start and end times
- **Display**: LD and other pages show "未定" (TBD) when `endAt` is null
- **Benefits**: Ensures consistent auction scheduling across the platform

# User Preferences

Preferred communication style: Simple, everyday language.

## Page Reference Codes (2-Letter System)
When referring to pages in instructions, use these short codes:
- **CR** → 出品作成ページ (/create)
- **PV** → プレビューページ (/preview/:id)
- **AD** → 管理画面 (/admin)
- **ADL** → 管理画面出品詳細 (/admin/listings/:id)
- **LS** → 出品一覧/ホーム (/)
- **LD** → 出品詳細 (/listing/:slug)
- **SP** → 出品者プロフィール (/seller/:id)
- **PR** → プロフィール (/profile)
- **ST** → 設定 (/settings)
- **WL** → ウォッチリスト (/watch)

Example usage: "CRで市を追加して" instead of "出品作成ページで市を追加して"

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: Custom WebSocket hook for live bid updates
- **Form Handling**: React Hook Form with Zod validation through Hookform resolvers

## Backend Architecture
- **Runtime**: Node.js with Express.js framework using TypeScript
- **API Design**: RESTful endpoints for vehicle and bid management
- **Real-time Communication**: WebSocket server for live bid broadcasting
- **Storage**: In-memory storage implementation with interface for easy database migration
- **Error Handling**: Centralized error middleware with structured error responses

## Data Storage
- **ORM**: Drizzle ORM configured for PostgreSQL (Neon Database)
- **Database Schema**: Structured tables for users, vehicles, bids, and favorites
- **Current Implementation**: MemStorage class for development with sample data initialization
- **Migration Strategy**: Database migrations managed through Drizzle Kit

## Key Features
- **Auction System**: Timed auctions with countdown timers and automatic bid validation
- **Real-time Bidding**: WebSocket-based live updates for bid changes across all connected clients
- **Advanced Filtering**: Multi-parameter search including category, price range, year, brand, and text search
- **Responsive Design**: Mobile-first approach with Tailwind CSS utilities
- **Internationalization**: Japanese language interface with proper typography and formatting

## File Upload Integration
- **Upload Library**: Uppy.js with AWS S3 integration for vehicle image handling
- **Components**: File input, drag-drop, progress tracking, and dashboard interfaces

# External Dependencies

## Core Framework Dependencies
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing solution
- **drizzle-orm** & **drizzle-kit**: Database ORM and migration tools
- **@neondatabase/serverless**: PostgreSQL database connection

## UI and Styling
- **@radix-ui/***: Comprehensive set of UI primitives for accessible components
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

## Form and Validation
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Form validation integration
- **zod**: Schema validation library

## File Upload
- **@uppy/core**, **@uppy/aws-s3**, **@uppy/dashboard**: File upload handling with cloud storage

## Payment Processing
- **@stripe/stripe-js** & **@stripe/react-stripe-js**: Payment processing integration

## Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety and development experience
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production builds

## Replit-Specific Integrations
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code mapping for debugging
- **@replit/vite-plugin-dev-banner**: Development environment indicators