var express = require("express");
var router = express.Router();
var Camp = require("../models/camp");

// Index Route -- displaying all plans
router.get("/", function(req, res){
    Camp.find({}, function(err, allplans){
        if (err) {
            console.log(err);
        } else {
            res.render("index", {allplans: allplans});
        }
    });
});

// New Route -- show form to create new plan
router.get("/new", isLoggedIn,function(req, res){
    res.render("new");
});

// Create Route -- add new plan to server DB
router.post("/", isLoggedIn, function(req, res){
    
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

router.get("/:id", isLoggedIn, function(req, res) {
    Camp.findById(req.params.id, function(err, camp){
        if (err) {
            req.flash("error", err.message);
        } else {
            res.render("show", {camp : camp});
        }
    });
});


// Edit Route (for people: different to either)
router.get("/:id/edit", isLoggedIn, function(req, res){
    Camp.findById(req.params.id, function(err, camp){
        if (err) {
            req.flash("error", err.message);
        } else {
            res.render("edit", {camp: camp});
        }
    });
});

// Update Route (for people and creator: different to either)
router.put("/:id", isLoggedIn, function(req, res){
    Camp.findById(req.params.id, function(err, camp){
        if (err) {
            req.flash("error", err.message);
        } else {
            
            // Must provide PIN to submit changes
            if (!camp.creator.id.equals(req.user._id) && req.body.pin != camp.passwordKey) {
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

// Destroy Route
router.delete("/:id", isLoggedIn, function(req, res){
    Camp.findByIdAndRemove(req.params.id, function(err){
        if(err) {
            req.flash("error", err.message );
            res.redirect("/plan");
        } else {
            req.flash("sucess", "Successfully deleted plan" );
            res.redirect("/plan");
        }
    });
});

// Middleware used
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

module.exports = router;