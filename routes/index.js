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
  console.log(flights.length)
  for (var flight in flights) {
    var curMin = minFlight.fare.grossamount
    if (curMin > flights[flight].fare.grossamount) {
      minFlight = flights[flight]
    }
  }
  return minFlight
}




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
