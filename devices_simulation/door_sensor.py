import requests
import time
import random
from datetime import datetime

API_URL = "http://127.0.0.1:8000/api/events"

DEVICES = [
    "door_sensor_1",
    "motion_sensor_1",
    "camera_front",
    "gas_sensor_kitchen",
]

TYPES = ["door_open", "door_close", "motion_detected", "gas_detected"]

while True:
    device_id = random.choice(DEVICES)
    event_type = random.choice(TYPES)

    level = "info"
    if event_type in ("motion_detected", "gas_detected"):
        level = random.choice(["warning", "danger"])
    elif event_type == "door_open":
        level = random.choice(["info", "warning"])

    event = {
        "device_id": device_id,
        "type": event_type,
        "level": level,
        "timestamp": datetime.now().isoformat()
    }

    try:
        response = requests.post(API_URL, json=event)
        print("Event sent:", event, "Status:", response.status_code)
    except Exception as e:
        print("Error sending event:", e)

    time.sleep(5)
