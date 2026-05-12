# ReelRead

ReelRead turns Instagram Reels and TikTok videos into clean, structured text summaries — delivered directly on WhatsApp. Built for job seekers who are tired of saving career advice videos they never go back to.

## How It Works

1. Send any Instagram Reel or TikTok link to ReelRead on WhatsApp
2. ReelRead reads the audio, on-screen text, and caption simultaneously
3. Get a clean structured summary in seconds

## What Makes It Different

Most tools only transcribe audio. ReelRead reads three sources at once:

- Audio transcribed via OpenAI Whisper
- On-screen text extracted via Claude Vision OCR
- Caption pulled from video metadata

All three are merged, deduplicated, and summarized by Claude into a single clean output.

## Project Structure

```
reelread/
├── backend/     FastAPI Python bot
└── web/         Next.js dashboard
```

## Tech Stack

**Backend:**
- Python 3.14 + FastAPI
- Twilio (WhatsApp messaging)
- yt-dlp (video downloading)
- OpenAI Whisper (audio transcription)
- Anthropic Claude (Vision OCR + summarization)
- Supabase (database)
- FFmpeg (audio processing)

**Frontend:**
- Next.js 14 + TypeScript
- Tailwind CSS
- Supabase Auth
- Twilio Verify (phone OTP)
- Vercel (deployment)

## Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env         # fill in your keys
cp app/prompts.example.py app/prompts.py  # fill in your prompts
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd web
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

## Prerequisites

- Python 3.14+
- Node.js 18+
- FFmpeg installed and in PATH
- Twilio account with WhatsApp sandbox
- Anthropic API key
- OpenAI API key
- Supabase project

## Prompts Setup

ReelRead uses a separate prompts file that is not committed to git.

1. Copy `backend/app/prompts.example.py` to `backend/app/prompts.py`
2. Fill in your prompts in `backend/app/prompts.py`
3. Never commit `backend/app/prompts.py` to git

## Deployment

Backend deploys to Railway. Frontend deploys to Vercel. Both connect to the same GitHub repo — Railway watches `/backend`, Vercel watches `/web`.

## What I Learned Building This

This was my first time building a WhatsApp bot. Key things I learned:

- WhatsApp bot architecture with Twilio webhooks
- FastAPI async background tasks and webhook handling
- OpenAI Whisper API for audio transcription
- Claude Vision API for OCR on video frames
- yt-dlp for downloading social media content
- Handling Instagram rate limiting with cookies
- Message ordering issues in WhatsApp
- FFmpeg for audio extraction and processing
- Supabase for database and real-time operations
- Next.js 14 with TypeScript for the dashboard
- Phone OTP authentication with Twilio Verify
- Deploying Python to Railway
- Deploying Next.js to Vercel

## Screenshots

*Coming soon*

## License

MIT
