require('dotenv').config()
const jwt = require('jsonwebtoken');
//importing .env for envirnoment variables and jsonwebtoken for verifying jwt token

function authenticateToken(request,response,next){
    //extracting authorization header from http request.
    const authHeader = request.headers['authorization']
    // removing bearer keyword form token to get jwt token
    const token = authHeader && authHeader.split(' ')[1]

    //if no token is present return unauthorized.
    if(token == null)
        return response.sendStatus(401);
    
    //else verify the token with the access key
    jwt.verify(token,process.env.ACCESS_TOKEN_KEY,(error,res)=>{
        if(error){
            return response.sendStatus(403);
        }
        else{
            response.locals = res;
        }
        next()
    })
}

module.exports ={ authenticateToken : authenticateToken }