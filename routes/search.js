var express = require('express');
const Zomato = require('zomato.js');
const z = new Zomato('781c8e8273f0ea5ede2f786b4b2ec411');
var weather = require('openweather-apis');
var router = express.Router();

//configure weather settings
weather.setAPPID('fc2af0e6fff021425cc35914d3f06001');
weather.setUnits('metric');

router.post('/', (req, res) => {

    //variables to store returned api data
    const name = [];
    const restaurantLat = []
    const restaurantLong = [];
    const address = [];
    const opHours = [];
    const avgCost = [];
    const rating = [];
    const phone = [];
    let city;
    let forecast;
    let temp;
    let humidity;
    let wind;
    let lat;
    let long;

    //get location information from zomato based on city input
    z.locations({
    query: req.body.inputLocation
    })
    .then((locationsData) => {
            
            //store in variables
            city = locationsData[0].city_name;
            lat = locationsData[0].latitude;
            long = locationsData[0].longitude;
            
            //get weather conditions based on coordinates
            weather.setCoordinate(locationsData[0].latitude, locationsData[0].longitude);
            weather.getAllWeather((err, weatherData) => {

                //store in variables
                forecast = weatherData.weather[0].main;
                temp = weatherData.main.temp;
                humidity = weatherData.main.humidity;
                wind = weatherData.wind.speed;
            });

            //get cuisines available in the city
            z.cuisines({
                city_id: locationsData[0].city_id
            })
            .then((cuisinesData) => {
                const restaurantCount = 10;

                //search if input cuisine is in the returned city cuisines from zomato
                for (let i = 0; i < cuisinesData.length; i++) {
                    if (cuisinesData[i].cuisine_name === capitaliseInputCuisine(req.body.inputCuisine)){
                        
                        //search for restaurants if there is a match
                        z.search({
                            entity_id: locationsData[0].city_id,
                            entity_type: "city",
                            cuisines: cuisinesData[i].cuisine_id,
                            count: restaurantCount,
                            sort: "rating",
                            order: "desc"
                        })
                        .then((searchData) => {
                            
                            //add data to the respective arrays
                            for(let i = 0; i < searchData.results_shown; i++){
                                name.push(searchData.restaurants[i].name);
                                restaurantLat.push(searchData.restaurants[i].location.latitude);
                                restaurantLong.push(searchData.restaurants[i].location.longitude);
                                address.push(searchData.restaurants[i].location.address);
                                opHours.push(searchData.restaurants[i].timings);
                                avgCost.push(searchData.restaurants[i].average_cost_for_two);
                                rating.push(searchData.restaurants[i].user_rating.aggregate_rating);
                                phone.push(searchData.restaurants[i].phone_numbers);
                            }
                            
                            //combine all data arrays
                            const combinedData = [name,
                                restaurantLat,
                                restaurantLong,
                                address,
                                opHours,
                                avgCost,
                                rating,
                                phone,
                                lat,
                                long,
                                restaurantCount
                            ];

                            //reformat into JSON
                            let tempJSON = combinedData.map(function (value, key) {
                                return {
                                    "name": name,
                                    "restaurantLat": restaurantLat,
                                    "restaurantLong": restaurantLong,
                                    "address": address,
                                    "opHours": opHours,
                                    "avgCost": avgCost,
                                    "rating": rating,
                                    "phone": phone,
                                    "lat": lat,
                                    "long": long,
                                    "restaurantCount": restaurantCount
                                }
                            });
                            
                            //filter redundant data
                            const combinedDataJSON = tempJSON[0];

                            //render page
                            setTimeout(() => { res.render('search', {
                                combinedDataJSON: combinedDataJSON,
                                city: city, forecast: forecast,
                                temp: temp, humidity: humidity,
                                wind: wind
                            }); }, 1000);
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                    } 
                } 
            })
            .catch((err) => {
                console.error(err);
            });
        })
    .catch((err) => {
        console.error(err);
    });
});

//function that reformats input cuisine to fit zomato's format
function capitaliseInputCuisine(inputCuisineStr) {

    let splitInputCuisineStr = inputCuisineStr.toLowerCase().split(' ');

    for (let i = 0; i < splitInputCuisineStr.length; i++) {
        // Assign it back to the array
        splitInputCuisineStr[i] = splitInputCuisineStr[i].charAt(0).toUpperCase() + splitInputCuisineStr[i].substring(1);   
    }
    return splitInputCuisineStr.join(' '); 
}

module.exports = router;