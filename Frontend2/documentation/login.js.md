# Documentation for login.js

**File:** `Frontend2/js/login.js`

## Purpose

This file manages the login functionality of the Azul web application. It handles form submission, client-side validation, authentication with the backend API, and error handling for the login process.

## Dependencies

- Requires a HTML form with ID `loginForm` that includes:
  - An email input field with ID `email`
  - A password input field with ID `password`
  - A submit button
  - An error display element with ID `errorMessage`
- Relies on a backend API at `https://localhost:5051/api/Authentication/token` for authentication

## Structure & Flow

1. **Event Listeners**
   - Initializes when the DOM content is fully loaded
   - Sets up event handlers for form submission
   - Checks URL parameters for email (passed from registration)

2. **Form Handling**
   - Captures input values from the form fields
   - Prevents default form submission behavior
   - Displays a loading state (disables submit button, changes text)

3. **Validation**
   - Performs client-side validation:
     - Checks for empty fields with specific error messages for email and password
     - Validates email format using regex
   - Returns early with appropriate error messages if validation fails

4. **API Communication**
   - Sends a POST request to the authentication endpoint
   - Includes email and password in the request payload
   - Sets proper headers for JSON communication

5. **Response Processing**
   - For successful authentication (HTTP 200):
     - Attempts to store the received token in sessionStorage
     - Redirects to the lobby page
   - For authentication failures:
     - Handles specific status codes (401, 404, 500) with appropriate messages
     - Parses and displays any error messages from the API
   - For network errors:
     - Displays connection error message
     - Logs detailed error information to console

6. **UI Feedback**
   - Shows specific error messages for different scenarios
   - Restores the submit button after request completion
   - Provides clear instructions to the user based on error type

## Error Handling

The script handles multiple error scenarios with specific user-friendly messages:
- Missing or incomplete form fields
- Invalid email format
- Authentication failures (wrong credentials)
- User not found
- Server errors
- Network connection issues

## Security Considerations

- Performs only client-side validation (server must also validate)
- Does not include sensitive authentication tokens in initial requests
- Stores authentication token in sessionStorage when received from the server 