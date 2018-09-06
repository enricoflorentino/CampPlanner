var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");

// Register Routes
router.get("/register", function(req, res){
    res.render("register");
});

router.post("/register", function(req, res){
   var newUser = new User({username: req.body.username, firstname:
   req.body.firstname, lastname: req.body.lastname, email: req.body.email});
   
   User.register(newUser,req.body.password, function(err, user){
       if(err){
           req.flash("error", err.message);
           return res.render("register");
       }
       passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully registered  you as " + user.username );
           res.redirect("/plan");
       });
   });
});

// Login Routes
router.get("/login", function(req, res){
    res.render("login");
});

router.post("/login", passport.authenticate("local",{
    successRedirect: "/plan",
    failureRedirect: "/login"
    }), function(req, res){
});

// Logout route
router.get("/logout", isLoggedIn, function(req, res){
    req.logout();
    req.flash("success", "Logged you out");
    res.redirect("/plan");
});

// Middleware used
function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You have to be logged in to do that")
    res.redirect("/login");
}


module.exports = router;