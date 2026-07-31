from sentence_transformers import SentenceTransformer

# Load once when the backend starts.
# This avoids reloading the model for every message.
model = SentenceTransformer("all-MiniLM-L6-v2")


def generate_embedding(text: str) -> list[float]:
    cleaned_text = text.strip()

    if not cleaned_text:
        raise ValueError("Cannot generate an embedding for empty text")

    embedding = model.encode(
        cleaned_text,
        normalize_embeddings=True,
    )

    return embedding.tolist()