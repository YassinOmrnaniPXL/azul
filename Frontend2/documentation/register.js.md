# Documentation for register.js

**File:** `Frontend2/js/register.js`

## Purpose

This file manages the user registration functionality of the Azul web application. It handles registration form submission, extensive client-side validation, communication with the backend API for creating new user accounts, and comprehensive error handling for the registration process.

## Dependencies

- Requires a HTML form with ID `registerForm` that includes:
  - Email input field with ID `email`
  - Username input field with ID `username`
  - Password input field with ID `password`
  - Password confirmation input field with ID `confirmPassword`
  - Optional date input field with ID `lastVisit` (for recording last visit to Portugal)
  - A submit button
  - An error display element with ID `errorMessage`
- Relies on a backend API at `https://localhost:5051/api/Authentication/register` for user registration

## Structure & Flow

1. **Initialization**
   - Initializes when the DOM content is fully loaded
   - Caches form elements and adds an event listener for form submission

2. **Form Handling**
   - Captures all input values from the form fields
   - Prevents default form submission behavior
   - Displays a loading state (disables submit button, changes button text)

3. **Comprehensive Validation**
   - Performs detailed client-side validation:
     - Checks for empty required fields with custom messages for each field
     - Validates email format using regex pattern
     - Enforces username minimum length (3 characters)
     - Enforces password minimum length (6 characters)
     - Confirms password match between both password fields
     - For the optional date field, validates that dates are in the past
   - Returns early with specific error messages if any validation fails

4. **API Communication**
   - Prepares a payload with user registration data
   - Sends a POST request to the registration endpoint
   - Sets appropriate headers for JSON communication

5. **Response Processing**
   - For successful registration (HTTP 200):
     - Redirects to the login page with the email pre-filled
   - For different error scenarios:
     - Handles conflict errors (HTTP 409) for duplicate email/username
     - Processes validation errors (HTTP 400) with structured error responses
     - Manages server errors (HTTP 500+)
     - Parses and displays error messages from the API response
   - For network errors:
     - Displays connection error message
     - Logs detailed error information to console

6. **UI Feedback**
   - Provides specific error messages for different validation scenarios
   - Restores the submit button state after request completion
   - Offers clear guidance to users based on the type of error encountered

## Error Handling

The script handles multiple error scenarios with user-friendly messages:
- Missing or incomplete form fields (separate messages for each field)
- Invalid email format
- Username too short
- Password too short
- Password mismatch
- Invalid date (future date entered)
- Duplicate email or username
- Structured validation errors from backend
- Server errors
- Network connection issues

## Security Considerations

- Performs client-side validation for usability but relies on server validation for security
- Does not transmit or store tokens during registration
- Passes the user to the login page after successful registration rather than automatically logging them in 