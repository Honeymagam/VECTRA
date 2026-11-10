"""Create the initial concept and starter question bank without overwriting data."""
import os

from sqlalchemy import select

from app.database import Base, SessionLocal, engine
from app.models.core import Concept, Difficulty, Question, Role, User
from app.services import embedder
from app.security import hash_password


CONCEPTS = {
    "Percentages": "QUANTITATIVE",
    "Time & Work": "QUANTITATIVE",
    "Number Series": "LOGICAL_REASONING",
    "Profit & Loss": "QUANTITATIVE",
    "Ratio": "QUANTITATIVE",
    "Average": "QUANTITATIVE",
    "Simple Interest": "QUANTITATIVE",
    "Probability": "QUANTITATIVE",
    "Logical Reasoning": "LOGICAL_REASONING",
    "Verbal Ability": "VERBAL",
    "Data Interpretation": "QUANTITATIVE",
}

STARTER_QUESTIONS = [
    ("Percentages", "A jacket costs ₹800. Its price increases by 15%. What is the new price?", ["₹880", "₹900", "₹920", "₹940"], "₹920", "15% of ₹800 is ₹120; adding that to ₹800 gives ₹920.", Difficulty.EASY),
    ("Percentages", "25% of a number is 60. What is the number?", ["180", "220", "240", "260"], "240", "If one quarter is 60, the whole is 60 × 4 = 240.", Difficulty.MEDIUM),
    ("Percentages", "A ₹1,500 item is discounted by 20%. What is its sale price?", ["₹1,100", "₹1,200", "₹1,250", "₹1,300"], "₹1,200", "The discount is 20% of ₹1,500, or ₹300. The sale price is ₹1,200.", Difficulty.EASY),
    ("Time & Work", "A can finish a job in 12 days and B in 18 days. How long will they take working together?", ["6 days", "7.2 days", "8 days", "15 days"], "7.2 days", "Their combined daily rate is 1/12 + 1/18 = 5/36, so the job takes 36/5 = 7.2 days.", Difficulty.HARD),
    ("Time & Work", "A team completes 3/5 of a job in 6 days at a steady rate. How many days will the whole job take?", ["8 days", "9 days", "10 days", "12 days"], "10 days", "At the same rate, the full job takes 6 ÷ (3/5) = 10 days.", Difficulty.MEDIUM),
    ("Time & Work", "Pipe A fills a tank in 6 hours and Pipe B in 3 hours. How long do they take together?", ["1 hour", "2 hours", "3 hours", "4 hours"], "2 hours", "Their rates add to 1/6 + 1/3 = 1/2 tank per hour, so they need 2 hours.", Difficulty.EASY),
    ("Number Series", "What number comes next: 2, 6, 12, 20, 30, __?", ["36", "40", "42", "44"], "42", "The differences are 4, 6, 8, and 10. The next difference is 12.", Difficulty.MEDIUM),
    ("Number Series", "What number comes next: 3, 9, 27, 81, __?", ["162", "189", "216", "243"], "243", "Each term is multiplied by 3.", Difficulty.EASY),
    ("Number Series", "What number comes next: 5, 11, 23, 47, __?", ["89", "94", "95", "96"], "95", "Each term is twice the previous term plus 1.", Difficulty.HARD),
]


def main() -> None:
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        concepts = {}
        for name, category in CONCEPTS.items():
            concept = db.scalar(select(Concept).where(Concept.name == name))
            if concept is None:
                concept = Concept(name=name, category=category, embedding=embedder.embed(name))
                db.add(concept)
                db.flush()
            concepts[name] = concept

        added_questions = 0
        for topic, prompt, options, answer, explanation, difficulty in STARTER_QUESTIONS:
            existing = db.scalar(select(Question.id).where(Question.question_text == prompt))
            if existing is not None:
                continue
            db.add(Question(
                concept_id=concepts[topic].id,
                question_text=prompt,
                options=options,
                correct_answer=answer,
                explanation=explanation,
                difficulty=difficulty,
                question_type="QUANTITATIVE",
                approved=True,
            ))
            added_questions += 1

        admin_password = os.getenv("VECTRA_ADMIN_PASSWORD")
        admin_email = os.getenv("VECTRA_ADMIN_EMAIL", "admin@vectra.local").lower()
        admin_created = False
        if admin_password and db.scalar(select(User.id).where(User.email == admin_email)) is None:
            db.add(User(name="VECTRA Admin", email=admin_email, password_hash=hash_password(admin_password), role=Role.ADMIN))
            admin_created = True

        educator_password = os.getenv("VECTRA_EDUCATOR_PASSWORD")
        educator_email = os.getenv("VECTRA_EDUCATOR_EMAIL", "educator@vectra.local").lower()
        educator_created = False
        if educator_password:
            educator = db.scalar(select(User).where(User.email == educator_email))
            if educator is None:
                db.add(User(name="VECTRA Educator", email=educator_email, password_hash=hash_password(educator_password), role=Role.EDUCATOR))
                educator_created = True
            elif educator.role == Role.STUDENT:
                educator.role = Role.EDUCATOR

        db.commit()
        print(f"Seeded concepts and {added_questions} new starter questions.")
        if admin_created:
            print(f"Created admin account: {admin_email}")
        elif not admin_password:
            print("No admin account created. Set VECTRA_ADMIN_PASSWORD to provision one.")
        if educator_created:
            print(f"Created educator account: {educator_email}")
        elif educator_password:
            print(f"Ensured educator access for: {educator_email}")
        else:
            print("No educator account provisioned. Set VECTRA_EDUCATOR_PASSWORD to provision one.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
