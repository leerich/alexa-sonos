/**
 * This Lambda is adapted from the simple skill sample using the Amazon Alexa Skills Kit.  It implements a simple
 * bridge between Alexa and the IFTTT "Maker" Channel (https://ifttt.com/channels/maker).  See the IFTTT site for more
 * details on how the Maker channel works.
 *
 * The linkage between the two is the Alexa "Intent name" and the Maker Channel "Event name"; the two of these must
 * match in order for the event to fire.  Along with this, any of the "slots" passed from Alexa (up to 3 - the number
 * supported by the Maker Channel) are passed through as "value1", "value2" and "value3" - the Maker Channel doesn't
 * support named parameters.
 */
var util = require('util');
var config = require('./config.js');
var http = require('http');
var options = {
  host: config.homehost,
  port: config.homeport
};
var myMakerKey = "XXXINSERT_YOUR_MAKER_KEY_HERE";
//
// TODO : Replace with your IFTTT Maker Key, available after you authorize the channel.  See https://ifttt.com/channels/maker
// for details.
//
//var myMakerKey = "INSERT_YOUR_MAKER_KEY_HERE";

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.[unique-value-here]") {
             context.fail("Invalid Application ID");
         }
        */

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                        context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        }  else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                     event.session,
                     function callback(sessionAttributes, speechletResponse) {
                         context.succeed(buildResponse(sessionAttributes, speechletResponse));
                     });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;
        console.log("intentRequest =");
        console.log(util.inspect(intent, false, null));

    // Whatever the Intent is, pass it straight through to
    // IFTTT
    //getAffirmative(callback);
    callIFTTT(intent, session, callback);
    //getAffirmative(callback);
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function callIFTTT(intent, session, callback)
 {
    var sessionAttributes = "{}";
    var cardTitle = intent.name;
    var shouldEndSession = true;

    var payload = "";
    var speechOutput = "";
    var repromptText = "Please pass parameters for the " + intent.name + " intent";
    var i = 0;
    var slots = intent.slots;
    var intentName = "";
    var zone = "";
    var path = "";

    //console.log("intentRequest =");
    //console.log(util.inspect(intent.slots.Zone, false, null));
    switch (intent.name) {
      case "StartMusic":
        intentName = "play";
        zone = intent.slots.Zone.value;
        if (zone === "sun room") {
          zone = zone.replace(/\s/g,"");
        }
        speechOutput = "Okay, playing music in the " + zone;
        //zone = zone.replace(/\s/g,"%20");
        zone = encodeURIComponent(zone);
        console.log("Zone = " + intent.slots.Zone.value);
        console.log("intent.name = " + intentName);
        path = "/" + zone + "/" + intentName;
        break;
      case "PauseAll":
        intentName = "pauseall";
        speechOutput = "Okay, Pausing all zones";
        path = "/" + intentName;
        console.log("speechOutput = " + speechOutput);
        console.log("intentName = " + intentName);
        break;
      case "Pause":
        intentName = "pause";
        zone = intent.slots.Zone.value;
        if (zone == "sun room") {
          zone = zone.replace(/\s/g,"");
          }
        speechOutput = "Okay, Pausing the " + zone;
        zone = encodeURIComponent(zone);
        //zone = zone.replace(/\s/g,"%20");
        path = "/" + zone + "/pause/";
        console.log("intentName = " + intentName);
        console.log("Zone = " + intent.slots.Zone.value);
        console.log("Encoded Zone = " + zone);
        break;
      case "VolumeUp":
        intentName = "volumeup";
        zone = intent.slots.Zone.value;
        if (zone == "sun room") {
          zone = zone.replace(/\s/g,"");
          }
        speechOutput = "Turning up the " + zone;
        zone = encodeURIComponent(zone);
        //zone = zone.replace(/\s/g,"%20");
        path = "/" + zone + "/volume/+10";
        break;
        case "VolumeDown":
          intentName = "volumedown";
          zone = intent.slots.Zone.value;
          if (zone == "sun room") {
            zone = zone.replace(/\s/g,"");
            }
          speechOutput = "Turning down the " + zone;
          //zone = zone.replace(/\s/g,"%20");
          zone = encodeURIComponent(zone);
          path = "/" + zone + "/volume/-10";
          break;
      case "PlayPreset":
        intentName = "preset";
        preset = encodeURIComponent(intent.slots.Preset.value);
        speechOutput = "Playing " + intent.slots.Preset.value + " preset";
        path = "/preset/" + preset;
        console.log("Preset = " + preset);
        break;
      case "PlayPlaylist":
        intentName = "playlist";
        zone = intent.slots.Zone.value;
        if (zone === "sun room") {
          zone = zone.replace(/\s/g,"");
          }
        var playlist = intent.slots.Playlist.value;
        speechOutput = "Playing the " + playlist + " playlist in the " + zone;
        //zone = zone.replace(/\s/g,"%20");
        zone = encodeURIComponent(zone);
        //playlist = playlist.replace(/\s/g,"%20");
        playlist = encodeURIComponent(playlist);
        console.log("Zone = " + intent.slots.Zone.value);
        console.log("Playlist = " + intent.slots.Playlist.value);
        console.log("Encoded Playlist = " + playlist);
        path = "/" + zone + "/favorite/" + playlist;
        break;
      case "AddZone":
        intentName = "join";
        oldzone = encodeURIComponent(intent.slots.OldZone.value);
        newzone = encodeURIComponent(intent.slots.NewZone.value);
        if (oldzone == "sun room") {
          oldzone = oldzone.replace(/\s/g,"");
          }
        if (newzone == "sun room") {
            newzone = newzone.replace(/\s/g,"");
            }
        speechOutput = "Adding " + intent.slots.NewZone.value + " to the " + intent.slots.OldZone.value;
        console.log ("OldZone = " + intent.slots.OldZone.value);
        console.log ("NewZone = " + intent.slots.NewZone.value);
        path = "/" + newzone +"/join/" + oldzone;
        break;
      case "RemoveZone":
          intentName = "remove";
          oldzone = encodeURIComponent(intent.slots.OldZone.value);
          newzone = encodeURIComponent(intent.slots.NewZone.value);
          if (oldzone == "sun room") {
            oldzone = oldzone.replace(/\s/g,"");
            }
          if (newzone == "sun room") {
              newzone = newzone.replace(/\s/g,"");
              }
          speechOutput = "Removing " + intent.slots.NewZone.value + " from the " + intent.slots.OldZone.value;
          console.log ("OldZone = " + intent.slots.OldZone.value);
          console.log ("NewZone = " + intent.slots.NewZone.value);
          path = "/" + oldzone +"/remove/" + newzone;
          break;
      case "VolumePercent":
          intentName = "volumepercent";
          zone = intent.slots.Zone.value;
          volpercent = intent.slots.VolPercent.value;
          if (zone == "sun room") {
            zone = zone.replace(/\s/g,"");
            }
          console.log("Zone = " + intent.slots.Zone.value);
          console.log("VolPercent = " + intent.slots.VolPercent.value);
          speechOutput = "Turning the volume to " + volpercent;
          //zone = zone.replace(/\s/g,"%20");
          zone = encodeURIComponent(zone);
          path = "/" + zone + "/volume/" + volpercent;
          console.log("Path = " + path);
          break;
    }



    // Form the request, using the Intent name as the Event for the channel
    //var path = "/Study/"+intentName;

    // If there are additional values in the slots, pass up to three as values in
    // the payload.  Note that will send as many as are passed - it's just that the Maker Channel will
    // only handle 3 at the moment.
    console.log("Path = " + path);
    //console.log("callIFTTT - Intent name = " + intentName);
/*
    if ((typeof(slots) != 'undefined' && slots !== null) && Object.keys(slots).length > 0)
    {
        var key;
        var value;
        i = 0;
        payload = "{";
        for (key in slots)
        {
            if (slots.hasOwnProperty(key))
            {
                if (i > 0) {
                    payload += ",";
                }
                payload += '"value'+(i+1)+'":"' + slots[key].value + '"';
                i++;
            }
        }
        payload += "}";
        console.log("callIFTTT - payload = " + payload);
    }
*/
    // Options indicating where we should send the request to.
    var post_options = {
        host: 'acton.cosmocomet.com',
        port: '5005',
        path: path,
        method: 'GET',
        agent: false,
        headers: {
          'Content-Type': 'application/json'
        }
    };

    console.log("Sending request to " + post_options.host + ":" + post_options.port + post_options.path);
    // Set up the request
    var post_req = http.request(post_options, function(res) {
    //console.log("SpeechOutput2 = " + speechOutput);
      if (speechOutput === "" || speechOutput === null) {
       speechOutput = "Okay, telling Sonos";
    }
      var stringResult = speechOutput;
      console.log("stringResult = " + stringResult);
		  console.log('callifttt - STATUS : ' + res.statusCode);
		  console.log('callifttt - HEADERS : ' + JSON.stringify(res.headers));
		  res.setEncoding('utf8');
        res.on('data', function (chunk) {
            stringResult += chunk;
        });
        //req.setTimeout(3000, function() {
        res.on('end', function () {
            console.log("result = "+stringResult);
        callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, stringResult, repromptText, shouldEndSession));
        });
      });
    post_req.on('error', function (e) {
    // General error, i.e.
    //  - ECONNRESET - server closed the socket unexpectedly
    //  - ECONNREFUSED - server did not listen
    //  - HPE_INVALID_VERSION
    //  - HPE_INVALID_STATUS
    //  - ... (other HPE_* codes) - server returned garbage
        console.log('Error Logged = ' + e);

        callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
  //});
    //post the data
    post_req.write(payload);
    post_req.end();
    //http.request(post_options, payload).end();
  //});
}

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput=null;
    var shouldEndSession = false;
    //
    // Make sure the key is initialized
    //
    if (myMakerKey == "INSERT_YOUR_MAKER_KEY_HERE") {
        speechOutput = "Please edit the Lambda to specify your secret Maker Key before making a request.";
        shouldEndSession = true;
    }
    else {
        speechOutput = "Please state your command.";
    }

    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please state one of the commands that the Intent Model is designed to process.  I'm sorry that I can't be more specific.";

    callback(sessionAttributes,
             buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// --------------- Helpers that build all of the responses -----------------------

function getAffirmative(callback) {
  var sessionAttributes = {};
  var cardTitle = "Welcome";
  var speechOutput= "Okay, telling Sonos";
  var shouldEndSession = true;
  var promptText = null;

  console.log("Getting Affirmative");

  callback(sessionAttributes,
           buildSpeechletResponse(cardTitle, speechOutput, promptText, shouldEndSession));
}

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "SessionSpeechlet - " + title,
            content: "SessionSpeechlet - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
