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
        <div class="panel-heading">Активность</div>
        <div class="panel-body">
            <?php if ($playerNicknames) : ?>
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
            <?php if ($objectData) : ?>
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
