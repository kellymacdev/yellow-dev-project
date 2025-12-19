// ID validation
function luhnCheck(number) {
    let sum = 0;
    let alternate = false;

    for (let i = number.length - 1; i >= 0; i--) {
        let n = parseInt(number[i], 10);

        if (alternate) {
            n *= 2;
            if (n > 9) n -= 9;
        }

        sum += n;
        alternate = !alternate;
    }

    return sum % 10 === 0;
}

// Extract date of birth from SA ID number
function extractDobFromId(idNumber) {
    const yy = parseInt(idNumber.slice(0, 2), 10);
    const mm = parseInt(idNumber.slice(2, 4), 10);
    const dd = parseInt(idNumber.slice(4, 6), 10);

    const currentYear = new Date().getFullYear() % 100;
    const century = yy <= currentYear ? 2000 : 1900;

    const year = century + yy;

    const date = new Date(year, mm - 1, dd);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== mm - 1 ||
        date.getDate() !== dd
    ) {
        return null;
    }

    return date;
}

// Validate SA ID number
function validateSaId(idNumber) {
    if (!/^\d{13}$/.test(idNumber)) return { valid: false };

    const dob = extractDobFromId(idNumber);
    if (!dob) return { valid: false };

    if (!luhnCheck(idNumber)) return { valid: false };

    return {
        valid: true,
        dob,
    };
}

// Check birthday matches DOB from ID
function birthdayMatchesId(birthdayStr, dobFromId) {
    if (!birthdayStr || !dobFromId) return false;

    const [year, month, day] = birthdayStr.split("-").map(Number);

    return (
        year === dobFromId.getFullYear() &&
        month === dobFromId.getMonth() + 1 &&
        day === dobFromId.getDate()
    );
}

// Calculate age from DOB
function calculateAge(dob) {
    if (!dob) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

