from django import forms
from .models import Application
from .functions import validateSaId, calculateAge  # recheck frontend validation 

MAX_FILE_SIZE_MB = 5
ALLOWED_CONTENT_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
]

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

    def clean_proof_document(self):
        file = self.cleaned_data.get("proof_document")

        if not file:
            raise forms.ValidationError("Proof of income document is required.")

        # Size check
        if file.size > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise forms.ValidationError(f"File size must be under {MAX_FILE_SIZE_MB}MB.")
        
        # Content-type check
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise forms.ValidationError(
                "Invalid file type. Allowed: PDF, JPG, PNG."
            )

        return file

    def clean(self):
        cleaned_data = super().clean()
        id_number = cleaned_data.get("id_number")
        birthday = cleaned_data.get("birthday")
        monthly_income = cleaned_data.get("monthly_income")
        selected_phone = cleaned_data.get("selected_phone")

        if id_number and birthday:
            result = validateSaId(id_number)
            if result["dob"] != birthday:
                self.add_error("birthday", "Birthday does not match ID number.")
        
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
        
        return cleaned_data