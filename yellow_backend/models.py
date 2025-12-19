from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

class Phone(models.Model):
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100, unique=True)
    cashPrice = models.DecimalField(max_digits=10, decimal_places=2)
    depositPercent = models.DecimalField(
        max_digits=4, decimal_places=2
    )
    interestRate = models.DecimalField(
        max_digits=4, decimal_places=2
    )
    
    max_salary_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=10.0,
    help_text="Max number of months' salary allowed to purchase"
)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def loanPrincipal(self):
        """
        Amount financed = cash price minus deposit
        """
        return self.cashPrice * (1 - self.depositPercent)

    def loanAmount(self):
        """
        Total loan including interest (1-year loan)
        """
        return self.loanPrincipal() * (1 + self.interestRate)
    
    def dailyPayment(self):
        """
        Loan divided over 360 days
        """
        return self.loanAmount() / 360

    def __str__(self):
        return f"{self.make} {self.model} (R{self.cashPrice})"
    


class Application(models.Model):
    full_name = models.CharField(max_length=150)
    id_number = models.CharField(max_length=13, unique=True)
    birthday = models.DateField()
    monthly_income = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    proof_document = models.FileField(
        upload_to='proof_documents/',
        null=True,
        blank=True
    )
    selected_phone = models.ForeignKey(Phone, on_delete=models.PROTECT) #phones cannot be deleted if linked to applications
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # store calculated loan values 
    loanPrincipal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    loanAmount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    dailyPayment = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    def save(self, *args, **kwargs):
        """
        Automatically calculate loan values before saving
        """
        if self.selected_phone:
            self.loanPrincipal = self.selected_phone.loanPrincipal()
            self.loanAmount = self.selected_phone.loanAmount()
            self.dailyPayment = self.selected_phone.dailyPayment()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} ({self.id_number}) - {self.selected_phone}"