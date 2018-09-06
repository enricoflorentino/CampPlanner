// File: index.js 
// Contents: Main server page for campPlanner
// Author: Rico Florentino

// Required packages
var express         = require("express");
var bodyparser      = require("body-parser");
var mongoose        = require("mongoose");
var passport        = require("passport");
var passportlocal   = require("passport-local");
var methodOR        = require("method-override");
var flash           = require("connect-flash");

// Required schema
var Camp            = require("./models/camp");
var User            = require("./models/user");

// Initializing apps/plugins
var app             = express();

// Routing
var planRoutes = require("./routes/plan");
var authRoutes = require("./routes/auth");

app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static(__dirname+ "/public"));
app.use(methodOR("_method"));
app.set("view engine", "ejs");
app.use(flash());
 
// // DATABASE CONNECTIONs

mongoose.connect(process.env.DATABASEURL,  {useNewUrlParser: true });


// Set up passport (app authentication)
app.use(require("express-session")({
    secret: "this is my first personal project",
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportlocal(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.errormessage = req.flash("error");
    res.locals.successmessage = req.flash("success");
    next();
});

// Display landing page
app.get("/", function(req, res){
    res.render("home");
});

// Using planning and authentication routes

app.use("/plan", planRoutes);
app.use("/", authRoutes);

// Handles pages that can not be found
app.get("*", function(req, res){
    res.send("Something went wrong");
});

// Listening ....
app.listen(3000, function(){
   console.log("Server has started"); 
});