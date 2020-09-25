function initMap() {
    // initial Map options (brisbane)
    let options = {
        zoom: 12,
        center: { lat: -27.4698, lng: 153.0251 }
    }
    // New map
    let map = new google.maps.Map(document.getElementById('mapHome'), options);

}