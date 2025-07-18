// Dynamically calculate scale factor so the largest value corresponds to desired max radius
function getAutoScaleFactor(data, desiredMaxRadius, baseRadius) {
    const maxValue = Math.max(...data.map(d => parseFloat(d.Amount) || 0));
    const maxValueSqrt = Math.sqrt(maxValue);
    if (maxValueSqrt === 0) return 0;
    return (desiredMaxRadius - baseRadius) / maxValueSqrt;
}

// Return circle radius based on the amount and scale factor
function getCircleRadius(amount, scaleFactor, baseRadius) {
    return baseRadius + (Math.sqrt(amount) * scaleFactor);
}

// Calculate max radius based on window or container width
function getResponsiveMaxRadius() {
    const width = window.innerWidth;
    if (width > 1200) return 35;
    if (width > 992) return 30;
    if (width > 768) return 25;
    if (width > 480) return 20;
    return 15;
}




let map; // Declare map variable globally to reuse or clear later if needed

// Create the Leaflet map and add proportional circles and country polygons
function createMap(cityData) {
    if (map) {
        map.remove();
    }

    map = L.map('map').setView([25, 0], 3);

    //L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png?api_key=...', {
       // maxZoom: 18,
      //  attribution: 'Map data © ...'
   // }).on('tileerror', function (e) {
       // console.warn('Tile loading error:', e);
   // }).addTo(map);


    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,  // CartoDB supports higher zoom than Stadia's 18
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd'
    }).on('tileerror', function (e) {
        console.warn('Tile loading error:', e);
    }).addTo(map);

    const oms = new OverlappingMarkerSpiderfier(map, {
        keepSpiderfied: true,
        spiderfyDistanceMultiplier: 4
    });

    // Prepare set of countries to highlight based on city data
    const countriesToHighlight = new Set(
        cityData.map(d => d.City === "Czech Republic" ? "Czechia" : d.City)
    );

    // Load country polygons and highlight only those in the set
    fetch('countries.geojson')
        .then(response => response.json())
        .then(geojsonData => {
            L.geoJSON(geojsonData, {
                style: feature => {
                    const countryName = feature.properties.name || feature.properties.ADMIN;
                    if (countriesToHighlight.has(countryName)) {
                        return {
                            fillColor: '#FEEAB0',  // light yellow
                            color: '#999999',
                            weight: 1,
                            fillOpacity: 0.6
                        };
                    } else {
                        return {
                            fillOpacity: 0,
                            weight: 0
                        };
                    }
                },
                onEachFeature: (feature, layer) => {
                    const countryName = feature.properties.name || feature.properties.ADMIN;
                    if (countriesToHighlight.has(countryName)) {
                        layer.bindTooltip(countryName, {
                            permanent: false,
                            direction: 'center',
                            className: 'country-tooltip'
                        });

                        // Zoom to country polygon on click
                        layer.on('click', () => {
                            map.fitBounds(layer.getBounds(), {
                                padding: [40, 40],
                                maxZoom: 8
                            });
                        });
                    }
                }
            }).addTo(map);
        });

    const baseRadius = 5;
    const maxRadius = getResponsiveMaxRadius();
    const scaleFactor = getAutoScaleFactor(cityData, maxRadius, baseRadius);

    cityData.forEach(city => {
        if (city.LAT && city.LON && city.Amount) {
            const amountValue = parseFloat(city.Amount);
            const circleRadius = getCircleRadius(amountValue, scaleFactor, baseRadius);

            const markerHtmlStyles = `
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

            const customIcon = L.divIcon({
                className: "animated-marker",
                iconAnchor: [circleRadius, circleRadius],
                popupAnchor: [0, -circleRadius],
                html: `<span style="${markerHtmlStyles}"></span>`
            });

            const marker = L.marker([city.LAT, city.LON], { icon: customIcon });

            const rawDescription = city.Description || "";
            const formattedDescription = rawDescription.replaceAll('|', '<br><br>');
            const popupContent = `
                <strong>${city.City}</strong><br>
                Amount: ${amountValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}<br>
                <p style="margin-top: 5px;">${formattedDescription}</p>
            `;
            marker.bindPopup(popupContent);

            marker.bindTooltip(city.City, {
                permanent: false,
                direction: 'top',
                offset: [0, -circleRadius],
                opacity: 0.9
            });

            marker.on('mouseover', () => marker.openTooltip());
            marker.on('mouseout', () => marker.closeTooltip());
            marker.on('click', () => marker.closeTooltip());

            marker.addTo(map);
            oms.addMarker(marker);
        }
    });
}

// Load CSV and build the map
function loadAndCreateMap() {
    Papa.parse('cities.csv', {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            createMap(results.data);
        }
    });
}

// Initial load
loadAndCreateMap();

// Rebuild on window resize (debounced)
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        loadAndCreateMap();
    }, 300);
});
