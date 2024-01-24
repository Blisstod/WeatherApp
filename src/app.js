const bodyParser = require('body-parser');
const express = require('express'); 
const https = require('https'); 
const axios = require('axios');
const compression = require('compression');

const app = express(); 
const port = 3000;

app.use(compression());
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
            Promise.all([
                getAQIData(weatherData.name).catch(error => ({ error })),
                getAstroData(weatherData.name).catch(error => ({ error }))
            ]).then(([aqiData, astroData]) => {
                res.json({ weatherData, aqiData: aqiData.error ? 'Error fetching AQI data.' : aqiData, astroData: astroData.error ? 'Error fetching Astro data.' : astroData });
            }).catch(error => {
                console.error(error);
                res.status(500).json({ error: "Error in processing external API requests." });
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

function getAQIData(cityName) {
    const aqiApiKey = 'fdae7294c6d86ad41979c9d22726e343ce0033da';
    const aqiUrl = `https://api.waqi.info/feed/${cityName}/?token=${aqiApiKey}`;

    return axios.get(aqiUrl)
        .then(response => response.data)
        .catch(error => Promise.reject(error));
}

function getAstroData(cityName){
    const astroApiKey = "ee3d07496ca145f6817b9bd734621a81";
    const astroUrl = `https://api.ipgeolocation.io/astronomy?apiKey=${astroApiKey}&location=${cityName}`;

    return axios.get(astroUrl)
        .then(response => response.data)
        .catch(error => Promise.reject(error));
}