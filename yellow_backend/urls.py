from django.urls import path
from yellow_backend import views

urlpatterns = [
    path("", views.index, name="index"),
    path("api/phones/", views.get_phones, name="get_phones"),
]