from django.shortcuts import render, redirect
from django.http import JsonResponse
from yellow_backend.forms import ApplicationForm
from .models import Phone, Application

def index(request):
    return render(request, "yellow_backend/application.html")

def check_id_exists(request):
    id_number = request.GET.get("id_number")

    if not id_number or len(id_number) != 13:
        return JsonResponse({"exists": False})

    exists = Application.objects.filter(id_number=id_number).exists()
    return JsonResponse({"exists": exists})


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

def apply_loan(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)
    
    if request.method == "POST":
        form = ApplicationForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return JsonResponse({
                "success": True
            }) 
    else:
        form = ApplicationForm()
    return JsonResponse({
            "success": False,
            "errors": form.errors
        }, status=400)

def application_success(request):
    return render(request, "yellow_backend/success.html")