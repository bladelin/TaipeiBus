<?php

include('simple_html_dom.php');


class Crawler {

    protected $cookie = '/tmp/cookie.tmp';

    public function execCurl($url, $param = array(), $method = 'GET') {
        assert(isset($url));

        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HEADER, false);
        curl_setopt($curl, CURLOPT_TIMEOUT, 30); // Connection timeout

        // if the web needs login after using.
        curl_setopt($curl, CURLOPT_COOKIEFILE, $this->cookie);
        curl_setopt($curl, CURLOPT_COOKIEJAR, $this->cookie);

        //  SSL connect necessary
        if (strstr($url, "https")) {
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
        }

        if ($method == 'POST') {
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_POST, true);
            if (is_array($param))
                curl_setopt($curl, CURLOPT_POSTFIELDS, $param);
        }

        // grab URL and pass it to the browser
        $respMsgBody = curl_exec($curl);
        if ($respMsgBody === false) {
            throw new CException('execCurl("' . $url . '") failure');
        }
        if ($msg = curl_error($curl))
            throw new CException($msg);

        // close cURL resource, and free up system resources
        curl_close($curl);
        return $respMsgBody;
    }
}

class BusInfoData {
    public $index_url = "http://pda.5284.com.tw/MQS/businfo1.jsp";
    public $bus_url = "http://pda.5284.com.tw/MQS/businfo2.jsp?routename=";
}

class TaipeiBus extends Crawler{

    const ROUTE_MATCH_PATTERN = '/routeArray = \[(.+)\];/';
    const FETCH_INTERVAL = 10;

    private $_self;         // Url Setting
    private $_busInfo;      // Bus route info
    private $_busList;      // All bus name
    private $_allStopArray; // All stop info (include gps location)

    public function __construct() {
        $this->_self = new BusInfoData();
        $this->fetchBusList();
        $this->_getBusStopLocation();
    }

    public function __get($name) {
        $name = "_".$name;
        if (isset($this->{$name}))
            return $this->{$name};
    }

    private function _getBusStopLocation() {
        if ($json = file_get_contents('newAllStopTwd67.json')) {
            $objs = json_decode($json);
            foreach($objs as $obj) {
                $this->_allStopArray[$obj->name] = $obj;
            }
        }
    }

    private function _getStopLocation($stop) {
        return (isset($this->_allStopArray[$stop])) ? $this->_allStopArray[$stop] : null;
    }

    private function _getRouteStopInfo($tableHtml) {

        foreach ($tableHtml as $element) {
            $aLink   = $element->find('td', 0)->find('a', 0);
            $content = $element->find('td', 1)->plaintext;

            $lat = 0;
            $lng = 0;

            if ($gps = $this->_getStopLocation($aLink->plaintext)) {
                $lat = $gps->lat;
                $lng = $gps->lng;

                $stop = array(
                    'stop'    => $aLink->plaintext,
                    //'url'    => $aLink->attr['href'],
                    'lat'     => $lat,
                    'lng'     => $lng,
                    'approch' => $content);

                $busInfo[] = $stop;
            }
        }
        return $busInfo;
    }

    public function fetchBusRoute($busName = "") {
        $now = time();

        if (!in_array($busName, $this->busList)) {
            echo "$busName bus is not exists";
            return;
        }

        // Avoid execute frequency
        if (isset($this->_busInfo[$busName])
            && ($this->_busInfo[$busName]['lastUpdateTime'] + TaipeiBus::FETCH_INTERVAL) > $now) {
            return;
        }

        $url = $this->_self->bus_url . $busName;
        $respMsgBody = $this->execCurl($url);

        $busInfo = array(
            "forward"    => array(),
            "backward"   => array(),
            "lastUpdateTime" => $now,
        );

        /*
         * simple_html_dom is good library for parse html data
         * replace with regular express '/\<table.*?\>(.+)\<\/[\s]*table>/', $respMsgBody, $matches)
        */
        $html = new simple_html_dom();
        $html->load($respMsgBody);

        $table2 = $html->find('table', 2)->find('tr');
        $table3 = $html->find('table', 3)->find('tr');

        $busInfo['forward'] = $this->_getRouteStopInfo($table2);
        $busInfo['backward'] = $this->_getRouteStopInfo($table3);
        $this->_busInfo[$busName] = $busInfo;
    }

    public function fetchBusList() {
        $respMsgBody = $this->execCurl($this->_self->index_url);

        if ($respMsgBody) {
            $startFrom = 0;
            $result = preg_match(TaipeiBus::ROUTE_MATCH_PATTERN, $respMsgBody, $matches);//, PREG_OFFSET_CAPTURE, $startFrom);
            $routeStr = str_replace("'", "", $matches[1]);
            $this->_busList = explode(",", $routeStr);
        }
    }
}

