<?php

interface ICrawler {
    public function fetchRawData();
    public function parse();
}

class PttCrawler implements ICrawler {
    private $_rich = array(); 
    private $_rawHtml = "";

    public function __construct() {
    
    }

    public function __get($name) {
        return $this->name; 
    }

    public function fetchRawData() {
    
        if (isset($_GET['board']) && $_GET['board'] != "") {
            $url = "http://www.ptt.cc/bbs/".$_GET['board']."/".$_GET['article'];
        }
        else if(isset($_GET['url']) && $_GET['url'] != "") {
            $url = $_GET['url'];
        }
        else {
            $url = "http://www.ptt.cc/bbs/joke/index.html";
        }
        $result = file_get_contents($url);
        return mb_convert_encoding($result, "UTF-8", "big5");
    }

    public function parse() {
    
    }
}

if (1) {
    $pttCrawler = new PttCrawler();
    $pttCrawler->fetchRawData();
    $pttCrawler->parse();
}
