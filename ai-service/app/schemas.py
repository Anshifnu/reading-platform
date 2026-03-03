from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    question: str

class GrammarCheckRequest(BaseModel):
    content: str

class ExistingBook(BaseModel):
    id: int
    title: str
    author: str = ""

class BookVerifyRequest(BaseModel):
    title: str
    author: str = ""
    description: str = ""
    summary_text: str = ""
    category: str = ""
    existing_books: List[ExistingBook] = []
