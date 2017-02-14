<?php
$redis = new Redis();
$redis->connect('localhost');
$redis->auth('fortistello16');

$playerIdentitiesDataKeys = $redis->keys('fmt:identities:*');
$playerNicknames = [];
$playerActivityDataKeys = [];
$playerLocationsDataKeys = [];
foreach ($playerIdentitiesDataKeys as $playerIdentity) {
    $playerNickname = str_replace('fmt:identities:', '', $playerIdentity);
    $playerNicknames[] = $playerNickname;
    $playerActivityDataKeys[] = 'fmt:lastactivity:' . $playerNickname;
    $playerLocationsDataKeys[] = 'fmt:locations:' . $playerNickname;
}
$playerActivityDataValues = $redis->mget($playerActivityDataKeys);
$playerLocationsDataValues = $redis->mget($playerLocationsDataKeys);

$objectDataKeys = $redis->keys('fmt:objectdata:*');
$objectDataValues = $redis->mget($objectDataKeys);
$objectData = array_combine($objectDataKeys, $objectDataValues);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FMT</title>
</head>
<body>
<h4>Активность:</h4>
<?php foreach ($playerNicknames as $playerNum => $data) : ?>
    <?php echo $playerNicknames[$playerNum] . ": " . date("d.m.Y H:i:s", strtotime($playerActivityDataValues[$playerNum])) . ' / ' . $playerLocationsDataValues[$playerNum]; ?>
    <br/>
<?php endforeach; ?>
<br/>
<h4>Объекты:</h4>
<?php foreach ($objectData as $location => $object) : ?>
    <?php echo $location . ": " . $object; ?>
    <br/>
<?php endforeach; ?>
</body>
</html>