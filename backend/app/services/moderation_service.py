BANNED_WORDS = [
    "idiot",
    "stupid",
    "hate",
    "kill",
]

def moderate_message(content: str) -> dict:
    lowered = content.lower()

    flagged_words = [
        word for word in BANNED_WORDS
        if word in lowered
    ]

    is_flagged = len(flagged_words) > 0

    return {
        "allowed": not is_flagged,
        "flagged": is_flagged,
        "flagged_words": flagged_words,
        "reason": "Toxic or unsafe language detected" if is_flagged else None,
    }