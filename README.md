# AgenticAI Google Photos - AI Travel Memory Mapper

An intelligent travel photo management system that uses AI to automatically organize, analyze, and search through your travel memories with spatial and temporal mapping.

## 🌟 Features

### Core Functionality
- **AI-Powered Photo Analysis**: GPT-4 Vision automatically describes scenes and tags content
- **Facial Recognition & Clustering**: AWS Rekognition identifies and groups people in photos
- **Smart Location Mapping**: Automatic GPS extraction and reverse geocoding with Mapbox
- **Natural Language Search**: Query photos using phrases like "beach photos from 2023 with my cousin"
- **Interactive Map View**: Visualize photo clusters by location with timeline integration
- **Auto-Generated Albums**: Create albums based on criteria (date range, location, people)

### Technical Features
- **Monorepo Architecture**: Organized TypeScript backend and React frontend
- **Real-time Processing**: Background AI analysis after upload
- **Scalable Storage**: AWS S3 with automatic thumbnail generation
- **Modern UI/UX**: Beautiful, responsive interface built with Tailwind CSS
- **Type Safety**: Full TypeScript implementation across the stack

## 🏗️ Architecture

```
AgenticAI_GooglePhotos/
├── packages/
│   ├── backend/          # Node.js + TypeScript + Express API
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── services/ # Business logic (AI, Storage, Geocoding)
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   └── prisma/       # Database schema
│   └── frontend/         # React + TypeScript + Vite
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/ # API client
│       │   └── store/    # Zustand state management
└── docs/
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + bcrypt
- **File Storage**: AWS S3 + Sharp (image processing)
- **AI Services**: 
  - OpenAI GPT-4 Vision (image analysis)
  - AWS Rekognition (facial recognition)
- **Geolocation**: Mapbox Geocoding API
- **Image Processing**: EXIF extraction + thumbnail generation

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router
- **Maps**: Mapbox GL JS
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Lucide React icons

## 🚀 Complete Setup Guide

Follow these steps carefully to set up your development environment.

### Prerequisites

Before starting, ensure you have:
- **Node.js 18+** and **npm 9+** installed
- **PostgreSQL** database installed and running
- **Git** for cloning the repository

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/ashwinmv14/AgenticAI_GooglePhotos.git
cd AgenticAI_GooglePhotos

# Install all dependencies (this will install for both frontend and backend)
npm install
```

### Step 2: Database Setup

#### Install PostgreSQL (if not already installed)

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**On macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**On Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

#### Create Database
```bash
# Switch to postgres user (Linux/macOS)
sudo -u postgres psql

# Or connect directly if you have user access
psql -U postgres

# In PostgreSQL shell, create database and user
CREATE DATABASE travel_mapper;
CREATE USER travel_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE travel_mapper TO travel_user;
\q
```

### Step 3: API Keys and Service Setup

You'll need to obtain API keys from several services. Here's how to get each one:

#### 3.1 OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up/Login to your account
3. Go to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-...`)
6. **Important**: Add billing information and credits to your OpenAI account

#### 3.2 AWS Setup (S3 + Rekognition)
1. **Create AWS Account**: Visit [AWS Console](https://aws.amazon.com/)
2. **Create IAM User**:
   ```bash
   # Go to IAM → Users → Create User
   # Username: travel-memory-app
   # Attach policies:
   # - AmazonS3FullAccess
   # - AmazonRekognitionFullAccess
   ```
3. **Get Access Keys**:
   - Go to the user → Security credentials
   - Create access key → Application running outside AWS
   - Copy Access Key ID and Secret Access Key

4. **Create S3 Bucket**:
   ```bash
   # Install AWS CLI if not installed
   pip install awscli
   
   # Configure AWS CLI
   aws configure
   # Enter your Access Key ID, Secret Access Key, region (e.g., us-east-1)
   
   # Create S3 bucket (name must be globally unique)
   aws s3 mb s3://your-unique-bucket-name --region us-east-1
   ```

5. **Setup Rekognition Collection**:
   ```bash
   # Create face collection for facial recognition
   aws rekognition create-collection --collection-id travel-faces --region us-east-1
   ```

6. **Configure S3 CORS** (create `cors.json` file):
   ```json
   {
     "CORSRules": [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "AllowedOrigins": ["http://localhost:5173", "http://localhost:3000"],
         "ExposeHeaders": []
       }
     ]
   }
   ```
   
   Then apply CORS:
   ```bash
   aws s3api put-bucket-cors --bucket your-unique-bucket-name --cors-configuration file://cors.json
   ```

#### 3.3 Mapbox Setup
1. Visit [Mapbox](https://www.mapbox.com/)
2. Sign up for a free account
3. Go to **Account → Access tokens**
4. Copy the **Default public token** (starts with `pk.`)
5. For production, create a new token with restricted permissions

### Step 4: Environment Configuration

#### Backend Environment Setup
```bash
# Navigate to backend directory
cd packages/backend

# Copy environment template
cp .env.example .env

# Edit the .env file with your actual values
nano .env  # or use your preferred editor
```

**Edit `packages/backend/.env` with your values:**
```env
# Database
DATABASE_URL="postgresql://travel_user:your_password@localhost:5432/travel_mapper"

# JWT (generate a strong secret)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random"
JWT_EXPIRES_IN="7d"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-unique-bucket-name"

# AWS Rekognition
AWS_REKOGNITION_COLLECTION_ID="travel-faces"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key-here"

# Mapbox
MAPBOX_ACCESS_TOKEN="pk.your-mapbox-token-here"

# Server
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"

# File Upload
MAX_FILE_SIZE="10485760"
ALLOWED_MIME_TYPES="image/jpeg,image/png,image/webp"
```

#### Frontend Environment Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Create environment file
touch .env.local

# Edit the file
nano .env.local
```

**Add to `packages/frontend/.env.local`:**
```env
VITE_API_URL=http://localhost:3001/api
VITE_MAPBOX_TOKEN=pk.your-mapbox-token-here
```

### Step 5: Database Schema Setup

```bash
# Navigate back to backend directory
cd ../backend

# Generate Prisma client
npm run db:generate

# Push database schema (creates tables)
npm run db:push

# Optional: Seed database with sample data
npm run db:seed
```

### Step 6: Run the Application

```bash
# Navigate back to project root
cd ../..

# Start both frontend and backend
npm run dev

# This will start:
# - Backend API on http://localhost:3001
# - Frontend app on http://localhost:5173
```

**Alternative - Run separately:**
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend
```

### Step 7: Verify Setup

1. **Open your browser** to `http://localhost:5173`
2. **Create an account** or login
3. **Upload a test photo** with GPS data
4. **Check that**:
   - Photo uploads to S3
   - AI analysis works (descriptions appear)
   - Map shows photo location
   - Search functionality works

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Development
npm run dev              # Both frontend and backend
npm run dev:backend      # Backend only (port 3001)
npm run dev:frontend     # Frontend only (port 5173)

# Build
npm run build           # Build both projects
npm run build:backend   # Build backend only
npm run build:frontend  # Build frontend only

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes
npm run db:migrate      # Run migrations

# Testing & Linting
npm test               # Run tests
npm run lint          # Lint code
```

## 🔧 Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U travel_user -d travel_mapper -h localhost
```

**2. AWS S3 Upload Fails**
- Verify AWS credentials in `.env`
- Check S3 bucket permissions
- Ensure CORS is configured correctly

**3. OpenAI API Errors**
- Verify API key is correct
- Check OpenAI account has credits
- Ensure billing is set up

**4. Port Already in Use**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**5. Module Not Found Errors**
```bash
# Clear and reinstall
npm run clean
npm install
```

## 📊 Cost Estimation

### Monthly Costs (10 users, 500 photos)
| Service | Estimated Cost |
|---------|----------------|
| AWS S3 Storage | $0.06 |
| AWS Rekognition | $0.80 |
| OpenAI GPT-4 Vision | $6.38 |
| Mapbox Geocoding | $0.25 |
| PostgreSQL (managed) | $15.00 |
| **Total** | **~$22.49/month** |

### Free Tier Benefits
- **AWS**: 12 months free tier includes S3 storage
- **OpenAI**: $5 free credits for new accounts
- **Mapbox**: 100,000 free requests/month

## 🔒 Security Considerations

- Change default JWT secret in production
- Use environment variables for all secrets
- Configure proper CORS origins
- Set up rate limiting in production
- Use HTTPS in production
- Regular security updates

## 🚀 Deployment

For production deployment:
1. Use managed PostgreSQL (AWS RDS, etc.)
2. Set `NODE_ENV=production`
3. Configure production CORS origins
4. Use CDN for static assets
5. Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 📞 Support

For issues and questions:
- **GitHub Issues**: [Create an issue](https://github.com/ashwinmv14/AgenticAI_GooglePhotos/issues)
- **Documentation**: Check this README
- **API Reference**: See backend routes documentation

---

**Built with ❤️ for organizing travel memories intelligently using AI**