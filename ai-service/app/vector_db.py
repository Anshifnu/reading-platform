import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)

# Initialize the lightweight embedding model
# This will be downloaded on first run and cached locally.
try:
    model = SentenceTransformer("all-MiniLM-L6-v2")
    embedding_dimension = model.get_sentence_embedding_dimension()
except Exception as e:
    logger.error(f"Failed to load SentenceTransformer: {e}")
    model = None
    embedding_dimension = 384 # Default for all-MiniLM-L6-v2

class BookVectorDB:
    def __init__(self):
        self.index = faiss.IndexFlatL2(embedding_dimension)
        self.books_mapping = {} # Map FAISS index ID -> book dictionary
        self.is_populated = False
        
    def populate(self, books: list):
        """Generates embeddings for all books and adds them to FAISS."""
        if not books or model is None:
            return
            
        print(f"📦 Populating Vector DB with {len(books)} books...")
        
        texts = []
        self.books_mapping = {}
        
        for idx, book in enumerate(books):
            # Combine relevant fields for embedding
            title = book.get("title", "")
            author = book.get("author", "")
            summary = book.get("summary_text", "")
            categories = " ".join([c["name"] for c in book.get("categories", [])])
            
            # The semantic representation of a book
            combined_text = f"Title: {title}. Author: {author}. Categories: {categories}. Summary: {summary}"
            texts.append(combined_text)
            self.books_mapping[idx] = book
            
        # Generate embeddings in batch
        try:
            embeddings = model.encode(texts, convert_to_numpy=True)
            # Ensure index is empty before adding
            self.index.reset()
            self.index.add(embeddings)
            self.is_populated = True
            print("✅ Vector DB populated successfully!")
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")

    def semantic_search(self, query: str, top_k: int = 5) -> list:
        """Search books semantically using FAISS."""
        if not self.is_populated or model is None:
            print("⚠️ Vector DB not populated or model missing, cannot perform semantic search.")
            return []
            
        try:
            # Embed the query
            query_vector = model.encode([query], convert_to_numpy=True)
            
            # Search FAISS index
            distances, indices = self.index.search(query_vector, top_k)
            
            results = []
            for i, idx in enumerate(indices[0]):
                if idx != -1 and idx in self.books_mapping: # -1 means no result found
                    results.append(self.books_mapping[idx])
                    
            return results
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return []

# Singleton instance for the app
vector_db = BookVectorDB()
