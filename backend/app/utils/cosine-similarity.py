import math

def cosine_similarity(a, b):
    dot = sum(x * y for x, y in zip(a, b))

    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(y * y for y in b))

    return dot / (mag_a * mag_b)


#add scikit later if decide to flesh out further
