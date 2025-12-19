
// Basic application state
const state = {
    fullName: null,
    idNumber: null,
    idValid: false,
    idDob: null,
    birthday: null,
    birthdayValid: false,
    monthlyIncome: null,
    proofDocument: null,

    selectedPhoneId: null,
};

// DOM elements
const steps = {
    personal: document.getElementById("step-personal"),
    income: document.getElementById("step-income"),
    phone: document.getElementById("step-phone"),
    submit: document.getElementById("step-submit"),
};

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded");

const inputs = {
    fullName: document.getElementById("full-name"),
    idNumber: document.getElementById("id-number"),
    birthday: document.getElementById("birthday"),
    monthlyIncome: document.getElementById("monthly-income"),
    proofDocument: document.getElementById("proof-document"),
};

const errors = {
    id: document.getElementById("id-error"),
    birthday: document.getElementById("birthday-error"),
    age: document.getElementById("age-error"),
};

const phoneOptionsEl = document.getElementById("phone-options");

// Reveal functions
function showStep(stepName) {
    Object.values(steps).forEach(step => step.classList.add("hidden"));
    steps[stepName].classList.remove("hidden");
}

function showUpTo(stepName) {
    const order = ["personal", "income", "phone", "submit"];
    for (const step of order) {
        steps[step].classList.remove("hidden");
        if (step === stepName) break;
    }
}

// Rendering functions
function render() {
    // Start out with only the personal info step
    showUpTo("personal");

    // Clear previous errors
    Object.values(errors).forEach(error => {
        error.textContent = "";
        error.classList.add("hidden");
    });

    // ID error handling
    //if (state.idNumber && !state.idValid) {
    //    errors.id.textContent = "Invalid SA ID number.";
    //    errors.id.classList.remove("hidden");
    //}

    // Birthday match error handling
    if (state.idDob && state.birthday && !state.birthdayValid) {
        errors.birthday.textContent = "Birthday does not match ID number.";
        errors.birthday.classList.remove("hidden");
    }

    // Age verification
    const age = state.idDob ? calculateAge(state.idDob) : null;
    if (age !== null && age < 18) {
        errors.age.textContent = "Applicants must be at least 18 years old.";
        errors.age.classList.remove("hidden");
    }


    // Form progression steps
    if (state.idValid && state.birthdayValid && age >= 18) {
        console.log("ID and birthday valid:", state.idValid, state.birthdayValid);
        showUpTo("income");
    }

    if (state.monthlyIncome && state.proofDocument) {
        showUpTo("phone");
    }

    if (state.selectedPhoneId) {
        showUpTo("submit");
    }
}

// Event listeners
inputs.fullName.addEventListener("input", (event) => {
    state.fullName = event.target.value.trim() || null;
});

inputs.idNumber.addEventListener("blur", (event) => {
    console.log("ID number field lost focus");
    const value = event.target.value.replace(/\D/g, "");
    inputs.idNumber.value = value;
    console.log("ID Number entered:", value);
    state.idNumber = value;

    const result = validateSaId(value);
    console.log("ID validation result:", result);
    state.idValid = result.valid;
    state.idDob = result.dob || null;
    console.log("Extracted DOB from ID:", state.idDob);

    if (!state.idValid) {
        errors.id.textContent = "Invalid SA ID number.";
        errors.id.classList.remove("hidden");
    } else {
        errors.id.textContent = "";
        errors.id.classList.add("hidden");
    }

    // Re-check birthday match if birthday already entered
    if (state.birthday && state.idDob) {
        state.birthdayValid = birthdayMatchesId(state.birthday, state.idDob);
    }

});

inputs.idNumber.addEventListener("input", (event) => {
    const value = event.target.value.replace(/\D/g, "");
    inputs.idNumber.value = value;

    state.idNumber = value;

    const result = validateSaId(value);

    state.idValid = result.valid;
    state.idDob = result.dob || null;

    // Re-check birthday match if birthday already entered
    if (state.birthday && state.idDob) {
        state.birthdayValid = birthdayMatchesId(state.birthday, state.idDob);
    }

    render();
});



inputs.birthday.addEventListener("change", (event) => {
    const value = event.target.value;

    state.birthday = value;
    console.log("Birthday entered:", value);

    if (state.idDob) {
        state.birthdayValid = birthdayMatchesId(value, state.idDob);
    } else {
        state.birthdayValid = false;
    }

    render();
});


inputs.monthlyIncome.addEventListener("input", (event) => {
    const income = parseFloat(event.target.value);

    if (!income || income <= 0) {
        state.monthlyIncome = null;
        state.selectedPhoneId = null;
    } else {
        state.monthlyIncome = income;
    }

    render();
});

inputs.proofDocument.addEventListener("change", (event) => {
    state.proofDocument = event.target.files[0] || null;
    render();
});

// Initial render
render();

});