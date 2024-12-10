import { T } from "./app.mjs";
import { CONTACT_ME_ENDPOINT, EMAIL_VALIDATION_REGEX } from "./constants/constants.mjs";
import { hideLoader, showLoader } from "./utils/loaderUtils.mjs";

document.addEventListener('DOMContentLoaded', () => {
    const formButton = document.getElementById("contact-me-button");
    formButton?.addEventListener("click", checkFormValidity);
});

const checkFormValidity = () => {
    const name = document.getElementById("form-name").value?.trim();
    const email = document.getElementById("form-email").value?.trim();
    const message = document.getElementById("form-message").value?.trim();

    // Checking if any field is empty
    if (name === "" || email === "" || message === "") {
        Swal.fire("Be Careful!", "Make sure that all the fields are completely filled!", "warning");
        return;
    }

    // Validating the email address
    if (!T.isType("reg", EMAIL_VALIDATION_REGEX).test(email)) {
        Swal.fire("Invalid Email Address!", "Please enter a valid email address.", "warning");
        return;
    }

    // Preparing form data to save
    const formData = {
        name,
        email,
        message
    };

    saveContact(formData);
};

const saveContact = async (formData) => {
    try {
        if (Object.keys(formData).length === 0) {
            throw new Error("No data to save.");
        }

        showLoader();

        const call = await fetch(CONTACT_ME_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(formData)
        });

        if (!call.ok) {
            throw new Error(`Error Saving Contact ${call.status}`);
        }

        const { status, message } = await call.json();

        if (!status) {
            throw new Error(`Error Saving Contact: ${message}`);
        }

        document.getElementById("form-name").value = "";
        document.getElementById("form-email").value = "";
        document.getElementById("form-message").value = "";

        Swal.fire("Success!", "Your contact information has been saved successfully, I'll be back ASAP!", "success");
    } catch (error) {
        console.error(error);

        Swal.fire("Error Saving Contact!", "An error occurred while trying to save your contact information. Please try again later.", "error");
    } finally {
        hideLoader();
    }
}