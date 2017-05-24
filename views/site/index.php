<?php

/**
 * @var $this yii\web\View
 * @var $playerNicknames []
 * @var $playerActivityDataValues []
 * @var $playerLocationsDataValues []
 * @var $objectData []
 */

$this->title = 'Главная';
?>
<div class="site-index">

    <div class="panel panel-default">
        <div class="panel-heading">Скачать плагин</div>
        <div class="panel-body">
            <a class="btn btn-md btn-flat btn-success" href="https://chrome.google.com/webstore/detail/%D1%81%D0%B5%D1%82%D0%B5%D0%B2%D0%BE%D0%B9-%D0%BA%D0%B0%D1%80%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84-fmt/ebnanhejognmhdjfdpeoliopfglaelfh?hl=ru" target="_blank">Установить через Chrome Extension Marketplace</a>
            <a class="btn btn-md btn-flat btn-success" href="<?= \yii\helpers\Url::to(['/plugin']) ?>" target="_blank">Скачать *.crx файл для ручной установки</a>
        </div>
    </div>

    <div class="panel panel-default">
        <div class="panel-heading">Активность</div>
        <div class="panel-body">
            <?php if ($playerNicknames && Yii::$app->user->identity->isAdmin()) : ?>
                <table class="table table-bordered table-hover">
                    <?php foreach ($playerNicknames as $playerNum => $data) : ?>
                        <tr>
                            <td><?= $playerNicknames[$playerNum] ?></td>
                            <td><?= date("d.m.Y H:i:s", strtotime($playerActivityDataValues[$playerNum])) ?></td>
                            <td><?= $playerLocationsDataValues[$playerNum] ?></td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            <?php else : ?>
                Нет информации
            <?php endif; ?>
        </div>
    </div>
    <br/>
    <div class="panel panel-default">
        <div class="panel-heading">Объекты</div>
        <div class="panel-body">
            <?php if ($objectData && Yii::$app->user->identity->isAdmin()) : ?>
                <table class="table table-bordered table-hover">
                    <?php foreach ($objectData as $location => $object) : ?>
                        <tr>
                            <td><?= $location ?></td>
                            <td><?= $object ?></td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            <?php else : ?>
                Нет информации
            <?php endif; ?>
        </div>
    </div>

</div>
