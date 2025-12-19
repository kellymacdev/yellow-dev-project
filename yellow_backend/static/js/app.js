
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
    availablePhones: [],

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
    
    if (age !== null && age < 18 || age !== null &&age > 65) {
        errors.age.textContent = "Applicants must be between 18 and 65 years of age.";
        errors.age.classList.remove("hidden");
    }


    // Form progression steps
    if (state.idValid && state.birthdayValid && 18 <= age && age <= 65) {
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


// ________________________________________ Fetch Phone Data ________________________________________

async function loadPhones() {
    const res = await fetch("/api/phones/");
    const phones = await res.json();
    state.availablePhones = phones;
    console.log("Loaded phones:", phones);

    const phoneSelect = document.getElementById("phone-select");
    phoneSelect.innerHTML = '<option value="">-- Choose a phone --</option>'; // reset

    phones.forEach(phone => {
        const option = document.createElement("option");
        option.value = phone.id;
        option.textContent = phone.make + " " + phone.model;
        phoneSelect.appendChild(option);
    });

    // Add event listener for selection
    phoneSelect.addEventListener("change", () => {
        const selectedId = phoneSelect.value;
        state.selectedPhoneId = selectedId ? parseInt(selectedId) : null;
        displayLoanInfo();
        render();
    });
}

function displayLoanInfo() {
    const infoEl = document.getElementById("phone-loan-info");

    if (!state.selectedPhoneId) {
        infoEl.classList.add("hidden");
        return;
    }


    const phone = state.availablePhones.find(phone => phone.id === state.selectedPhoneId);

    document.getElementById("loan-cash-price").textContent = phone.cash_price.toFixed(2);
    document.getElementById("loan-deposit-percent").textContent = (phone.deposit_percent * 100).toFixed(0);
    document.getElementById("loan-deposit-amount").textContent = (phone.cash_price * phone.deposit_percent).toFixed(2);

    const loanPrincipal = phone.cash_price * (1 - phone.deposit_percent);
    const loanAmount = loanPrincipal * (1 + phone.interest_rate);
    const dailyPayment = loanAmount / 360;

    document.getElementById("loan-principal").textContent = loanPrincipal.toFixed(2);
    //document.getElementById("loan-interest-rate").textContent = (phone.interest_rate * 100).toFixed(2);
    document.getElementById("loan-amount").textContent = loanAmount.toFixed(2);
    document.getElementById("daily-payment").textContent = dailyPayment.toFixed(2);

    infoEl.classList.remove("hidden");
}


// Event listeners
inputs.fullName.addEventListener("input", (event) => {
    state.fullName = event.target.value.trim() || null;
});

inputs.idNumber.addEventListener("blur", async (event) =>  {
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
        console.log("Checking if ID number already exists via API");
        try {
        const res = await fetch(`/api/check-id/?id_number=${state.idNumber}`);
        const data = await res.json();
        console.log("ID existence check response:", data);
        if (data.exists) {
            errors.id.textContent = "An application with this ID number already exists.";
            errors.id.classList.remove("hidden");
            state.idValid = false;
            //render();
        }
    } catch (err) {
        console.error("ID check failed:", err);
    }
        
    }

    // Re-check birthday match if birthday already entered
    if (state.birthday && state.idDob) {
        state.birthdayValid = birthdayMatchesId(state.birthday, state.idDob);
        console.log("Birthday match result:", state.birthdayValid);
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
        console.log("Birthday match result:", state.birthdayValid);
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


// Form submission
const formEl = document.getElementById("loan-application-form");
const formErrorsEl = document.getElementById("form-errors");
formEl.addEventListener("submit", async (event) => {
    event.preventDefault(); 

    const formData = new FormData();
    formData.append("full_name", state.fullName);
    formData.append("id_number", state.idNumber);
    formData.append("birthday", state.birthday);
    formData.append("monthly_income", state.monthlyIncome);
    formData.append("proof_document", state.proofDocument);
    formData.append("selected_phone", state.selectedPhoneId);

    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    try {
        const res = await fetch("/apply-loan/", {
            method: "POST",
            headers: { "X-CSRFToken": csrftoken },
            body: formData
        });

        const data = await res.json();
        console.log("Form submission response:", data);

        if (res.ok && data.success) {
            window.location.href = "/success/";
        } else if (data.errors) {
            formErrorsEl.innerHTML = Object.values(data.errors)
                .flat()
                .map(err => `<p>${err}</p>`)
                .join("");
        }
    } catch (err) {
        console.error("Error submitting form:", err);
    }
});


// Initial render
render();
loadPhones();

});