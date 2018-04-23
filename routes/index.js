const express = require('express');
const router = express.Router();
var airports = require('airport-codes');
const axios = require('axios');
// const url = 'https://developer.goibibo.com/api/search/?app_id=738f476c&app_key=f680503962623e838c52be41f0094b69&source='+source+'&destination='+destination+'&dateofdeparture=20180719&seatingclass=E&adults=1&children=0&infants=0&counter=100'

/* GET home page. */
router.get('/', (req, res) => {
  res.render('index', { title: 'Express' });
});



function getMinimumFlight(flights) {
  var minFlight = flights[0];
  var flight = 1;
  // while (flight <= 5) {
    for(flight in flights){
    var curMin = minFlight.fare.grossamount
    if (curMin > flights[flight].fare.grossamount) {
      minFlight = flights[flight]
    }
    flight += 1;
  }
  return minFlight
}

router.post('/dialog', (request, response) => {
  try {


    var intent = request.body.queryResult.intent.displayName
    if (intent === "option1-flightsearch - more - more") {
      // Variable Declaration
      var destination = request.body.queryResult.parameters.geodestination
      var source = request.body.queryResult.outputContexts[0].parameters.geosource
      var sourceIata = airports.findWhere({ city: source }).get('iata')
      var destinationIata = airports.findWhere({ city: destination }).get('iata')

      if (sourceIata == '' || destinationIata == '') {
        return response.json({
          "fulfillmentText": "Seems like some problem. Speak again."
        });
      }

      const url = 'https://developer.goibibo.com/api/search/?app_id=738f476c&app_key=f680503962623e838c52be41f0094b69&source=' + sourceIata + '&destination=' + destinationIata + '&dateofdeparture=20180719&seatingclass=E&adults=1&children=0&infants=0&counter=100'
      console.log(url)
      axios.get(url)
        .then(res => {

          // res.send(getMinimumFlight(res.data.data.onwardflights))

          var minFlight =getMinimumFlight(res.data.data.onwardflights)
          var minFlightCost = minFlight.fare.grossamount
          // minFlightCost = res.data.data.onwardflights[0].fare.grossamount
          return response.json({
            "fulfillmentText": destination + "        " + source + "     " + minFlightCost
          });
        })
        .catch(error => {
          console.log(error);
          return response.json({
            "fulfillmentText": "Seems like some problem. Speak again."
          });
        });
    }
    else if (intent === "Default Welcome Intent") {
      var speech =
        request.body.queryResult &&
          request.body.queryResult.parameters &&
          request.body.queryResult.parameters.echoText
          ? request.body.queryResult.parameters.echoText
          : "Seems like some problem. Speak again.";
      return response.json({
        "fulfillmentText": speech
      });
    }

  } catch (error) {
    console.log(request.body.queryResult)
    console.log(error)
    return response.json({
      "fulfillmentText": "Seems like some problem. Speak again."
    });




  }












});











router.get('/:source-:destination', (req, res) => {
  var source1 = req.params.source;

  var source = airports.findWhere({ city: source1 }).get('iata')


  var destination = airports.findWhere({ city: req.params.destination }).get('iata')
  if (source == '' || destination == '') {
    res.send("invalid input")
  }
  const url = 'https://developer.goibibo.com/api/search/?app_id=738f476c&app_key=f680503962623e838c52be41f0094b69&source=' + source + '&destination=' + destination + '&dateofdeparture=20180719&seatingclass=E&adults=1&children=0&infants=0&counter=100'


  axios.get(url)
    .then(response => {
      // res.send(JSON.stringify(response))
      // console.log(response.data.data);


      res.send(getMinimumFlight(response.data.data.onwardflights))
    })
    .catch(error => {
      console.log(error);
    });




});


module.exports = router;
