// Dynamically calculate scale factor so the largest value corresponds to desired max radius
function getAutoScaleFactor(data, desiredMaxRadius, baseRadius) {
    const maxValue = Math.max(...data.map(d => parseFloat(d.Tweets)));
    const maxValueSqrt = Math.sqrt(maxValue);
    return (desiredMaxRadius - baseRadius) / maxValueSqrt;
}

// Return circle radius based on tweet count and scale factor
function getCircleRadius(tweetCount, scaleFactor, baseRadius) {
    return baseRadius + (Math.sqrt(tweetCount) * scaleFactor);
}

// Create the Leaflet map and add proportional circles
// Create the Leaflet map and add proportional circles
// Create the Leaflet map and add proportional circles
function createMap(cityData) {
    let map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=326d8a1b-041f-44ad-aa58-fdfdce54c9ca', {
        maxZoom: 18,
        attribution: 'Map data © ...'
    }).addTo(map);

    const baseRadius = 2;
    const maxRadius = 30;
    const scaleFactor = getAutoScaleFactor(cityData, maxRadius, baseRadius);

    cityData.forEach(city => {
        if (city.LAT && city.LON && city.Tweets) {
            let tweetCount = parseFloat(city.Tweets);
            let circleRadius = getCircleRadius(tweetCount, scaleFactor, baseRadius);

            // --- CHANGES ARE HERE ---
            let markerHtmlStyles = `
                background-color: #1434A4;
                border: 2px solid #0B257A;      /* ADD THIS LINE for the outline */
                border-radius: 50%;
                opacity: 0.7;                   /* CHANGE THIS VALUE for opacity */
                width: ${circleRadius * 2}px;
                height: ${circleRadius * 2}px;
                display: block;
                position: relative;
                box-sizing: border-box;         /* ADD THIS for better size calculation with border */
                transform-origin: 50% 50%;
                animation: grow-shrink 1.5s ease-out forwards;
            `;
            // --- END OF CHANGES ---

            let customIcon = L.divIcon({
                className: "animated-marker",
                iconAnchor: [circleRadius, circleRadius],
                popupAnchor: [0, -circleRadius],
                html: `<span style="${markerHtmlStyles}"></span>`
            });

            L.marker([city.LAT, city.LON], { icon: customIcon })
                .addTo(map)
                .bindPopup(`<strong>${city.City}</strong><br>Tweets: ${city.Tweets}`);
        }
    });
}
// Load CSV and build the map
Papa.parse('cities.csv', {
    download: true,
    header: true,
    complete: function (results) {
        createMap(results.data);
    }
});
