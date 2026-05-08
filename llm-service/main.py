"""
FastAPI LLM Microservice for Gemini API Integration
- REST API for on-demand LLM processing
- Average response time: < 200ms
- Strict JSON output with prompt engineering
"""

import os
import time
import json
import re
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import httpx
import uvicorn

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_BASE_URL = os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "gemini-2.0-flash-lite")
MAX_RETRIES = 3
TIMEOUT_SECONDS = 15

# Request/Response Models
class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    categories: List[str] = Field(default=["urgent", "normal", "low-priority"])
    model: Optional[str] = None

class ExtractRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    fields: List[str] = Field(default=["name", "email", "phone"])
    model: Optional[str] = None

class RouteRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    routes: Dict[str, str] = Field(default={
        "support": "Customer support inquiries",
        "sales": "Sales and pricing questions",
        "technical": "Technical issues and bugs"
    })
    model: Optional[str] = None

class PromptRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=15000)
    system_instruction: Optional[str] = None
    temperature: float = Field(default=0.1, ge=0.0, le=2.0)
    model: Optional[str] = None
    expect_json: bool = Field(default=True)

class LLMResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    raw_text: Optional[str] = None
    processing_time_ms: int
    tokens_used: Optional[int] = None
    model: str
    error: Optional[str] = None

# Prompt Templates
CLASSIFICATION_PROMPT = """You are a data classification engine. Your task is to classify the given text into exactly one of the provided categories.

CATEGORIES: {categories}

RULES:
- Choose EXACTLY ONE category from the list above
- Respond ONLY with valid JSON, no other text
- Include confidence score between 0.0 and 1.0
- Provide brief reasoning

INPUT TEXT:
{text}

RESPONSE FORMAT (strict JSON):
{{
    "category": "chosen_category",
    "confidence": 0.95,
    "reasoning": "brief explanation"
}}"""

EXTRACTION_PROMPT = """You are a structured data extraction engine. Extract the requested fields from the given text.

FIELDS TO EXTRACT: {fields}

RULES:
- Extract ALL requested fields if present
- Use null for missing fields
- Respond ONLY with valid JSON
- Normalize values (trim whitespace, standardize formats)

INPUT TEXT:
{text}

RESPONSE FORMAT (strict JSON):
{{
    "extracted": {{
        "field_name": "extracted_value_or_null"
    }},
    "confidence": 0.95,
    "fields_found": 5,
    "fields_total": 5
}}"""

ROUTING_PROMPT = """You are an intelligent routing engine. Determine the best destination for the given request.

AVAILABLE ROUTES:
{routes}

RULES:
- Choose EXACTLY ONE route
- Respond ONLY with valid JSON
- Include confidence and reasoning

INPUT REQUEST:
{text}

RESPONSE FORMAT (strict JSON):
{{
    "route": "chosen_route_key",
    "route_name": "human readable name",
    "confidence": 0.95,
    "reasoning": "brief explanation",
    "priority": "normal"
}}"""

JSON_SYSTEM_INSTRUCTION = """You are a JSON-only response engine. 
STRICT RULES:
1. Respond ONLY with valid JSON
2. No markdown formatting, no code blocks, no explanations outside JSON
3. No hallucinations - only include information present in input
4. All keys must use snake_case
5. All string values must be properly escaped
6. Never add comments in JSON"""

def clean_json_response(text: str) -> str:
    """Extract JSON from response, handling markdown code blocks"""
    # Remove markdown code blocks
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    # Find JSON object
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return match.group(0)
    return text.strip()

async def call_gemini(
    prompt: str,
    model: str = DEFAULT_MODEL,
    system_instruction: Optional[str] = None,
    temperature: float = 0.1,
    expect_json: bool = True
) -> Dict[str, Any]:
    """Call Gemini API with retry logic"""
    url = f"{GEMINI_BASE_URL}/models/{model}:generateContent"
    headers = {
        "Content-Type": "application/json",
    }
    params = {"key": GEMINI_API_KEY}
    
    contents = [{"role": "user", "parts": [{"text": prompt}]}]
    
    payload: Dict[str, Any] = {
        "contents": contents,
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": 2048,
            "topP": 0.95,
            "topK": 40,
        }
    }
    
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }
    
    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
                response = await client.post(url, headers=headers, params=params, json=payload)
                response.raise_for_status()
                data = response.json()
                
                # Extract text from response
                candidates = data.get("candidates", [])
                if not candidates:
                    raise ValueError("No candidates in response")
                
                text_response = candidates[0]["content"]["parts"][0]["text"]
                
                # Try to parse as JSON if expected
                result = {"raw": text_response}
                if expect_json:
                    try:
                        cleaned = clean_json_response(text_response)
                        result["json"] = json.loads(cleaned)
                    except json.JSONDecodeError:
                        result["json"] = None
                
                # Get token usage
                usage = data.get("usageMetadata", {})
                result["tokens"] = usage.get("totalTokenCount", 0)
                
                return result
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 and attempt < MAX_RETRIES - 1:
                await asyncio.sleep(2 ** attempt)
                continue
            raise HTTPException(status_code=e.response.status_code, detail=str(e))
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(1)
                continue
            raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

# FastAPI App
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    yield

app = FastAPI(
    title="LLM Microservice API",
    description="FastAPI service for LLM-powered data processing with Gemini API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_timing_header(request: Request, call_next):
    """Add response time header"""
    start = time.time()
    response = await call_next(request)
    elapsed = int((time.time() - start) * 1000)
    response.headers["X-Response-Time-Ms"] = str(elapsed)
    return response

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": DEFAULT_MODEL, "version": "1.0.0"}

@app.get("/models")
async def list_models():
    """List available Gemini models"""
    return {
        "models": [
            {"id": "gemini-2.0-flash-lite", "name": "Gemini 2.0 Flash Lite", "description": "Fast, efficient model"},
            {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "description": "Balanced speed and quality"},
            {"id": "gemini-1.5-flash", "name": "Gemini 1.5 Flash", "description": "Previous generation flash"},
            {"id": "gemini-1.5-pro", "name": "Gemini 1.5 Pro", "description": "High quality responses"},
        ]
    }

@app.post("/classify", response_model=LLMResponse)
async def classify(req: ClassifyRequest):
    """Classify text into categories"""
    start = time.time()
    
    prompt = CLASSIFICATION_PROMPT.format(
        categories=", ".join(req.categories),
        text=req.text
    )
    
    result = await call_gemini(
        prompt=prompt,
        model=req.model or DEFAULT_MODEL,
        system_instruction=JSON_SYSTEM_INSTRUCTION,
        expect_json=True
    )
    
    elapsed = int((time.time() - start) * 1000)
    
    return LLMResponse(
        success=result.get("json") is not None,
        data=result.get("json"),
        raw_text=result.get("raw"),
        processing_time_ms=elapsed,
        tokens_used=result.get("tokens"),
        model=req.model or DEFAULT_MODEL
    )

@app.post("/extract", response_model=LLMResponse)
async def extract(req: ExtractRequest):
    """Extract structured data from text"""
    start = time.time()
    
    prompt = EXTRACTION_PROMPT.format(
        fields=", ".join(req.fields),
        text=req.text
    )
    
    result = await call_gemini(
        prompt=prompt,
        model=req.model or DEFAULT_MODEL,
        system_instruction=JSON_SYSTEM_INSTRUCTION,
        expect_json=True
    )
    
    elapsed = int((time.time() - start) * 1000)
    
    return LLMResponse(
        success=result.get("json") is not None,
        data=result.get("json"),
        raw_text=result.get("raw"),
        processing_time_ms=elapsed,
        tokens_used=result.get("tokens"),
        model=req.model or DEFAULT_MODEL
    )

@app.post("/route", response_model=LLMResponse)
async def route(req: RouteRequest):
    """Route request to appropriate destination"""
    start = time.time()
    
    routes_text = "\n".join([f"- {k}: {v}" for k, v in req.routes.items()])
    prompt = ROUTING_PROMPT.format(routes=routes_text, text=req.text)
    
    result = await call_gemini(
        prompt=prompt,
        model=req.model or DEFAULT_MODEL,
        system_instruction=JSON_SYSTEM_INSTRUCTION,
        expect_json=True
    )
    
    elapsed = int((time.time() - start) * 1000)
    
    return LLMResponse(
        success=result.get("json") is not None,
        data=result.get("json"),
        raw_text=result.get("raw"),
        processing_time_ms=elapsed,
        tokens_used=result.get("tokens"),
        model=req.model or DEFAULT_MODEL
    )

@app.post("/process", response_model=LLMResponse)
async def process(req: PromptRequest):
    """Generic LLM processing endpoint"""
    start = time.time()
    
    result = await call_gemini(
        prompt=req.prompt,
        model=req.model or DEFAULT_MODEL,
        system_instruction=req.system_instruction or JSON_SYSTEM_INSTRUCTION,
        temperature=req.temperature,
        expect_json=req.expect_json
    )
    
    elapsed = int((time.time() - start) * 1000)
    
    return LLMResponse(
        success=True,
        data=result.get("json"),
        raw_text=result.get("raw"),
        processing_time_ms=elapsed,
        tokens_used=result.get("tokens"),
        model=req.model or DEFAULT_MODEL
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc), "detail": "Internal server error"}
    )

if __name__ == "__main__":
    import asyncio
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
