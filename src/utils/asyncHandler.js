// Wraps an async controller function, catching any rejected promise
// and forwarding the error to Express's error-handling middleware via next()
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default asyncHandler;