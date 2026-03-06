from fastapi import FastAPI, HTTPException
from app.schemas import ChatRequest, GrammarCheckRequest, BookVerifyRequest
from app.django_client import fetch_books
from app.rag import detect_intent_with_ai, get_top_books, search_books_by_query, find_book_by_title
from app.llm import explain_with_ai, check_grammar_with_ai, verify_book_with_ai, client
from app.cache import find_cached_answer, save_to_cache
from app.vector_db import vector_db
from fastapi.middleware.cors import CORSMiddleware
import json


app = FastAPI(title="Booksphere AI Agent Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://raedbook.xyz", "https://www.raedbook.xyz"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_book_context(books_list: list) -> str:
    """Build a text context string from a list of book dicts."""
    context = ""
    for b in books_list:
        context += f"""
        Title: {b['title']}
        Author: {b.get('author')}
        Rating: {b.get('average_rating')}
        Summary: {b.get('summary_text')}
        Categories: {[c['name'] for c in b.get('categories', [])]}
        ---
        """
    return context


def _book_summary(book: dict) -> dict:
    """Extract a small summary dict from a book for the response."""
    if not book:
        return None
    return {
        "title": book.get("title"),
        "author": book.get("author"),
        "rating": book.get("average_rating"),
    }


@app.post("/ai/chat")
def chat(req: ChatRequest):
    question = req.question.strip()

    # ━━━ STEP 1: Check MongoDB cache ━━━
    cached = find_cached_answer(question)
    if cached:
        print(f"⚡ Cache hit for: {question[:50]}...")
        return cached

    # ━━━ STEP 2: Detect intent using Groq (agent decision) ━━━
    intent_result = detect_intent_with_ai(question, client)
    intent = intent_result["intent"]
    category = intent_result.get("category")
    search_query = intent_result.get("search_query")
    book_title = intent_result.get("book_title")

    print(f"🧠 Agent intent: {intent} | category={category} | search={search_query} | title={book_title}")

    # ━━━ STEP 3: Execute tool based on intent (agent action) ━━━
    books = fetch_books()
    
    # Initialize Vector DB if not already done
    if not vector_db.is_populated:
        vector_db.populate(books)

    context = ""
    best_book = None

    if intent == "search_books":
        query = search_query or book_title or question
        
        # 1. Try Semantic Search first!
        results = vector_db.semantic_search(query, top_k=3)
        
        if results:
            context = _build_book_context(results)
            best_book = results[0]
        else:
            # 2. Fallback to basic fuzzy string search
            results = search_books_by_query(books, query)
            if results:
                context = _build_book_context(results)
                best_book = results[0]

    elif intent == "top_rated":
        top = get_top_books(books, category, limit=5)
        if not top and category:
            # Fallback to all books
            top = get_top_books(books, None, limit=5)
            context = f"Note: No books found in '{category}' category. Showing top rated books overall.\n"
        if top:
            context += _build_book_context(top)
            best_book = top[0]

    elif intent == "book_details":
        title_to_find = book_title or search_query or question
        found = find_book_by_title(books, title_to_find)
        if found:
            context = _build_book_context([found])
            best_book = found
        else:
            # Try search as fallback
            results = search_books_by_query(books, title_to_find, limit=3)
            if results:
                context = _build_book_context(results)
                best_book = results[0]

    else:  # general_qa
        # Give the AI a broad context of top books
        top = get_top_books(books, category, limit=5)
        if not top:
            top = get_top_books(books, None, limit=5)
        if top:
            context = _build_book_context(top)
            best_book = top[0]

    # Handle case where no books found at all
    if not context:
        answer = "I couldn't find any books matching your query in our database. Try asking about a different topic or browsing our categories!"
        return {
            "answer": answer,
            "book": None,
            "from_cache": False,
        }

    # ━━━ STEP 4: Generate answer with Groq (agent reasoning) ━━━
    ai_answer = explain_with_ai(context, question)

    # ━━━ STEP 5: Save to MongoDB cache ━━━
    book_info = _book_summary(best_book)
    save_to_cache(question, ai_answer, intent, book_info)

    # ━━━ STEP 6: Return response ━━━
    return {
        "answer": ai_answer,
        "book": book_info,
        "from_cache": False,
    }


@app.post("/ai/grammar-check")
def grammar_check(req: GrammarCheckRequest):
    result_str = check_grammar_with_ai(req.content)
    # The LLM returns a JSON string, so we parse it to return a proper JSON object
    try:
        return json.loads(result_str)
    except json.JSONDecodeError:
        # Fallback if LLM fails to return valid JSON
        return {
            "corrected_content": req.content,
            "suggestions": ["Error: Could not parse AI response."],
        }


@app.post("/ai/verify-book")
def verify_book(req: BookVerifyRequest):
    # Build existing books context for RAG-style duplicate detection
    existing_books_context = []
    for book in req.existing_books:
        existing_books_context.append({
            "id": book.id,
            "title": book.title,
            "author": book.author,
        })

    result_str = verify_book_with_ai(
        title=req.title,
        author=req.author,
        description=req.description,
        summary_text=req.summary_text,
        category=req.category,
        existing_books=existing_books_context,
    )
    try:
        return json.loads(result_str)
    except json.JSONDecodeError:
        return {
            "quality_score": 0,
            "content_analysis": "Error: Could not parse AI response.",
            "category_relevance": "Unknown",
            "flagged_issues": ["AI response parsing failed"],
            "recommendation": "review",
            "recommendation_reason": "AI analysis could not be completed.",
        }
