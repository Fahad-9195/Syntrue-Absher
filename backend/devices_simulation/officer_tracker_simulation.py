import requests
import time
import random
from datetime import datetime

API_URL = "https://syntrue-absher.onrender.com/api/events"

# تعريف "الجندي" والمنطقة وحساب أبشر
OFFICER_ID = "officer_riyadh_1"      # اسم جهاز العسكري
HOME_ID = "ZONE-RIYADH-NORTH"        # المنطقة / الحي
ABSHER_ID = "9876543210"             # حساب أبشر المرتبط

# الحالات الممكنة للعسكري
STATES = [
    {
        "code": "safe",
        "label": "الوضع آمن",
        "level": "info",
        "weight": 0.6   # احتمال 60%
    },
    {
        "code": "unstable",
        "label": "الوضع غير مستقر",
        "level": "warning",
        "weight": 0.25  # احتمال 25%
    },
    {
        "code": "emergency",
        "label": "حالة طارئة",
        "level": "danger",
        "weight": 0.15  # احتمال 15%
    },
]

def choose_state():
    """اختيار حالة بشكل عشوائي مع أوزان (safe > unstable > emergency)"""
    r = random.random()
    cumulative = 0
    for state in STATES:
        cumulative += state["weight"]
        if r <= cumulative:
            return state
    return STATES[0]


def send_officer_event():
    state = choose_state()

    event = {
        "device_id": OFFICER_ID,
        "type": f"officer_{state['code']}",   # officer_safe / officer_unstable / officer_emergency
        "level": state["level"],              # info / warning / danger
        "timestamp": datetime.now().isoformat(),
        "home_id": HOME_ID,
        "absher_id": ABSHER_ID,
    }

    try:
        response = requests.post(API_URL, json=event, timeout=3)
        print(
            f"[{datetime.now().strftime('%H:%M:%S')}] "
            f"تم إرسال حالة العسكري: {state['label']} "
            f"(type={event['type']}, level={event['level']}) "
            f"Status={response.status_code}"
        )
    except Exception as e:
        print("🚫 خطأ في إرسال الحدث:", e)


def main():
    print("بدء محاكاة جهاز العسكري السري...")
    print("سيتم إرسال حالة جديدة كل 5 ثوانٍ.\n")
    while True:
        send_officer_event()
        time.sleep(5)


if __name__ == "__main__":
    main()
