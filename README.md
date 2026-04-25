# CyberShield - AI-Powered Instagram Fake Profile Detector

A cybersecurity tool that analyzes Instagram profiles to detect fake accounts, cyberstalkers, and potential scammers using AI-powered analysis.

## Features

- **AI Risk Analysis**: Uses Google Gemini AI to analyze profile data and assign risk scores
- **Instagram Profile Scraping**: Fetches profile data via Apify Instagram Profile Scraper
- **Threat Detection**: Identifies suspicious patterns, toxic terms, and contact numbers
- **Real-time Scanning**: Instant analysis with visual risk indicators
- **Scan History**: Track previous scans with statistics dashboard
- **Dark Cybersecurity UI**: High-contrast "Control Room" aesthetic

## Tech Stack

- **Frontend**: React 18 + Tailwind CSS + Radix UI + Recharts
- **Backend**: FastAPI + Google Gemini API
- **Data Source**: Apify Instagram Profile Scraper
- **AI Model**: Google Gemini 2.5 Flash Lite
- **Deployment**: Vercel (Fullstack Serverless)

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Google Gemini API Key ([Get one free](https://aistudio.google.com/app/apikey))
- Apify API Key ([Get one here](https://console.apify.com/account/integrations))

### Local Development

```bash
# Clone the repo
git clone <repo-url>
cd cyber-shield-app

# Setup backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn server:app --reload --port 8001

# Setup frontend (new terminal)
cd frontend
npm install
npm start
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8001

### Environment Variables

Create `.env` in `/backend`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
APIFY_API_KEY=your_apify_api_key_here
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Framework Preset: Create React App
   - Root Directory: `./`

3. **Add Environment Variables** in Vercel Dashboard:
   - `GEMINI_API_KEY` - Your Google Gemini API key
   - `APIFY_API_KEY` - Your Apify API key

4. **Deploy**:
   - Vercel will automatically build and deploy both frontend and backend

## How It Works

1. **User enters Instagram URL** (e.g., `https://instagram.com/username`)
2. **Apify fetches profile data** (bio, followers, posts, verification status)
3. **Gemini AI analyzes** the structured data for risk factors:
   - Follower/following ratio anomalies
   - Suspicious bio patterns
   - Contact numbers in bio
   - Verification status
4. **Risk score calculated** (0-100) with classification:
   - **Safe** (0-34): No risk indicators
   - **Medium Risk** (35-64): Some suspicious patterns
   - **High Risk** (65-100): Likely fake/scammer

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/` | GET | Health check |
| `/api/detect` | POST | Analyze Instagram profile |
| `/api/scans` | GET | List scan history |
| `/api/scans/stats` | GET | Get scan statistics |
| `/api/scans/{id}` | DELETE | Delete a scan |

### Example Request

```bash
curl -X POST http://localhost:8001/api/detect \
  -H "Content-Type: application/json" \
  -d '{"url": "https://instagram.com/nasa", "platform": "instagram"}'
```

## Project Structure

```
cyber-shield-app/
├── api/                    # Vercel serverless functions
│   └── index.py           # API entry point
├── backend/
│   ├── server.py          # FastAPI application
│   └── requirements.txt   # Python dependencies
├── frontend/              # React application
│   ├── src/
│   │   ├── pages/        # Dashboard, History, etc.
│   │   ├── components/   # UI components
│   │   └── lib/          # API client, utilities
│   └── package.json
├── vercel.json           # Vercel configuration
└── README.md
```

## License

MIT
