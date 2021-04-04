function errorHandler(err, req, res, next){
    //jwt authentication error message handler
    if(err.name === 'UnauthorizedError') {
        return res.status(401).json({message: "The user is not authorized"})
    }

    //validation error message handler
    if(err.name === 'ValidationError') {
        return res.status(401).json({message: err})
    }

    //default server error message
    return res.status(500).json(err);
}

module.exports = errorHandler;