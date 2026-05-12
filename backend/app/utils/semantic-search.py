def semantic_search(query, messages, top_k=5):

    # Convert search query into vector
    query_embedding = generate_embedding(query)

    results = []

    # Compare against every message
    for message in messages:

        similarity = cosine_similarity(
            query_embedding,
            message["embedding"]
        )

        results.append({
            "content": message["content"],
            "similarity": similarity
        })

    # Sort highest similarity first
    results.sort(
        key=lambda x: x["similarity"],
        reverse=True
    )

    return results[:top_k]


    #still need to implement into rest of the files but do later