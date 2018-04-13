/**
 * Google Maps API Example Usage: https://developers.google.com/maps/documentation/javascript/examples/distance-matrix
 */


/**
 * Config
 */

DESTINATIONS = [
    ['Work', 'Uetlibergstrasse 137, Zürich'],
    ['Zürich HB', 'Zürich HB'],
    //['Winterthur HB', 'Winterthur HB']
];


/**
 * App
 */

let bounds = new google.maps.LatLngBounds;
let markersArray = [];


function start() {
    const address = $('#address').val();
    if (address !== null && address !== 'null') {
        getDistances(address, DESTINATIONS);
        updateUrlParam('address', address);
    }
}


function getDistances(address, destinations) {
    let dests = [];
    for (let i = 0; i < destinations.length; i++) {
        dests.push(destinations[i][1]);
    }

    var service = new google.maps.DistanceMatrixService;
    service.getDistanceMatrix({
        origins: [address],
        destinations: dests,
        travelMode: 'WALKING',
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
    }, function (response, status) {
        if (status !== 'OK') {
        } else {
            const results = response.rows[0].elements;
            var originList = response.originAddresses;
            const destinationList = response.destinationAddresses;
            updateResults(destinations, results);
            drawMap(originList, destinationList);
        }
    });
}

function updateResults(destinations, results) {
    const list = $('#resultTable');
    list.empty();

    for (let i = 0; i < results.length; i++) {
        const destination = destinations[i][0];
        const distance = results[i].distance.text;
        const duration = results[i].duration.text;
        list.append('<tr><td>' + destination + '</td><td>' + distance + '</td><td>' + duration + '</td></tr>')
    }

    showResults();
}

function showResults() {
    $('#resultView').removeClass('hidden');
}

function drawMap(originList, destinationList) {
    deleteMarkers();

    var markersArray = [];
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10
    });
    var geocoder = new google.maps.Geocoder;


    var showGeocodedAddressOnMap = function (icon) {
        return function (results, status) {
            if (status === 'OK') {
                map.fitBounds(bounds.extend(results[0].geometry.location));
                markersArray.push(new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location,
                    icon: icon
                }));
            } else {
                alert('Geocode was not successful due to: ' + status);
            }
        };
    };

    for (var i = 0; i < originList.length; i++) {
        const originIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=home|cc4b37|000000';
        geocoder.geocode({'address': originList[i]}, showGeocodedAddressOnMap(originIcon));
        for (var j = 0; j < destinationList.length; j++) {
            const label = DESTINATIONS[j][0];
            const destIcon = 'https://chart.googleapis.com/chart?chst=d_bubble_text_small&chld=bb|' + label + '|1779ba|fefefe';
            geocoder.geocode({'address': destinationList[j]}, showGeocodedAddressOnMap(destIcon));
        }
    }
}

function deleteMarkers() {
    for (var i = 0; i < markersArray.length; i++) {
        markersArray[i].setMap(null);
    }
    markersArray = [];
}

function updateUrlParam(param, paramVal) {
    const url = window.location.href;

    var newAdditionalURL = '';
    var tempArray = url.split('?');
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    var temp = '';
    if (additionalURL) {
        tempArray = additionalURL.split('&');
        for (var i = 0; i < tempArray.length; i++) {
            if (tempArray[i].split('=')[0] !== param) {
                newAdditionalURL += temp + tempArray[i];
                temp = '&';
            }
        }
    }

    var rows_txt = temp + '' + param + '=' + paramVal;
    window.history.replaceState('', '', baseURL + '?' + newAdditionalURL + rows_txt);
}

function getUrlParam(param) {
    let url = new URL(window.location.href);
    return url.searchParams.get(param);
}

function loadAddressFromUrl() {
    const address = decodeURI(getUrlParam('address'));
    if (address !== null && address !== 'null') {
        $('#address').val(address);
        start();
    }
}

/**
 * Initialization
 */

$(document).ready(function () {
    // Enable start button to start
    $('#startButton').click(start);

    // Enable ENTER key to start
    $('#address').keypress(function (e) {
        if (e.which === 13) {
            start();
            return false;
        }
    });

    // Try to load address from Url param
    loadAddressFromUrl();
});