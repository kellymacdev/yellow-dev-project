from django.urls import path
from yellow_backend import views

urlpatterns = [
    path("", views.index, name="index"),
    path("api/check-id/", views.check_id_exists, name="check_id_exists"),
    path("api/phones/", views.get_phones, name="get_phones"),
    path("apply-loan/", views.apply_loan, name="apply_loan"),
    path("success/", views.application_success, name="application_success"),
]