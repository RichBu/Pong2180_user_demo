

//  connComm  communications and connections objects

//by Rich Budek 02/14/2018


//connConfig is set to global in the globals.js


//communication data here  **** check if this is the correct keys ?
//new PONG information
connConfig = {
    apiKey: "AIzaSyD4DrXTEogIw6pYpxE9aaLWOM1QHGWgo68",
    authDomain: "pong2108-200301.firebaseapp.com",
    databaseURL: "https://pong2108-200301.firebaseio.com",
    projectId: "pong2108-200301",
    storageBucket: "pong2108-200301.appspot.com",
    messagingSenderId: "846214007694"
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


var userType = {        //stored in database
    isPlaying: false,   //does he have a partner
    status: "",        //waiting for response, ack choice 
    //?=want to play  -=new trial  X=denied request to play A=accept
    inRec: {  //incomingg Record from opppnent
        ID: "",         //opp ID
        name: "",       //opp name
        msg: "",        //opp mag
        choice: "",    //opp choice
        score: 0,      //opp score
        ACK: ""        //opp outgoing ACK
    },
    outRec: {  //outgoing Record to opppnent's in rec
        ID: "",      //this user's ID
        name: "",    //this is username          
        msg: "",     //outgoing message to opponent
        choice: "", //users choice
        score: 0,   //users score
        ACK: ""
    },
    EOR: ""                    //place keeper
};


var connectionObj = {
    currUserRec: userType,
    linkActive: false,  //link is false until turned on
    currNumberOfConn: 0,   //number of connections brought out from event listener
    refreshScreenBit: true,

    userRecStore: {   //record stored to database

    },

    usersOnLine: [],       //array of user type


    initCurrUserRec: function () {
        //this.currUserRec.userID = "";             //user ID, usually just sequence number
        this.currUserRec.isPlaying = false; //is user currently playing a game ?
        this.currUserRec.status = "";       //status of user

        //incoming record is opponents stats
        this.currUserRec.inRec.ID = "";
        this.currUserRec.inRec.name = "";    //who playing with by name            
        this.currUserRec.inRec.msg = "";     //outgoing message to opponent
        this.currUserRec.inRec.choice = "";
        this.currUserRec.inRec.score = 0;
        this.currUserRec.inRec.score = "";

        //outgoing record is user data
        this.currUserRec.outRec.ID = "";
        this.currUserRec.outRec.name = "";    //who playing with by name            
        this.currUserRec.outRec.msg = "";     //outgoing message to opponent
        this.currUserRec.outRec.choice = "";
        this.currUserRec.outRec.score = 0;
        this.currUserRec.outRec.ACK = "";
    },


    setUserReadyToPlay: function () {
        this.currUserRec.isPlaying = false;  //not currently playing

        this.currUserRec.outRec.choice = "";    //R,  P,  S
        this.currUserRec.inRec.ID = "";
        this.currUserRec.inRec.name = "";    //who playing with by name            
        this.currUserRec.inRec.msg = "";     //outgoing message to opponent
        this.currUserRec.inRec.choice = "";
        this.currUserRec.inRec.score = 0;
        this.currUserRec.inRec.ACK = "";
    },


    pushToLocalStack: function (recObjIn) {
        //adds to local stack from userType varb
        var newUser = jQuery.extend(true, {}, recObjIn);
        this.usersOnLine.push(newUser);
    },


    pushToLocalStack_w_Clear: function () {
        //push current userType to stack & then clear userType
        this.pushToLocalStack();
        this.init();
    },


    clearLocalStack: function () {
        //go thru the entire stack and pop off
        var endVal = this.usersOnLine.length;
        for (var i = 0; i < endVal; i++) {
            this.usersOnLine.pop();
        };
    },


    getAllUsersOnLine: function () {
        //will loop thru and get all the users on-line
        var query = firebase.database().ref(configData.firebaseMainGame).orderByKey();
        query.once("value")
            .then(function (snapshot) {
                snapshot.forEach(function (childSnapshot) {
                    // key will be "ada" the first time and "alan" the second time
                    var key = childSnapshot.key;
                    // childData will be the actual contents of the child
                    var childData = childSnapshot.val();
                    var newRecObj = jQuery.extend(true, {}, childData);
                    connectionObj.pushToLocalStack(newRecObj);
                });
                dispAllUsersOnPage_contin();
            });
    },


    writeCurrUserRec: function () {
        dbUserStorageArea.set(connectionObj.currUserRec);
        //do I want to refresh every time I write the curr User Rec ???
        connectionObj.triggerRefreshScreen();
    },


    writeToOppRec: function () {
        //write to opponents record
        //write:  1. ID to oppID   2. name to OppName  3. choice to oppChoice
        dbOppStorageArea.set(connectionObj.currUserRec.outRec);

    },


    triggerRefreshScreen: function () {
        connectionObj.refreshScreenBit = !connectionObj.refreshScreenBit;
        if (connectionObj.refreshScreenBit) {
            dbRefreshScreenBit.set(true);
        } else {
            dbRefreshScreenBit.set(false);
        };
    },


    sendDisconnect: function () {
        connectionObj.currUserRec.outRec.choice = "X";
        //set up the storage pointer
        connectionObj.currUserRec.isPlaying = false;
        dbOppStorageArea = database.ref(connectionObj.currUserRec.inRec.ID + "/inRec");
        //write the entire record including the outRec
        //this is because want to set "IsPlaying"
        connectionObj.writeCurrUserRec();
        connectionObj.writeToOppRec();
        modalInviteWaitAck.style.display = "none";
        modalNewOppReq.style.display = "none";
    },


    writeDBtoInRec: function (dataInRec) {
        //copies incoming record to memory slot
        this.currUserRec.inRec = jQuery.extend(true, {}, dataInRec.val());
    },


    retUserOnLineName: function (userNum) {
        //returns the users name from the array
        var outVal = "";
        outVal = connectionObj.usersOnLine[userNum].outRec.name;
        return outVal;
    },


    retUserOnLineRec: function (userNum) {
        //not sure this is an editable object
        //but returns the entire object
        var outVal = connectionObj.usersOnLine[userNum];
        return outVal;
    },

    EOR: ""    //place keeper
};




var startConnection = function () {
    console.log("connecting");
    firebase.initializeApp(connConfig);
    console.log("entered the routine");
    // Create a variable to reference the database.
    database = firebase.database();

    // -------------------------------------------------------------- (CRITICAL - BLOCK) --------------------------- //
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

    /*    
        // When the client's connection state changes...
        connectedRef.on("value", function (snap) {
            console.log(snap);
            // If they are connected..
            if (snap.val()) {   //executes with the value is finally set to true
    
                // Add user to the connections list.
                var con = connectionsRef.push(true);
    
                // Remove user from the connection list when they disconnect.
                con.onDisconnect().remove();
            }
        });
    */

    /*   add in for refresh bit
        dbRefreshScreenBit.on("value", function (snap) {
            //refresh bit has been triggers
            console.log(snap);
            // If they are connected..
            if (snap.val()) {   //executes with the value is finally set to true
                connectionObj.refreshScreenBit = true;
            } else {
                connectionObj.refreshScreenBit = false;
            };
            //refresh the user list
            //make sure that it doesn't pop the window open
            dispAllUsersOnPage_start(true);
        });
    
        // When first loaded or when the connections list changes...
        connectionsRef.on("value", function (snap) {
            // Display the viewer count in the html.
            // The number of online users is the number of children in the connections list.
            connectionObj.currNumberOfConn = snap.numChildren();
            $("#numUsers").text(connectionObj.currNumberOfConn + " active connections");
            //only change the user name if the linkActice switches
            if (connectionObj.linkActive === false) {
                connectionObj.linkActive = true;  //link is active
                connectionObj.currUserRec.outRec.ID = configData.firebaseStorage + moment().valueOf();
                dbUserStorageArea = database.ref(connectionObj.currUserRec.outRec.ID);
                dbUserStorageArea.onDisconnect().remove();
                console.log("started the connection");
                connectionObj.writeCurrUserRec();
                //            dispAllUsersOnPage_start(true);   //refresh entire area
                showLinkButtonStatus();
    
                //now get the incoming record's location and set a listener on it
                dbIncomingRec = database.ref(connectionObj.currUserRec.outRec.ID + "/inRec");
                dbIncomingRec.on("value", function (snap) {
                    //a new incoming record
                    //store the record to memory
                    connectionObj.writeDBtoInRec(snap);
                    evalIncomingRec();
                });
            };
            console.log("new connection detected");
            //setTimeout(dispAllUsersOnPage_start(true), 5000);
        });
        */
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
            var dbfi = db_firebase_rec_in; //short cut notations

            $('#ball-pos-x').text( numeral(dbfi.ball_curr_pos.pos_X).format('0,0.00'));
            $('#ball-pos-y').text(dbfi.ball_curr_pos.pos_Y);
            $('#ball-pos-lat').text(dbfi.ball_curr_pos.loc_GPS_lat);
            $('#ball-pos-lon').text(dbfi.ball_curr_pos.loc_GPS_lon);
            $('#ball-vel-in').text(numeral(dbfi.ball_physics.curr_vel).format('0,0.00') + " in/sec");
            $('#ball-vel-mph').text(numeral(dbfi.ball_physics.curr_vel /12.0 / 5280.0 * 3600.00 ).format('0,0.00') + " mph");

            $('#ball-dist-play1').text( numeral(dbfi.dist.play_1).format('0,0.00') + ' ft');
            $('#ball-miles-play1').text( numeral(dbfi.dist.play_1 / 5280.0 ).format('0,0.00') + ' miles');
            $('#loc-play1').text( dbfi.play_1.locat_addr );
            $('#ball-time-play1').text( numeral(dbfi.time.play_1).format('0,0.00') + ' sec');
            $('#ball-min-play1').text( numeral(dbfi.time.play_1 / 60.0 ).format('0,0.00') + ' min');
            
            $('#ball-dist-play2').text( numeral(dbfi.dist.play_2).format('0,0.00') + ' ft');
            $('#ball-miles-play2').text( numeral(dbfi.dist.play_2 / 5280.0 ).format('0,0.00') + ' miles');
            $('#loc-play2').text( dbfi.play_2.locat_addr );
            $('#ball-time-play2').text( numeral(dbfi.time.play_2).format('0,0.00') + ' sec');
            $('#ball-min-play2').text( numeral(dbfi.time.play_2 / 60.0 ).format('0,0.00') + ' min');

            $('#ball-dist-total').text( numeral(dbfi.dist.between).format('0,0.00') + ' ft' );
            $('#ball-miles-total').text( numeral(dbfi.dist.between / 5280.0 ).format('0,0.00') + ' miles' );

            //ball_calcs(snap, false);
        });
    }
};


var evalIncomingRec = function () {
    console.log("incoming record from: " + connectionObj.currUserRec.inRec.name);
    switch (connectionObj.currUserRec.inRec.choice) {
        case "A":  //accepted invite for game
            connectionObj.currUserRec.isPlaying = true;
            connectionObj.currUserRec.outRec.choice = "-";
            connectionObj.writeCurrUserRec();
            $("#oppName").text(connectionObj.currUserRec.inRec.name);
            modalInviteWaitAck.style.display = "none";
            dispUserSect(0);
            break;
        case "-":   //ready for game to begin
            //should only trigger once, so reset output bit also
            connectionObj.currUserRec.outRec.choice = "-";
            connectionObj.writeCurrUserRec();
            break;
        case "?":   //wants to play a game
            gameObj.promptWantNewGame();
            break;
        case "X":   //refused game or disconnect
            //should really trigger a game over
            //close all modals first
            connectionObj.sendDisconnect();
            //connectionObj.currUserRec.outRec.choice = "X";
            //connectionObj.currUserRec.isPlaying = false;
            //connectionObj.writeCurrUserRec();
            //connectionObj.writeToOppRec();    
            modalNewOppReq.style.display = "none";
            modalInviteWaitAck.style.display = "none";
            break;
        case "R":   //picked rock
            break;
        case "P":   //picked paper
            break;
        case "S":   //picked scissors
            break;
    };
};


var stopConnection = function () {

};


var showLinkButtonStatus = function () {
    //display the proper link button status
    if (connectionObj.linkActive === false) {
        $(configData.idBttnLink).text("TURN LINK ON");
        $(configData.idBttnLink).css("background-color", "red");
    } else {
        $(configData.idBttnLink).text("TURN LINK OFF");
        $(configData.idBttnLink).css("background-color", "green");
    };
};
