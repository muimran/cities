function getCircleRadius(tweetCount) {
    const baseRadius = 5;
    const scaleFactor = 8;
    return baseRadius + (Math.log10(tweetCount) * scaleFactor);
}


function createMap(cityData) {
    let map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=326d8a1b-041f-44ad-aa58-fdfdce54c9ca', {
        maxZoom: 18,
        attribution: 'Map data &copy; ...'
    }).addTo(map);

    cityData.forEach(city => {
        if(city.LAT && city.LON && city.Tweets) {
            let circleRadius = getCircleRadius(city.Tweets);

            let markerHtmlStyles = `
                background-color: #1434A4; /* Fill color */
                border-radius: 50%;
                opacity: 0.85;
                width: ${circleRadius * 2}px;
                height: ${circleRadius * 2}px;
                display: block;
                position: relative;
                transform-origin: 50% 50%;
                animation: grow-shrink 1.5s ease-out forwards;
            `;

            let customIcon = L.divIcon({
                className: "animated-marker",
                iconAnchor: [circleRadius, circleRadius],
                popupAnchor: [0, -circleRadius],
                weight: 0,
                html: `<span style="${markerHtmlStyles}"></span>`
            });

            L.marker([city.LAT, city.LON], { icon: customIcon })
              .addTo(map)
              .bindPopup(`<strong>${city.City}</strong><br>Tweets: ${city.Tweets}`);
        }
    });
}

Papa.parse('cities.csv', {
    download: true,
    header: true,
    complete: function(results) {
        createMap(results.data);
    }
});
