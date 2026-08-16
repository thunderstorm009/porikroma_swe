"""Provider-neutral AI service. Mock mode is deterministic and test friendly."""

from __future__ import annotations

import json
from datetime import date, timedelta
from decimal import Decimal

import httpx

from app.core.config import get_settings


def _mock_chat(message: str, context: dict) -> str:
    destination = context.get("destination", "your destination")
    budget = context.get("budget")
    text = message.lower()
    if "weather" in text or "rain" in text:
        return f"For {destination}, keep outdoor plans flexible and leave an indoor backup. Verify the live forecast before traveling."
    if "budget" in text or "cost" in text:
        return f"For {destination}, protect accommodation and transport first, then keep an emergency buffer. Your recorded budget is {budget or 'not set'}."
    if "pack" in text:
        return "Pack comfortable walking shoes, a compact rain layer, medicines, sunscreen, a refillable bottle, and a small first-aid kit."
    return f"For {destination}, group nearby activities, leave one flexible window, and verify current prices and local conditions before you go."


def generate_text(prompt: str, *, system: str = "You are Porikroma AI, a careful travel assistant.") -> str:
    settings = get_settings()
    if settings.ai_provider != "openai":
        return _mock_chat(prompt, {})
    if not settings.openai_api_key:
        raise RuntimeError("AI provider is not configured")
    try:
        with httpx.Client(timeout=30) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={"model": "gpt-4o-mini", "temperature": 0.2, "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}]},
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
    except (httpx.HTTPError, KeyError, IndexError, TypeError) as exc:
        raise RuntimeError("AI provider is temporarily unavailable") from exc


def chat(message: str, context: dict) -> str:
    settings = get_settings()
    if settings.ai_provider != "openai":
        return _mock_chat(message, context)
    prompt = json.dumps({"question": message, "authorized_trip_context": context}, default=str)
    return generate_text(prompt)


def trip_plan(destination: str, start_date: date, end_date: date, budget: Decimal, interests: list[str], travel_style: str) -> dict:
    if get_settings().ai_provider == "openai":
        raw = generate_text(json.dumps({"destination": destination, "start_date": start_date, "end_date": end_date, "budget": budget, "interests": interests, "travel_style": travel_style}, default=str), system="Return only JSON matching {summary:string, estimated_budget:number, days:[{day:number,date:YYYY-MM-DD,activities:[object]}]}.")
        try:
            return json.loads(raw.replace("```json", "").replace("```", "").strip())
        except (json.JSONDecodeError, TypeError) as exc:
            raise RuntimeError("AI returned an invalid trip plan") from exc
    days = []
    current = start_date
    index = 1
    while current <= end_date:
        days.append({"day": index, "date": current, "activities": [{"title": f"Explore {destination}", "category": interests[0] if interests else travel_style, "estimated_cost": float((budget / max(1, (end_date - start_date).days + 1)).quantize(Decimal("0.01")))}]})
        current += timedelta(days=1)
        index += 1
    return {"summary": f"A {travel_style} plan for {destination} with flexible pacing.", "estimated_budget": budget, "days": days}
