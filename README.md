# FixItNow - Maintenance Management System

A modern, full-stack maintenance management application built with Next.js 16, Firebase Authentication, and MongoDB.

## 🚀 Features

- **Multi-Method Authentication**
  - Email/Password authentication
  - Phone number authentication with SMS verification
  - Social login (Google, Facebook, Apple)
  - Firebase Auth + MongoDB data storage

- **Role-Based Access Control**
  - Admin: Full system access
  - Technician: Ticket management and technician board
  - Resident: Create and track maintenance requests

- **Ticket Management**
  - Create, view, and track maintenance tickets
  - Priority levels (low, medium, high, urgent)
  - Status tracking (open, in-progress, resolved, closed)
  - Assignment to technicians

- **Dashboard**
  - Role-specific views
  - Real-time statistics
  - Recent activity tracking

- **Settings & Preferences**
  - Profile management
  - Password change
  - Notification preferences
  - App configuration

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Headless UI
- **Animation**: Framer Motion
- **Authentication**: Firebase Auth
- **Database**: MongoDB
- **Build Tool**: Next.js App Router

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 8.2.1+ (local or MongoDB Atlas)
- Firebase account with project setup

## ⚙️ Setup Instructions

### 1. Clone and Install

```bash
cd fixitnow
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
copy .env.example .env.local
```

Edit `.env.local` and add your credentials:

**Firebase Configuration:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to Project Settings > General
4. Scroll to "Your apps" and add a Web app
5. Copy the configuration values to `.env.local`

**MongoDB Configuration:**
- **Local**: `mongodb://localhost:27017/fixitnow`
- **Atlas**: Get connection string from MongoDB Atlas dashboard

### 3. Firebase Setup

Enable authentication methods in Firebase Console:

1. Go to Authentication > Sign-in method
2. Enable:
   - Email/Password
   - Phone (requires reCAPTCHA setup)
   - Google (requires OAuth client setup)
   - Facebook (requires Facebook App setup)
   - Apple (requires Apple Developer setup)

### 4. Database Initialization

Initialize MongoDB collections:

```bash
node scripts/init-db.js
```

This creates 5 collections:
- `users` - User accounts and profiles
- `tickets` - Maintenance tickets
- `technicians` - Technician profiles
- `preventive_maintenance` - Scheduled maintenance
- `dashboard_stats` - Dashboard statistics

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
fixitnow/
├── app/
│   ├── api/              # API routes
│   │   ├── users/        # User management endpoints
│   │   └── test-db/      # Database testing
│   ├── auth/             # Authentication pages
│   │   ├── signin/       # Sign-in page
│   │   └── signup/       # Sign-up page
│   ├── components/       # Reusable components
│   │   ├── NavBar.tsx    # Navigation with role-based links
│   │   └── ...
│   ├── dashboard/        # Dashboard page
│   ├── settings/         # Settings page
│   ├── lib/              # Utilities and configuration
│   │   ├── firebaseClient.ts  # Firebase auth client
│   │   ├── mongodb.ts         # MongoDB connection
│   │   ├── authHelpers.ts     # Auth utilities
│   │   └── config.ts          # App configuration
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── scripts/              # Database scripts
│   ├── init-db.js        # Initialize collections
│   ├── test-db.js        # Test database operations
│   └── check-db.js       # Check database status
├── .env.local            # Environment variables (not in git)
├── .env.example          # Example environment file
├── next.config.ts        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.mjs     # ESLint configuration
└── package.json          # Dependencies
```

## 🔐 Authentication Flow

1. **Sign Up**:
   - User creates account with email/phone or social provider
   - Firebase creates authentication account
   - API syncs user data to MongoDB
   - Auto-creates technician profile if role is 'technician'

2. **Sign In**:
   - User authenticates with Firebase
   - Token stored in localStorage
   - User profile synced to MongoDB
   - Redirected to dashboard

3. **Session Management**:
   - Firebase handles session tokens
   - MongoDB stores user data and preferences
   - Role-based navigation and access control

## 🎨 Configuration

### App Configuration (`app/lib/config.ts`)

Centralized configuration for:
- Feature flags
- API settings
- Authentication providers
- Database collections
- UI theme
- Roles and permissions
- File uploads
- Notifications

### Next.js Configuration (`next.config.ts`)

- React strict mode enabled
- Image optimization for Firebase Storage, Google, Facebook
- Security headers (X-Frame-Options, CSP, etc.)
- Package import optimization

### Environment Variables

Required variables in `.env.local`:

```env
# Firebase (required)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# MongoDB (required)
MONGODB_URI=mongodb://localhost:27017/fixitnow

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🧪 Testing

### Database Tests

```bash
# Test all database operations
node scripts/test-db.js

# Check database status
node scripts/check-db.js
```

### Manual Testing Checklist

- [ ] Email/password sign-up and sign-in
- [ ] Phone number authentication (requires Firebase setup)
- [ ] Google sign-in (requires OAuth setup)
- [ ] Facebook sign-in (requires Facebook App)
- [ ] Apple sign-in (requires Apple Developer)
- [ ] Dashboard loads with correct role content
- [ ] Navigation shows role-appropriate links
- [ ] Settings page profile update
- [ ] Password change functionality
- [ ] Sign-out redirects to landing page

## 📱 Pages

- `/` - Landing page with features and CTA
- `/auth/signin` - Sign-in page (email/phone/social)
- `/auth/signup` - Sign-up page with role selection
- `/dashboard` - Main dashboard (authenticated)
- `/settings` - User settings and preferences
- `/tickets` - Ticket management (TODO)
- `/technicians` - Technician directory (TODO)
- `/reports` - Admin reports (TODO)
- `/profile` - User profile (TODO)

## 🎯 Role-Based Navigation

| Page | Admin | Technician | Resident |
|------|-------|------------|----------|
| Dashboard | ✅ | ✅ | ✅ |
| Tickets | ✅ | ✅ | ✅ |
| Technicians | ✅ | ✅ | ❌ |
| Reports | ✅ | ❌ | ❌ |
| Settings | ✅ | ✅ | ✅ |

## 🚧 Roadmap

- [ ] Complete ticket management system
- [ ] Technician assignment and scheduling
- [ ] Real-time notifications
- [ ] Analytics and reporting
- [ ] Mobile responsiveness improvements
- [ ] File upload for tickets
- [ ] Preventive maintenance scheduling
- [ ] Email notifications
- [ ] Admin dashboard enhancements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Start MongoDB service (Windows)
net start MongoDB
```

### Firebase Auth Errors
- Verify all credentials in `.env.local`
- Check Firebase Console for enabled auth methods
- Ensure domains are whitelisted in Firebase Auth settings

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## 📞 Support

For issues or questions, please check:
1. This README
2. Firebase documentation
3. MongoDB documentation
4. Next.js documentation

