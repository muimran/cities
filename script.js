function getInitialZoom() {
    const width = window.innerWidth;
    if (width > 1200) return 2;   // wide screen, more zoomed out
    if (width > 768) return 3;
    if (width > 480) return 4;
    return 5;                     // small screen, zoom in more to fill view nicely
}

function createMap(cityData) {
    // Remove old map instance if exists (added for proper redraw)
    if (map) {
        map.remove();
    }

    // *** UPDATED: Use responsive initial zoom here ***
    const initialZoom = getInitialZoom();
    map = L.map('map').setView([20, 0], initialZoom);

    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=326d8a1b-041f-44ad-aa58-fdfdce54c9ca', {
        maxZoom: 18,
        attribution: 'Map data © ...'
    }).addTo(map);

    const oms = new OverlappingMarkerSpiderfier(map, {
        keepSpiderfied: true
    });

    const baseRadius = 5;
    const maxRadius = getResponsiveMaxRadius();
    const scaleFactor = getAutoScaleFactor(cityData, maxRadius, baseRadius);

    cityData.forEach(city => {
        if (city.LAT && city.LON && city.Amount) {
            let amountValue = parseFloat(city.Amount);
            let circleRadius = getCircleRadius(amountValue, scaleFactor, baseRadius);

            let markerHtmlStyles = `
                background-color: #1434A4;
                border: 1.5px solid #000000;
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

            const popupContent = `
                <strong>${city.City}</strong><br>
                Amount: ${parseFloat(city.Amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}<br>
                <p style="margin-top: 5px;">${formattedDescription}</p>
            `;
            marker.bindPopup(popupContent);
            
            oms.addMarker(marker);
        }
    });

    // *** ADDED: Fit map bounds to all markers for best viewport on all screens ***
    const latLngs = cityData
        .filter(city => city.LAT && city.LON)
        .map(city => [city.LAT, city.LON]);

    if (latLngs.length > 0) {
        map.fitBounds(latLngs, {
            padding: [20, 20],      // padding around edges in pixels
            maxZoom: initialZoom    // don't zoom in more than initialZoom level
        });
    }
}
