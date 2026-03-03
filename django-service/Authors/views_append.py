class AuthorsWorkDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get a single work by ID",
        responses={200: AuthorsWorkSerializer()},
    )
    def get(self, request, pk):
        try:
            work = AuthorsWork.objects.get(pk=pk)
            serializer = AuthorsWorkSerializer(work)
            return Response(serializer.data)
        except AuthorsWork.DoesNotExist:
            return Response({"error": "Work not found"}, status=status.HTTP_404_NOT_FOUND)
