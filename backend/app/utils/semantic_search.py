from app.utils.embedding_service import generate_embedding
from app.utils.cosine_similarity import cosine_similarity


def semantic_search(
    query: str,
    messages: list,
    top_k: int = 5,
):
    query_embedding = generate_embedding(query)

    results = []

    for message in messages:
        if not message.embedding:
            continue

        similarity = cosine_similarity(
            query_embedding,
            message.embedding,
        )

        results.append({
            "message": message,
            "similarity": similarity,
        })

    results.sort(
        key=lambda result: result["similarity"],
        reverse=True,
    )

    return results[:top_k]