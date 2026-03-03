from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def explain_with_ai(context: str, question: str) -> str:
    prompt = f"""You are an intelligent AI librarian agent for a digital library called BookSphere. You are a conversational chatbot capable of answering ANY question the user asks.

You have access to the following relevant book data from our database:
{context}

Guidelines:
- If the user asks about books or recommendations in our library, prioritize using the provided database data.
- If the user asks a question and the provided database data does NOT contain the answer (e.g., asking for a publisher not listed, asking a general knowledge question, or asking "who are you"), you MUST use your own vast external knowledge to answer the question helpfully. 
- NEVER say "I don't have access to the internet" or "the data does not include". Just answer the question directly using your own built-in knowledge.
- Keep answers concise, friendly, and informative.

User Question:
{question}"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=400,
    )

    return response.choices[0].message.content



def check_grammar_with_ai(content: str) -> str:
    prompt = f"""
You are an expert editor capable of analyzing text in multiple languages, including Malayalam. Analyze the following HTML text for grammar, spelling, and punctuation errors.

CRITICAL INSTRUCTION: The text provided is formatted in HTML. You MUST preserve all HTML tags, structure, attributes, and embedding (especially <img>, <p>, <strong>, etc.) exactly as they appear. DO NOT remove, modify, or strip any HTML tags. ONLY correct the human-readable text between the HTML tags.

If there are errors, provide a corrected version of the HTML text and a list of specific changes or suggestions.
If the text is correct, simply return the original HTML text and state that it is correct.

Return your response in valid JSON format with the following keys:
- "corrected_content": The full HTML text with grammar corrections applied (or the original HTML if no errors). Must retain all original tags.
- "suggestions": A list of strings describing specific changes (e.g., "Fixed Typo: 'thier' to 'their'"). If no changes, return an empty list.

HTML Text to analyze:
{content}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=8000,
        response_format={"type": "json_object"}
    )

    return response.choices[0].message.content


def verify_book_with_ai(title: str, author: str, description: str, summary_text: str, category: str, existing_books: list = None) -> str:
    # Build the existing books context for RAG
    existing_books_section = ""
    if existing_books:
        books_list = "\n".join(
            [f"  - ID: {b['id']}, Title: \"{b['title']}\", Author: \"{b['author']}\"" for b in existing_books]
        )
        existing_books_section = f"""
EXISTING LIBRARY BOOKS (for duplicate detection):
The following books already exist in our library. You MUST check if the submitted book is a duplicate or very similar to any of these:
{books_list}

DUPLICATE DETECTION RULES:
- Check for EXACT matches (same title and author, ignoring case)
- Check for NEAR matches (slightly different spelling, abbreviations, subtitles, or variations like "The Great Gatsby" vs "Great Gatsby")
- Check if the same book exists under a different author name (this is suspicious)
- Check if the title matches but the author is different (could be a different edition or wrong info)
"""
    else:
        existing_books_section = "\nNo existing books in the library to check for duplicates.\n"

    prompt = f"""You are an expert AI book verification agent for a digital library platform called BookSphere. You act as a real verification agent — fact-checking, cross-referencing, and analyzing book submissions before they are published.

SUBMITTED BOOK DETAILS:
- Title: {title}
- Author: {author}
- Description: {description}
- Summary: {summary_text}
- Category: {category}
{existing_books_section}
YOUR VERIFICATION TASKS (perform ALL of these as a thorough agent):

1. **DUPLICATE CHECK** (using the existing library data above):
   - Is this book already in our library? Check title AND author (case-insensitive).
   - Are there similar or near-duplicate entries? (e.g., different editions, spelling variations)
   - Flag any matches clearly.

2. **AUTHOR-TITLE VERIFICATION** (using your training knowledge):
   - Is this a real, published book? Cross-reference the title with your knowledge.
   - Is the stated author the ACTUAL author of this book?
   - If the real author is someone else, flag this as CRITICAL.

3. **SUMMARY & DESCRIPTION ACCURACY** (using your training knowledge):
   - Does the summary accurately describe this book's actual content?
   - Is the description consistent with the book's real content?
   - Flag fabricated, misleading, or significantly inaccurate summaries.

4. **CONTENT QUALITY ASSESSMENT**:
   - Rate the quality of the provided description and summary text.
   - Are they well-written, informative, and appropriate?

5. **CATEGORY VALIDATION**:
   - Is the chosen category appropriate for this book?

Provide your complete analysis in valid JSON format with these keys:
- "quality_score": Integer 1-10 rating overall quality and legitimacy.
- "content_analysis": Detailed assessment of description/summary quality (3-4 sentences).
- "author_verification": Object with:
  - "is_correct_author": true/false
  - "known_author": The actual known author (if different from stated, otherwise same as stated)
  - "details": Brief explanation
- "summary_accuracy": Object with:
  - "is_accurate": true/false
  - "details": Brief explanation of accuracy or inaccuracies
- "duplicate_check": Object with:
  - "is_duplicate": true/false - whether an exact or near-exact match exists in the library
  - "similar_books": List of objects with "id", "title", "author", "match_type" (e.g., "exact_match", "similar_title", "same_title_different_author") for any matching books found. Empty list if none.
  - "details": Brief explanation of duplicate analysis
- "category_relevance": Assessment with short reason (e.g., "Relevant - matches the book's genre")
- "flagged_issues": List of strings for any concerns. Include "DUPLICATE" prefix for duplicate issues. Empty list if none.
- "recommendation": One of "approve", "review", or "reject". Use "reject" if wrong author or exact duplicate. Use "review" if near-duplicate or minor concerns.
- "recommendation_reason": Detailed explanation for your recommendation.

IMPORTANT RULES:
- Be STRICT about author verification. Wrong author = "reject".
- Be STRICT about duplicates. Exact duplicate = "reject" with clear flag.
- Near duplicates or similar books = "review" so admin can decide.
- Always explain your reasoning clearly.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.1,
        max_tokens=2000,
        response_format={"type": "json_object"}
    )

    return response.choices[0].message.content
