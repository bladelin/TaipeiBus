<?php

include("TaipeiBus.php");
// Testing case
if (isset($argv[1])) $bus = $argv[1];
else if (isset($_GET['bus'])) $bus = $_GET['bus'];

$direction = 'forward';
if(isset($_GET['direction']) &&  $_GET['direction'] == 'backward')
    $direction = 'backward';


if (!empty($bus)) {
    $tpBus = new TaipeiBus();
    $tpBus->fetchBusRoute($bus);

    if(PHP_SAPI == 'cli') {
        echo '<pre>';
        print_r($tpBus->busInfo[$bus]);
        echo '</pre>';
    } else {
        echo json_encode($tpBus->busInfo[$bus][$direction]);
    }
}
