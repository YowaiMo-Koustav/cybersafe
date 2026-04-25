from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
import os
import json
import logging
import uuid
import re
import httpx
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR.parent / ".env")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-lite")
APIFY_API_KEY = os.environ.get("APIFY_API_KEY", "")
APIFY_INSTAGRAM_ACTOR = os.environ.get("APIFY_INSTAGRAM_ACTOR", "dSCLg0C3YEZ83HzYX")
APP_PUBLIC_URL = os.environ.get("APP_PUBLIC_URL", "http://localhost")
APP_NAME = os.environ.get("APP_NAME", "CyberShield")
app = FastAPI(title="CyberShield Detection API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("cybershield")

_scans_store: List[dict] = []
DEFAULT_USER_ID = "anonymous"

if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)
else:
    gemini_client = None

class DetectInput(BaseModel):
    url: str = Field(min_length=5, max_length=500)
    platform: str = Field(default="instagram")

class RiskFactor(BaseModel):
    label: str
    score: int
    description: str

class ScanResult(BaseModel):
    id: str
    user_id: str
    username: str
    platform: str
    profile_url: Optional[str] = None
    risk_score: int
    classification: str
    factors: List[RiskFactor]
    toxic_flags: List[str]
    contact_numbers: List[str] = []
    ai_insight: str
    alert: Optional[str] = None
    created_at: datetime

def _extract_username(url: str) -> str:
    try:
        clean = url.strip().rstrip("/")
        parts = clean.split("/")
        candidate = parts[-1] or (parts[-2] if len(parts) > 1 else "profile")
        candidate = candidate.split("?")[0]
        candidate = re.sub(r"[^a-zA-Z0-9._-]", "", candidate)
        return candidate[:80] or "profile"
    except Exception:
        return "profile"

async def _fetch_apify_instagram(profile_url: str) -> dict:
    if not APIFY_API_KEY or APIFY_API_KEY == "your_apify_api_key_here":
        logger.warning("APIFY_API_KEY not configured")
        return {}
    username = _extract_username(profile_url)
    if not username:
        logger.warning(f"Could not extract username from URL: {profile_url}")
        return {}
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(65.0)) as client:
            run_url = f"https://api.apify.com/v2/acts/{APIFY_INSTAGRAM_ACTOR}/runs"
            headers = {"Authorization": f"Bearer {APIFY_API_KEY}", "Content-Type": "application/json"}
            run_input = {"usernames": [username], "includeAboutSection": True}
            run_response = await client.post(run_url, headers=headers, json=run_input)
            run_response.raise_for_status()
            run_data = run_response.json()
            run_id = run_data["data"]["id"]
            dataset_id = run_data["data"]["defaultDatasetId"]
            status_url = f"https://api.apify.com/v2/actor-runs/{run_id}"
            for _ in range(30):
                await asyncio.sleep(2)
                status_response = await client.get(status_url, headers=headers)
                status_response.raise_for_status()
                status_data = status_response.json()
                status = status_data["data"]["status"]
                if status == "SUCCEEDED":
                    break
                elif status in ["FAILED", "ABORTED", "TIMED-OUT"]:
                    logger.warning(f"Apify run failed with status: {status}")
                    return {}
            else:
                logger.warning("Apify run timed out waiting for completion")
                return {}
            dataset_url = f"https://api.apify.com/v2/datasets/{dataset_id}/items"
            items_response = await client.get(dataset_url, headers=headers)
            items_response.raise_for_status()
            items = items_response.json()
            if not items:
                logger.warning(f"Apify returned no data for username: {username}")
                return {}
            return items[0]
    except asyncio.TimeoutError:
        logger.warning(f"Apify fetch timed out for {profile_url}")
        return {}
    except httpx.HTTPStatusError as e:
        logger.warning(f"Apify HTTP error: {e.response.status_code} - {e.response.text[:200]}")
        return {}
    except Exception as e:
        logger.warning(f"Apify fetch failed for {profile_url}: {e}")
        return {}

ANALYSIS_SYSTEM = (
    "You are a senior cybersecurity analyst specializing in detecting fake profiles and cyberstalkers "
    "on Instagram. You will receive structured profile data including: username, bio, follower counts, "
    "post count, verification status, business category, external links, and latest posts.\n\n"
    "Return ONLY a valid JSON object (no markdown, no prose outside JSON) with this exact schema:\n"
    "{\n"
    '  "risk_score": <integer 0-100>,\n'
    '  "classification": "Safe" | "Medium Risk" | "High Risk",\n'
    '  "summary": "<1-2 sentence concise analysis>",\n'
    '  "red_flags": [{"label": "<short>", "score": <int 5-30>, "description": "<brief>"}],\n'
    '  "toxic_terms": ["<term1>", "<term2>"],\n'
    '  "suspicious_snippets": ["<short excerpt>", ...],\n'
    '  "contact_numbers": ["<phone or WhatsApp number exactly as found>", ...]\n'
    "}\n"
    "IMPORTANT: Keep summary under 200 characters. Keep red_flags between 0-5. "
    "Thresholds: <35=Safe, 35-64=Medium Risk, >=65=High Risk. "
    "For contact_numbers, extract from bio or post captions. "
    "Key risk signals: follower/following ratio imbalance, new accounts, suspicious bio patterns, "
    "multiple external links, private account with high follower count. "
    "If profile data is incomplete, score around 40 with red_flag 'Insufficient data'."
)

PHONE_REGEX = re.compile(
    r"(?:\+(?:\d[\s.\-]*){7,15}|"
    r"(?:\d{2,4}[\s.\-]){2,5}\d{2,6}|"
    r"\(\d{2,4}\)[\s.\-]*\d{3,4}[\s.\-]*\d{3,4}|"
    r"(?:00\d{1,3}[\s.\-])?\d{2,4}[\s.\-]\d{3,4}[\s.\-]\d{3,4})"
)

def _extract_phone_numbers(text: str) -> List[str]:
    if not text:
        return []
    seen = []
    DATE_REGEX = re.compile(r"^(19|20)\d{2}[\-/][01]\d[\-/][0123]\d$")
    for m in PHONE_REGEX.findall(text or ""):
        m = m.strip()
        digits = re.sub(r"\D", "", m)
        if not (7 <= len(digits) <= 15):
            continue
        if DATE_REGEX.match(m):
            continue
        if re.match(r"^\d{10,}$", m):
            continue
        if len(digits) >= 12 and not re.search(r"[+\s.\-\(\)]", m):
            continue
        if m not in seen:
            seen.append(m)
        if len(seen) >= 10:
            break
    return seen

def _build_analysis_prompt(profile_url: str, platform: str, content: str) -> str:
    max_content_chars = 8000
    if len(content) > max_content_chars:
        content = content[:max_content_chars] + "\n...[truncated]"
    return f"Profile URL: {profile_url}\nPlatform: {platform}\n\nProfile data (JSON):\n---\n{content}\n---\n\nAnalyze this Instagram profile for security risks. Return ONLY the JSON object as specified."

def _clean_json_response(raw: str) -> dict:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
    return json.loads(raw)

async def _call_gemini(profile_url: str, platform: str, content: str) -> dict:
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    prompt = _build_analysis_prompt(profile_url, platform, content)
    try:
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Content(role="user", parts=[types.Part(text=ANALYSIS_SYSTEM)]),
                types.Content(role="user", parts=[types.Part(text=prompt)]),
            ],
            config=types.GenerateContentConfig(temperature=0.1, max_output_tokens=2048),
        )
        raw = response.text
        return _clean_json_response(raw)
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        raise HTTPException(status_code=502, detail=f"Gemini analysis failed: {str(e)}")

async def _analyze(profile_url: str, platform: str, content: str) -> dict:
    if not gemini_client:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    try:
        logger.info("Using Gemini for analysis")
        return await _call_gemini(profile_url, platform, content)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gemini analysis failed: {e}")
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {str(e)}")

def _classify(score: int) -> str:
    if score >= 65:
        return "High Risk"
    if score >= 35:
        return "Medium Risk"
    return "Safe"

@api_router.get("/")
async def root():
    return {"service": APP_NAME, "status": "online"}

@api_router.post("/detect", response_model=ScanResult)
async def detect(data: DetectInput):
    profile_data = await _fetch_apify_instagram(data.url)
    if not profile_data:
        username_hint = _extract_username(data.url)
        content = f"[Profile data unavailable]\nURL: {data.url}\nPlatform: {data.platform}\nUsername: {username_hint}"
    else:
        content = json.dumps(profile_data, ensure_ascii=False, indent=2)
    ai = await _analyze(data.url, data.platform, content)
    score = int(max(0, min(100, ai.get("risk_score", 40))))
    cls = ai.get("classification") or _classify(score)
    summary = str(ai.get("summary") or "").strip() or "Analysis unavailable."
    red_flags_raw = ai.get("red_flags") or []
    factors: List[RiskFactor] = []
    for f in red_flags_raw[:8]:
        try:
            factors.append(RiskFactor(label=str(f.get("label", "Signal"))[:60], score=int(f.get("score", 10)), description=str(f.get("description", ""))[:200]))
        except Exception:
            continue
    toxic = [str(t)[:40] for t in (ai.get("toxic_terms") or [])][:10]
    ai_numbers = [str(n).strip()[:40] for n in (ai.get("contact_numbers") or []) if str(n).strip()]
    regex_numbers = _extract_phone_numbers(content)
    merged_numbers: List[str] = []
    for n in ai_numbers + regex_numbers:
        if n and n not in merged_numbers:
            merged_numbers.append(n)
    contact_numbers = merged_numbers[:10]
    alert = None
    if cls == "High Risk":
        alert = "High risk — this profile may be fake or a cyberstalker. Block and report."
    elif cls == "Medium Risk":
        alert = "Caution — suspicious patterns detected. Review interactions carefully."
    username = _extract_username(data.url)
    scan = ScanResult(
        id=str(uuid.uuid4()),
        user_id=DEFAULT_USER_ID,
        username=username,
        platform=data.platform,
        profile_url=data.url,
        risk_score=score,
        classification=cls,
        factors=factors,
        toxic_flags=toxic,
        contact_numbers=contact_numbers,
        ai_insight=summary,
        alert=alert,
        created_at=datetime.now(timezone.utc),
    )
    _scans_store.insert(0, scan.model_dump())
    if len(_scans_store) > 200:
        _scans_store.pop()
    return scan

@api_router.get("/scans", response_model=List[ScanResult])
async def list_scans():
    return _scans_store[:200]

@api_router.get("/scans/stats")
async def stats():
    items = _scans_store[:100]
    total = len(items)
    safe = sum(1 for x in items if x.get("classification") == "Safe")
    med = sum(1 for x in items if x.get("classification") == "Medium Risk")
    high = sum(1 for x in items if x.get("classification") == "High Risk")
    avg = round(sum(x.get("risk_score", 0) for x in items) / total, 1) if total else 0
    trend = items[-10:] if items else []
    trend_out = [{"created_at": x.get("created_at"), "risk_score": x.get("risk_score")} for x in trend]
    return {"total": total, "safe": safe, "medium": med, "high": high, "avg_score": avg, "trend": trend_out}

@api_router.delete("/scans/{scan_id}")
async def delete_scan(scan_id: str):
    global _scans_store
    original_len = len(_scans_store)
    _scans_store = [s for s in _scans_store if s.get("id") != scan_id]
    if len(_scans_store) == original_len:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"deleted": True}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)
