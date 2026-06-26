import re
from collections import Counter

VOCAB = [
    "login", "signup", "auth", "token", "jwt", "websocket", "socket",
    "message", "room", "database", "sql", "error", "bug", "fastapi",
    "react", "frontend", "backend", "user", "password", "search"
]

def generate_embedding(text: str) -> list[float]:
    words = re.findall(r"\w+", text.lower())
    counts = Counter(words)

    return [float(counts.get(word, 0)) for word in VOCAB]