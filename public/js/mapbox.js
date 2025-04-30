console.log('Hello from CS')
document.addEventListener('DOMContentLoaded', () => { // If DOM not loaded, loactions = undefined
  const locations = JSON.parse(document.getElementById('map').dataset.locations);

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11'
  });
});
