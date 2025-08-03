# AI Travel Memory Mapper

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
ai-travel-memory-mapper/
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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL database
- AWS account (S3, Rekognition)
- OpenAI API key
- Mapbox account

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd ai-travel-memory-mapper
npm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb travel_mapper

# Navigate to backend
cd packages/backend

# Copy environment template
cp .env.example .env

# Edit .env with your database URL and API keys
# DATABASE_URL="postgresql://username:password@localhost:5432/travel_mapper"

# Generate Prisma client and run migrations
npm run db:generate
npm run db:push
```

### 3. Environment Configuration

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/travel_mapper"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="travel-memory-photos"

# AWS Rekognition
AWS_REKOGNITION_COLLECTION_ID="travel-faces"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# Mapbox
MAPBOX_ACCESS_TOKEN="pk.your-mapbox-token"

# Server
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

#### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:3001/api
VITE_MAPBOX_TOKEN=pk.your-mapbox-token
```

### 4. AWS Setup

#### S3 Bucket
```bash
# Create S3 bucket (replace with your bucket name)
aws s3 mb s3://travel-memory-photos --region us-east-1

# Configure CORS policy for the bucket
aws s3api put-bucket-cors --bucket travel-memory-photos --cors-configuration file://cors.json
```

#### Rekognition Collection
```bash
# Create face collection
aws rekognition create-collection --collection-id travel-faces --region us-east-1
```

### 5. Run the Application
```bash
# From project root - runs both frontend and backend
npm run dev

# Or run separately:
npm run dev:backend   # Backend on http://localhost:3001
npm run dev:frontend  # Frontend on http://localhost:5173
```

## 📊 Cost Analysis (10 Users, 500 Photos)

### Monthly Operational Costs

#### AWS Services
- **S3 Storage**: 
  - Photos (500 × 5MB avg): 2.5GB
  - Thumbnails (500 × 100KB): 50MB
  - **Total**: ~2.6GB × $0.023/GB = **$0.06/month**

- **S3 Requests**:
  - Uploads: 500 PUT requests = $0.0005
  - Downloads: ~2000 GET requests = $0.0004
  - **Total**: **$0.001/month**

- **Rekognition**:
  - Face detection: 500 images × $0.001 = $0.50
  - Face indexing: ~200 faces × $0.001 = $0.20
  - Face search: ~100 searches × $0.001 = $0.10
  - **Total**: **$0.80/month**

#### OpenAI API
- **GPT-4 Vision**:
  - 500 image analyses
  - High detail images: ~$0.01276 per image
  - **Total**: **$6.38/month**

#### Mapbox
- **Geocoding API**:
  - 500 reverse geocoding requests
  - $0.50 per 1,000 requests
  - **Total**: **$0.25/month**

#### Database & Hosting
- **PostgreSQL**: $10-25/month (managed service)
- **Backend Hosting**: $10-20/month (1-2 instances)
- **Frontend Hosting**: $0-5/month (static hosting)

### Total Monthly Cost Breakdown
| Service | Cost |
|---------|------|
| AWS S3 | $0.06 |
| AWS Rekognition | $0.80 |
| OpenAI GPT-4 Vision | $6.38 |
| Mapbox Geocoding | $0.25 |
| Database (PostgreSQL) | $15.00 |
| Backend Hosting | $15.00 |
| Frontend Hosting | $2.00 |
| **TOTAL** | **~$39.49/month** |

### Per-User Costs
- **10 users, 500 photos total**: **$3.95 per user/month**
- **Per photo processing**: **$0.079 per photo**

### Scaling Projections
- **100 users, 5,000 photos**: ~$200/month ($2/user)
- **1,000 users, 50,000 photos**: ~$1,500/month ($1.50/user)

## 🔧 Development

### Available Scripts
```bash
# Install dependencies
npm install

# Development
npm run dev              # Both frontend and backend
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

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

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

#### Photos
- `POST /api/photos/upload` - Single photo upload
- `POST /api/photos/upload-batch` - Multiple photo upload
- `GET /api/photos` - Get user photos with filters
- `DELETE /api/photos/:id` - Delete photo

#### Search
- `GET /api/search?q=query` - Natural language search
- `GET /api/search/clusters` - Get photo clusters by location
- `GET /api/search/timeline` - Get timeline view

#### Albums
- `GET /api/albums` - Get user albums
- `POST /api/albums` - Create album
- `POST /api/albums/auto-generate` - Auto-generate album

## 🔒 Security Features

- JWT authentication with secure token storage
- Input validation and sanitization
- Rate limiting on API endpoints
- File type and size validation
- CORS configuration
- Environment variable protection
- SQL injection prevention (Prisma ORM)

## 🚀 Deployment

### Production Environment Variables
Ensure all environment variables are set in production:
- Use strong JWT secrets
- Configure proper CORS origins
- Set NODE_ENV=production
- Use production database URLs
- Configure proper AWS IAM roles

### Database Migration
```bash
# Production migration
npm run db:migrate
```

### Build for Production
```bash
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details.

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Built with ❤️ for organizing travel memories intelligently**