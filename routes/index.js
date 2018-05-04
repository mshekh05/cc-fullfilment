const express = require("express");
const router = express.Router();
var airports = require("airport-codes");
const axios = require("axios");
var admin = require("firebase-admin");
const functions = require("firebase-functions");
var usd = 66.62;
// admin.initializeApp(functions.config().firebase);
// var db = admin.firestore();
// const url = 'https://developer.goibibo.com/api/search/?app_id=738f476c&app_key=f680503962623e838c52be41f0094b69&source='+source+'&destination='+destination+'&dateofdeparture=20180719&seatingclass=E&adults=1&children=0&infants=0&counter=100'

/* GET home page. */

// function getUser() {
//   const userData = {
//     id: "user123",
//     firstName: "Jane",
//     lastName: "Middleton"
//   };
//   return db
//     .collection("alerts")
//     .doc("user123")
//     .set(userData)
//     .then(() => {
//       "new user data added to db";
//     });
// }
router.get("/", (req, res) => {
  res.render("index", { title: "Express" });
});

// router.get("/:destination", (req, res) => {
//   var destination = req.params.destination
//   destination.replace("%20"," ")
//   console.log(destination)
//   console.log(airports
//   .findWhere({ city: destination })
//   .get("iata"))
//   console.log(airports
//     .findWhere({ city: destination })
//     .get("iata"))
// });

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
    console.log(request.body.queryResult.parameters);

    if (intent === "option1-flightsearch -final") {
      // Variable Declaration
      // console.log(request.body.queryResult);
      var destination = request.body.queryResult.parameters.geodestination;
      var source = request.body.queryResult.parameters.geosource;
      var date = request.body.queryResult.parameters.date;
      date = date
        .substring(0, 10)
        .replace("-", "")
        .replace("-", "");
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
        "&dateofdeparture=" +
        date +
        "&seatingclass=E&adults=1&children=0&infants=0&counter=100";
      // var accessToken = request.body.originalDetectIntentRequest.payload.user.accessToken
      // var userID = request.body.originalDetectIntentRequest.payload.user.userId
      console.log(url);
      axios
        .get(url)
        .then(res => {
          // res.send(getMinimumAFlight(res.data.data.onwardflights))

          var minFlight = getMinimumFlight(res.data.data.onwardflights);
          var minFlightCost = minFlight.fare.grossamount / usd;
          minFlightCost = minFlightCost.toFixed(2);
          // minFlightCost = res.data.data.onwardflights[0].fare.grossamount
          return response.json({
            // "fulfillmentText": "We found the below flight for you",
            fulfillmentMessages: [
              {
                card: {
                  // "text":destination + "        " + source + "     " + minFlightCost,
                  title:
                    source +
                    " to " +
                    destination +
                    " on " +
                    date.substring(4, 6) +
                    "-" +
                    date.substring(6, 8) +
                    "-" +
                    date.substring(0, 4),
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
                        formattedText: "Price: " + minFlightCost,
                        image: {
                          url:
                            "https://images.trvl-media.com/media/content/expus/graphics/launch/home/tvly/150324_flights-hero-image_1330x742.jpg",
                          accessibilityText:
                            "Accessibility text describing the image"
                        },
                        title:
                          source +
                          " to " +
                          destination +
                          " on " +
                          date.substring(4, 6) +
                          "-" +
                          date.substring(6, 8) +
                          "-" +
                          date.substring(0, 4)
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
            },
            outputContexts: [
              {
                name:
                  request.body.session +
                  "/contexts/option1-flightsearch-final-yes",
                lifespanCount: 5,
                parameters: {
                  source: sourceIata,
                  destination: destinationIata,
                  date: date,
                  price: minFlightCost
                  // "userid":userID,
                  // "accesstoken":useremail
                }
              }
            ]
          });
        })
        .catch(error => {
          console.log(error);
          return response.json({
            fulfillmentText: "Seems like some problem. Speak again."
          });
        });
    } else if (intent === "option1-flightsearch -final - yes") {
      console.log(request.body.queryResult.parameters);
      var destination = request.body.queryResult.parameters.destination;
      var source = request.body.queryResult.parameters.source;
      var date = request.body.queryResult.parameters.date;
      var price = request.body.queryResult.parameters.price;
      var accessToken =
        request.body.originalDetectIntentRequest.payload.user.accessToken;
      var userID = request.body.originalDetectIntentRequest.payload.user.userId;

      axios
        .get(
          "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" +
            accessToken
        )
        .then(res => {
          // console.log()
          axios
            .post(
              "https://us-central1-cc-proj-1.cloudfunctions.net/createAlert",
              {
                userid: userID,
                useremail: res.data.email,
                source: source,
                destination: destination,
                date: date,
                price: price
              }
            )
            .then(res2 => {
              return response.json({
                fulfillmentText:
                  "You start receiving email on " + res.data.email,
                payload: {
                  google: {
                    expectUserResponse: true,
                    richResponse: {
                      items: [
                        {
                          simpleResponse: {
                            textToSpeech:
                              "You will start receiving email on " +
                              res.data.email +
                              "! Good Bye !"
                          }
                        }
                      ]
                    }
                  }
                }
              });
            });
        })
        .catch(error => {
          console.log(error);
          res.send("Error");
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
    } else if (intent === "get_alerts") {
      var userID = request.body.originalDetectIntentRequest.payload.user.userId;
      var url = "https://us-central1-cc-proj-1.cloudfunctions.net/get_all_alerts?userid="+userID
      axios
    .get(url)
    .then(res => {
      console.log(res.data) 
      var data = res.data
      console.log(data.length())


      return response.json({
        fulfillmentText: "We found the below flight for you",

        payload: {
          google: {
            expectUserResponse: true,
            richResponse: {
              items: [
                {
                  simpleResponse: {
                    textToSpeech:
                      "Below are all the alert. Please Tap for deletion. "
                  }
                }
              ]
            },
            systemIntent: {
              intent: "actions.intent.OPTION",
              data: {
                "@type":
                  "type.googleapis.com/google.actions.v2.OptionValueSpec",
                  listSelect: data
              }
            }
          }
        }
      });
    })
    .catch(error => {
      console.log(error);
      res.send("Error");
    });
  
    
    } else if (intent === "actions.intent.OPTION") {
      console.log(request.body);

      console.log(request.body.queryResult.parameters.alert_id);
      return response.json({
        fulfillmentText: "we received something",
        payload: {
          google: {
            expectUserResponse: true,
            richResponse: {
              items: [
                {
                  simpleResponse: {
                    textToSpeech:
                      "You will stop receiving email for alertID" +
                      request.body.queryResult.parameters.alert_id
                  }
                }
              ]
            }
          }
        }
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
  // console.log(req.query);
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
      var price = minFlight.fare.grossamount / usd;

      res.json({
        price: price.toFixed(2)
      });
    })
    .catch(error => {
      console.log(error);
      res.send("Error");
    });
});

module.exports = router;
