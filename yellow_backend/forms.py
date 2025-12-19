from django import forms
from datetime import date
from .models import Application, Phone
from .functions import validateSaId, calculateAge  # reuse your JS logic in Python

class ApplicationForm(forms.ModelForm):
    class Meta:
        model = Application
        fields = [
            "full_name",
            "id_number",
            "birthday",
            "monthly_income",
            "proof_document",
            "selected_phone"
        ]

    def clean_id_number(self):
        id_number = self.cleaned_data.get("id_number")
        if not id_number:
            raise forms.ValidationError("ID number is required.")
        # Validate SA ID
        result = validateSaId(id_number)
        if not result["valid"]:
            raise forms.ValidationError("Invalid SA ID number.")
        # Store DOB from ID for later checks
        self.id_dob = result["dob"]
        return id_number

    def clean_birthday(self):
        birthday = self.cleaned_data.get("birthday")
        if not birthday:
            raise forms.ValidationError("Birthday is required.")
        # Check that birthday matches ID if available
        if hasattr(self, "id_dob") and self.id_dob != birthday:
            raise forms.ValidationError("Birthday does not match ID number.")
        return birthday

    def clean(self):
        cleaned_data = super().clean()
        birthday = cleaned_data.get("birthday")
        monthly_income = cleaned_data.get("monthly_income")
        selected_phone = cleaned_data.get("selected_phone")

        # Age validation
        if birthday:
            age = calculateAge(birthday)
            if age < 18:
                self.add_error("birthday", "Applicant must be at least 18 years old.")
            elif age > 65:
                self.add_error("birthday", "Applicant must be under 66 years old.")

        # Phone affordability check 
        if monthly_income and selected_phone:
            if selected_phone.cashPrice > monthly_income * 10:
                self.add_error(
                    "selected_phone",
                    "Selected phone may be too expensive for your income."
                )

        # Proof of income check
        proof_document = cleaned_data.get("proof_document")
        if not proof_document:
            self.add_error("proof_document", "Proof of income document is required.")

        return cleaned_data
