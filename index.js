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

app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static(__dirname+ "/public"));
app.use(methodOR("_method"));
app.set("view engine", "ejs");
app.use(flash());

// DATABASE CONNECTIONs
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

app.get("/", function(req, res){
    res.render("home");
});


// Register Routes
app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
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
app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", passport.authenticate("local",{
    successRedirect: "/plan",
    failureRedirect: "/login"
    }), function(req, res){
});

app.get("/logout", isLoggedIn, function(req, res){
    req.logout();
    req.flash("success", "Logged you out");
    res.redirect("/plan");
});

// Index Route -- displaying all plans

app.get("/plan", function(req, res){
    Camp.find({}, function(err, allplans){
        if (err) {
            console.log(err);
        } else {
            res.render("index", {allplans: allplans});
        }
    });
});

// Create New Plan
app.get("/plan/new", isLoggedIn,function(req, res){
    res.render("new");
});

app.post("/plan", isLoggedIn, function(req, res){
    
    var name        = req.body.name;
    var creator     = {
        id: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        email: req.user.email,
                    };
    var linkToSite  = req.body.linkToSite;
    var address    = req.body.address;
    var passwordKey = req.body.passwordKey;
    var numPpl      = req.body.numPpl;
    var beginDate, endDate;
    if (req.body.beginTime){
        beginDate = new Date(req.body.beginDate + "T" + req.body.beginTime + ":00Z");
    } else {
        beginDate = req.body.beginDate;
    }
    if (req.body.endTime){
        endDate = new Date(req.body.endDate + "T" + req.body.endTime + ":00Z");
    } else {
        endDate = req.body.endDate;
    }
    var budget      = req.body.budget;
    
    var newCamp = {name: name, creator: creator,
    linkToSite: linkToSite, 
    passwordKey: passwordKey, numPpl: numPpl, address: address, beginDate: beginDate, 
    endDate : endDate, budget: budget};

    Camp.create(newCamp, function(err, newlyCreated){
        if(err) {
            req.flash("error", err.message);
        } else {
            req.flash("Successfully created your plan");
            res.redirect("/plan");
        }
    });
});

// Show Route (for one plan)

app.get("/plan/:id", isLoggedIn, function(req, res) {
    Camp.findById(req.params.id, function(err, camp){
        if (err) {
            req.flash("error", err.message);
        } else {
            res.render("show", {camp : camp});
        }
    });
});


// Edit Route (for people: different to either)
app.get("/plan/:id/edit", isLoggedIn, function(req, res){
    Camp.findById(req.params.id, function(err, camp){
        if (err) {
            req.flash("error", err.message);
        } else {
            res.render("edit", {camp: camp});
        }
    });
});

// Update Route (for people and creator: different to either)
app.put("/plan/:id", isLoggedIn, function(req, res){
    Camp.findById(req.params.id, function(err, camp){
        if (err) {
            req.flash("error", err.message);
        } else {
            
            // Must provide PIN to submit changes
            if (req.body.pin != camp.passwordKey) {
                req.flash("error", "Incorrect or no PIN!" );
                return res.redirect("/plan");
            }
            
            // Changes here can only be made by event organizer
            if(req.body.name) {
                camp.name = req.body.name;
            }
            if(req.body.numPpl) {
                camp.numPpl = req.body.numPpl;
            }
            if(req.body.address) {
                camp.address = req.body.address;
            }
            if(req.body.beginDate) {
                camp.beginDate = req.body.beginDate;
            }
            if(req.body.endDate){
                camp.endDate = req.body.endDate;
            }
            if (req.body.beginTime){
                camp.beginDate = new Date(camp.beginDate + "T" + req.body.beginTime + ":00Z");
            }
            if (req.body.endTime){
                camp.endDate = new Date(camp.endDate + "T" + req.body.endTime + ":00Z");
            }
            if(req.body.budget) {
                camp.budget = req.body.budget;
            }
            if(req.body.linkToSite) {
                camp.linkToSite = req.body.linkToSite;
            }
            
            // MAX LENGTH
            if (camp.invited.length == 11) {
                req.flash("error", "Max length is" + camp.invited.length);
                return res.redirect("/plan");
            }
            if (req.body.confirmed) {
                camp.invited.push(req.user.firstname);
            }
            
            if (req.body.trans == "I am a driver") {
                camp.drivers.push({
                    drivername: req.user.firstname,
                    seats: req.body.seats
                });
            } else if(req.body.trans == "I am a passenger") {
                camp.passengers.push(req.user.firstname);
            } 
            if (req.body.activity) {
                camp.activities.push({
                    reqname: req.user.firstname,
                    activity: req.body.activity
                    });
            }
            if (req.body.newstuff) {
                camp.bringStuff.push({
                    reqname: req.user.firstname,
                    stuff:req.body.newstuff
                    
                });
            }
            
            camp.invited = remove_duplicates(camp.invited);
            camp.passengers = remove_duplicates(camp.passengers);
            camp.save();
            req.flash("success", "Successfully updated plan");
            res.redirect("/plan/"+ req.params.id);
        }
    })

});

// DESTROY ROUTE
app.delete("/plan/:id", isLoggedIn, function(req, res){
    Camp.findByIdAndRemove(req.params.id, function(err){
        if(err) {
            req.flash("error", err.message );
            res.redirect("/plan");
        } else {
            req.flash("sucess", "Successfully deleted plan" );
            res.redirect("/plan");
        }
    });
})
app.get("*", function(req, res){
    res.send("Something went wrong");
});

// middleware ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You have to be logged in to do that")
    res.redirect("/login");
}


function remove_duplicates(arr) {
    var seen = {};
    var ret = [];
    for (var i = 0; i < arr.length; i++) {
        if (!(arr[i] in seen)) {
            ret.push(arr[i]);
            seen[arr[i]] = true;
        }
    }
    return ret;
}

// Listening ....
app.listen(process.env.PORT, process.env.IP, function(){
    console.log("SERVER RUNNING");
});
