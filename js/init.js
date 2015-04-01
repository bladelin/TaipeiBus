
function initializeMap($container, $ctrlBar) {

    if (map.gMap==null) {   // check whether google map is initialized

        map.initMap($container, {
            /*
            onMapClick: function(e) {
                this.drawLine(e.latLng);
            },
            onDrawing: function() {
                if (map.history.length==0)
                    $(".undo", $ctrlBar).addClass("disabled");
                else
                    $(".undo", $ctrlBar).removeClass("disabled");
            }*/
        });

        map.setMapType(GMAPTYPE.ROADMAP);
        map.setMapMode(GMAPMODE.EDIT);
        map.addControl(GMAPCONTROL.NAVIGATIONSMALL);
        map.addControl(GMAPCONTROL.SCALENORMAL);


        var polyOptions = {
            strokeColor: "#46A3FF",
            strokeOpacity: 1.0,
            strokeWeight: 3
        };
        poly = new google.maps.Polyline(polyOptions);
        //poly.setMap(map.gMap);


        //map.addControl($ctrlBar);
        //$ctrlBar.show();
    }
}

function gpsPathToPointsArray(gpsPathData) {
    var gpsData = gpsPathData.gpsData;
        pointsArray = new Array();

    if(gpsData) {
        pointsArray = $.merge(pointsArray, gpsData);
    }
    return pointsArray;
}

function extractAndValidateDetails() {
    var r = {
            valid: true,
            msg: "",
            values: {   // all activity data is extracted and prepared here except for "poi", which is prepared at step 2 whenever user edit pois
                pointsArray: new Array(),
                distance:0,
            }
        };

    $.each(map.pointsArray, function(i, point) {    // (x, y) is accepted while posting to the server, not (lat, lng)
        var p = new Object();
        p = $.extend(p, point);
        p.x = point.marker.position.lng();
        p.y = point.marker.position.lat();
        //save last poiknt
        if(i > 0) {
            var lastPoint = r.values.pointsArray[0];
            var distance = distanceFromPoint(p.x, p.y, lastPoint.x, lastPoint.y);
            p.distance = distance;
        }else {
            p.distanfce = 0;
        }
        delete p.marker;    // marker is not necessary while uploading
        r.values.pointsArray[i] = p;
    });
    return r;
}

function addDataField(stopData) {
    var html = "<li>起點站</li>";
    var length = 0;

    $.each(stopData, function(idx, stop) {
        html +=  "<li><a id=\"stop_"+idx+"\" class=\"item\" href=\"#"+idx+"\">"+stop.stop+"\t"+stop.approch+"</li>";
        length++;
    });

    html += "<li>終點站</li>";
    $('#sidebar').html("<ul>" + html +"</ul>");

    $('#sidebar a').live('click',function(e) {
        var idx = $(this).attr('href').replace("#","");
        if(map.pointsArray[idx] != undefined)
            google.maps.event.trigger(map.pointsArray[idx].marker, 'mouseover');
    });

    return length;
}

function setStopData(stopData) {
    //clear last info
    clearInterval(clockInterval);
    poly.setMap(null);
    map.reset();

    var length = addDataField(stopData);
    var lineCoordinates = [];


    $.each(stopData, function(idx, stop) {

        var tmpObj = new Object;
        tmpObj.data = stop;

        var gps = new google.maps.LatLng(parseFloat(tmpObj.data.lng), parseFloat(tmpObj.data.lat));
        lineCoordinates.push(gps);

        var icon = "";
        if (tmpObj.data.approch.indexOf("進站中")>-1 || tmpObj.data.approch.indexOf("將到站")>-1) {
            icon = map.markerImages.bus;
        }

        tmpObj.point = map.newPointElement({
            type: GPOINTTYPE.MANUAL,
            latLng: gps,
            drag: false,
            visible: true,
            markerImage: icon,
        });

        if ( tmpObj.data.lng < map.minLong ) map.minLong = tmpObj.data.lng;
        if ( tmpObj.data.lng > map.maxLong ) map.maxLong = tmpObj.data.lng;
        if ( tmpObj.data.lat < map.minLat ) map.minLat = tmpObj.data.lat;
        if ( tmpObj.data.lat > map.maxLat ) map.maxLat = tmpObj.data.lat;
        map.pointsArray[idx] = tmpObj.point;

        map.addListener(tmpObj.point.marker, "mouseover", function(e){

            var stopData = tmpObj.data;
            renderPage(this, stopData);

            var strID = "#stop_"+idx;
            if ($(strID).size() > 0) {
                $(".item.active").removeClass("active");
                $(strID).addClass("active");
                window.location = "#"+stopData.stop;

                var elOffset = $(strID).offset().top;
                var elHeight = $(strID).height();
                var windowHeight = $(window).height();
                var offset;

                if (elHeight < windowHeight) {
                    offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                }
                else {
                    offset = elOffset;
                }
                $('#sidebar').animate({
                    scrollTop : elOffset
                }, 100);
            }
        });

        if(idx == length-1) {
            map.setMapFitBounds();
            map.panTo(gps);
            map.setZoom(13);
        }
    });

    // Define the symbol, using one of the predefined paths ('CIRCLE')
    // supplied by the Google Maps JavaScript API.
    var lineSymbol = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        strokeColor: '#46A3FF'
    };

    // Create the polyline and add the symbol to it via the 'icons' property.
    poly = new google.maps.Polyline({
        path: lineCoordinates,
        icons: [{
            icon: lineSymbol,
            offset: '100%'
        }],
        map: map.gMap
    });


    clockInterval = animateCircle();
    map.updateLine();
}


// Use the DOM setInterval() function to change the offset of the symbol
// at fixed intervals.
function animateCircle() {

    var count = 0;
    return window.setInterval(function() {
      count = (count + 1) % 200;

      var icons = poly.get('icons');
      icons[0].offset = (count / 2) + '%';
      poly.set('icons', icons);
  }, 40);
}


function setAllStopData(stopData) {
    var markers = [];
    $.each(stopData, function(idx, stop) {

        if(typeof(stop.ID != "undefined")) {
            var tmpObj = new Object;

            tmpObj.data = stop;

            tmpObj.point = map.newPointElement({
                type: GPOINTTYPE.MANUAL,
                latLng: new google.maps.LatLng(parseFloat(tmpObj.data.lng), parseFloat(tmpObj.data.lat)),
                drag: false,
                visible: true,
            });

            map.addListener(tmpObj.point.marker, "click", function(e){
                var stopData = tmpObj.data;
                renderPage(this, stopData);

                var iID = stopData.ID;
                var strID = "#stop_"+iID;
                if($(strID).size() > 0) {
                    $(".item.active").removeClass("active");
                    $(strID).addClass("active");
                }
            });

            if(jsVars.pid && jsVars.pid == tmpObj.data.ID) {
                var stopData = tmpObj.data;
                renderPage(tmpObj.point.marker, stopData);
                markers.push(tmpObj.point.marker);
            }
            markers.push(tmpObj.point.marker);
        }
    });
    var markerCluster = new MarkerClusterer(map.gMap, markers);
    map.setZoom(8);
}

function renderPage(marker, stopData) {
    $stopMainInfoContainer.html(initialMainInfoHtml);
    genInfoBubble(marker, stopData);
    //$stopMainInfoContainer.show();
}

function genInfoBubble(marker, stopData) {
    var $pContent = $(".stopInfoBubble").clone().removeClass("hide");
        //photoUrl = stopData.photoUrl;
    if(stopData.stop)
         $(".name", $pContent).html(stopData.stop+"<br>"+stopData.approch);
     else
        $(".name", $pContent).html(stopData.name);

    map.openInfoBubble(marker, $pContent.html());
    //map.setCenter(marker.position);
}

function addLatLng(latLng) {
    var path = poly.getPath();

    // Because path is an MVCArray, we can simply append a new coordinate
    // and it will automatically appear.
    path.push(latLng);

    // Add a new marker at the new plotted point on the polyline.
    var marker = new google.maps.Marker({
        position: latLng,
        title: '#' + path.getLength(),
        map: map.gMap
    });
}



$(function () {
    $mapCtrl = $("#mapControlBar");
    $map = $("#mapCanvas");
    $stopMainInfoContainer = $("#stopMainInfoContainer");

    initialMainInfoHtml = $("#stopMainInfoContainer").html();
    map = new anythingMap();
    poly = "";
    clockInterval = "";
    timer = "";

    initializeMap($map);

    $(".undo", $mapCtrl).click(function() {
        map.revert();
    });

    $(".reset", $mapCtrl).click(function() {
        map.reset();
    });

    $(".search", $mapCtrl).keypress(function(e) {
            if (e.which == 13) {    // press enter(
                var q = $(this).val();
                map.addrToLatLng(q, {
                    onSuccess: function(results) {
                        if (results.length>=1) {
                            map.panTo(results[0].geometry.location);
                            //alert(strChangeMapCenter+results[0].formatted_address);
                        } else {
                            alert(strNoResult);
                        }
                    },
                    onError: function() {
                        alert(strInternetError);
                    }
                });
            }
        }
    );

    $('.allBus', $mapCtrl).click(function() {
        // draw all bus stop on google map
        $.getJSON( "newAllStopTwd67.json", function( data ) {
            setAllStopData(data);
        });
    });

    function update() {
        var interval = parseInt($('#interval').val());

        if (interval == 0) {
            // draw all bus stop on google map
            var direction = $("input[name=radioDirection]:checked").val();
            $.get( "getBusInfo.php?direction="+direction+"&bus=" + $('.txtBus').val(), function( data ) {
                //try {
                    var json = $.parseJSON(data);
                    setStopData(json);
                    $('#sidebar').show();
                    var d = new Date();
                    var time = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
                    $('#msg').html("Last update time " + time);

                //} catch (e){
                //    alert(data);
                //}
            });
            $('#interval').val(60);
        } else {
            $('#interval').val(interval - 1);
        }
        //var interval = 1;//parseInt($('#interval').val()) > 0 ? parseInt($('#interval').val()) : 0;
        timer = window.setTimeout(update, 1000);
    }

    $('.btnBus',$mapCtrl).click(function() {
        $('#interval').val(1);
        window.clearTimeout(timer);
        update();
    });

    $('.btnBus',$mapCtrl).click();
});
