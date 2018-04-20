


var configData = {
    theaterSearchDist: 6, //2 miles search earea
    //    restaurantSearchDist: 2, //2 miles
    restaurantSearchDist: 2 * 1609.34,  //because google is in meters
    dispRichOutput: false,
    dispRichTestFalseGPS: false,   //punch in known values for GPS
    keyAPIgoogle: "AIzaSyAE03QBe5yDXRr1fzDvkWs9i_E_BIyCDhk",
    firebaseStorage: "/games/user",         //prior to tacking on user number
    firebaseMainGame: "/games",
    firebaseStatusFolder: "/status",
    firebaseRefreshBit: "/games/time",
    firebaseActive: true
};


var origPlayerPos = { //storage of data 
    play_1: {},
    play_2: {}
};


//communication data here  **** check if this is the correct keys ?
//new PONG information
var connConfig = {
    apiKey: "AIzaSyD4DrXTEogIw6pYpxE9aaLWOM1QHGWgo68",
    authDomain: "pong2108-200301.firebaseapp.com",
    databaseURL: "https://pong2108-200301.firebaseio.com",
    projectId: "pong2108-200301",
    storageBucket: "pong2108-200301.appspot.com",
    messagingSenderId: "846214007694"
};



var database;
var connectionsRef;
var connectedRef;
var dbUserGameStorageMain;
var dbUserStorageArea;
var dbUserStatusFolder;

var dbIncomingRec;
var db_firebase_rec_in;
var dbOppStorageArea;
var dbRefreshScreenBit;

var playMarker1;
var playMarker2;
var ballMarker;
var isMapOn = false;


//var for maps
//player 1 paddle icon
var player1icon;
var playMmarker1;
var playerMissedIcon;
var play1MissedMarker;
var play2MissedMarker;
var player2icon;
var playMarker2;
var missedBallIcon;
var missedBallMarker;
var isPlay1_miss_on = false;
var isPlay2_miss_on = false;
var isBall_miss_on = false;
var ball_miss_pos = {};



var theaterObj = {   //main object for the whole theater
    //variables are here
    searchLoc: {
        lat: 0.0,
        long: 0.0,
        dist: 0.0,
        addrSearchStr: "",
        addrOriginalStr: ""   //used when first call the routine
    },


    currTheater: {
        //theaterRec: theaterRecType,      //the current theater with movie
        theaterName: "",   //actual name of the theater
        address: {
            dispText: "",
            houseNum: "",
            street: "",
            city: "",
            state: "",
            zipCode: "",
            geoLocLat: 0,
            geoLocLong: 0,
        },
        distToCenter: 0,
        travelToTime: 0,
        travelFromTime: 0,
        url: "",
        telephone: "",
        movie: {
            title: "",
            rating: "",
            runtime: "",
            imdb_id: "", // in case want to search other web sites
            thumbImgUrl: "",    //thumbnail sized image files
            genres: []
        },
        EOR: ""    //place keeper, no comma needed
    }

};



Date.prototype.getUnixTime = function () { return this.getTime() / 1000 | 0 };
if (!Date.now) Date.now = function () { return new Date(); }
Date.time = function () { return Date.now().getUnixTime(); }




var ballPosObj = {
    coord_x: 0,
    coord_y: 0,
    coord_lat: 0,
    coord_lon: 0
};

var ballDistObj = {
    dist_players: 0.00,
    dist_ball_play_1: 0.00,
    dist_ball_play_2: 0.00
};


fbase_ballpos_inputObj = {  //variable written to in Firebase
    game_id: 1,
    ball_active: 0,         //ball is active if 1
    time_start_str: "",       //full string for calculating
    ball_physics: {
        curr_vel: 0.0,
        accel_val: 0.0,
        accel_time: 0.0,
        angle: 0.0
    },
    ball_curr_pos: {
        pos_X: 0.0,
        pos_Y: 0.0,
        pos_Z: 0.0,
        loc_GPS_lat: 0.0,
        loc_GPS_lon: 0.0
    },
    dist: {
        between: 0.0,   //in ft
        play_1: 0.0,    //in ft
        play_2: 0.0
    },
    time: {
        start_unix: 0,
        stop_unix: 0,
        elapsed_unix: 0,
        play_1: 0.0,        //in secs
        play_2: 0.0         //in secs
    },
    play_1: {
        id: 1,
        coord_X: 0.0,
        coord_Y: 0.0,
        locat_GPS_lat: 0.0,
        locat_GPS_lon: 0.0,
        locat_addr: "",
        hit_time_win: 0.0
    },
    play_2: {
        id: 1,
        coord_X: 0.0,
        coord_Y: 0.0,
        locat_GPS_lat: 0.0,
        locat_GPS_lon: 0.0,
        locat_addr: "",
        hit_time_win: 0.0
    },
    speed_up_fact: 0.0,
    hit_play_1: 0,
    hit_play_2: 0
};



var getLocation = function () {
    modalWaitLocation.style.display = "block";
    navigator.geolocation.getCurrentPosition(showPosition,
        function (error) {
            //there is a problem with getting the GPS data

            //alert("why cancel ?")
            geoPushDefault();
            modalWaitLocation.style.display = "none";
            //showPosition();
        });

    if (configData.dispRichOutput === true) {
    };
};



var showPosition = function (position) {
    if (configData.dispRichOutput === true) {
        theaterObj.searchLoc.lat = numeral(position.coords.latitude).format("0000.000000");
        theaterObj.searchLoc.long = numeral(position.coords.longitude).format("0000.000000");
        theaterObj.searchLoc.dist = configData.theaterSearchDist;
        theaterObj.addrSearchStr = "";
    } else {
        theaterObj.searchLoc.lat = numeral(position.coords.latitude).format("0000.000000");
        theaterObj.searchLoc.long = numeral(position.coords.longitude).format("0000.000000");
        theaterObj.searchLoc.dist = configData.theaterSearchDist;
        theaterObj.addrSearchStr = "";
    };
    //next step is to convert to a postal address
    convertGeoToAddr();
};


var convertGeoToAddr = function () {
    var userPositionToAddressURL = "https://maps.googleapis.com/maps/api/geocode/json?latlng=";
    userPositionToAddressURL += numeral(theaterObj.searchLoc.lat).format("+0000.000000");
    userPositionToAddressURL += "," + numeral(theaterObj.searchLoc.long).format("+0000.000000");
    userPositionToAddressURL += "&key=" + configData.keyAPIgoogle;

    $.ajax({
        url: userPositionToAddressURL,
        method: "GET"
    }).then(function (response) {
        theaterObj.searchLoc.addrSearchStr = response.results[0].formatted_address;
        //store the orignal string to see if need to re-compute geo location
        theaterObj.searchLoc.addrOriginalStr = theaterObj.searchLoc.addrSearchStr;
        if (configData.dispRichOutput != true) {
            $("#cityZipSearch").val(theaterObj.searchLoc.addrSearchStr);
        } else {
            //$("#GPScoord").text(numeral(theaterObj.searchLoc.lat).format("+0000.000000") + " , " + numeral(theaterObj.searchLoc.long).format("+0000.000000"));
            $("#input-addr").val(theaterObj.searchLoc.addrSearchStr);
        };
        //turn off wait location
        modalWaitLocation.style.display = "none";
    });
};


var checkAndConvertAddrToGeo = function () {
    // take address typed in an convert to Geo Location
    // RPB to implement
    //turn on wait location
    modalWaitLocation.style.display = "block";

    //read in the current inputted address and see if it changed
    var origAddrStr;
    if (theaterObj.searchLoc.addrOriginalStr == undefined || theaterObj.searchLoc.addrOriginalStr == null) {
        origAddrStr = "";
    } else {
        origAddrStr = theaterObj.searchLoc.addrOriginalStr.trim();
    };

    //need to check for blanks and null before accepting page's address
    var strIn;
    if (configData.dispRichOutput != true) {
        //full page
        strIn = $("#cityZipSearch").val();
    } else {
        //rich's test screen has different data
        var strIn = $("#input-addr").val();
    };
    if (strIn == null || strIn == undefined) {
        //handle a blank input
        strIn = "";
    };
    var pageAddrStr = strIn.trim();  //address inputted on page

    if (origAddrStr != pageAddrStr) {
        //need to do a new search to get new geo location
        //for testing false or bad location, just force in a known address
        if (configData.dispRichTestFalseGPS == true) {
            //for now, just blast in 467 W. second street address
            theaterObj.searchLoc.addrOriginalStr = "467 W. Second Street, Elmhurst IL 60126";
            theaterObj.searchLoc.addrSearchStr = "467 W. Second Street, Elmhurst IL 60126";
            theaterObj.searchLoc.lat = numeral(41.9057183).format("+0000.000000");
            theaterObj.searchLoc.long = numeral(-87.9747192).format("+0000.000000");
            if (configData.dispRichOutput != true) {
                $("#cityZipSearch").val(theaterObj.searchLoc.addrSearchStr);
            } else {
                //$("#GPScoord").text(numeral(theaterObj.searchLoc.lat).format("+0000.000000") + " , " + numeral(theaterObj.searchLoc.long).format("+0000.000000"));
                $("#input-addr").val(theaterObj.searchLoc.addrSearchStr);
            };
            doneConvertAddrToGeo();
        } else {
            //needs new geo location based on address and NOT in test mode
            var userAddrToGeoURL = "https://maps.googleapis.com/maps/api/geocode/json?address=" + pageAddrStr + "&key=AIzaSyAE03QBe5yDXRr1fzDvkWs9i_E_BIyCDhk";
            $.ajax({
                url: userAddrToGeoURL,
                method: "GET"
            }).then(function (response) {
                //got the geo location
                var locLatIn = response.results[0].geometry.location.lat;
                var locLongIn = response.results[0].geometry.location.lng;
                theaterObj.searchLoc.lat = numeral(locLatIn).format("+0000.000000");
                theaterObj.searchLoc.long = numeral(locLongIn).format("+0000.000000");
                theaterObj.searchLoc.addrSearchStr = response.results[0].formatted_address;

                if (configData.dispRichOutput != true) {
                    $("#cityZipSearch").val(theaterObj.searchLoc.addrSearchStr);
                } else {
                    //$("#GPScoord").text(numeral(theaterObj.searchLoc.lat).format("+0000.000000") + " , " + numeral(theaterObj.searchLoc.long).format("+0000.000000"));
                    $("#input-addr").val(theaterObj.searchLoc.addrSearchStr);
                };
                doneConvertAddrToGeo();
            });
        }
    } else {
        //old addr matches, so can continue
        doneConvertAddrToGeo();
    };
};


var doneConvertAddrToGeo = function () {
    //geo conversion is done, continue on
    //turn off wait location
    modalWaitLocation.style.display = "none";
};




var startConnection = function () {
    console.log("connecting");
    firebase.initializeApp(connConfig);
    console.log("entered the routine");
    // Create a variable to reference the database.
    database = firebase.database();

    // connectionsRef references a specific location in our database.
    // All of our connections will be stored in this directory.
    connectionsRef = database.ref("/connections");
    dbUserGameStorageMain = database.ref(configData.firebaseMainGame);
    dbUserStatusFolder = database.ref(configData.firebaseStatusFolder);
    dbRefreshScreenBit = database.ref(configData.firebaseRefreshBit);

    // '.info/connected' is a special location provided by Firebase that is updated every time
    // the client's connection state changes.
    // '.info/connected' is a boolean value, true if the client is connected and false if they are not.
    connectedRef = database.ref(".info/connected");


    //add in for refresh bit
    dbRefreshScreenBit.on("value", function (snap) {
        //refresh bit has been triggered
        db_ReadBallRec();
    });
};



var db_ReadBallRec = function () {
    //read the entire ball rec
    if (configData.firebaseActive == true) {
        //read the data
        dbIncomingRec = database.ref(configData.firebaseMainGame);
        //dbIncomingRec.on("value", function (snap) {
        dbIncomingRec.once("value", function (snap) {
            //a valud read was done
            db_firebase_rec_in = jQuery.extend(true, {}, snap.val());
            origPlayerPos.Play_1 = db_firebase_rec_in.play_1;
            origPlayerPos.Play_2 = db_firebase_rec_in.play_2;

            var dbfi = db_firebase_rec_in; //short cut notations

            $('#ball-pos-x').text(numeral(dbfi.ball_curr_pos.pos_X).format('0,0.00'));
            $('#ball-pos-y').text(dbfi.ball_curr_pos.pos_Y);
            $('#ball-pos-lat').text(dbfi.ball_curr_pos.loc_GPS_lat);
            $('#ball-pos-lon').text(dbfi.ball_curr_pos.loc_GPS_lon);
            $('#ball-vel-in').text(numeral(dbfi.ball_physics.curr_vel).format('0,0.00') + " in/sec");
            $('#ball-vel-mph').text(numeral(dbfi.ball_physics.curr_vel / 12.0 / 5280.0 * 3600.00).format('0,0.00') + " mph");

            $('#ball-dist-play1').text(numeral(dbfi.dist.play_1).format('0,0.00') + ' ft');
            $('#ball-miles-play1').text(numeral(dbfi.dist.play_1 / 5280.0).format('0,0.00') + ' miles');
            $('#loc-play1').text(dbfi.play_1.locat_addr);
            $('#ball-time-play1').text(numeral(dbfi.time.play_1).format('0,0.00') + ' sec');
            $('#ball-min-play1').text(numeral(dbfi.time.play_1 / 60.0).format('0,0.00') + ' min');

            $('#ball-dist-play2').text(numeral(dbfi.dist.play_2).format('0,0.00') + ' ft');
            $('#ball-miles-play2').text(numeral(dbfi.dist.play_2 / 5280.0).format('0,0.00') + ' miles');
            $('#loc-play2').text(dbfi.play_2.locat_addr);
            $('#ball-time-play2').text(numeral(dbfi.time.play_2).format('0,0.00') + ' sec');
            $('#ball-min-play2').text(numeral(dbfi.time.play_2 / 60.0).format('0,0.00') + ' min');

            $('#ball-dist-total').text(numeral(dbfi.dist.between).format('0,0.00') + ' ft');
            $('#ball-miles-total').text(numeral(dbfi.dist.between / 5280.0).format('0,0.00') + ' miles');

            if (isMapOn == true) {
                updateBallIcon();
            } else {
                initMap();
            };

            if (dbfi.ball_active == 1 && isBall_miss_on == true) {
                //the ball is moving, so should wipe out the missed ball
                dispMissedBall(false);
            };

            if (dbfi.dirFrom === 1) {
                //direction is from player #1 to player #2
                if (dbfi.miss_play_2 === 1) {
                    //missed the ball coming from player #1
                    displMissedPlayer(2, true);
                } else if (dbfi.hit_play_2 === 1) {
                    //player #2 has swung the paddle
                    displMissedPlayer(2, true);
                } else {
                    displMissedPlayer(2, false);
                };
                if (dbfi.hit_play_1 === 1 && dbfi.time.play_1 <= 5.00) {
                    displMissedPlayer(1, true);
                } else {
                    displMissedPlayer(1, false);
                };
                if (dbfi.hit_play_2 === 1) {
                    displMissedPlayer(2, true);
                    console.log("play 2 hit");
                };
            };

            if (dbfi.dirFrom === 2) {
                //direction is from player #2 to player #1
                if (dbfi.miss_play_1 === 1) {
                    //missed the ball coming from player #1
                    displMissedPlayer(1, true);
                } else if (dbfi.hit_play_1 === 1) {
                    //player #2 has swung the paddle
                    displMissedPlayer(1, true);
                } else {
                    displMissedPlayer(1, false);
                };
                if (dbfi.hit_play_2 === 1 && dbfi.time.play_2 <= 5.00) {
                    displMissedPlayer(2, true);
                } else {
                    displMissedPlayer(2, false);
                };
                if (dbfi.hit_play_1 === 1) {
                    displMissedPlayer(1, true);
                    console.log("play 1 hit");
                };
            };

            if (dbfi.dirFrom === 0) {
                //play was stopped because of a swing and a miss
                if (dbfi.miss_play_1 === 1) {
                    displMissedPlayer(1, true);
                    dispMissedBall(true);
                };
                if (dbfi.miss_play_2 === 1) {
                    displMissedPlayer(2, true);
                    dispMissedBall(true);
                };
                if (dbfi.hit_play_1 === 0 && dbfi.hit_play_2 === 0) {
                    //serving the ball
                    displMissedPlayer(1, false);
                    displMissedPlayer(2, false);
                    dispMissedBall(false);
                };
            };

            //ball_calcs(snap, false);

        });
    }
};



var stopConnection = function () {

};



// maps stuff

var map;
var infowindow;
var testTheater = { lat: 41.9499, lng: -87.6638 };
var player_1_icon_loc;
var player_2_icon_loc;
var ball_icon_loc;
var mapCenter;
var mapBounds;

var testHome;


var initMap = function () {
    //Using Coordinates for Music Box Theater. 
    //This would be coordinates of theater pulled in from user selection
    //testTheater = { lat: 41.9499, lng: -87.6638 };
    console.log("init the map");
    mapCenter = { lat: parseFloat(db_firebase_rec_in.field.center_locat_GPS_lat), lng: parseFloat(db_firebase_rec_in.field.center_locat_GPS_lon) };

    //testHome = {lat: parseFloat(theaterObj.searchLoc.lat), lng: parseFloat(theaterObj.searchLoc.long)};
    player_1_icon_loc = { lat: parseFloat(db_firebase_rec_in.play_1.locat_GPS_lat), lng: parseFloat(db_firebase_rec_in.play_1.locat_GPS_lon) };
    player_2_icon_loc = { lat: parseFloat(db_firebase_rec_in.play_2.locat_GPS_lat), lng: parseFloat(db_firebase_rec_in.play_2.locat_GPS_lon) };
    ball_icon_loc = { lat: parseFloat(db_firebase_rec_in.ball_curr_pos.loc_GPS_lat), lng: parseFloat(db_firebase_rec_in.ball_curr_pos.loc_GPS_lon) };
    //Map Options
    map = new google.maps.Map(document.getElementById('map'), {

        center: mapCenter,
        zoom: 15,
        //Custom Styles for Map Background
        styles: [
            {
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#556b2f"
                    }
                ]
            },
            {
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#8ec3b9"
                    }
                ]
            },
            {
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#1a3646"
                    }
                ]
            },
            {
                "featureType": "administrative.country",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#556b2f#6477"
                    }
                ]
            },
            {
                "featureType": "administrative.land_parcel",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#64779e"
                    }
                ]
            },
            {
                "featureType": "administrative.province",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#4b6878"
                    }
                ]
            },
            {
                "featureType": "landscape.man_made",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#556b2f"
                    }
                ]
            },
            {
                "featureType": "landscape.natural",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#556b2f"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "00b300"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#6f9ba5"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#1d2c4d"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#556b2f"
                    }
                ]
            },
            {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#3C7680"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#304a7d"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#98a5be"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#1d2c4d"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#2c6675"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [
                    {
                        "color": "#255763"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#b0d5ce"
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#023e58"
                    }
                ]
            },
            {
                "featureType": "transit",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#98a5be"
                    }
                ]
            },
            {
                "featureType": "transit",
                "elementType": "labels.text.stroke",
                "stylers": [
                    {
                        "color": "#1d2c4d"
                    }
                ]
            },
            {
                "featureType": "transit.line",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "color": "#283d6a"
                    }
                ]
            },
            {
                "featureType": "transit.station",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#3a4762"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                    {
                        "color": "#778899"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#778899"
                    }
                ]
            }
        ]
    });

    //player 1 paddle icon
    player1icon = {
        //Variable to add in Custom Image of Movie theater
        url: "assets/images/pingpongpaddle.png", // url
        scaledSize: new google.maps.Size(50, 50), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(27, 17) // anchor
    };

    dispPlayer(1);  //disp player #1
    // playMmarker1 = new google.maps.Marker({
    //     position: player_1_icon_loc,
    //     map: map,
    //     icon: player1icon,
    //     zIndex: 0
    // });

    //player 1 missed
    playerMissedIcon = {
        //Variable to add in Custom Image of Movie theater
        url: "assets/images/missedBallPaddle1.gif", // url
        scaledSize: new google.maps.Size(50, 50), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(27, 17) // anchor
    };

    // play2MissedMarker = new google.maps.Marker({
    //     position: player_2_icon_loc,
    //     map: map,
    //     draggable: false,
    //     optimized: false,
    //     animation: google.maps.Animation.DROP,
    //     icon: player1missedIcon
    // });

    //player 2 paddle icon
    player2icon = {
        //Variable to add in Custom Image of Movie theater
        url: "assets/images/pingpongpaddle.png", // url
        scaledSize: new google.maps.Size(50, 50), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(27, 17) // anchor
    };

    dispPlayer(2);  //display player #2
    // playMarker2 = new google.maps.Marker({
    //     position: player_2_icon_loc,
    //     map: map,
    //     icon: player2icon,
    //     zIndex: 0
    // });

    //missed ball
    missedBallIcon = {
        //Variable to add in Custom Image of Movie theater
        url: "assets/images/youmissed.png", // url
        scaledSize: new google.maps.Size(50, 50), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(25, 25) // anchor
    };

    // playMarker2 = new google.maps.Marker({
    //     //position: ball_icon_loc,
    //     position: player_2_icon_loc,
    //     map: map,
    //     icon: missedBallIcon
    // });


    //ball icon
    ballIcon = {
        //Variable to add in Custom Image of Movie theater
        url: "assets/images/surprisedemoji.png", // url
        scaledSize: new google.maps.Size(50, 50), // scaled size
        origin: new google.maps.Point(0, 0), // origin
        anchor: new google.maps.Point(25, 25) // anchor
    };

    ballMarker = new google.maps.Marker({
        position: ball_icon_loc,
        map: map,
        icon: ballIcon,
        zIndex: 3
    });


    mapBounds = new google.maps.LatLngBounds();
    mapBounds.extend(player_1_icon_loc);
    mapBounds.extend(player_2_icon_loc);
    mapBounds.extend(ball_icon_loc);
    map.fitBounds(mapBounds);
    isMapOn = true;
};


var displMissedPlayer = function (playNum, dispOn) {
    if (playNum == 1) {
        //player #1
        if (dispOn == true) {
            if (isPlay1_miss_on == false) {
                play1MissedMarker = new google.maps.Marker({
                    position: player_1_icon_loc,
                    map: map,
                    draggable: false,
                    optimized: false,
                    animation: google.maps.Animation.DROP,
                    icon: playerMissedIcon,
                    zIndex: 2
                });
            };
            isPlay1_miss_on = true;
        } else {
            //player #1 
            if (play1MissedMarker != undefined) {
                play1MissedMarker.setMap(null);
            };
            isPlay1_miss_on = false;
        };
    } else {
        //must be player #2
        if (dispOn == true) {
            if (isPlay2_miss_on == false) {
                play2MissedMarker = new google.maps.Marker({
                    position: player_2_icon_loc,
                    map: map,
                    draggable: false,
                    optimized: false,
                    animation: google.maps.Animation.DROP,
                    icon: playerMissedIcon,
                    zIndex: 2
                });
            };
            isPlay2_miss_on = true;
        } else {
            //player #2
            if (play2MissedMarker != undefined) {
                play2MissedMarker.setMap(null);
            };
            isPlay2_miss_on = false;
        };
    };
};



var dispPlayer = function (playNum) {
    if (playNum == 1) {
        playMarker1 = new google.maps.Marker({
            position: player_1_icon_loc,
            map: map,
            draggable: false,
            optimized: false,
            icon: player1icon,
            zIndex: 0
        });
    } else {
        //must be player #2
        playMarker2 = new google.maps.Marker({
            position: player_2_icon_loc,
            map: map,
            draggable: false,
            optimized: false,
            icon: player2icon,
            zIndex: 0
        });

    };
};



var dispMissedBall = function (dispOn) {
    if (dispOn == true) {
        if (isBall_miss_on == false) {
            //only turn on if it has not been turned on before
            //store the ball_miss_pos in a global variable but don't think it is needed because when clearing it, it sets it to null
            ball_miss_pos = { lat: parseFloat(db_firebase_rec_in.ball_curr_pos.loc_GPS_lat), lng: parseFloat(db_firebase_rec_in.ball_curr_pos.loc_GPS_lon) };
            missedBallMarker = new google.maps.Marker({
                //position: ball_icon_loc,
                position: ball_miss_pos,
                map: map,
                icon: missedBallIcon,
                zIndex: 4
            });
            isBall_miss_on = true;
        };
    } else {
        if (missedBallMarker != undefined) {
            missedBallMarker.setMap(null);
        };
        isBall_miss_on = false;
    };
};


var updateBallIcon = function () {
    ballMarker.setPosition(new google.maps.LatLng(parseFloat(db_firebase_rec_in.ball_curr_pos.loc_GPS_lat), parseFloat(db_firebase_rec_in.ball_curr_pos.loc_GPS_lon)));
};



var checkPlayPos = function (playNum) {
    if (playNum === 1) {
        if ((parseFloat(origPlayerPos.play_1.locat_GPS_lat) === parseFloat(fbase_ballpos_inputObj.play_1.locat_GPS_lat)) ||
            (parseFloat(origPlayerPos.play_1.locat_GPS_lon) === parseFloat(fbase_ballpos_inputObj.play_1.locat_GPS_lon))) {
            //player #1 has changed 
            return (true)
        } else {
            return (false);
        };
    } else if (playNum === 2) {
        if ((parseFloat(origPlayerPos.play_2.locat_GPS_lat) === parseFloat(fbase_ballpos_inputObj.play_2.locat_GPS_lat)) ||
            (parseFloat(origPlayerPos.play_2.locat_GPS_lon) === parseFloat(fbase_ballpos_inputObj.play_2.locat_GPS_lon))) {
            //player #1 has changed 
            return (true)
        } else {
            return (false);
        };
    };
};



var dispMovedPlayer = function (playNum) {
    //a player has moved

};