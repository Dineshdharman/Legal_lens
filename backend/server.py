import logging
import time
import uuid
import os
import typing_extensions as typing
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import uvicorn
from dotenv import load_dotenv

# --- 1. SETUP ENV & OBSERVABILITY ---
# Load secrets from .env file
load_dotenv()

# Configure Structured Logging (Observability Requirement)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - [TraceID: %(trace_id)s] - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger("LegalLensAgent")

# Verify API Key
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    logger.error("❌ GOOGLE_API_KEY not found in .env file!")
    raise ValueError("GOOGLE_API_KEY not set")

genai.configure(api_key=api_key)

app = FastAPI()

# Enable CORS (Allow Chrome Extension to talk to us)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. DATA STRUCTURES (Schema Enforcement) ---
# We force Gemini to output strictly this format to prevent formatting errors
class LegalAnalysis(typing.TypedDict):
    is_legal_doc: bool
    safety_score: int
    summary: str
    red_flags: list[str]

class PageContent(BaseModel):
    url: str
    text: str

# --- 3. THE AGENT SETUP ---
system_instruction = """
You are "LegalLens," an expert Consumer Protection AI Lawyer.

**MISSION:**
Analyze the provided text to protect the user from predatory terms.

**SCORING RUBRIC (Safety Score 1-10):**
* 10: Open source, perfectly safe.
* 7-9: Standard, fair terms.
* 4-6: Big Tech standard (forced arbitration, tracking).
* 1-3: Predatory (selling data, AI training on user content, no refunds).

**INSTRUCTIONS:**
1. If the text is NOT a legal document (e.g., login page, blog), return "is_legal_doc": false.
2. If it IS legal, fill the fields.
3. For 'red_flags', look for: AI Training Rights, Class Action Waivers, Data Selling.
"""

# We use 1.5-flash because it supports 'response_schema' reliably
model = genai.GenerativeModel(
    model_name='gemini-2.5-flash',
    system_instruction=system_instruction,
    generation_config={
        "response_mime_type": "application/json",
        "response_schema": LegalAnalysis 
    }
)

# --- 4. MIDDLEWARE (Tracing) ---
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    trace_id = str(uuid.uuid4())[:8] # Unique ID for this request
    request.state.trace_id = trace_id
    
    # Inject Trace ID into logger
    old_factory = logging.getLogRecordFactory()
    def record_factory(*args, **kwargs):
        record = old_factory(*args, **kwargs)
        record.trace_id = trace_id
        return record
    logging.setLogRecordFactory(record_factory)

    response = await call_next(request)
    return response

# --- 5. THE ENDPOINT ---
@app.post("/analyze")
async def analyze_page(page: PageContent):
    logger.info(f"📡 Request received for: {page.url}")
    logger.info(f"📊 Text Length: {len(page.text)} chars")
    
    try:
        # Limit input to 30k chars to stay fast and free
        prompt = f"Analyze this text from {page.url}:\n\n{page.text[:30000]}"
        
        start_time = time.time()
        response = model.generate_content(prompt)
        duration = time.time() - start_time
        
        logger.info(f"✅ AI Analysis complete in {duration:.2f}s")
        logger.info(f"🔍 Response Snippet: {response.text[:100]}...")

        # Return the raw JSON string (Gemini SDK handles the JSON formatting now)
        return response.text 

    except Exception as e:
        logger.error(f"❌ Agent Failure: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)