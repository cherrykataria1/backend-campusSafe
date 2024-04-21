require('dotenv').config();
// importing .env for envoirnment variables
function isAdmin(request,response,next){
    //checking if the role in token is user, then returning unauthorized status.
    if(response.locals.role == process.env.USER)
        response.sendStatus(401)
    else
        next()
}

module.exports = {isAdmin: isAdmin}