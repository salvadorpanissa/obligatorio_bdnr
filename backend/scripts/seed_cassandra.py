"""
Simple sample data loader for the Cassandra forum schema.

Run from backend/ with the same env vars the app uses (CASSANDRA_HOST, etc.):
    python scripts/seed_cassandra.py
"""
import pathlib
import sys

# Ensure the backend package is importable when running as a script
sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

from database.cassandra import init_cassandra, create_thread, create_post


SAMPLE_THREADS = [
    {
        "course_id": "es_basics",
        "title": "Tips for irregular verbs",
        "author_id": "u001",
        "posts": [
            {"user_id": "u002", "content": "Remember ser/ir share the same past forms."},
            {"user_id": "u003", "content": "I like pairing flashcards with audio."},
            {"user_id": "u004", "content": "Focus on the 20 most common verbs first."},
        ],
    },
    {
        "course_id": "travel_pack",
        "title": "Best phrases for airports",
        "author_id": "u005",
        "posts": [
            {"user_id": "u006", "content": "Boarding gate and delayed are must know."},
            {"user_id": "u007", "content": "Practice security checkpoint questions."},
        ],
    },
    {
        "course_id": "en_basics",
        "title": "Plural rules that always trip me up",
        "author_id": "u008",
        "posts": [
            {"user_id": "u009", "content": "Watch out for endings in -ch and -sh."},
            {"user_id": "u010", "content": "Irregular plurals: child/children, foot/feet."},
            {"user_id": "u011", "content": "Zero/plural count nouns are tricky too."},
        ],
    },
]


def main():
    init_cassandra()

    for data in SAMPLE_THREADS:
        thread = create_thread(
            course_id=data["course_id"],
            title=data["title"],
            author_id=data["author_id"],
        )
        print(f"Created thread {thread['thread_id']} for course {thread['course_id']}")

        for post in data.get("posts", []):
            created_post = create_post(thread["thread_id"], post["user_id"], post["content"])
            print(f"  Post {created_post['post_id']} by {created_post['user_id']}")


if __name__ == "__main__":
    main()
