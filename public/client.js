let map;
document.addEventListener('DOMContentLoaded', function() {
    getLocation();

    const form = document.querySelector('form');
    form.addEventListener('submit', function(event) {
        event.preventDefault(); 
        const cityName = document.getElementById('cityName').value;
        getWeatherandShowMap({ cityName: cityName });
    });
});

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => getWeatherandShowMap({ lat: position.coords.latitude, lon: position.coords.longitude }),
            showError
        );
    } else {
        document.getElementById('weatherResult').innerHTML = "Geolocation is not supported by this browser.";
    }
}   

function updateWeatherAndMap(data) {
    document.getElementById('weatherResult').innerHTML = formatWeatherData(data.weatherData);
    if (data.aqiData) {
        document.getElementById('weatherResult').innerHTML += formatAQIData(data.aqiData);
    }
    if (data.astroData) {
        document.getElementById('weatherResult').innerHTML += formatAstroData(data.astroData);
    }
    showMap(data.weatherData.coord.lat, data.weatherData.coord.lon);
}


function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById('weatherResult').innerHTML = "User denied the request for Geolocation."
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById('weatherResult').innerHTML = "Location information is unavailable."
            break;
        case error.TIMEOUT:
            document.getElementById('weatherResult').innerHTML = "The request to get user location timed out."
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById('weatherResult').innerHTML = "An unknown error occurred."
            break;
    }
}

function getWeatherandShowMap(params) {
    let url = '/';
    let fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    };

    if ('cityName' in params) {
        fetchOptions.body = JSON.stringify({ cityName: params.cityName });
    } else {
        fetchOptions.body = JSON.stringify({ lat: params.lat, lon: params.lon });
    }

    fetch(url, fetchOptions)
        .then(response => response.json())
        .then(data => {
            if (!data || !data.weatherData || !data.weatherData.coord) {
                throw new Error("Invalid or incomplete data received from the server");
            }
            updateWeatherAndMap(data);
        })
        .catch(error => {
            console.error(error);
            document.getElementById('weatherResult').innerHTML = error.message;
        });
}

function formatWeatherData(weatherData) {
    if (!weatherData || !weatherData.main || !weatherData.weather) {
        return '<p>Weather data is not available</p>';
    }

    const { main, weather, wind, sys, coord, rain } = weatherData;
    const temp = main.temp;
    const feelsLike = main.feels_like;
    const description = weather[0].description;
    const icon = weather[0].icon;
    const humidity = main.humidity;
    const pressure = main.pressure;
    const windSpeed = wind.speed;
    const countryCode = sys.country;
    const coordinates = coord;
    const rainVolume = rain ? rain['3h'] : 'No rain';

    const imageURL = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    return `
        <h1>${weatherData.name} Weather</h1>
        <h2>Temperature: ${temp}°C</h2>
        <p>Feels Like: ${feelsLike}°C</p>
        <p>Description: ${description}</p>
        <img src="${imageURL}" alt="weather icon"><br>
        <p>Humidity: ${humidity}%</p>
        <p>Pressure: ${pressure} hPa</p>
        <p>Wind Speed: ${windSpeed} m/s</p>
        <p>Country: ${countryCode}</p>
        <p>Coordinates: Latitude ${coordinates.lat}, Longitude ${coordinates.lon}</p>
        <p>Rain (last 3 hours): ${rainVolume} mm</p>
    `;
}

function formatAstroData(astroData) {
    if (!astroData || !astroData.sunrise || !astroData.sunset || !astroData.moonrise || !astroData.moonset || !astroData.day_length) {
        return '<p>Astronomical data is not available</p>';
    }

    return `
        <h2>Astronomical Data</h2>
        <p>Sunrise: ${astroData.sunrise}</p>
        <p>Sunset: ${astroData.sunset}</p>
        <p>Moonrise: ${astroData.moonrise}</p>
        <p>Moonset: ${astroData.moonset}</p>
        <p>Day Length: ${astroData.day_length}</p>
    `;
}

function formatAQIData(aqiData) {
    return `
        <h2>Air Quality Index (AQI): ${aqiData.data.aqi}</h2>
    `;
}

function showMap(latitude, longitude) {
    if (!map) {
        map = L.map('map').setView([latitude, longitude], 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
    } else {
        map.setView([latitude, longitude], 13); 
    }

    if (window.marker) {
        window.marker.remove();
    }

    window.marker = L.marker([latitude, longitude]).addTo(map)
        .bindPopup('City is here!')
        .openPopup();
}