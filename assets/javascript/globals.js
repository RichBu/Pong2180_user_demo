
//  GLOBALS.js file for EquipDemo


/*
var configData = {
    imgDir: "assets/images/",
    idBttnLink: "#btnLink",
    idBttnUserInput: "#bttnUserInput",
    idBttnTest: "#btnTest",                //just for test options
    inputUserName: "#input-userName",
    divCurrUsers: "#currUsers"
};
*/

//make global variables for now, so can easily debug at anytime without
//having to set breakpoints

var connConfig;
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

var modalInput = document.getElementById('modLogin'); //login
var modalNewOppReq = document.getElementById('modNewOppReq'); //new opponent request
var modalInviteWaitAck = document.getElementById('modWaitInviteAck'); //new opponent wait for ACK



Date.prototype.getUnixTime = function () { return this.getTime() / 1000 | 0 };
if (!Date.now) Date.now = function () { return new Date(); }
Date.time = function () { return Date.now().getUnixTime(); }

var gameObj = {
    //everything for playing the game
    currStatus: {
        //object for current status
        stateLevel: 0,  //state of the game play
        retStatus: function () {
            //returns status of current game
            statusMessage = [
                'startup waiting for user login',   //0
                'waiting to read number of users',  //1
                'waiting to pick opponent',         //2
                '',                                 //3
                '',                                 //4
                'waiting for ACK to start a game',          //5  A=accept  X=deny
                'waiting for both answers to come in ',     //10
                'processing the game '                      //15
            ];
        },
        dispUsersStatus: true
    },


    promptWantNewGame: function () {
        modalNewOppReq.style.display = "block";
        $("#oppNameReq").text(connectionObj.currUserRec.inRec.name);

        //now, a modal is up and when a user clicks accept or decline
        //then two other functions are called
    },


    promptWantNewGame_accept: function () {
        //user accepted the invitation
        //the user picked yes
        //set the "A" bit, and write the record
        connectionObj.currUserRec.outRec.choice = "A";
        //set up the storage pointer
        connectionObj.currUserRec.isPlaying = true;
        dbOppStorageArea = database.ref(connectionObj.currUserRec.inRec.ID + "/inRec");
        //write the entire record including the outRec
        //this is because want to set "IsPlaying"
        connectionObj.writeCurrUserRec();
        connectionObj.writeToOppRec();
        //display the opponent on the page
        $( "#oppName" ).text(  connectionObj.currUserRec.inRec.name);
        modalNewOppReq.style.display = "none";
    },


    promptWantNewGame_decline: function () {
        //user declined / rejected the invitation
        //set the "X" bit for disconnect, and write the record
        //RPB send disconnect
        connectionObj.sendDisconnect();
        modalNewOppReq.style.display = "none";
    },

    closeAllModals: function () {
        modalInput.style.display = "none";
        modalNewOppReq.style.display = "none";
        modalInviteWaitAck.style.display = "none";
    }
};


var dispUserSect = function (cmdIn) {
    //if cmdIn:  -1=toggle  0=off  1=on  2=refresh
    var dispUsersOn = function () {
        $("#userDiv").css("display", "block");
    };

    var dispUsersOff = function () {
        $("#userDiv").css("display", "none");
    };

    switch (parseInt(cmdIn)) {
        case -1:    //toggle
            if (gameObj.currStatus.dispUsersStatus === true) {
                gameObj.currStatus.dispUsersStatus = false;
                dispUsersOff();
            } else {
                //display was off, turn on and store
                gameObj.currStatus.dispUsersStatus = true;
                dispUsersOn();
            };
            break;
        case 0:     //force off
            gameObj.currStatus.dispUsersStatus = false;
            dispUsersOff();
            break;
        case 1:     //force on
            gameObj.currStatus.dispUsersStatus = true;
            dispUsersOn();
            break;
        case 2:     //refresh only
            break;
    }
};


var dispAllUsersOnPage_start = function (shouldRefresh) {
    //start the async transer, if needed
    console.log("entered display");
    if (connectionObj.linkActive) {
        //only continue if the link is active
        if (shouldRefresh) {
            connectionObj.clearLocalStack();
            connectionObj.getAllUsersOnLine();
        };
    };
};


var dispAllUsersOnPage_contin = function () {
    //display all of the users currently on-line
    //if want to pull all the data in, then set refresh to true
    //this function assumes that all the data is already in the array if not
    //first make sure that it is on-line
    console.log("another user");
    if (connectionObj.linkActive) {
        //only if link is active
        //watch out for infinite loop
        var divCurrUsers = configData.divCurrUsers;
        $(divCurrUsers).html("");  //wipe out the section
        //add break between active and non-active players
        //layout will have to be 
        //
        //<table class="table table-hover">
        //<thead><tr>   <th> # </th>  </tr> 
        //<tbody> <tr> <th scope="row">1</th>
        //  <td></td>  <td>/td>
        //  </tbody>
        //</table>
        var tableTag = $("<table>");
        $(tableTag).addClass("table");
        $(tableTag).addClass("table-hover");

        var tableHeadTag = $("<thead>");
        var trTag = $("<tr>");
        var thTag = $("<th>");
        thTag.text("#");
        $(thTag).appendTo(trTag);
        thTag = $("<th>");
        $(thTag).text("User");
        $(thTag).appendTo(trTag);
        thTag = $("<th>");
        $(thTag).text("Status");
        $(thTag).appendTo(trTag);
        $(trTag).appendTo(tableHeadTag);
        $(tableHeadTag).appendTo(tableTag);

        //so the top of the table is finished, now add in the body
        var tableBodyTag = $("<tbody>");  //append every <tr> to here

        //now loop thru all the names and put on-line
        //it was connectionObj.usersOnLine.length;  but got duplicates, so whichever is smaller
        var endVal = connectionObj.currNumberOfConn;
        if (connectionObj.usersOnLine.length < endVal) { endVal = connectionObj.usersOnLine.length; }
        for (var i = 0; i < endVal; i++) {  //each new button is on a new row
            trTag = $("<tr>");
            thTag = $("<th scope='row'>");  //put in user number
            thTag.text(i + 1);  //row / user number
            thTag.appendTo(trTag);

            tdTag = $("<td>");
            $(tdTag).text(connectionObj.retUserOnLineName(i));  //user name
            $(tdTag).appendTo(trTag);
            //is or is not playing
            tdTag = $("<td>");

            var lineText = ""
            if (connectionObj.retUserOnLineRec(i).isPlaying) {
                lineText = " playing against " + connectionObj.retUserOnLineRec(i).inRec.name;
            } else {
                lineText = " free to play";
            };

            $(tdTag).text(lineText);
            $(tdTag).appendTo(trTag);

            $(trTag).attr("data-user-select", i);
            $(trTag).addClass("user_select");

            if (connectionObj.retUserOnLineRec(i).isPlaying) {
                $(trTag).appendTo(tableBodyTag);
            } else {
                //if it is an active user that can play then
                //put at the top of the screen and wrap with a button
                $(trTag).prependTo(tableBodyTag);
            };
        };

        $(tableBodyTag).appendTo(tableTag);
        $(tableTag).appendTo(divCurrUsers);

        if (endVal < connectionObj.currNumberOfConn) {
            //do not have all the user's names, so loop back around
            //watch out, maybe infinite loop
            setTimeout(dispAllUsersOnPage_start(true), 1000);
        };
    };
}; // disp Users On Page



var dispAllUsersOnPage_contin_oldVersion = function () {
    //display all of the users currently on-line
    //if want to pull all the data in, then set refresh to true
    //this function assumes that all the data is already in the array if not
    //first make sure that it is on-line
    console.log("another user");
    if (connectionObj.linkActive) {
        //only if link is active
        //watch out for infinite loop
        var divCurrUsers = configData.divCurrUsers;
        $(divCurrUsers).html("");  //wipe out the section
        //add break between active and non-active players
        var rowStatusHeader = $("<div>").addClass("row");
        var statusHeader = $("<p>");
        var statusHeaderText = $("<span>");
        $(statusHeaderText).text("Playing:");
        $(statusHeaderText).appendTo(statusHeader);
        $(statusHeader).appendTo(rowStatusHeader);
        $(rowStatusHeader).appendTo(divCurrUsers);

        //now loop thru all the names and put on-line
        var endVal = connectionObj.usersOnLine.length;
        for (var i = 0; i < endVal; i++) {  //each new button is on a new row
            var newRow = $("<div>");
            $(newRow).addClass("row");
            var newLine = $("<p>");
            var lineText = connectionObj.retUserOnLineName(i);
            if (connectionObj.retUserOnLineRec(i).isPlaying) {
                lineText += " playing against " + connectionObj.retUserOnLineRec(i).inRec.name;
            } else {
                lineText += " free to play";
            };

            if (connectionObj.retUserOnLineRec(i).isPlaying) {
                $(newLine).text(lineText);
                $(newLine).appendTo(newRow);
                $(newRow).appendTo(divCurrUsers);
            } else {
                //if it is an active user that can play then
                //put at the top of the screen and wrap with a button
                var buttonTag = $("<button>");
                buttonTag.attr("data-user-select", i);
                buttonTag.addClass("user_select");
                $(buttonTag).text(lineText);
                $(buttonTag).appendTo(newRow);
                $(newRow).prependTo(divCurrUsers);
            };
        };
        var rowStatusFooter = $("<div>").addClass("row");
        var statusFooter = $("<p>");
        var statusFooterText = $("<p>");
        $(statusFooterText).text("Available:");
        $(statusFooterText).appendTo(statusFooter);
        $(statusFooter).appendTo(rowStatusFooter);
        $(rowStatusFooter).prependTo(divCurrUsers);
        if (endVal < connectionObj.currNumberOfConn) {
            //do not have all the user's names, so loop back around
            //watch out, maybe infinite loop
            setTimeout(dispAllUsersOnPage_start(true), 1000);
        };
    };
}; // disp Users On Page


var evalUserSelect = function () {
    //clicked on a user
    var userClick = $(this).attr("data-user-select");
    //this will now correspond to the usersOnLine[] array
    //so store the users info into the currUserRec
    //make some short handed annotation for usage
    var cuStack = connectionObj.usersOnLine;  //use as input
    var oppRec = cuStack[userClick].outRec; //the actual record of the opponent
    var currRec = connectionObj.currUserRec;  //use as output
    if (oppRec.ID === currRec.outRec.ID) {
        //user picked himself
        alert("you picked yourself");
    } else {
        //out record goes to the in record of the opponent
        dbOppStorageArea = database.ref(oppRec.ID + "/inRec");

        currRec.inRec.ID = oppRec.ID;
        currRec.inRec.name = oppRec.name;
        currRec.inRec.msg = oppRec.msg;
        currRec.inRec.choice = oppRec.choice;
        currRec.inRec.score = oppRec.score;
        currRec.inRec.ACK = oppRec.ACK;

        currRec.outRec.choice = "?";
        currRec.outRec.ACK = "ACK";
        currRec.outRec.score = 0;
        //currRec.inRec.ACK = "RST";    
        connectionObj.writeCurrUserRec();
        connectionObj.writeToOppRec();

        var oppNameDiv = $("#oppNameAck")
        $(oppNameDiv).html("");
        var hTag = $("<h3>")
        $(hTag).text(oppRec.name)
        $(hTag).appendTo( oppNameDiv );
        //var hTag = $("<h3>");
        //hTag.text(oppRec.name);
        //hTag.appendTo( oppNameDiv );
        modalInviteWaitAck.style.display = "block";
    };
};



