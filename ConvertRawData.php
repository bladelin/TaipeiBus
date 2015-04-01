<?php
class StopData {
    public $lat;
    public $lng;
    public $type;
    public $name;
    public $ID;
}
$content = file_get_contents("allstoptwd67.json");

/*
Object
    [type] => Feature
    [properties] => stdClass Object
        (
            [bsm_bussto] => 3863
            [bsm_chines] => 迴龍派出所
        )

    [geometry] => stdClass Object
        (
            [type] => Point
            [coordinates] => Array
                (
                    [0] => 121.40864458215
                    [1] => 25.018996440588
                )

        )
*/

$json = json_decode($content);
$stopArray = $json->features;
//$i=0;
foreach ($stopArray as $stop) {
    $stopData = new StopData();
    $stopData->type  = $stop->geometry->type;
    $stopData->ID    = $stop->properties->bsm_bussto;
    $stopData->name  = $stop->properties->bsm_chines;
    $stopData->lat   = $stop->geometry->coordinates[0];
    $stopData->lng   = $stop->geometry->coordinates[1];
    $stopDataArray[$stopData->name] = $stopData;
}
echo json_encode($stopDataArray, JSON_NUMERIC_CHECK);