const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");


let User = require("../models/Users");

router.get("/login", (req, res) => res.render("login"));

router.get("/register", (req, res) => res.render("register"));

//Register handle
router.post("/register", (req, res) => {
    const {username, password, password2} = req.body;

    let errors = [];

    if(!username || !password || !password2){
        errors.push({msg: "Vennligst fyll inn alle felter"});
    }
    if(password !== password2){
        errors.push({msg: "Passordene er ikke like"});
    }
    if(password.length < 6){
        errors.push({msg:"Passordet må ha minst 6 tegn"});
    }
    if(errors.length > 0){
        res.render("register", {
            errors,
            username,
            password,
            password2
        })
    }else{
        User.findOne({username:username})
        .then(user =>{
            if(user){
                errors.push({msg:"Brukernavn finnes fra før av"});
                res.render("register", {
                    errors,
                    username,
                    password,
                    password2
                }) 
            }else{
                const newUser = new User({
                    username,
                    password
                })
                bcrypt.genSalt(10, (err, salt)=> bcrypt.hash(newUser.password, salt, (err, hash) =>{
                    if(err) throw err;
                    newUser.password = hash;
                    newUser.save()
                    .then(user => {
                        req.flash("success_msg", "Du er nå registrert og kan logge inn.")
                        res.redirect("/users/login");
                    })
                    .catch(err => console.log(err));    
                })) 
            }
        })

        
    }
})

router.post('/login', (req, res, next) => {
    let room = req.body.room;
    let username = req.body.username;
    passport.authenticate('local', {
        successRedirect: `/dashboard?username=${username}&room=${room}`,
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success_msg", "Du har logget ut");
    res.redirect("/users/login");
});


module.exports = router;