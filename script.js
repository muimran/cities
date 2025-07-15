function createMap(cityData) {
    let map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=326d8a1b-041f-44ad-aa58-fdfdce54c9ca', {
        maxZoom: 18,
        attribution: 'Map data &copy; ...'
    }).addTo(map);

    cityData.forEach(city => {
        if (city.LAT && city.LON) {
            L.circleMarker([city.LAT, city.LON], {
                radius: 2, // fixed small dot
                color: '#FF0000',
                fillColor: '#FF0000',
                fillOpacity: 0.85
            })
            .addTo(map)
            .bindPopup(`Lat: ${city.LAT}, Lon: ${city.LON}`);
        }
    });
}

// Parse the CSV
Papa.parse('cities.csv', {
    download: true,
    header: true,
    complete: function(results) {
        createMap(results.data);
    }
});
