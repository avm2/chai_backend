// Define a custom Error class ApiError which extends the built-in Error class
class ApiError extends Error {
    // Constructor for ApiError class
    constructor(
        // Parameters for the constructor: statusCode, message, errors, stack
        statusCode,
        message= "Something went wrong", // Default message if not provided
        errors=[], // Array to store errors, default empty array
        stack="" // Stack trace, default empty string
    ){
        // Call the constructor of the parent class (Error)
        super(message)

        // Assigning values to properties of the ApiError instance
        this.statusCode = statusCode // HTTP status code
        this.data = null // Data associated with the error (initialized as null)
        this.message = message // Error message
        this.success = false // Indication of success/failure (initialized as false)
        this.errors = errors // Array to store errors

        // If stack trace is provided, assign it; otherwise, capture the stack trace
        if(stack){
            this.stack = stack // Assign provided stack trace
        }
        else{
            Error.captureStackTrace(this, this.constructor) // Capture stack trace
        }
    }
}

// Export the ApiError class to make it accessible outside the module
export { ApiError }
