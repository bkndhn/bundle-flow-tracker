# Goods Movement Tracker

A comprehensive mobile-responsive web application for tracking goods movement between a godown and two shops (big shop and small shop).

## Features

### Authentication
- **Admin**: `admin@goods.com` / `Goodsans7322`
- **Godown Manager**: `manager@godown` / `Gdndis65` 
- **Small Shop Manager**: `manager@smallshop` / `Mngrss78`
- **Big Shop Manager**: `manager@bigshop` / `Mngrbs78`

### Core Functionality

#### Dashboard
- Recent movements and activities overview
- Available only for admin users

#### Dispatch Module
- **Timestamp**: Auto-filled with current time
- **Destination**: Dropdown (Big Shop, Small Shop, Both)
- **Item Type**: Dropdown (Shirt, Pant, Both) - shown based on destination
- **Bundle Inputs**: Dynamic based on item selection
- **Auto Fare**: Payment options (Paid by Sender, To be paid by Big/Small Shop)
- **Accompanying Person**: Person traveling with auto
- **Auto Name**: Vehicle identification
- **Notes**: Additional comments

#### Business Logic
- If destination is "small shop" or "big shop": Show item selection
- If item is "shirt" or "pant": Show single bundle input
- If item is "both": Show separate inputs for shirt and pant bundles with auto-calculated total
- If destination is "both": Show table format for big shop and small shop with individual inputs
- Generate separate dispatches for each shop when destination is "both"

#### Receive Module
- View dispatch details for verification
- Role-based receiving (only respective shop staff can receive)
- Received by dropdown with staff selection
- Notes for condition/comments

#### Reports
- Generate reports with timestamps after items are received
- Filter and search functionality
- Export capabilities

#### Admin Module
- Add new staff members
- Manage user roles and locations

## Technical Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: ShadCN UI + Tailwind CSS
- **Backend**: Supabase (Authentication + Database)
- **State Management**: React Query + Context API

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Open http://localhost:5173 in your browser
   - The app is fully mobile-responsive

### Database Setup (Optional - for local development)

If you want to run Supabase locally:

1. **Install Docker Desktop**
   - Download from https://docs.docker.com/desktop

2. **Start Supabase locally**
   ```bash
   npx supabase start
   ```

3. **Apply migrations**
   ```bash
   npx supabase db reset
   ```

### Production Database

The app is already configured to connect to a remote Supabase instance. All predefined users and database schema are set up.

## User Roles & Permissions

- **Admin**: Full access to dashboard, reports, staff management
- **Godown Manager**: Dispatch goods, view reports
- **Shop Managers**: Receive goods for their respective shops, view reports

## Mobile Responsiveness

The application is fully optimized for mobile devices with:
- Touch-friendly interfaces
- Responsive layouts
- Mobile-first design approach
- Optimized forms for mobile input

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Notes

- Only login functionality is implemented (no signup)
- User credentials are predefined in the database
- Role-based access control ensures proper permissions
- All forms include comprehensive validation
