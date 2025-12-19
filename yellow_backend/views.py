from django.shortcuts import render
from django.http import JsonResponse
from .models import Phone, Application

def index(request):
    return render(request, "yellow_backend/application.html")


def get_phones(request):
    phones = Phone.objects.all()
    data = [
        {
            "id": phone.id,
            "make": phone.make,
            "model": phone.model,
            "cash_price": float(phone.cashPrice),
            "deposit_percent": float(phone.depositPercent),
            "interest_rate": float(phone.interestRate),
        }
        for phone in phones
    ]
    return JsonResponse(data, safe=False)