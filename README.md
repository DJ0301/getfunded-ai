# GetFunded.ai - Automated Fundraising Platform

A full-stack web application that automates fundraising for founders using AI-powered investor targeting, sourcing, and outreach.

## 🚀 Features

### Frontend (Vite + React)
- **Onboarding Flow**: Chat-style Q&A form for startup information
- **Investor Targeting**: AI-generated recommendations with accept/reject functionality
- **Investor Sourcing**: Real-time Google Sheet integration with investor data
- **Outreach Preparation**: Personalized email generation with tone selection
- **Pipeline Dashboard**: Kanban and table views for tracking investor interactions

### Backend (Node.js + Express)
- **AI Integration**: Groq API with Mixtral-8x7B and LLaMA-3-70B models
- **Email Service**: Fully functional Nodemailer with SMTP support
- **Google Sheets API**: Dynamic sheet creation and real-time updates
- **Pipeline Management**: Automated status tracking and webhook support

## 🛠️ Tech Stack

- **Frontend**: Vite, React, React Router, Framer Motion, Lucide Icons
- **Backend**: Node.js, Express, Nodemailer, Google Sheets API
- **AI**: Groq API (Mixtral-8x7B, LLaMA-3-70B)
- **Styling**: Custom CSS with modern design patterns

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Cloud Project with Sheets API enabled
- Groq API key
- SMTP email credentials (Gmail recommended)

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd getfunded-ai
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
```

## ⚙️ Configuration

### Backend Environment Variables (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Email Configuration (Required)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Google Sheets API (Required)
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"

# Groq AI API (Required)
GROQ_API_KEY=your-groq-api-key

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🔑 API Keys Setup

### 1. Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Create an account and generate an API key
3. Add to `GROQ_API_KEY` in backend .env

### 2. Google Sheets API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create a Service Account
5. Download the JSON key file
6. Extract `client_email` and `private_key` to .env

### 3. Email Configuration
For Gmail:
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use your Gmail and App Password in .env

### 4. Firebase Firestore (Database)
Firestore is used to persist the investor pipeline and related data.

Steps:
1. Go to the Firebase Console and create a project
2. In Project Settings → Service accounts → Generate new private key (Admin SDK)
3. Copy the following to your backend `.env` (recommend using dedicated FIREBASE_* vars):

```env
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
```

Notes:
- If you already have Google service account creds set via `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY`, the app will fallback to those if `FIREBASE_*` are not provided.
- The private key must preserve newlines. Escape as `\n` in `.env`.

## 🚀 Running the Application

### Development Mode
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production Mode
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## 📊 API Endpoints

### Founder Routes
- `POST /api/founder/input` - Process founder information
- `GET /api/founder/profile/:id` - Get founder profile

### Investor Routes
- `POST /api/investor/strategy` - Generate investor targeting strategy
- `POST /api/investor/sourcing` - Source investors and create Google Sheet
- `PUT /api/investor/update/:sheetId` - Update investor sheet

### Email Routes
- `POST /api/email/draft` - Generate personalized email drafts
- `POST /api/email/send` - Send individual emails
- `POST /api/email/bulk-send` - Send bulk emails
- `POST /api/email/follow-up` - Generate follow-up emails

### Pipeline Routes
- `GET /api/pipeline/:founderId` - Get pipeline data
- `PUT /api/pipeline/update` - Update pipeline status
- `POST /api/pipeline/webhook/calendly` - Calendly webhook
- `POST /api/pipeline/webhook/email` - Email webhook

## 🎯 Usage Flow

1. **Onboarding**: Complete the chat-style form with startup details
2. **Targeting**: Review and refine AI-generated investor strategy
3. **Sourcing**: AI sources relevant investors and creates Google Sheet
4. **Outreach**: Generate and customize personalized emails
5. **Pipeline**: Track responses and manage investor relationships

## 🔧 Features in Detail

### AI-Powered Investor Targeting
- Analyzes startup profile using Mixtral-8x7B
- Generates sector, geography, and stage recommendations
- Interactive refinement with clarification questions

### Intelligent Investor Sourcing
- Sources investors based on targeting strategy
- Creates dynamic Google Sheets with investor data
- Real-time updates and collaboration features

### Personalized Email Outreach
- LLaMA-3-70B powered email generation
- Multiple tone options (formal, friendly, high-energy)
- Calendly/Cal.com integration for meeting booking

### Pipeline Management
- Drag-and-drop Kanban board
- Automated status updates via webhooks
- Comprehensive analytics and reporting

## 🛡️ Security Features

- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- Environment variable protection

## 📈 Monitoring & Logging

- Morgan HTTP request logging
- Comprehensive error handling
- Email delivery tracking
- Pipeline status monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, email support@getfunded.ai or create an issue in the repository.

## 🔄 Changelog

See [CHANGELOG.md](./changelog.md) for version history and updates.
