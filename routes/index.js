const express = require("express");
const router = express.Router();
var airports = require("airport-codes");
const axios = require("axios");
var admin = require("firebase-admin");
const functions = require("firebase-functions");
admin.initializeApp(functions.config().firebase);
var db = admin.firestore();
// const url = 'https://developer.goibibo.com/api/search/?app_id=738f476c&app_key=f680503962623e838c52be41f0094b69&source='+source+'&destination='+destination+'&dateofdeparture=20180719&seatingclass=E&adults=1&children=0&infants=0&counter=100'

/* GET home page. */

function getUser() {
  const userData = {
    id: "user123",
    firstName: "Jane",
    lastName: "Middleton"
  };
  return db
    .collection("alerts")
    .doc("user123")
    .set(userData)
    .then(() => {
      "new user data added to db";
    });
}
router.get("/", (req, res) => {
  res.render("index", { title: "Express" });
});
router.get("/insert", (req, res) => {
  res.send(getUser());
});

function getMinimumFlight(flights) {
  var minFlight = flights[0];
  var flight = 1;
  // while (flight <= 5) {
  for (flight in flights) {
    var curMin = minFlight.fare.grossamount;
    if (curMin > flights[flight].fare.grossamount) {
      minFlight = flights[flight];
    }
    // flight += 1;
  }
  return minFlight;
}

router.post("/dialog", (request, response) => {
  try {
    var intent = request.body.queryResult.intent.displayName;
    if (intent === "option1-flightsearch - more - more") {
      // Variable Declaration
      var destination = request.body.queryResult.parameters.geodestination;
      var source =
        request.body.queryResult.outputContexts[0].parameters.geosource;
      var sourceIata = airports.findWhere({ city: source }).get("iata");
      var destinationIata = airports
        .findWhere({ city: destination })
        .get("iata");

      if (sourceIata == "" || destinationIata == "") {
        return response.json({
          fulfillmentText: "Seems like some problem. Speak again."
        });
      }

      const url =
        "https://developer.goibibo.com/api/search/?app_id=738f476c&app_key=f680503962623e838c52be41f0094b69&source=" +
        sourceIata +
        "&destination=" +
        destinationIata +
        "&dateofdeparture=20180719&seatingclass=E&adults=1&children=0&infants=0&counter=100";
      // console.log(url)
      axios
        .get(url)
        .then(res => {
          // res.send(getMinimumAFlight(res.data.data.onwardflights))

          var minFlight = getMinimumFlight(res.data.data.onwardflights);
          var minFlightCost = minFlight.fare.grossamount;
          // minFlightCost = res.data.data.onwardflights[0].fare.grossamount
          return response.json({
            // "fulfillmentText": "We found the below flight for you",
            fulfillmentMessages: [
              {
                card: {
                  // "text":destination + "        " + source + "     " + minFlightCost,
                  title: destination + " to " + source,
                  subtitle: "Price: " + minFlightCost,
                  imageUri:
                    "https://images.trvl-media.com/media/content/expus/graphics/launch/home/tvly/150324_flights-hero-image_1330x742.jpg"
                }
              }
            ],
            payload: {
              google: {
                expectUserResponse: true,
                richResponse: {
                  items: [
                    {
                      simpleResponse: {
                        textToSpeech: "We found the cheapest flight for you"
                      }
                    },
                    {
                      basicCard: {
                        // "buttons":[
                        //     {
                        //         "title":"Button Title",
                        //         "openUrlAction":{
                        //             "url":"https://images.trvl-media.com/media/content/expus/graphics/launch/home/tvly/150324_flights-hero-image_1330x742.jpg"
                        //         }
                        //     }
                        // ],
                        formattedText: "Price: " + minFlightCost,
                        image: {
                          url:
                            "https://images.trvl-media.com/media/content/expus/graphics/launch/home/tvly/150324_flights-hero-image_1330x742.jpg",
                          accessibilityText:
                            "Accessibility text describing the image"
                        },
                        title: destination + " to " + source
                      }
                    },
                    {
                      simpleResponse: {
                        textToSpeech: "Do You Want to Create a new alert"
                      }
                    }
                  ]
                }
              }
            }
          });
        })
        .catch(error => {
          console.log(error);
          return response.json({
            fulfillmentText: "Seems like some problem. Speak again."
          });
        });
    } else if (intent == "setup_push") {
      return response.json(
        {
          speech: "PLACEHOLDER_FOR_PERMISSION",
          "data": {
          "google": {
          "expect_user_response": true,
          "is_ssml": false,
          "no_input_prompts": [],
          "system_intent": {
          "intent": "assistant.intent.action.PERMISSION",
          "spec": {
          "permission_value_spec": {
          "opt_context": "To test",
          "permissions": ["NAME", "DEVICE_PRECISE_LOCATION"]
          }
          }
          }
          }
          },
          "contextOut": [
          {
          "name": "actions_on_google",
          "lifespan": 100,
          "parameters": {}
          }
          ]
          }
      );
    } else if (intent === "create-alert - custom") {
      var destination = request.body.queryResult.parameters.geodest;
      var source = request.body.queryResult.parameters.geosource;
      var date = request.body.queryResult.parameters.date;
      return response.json({
        fulfillmentText: destination + "lololol " + source + "lololol " + date
      });
    } else if (intent === "Default Welcome Intent") {
      var speech =
        request.body.queryResult &&
        request.body.queryResult.parameters &&
        request.body.queryResult.parameters.echoText
          ? request.body.queryResult.parameters.echoText
          : "Seems like some problem. Speak again.";
      return response.json({
        fulfillmentText: speech
      });
    }
  } catch (error) {
    console.log(request.body.queryResult);
    console.log(error);
    return response.json({
      fulfillmentText: "Seems like some problem. Speak again."
    });
  }
});

router.get("/minflight", (req, res) => {
  // var source1 = ;
  console.log(req.query);
  // var source = airports.findWhere({ city: req.query.source }).get('iata')
  // var destination = airports.findWhere({ city: req.query.destination }).get('iata')
  var source = req.query.source;
  var destination = req.query.destination;
  var date = req.query.date;
  if (source == "" || destination == "") {
    res.send("invalid input");
  }
  const url =
    "https://developer.goibibo.com/api/search/?app_id=738f476c&app_key=f680503962623e838c52be41f0094b69&source=" +
    source +
    "&destination=" +
    destination +
    "&dateofdeparture=" +
    date +
    "&seatingclass=E&adults=1&children=0&infants=0&counter=100";

  axios
    .get(url)
    .then(response => {
      var minFlight = getMinimumFlight(response.data.data.onwardflights);
      res.json({
        price: minFlight.fare.grossamount
      });
    })
    .catch(error => {
      console.log(error);
      res.send("Error");
    });
});

module.exports = router;
