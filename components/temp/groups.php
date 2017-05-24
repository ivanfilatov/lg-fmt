<?php
$redis = new Redis();
$redis->connect("127.0.0.1");
$redis->auth("fortistello16");


$filename = "http://www.fantasyland.ru/cgi/technical_clan_status.php?clan_id=" . $_GET['clanid'];
$f = fopen($filename, "rt") or die("Ошибка");
$str = fread($f, 10);
while (!feof($f)) {
    $str .= fread($f, 10);
}
fclose($f);

$str = str_replace(' "', '"', $str);
$str = str_replace(')"', '"', $str);
$str = str_replace(')[', '[', $str);
$str = str_replace(');', ')+', $str);
$str = substr($str, 0, -1);
$str = str_replace('")', '"', $str);
$str = str_replace('w("', '"', $str);
$str = str_replace('"', '', $str);
$str = iconv("CP1251", "UTF-8", $str);

$squad = explode("+", $str);

$nicknames = [];
foreach ($squad as $player) {
    $nicknames[explode("#", $player)[3]] = 1;
}

$strToUpdate = json_encode($nicknames, JSON_UNESCAPED_UNICODE);

ob_clean();
die($strToUpdate);