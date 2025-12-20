# Phone Loan Application (Django)

This project is a minimal Django-based web application for handling device financing applications, including loan calculations, document uploads, and persistent storage of application data.

---

## Project Overview

Applicants submit:
- Personal details
- Monthly income
- A selected phone model
- Proof-of-income documentation

The system:
- Stores all application data in a relational database
- Automatically calculates loan values at save-time
- Prevents deletion of phone models already linked to applications

---

## Tech Stack

- **Python 3.10+**
- **Django 4.x**
- **SQLite** (development)
- **HTML / CSS templates**
- **Django ORM**
- **Local file storage** for uploaded documents

---

## Core Models

### `Phone`
Represents a purchasable device and its financing parameters.

**Stored fields:**
- `make`
- `model` (unique)
- `cashPrice`
- `depositPercent`
- `interestRate`
- Timestamps

**Computed (not stored):**
- Loan principal
- Total loan amount
- Daily payment

These values are calculated dynamically and are not persisted on the `Phone` model.

---

### `Application`
Represents a financing application tied to a single phone.

**Stored fields:**
- Applicant identity and income data
- Uploaded proof-of-income document
- Foreign key to `Phone`
- Persisted loan calculations
- Timestamps

**Important behavior:**
- Loan values (`loanPrincipal`, `loanAmount`, `dailyPayment`) are calculated automatically in `save()`
- These values are stored in the database for consistency

---

## File Upload Handling

Proof-of-income documents:
- Are stored in `MEDIA_ROOT/proofs/`
- Use a custom filename format to avoid collisions and preserve traceability:
  <id_number>_<uuid>.<ext>

Local storage used in development environment, something like an S3 bucket should be used in production. 

---

## Design Choices Summary

### 1. Frontend Validation -> Progressive Form Disclosure
- The application form is split into logical sections.
- Subsequent sections are only revealed after the current section validates successfully (see [Frontend validation rules](#frontend-validation-user-guidance-only)).
- This exists to:
  - improve user experience
  - prevent submission of incomplete or inconsistent data
- If validation does not succeed, the user is served an inline error message and progression is blocked until validation success.
  
This approach reduces backend error handling complexity, however it does not replaces backend validation and is assumed to be bypassable.

### 2. Backend Validation (Authoritative)
All critical validation is enforced server-side using Django’s form and model validation mechanisms.
Includes:
- Django Form/ModelForm validation including file presence and association checks (see [Backend validation rules](#backend-django-form-level-validation-authoratative))
- Field-level validators (e.g. MinValueValidator) (see [Model Field validation rules](#model-field-validation))
- Database constraints (e.g. uniqueness on ID numbers and phone models) and foreign key integrity enforcement (see [Database integrity rules](#database-level-integrity))

No application state is trusted unless it has passed backend validation.

### 3. Loan Calculation Strategy
- Loan values are calculated server-side once, at save-time, inside the Application.save() method, ensuring:
  - persisting financial state
  - authorative record of what was agreed at submission
  - loan values cannot become inconsistent through frontend manipulation
- Calculations are derived from the selected Phone model parameters.
- Calculated fields are persisted in the database, rather than recomputed dynamically.

### 4. Backend-Filtered Phone Availability
Phone options presented to the user are not static. 
- The frontend requests available phone models from a backend endpoint
- The backend filters phone records based on the applicant’s declared monthly income
- Only phones satisfying affordability constraints are returned (10x monthly cost < monthly income)
- The frontend renders only the filtered set and does not apply affordability logic independently
- The frontend prevents progression if no eligible phones are returned
  
---

## Validation
Validation is implemented as a layered system, with increasing authority from frontend to database.

### Frontend Validation (User Guidance Only)
**Rules enforced:**
- All fields must be non-empty before proceeding to the next section
- South African ID number validation
  ID number must:
    - Be exactly 13 digits
    - Pass Luhn Check Sum validation
- Duplicate application prevention (non-authoritative)
  If an entered ID number is already associated with an existing application, form progression is blocked
- The embedded birth date encoded in the ID number is extracted client-side
- Age verification
  Age is calculated from ID number, applicant must be between 18 and 65 inclusive 
- Birthday consistency enforcement:
  The date of birth derived from the SA ID number must match the user-supplied birthday
- Numeric inputs (e.g. monthly income) must be parseable as numbers
- Non-negative numeric constraints for income
- File format (pdf, png, jpeg) and file size (max 5MB) restrictions
- Section advancement blocked until current section validates

### Backend Django Form-Level Validation (Authoratative)

All submissions are validated server-side using Django Form/ModelForm validation before any database interaction occurs.

**Rules enforced:**
- Required fields (full_name, id_number, birthday, monthly_income, selected_phone, proof_document)
- SA ID validation and birthday match validation
- Age verification
- File presence and binding to the application instance
- Phone affordability validation (incorrectly calculated oops)

### Model Field Validation
Model-level validation enforces constraints that must hold regardless of view or form logic.

Examples:
- monthly_income >= 0 via MinValueValidator
- id_number uniqueness across applications
- model uniqueness across phones
- Decimal precision limits for all monetary values

These constraints apply universally, including object creation in Django shell.

### Database-Level Integrity
Certain guarantees are enforced at the database layer and cannot be bypassed by application logic.

Includes:
- Unique constraints on identifying fields
- Foreign key integrity (Application.selected_phone)
- Referential protection (PROTECT) preventing deletion of phones linked to applications ensuring historical applications cannot be invalidated by later data changes

### Rejection and Failure Catches
An application is rejected (not persisted) and structured error message supplied if:
- Any required field fails validation
- Backend validation fails at any layer
- Database constraints are violated
- File upload fails or is missing
No partial or intermediate application states are stored.

### Validation Omissions
The following backend validations are not implemented at this stage:
- Document content verification

---

## Project Structure (relevant parts)
```
project_root/
├── manage.py
├── requirements.txt
├── .gitignore
├── media/
│ └── proofs/
├── yellow_backend/
│ ├── models.py           (defining Phone and Application data models)
│ ├── views.py
│ ├── functions.py        (defining helper functions for server-side ID, birthday match and age validation)
│ ├── forms.py            (defining server-side ModelForm validation)
│ ├── urls.py
| ├── static/
|   ├── js/
|   |   ├── app.js        (controlling workflow, frontend validation)
|   │   └── helpers.js    (defining helper functions for frontend ID, birthday match and age validation)
│   └── css/
│ └── templates/
└── db.sqlite3
```
---

## Environment Setup

### 1. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate
```
### 2. Install dependencies
```bash
pip install -r requirements.txt
```
### 3. Apply migrations
```bash
python manage.py migrate
```
### 4. Run Dev server
```bash
python manage.py runserver
```



