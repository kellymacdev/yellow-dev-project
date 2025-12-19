from datetime import date, datetime

def validateSaId(id_number):
    """
    Validate SA ID number and extract DOB
    Returns: dict {valid: bool, dob: date or None}
    """
    if len(id_number) != 13 or not id_number.isdigit():
        return {"valid": False, "dob": None}

    # Extract birth date
    yy = int(id_number[:2])
    mm = int(id_number[2:4])
    dd = int(id_number[4:6])

    # Determine century: assume 1900-1999 if YY>current year, else 2000+
    current_year = date.today().year % 100
    century = 1900 if yy > current_year else 2000
    try:
        dob = date(century + yy, mm, dd)
    except ValueError:
        return {"valid": False, "dob": None}

    if not luhn_checksum(id_number):
        return {"valid": False, "dob": None}

    return {"valid": True, "dob": dob}

# Luhn checksum validation
def luhn_checksum(num):
    digits = [int(d) for d in num]
    sum_odd = sum(digits[::2])
    sum_even = sum(sum(divmod(2*d, 10)) for d in digits[1::2])
    return (sum_odd + sum_even) % 10 == 0


def calculateAge(birthday):
    today = date.today()
    age = today.year - birthday.year - ((today.month, today.day) < (birthday.month, birthday.day))
    return age
