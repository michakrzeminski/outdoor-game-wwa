const map = L.map('map').setView([52.2297, 21.0122], 12);

// districts = {}
backend_uri = "https://34.205.62.21"

const team_count = 2
const colors = ['blue', 'red', 'green', 'yellow', 'orange']

// Dodaj warstwę mapy OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Dodaj dzielnice z backendu
var districtLayer = null;
var parkLayer = null;
refreshViewFromBackend()
setInterval(refreshViewFromBackend, 60000);

//TODO every few seconds refresh the whole map to get the other teams data
function refreshViewFromBackend() {
  console.log("Refreshing view")
  if(districtLayer != null) {
    map.removeLayer(districtLayer);
  }
  if(parkLayer != null) {
    map.removeLayer(parkLayer);
  }
  
  fetch(backend_uri + '/districts')
    .then(response => response.json())
    .then(data => {
        districtLayer = L.geoJSON(data).addTo(map);
        districtLayer.eachLayer(function(layer) {
          if(layer.feature.properties.leading_team != -1) {
            newColor = colors[layer.feature.properties.leading_team]
            layer.setStyle({ color: newColor });
          }
        });
    })
    .catch(error => console.error('Error fetching districts:', error));

  fetch(backend_uri + '/parks')
    .then(response => response.json())
    .then(data => {
      parkLayer = L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
            return createColoredMarker(latlng, feature.properties);
        }
      }).addTo(map);
    })
    .catch(error => console.error('Error fetching districts:', error));

    fetch(backend_uri + '/points')
    .then(response => response.json())
    .then(data => {
      console.log(data)
      for (let i = 1; i < team_count+1; i++) {
        document.getElementById('points'+i).innerHTML = data[i]
      }
    })
    .catch(error => console.error('Error fetching districts:', error)); 
}

// Funkcja tworząca marker z możliwością zmiany koloru
function createColoredMarker(latlng, properties) {
    icon_color = colors[properties.team]
    const icon = L.icon({
        iconUrl: `https://www.google.com/mapfiles/ms/icons/${icon_color}-dot.png`,  // Domyślna ikona markera Google
        iconSize: [34, 34],
        iconAnchor: [10, 34],
        popupAnchor: [0, -34]
    });

    const marker = L.marker(latlng, { icon: icon });

    marker.bindPopup(`<b>Nazwa:</b> ${properties.name}<br><b>Dzielnica:</b> ${properties.district}`);

    marker.on('click', function() {
        const team_index = prompt('Park: '+properties.name+'\nDzielnica: '+properties.district+'\n wpisz numer druzyny:', '0');
        if (team_index && team_index <= team_count) {
            updateBackend(properties.district,properties.name,team_index)
        }
    });
    return marker;
}

function updateBackend(district,marker,team) {
  console.log("Updating backend")
  post_data = {
    "district": district,
    "park": marker,
    "team": team
  }
  fetch(backend_uri + `/updatedistrict`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(post_data),
  })
    .then(response => response.json())
    .then(data => {
        console.log(`backend updated:`, data);
        refreshViewFromBackend();
    })
    .catch(error => console.error('Error adding/updating marker:', error));
}

function changeDistrictColor(district_name, newColor) {
  districtLayer.eachLayer(function(layer) {
    if (layer.feature.properties.name === district_name) {
        layer.setStyle({ color: newColor });
    }
  });
}

// Obsługa checkboxa do włączania/wyłączania warstwy granic dzielnic
document.getElementById('toggle-districts').addEventListener('change', function(e) {
    if (e.target.checked) {
        map.addLayer(districtLayer);
    } else {
        map.removeLayer(districtLayer);
    }
});

document.getElementById('toggle-parks').addEventListener('change', function(e) {
  if (e.target.checked) {
      map.addLayer(parkLayer);
  } else {
      map.removeLayer(parkLayer);
  }
});

document.getElementById('toggle-legend').addEventListener('click', function() {
  const legendContent = document.getElementById('legend-content');
  if (legendContent.style.display === 'none' || legendContent.style.display === '') {
      legendContent.style.display = 'block';
  } else {
      legendContent.style.display = 'none';
  }
});

document.getElementById('toggle-points').addEventListener('click', function() {
  const legendContent = document.getElementById('points-content');
  if (legendContent.style.display === 'none' || legendContent.style.display === '') {
      legendContent.style.display = 'block';
  } else {
      legendContent.style.display = 'none';
  }
});
