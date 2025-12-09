from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# CORS عشان الداشبورد يقدر يتصل
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EventIn(BaseModel):
    device_id: str
    type: str
    level: str
    timestamp: str
    home_id: Optional[str] = None
    absher_id: Optional[str] = None


class Event(BaseModel):
    id: int
    device_id: str
    type: str
    level: str
    timestamp: str
    status: str = "open"  # open / resolved
    home_id: Optional[str] = None
    absher_id: Optional[str] = None


events: List[Event] = []
next_id = 1


@app.get("/api/events")
def get_events():
    return [e.dict() for e in events]


@app.post("/api/events")
def add_event(ev: EventIn):
    global next_id
    new_event = Event(
        id=next_id,
        device_id=ev.device_id,
        type=ev.type,
        level=ev.level,
        timestamp=ev.timestamp,
        status="open",
        home_id=ev.home_id,
        absher_id=ev.absher_id,
    )
    next_id += 1
    events.append(new_event)
    return new_event


@app.post("/api/events/resolve_all")
def resolve_all():
    """تعليم كل البلاغات المفتوحة كـ تم الحل"""
    count = 0
    for e in events:
        if e.status == "open":
            e.status = "resolved"
            count += 1
    return {"resolved": count}


@app.post("/api/events/reset")
def reset_events():
    """مسح كل البلاغات (للاختبار)"""
    global events, next_id
    events = []
    next_id = 1
    return {"message": "cleared"}
