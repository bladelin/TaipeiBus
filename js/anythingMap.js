/**
 * Anything Map is implemented with google map, please include google map api at first.
 * This is highly dependent of Google Map API. Must include it before including this file.
 *
 * @author: pierce <cyliupp@gmail.com>, Dowlin Yang <dowlin0820@gmail.com>
 * @link http://www.anythingbetter.com.tw/
 * @copyright Copyright &copy; 2010-2011 Anything Inc.
 * @license http://www.anythingbetter.com.tw/license/
 */

/**
 * The Point Type of Anything GPS Data
 *
 *    GPS: the normal gps signal from device
 *    MANUAL: the data which user create manually
 */

var GPOINTTYPE = {
    GPS: 200,
    MANUAL: 100,
    NAVIBYGOOGLE: 110,
    FACEBOOK: 400
};

/**
 * The Map Mode of Anything Map
 *
 *    VIEW: readonly
 *    EDIT: user can edit the map data
 */
var GMAPMODE = {
    VIEW: 0,
    EDIT: 1
};

/**
 * The Map Type of Anything Map
 */
var GMAPTYPE = {
    HYBRID: 0,
    ROADMAP: 1,
    SATELLITE: 2,
    TERRAIN: 3
};

/**
 * The Map Navigation of Anything Map Navigation Service
 */
var GMAPNAVI = {
    NONE: 0,
    CAR: 1,
    BIKE: 2,
    PEDESTRAIN: 3,
    END: 4
};

/**
 * The Map Control of Anything Map
 */
var GMAPCONTROL = {
    NAVIGATIONMOBILE: 0,
    NAVIGATIONSMALL: 1,
    NAVIGATIONNORMAL: 2,
    NAVIGATIONBIG: 3,
    SCALENORMAL: 11,
    SCROLLWHEELNORMAL: 21,
    STREETVIEWNORMAL: 31
};

/**
 * The Map Control Position of Anything Map
 */
var GMAPCONTROLPOS = {
    TOPLEFT: 0,
    TOP: 1,
    TOPRIGHT: 2,
    RIGHT: 3,
    BOTTOMRIGHT: 4,
    BOTTOM: 5,
    BOTTOMLEFT: 6,
    LEFT: 7
};

/**
 * The Map Edit History Type of Anything Map
 */
var GHISTORYTYPE = {
    ADD: 0,
    DELETE: 1,
    UPDATE: 2,
    EMPTY:3
};

/**
 * calculate distance form two latlng point
 *
 * @param long1
 * @param lat1
 * @param long2
 * @param lat2
 * @returns
 */
function distanceFromPoint(long1, lat1, long2, lat2) {
    var R = 6378137; //Earth radius
    lat1 = lat1 * Math.PI / 180.0;
    lat2 = lat2 * Math.PI / 180.0;
    var a = lat1 - lat2;
    var b = (long1 - long2) * Math.PI / 180.0;
    var sa2 = Math.sin(a / 2.0);
    var sb2 = Math.sin(b / 2.0);
    var dist = 2 * R * Math.asin(Math.sqrt(sa2 * sa2 + Math.cos(lat1) * Math.cos(lat2) * sb2 * sb2));
    return dist;
}


/**
 * The class declaration of anything map
 *
 * member var
 *   gMap: the binding google map
 *   gMapMode: the map mode(readonly or can edit)
 *   gMapNavi: to connect point directly or use navigation service
 *   history: the array of edit history
 *   pointsArray: the main array of point data used to operate or edit.
 *   latlngArray: the latlng array used to draw the polyline
 *   polylinesArray: the array used to save the polyline data
 *   dragPointIndex: the selected point index
 *   dragPointStart: a flag to mark if the drag action is start
 *   dragPointStartData: to record the old state of a drag point
 *   directionsService: the navigation service
 *   naviPolyline: use to draw the navigation polyline under navigation option
 *   curLoc: other app can use the current location to mark the map
 *
 * @returns
 */
function anythingMap()
{
    var self = this;

    this.gMap = null;                   //google map object
    this.gMapMode = GMAPMODE.VIEW;      //map mode, editable or just view
    this.gMapNavi = GMAPNAVI.CAR;       //navigation mode, bound with google map
    this.history = new Array();         //revord the operation history
    this.pointsArray = new Array();     //the points Array used to save the gps data info in map
    this.mapPointArray = new Array();   //the mapPoint Array used to save map point data in map
    this.latlngArray = new Array();
    this.polylinesArray = new Array();
    this.dragPointIndex = 0;            //drag point index
    this.dragPointStart = false;
    this.dragPointStartData = null;
    this.prevEndMarker = null;          //to save the marker last operation
    this.naviPolyline = new google.maps.Polyline({
        strokeColor: "#FFA0FF",
        strokeOpacity: 5.0,
        strokeWeight: 3
    });
    this.directionsService = new google.maps.DirectionsService();    //googlre map navigation service
    this.geocoder = new google.maps.Geocoder();
    this.elevationService = new google.maps.ElevationService();    //google map elevation service

    this.reqLimit = 300;
    this.elevationIndex = 0;
    this.elevationHead = 0;
    this.elevationIndexArray = new Array();
    this.events = {};
    this.minLong = 999;
    this.minLat = 999;
    this.maxLong = -999;
    this.maxLat = -999;

    // this instance is initialized in initMap and used by openInfoBubble function so that it is easier to make infoBubble exclusive
    this.infoBubble = null;

    this.markerImages = {
        start: new google.maps.MarkerImage(
            jsVars.rootRsUrl + '/images/mapMarkers/markerStart.png',
            new google.maps.Size(40,40),
            new google.maps.Point(0,0),
            new google.maps.Point(20,40)
        ),
        end: new google.maps.MarkerImage(
            jsVars.rootRsUrl + '/images/mapMarkers/markerEnd.png',
            new google.maps.Size(40,40),
            new google.maps.Point(0,0),
            new google.maps.Point(20,40)
        ),
        middle: new google.maps.MarkerImage(
            jsVars.rootRsUrl + '/images/mapMarkers/markerMiddle.png',
            new google.maps.Size(20,20),
            new google.maps.Point(0,0),
            new google.maps.Point(10,10)
        ),
        poi: new google.maps.MarkerImage(
            jsVars.rootRsUrl + '/images/mapMarkers/markerPoi.png',
            new google.maps.Size(40,40),
            new google.maps.Point(0,0),
            new google.maps.Point(20,40)
        ),
        bus: new google.maps.MarkerImage(
            jsVars.rootRsUrl + '/images/mapMarkers/bus.png',
            new google.maps.Size(40,40),
            new google.maps.Point(0,0),
            new google.maps.Point(20,40)
        )
    };

    this.curLoc = null; //used to locate the marker which interaction with chart

    /**
     * To initialize the google map
     *
     * @param container the div id used to contain the map
     */
    anythingMap.prototype.initMap = function($container, events){
        var self = this,
            centerLatLng = new google.maps.LatLng(25.0609, 121.587453),
            myMapOptions = {
                zoom: 9,
                center: centerLatLng,
                mapTypeControl: false,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                navigationControl: false,
                scrollwheel: true,
                scaleControl: false,
                streetViewControl: false
            };

        if($container) {
            self.gMap = new google.maps.Map($container.get(0), myMapOptions);
            if (events) {
                self.events = events;
            }
            self.addListener(self.gMap, "click", function(e){
                if ($.isFunction(self.events.onMapClick)) {
                    self.events.onMapClick.call(self, e);
                }
            });
            self.addListener(self.gMap, "rightclick", function(e){
                if ($.isFunction(self.events.onMapRightClick)) {
                    self.events.onMapRightClick.call(self, e);
                }
            });
        }
    };

    /**
     * To set gps data to pointsArray
     */
    anythingMap.prototype.setGpsData = function(gpsDataArray){
        var self = this;

        $.each(gpsDataArray, function(idx, gpsData) {
            //[Robin 20121217 map fitBoundry
            if ( gpsData.x < self.minLong ) self.minLong = gpsData.x;
            if ( gpsData.x > self.maxLong ) self.maxLong = gpsData.x;
            if ( gpsData.y < self.minLat ) self.minLat = gpsData.y;
            if ( gpsData.y > self.maxLat ) self.maxLat = gpsData.y;

            var point = self.newPointElement({
                    latLng: new google.maps.LatLng(gpsData.y, gpsData.x)
                });
            self.pointsArray[idx] = $.extend(point, gpsData);
        });

        self.updateLine();
    };

    /**
     * To set mapPoint data to mapPointArray
     */
    anythingMap.prototype.setMapPoint = function(mapPointArray){
        var self = this;

        if(mapPointArray == null)
            return;

        $.each(mapPointArray, function(idx, poi) {
            //[Robin 20121217 map fitBoundry
            if ( poi.x < self.minLong ) self.minLong = poi.x;
            if ( poi.x > self.maxLong ) self.maxLong = poi.x;
            if ( poi.y < self.minLat ) self.minLat = poi.y;
            if ( poi.y > self.maxLat ) self.maxLat = poi.y;

            var point = self.newPointElement({
                    type: GPOINTTYPE.MANUAL,
                    latLng: new google.maps.LatLng(poi.y, poi.x),
                    visible: true,
                    markerImage: self.createMarkerImage(idx+1),
                    zIndex: 10
                });
            self.mapPointArray[idx] = $.extend(point, poi);
        });
    };

    /**
     * To update mapPoint data to mapPointArray
     */
    anythingMap.prototype.updateMapPoint = function(){
        var self = this;
        $.each(self.mapPointArray, function(idx, poi) {
            poi.idx = idx;
            poi.marker.setIcon(self.createMarkerImage(idx+1));
        });
    };

    /**
     * To set map fitbounds
     */
    anythingMap.prototype.setMapFitBounds = function(fitBounds){
        var self = this;

        if(typeof(fitBounds) == "undefined") {
            if(self.pointsArray.length > 0 || self.mapPointArray.length >0)
            fitBounds = new google.maps.LatLngBounds(
                     new google.maps.LatLng( self.minLat, self.minLong ),
                     new google.maps.LatLng( self.maxLat, self.maxLong ));
        }

        if(typeof(fitBounds) == "object") {
            self.gMap.fitBounds(fitBounds);
            self.panTo(fitBounds.getCenter());
        }
        //[Pierce 20120520] To maintain the min zoom scale
        if(self.gMap.getZoom() > 16)
            self.gMap.setZoom(16);
    };

    /**
     * To redraw the polyline based on pointsArray data
     *
     * note:
     *   (1) Because google map can not remove the polyline automaticly, we need to save the polyline and
     *       hide them by ourselves. It's why we need the 'polylinesArray' var.
     */
    anythingMap.prototype.updateLine = function(){
        var self = this,
            polylineHead = 0,
            polylineIndex = 0,
            latlngArray = new Array();

        latlngArray[polylineHead] = new Array();

        if(self.pointsArray.length>0) {
            //set the start point marker
            if(self.pointsArray[0].marker != null) {
                self.pointsArray[0].marker.setIcon(self.markerImages.start);
                self.pointsArray[0].marker.setVisible(true);
            }

            if(self.pointsArray.length>1) {
                //set the end point marker
                if(self.pointsArray[0].marker != null) {
                    self.pointsArray[self.pointsArray.length-1].marker.setIcon(self.markerImages.end);
                    self.pointsArray[self.pointsArray.length-1].marker.setVisible(true);

                    //reset the marker
                    if(self.pointsArray[self.pointsArray.length-1].marker != self.prevEndMarker) {
                        if(self.prevEndMarker != null) {
                            self.prevEndMarker.setIcon(self.markerImages.middle);
                        }

                        self.prevEndMarker = self.pointsArray[self.pointsArray.length-1].marker;
                    }
                }
            }
        }

        //todo, by the point type to seperate the polyline
        if(self.gMapMode == GMAPMODE.EDIT)
        {
            for(var index=0;index<self.pointsArray.length;index++)
            {
                if(self.pointsArray[index].marker != null)
                {
                    latlngArray[polylineHead][polylineIndex] = self.pointsArray[index].marker.position;
                    polylineIndex++;
                }
            }
        }
        else if(self.gMapMode == GMAPMODE.VIEW)
        {
            for(var index=0;index<self.pointsArray.length;index++)
            {
                if(self.pointsArray[index].marker != null)
                {
                    latlngArray[polylineHead][polylineIndex] = self.pointsArray[index].marker.position;
                    polylineIndex++;
                }
            }
        }

        for(var index=0;index<latlngArray.length;index++)
        {
            if(self.polylinesArray[index] == null)
            {
                self.polylinesArray[index] = new google.maps.Polyline({
                    path: latlngArray[index],
                    strokeColor: "#cc0000",
                    strokeOpacity: 1.0,
                    strokeWeight: 4,
                    map: self.gMap
                });
            }
            else
                self.polylinesArray[index].setPath(latlngArray[index]);
        }

        self.updateAccumulatedDisatnce();
        if ($.isFunction(self.events.onDrawing)) {
            self.events.onDrawing.call(self);
        }
        this.updateMapElevation();
    };

    anythingMap.prototype.updateMapElevation = function() {
        var self = this;

        self.elevationIndex = 0;
        self.elevationHead = 0;
        self.elevationIndexArray = new Array();

        for(var index=0; index<self.pointsArray.length ;index++){
            if(self.pointsArray[index].type != GPOINTTYPE.GPS
                && self.pointsArray[index].elevation == 0){

                self.elevationIndexArray[self.elevationIndex] = index;
                self.elevationIndex++;
            }
        }

        if(self.elevationIndexArray.length > 0) {
            var latlngArray = new Array();

            for(var i=0; i<self.reqLimit && (self.elevationHead+i)<self.elevationIndexArray.length;i++) {
                var y = self.pointsArray[self.elevationIndexArray[i]].marker.position.lat();
                var x = self.pointsArray[self.elevationIndexArray[i]].marker.position.lng();
                latlngArray[i] = new google.maps.LatLng(y, x);
            }

            var request = {
                locations: latlngArray
            };

            self.elevationService.getElevationForLocations(request, function(elevationArray, status) {
                if(status == google.maps.ElevationStatus.OK) {
                    for(var i=0;i<elevationArray.length;i++) {
                        self.pointsArray[self.elevationIndexArray[self.elevationHead]].elevation = elevationArray[i].elevation;
                        self.elevationHead++;
                    }
                }
                /**
                 * Previously the elevationService callback function is a global function, and we call it recursively to
                 * to all elevation data back. But, right now we have to write it as an inline function and we can't call it
                 * recursively. Comment out the following lines and think a better solution later.
                if(self.elevationHead < self.elevationIndexArray.length) {
                    var latlngArray = new Array();

                    for(var i=0; i<self.reqLimit && (self.elevationHead+i)<self.elevationIndexArray.length;i++) {
                        var y = self.pointsArray[self.elevationIndexArray[self.elevationHead+i]].marker.position.lat();
                        var x = self.pointsArray[self.elevationIndexArray[self.elevationHead+i]].marker.position.lng();
                        latlngArray[i] = new google.maps.LatLng(y, x);
                    }

                    var request = {
                        locations: latlngArray
                    };

                    self.elevationService.getElevationForLocations(request, self.elevationServiceCallback);
                }
                 */
            });
        }
    }

    /**
     * Set the map mode
     *
     * @param mapMode the mapMode want to set
     */
    anythingMap.prototype.setMapMode = function(mapMode){
        var self = this;

        if(mapMode == GMAPMODE.EDIT) {
            self.gMapMode = GMAPMODE.EDIT;
            self.gMap.setOptions({ draggableCursor: "crosshair" });
        }
        else {
            self.gMapMode = GMAPMODE.VIEW;
            self.gMap.setOptions({ draggableCursor: "move" });
        }
    };

    /**
     * Set the map type
     *
     * @param mapType the map type want to set
     */
    anythingMap.prototype.setMapType = function(mapType){
        var self = this;

        if(typeof(mapType) == 'number' && mapType < GMAPNAVI.END) {
            self.gMap.gMapNavi = mapType;
        }
    };

    anythingMap.prototype.setMapNavi = function(naviType){
        var self = this;

        if(typeof(naviType) == 'number')
        {
            if(mapType == GMAPTYPE.HYBRID)
                self.gMap.setMapTypeId(google.maps.MapTypeId.HYBRID);
            else if(mapType == GMAPTYPE.ROADMAP)
                self.gMap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
            else if(mapType == GMAPTYPE.SATELLITE)
                self.gMap.setMapTypeId(google.maps.MapTypeId.SATELLITE);
            else if(mapType == GMAPTYPE.TERRAIN)
                self.gMap.setMapTypeId(google.maps.MapTypeId.TERRAIN);
            else
                self.gMap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        }
    };

    /**
     * To add control UI
     *
     * future work:
     *   (1) can add customized UI
     *
     * @param mapControl the map control want to add
     * @param controlPos the control position
     */
    anythingMap.prototype.addControl = function(mapControl, controlPos){
        var self = this,
            iPos = google.maps.ControlPosition.TOP_LEFT,
            iControl = 0;

        if(typeof(controlPos) == 'number')
        {
            if(controlPos == GMAPCONTROLPOS.TOPLEFT)
                iPos = google.maps.ControlPosition.TOP_LEFT;
            else if(controlPos == GMAPCONTROLPOS.TOP)
                iPos = google.maps.ControlPosition.TOP;
            else if(controlPos == GMAPCONTROLPOS.TOPRIGHT)
                iPos = google.maps.ControlPosition.TOP_RIGHT;
            else if(controlPos == GMAPCONTROLPOS.RIGHT)
                iPos = google.maps.ControlPosition.RIGHT;
            else if(controlPos == GMAPCONTROLPOS.BOTTOMRIGHT)
                iPos = google.maps.ControlPosition.BOTTOM_RIGHT;
            else if(controlPos == GMAPCONTROLPOS.BOTTOM)
                iPos = google.maps.ControlPosition.BOTTOM;
            else if(controlPos == GMAPCONTROLPOS.BOTTOMLEFT)
                iPos = google.maps.ControlPosition.BOTTOM_LEFT;
            else if(controlPos == GMAPCONTROLPOS.LEFT)
                iPos = google.maps.ControlPosition.LEFT;
            else
                iPos = google.maps.ControlPosition.TOP_LEFT;
        }

        if(typeof(mapControl) == 'number')
        {
            if(mapControl == GMAPCONTROL.NAVIGATIONMOBILE
                || mapControl == GMAPCONTROL.NAVIGATIONSMALL
                || mapControl == GMAPCONTROL.NAVIGATIONNORMAL
                || mapControl == GMAPCONTROL.NAVIGATIONBIG)
            {
                if(mapControl == GMAPCONTROL.NAVIGATIONMOBILE)
                    iControl = google.maps.NavigationControlStyle.ANDROID;
                else if(mapControl == GMAPCONTROL.NAVIGATIONSMALL)
                        iControl = google.maps.NavigationControlStyle.SMALL;
                else if(mapControl == GMAPCONTROL.NAVIGATIONNORMAL)
                    iControl = google.maps.NavigationControlStyle.DEFAULT;
                else if(mapControl == GMAPCONTROL.NAVIGATIONBIG)
                    iControl = google.maps.NavigationControlStyle.ZOOM_PAN;

                if(controlPos == null)
                    iPos = GMAPCONTROLPOS.TOPLEFT;

                self.gMap.setOptions({
                    navigationControl: true,
                    navigationControlOptions: {
                        style: iControl,
                        position: iPos
                    }
                });
            }
            else if(mapControl == GMAPCONTROL.SCALENORMAL)
            {
                iControl = google.maps.ScaleControlStyle.DEFAULT;

                if(controlPos == null)
                    iPos = GMAPCONTROLPOS.BOTTOM_LEFT;

                self.gMap.setOptions({
                    scaleControl: true,
                    scaleControlOptions: {
                        style: iControl,
                        position: iPos
                    }
                });
            }
            else if(mapControl == GMAPCONTROL.SCROLLWHEELNORMAL)
            {
                self.gMap.setOptions({
                    scrollwheel: true
                });
            }
            else if(mapControl == GMAPCONTROL.STREETVIEWNORMAL)
            {
                self.gMap.setOptions({
                    streetViewControl: true
                });
            }
        }
        else if (mapControl.size()>0 && mapControl.is('div')) {
            var controlDiv = mapControl.get(0);

            controlDiv.index = 1;
            self.gMap.controls[iPos].push(controlDiv);
        }
    };

    /**
     * Find the point by the marker
     *
     * @param marker the marker pointer want to select
     * @returns {Number} the index of selected point
     */
    anythingMap.prototype.findPointIndexByMarker = function(marker){
        var self = this;

        for(var index=0;index<self.pointsArray.length;index++)
        {
            if(self.pointsArray[index].marker == marker)
                return index;
        }

        return;
    };

    /**
     * Find the point by the position
     *
     * @param x
     * @param y
     * @returns {Number} the index of selected point
     */
    anythingMap.prototype.findPointIndexByLatLng = function(x, y){
        var self = this;

        for(var index=0;index<self.pointsArray.length;index++)
        {
            if(self.pointsArray[index].marker.position.lat() == y
                && self.pointsArray[index].marker.position.lng() == x)
                return index;
        }

        return;
    };

    /**
     * To add the edit record
     *
     * @param type the edit type(add, delete, or uodate)
     * @param index the operating point index
     * @param data the operating point data
     * @param end the end point of one step
     */
    anythingMap.prototype.addHistory = function(type, index, elementData, end){
        var self = this,
            element = new Object();
        element.type = type;
        element.index = index;
        element.data = self.newPointElement({
            type: elementData.type,
            timestamp: elementData.timestamp,
            speed: elementData.speed,
            elevation: elementData.elevation,
            accumulatedDistance: elementData.accumulatedDistance,
            accumulatedDuration: elementData.accumulatedDuration,
            latLng: elementData.marker.position,
            drag: elementData.drag,
            events: elementData.events,
            visible: elementData.visible,
            markerImage: elementData.markerImage
        });

        element.end = end;
        self.history.push(element);
    };

    /**
     * To set the current location marker to map
     * @param x
     * @param y
     */
    anythingMap.prototype.setCurLoc = function(x, y){
        var self = this,
            index = this.findPointIndexByLatLng(x, y);
        if (self.curLoc !== null)
            self.removeCurLoc();
        self.curLoc = new google.maps.Marker({
            position: new google.maps.LatLng(y, x),
            map: self.gMap,
            icon: self.markerImages.middle
        });
    };

    /**
     * To hide the current location marker to map
     * @param x
     * @param y
     */
    anythingMap.prototype.removeCurLoc = function(x, y){
        this.curLoc.setMap(null);
    };

    /**
     * To new a point element
     * @param options the options used to create element
     * @returns {___element4} the new point element
     */
    anythingMap.prototype.newPointElement = function(options){
        var self = this,
            element = new Object(),
            setting = $.extend({
                type: GPOINTTYPE.MANUAL,
                timestamp: 0,
                speed: 0,
                elevation: 0,
                accumulatedDistance: 0,
                accumulatedDuration: 0,
                latLng: null,
                drag: false,
                events: null,
                zIndex: 0,
                visible: false,
                markerImage: null
            }, options||{});

        element.type = setting.type;
        element.timestamp = setting.timestamp;
        element.speed = setting.speed;
        element.elevation = setting.elevation;
        element.accumulatedDistance = setting.accumulatedDistance;
        element.accumulatedDuration = setting.accumulatedDuration;

        element.marker = new google.maps.Marker({
            position: setting.latLng,
            icon: setting.markerImage,
            map: self.gMap
        });
        element.marker.setVisible(setting.visible);
        element.marker.setZIndex(setting.zIndex);
        element.marker.setDraggable(setting.drag);

        if($.isArray(setting.events)) {
            for(var i=0;i<setting.events.length;i++) {
                if(setting.events[i] == 'markerDrag') {
                    self.addListener(element.marker, 'dragend', function(event){
                        markerDragEnd(self);
                    });
                    self.addListener(element.marker, 'dragstart', function(event){
                        markerDragStart(self, this);
                    });
                    self.addListener(element.marker, 'drag', function(event){
                        markerDrag(self);
                    });
                }
                /*else if(setting.events[i] == 'markerRightClick') {
                    self.addListener(element.marker, 'rightclick', function(event){
                        markerRightClick(self.gMap, this);
                    });
                }*/
            }
        }

        return element;
    };

    /**
     * To update the pointsArray member
     * @param options the options used to update
     * @param index the index of the point want to update
     */
    anythingMap.prototype.changePointElement = function(options, index){
        var self = this,
            setting = options||{};

        if(typeof(setting.type) == 'number')
            self.pointsArray[index].type = setting.type;

        if(typeof(setting.latLng) == 'object')
            self.pointsArray[index].marker.position = setting.latLng;

        if(typeof(setting.drag) == 'boolean')
            self.pointsArray[index].marker.setDraggable(setting.drag);

        if(typeof(setting.visible) == 'boolean')
            self.pointsArray[index].marker.setVisible(setting.visible);

        if(typeof(setting.markerImage) == 'object')
            self.pointsArray[index].marker.icon = setting.markerImage;

        self.pointsArray[index].marker.setMap(self.gMap);

        if($.isArray(setting.events)) {
            for(var i=0;i<setting.events.length;i++) {
                if(setting.events[i] == 'markerDrag') {
                    google.maps.event.addListener(self.pointsArray[index].marker, 'dragend', function(event){
                        markerDragEnd(self);
                    });
                    google.maps.event.addListener(self.pointsArray[index].marker, 'dragstart', function(event){
                        markerDragStart(self, this);
                    });
                    google.maps.event.addListener(self.pointsArray[index].marker, 'drag', function(event){
                        markerDrag(self);
                    });
                }
                /*else if(setting.events[i] == 'markerRightClick') {
                    google.maps.event.addListener(self.pointsArray[index].marker, 'rightclick', function(event){
                        markerRightClick(self.gMap, this);
                    });
                }*/
            }
        }
    };

    anythingMap.prototype.deletePointElement = function(element){
        element.marker.setMap(null);
    };

    /**
     * calculate the total distance form points array
     *
     * points must be array. every element must be object.
     *
     * @param points points array
     * */
    anythingMap.prototype.distanceFromPointsArray = function() {
        var self = this,
            points = self.pointsArray,
            totalDistance = 0;
        for(var i=0; i<points.length-1;i++) {

            if(points[i].marker.position && points[i+1].marker.position)
                totalDistance += distanceFromPoint(points[i].marker.position.lng(), points[i].marker.position.lat(), points[i+1].marker.position.lng(), points[i+1].marker.position.lat());
        }

        return totalDistance;
    }

    /**
     * Update points accumulated distance
     *
     * @param index the start index of update progress
     */
    anythingMap.prototype.updateAccumulatedDisatnce = function(index) {
        var self = this;

        if(!index)
            index = 0;

        if(!(self.pointsArray.length > 0))
            return false;

        var points = self.pointsArray;
        points[0].accumulatedDistance = 0;
        for(var i=1; i<points.length;i++) {
            if(points[i-1].marker.position && points[i].marker.position)
                points[i].accumulatedDistance = points[i-1].accumulatedDistance + distanceFromPoint(points[i-1].marker.position.lng(), points[i-1].marker.position.lat(), points[i].marker.position.lng(), points[i].marker.position.lat());
        }
        return self.pointsArray[self.pointsArray.length-1].accumulatedDistance;
    }

    /**
     * To revert the edit action
     */
    anythingMap.prototype.revert = function(){
        var self = this,
            element;

        while(true) {
            element = self.history.pop();

            if(typeof(element) != 'object')
                break;

            if(element.type == GHISTORYTYPE.ADD) {
                if(element.index >= 0)
                {
                    self.pointsArray[element.index].marker.setMap(null);
                    self.pointsArray.splice(element.index, 1);
                }
            }
            else if(element.type == GHISTORYTYPE.DELETE) {
                if(element.index >= 0)
                {
                    self.pointsArray.splice(element.index, 0, element.data);
                    var options = {
                        drag: true,
                        events: ['markerDrag'],
                        visible: true,
                        markerImage: self.markerImages.middle
                    };
                    self.changePointElement(options,element.index);
                }
            }
            else if(element.type == GHISTORYTYPE.UPDATE) {
                if(element.index >= 0) {
                    self.pointsArray[element.index].marker.setMap(null);
                    self.pointsArray.splice(element.index, 1, element.data);
                    self.pointsArray[element.index].marker.setMap(self.gMap);
                }
            }

            if(element.end == true)
            {
                this.updateLine();
                break;
            }
        }
    };

    anythingMap.prototype.reset = function(){
        var self = this;

        for(var i=0;i<self.pointsArray.length;i++) {
            if(self.pointsArray[i].marker != null)
                self.pointsArray[i].marker.setMap(null);
        }

        self.pointsArray.length = 0;
        self.history.length = 0;
        self.updateLine();
    };


    /**
     * map click event handler
     *
     * To create a new marker in edit mode
     *
     * @param latLng the position of click event
     */
    anythingMap.prototype.drawLine = function(latLng) {
        var self = this;

        if(self.gMapMode == GMAPMODE.EDIT) {
            if(self.pointsArray.length == 0 || self.gMapNavi == GMAPNAVI.NONE) {
                var index = self.pointsArray.length;
                self.pointsArray[index] = self.newPointElement({
                    type: GPOINTTYPE.MANUAL,
                    latLng: latLng,
                    drag: true,
                    events: ['markerDrag'],
                    visible: true,
                    markerImage: self.markerImages.middle
                });

                self.addHistory(GHISTORYTYPE.ADD, index, self.pointsArray[index], true);
                self.updateLine();
            }
            else if(self.gMapNavi == GMAPNAVI.CAR) {
                var index = self.pointsArray.length;
                self.pointsArray[index] = self.newPointElement({
                    type: GPOINTTYPE.MANUAL,
                    latLng: latLng,
                    drag: true,
                    events: ['markerDrag'],
                    visible: true,
                    markerImage: self.markerImages.middle
                });
                self.addHistory(GHISTORYTYPE.ADD, index, self.pointsArray[index], true);

                var start = self.pointsArray[self.pointsArray.length-2].marker.position;
                var end = self.pointsArray[self.pointsArray.length-1].marker.position;

                var request = {
                    origin: start,
                    destination: end,
                    travelMode: google.maps.DirectionsTravelMode.DRIVING
                };

                self.directionsService.route(request, function(result, status) {

                    if (status == google.maps.DirectionsStatus.OK) {
                        var replaceIndex = self.pointsArray.length-1;

                        for(var routeIndex=0;routeIndex<result.routes.length;routeIndex++) {
                            for(var legIndex=0;legIndex<result.routes[routeIndex].legs.length;legIndex++) {
                                for(var stepIndex=0;stepIndex<result.routes[routeIndex].legs[legIndex].steps.length;stepIndex++) {
                                    for(var pathIndex=0;pathIndex<result.routes[routeIndex].legs[legIndex].steps[stepIndex].path.length;pathIndex++) {
                                        var options = new Object();
                                        options.latLng = result.routes[routeIndex].legs[legIndex].steps[stepIndex].path[pathIndex];

                                        if(legIndex != result.routes[routeIndex].legs.length-1
                                            && stepIndex == result.routes[routeIndex].legs[legIndex].steps.length-1
                                            && pathIndex == result.routes[routeIndex].legs[legIndex].steps[stepIndex].path.length-1)
                                        {
                                            options.drag = true;
                                            options.events = ['markerDrag'];
                                            options.visible = true;
                                            options.markerImage = self.markerImages.middle;
                                        }

                                        var element = self.newPointElement(options);

                                        self.pointsArray.splice(replaceIndex, 0, element);

                                        self.addHistory(GHISTORYTYPE.ADD, replaceIndex, element, false);

                                        replaceIndex++;
                                    }
                                }
                            }
                        }

                        self.changePointElement({
                            drag: true,
                            events: ['markerDrag']
                        }, 0);

                        self.changePointElement({
                            drag: true,
                            events: ['markerDrag']
                        }, self.pointsArray.length-1);

                        self.updateLine();
                    }
                });
            }
        }
    }

    /**
     * Translate an andress to it latlng.
     * This function is async, remember to register the callback function.
     *
     * about the Geocoder {@see http://code.google.com/intl/zh-TW/apis/maps/documentation/javascript/services.html#GeocodingRequests}
     * about the GeocoderResults {@see http://code.google.com/intl/zh-TW/apis/maps/documentation/javascript/services.html#GeocodingResponses}
     */
    anythingMap.prototype.addrToLatLng = function(q, events) {
        var self = this;

        self.geocoder.geocode(
            {address: q},
            function(results, status) {
                if (status == google.maps.GeocoderStatus.OK || status == google.maps.GeocoderStatus.ZERO_RESULTS) {
                    if ($.isFunction(events.onSuccess)) {
                        events.onSuccess.apply(self, [results]);
                    }
                }
                else {
                    if ($.isFunction(events.onError)) {
                        events.onError.apply(self);
                    }
                }
            }
        );
    };

    anythingMap.prototype.latLngToAddr = function(q, events) {
        var self = this;

        self.geocoder.geocode(
            {latlng: q},
            function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if ($.isFunction(events.onSuccess)) {
                        events.onSuccess.apply(self, [results]);
                    }
                }
                else {
                    if ($.isFunction(events.onError)) {
                        events.onError.apply(self);
                    }
                }
            }
        );
    };

    anythingMap.prototype.panTo = function(p) {
        var self = this;

        if (p instanceof google.maps.LatLng) { // argument is a LatLng object
            self.gMap.panTo(p);
        }
    };

    anythingMap.prototype.setCenter = function(p) {
        var self = this;

        if (p instanceof google.maps.LatLng) { // argument is a LatLng object
            self.gMap.setCenter(p);
        }
    }

    anythingMap.prototype.setZoom = function(l) {
        var self = this;

        if (typeof(l) == "number") { // argument is a LatLng object
            self.gMap.setZoom(l);
        }
    };

    /**
     * For adding event to a specific element on the map
     */
    anythingMap.prototype.addListener = function(obj, e, func) {
        google.maps.event.addListener(obj, e, func);
    };

    /**
     * Initialize a infoBubble instance, and bind it with the given marker and listen to the given events.
     */
    anythingMap.prototype.openInfoBubble = function(marker, contentHtml, events) {
        var self = this,
            contentHtml = '<div id="infoBubble">' + contentHtml + '</div>',
            ibContainer = $(contentHtml)[0];

        if (self.infoBubble!=null) {    // has been initialized
            self.infoBubble.setContent(ibContainer);
        } else {
            self.infoBubble = new google.maps.InfoWindow({
                content: ibContainer
            });
            google.maps.event.addListener(self.infoBubble,'closeclick',function() {
                self.infoBubble = null;
            });
        }

        if (events && $.isFunction(events.onDomReady)) {
            google.maps.event.addListener(self.infoBubble, "domready", function() {
                var $ib = $(ibContainer);
                events.onDomReady.apply(self, [$ib]);
            });
        }
        self.infoBubble.open(self.gMap, marker);
        self.panTo(marker);
    };

    /**
     * Update html content infoBubble, and update content merely. That means:
     *  - You need to make sure infoBubble has been initialized.
     *  - Location (marker) of the infoBubble won't change.
     * So, please remember to call openInfoBubble and associate it with a proper marker before using this function.
     */
    anythingMap.prototype.updateInfoBubble = function(contentHtml) {
        if (self.infoBubble==null)
            return false;
        self.infoBubble.setContent('<div id="infoBubble">' + contentHtml + '</div>');
    }

    anythingMap.prototype.closeInfoBubble = function() {
        var self = this;

        if (self.infoBubble!=null)
            self.infoBubble.close();
    };

    /**
     * Create a Google Map MarkerImage object.
     * When the given input is an integer, return a numbered marker image;
     * when the input is a string (Start|End|Middle|Poi), return representing marker accordingly.
     */
    anythingMap.prototype.createMarkerImage = function(markerIdx) {
        if ( !_.isNaN(markerIdx) && _.isNumber(markerIdx)) {
            var markerIdx = parseInt(markerIdx);

            if(markerIdx >= 1000)
                markerIdx = 999;
            else if(markerIdx < 1)
                markerIdx = 1;
        } else {
            markerIdx = markerIdx.charAt(0).toUpperCase() + markerIdx.substring(1);   // capitalize the string
        }

        return new google.maps.MarkerImage(
                jsVars.rootRsUrl + '/images/mapMarkers/marker' + markerIdx + '.png',
                new google.maps.Size(40,40),
                new google.maps.Point(0,0),
                new google.maps.Point(20,40)
            );
    }
}

/*
 * @see: https://developers.google.com/maps/documentation/javascript/reference#ElevationService
 * This function is a callback function for Google map API, and it can take only two parameters and must be public function it seems.
 * However, the function needs to access anythingMap class variable (such as pointsArray).
 * Need to rewrite this function.
//TODO: can handle lots of cases, but still has limit.
anythingMap.prototype.elevationServiceCallback = function(elevationArray, status) {
    var self = this;

    if(status == google.maps.ElevationStatus.OK) {
        for(var i=0;i<elevationArray.length;i++) {
            self.pointsArray[self.elevationIndexArray[self.elevationHead]].elevation = elevationArray[i].elevation;
            self.elevationHead++;
        }
    }

    if(self.elevationHead < self.elevationIndexArray.length) {
        var latlngArray = new Array();

        for(var i=0; i<self.reqLimit && (self.elevationHead+i)<self.elevationIndexArray.length;i++) {
            var y = self.pointsArray[self.elevationIndexArray[self.elevationHead+i]].marker.position.lat();
            var x = self.pointsArray[self.elevationIndexArray[self.elevationHead+i]].marker.position.lng();
            latlngArray[i] = new google.maps.LatLng(y, x);
        }

        var request = {
            locations: latlngArray
        };

        self.elevationService.getElevationForLocations(request, self.elevationServiceCallback);
    }
}
*/


/**
 * marker right click event handler
 *
 * to delete the selected marker
 *
 * @param marker the selected marker
function markerRightClick(map, marker)
{
    if(map)
    {
        var index = map.findPointIndexByMarker(marker);
        map.addHistory(GHISTORYTYPE.DELETE, index, map.pointsArray[index], true);
        map.pointsArray[index].marker.setMap(null);
        map.pointsArray.splice(index, 1);
        map.updateLine();
    }
}
*/

/**
 * marker drag end event handler
 *
 * (1) to update polyline without navigation service
 * (2) to update point array with navigation service
 */
function markerDragEnd(map)
{
    if(map)
    {
        if(map.gMapNavi == GMAPNAVI.NONE) {
            map.addHistory(GHISTORYTYPE.DELETE, map.dragPointIndex, map.dragPointStartData, true);
            map.addHistory(GHISTORYTYPE.ADD, map.dragPointIndex, map.pointsArray[map.dragPointIndex], false);
            map.updateLine();

        }
        else if(map.dragPointStart)
        {
            map.naviPolyline.setMap(null);

            var start = (map.dragPointIndex == 0) ? map.pointsArray[map.dragPointIndex].marker.position : map.pointsArray[map.dragPointIndex-1].marker.position;
            var end = (map.dragPointIndex == map.pointsArray.length-1) ? map.pointsArray[map.dragPointIndex].marker.position : map.pointsArray[map.dragPointIndex+1].marker.position;
            var among = (map.dragPointIndex != 0) && (map.dragPointIndex != map.pointsArray.length-1) ? [{location:map.pointsArray[map.dragPointIndex].marker.position,stopover:true}]: null;

            var request = {
                origin: start,
                destination: end,
                waypoints: among,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };

            map.directionsService.route(request, function(result, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    var replaceIndex = map.dragPointIndex;

                    map.addHistory(GHISTORYTYPE.DELETE, replaceIndex, map.dragPointStartData, true);
                    map.pointsArray[replaceIndex].marker.setMap(null);
                    map.pointsArray.splice(replaceIndex, 1);

                    for(var routeIndex=0;routeIndex<result.routes.length;routeIndex++)
                    {
                        for(var legIndex=0;legIndex<result.routes[routeIndex].legs.length;legIndex++)
                        {
                            for(var stepIndex=0;stepIndex<result.routes[routeIndex].legs[legIndex].steps.length;stepIndex++)
                            {
                                for(var pathIndex=0;pathIndex<result.routes[routeIndex].legs[legIndex].steps[stepIndex].path.length;pathIndex++)
                                {
                                    var options = new Object();
                                    options.latLng = result.routes[routeIndex].legs[legIndex].steps[stepIndex].path[pathIndex];

                                    //among points
                                    if(legIndex != result.routes[routeIndex].legs.length-1
                                        && stepIndex == result.routes[routeIndex].legs[legIndex].steps.length-1
                                        && pathIndex == result.routes[routeIndex].legs[legIndex].steps[stepIndex].path.length-1)
                                    {
                                        options.drag = true;
                                        options.events = ['markerDrag'];
                                        options.visible = true;
                                        options.markerImage = self.markerImages.middle;
                                    }

                                    var element = map.newPointElement(options);

                                    map.pointsArray.splice(replaceIndex, 0, element);

                                    map.addHistory(GHISTORYTYPE.ADD, replaceIndex, element, false);

                                    replaceIndex++;
                                }
                            }
                        }
                    }

                    map.changePointElement({
                        drag: true,
                        events: ['markerDrag']
                    }, 0);

                    map.changePointElement({
                        drag: true,
                        events: ['markerDrag']
                    }, map.pointsArray.length-1);

                    map.updateLine();
                }
            });

            map.dragPointStart = false;
        }
    }
}

/**
 * marker drag event handler
 *
 * (1) to use navigation service and draw the line under navigation option
 * (2) to draw the line directly under no navigation option
 *
 * note:
 *   (1) Drag event may be triggered after dragend event in one drag action
 */
function markerDrag(map)
{
    if(map)
    {
        if(map.gMapNavi == GMAPNAVI.NONE)
            map.updateLine();
        else if(map.pointsArray.length > 1)
        {
            var start = (map.dragPointIndex == 0) ? map.pointsArray[map.dragPointIndex].marker.position : map.pointsArray[map.dragPointIndex-1].marker.position;
            var end = (map.dragPointIndex == map.pointsArray.length-1) ? map.pointsArray[map.dragPointIndex].marker.position : map.pointsArray[map.dragPointIndex+1].marker.position;
            var among = (map.dragPointIndex != 0) && (map.dragPointIndex != map.pointsArray.length-1) ? [{location:map.pointsArray[map.dragPointIndex].marker.position,stopover:true}]: null;

            var request = {
                origin: start,
                destination: end,
                waypoints: among,
                travelMode: google.maps.DirectionsTravelMode.DRIVING
            };

            map.directionsService.route(request, function(result, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    map.naviPolyline.setPath(result.routes[0].overview_path);
                }
            });
        }
    }
}

/**
 * marker start event handler
 *
 * to initial lots of parameter to complete drag action
 *
 * note:
 *   (1) Dragstart event may be triggered more than once in one drag action
 *
 * @param marker the selected marker
 */
function markerDragStart(map, marker)
{
    if(map)
    {
        map.naviPolyline.setMap(map.gMap);
        map.dragPointIndex = map.findPointIndexByMarker(marker);
        map.dragPointStart = true;

        map.dragPointStartData = map.newPointElement({
                latLng: map.pointsArray[map.dragPointIndex].marker.position,
                type: map.pointsArray[map.dragPointIndex].type,
                timestamp: map.pointsArray[map.dragPointIndex].timestamp,
                speed: map.pointsArray[map.dragPointIndex].speed,
                elevation: map.pointsArray[map.dragPointIndex].elevation,
                accumulatedDistance: map.pointsArray[map.dragPointIndex].accumulatedDistance,
                accumulatedDuration: map.pointsArray[map.dragPointIndex].accumulatedDuration,
                drag: map.pointsArray[map.dragPointIndex].drag,
                events: map.pointsArray[map.dragPointIndex].events,
                visible: map.pointsArray[map.dragPointIndex].visible
        });
    }
}
