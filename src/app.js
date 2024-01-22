const bodyParser = require('body-parser');
const express = require('express'); 
const https = require('https'); 
const axios = require('axios');

const app = express(); 
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(bodyParser.json());

app.post('/', (req, res) => { 
    const apiKey = '97cb5a844d474b2648168275ebd35d28';
    let url;

    if (req.body.cityName) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${req.body.cityName}&appid=${apiKey}&units=metric`;
    } else if (req.body.lat && req.body.lon) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${req.body.lat}&lon=${req.body.lon}&appid=${apiKey}&units=metric`;
    } else {
        return res.status(400).json({ error: "Invalid request parameters." });
    }
    
    https.get(url, (apiRes) => {
        let dataChunks = [];
        apiRes.on("data", (chunk) => {
            dataChunks.push(chunk);
        }).on('end', () => {
            const weatherData = JSON.parse(Buffer.concat(dataChunks));
            getAQIData(weatherData.name, (aqiError, aqiData) => {
                getAstroData(weatherData.name, (astroError, astroData) => {
                    if (aqiError || astroError) {
                        console.error(aqiError || astroError);
                        return res.json({ weatherData, aqiError: 'Error fetching AQI data.', astroError: 'Error fetching Astro data.' });
                    }
                    res.json({ weatherData, aqiData, astroData });
                });
            });
        });
    }).on('error', (e) => {
        console.error(e);
        res.status(500).json({ error: "Error fetching weather data." });
    });
});

app.listen(port, () => { 
    console.log(`Server is listening on port ${port}`); 
});

function getAQIData(cityName, callback) {
    const aqiApiKey = 'fdae7294c6d86ad41979c9d22726e343ce0033da';
    console.log(cityName);
    const aqiUrl = `https://api.waqi.info/feed/${cityName}/?token=${aqiApiKey}`;

    axios.get(aqiUrl)
        .then(response => callback(null, response.data))
        .catch(error => callback(error));
}

function getAstroData(cityName, callback){
    const astroApiKey = "ee3d07496ca145f6817b9bd734621a81";
    const astroUrl = `https://api.ipgeolocation.io/astronomy?apiKey=${astroApiKey}&location=${cityName}`

    axios.get(astroUrl)
        .then(response => callback(null, response.data))
        .catch(error => callback(error));
}