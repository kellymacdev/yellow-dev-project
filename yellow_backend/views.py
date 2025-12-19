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
    income_str = request.GET.get("monthly_income")
    if not income_str:
        return JsonResponse({"error": "Income required"}, status=400)
    try:
        income = float(income_str)
    except ValueError:
        return JsonResponse({"error": "Invalid income"}, status=400)
    
    max_allowed_monthly = income / 10

    phones = Phone.objects.all()
    filtered = []
    for phone in phones:
        loan_principal = phone.cashPrice * (1 - phone.depositPercent)
        loan_amount = loan_principal * (1 + phone.interestRate)
        monthly_payment = loan_amount / 12

        if monthly_payment <= max_allowed_monthly:
            filtered.append({
                "id": phone.id,
                "make": phone.make,
                "model": phone.model,
                "cash_price": float(phone.cashPrice),
                "deposit_percent": float(phone.depositPercent),
                "interest_rate": float(phone.interestRate),
                "loan_principal": float(loan_principal),
                "loan_amount": float(loan_amount),
                "monthly_payment": float(monthly_payment),
            })

    return JsonResponse(filtered, safe=False)

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