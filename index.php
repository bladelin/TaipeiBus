<?php
    $protocol = ($_SERVER['HTTPS']==='on') ? 'https': 'http';
?>
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type">
    <title>Bus Router v0.1</title>
    <script type="text/javascript" src="<?php echo $protocol?>://maps.google.com/maps/api/js?sensor=false&language=zh-tw"></script>
    <script type="text/javascript" src="http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/src/markerclusterer.js"></script>
    <script type="text/javascript" src="js/jquery-1.7.1.min.js"></script>
    <script type="text/javascript" src="js/anythingMap.js"></script>
    <script type="text/javascript" src="js/underscore-1.3.3.min.js"></script>
    <script type="text/javascript" src="js/sprintf-0.7.js"></script>
    <script type="text/javascript" src="js/dump_src.js"></script>
    <script>
/*<![CDATA[*/
    jsVars = {"rootRsUrl":"\./"};
/*]]>*/
    </script>

    <style>
        html { font-size: 11pt;font-family: arial;}
        body { }
        input{ font-size: 11pt;font-family: arial;height:30px; }
        input[type="text"] { font-size: 11pt;font-family: arial;height:20px; }
        html { height: 100% }
        body { height: 100%; margin: 0px; padding: 0px }
        #container {margin:10px;width:95%;float:left;}
        #mapCanvas { height: 559px;border:1px solid #999;border-top:none;}
        #mapControlBar {height:30px;background:#CCC;border:1px solid #999;padding:5px;line-height:30px;}
        #content {float:left;width:70%}
        #right {float:left;width:30%}
        #sidebar {border:1px solid #999;float:left;width:300px;height:600px;overflow:auto;border-left:0px;display:none;}
        ul {list-style-type:none;margin:0px; padding:0px;}
        li {list-style-type:none;border-bottom:1px solid #eee;height:25px;padding-left:5px;}
        #statistics {height:50px;clear:both;border:1px solid #999;border-top:none;}
        input.save {float:right;}
        #infoBubble{
            margin: 0;width:150px;height:60px;text-align:center;font-size:11px;
        }
        .active {background:#ddd;color:#EAC100;}
    </style>
</head>
<body>
    <div id="stopMainInfoContainer"></div>

    <div class="stopInfoBubble hide">
        <h3 class="name"></h3>
        <div class="clear"></div>
    </div>

    <div id="container">
        <div id="content">
            <div id="mapControlBar">
                <!--
                <input class="undo" type="button" value="Back"/>
                <input class="reset" type="button" value="Clear"/> -->
                <input class="search" type="text" value="台北火車站" title="範例：新北市中和區，台北市內湖區南京東路六段" placeholder="搜尋地點並將地圖移至該地" size="20"/>
                <label>去程</label>
                <input style="height:12px" type="radio" value="forward" name="radioDirection" checked="true"/>
                <label>回程</label>
                <input style="height:12px"  type="radio" value="backward" name="radioDirection"/>
                <label>Bus:</label><input class="txtBus" type="text"  size="10" value="284"/>
                <input class="btnBus" type="button" value="站牌查詢"/>
                <input class="allBus" type="button" value="所有站牌"/>
                <label>自動更新 </abel><input id="interval" type="text" value="30"/>
                <label id="msg"></label>
            </div>
            <div id="mapCanvas"></div>
        </div>
        <div id="right">
            <div id="sidebar"></div>
        </div>
    </div>
</body>
</html>
<script type="text/javascript" src="js/init.js?t=<?php echo time()?>"></script>
