from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """?page=2&page_size=50  (React asks for a large page_size for dropdowns)."""

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200
