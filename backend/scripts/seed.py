import uuid

from app.db.session import SessionLocal
from app.repositories.complaint_repository import ComplaintRepository
from app.models.enums import Category, Priority

SEED_COMPLAINTS = [
    ("Burst water main flooding Street 12 since fajr, water entering ground floors", "Street 12, G-9", Category.WATER, Priority.HIGH),
    ("Bijli transformer sparking near the market, please send someone urgent", "Main Market, F-7", Category.ELECTRICITY, Priority.HIGH),
    ("Garbage not collected from our gali for the past one week", "Street 5, I-8", Category.SANITATION, Priority.NORMAL),
    ("Bara sa pothole ban gaya hai road pe, bike walo ko dikkat ho rahi hai", "G.T. Road", Category.ROADS, Priority.NORMAL),
    ("Streetlight bandh hai poori gali mein, andhera rehta hai raat ko", "Block C, F-10", Category.STREETLIGHTS, Priority.NORMAL),
    ("Sewage line leak ho gayi hai, badbu aa rahi hai poore mohalle mein", "F-11 Markaz", Category.SANITATION, Priority.HIGH),
    ("Power outage for last 6 hours in our sector, no updates from wapda", "H-8 Sector", Category.ELECTRICITY, Priority.HIGH),
    ("Road pe bara gaddha hai, kal ek motorcycle gir gayi thi", "Service Road, F-8", Category.ROADS, Priority.HIGH),
    ("Water supply bilkul band hai teen din se hamari gali mein", "Street 9, I-9", Category.WATER, Priority.HIGH),
    ("Streetlight pole jhuk gaya hai, kabhi bhi gir sakta hai", "Block D, G-11", Category.STREETLIGHTS, Priority.HIGH),
    ("Kachra collection truck nahi aya is hafte, bahut ganda ho gaya hai", "Street 14, I-10", Category.SANITATION, Priority.NORMAL),
    ("Electricity meter spark kar raha hai, dar lag raha hai", "F-6/2", Category.ELECTRICITY, Priority.HIGH),
    ("Road construction se dhool bahut ud rahi hai, saans lena mushkil hai", "Kashmir Highway", Category.ROADS, Priority.LOW),
    ("Water tanker nahi aya iss hafte, tank khali ho gaya hai", "G-13 Sector", Category.WATER, Priority.NORMAL),
    ("Do streetlights band hain park ke pass, bachay khelte waqt gir jate hain", "F-10 Park", Category.STREETLIGHTS, Priority.NORMAL),
    ("Drain overflow ho gaya hai barish ke baad, ganda pani ghar mein aa raha hai", "Street 3, I-8/3", Category.SANITATION, Priority.HIGH),
    ("Power fluctuation se hamara fridge kharab ho gaya, complaint darj karain", "E-11", Category.ELECTRICITY, Priority.NORMAL),
    ("Speed breaker toot gaya hai, gari ka tyre phat gaya", "Margalla Road", Category.ROADS, Priority.NORMAL),
    ("Pipeline leak se sarak par pani jama ho gaya hai", "Street 22, G-10", Category.WATER, Priority.HIGH),
    ("New streetlight lagwaen please, bohat andhera hai raat ko is gali mein", "Street 18, I-8/4", Category.STREETLIGHTS, Priority.LOW),
    ("Garbage bin overflow ho raha hai bohat dinon se", "F-7 Markaz", Category.SANITATION, Priority.NORMAL),
    ("Wire hanging low near the school, bacho ko khatra hai", "G-6/3", Category.ELECTRICITY, Priority.HIGH),
    ("Sarak pe crack aa gaye hain, monsoon ke baad aur kharab ho jayegi", "Service Road East", Category.ROADS, Priority.NORMAL),
    ("Water pressure bohat kam hai upper floors pe", "Block A, F-11/2", Category.WATER, Priority.LOW),
    ("Streetlight timer kharab hai, din mein bhi jalta rehta hai", "G-9/1", Category.STREETLIGHTS, Priority.LOW),
    ("Manhole cover missing hai, raat ko khatarnak hai pedestrians ke liye", "Street 7, I-9/2", Category.SANITATION, Priority.HIGH),
    ("Voltage bohat kam aata hai shaam ko, AC chalta hi nahi", "F-8/3", Category.ELECTRICITY, Priority.NORMAL),
    ("Naya road patch kharab ho gaya hai pehle hi mahine mein", "Kashmir Highway Service Road", Category.ROADS, Priority.LOW),
    ("Water leakage hai underground pipe se, sarak dhas rahi hai", "Street 11, G-11/2", Category.WATER, Priority.HIGH),
    ("Park ki streetlights sab band hain, security concern hai", "F-9 Park", Category.STREETLIGHTS, Priority.NORMAL),
]


def seed():
    db = SessionLocal()
    repo = ComplaintRepository(db)

    existing_count = len(repo.list_filtered(page=1, page_size=1000)[0])
    if existing_count >= len(SEED_COMPLAINTS):
        print(f"Database already has {existing_count} complaints — skipping seed (idempotent).")
        db.close()
        return

    for text, location, category, priority in SEED_COMPLAINTS:
        repo.create(
            text=text,
            location=location,
            category=category,
            priority=priority,
            ai_summary=text[:140],
            triaged_by="rules",
            triage_latency_ms=0,
        )

    print(f"Seeded {len(SEED_COMPLAINTS)} complaints.")
    db.close()


if __name__ == "__main__":
    seed()