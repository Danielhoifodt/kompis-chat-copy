module.exports = {
    ensureAuthenticated: function(req, res, next){
        if(req.isAuthenticated()){
            return next();
        }
        req.flash("error_msg", "Vennligst logg inn for å komme til chat rom.");
        res.redirect("/users/login");
    }
}