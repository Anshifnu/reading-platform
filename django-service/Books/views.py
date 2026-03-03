from rest_framework.generics import ListCreateAPIView
from rest_framework.generics import ListAPIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from rest_framework.permissions import AllowAny
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from google.cloud import translate_v2 as translate
import os
import json
import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.generics import RetrieveAPIView
from .models import Category, FavoriteBook, Book, BookImage, BookSubmission
from .serializers import CategoryimgSerializer, CategorySerializer, BookSerializer, BookDetailSerializer, FavoriteBookSerializer, BookSubmissionSerializer
from django.db.models import Count
from .permissions import IsAdminOrPublisher
from .pagination import BookPagination
from .utils.ai_verifier import AIVerifier
from rest_framework.permissions import IsAdminUser
from Notifications.models import Notification
from FollowSystem.models import AuthorEarning, AuthorEarningTransaction


class BookListCreateView(ListCreateAPIView):
    serializer_class = BookSerializer
    pagination_class = BookPagination

    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = {
    "voice_type": ["exact"],
    "language": ["exact"],
    "categories": ["exact"],
    "categories__name": ["exact", "iexact"],  # ✅ IMPORTANT
    }
    search_fields = ["title"]

    def get_permissions(self):
        if self.request.method == "GET":
            return []   # 👈 allow everyone to see books
        return [IsAdminOrPublisher()]

    def get_queryset(self):
        # ✅ SHOW ALL BOOKS ON HOME
        return Book.objects.all()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


class CategoryListView(ListAPIView):
    serializer_class = CategoryimgSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            Category.objects
            .annotate(book_count=Count("books", distinct=True))
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context                                        
    

class CategoryCheckView(APIView):
    """
    Check if a category name already exists.
    GET /api/categories/check/?name=Fiction
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        name = request.query_params.get("name", "").strip()
        if not name:
            return Response({"error": "name parameter required"}, status=status.HTTP_400_BAD_REQUEST)
        exists = Category.objects.filter(name__iexact=name).exists()
        match = None
        if exists:
            cat = Category.objects.filter(name__iexact=name).first()
            match = {"id": cat.id, "name": cat.name}
        return Response({"exists": exists, "match": match})


class BookDetailView(RetrieveAPIView):
    queryset = Book.objects.all()
    serializer_class =BookDetailSerializer
    permission_classes = []  # public





class TranslateText(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get("text")
        target = request.data.get("target")

        if not text or not target:
            return Response({"error": "Text and target language required"}, status=400)

        url = "https://translation.googleapis.com/language/translate/v2"

        payload = {
            "q": text,
            "target": target,
            "format": "text",
            "key": settings.GOOGLE_API_KEY,
        }

        res = requests.post(url, data=payload)

        if res.status_code != 200:
            return Response(
                {"error": "Translation failed"},
                status=res.status_code
            )

        translated_text = res.json()["data"]["translations"][0]["translatedText"]

        return Response({
            "translatedText": translated_text
        })
    



class AddFavoriteBookView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="RemoveFavoriteBookView",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'book_id': openapi.Schema(type=openapi.TYPE_STRING),
                
            }
        )
    )

    def post(self, request):
        book_id = request.data.get("book_id")

        if not book_id:
            return Response(
                {"error": "book_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        favorite, created = FavoriteBook.objects.get_or_create(
            user=request.user,
            book_id=book_id
        )

        if not created:
            return Response(
                {"message": "Book already in favorites"},
                status=status.HTTP_200_OK
            )

        return Response(
            {"message": "Book added to favorites"},
            status=status.HTTP_201_CREATED
        )


class FavoriteBookListView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="List all favorite books of the logged-in user (only public books)",
        responses={
            200: openapi.Response(
                description="List of favorite books",
                schema=openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "id": openapi.Schema(type=openapi.TYPE_INTEGER),
                            "title": openapi.Schema(type=openapi.TYPE_STRING),
                            "image": openapi.Schema(
                                type=openapi.TYPE_STRING,
                                format=openapi.FORMAT_URI,
                                nullable=True
                            ),
                            "is_public": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        },
                    ),
                ),
            ),
            401: openapi.Response(description="Unauthorized"),
        },
    )

    def get(self, request):
        favorites = FavoriteBook.objects.filter(
            user=request.user,
            book__is_public=True  # 🔒 only public books
        ).select_related("book").prefetch_related("book__images")

        serializer = FavoriteBookSerializer(
            favorites,
            many=True,
            context={"request": request}
        )
        return Response(serializer.data)





class RemoveFavoriteBookView(APIView):
    permission_classes = [IsAuthenticated]


    @swagger_auto_schema(
        operation_description="Remove a book from user's favorites",
        manual_parameters=[
            openapi.Parameter(
                name="book_id",
                in_=openapi.IN_PATH,
                description="ID of the book to remove from favorites",
                type=openapi.TYPE_INTEGER,
                required=True,
            ),
            openapi.Parameter(
                name="Authorization",
                in_=openapi.IN_HEADER,
                description="JWT token (Bearer <token>)",
                type=openapi.TYPE_STRING,
                required=True,
            ),
        ],
        responses={
            200: openapi.Response(
                description="Book removed from favorites"
            ),
            404: openapi.Response(
                description="Book not in favorites"
            ),
            401: openapi.Response(
                description="Unauthorized"
            ),
        },
    )

    def delete(self, request, book_id):
        deleted, _ = FavoriteBook.objects.filter(
            user=request.user,
            book_id=book_id
        ).delete()

        if deleted == 0:
            return Response(
                {"error": "Book not in favorites"},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {"message": "Book removed from favorites"},
            status=status.HTTP_200_OK
        )


# ----------------------------------------------------------------
# BOOK SUBMISSION & VERIFICATION VIEWS
# ----------------------------------------------------------------

class BookSubmissionCreateView(ListCreateAPIView):
    """
    Authors submit book details here.
    """
    queryset = BookSubmission.objects.all()
    serializer_class = BookSubmissionSerializer
    permission_classes = [IsAuthenticated] # Authors can submit

    def perform_create(self, serializer):
        serializer.save(submitter=self.request.user, status="pending")
    
    def get_queryset(self):
         # Authors see their own submissions
        return BookSubmission.objects.filter(submitter=self.request.user)


class AdminSubmissionListView(ListAPIView):
    """
    Admins see pending and verified submissions.
    """
    queryset = BookSubmission.objects.filter(status__in=["pending", "verified"])
    serializer_class = BookSubmissionSerializer
    permission_classes = [IsAdminUser] 


class VerifySubmissionView(APIView):
    """
    Triggers AI Verification for a specific submission.
    The AI agent handles duplicate detection via RAG context.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            submission = BookSubmission.objects.get(pk=pk)

            # AI handles everything: verification, duplicate check, etc.
            verifier = AIVerifier()
            report = verifier.verify_submission(submission)

            submission.verification_report = report
            submission.status = "verified"
            submission.save()
            
            return Response(report, status=status.HTTP_200_OK)
        except BookSubmission.DoesNotExist:
            return Response({"error": "Submission not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ApproveSubmissionView(APIView):
    """
    Converts a Submission into a real Book.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            submission = BookSubmission.objects.get(pk=pk)
            
            # Create the actual Book
            book = Book.objects.create(
                title=submission.title,
                author=submission.author,
                description=submission.description,
                publisher=submission.publisher,
                pdf_file=submission.pdf_file,
                summary_text=submission.summary_text,
                is_public=True  # Now it's public!
            )

            # Copy cover image to BookImage if present
            if submission.cover_image:
                BookImage.objects.create(book=book, image=submission.cover_image)
            
            # Assign category if it exists
            if submission.category:
                book.categories.add(submission.category)
            elif submission.suggested_category_name:
                # Create or get new category
                category, created = Category.objects.get_or_create(
                    name=submission.suggested_category_name.strip()
                )
                book.categories.add(category)
                # Optionally update submission to link to this new category
                submission.category = category
            
            submission.status = "approved"
            submission.save()

            author = submission.submitter

            # 🪙 Award 50 coins to the author's earnings
            APPROVAL_BONUS = 50
            earning, _ = AuthorEarning.objects.get_or_create(author_id=author.id)
            earning.total_earned += APPROVAL_BONUS
            earning.save()
            AuthorEarningTransaction.objects.create(
                author_id=author.id,
                amount=APPROVAL_BONUS,
                source="BOOK_APPROVED",
            )

            # 🔔 Notify the author — book approved
            Notification.objects.create(
                user=author,
                type="BOOK_APPROVED",
                title=f"📗 Your book \u2018{submission.title}\u2019 was approved!",
                message=(
                    f"Congratulations! Your book submission \u2018{submission.title}\u2019 has been "
                    f"approved by the admin and is now live on the platform. "
                    f"You\u2019ve also received {APPROVAL_BONUS} coins as a reward! 🎉"
                ),
                related_object_id=book.id,
            )
            
            return Response({"message": "Book Approved and Published!", "book_id": book.id}, status=status.HTTP_201_CREATED)
        
        except BookSubmission.DoesNotExist:
            return Response({"error": "Submission not found"}, status=status.HTTP_404_NOT_FOUND)


class RejectSubmissionView(APIView):
    """
    Rejects a submission with feedback.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            submission = BookSubmission.objects.get(pk=pk)
            feedback = request.data.get("feedback", "Rejected by Admin.")
            
            submission.status = "rejected"
            submission.admin_feedback = feedback
            submission.save()

            # 🔔 Notify the author — book rejected
            Notification.objects.create(
                user=submission.submitter,
                type="BOOK_REJECTED",
                title=f"📕 Your book \u2018{submission.title}\u2019 was rejected",
                message=(
                    f"Unfortunately, your book submission \u2018{submission.title}\u2019 was not approved. "
                    f"Admin feedback: {feedback}"
                ),
                related_object_id=submission.id,
            )
            
            return Response({"message": "Submission rejected."}, status=status.HTTP_200_OK)
        
        except BookSubmission.DoesNotExist:
            return Response({"error": "Submission not found"}, status=status.HTTP_404_NOT_FOUND)


class TelegramWebhookView(APIView):
    """
    Handles incoming messages from the Telegram Bot.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = json.loads(request.body)
            print("TELEGRAM WEBHOOK RECEIVED:", json.dumps(data, indent=2))
            
            message = data.get("message", {})
            chat_id = message.get("chat", {}).get("id")
            text = message.get("text", "")

            if not chat_id or not text:
                print("NO CHAT_ID OR TEXT. IGNORING.")
                return Response({"status": "ok"})

            bot_token = settings.TELEGRAM_BOT_TOKEN
            send_msg_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            send_doc_url = f"https://api.telegram.org/bot{bot_token}/sendDocument"

            print(f"WEBHOOK TEXT: {text}")

            # When a user clicks the link from the frontend, it sends: /start download_book_<id>
            if text.startswith("/start download_book_"):
                book_id = text.split("/start download_book_")[-1]
                print(f"WEBHOOK BOOK ID: {book_id}")
                
                try:
                    book = Book.objects.get(id=book_id)

                    if not book.pdf_file:
                        res = requests.post(send_msg_url, json={
                            "chat_id": chat_id,
                            "text": f"Sorry, the PDF for '{book.title}' is currently unavailable."
                        })
                        print("SEND MSG RESPONSE:", res.text)
                        return Response({"status": "ok"})
                        
                    # Send a loading message first
                    requests.post(send_msg_url, json={
                        "chat_id": chat_id,
                        "text": f"Fetching '{book.title}' for you... Please wait 📂"
                    })

                    # Download the file to memory first
                    pdf_url = book.pdf_file
                    if pdf_url and not pdf_url.startswith('http'):
                        pdf_url = request.build_absolute_uri(f"{settings.MEDIA_URL}{pdf_url.lstrip('/')}")
                        
                    print(f"WEBHOOK PDF URL: {pdf_url}")
                    
                    if pdf_url.startswith('http'):
                        try:
                            # 1. Fetch the PDF directly into memory
                            pdf_response = requests.get(pdf_url, stream=True)
                            if pdf_response.status_code == 200:
                                # 2. Send it natively to Telegram as a document
                                files = {'document': (f"{book.title}.pdf", pdf_response.content, 'application/pdf')}
                                data = {'chat_id': chat_id, 'caption': f"Here is your book: {book.title} 📚"}
                                res = requests.post(send_doc_url, data=data, files=files)
                                print("SEND DOC RESPONSE:", res.text)
                            else:
                                print(f"FAILED TO DOWNLOAD PDF: {pdf_response.status_code}")
                                requests.post(send_msg_url, json={
                                    "chat_id": chat_id,
                                    "text": f"Sorry, could not download '{book.title}' from the cloud storage."
                                })
                        except Exception as e:
                            print(f"ERROR DOWNLOADING/SENDING PDF: {e}")
                            requests.post(send_msg_url, json={
                                "chat_id": chat_id,
                                "text": f"An error occurred while preparing your book: {e}"
                            })
                    else:
                        print("INVALID PDF URL")
                        res = requests.post(send_msg_url, json={
                            "chat_id": chat_id,
                            "text": f"Sorry, the file link for '{book.title}' is invalid."
                        })
                        print("SEND MSG RESPONSE:", res.text)

                except Book.DoesNotExist:
                    print(f"BOOK {book_id} DOES NOT EXIST")
                    res = requests.post(send_msg_url, json={
                        "chat_id": chat_id,
                        "text": "Sorry, I couldn't find that book in our database."
                    })
            
            elif text == "/start":
                print("WEBHOOK GENERIC START")
                res = requests.post(send_msg_url, json={
                    "chat_id": chat_id,
                    "text": "Welcome to the BookSpHere Bot! 📚\n\nYou can download books by clicking the 'Download PDF' button on any book's detail page on our website."
                })
                print("SEND MSG RESPONSE:", res.text)

        except Exception as e:
            import traceback
            traceback.print_exc()

        # Always return 200 OK so Telegram knows we received the webhook
        return Response({"status": "ok"})
