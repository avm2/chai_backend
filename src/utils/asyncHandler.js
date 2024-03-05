
// Define a higher-order function asyncHandler that wraps an asynchronous request handler
const asyncHandler = (requestHandler) => {
    // Return an anonymous function that takes req, res, and next as parameters
    return (req, res, next) => {
        // Wrap the execution of the requestHandler in a Promise to handle asynchronous operations
        Promise.resolve(requestHandler(req, res, next))
            // If the promise resolves successfully, continue to the next middleware
            .catch((err) => next(err)) // If the promise rejects with an error, pass it to the next middleware
    }
}

// Export the asyncHandler function to make it accessible outside the module
export { asyncHandler }





/*
const asyncHandler = () =>{

}
const asyncHandler = (func) => { 
   async () =>{}
}
*/


/*
this is the try catch wala code
const asyncHandler =(fn) => async (req,res,next) =>{
    try{
        await fn(req,res,next)
    }catch(error){
        res.status(error.code || 5000).json({
            success: false,
            message: error.message
        })
    }
}
*/