from django.shortcuts import render

def index(request):
    return render(request, "yellow_backend/application.html")