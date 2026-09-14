import os
import re
from typing import Tuple, Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Pre-compiled scam pattern definitions for reliable heuristic fallback
SCAM_INDICATORS = [
    (r"\b(otp|one\s*time\s*password|verification\s*code|pin)\b", 30),
    (r"\b(bank|rbi|police|cbi|income\t*tax|customs|manager|officer)\b", 25),
    (r"\b(block|freeze|suspended|arrest|warrant|legal\s*action|urgent)\b", 25),
    (r"\b(transfer|send\s*money|upi|account|gpay|phonepe)\b", 20),
    (r"\b(don't\s*tell|keep\s*secret|do\s*not\s*hang\s*up|confidential)\b", 20),
    (r"\b(lottery|prize|refund|claim|congratulations)\b", 20),
]

def analyze_transcript_heuristic(transcript: str) -> float:
    """
    Fallback heuristic scanner looking for urgency, authority impersonation, 
    money/OTP requests, and secrecy.
    """
    text_lower = transcript.lower()
    score = 5.0 # baseline low risk
    
    for pattern, weight in SCAM_INDICATORS:
        if re.search(pattern, text_lower):
            score += weight
            
    return min(100.0, score)

def analyze_transcript_claude(transcript: str) -> Tuple[float, str]:
    """
    Evaluates risk score (0-100) using Anthropic Claude API or OpenAI fallback.
    Returns (risk_score, provider_used)
    """
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    
    prompt = f"""You are an expert AI scam call detection system for phone audio fraud.
Analyze the following live phone call transcript snippet and evaluate how much it resembles an active voice cloning or phone scam attack.

Look specifically for:
1. Urgency / Panic creation ("do it now", "account will be blocked in 5 minutes")
2. Secrecy ("don't tell anyone", "do not hang up")
3. Impersonation of authority (Bank Officer, Police, Cyber Cell, Government Official)
4. Requests for money, bank transfers, OTPs, or passwords.

Transcript snippet:
"{transcript}"

Respond with ONLY a single integer score between 0 and 100 representing the risk level. Do not include any reasoning, markdown formatting, or extra characters. Just the number.
"""

    # 1. Try Anthropic Claude API if key present
    if anthropic_key and not anthropic_key.startswith("your_"):
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=anthropic_key)
            message = client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=10,
                temperature=0.0,
                messages=[{"role": "user", "content": prompt}]
            )
            raw_text = message.content[0].text.strip()
            match = re.search(r'\d+', raw_text)
            if match:
                score = float(match.group(0))
                return min(100.0, max(0.0, score)), "Anthropic Claude (Live API)"
        except Exception as e:
            print(f"[Conversational Risk] Claude API error: {e}. Falling back...")

    # 2. Try OpenAI API if key present
    if openai_key and not openai_key.startswith("your_"):
        try:
            import openai
            client = openai.OpenAI(api_key=openai_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0.0
            )
            raw_text = response.choices[0].message.content.strip()
            match = re.search(r'\d+', raw_text)
            if match:
                score = float(match.group(0))
                return min(100.0, max(0.0, score)), "OpenAI GPT (Live API)"
        except Exception as e:
            print(f"[Conversational Risk] OpenAI API error: {e}. Falling back...")

    # 3. Fallback to Heuristic Scam Scanner
    heuristic_score = analyze_transcript_heuristic(transcript)
    return heuristic_score, "Rule-Based Heuristic Detector (No API key set)"
