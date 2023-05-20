var map,
  listResponse, // Stores the list of plots and its children that can be modified or saved in DB
  markerObjectsGMap = [], // Stores google map marker objects
  
  mapOptions = {
    center: {},
    zoom: 12,
    tilt: 0,
  }, // Options for Google Map
  drawingManager, // Drawing manager object for Google Map
  addressDialog,
  manualAddressDialog, // dialoag to enter manual address when points are grouped
  newFragmentAddress,
  isCombiningFragment = false, // State to check if the app is in the state to combine fragments
  selectedPolyLines = []; // List of selcted polylines 
isCtrlDown = false; // Majorly for Undo Shortcut

let childrenItems, markersToRemove;

var polygonData = [
  {
    lat: Number,
    lng: Number,
  },
];

var lastState = []; //Maintains the last sate of the markers

function showError(msg) {
  $("#message").text(msg);
  if ($("#message").css("display") == "none") {
    $("#message").fadeIn(300);
    $("#message").delay(3200).fadeOut(300);
  }
}

function initMap() {
  mapOptions.center = new google.maps.LatLng(37.406945, -122.108284);
  map = new google.maps.Map(document.getElementById("map"), mapOptions);
  afterInit();
}

function afterInit() {

  // Initialize address dialog
  addressDialog = $("#addressDialog").dialog({
    autoOpen: false,
    height: 150,
    width: 350,
    modal: true,
    position: { my: "center top", at: "center top+20", of: window },
    buttons: {
      "Enter Manually": function () {
        addressDialog.dialog("close");
        manualAddressDialog.dialog("open");
      },
      "Click on map": function () {
        drawingManager.setOptions({
          drawingMode: null,
        });
        addressDialog.dialog("close");
      },
    },
  });

  // Initialize manual diaglog
  manualAddressDialog = $("#manualAddressDialog").dialog({
    autoOpen: false,
    height: 150,
    width: 350,
    modal: true,
    position: { my: "center top", at: "center top+20", of: window },
    buttons: {
      "Add Address": function () {
        newFragmentAddress = $("#manual-address").val();
        manualAddressDialog.dialog("close");
        manualAddressDialog.find("form")[0].reset();
        addAddressToNewFragment();
      },
      Close: function () {
        manualAddressDialog.dialog("close");
        manualAddressDialog.find("form")[0].reset();
        undoGrouping();
      },
    },
  });

  // Click Event listener on google map
  google.maps.event.addListener(map, "click", function (event) {
    if (!isCombiningFragment) {
      return;
    }
    newFragmentAddress = "";
    markerObjectsGMap.forEach((m) => {
      if (
        m.position.lat() === event.latLng.lat() &&
        m.position.lng() === event.latLng.lng()
      ) {
        newFragmentAddress = m.fragment.item.address;
      }
    });
    if (newFragmentAddress) {
      addAddressToNewFragment();
      return;
    }
    if (event.placeId) {
      const proxyurl = "https://cors-anywhere.herokuapp.com/"; //Using a proxy due to CORS
      var placeRequest = $.ajax({
        url:
          proxyurl +
          "https://maps.googleapis.com/maps/api/place/details/json?placeid=" +
          event.placeId +
          "&fields=name,formatted_address&key=AIzaSyDzEsEpQwUoXuH-EDmOA7PNkIUnIJJ4wyw",
        method: "GET",
      });
      placeRequest.done(function (msg) {
        if (msg.error != null) {
          showError("An error of type " + msg.error + " has occured.");
          return;
        }
        newFragmentAddress = msg.result.formatted_address;
        addAddressToNewFragment();
      });
      placeRequest.fail(function (jqXHR, textStatus) {
        showError("Request failed with status " + textStatus);
      });
    } else {
      showError("Please Click the correct spot");
    }
  });

  // code to let users do actions based on shortcuts
  $(document).keydown(function (event) {
    //esc for hand tool
    if (event.which === 27) {
      event.preventDefault();
      drawingManager.setDrawingMode(null);
    }
    //p for polygon
    else if (event.which === 80) {
      event.preventDefault();
      drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
    }
    //control button
    else if (event.which === 17) {
      event.preventDefault();
      isCtrlDown = true;
    }
    //for undo function ctrl+z
    else if (event.which === 90) {
      if (!isCtrlDown) return;
      event.preventDefault();
      undoGrouping();
    }
    //c for combine points
    else if (event.which === 67) {
      event.preventDefault();
      combinePoints();
    }
    //q for roadmap mode
    else if (event.which === 81) {
      event.preventDefault();
      map.setOptions({
        mapTypeId: "roadmap",
      });
    }
    //w for satellite mode
    else if (event.which === 87) {
      event.preventDefault();
      map.setOptions({
        mapTypeId: "satellite",
      });
    }
  });
  $(document).keyup(function (event) {
    if (event.which === 17) {
      event.preventDefault();
      isCtrlDown = false;
    }
  });

  $("#btnCombine").on("click", function () {
    combinePoints();
  });

  $("#btnSplit").on("click", function () {
    splitPoints();
  });

  $("#btnUndo").on("click", function () {
    undoGrouping();
  });

  $("#btnClear").on("click", function () {
    clearGrouping();
  });

  $("#removeFromGroup").on("click", function () {
    if (selectedPolyLines.length === 0) {
      showError("No Polylines selected.");
      return;
    }
    if (confirm("Are you sure you want to remove the points from group?")) {
      lastState.push({
        fragment: JSON.parse(JSON.stringify(listResponse.fragment)),
      });
      selectedPolyLines.forEach((p) => {
        let pointToUnGroup;
        var endPoint = {
          lat: p.latLngs.g[0].g[0].lat(),
          lng: p.latLngs.g[0].g[0].lng(),
        };
        var centroidPoint = {
          lat: p.latLngs.g[0].g[1].lat(),
          lng: p.latLngs.g[0].g[1].lng(),
        };
        // listResponse.fragment.forEach(f=>{
        //   if(f.item.position.lat === centroidPoint.lat && f.item.position.lng === centroidPoint.lng){
        //     index = f.children.findIndex(c=>{
        //       return (c.position.lat === endPoint.lat && c.position.lng === endPoint.lng);
        //     });
        //     pointToUnGroup = f.children.splice(index,1);
        //   }
        // });

        markerObjectsGMap.forEach((m) => {
          if (
            m.position.lat() === centroidPoint.lat &&
            m.position.lng() === centroidPoint.lng
          ) {
            pointToUnGroup = m.fragment.children.splice(
              m.fragment.children.findIndex((c) => {
                return (
                  c.position.lat === endPoint.lat &&
                  c.position.lng === endPoint.lng
                );
              }),
              1
            );
            m.lines.splice(m.lines.indexOf(p), 1);
          }
        });
        var marker = new google.maps.Marker({
          position: new google.maps.LatLng(endPoint.lat, endPoint.lng),
          map: map,
          icon: {
            url: "/assets/dot-red.svg",
            scaledSize: new google.maps.Size(6, 6),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(3.5, 3.5),
          },
        });
        marker.addListener("click", markerClick);
        let newFragment = {
          item: pointToUnGroup[0],
          children: [],
          changed: true,
        };
        marker.fragment = newFragment;
        marker.combined = false;
        p.setMap(null);
        listResponse.fragment.push(newFragment);
        markerObjectsGMap.push(marker);
      });
      selectedPolyLines.length = 0;
    }
  });

  getData();
  setMapFeatures();
}

//Clears all selection
function clearGrouping() {
  selectedPolyLines.forEach((p) => {
    p.setOptions({
      strokeColor: "black",
    });
  });
  selectedPolyLines.length = 0;
  markerObjectsGMap.forEach((m) => {
    if (m.selected) {
      m.setMap(null);
      if (m.combined) {
        m.icon = {
          url: "/assets/dot-blue.svg",
          scaledSize: new google.maps.Size(6, 6),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(3.5, 3.5),
        };
      } else {
        m.icon = {
          url: "/assets/dot-red.svg",
          scaledSize: new google.maps.Size(6, 6),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(3.5, 3.5),
        };
      }
      m.setMap(map);
      m.selected = false;
    }
  });
}

//Takes the user back to the previous state i.e. the last time when user clicked the combine button
function undoGrouping() {
  if (lastState.length === 0) {
    clearGrouping();
    return;
  }
  listResponse = lastState[lastState.length - 1];
  lastState.splice(lastState.length - 1, 1);
  setMarkers();
}

//Splits all the points
function splitPoints() {
  lastState.push({
    fragment: listResponse.fragment.slice(),
  });

  childrenItems = [];
  markersToRemove = [];
  markerObjectsGMap.forEach((m) => {
    if (m.selected) {
      if (m.combined) {
        // Get out the children
        m.fragment.children.forEach((c) => {
          childrenItems.push(c);
        });
      } else {
        childrenItems.push(m.fragment.item);
      }
      m.setMap(null);
      if (m.lines) {
        m.lines.forEach((l) => {
          l.setMap(null);
        });
      }
      markersToRemove.push(m);
      listResponse.fragment.splice(
        listResponse.fragment.indexOf(m.fragment),
        1
      );
    }
  });
  markersToRemove.forEach((m) => {
    markerObjectsGMap.splice(markerObjectsGMap.indexOf(m), 1);
  });

  childrenItems.forEach((c) => {
    let newFragment = {
      item: c,
      children: [],
      changed: true,
    };
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(
        newFragment.item.position.lat,
        newFragment.item.position.lng
      ),
      map: map,
      icon: {
        url: "/assets/dot-red.svg",
        scaledSize: new google.maps.Size(6, 6),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(3.5, 3.5),
      },
    });
    marker.fragment = newFragment;
    marker.combined = false;
    marker.addListener("click", markerClick);
    listResponse.fragment.push(newFragment);
    markerObjectsGMap.push(marker);
  });
  console.log(listResponse);
  clearGrouping();
}

//Combines all the points
function combinePoints() {
  isCombiningFragment = true;
  addressDialog.dialog("open");
}

function addAddressToNewFragment() {
  if (confirm("Add Address " + newFragmentAddress + " to the combination?")) {
    isCombiningFragment = false;
    lastState.push({
      fragment: listResponse.fragment.slice(),
    });

    childrenItems = [];
    markersToRemove = [];
    markerObjectsGMap.forEach((m) => {
      if (m.selected) {
        if (m.combined) {
          // Get out the children
          m.fragment.children.forEach((c) => {
            childrenItems.push(c);
          });
        } else {
          childrenItems.push(m.fragment.item);
        }
        m.setMap(null);
        markersToRemove.push(m);
        listResponse.fragment.splice(
          listResponse.fragment.indexOf(m.fragment),
          1
        );
      }
    });
    markersToRemove.forEach((m) => {
      markerObjectsGMap.splice(markerObjectsGMap.indexOf(m), 1);
    });

    let newFragment = {
      item: {
        position: centroidOfItems(childrenItems),
        address: newFragmentAddress,
      },
      children: childrenItems,
      changed: true,
    };
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(
        newFragment.item.position.lat,
        newFragment.item.position.lng
      ),
      map: map,
      icon: {
        url: "/assets/dot-blue.svg",
        scaledSize: new google.maps.Size(6, 6),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(3.5, 3.5),
      },
    });
    //Remove all the previous lines
    markersToRemove.forEach((m) => {
      if (m.lines) {
        m.lines.forEach((l) => {
          l.setMap(null);
        });
      }
      m.setMap(null);
    });
    marker.lines = [];
    //Draw polyline for children elements
    newFragment.children.forEach((c) => {
      let polyLine = new google.maps.Polyline({
        path: [c.position, newFragment.item.position],
      });
      polyLine.setMap(map);
      marker.lines.push(polyLine);
      google.maps.event.addListener(polyLine, "click", function () {
        polyLine.setOptions({
          strokeColor: "#FFCC11",
        });
        selectedPolyLines.push(polyLine);
      });
    });
    marker.fragment = newFragment;
    marker.combined = true;
    marker.addListener("click", markerClick);
    listResponse.fragment.push(newFragment);
    markerObjectsGMap.push(marker);
    showError("Address added successfully");
    drawingManager.setOptions({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
    });
    clearGrouping();
  } else {
    undoGrouping();
  }
}

//Gets data from source
function getData() {
  var req = $.ajax({
    url: './data.json',
    method: "GET",
  });
  req.done(function (msg) {
    listResponse = {
      item: [],
    };
    if (msg.error != null) {
      showError("An error of type " + msg.error + " has occured.");
      return;
    }
    if (!msg) {
      showError("List is Empty");
      return;
    }
    listResponse = msg;
    if (listResponse > 0) {
      map.setCenter({
        lat: listResponse.fragment[0].item.position.lat,
        lng: listResponse.fragment[0].item.position.lng,
      });
    }
    setMarkers();
  });
  req.fail(function (jqXHR, textStatus) {
    showError("Request failed with status " + textStatus);
  });
}

//sets markers on the map
function setMarkers() {
  markerObjectsGMap.find((m) => {
    if (m.lines) {
      m.lines.forEach((l) => {
        l.setMap(null);
      });
    }
    m.setMap(null);
  });
  markerObjectsGMap = [];

  for (let i = 0; i < listResponse.fragment.length; i++) {
    if (
      listResponse.fragment[i].children &&
      listResponse.fragment[i].children.length > 0
    ) {
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(
          listResponse.fragment[i].item.position.lat,
          listResponse.fragment[i].item.position.lng
        ),
        map: map,
        icon: {
          url: "/assets/dot-blue.svg",
          scaledSize: new google.maps.Size(6, 6),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(3.5, 3.5),
        },
      });
      marker.lines = [];
      listResponse.fragment[i].children.forEach((m) => {
        var polyLine = new google.maps.Polyline({
          path: [m.position, listResponse.fragment[i].item.position],
        });
        polyLine.setMap(map);
        marker.lines.push(polyLine);
        google.maps.event.addListener(polyLine, "click", function () {
          polyLine.setOptions({
            strokeColor: "#FFCC11",
          });
          selectedPolyLines.push(polyLine);
          // the point - console.log(polyLine.latLngs.i[0].i[0].lat()+' '+polyLine.latLngs.i[0].i[0].lng());
          // centroid - console.log(polyLine.latLngs.i[0].i[1].lat()+' '+polyLine.latLngs.i[0].i[1].lng());
        });
      });
      marker.combined = true;
    } else {
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(
          listResponse.fragment[i].item.position.lat,
          listResponse.fragment[i].item.position.lng
        ),
        map: map,
        icon: {
          url: "/assets/dot-red.svg",
          scaledSize: new google.maps.Size(6, 6),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(3.5, 3.5),
        },
      });
      marker.combined = false;
    }
    marker.addListener("click", markerClick);
    marker.fragment = listResponse.fragment[i];
    markerObjectsGMap.push(marker);
  }
}

function setMapFeatures() {
  //Allows user to draw on the map
  drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.LEFT_CENTER,
      drawingModes: ["polygon"],
    },
    // polygonOptions:{
    //     fillColor: 'red',
    //     fillOpacity: 0.3,
    //     strokeWeigth: 3,
    //     strokeColor: 'red'
    // },
  });
  drawingManager.setMap(map);
  google.maps.event.addListener(
    drawingManager,
    "polygoncomplete",
    function (polygon) {
      polygonData = [];
      for (let i = 0; i < polygon.getPath().getLength(); i++) {
        const tempEl = polygon.getPath().getAt(i);
        polygonData.push({ lat: tempEl.lat(), lng: tempEl.lng() });
      }
      polygon.setMap(null);
      findMarkersInPolygon();
    }
  );
}


//Finds markers inside polygon
function findMarkersInPolygon() {
  //Find the marker and replace it with yellow dot
  markerObjectsGMap.forEach((m) => {
    if (isInside(polygonData, polygonData.length, m.fragment.item.position)) {
      m.setMap(null);
      m.icon = {
        url: "/assets/dot-yellow.svg",
        scaledSize: new google.maps.Size(6, 6),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(3.5, 3.5),
      };
      m.setMap(map);
      m.selected = true;
    }
  });
}

//Returns the centroid of the points in polygon.
function centroidOfItems(items) {
  var cenLat = 0,
    cenLng = 0;
  for (let i = 0; i < items.length; i++) {
    cenLat = cenLat + items[i].position.lat;
    cenLng = cenLng + items[i].position.lng;
  }
  return { lat: cenLat / items.length, lng: cenLng / items.length };
}

//Marker click event
function markerClick(event) {
  var filteredObj = markerObjectsGMap.filter((m)=>{
    return m.position.lat() === event.latLng.lat() &&
    m.position.lng() === event.latLng.lng()
  })[0];

  if(filteredObj){
    if (isCombiningFragment) {
      newFragmentAddress = filteredObj.fragment.item.address;
      addAddressToNewFragment();
      return;
    }
    if (!filteredObj.selected) {
      if (filteredObj.fragment.children && filteredObj.fragment.children.length === 1) {
        return;
      }
      filteredObj.setMap(null);
      filteredObj.icon = {
        url: "/assets/dot-yellow.svg",
        scaledSize: new google.maps.Size(6, 6),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(3.5, 3.5),
      };
      filteredObj.setMap(map);
      filteredObj.selected = true;
    } else {
      filteredObj.setMap(null);
      filteredObj.icon = {
        url: "/assets/dot-" + (filteredObj.combined ? "blue" : "red") + ".svg",
        scaledSize: new google.maps.Size(6, 6),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(3.5, 3.5),
      };
      filteredObj.setMap(map);
      filteredObj.selected = false;
    }
  }
}

//To check if point lies in polygon
function onSegment(p, q, r) {
  if (
    q.lat <= Math.max(p.lat, r.lat) &&
    q.lat >= Math.min(p.lat, r.lat) &&
    q.lng <= Math.max(p.lng, r.lng) &&
    q.lng >= Math.min(p.lng, r.lng)
  )
    return true;
  return false;
}

function orientation(p, q, r) {
  var val =
    (q.lng - p.lng) * (r.lat - q.lat) - (q.lat - p.lat) * (r.lng - q.lng);

  if (val == 0) return 0;
  return val > 0 ? 1 : 2;
}

function doIntersect(p1, q1, p2, q2) {
  var o1 = orientation(p1, q1, p2);
  var o2 = orientation(p1, q1, q2);
  var o3 = orientation(p2, q2, p1);
  var o4 = orientation(p2, q2, q1);

  // General case
  if (o1 != o2 && o3 != o4) return true;

  //Special Cases
  if (o1 == 0 && onSegment(p1, p2, q1)) return true;

  if (o2 == 0 && onSegment(p1, q2, q1)) return true;

  if (o3 == 0 && onSegment(p2, p1, q2)) return true;

  if (o4 == 0 && onSegment(p2, q1, q2)) return true;

  return false;
}

// Returns true if the point p lies inside the polygon[] with n vertices
function isInside(polygon, n, p) {
  if (n < 3) return false;
  var extreme = { lat: 90, lng: p.lng };

  var count = 0,
    i = 0;
  do {
    var next = (i + 1) % n;

    if (doIntersect(polygon[i], polygon[next], p, extreme)) {
      if (orientation(polygon[i], p, polygon[next]) == 0)
        return onSegment(polygon[i], p, polygon[next]);

      count++;
    }
    i = next;
  } while (i != 0);

  return count % 2 == 1;
}
