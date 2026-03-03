"""
RAG module for the AI Agent.
- LLM-based intent detection (replaces keyword matching)
- Book search and filtering tools
"""

import json


def detect_intent_with_ai(question: str, groq_client) -> dict:
    """
    Use Groq LLM to detect the user's intent and extract parameters.
    Returns a dict with: intent, category, search_query, book_title
    """
    prompt = f"""You are an intent classifier for a library book search system.

Analyze the user's question and classify it into EXACTLY ONE intent:

1. "search_books" — user wants to find books by title, author name, or keyword
2. "top_rated" — user wants the best/highest rated books, optionally in a category
3. "book_details" — user wants details about a specific known book
4. "general_qa" — general question about books, reading, or the library

Also extract relevant parameters from the question.

Return ONLY valid JSON with these keys:
- "intent": one of "search_books", "top_rated", "book_details", "general_qa"
- "category": the book category if mentioned (e.g., "science", "fiction", "history"), or null
- "search_query": search keyword/phrase if the user is searching for something, or null
- "book_title": specific book title if mentioned, or null

User Question: {question}"""

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
        max_tokens=150,
        response_format={"type": "json_object"},
    )

    try:
        result = json.loads(response.choices[0].message.content)
        # Ensure all keys exist
        return {
            "intent": result.get("intent", "general_qa"),
            "category": result.get("category"),
            "search_query": result.get("search_query"),
            "book_title": result.get("book_title"),
        }
    except (json.JSONDecodeError, KeyError):
        return {"intent": "general_qa", "category": None, "search_query": None, "book_title": None}


def get_top_books(books, category=None, limit=3):
    """Get top-rated books, optionally filtered by category."""
    if category:
        filtered = [
            b for b in books
            if any(category.lower() in c["name"].lower() for c in b.get("categories", []))
        ]
    else:
        filtered = books

    if not filtered:
        return []

    return sorted(filtered, key=lambda b: b.get("average_rating", 0) or 0, reverse=True)[:limit]


def search_books_by_query(books, query: str, limit=5):
    """Fuzzy search books by title, author name, or summary text."""
    query_lower = query.lower()
    scored = []

    for b in books:
        score = 0
        title = (b.get("title") or "").lower()
        author = (b.get("author") or "").lower()
        summary = (b.get("summary_text") or "").lower()
        categories = " ".join(c["name"].lower() for c in b.get("categories", []))

        # Exact title match
        if query_lower == title:
            score += 100
        elif query_lower in title:
            score += 60
        
        # Author match
        if query_lower in author:
            score += 50
        
        # Category match
        if query_lower in categories:
            score += 30

        # Summary keyword match
        if query_lower in summary:
            score += 10

        if score > 0:
            scored.append((score, b))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [b for _, b in scored[:limit]]


def find_book_by_title(books, title: str):
    """Find a specific book by its title (fuzzy)."""
    title_lower = title.lower()
    # Try exact match first
    for b in books:
        if (b.get("title") or "").lower() == title_lower:
            return b
    # Then try partial match
    for b in books:
        if title_lower in (b.get("title") or "").lower():
            return b
    return None
