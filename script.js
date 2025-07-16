// Dynamically calculate scale factor so the largest value corresponds to desired max radius
function getAutoScaleFactor(data, desiredMaxRadius, baseRadius) {
    // CHANGED HERE: Reading from 'Amount' column
    const maxValue = Math.max(...data.map(d => parseFloat(d.Amount) || 0));
    const maxValueSqrt = Math.sqrt(maxValue);
    if (maxValueSqrt === 0) {
        return 0;
    }
    return (desiredMaxRadius - baseRadius) / maxValueSqrt;
}

// Return circle radius based on the amount and scale factor
function getCircleRadius(amount, scaleFactor, baseRadius) { // CHANGED HERE: Variable name for clarity
    return baseRadius + (Math.sqrt(amount) * scaleFactor);
}

// Create the Leaflet map and add proportional circles
function createMap(cityData) {
    let map = L.map('map').setView([20, 0], 2);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=326d8a1b-041f-44ad-aa58-fdfdce54c9ca', {
        maxZoom: 18,
        attribution: 'Map data © ...'
    }).addTo(map);

    const oms = new OverlappingMarkerSpiderfier(map, {
        keepSpiderfied: true
    });

    const baseRadius = 5;
    const maxRadius = 35;
    const scaleFactor = getAutoScaleFactor(cityData, maxRadius, baseRadius);

    cityData.forEach(city => {
        // CHANGED HERE: Checking for 'Amount' column
        if (city.LAT && city.LON && city.Amount) {
            // CHANGED HERE: Reading from 'Amount' and renaming variable
            let amountValue = parseFloat(city.Amount);
            let circleRadius = getCircleRadius(amountValue, scaleFactor, baseRadius);

            let markerHtmlStyles = `
            background-color: #1434A4;
            border: 1.5px solid #000000;  /* Changed to hex code format */
            border-radius: 50%;
            opacity: 0.9;
            width: ${circleRadius * 2}px;
            height: ${circleRadius * 2}px;
            display: block;
            position: relative;
            box-sizing: border-box;
            transform-origin: 50% 50%;
            animation: grow-shrink 1.5s ease-out forwards;
            cursor: pointer;
            `;

            let customIcon = L.divIcon({
                className: "animated-marker",
                iconAnchor: [circleRadius, circleRadius],
                popupAnchor: [0, -circleRadius],
                html: `<span style="${markerHtmlStyles}"></span>`
            });
            
            let marker = L.marker([city.LAT, city.LON], { icon: customIcon });
            marker.addTo(map);

            const rawDescription = city.Description || "";
            const formattedDescription = rawDescription.replaceAll('|', '<br><br>');

            // CHANGED HERE: Updated label to "Amount" and using city.Amount
            const popupContent = `
                <strong>${city.City}</strong><br>
                Amount: ${parseFloat(city.Amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}<br>
                <p style="margin-top: 5px;">${formattedDescription}</p>
            `;
            marker.bindPopup(popupContent);
            
            oms.addMarker(marker);
        }
    });
}

// Load CSV and build the map
Papa.parse('cities.csv', {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
        createMap(results.data);
    }
});