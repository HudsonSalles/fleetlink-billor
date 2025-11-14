# FleetLink

A modern fleet management system built with React, TypeScript, and Firebase.

## Features

- 🚛 **Fleet Management**: Track trucks, drivers, and loads
- 📍 **Real-time Tracking**: Live location updates with Mapbox
- 👥 **User Management**: Role-based access control
- 📊 **Dashboard**: Analytics and reporting
- 📱 **Responsive Design**: Works on desktop and mobile
- 🧪 **Tested**: Comprehensive test suite with Jest and React Testing Library

## How to Run the Project

### Prerequisites

- Node.js (v16+)
- Firebase account
- Mapbox account

### Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/HudsonSalles/fleetLink.git
   cd fleetLink
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file with:

   ```env
   # Firebase Configuration
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id

   # Mapbox Configuration
   REACT_APP_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token

   # Development Configuration
   REACT_APP_USE_EMULATOR=false
   NODE_ENV=development
   ```

3. **Setup Firebase**

   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage
   ```

4. **Start the application**
   ```bash
   npm start
   ```
   Open http://localhost:3000

### Testing

```bash
# Run all tests
npm test

# Run tests without watch mode
npm test -- --watchAll=false

# Run tests with coverage
npm test -- --coverage
```

**Current Test Coverage:**

- ✅ **Login Authentication**: Form validation and submission
- ✅ **Driver Management**: Form operations (create/edit)
- ✅ **10/10 Tests Passing**: Comprehensive simplified test suite

### Demo Login

- Email: `admin@fleetlink.com`
- Password: `admin123`

---

📚 **Documentation**: See `documents/` folder for technical details and deployment guides.
