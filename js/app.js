/**
 * Google Maps API Example Usage: https://developers.google.com/maps/documentation/javascript/examples/distance-matrix
 */


/**
 * Config
 */

DEFAULT_DESTINATIONS = [
    ['Zürich HB', 'Zürich HB'],
    ['ETH', 'ETH Zürich Hauptgebäude'],
    ['Uni', 'Universität Irchel, Zürich'],
];

DEFAULT_TRAVEL_MODE = 'WALKING';


/**
 * App
 */

let bounds = new google.maps.LatLngBounds;
let markersArray = [];
let destinationList = [];


function start() {
    const address = $('#address').val();
    if (address !== null && address !== 'null') {
        getDistances(address, destinationList);
        updateUrlParam('address', address);
    }
}


function getDistances(address, destinations) {
    let dests = [];
    for (let i = 0; i < destinations.length; i++) {
        dests.push(destinations[i][1]);
    }
    const travelMode = getTravelMode();

    var service = new google.maps.DistanceMatrixService;
    service.getDistanceMatrix({
        origins: [address],
        destinations: dests,
        travelMode: travelMode,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
    }, function (response, status) {
        if (status !== 'OK') {
        } else {
            const results = response.rows[0].elements;
            var originList = response.originAddresses;
            const destList = response.destinationAddresses;
            updateResults(destinations, results);
            drawMap(originList, destList);
        }
    });
}

function refreshResults() {
    const list = $('#resultTableBody');
    list.empty();

    for (let i = 0; i < destinationList.length; i++) {
        const destination = destinationList[i];
        const title = destination[0];
        const address = destination[1];
        const rowId = 'dest-' + i;
        const distFieldId = rowId + '-dis';
        const durFieldId = rowId + '-dur';
        list.append(
            '<tr id="' + rowId + '">' +
            '<td>' + title + '</td>' +
            '<td>' + address + '</td>' +
            '<td id="' + distFieldId + '">-</td>' +
            '<td id="' + durFieldId + '">-</td>' +
            '<td><a href="#" onclick="removeDestination(' + i + ');"><i class="fa fa-trash" aria-hidden="true"></a></td>' +
            '</tr>');
    }

    showResults();
}

function updateResults(destinations, results) {
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (!result || !result.distance || !result.duration) {
            $('#dest-' + i + '-dis').html('?');
            $('#dest-' + i + '-dur').html('?');
            continue;
        }
        const distance = result.distance.text;
        const duration = result.duration.text;
        $('#dest-' + i + '-dis').html(distance);
        $('#dest-' + i + '-dur').html(duration);
    }

    showResults();
}

function showResults() {
    $('#resultView').removeClass('hidden');
    const resultTable = $('#resultTable');
    resultTable.editableTableWidget();

    resultTable.off('change');
    resultTable.on('change', destinationsChanged);
}

function drawMap(originList, destList) {
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
                console.log('Geocode was not successful due to: ' + status);
            }
        };
    };

    for (var i = 0; i < originList.length; i++) {
        const originIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_icon&chld=home|cc4b37|000000';
        geocoder.geocode({'address': originList[i]}, showGeocodedAddressOnMap(originIcon));
        for (var j = 0; j < destList.length; j++) {
            const label = destinationList[j][0];
            const destIcon = 'https://chart.googleapis.com/chart?chst=d_bubble_text_small&chld=bb|' + label + '|1779ba|fefefe';
            geocoder.geocode({'address': destList[j]}, showGeocodedAddressOnMap(destIcon));
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
    if (!paramVal) {
        return;
    }

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

function destinationsChanged(evt, newValue) {
    let newDestinations = [];
    for (let i = 0; i < destinationList.length; i++) {
        const title = $('#dest-' + i + ' td:nth-child(1)').text();
        const address = $('#dest-' + i + ' td:nth-child(2)').text();
        newDestinations.push([title, address]);
    }
    destinationList = newDestinations;
    storeDestinations();

    refreshResults();
    start();
}

/**
 * Storage
 */

function loadDestinations() {
    return JSON.parse(localStorage.getItem('destinations'));
}

function storeDestinations() {
    localStorage.setItem('destinations', JSON.stringify(destinationList));
}

function addDestination() {
    destinationList.push(['Destination', 'Address']);
    storeDestinations();

    refreshResults();
}

function removeDestination(idx) {
    destinationList.splice(idx, 1);
    storeDestinations();

    refreshResults();
    start();
}

function getTravelMode() {
    const travelMode = localStorage.getItem('travel_mode');
    if (!travelMode || travelMode === '') {
        return DEFAULT_TRAVEL_MODE;
    }
    return travelMode;
}

function setTravelMode(travelMode) {
    localStorage.setItem('travel_mode', travelMode);
}

function travelModeChanged() {
    const travelModeSelect = $('#travelModeSelect');
    const travelMode = travelModeSelect.val();
    setTravelMode(travelMode);
    start();
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

    // Initialize travel mode select
    const travelModeSelect = $('#travelModeSelect');
    travelModeSelect.val(getTravelMode());
    travelModeSelect.change(travelModeChanged);

    // Load destinations
    destinationList = loadDestinations();
    if (!destinationList || destinationList.length === 0) {
        console.log('Loading default destinations');
        destinationList = DEFAULT_DESTINATIONS;
    }

    refreshResults();
    showResults();

    // Try to load address from Url param
    loadAddressFromUrl();

    start();
});