var mongoose = require("mongoose");

var campSchema = new mongoose.Schema({
    
    // Campground Name
    name: String,
    
    // Campground Creator
    creator: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        firstname: String,
        lastname: String,
        email: String
    },
    
    // Unique PIN for camp
    passwordKey: Number,
    
    // Number of people allowed to be invited
    numPpl: Number,
    //Address
    
    address: String,
    // Link
    linkToSite: String,
    
    // Beginning and End Date and Times
    beginDate: Date,
    endDate: Date,
    
    budget: Number,
    invited: [String],
    drivers: [{
        drivername: String,
        seats: Number
    }
        ],
    passengers: [String],
    activities: [{
        reqname: String,
        activity: String
    }
        ],
    bringStuff: [
        {
        reqname: String,
        stuff: String
        }
    ]
    
});

module.exports = mongoose.model("Camp", campSchema);