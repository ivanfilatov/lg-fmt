<?php

/**
 * @var $this yii\web\View
 * @var $groupForm GroupForm
 */

use app\models\GroupForm;
use app\models\GroupMember;
use yii\helpers\Html;
use yii\widgets\ActiveForm;

$this->title = 'Выход из группы';
?>
<div class="group-leave">
    <div class="panel panel-default">
        <div class="panel-heading">
            Выход из группы
        </div>
        <div class="panel-body">
            <?php if (!$groupForm->_group) : ?>
                Вы не состоите в группе!
            <?php elseif ($groupForm->_group->isClanGroup()) : ?>
                Группа "<?= $groupForm->_group->name ?>" (ID#<?= $groupForm->_group->id ?>) привязана к клану!<br/>
                Из клановой группы выйти невозможно.
            <?php elseif (!$groupForm->_group->administrationAvailable()) : ?>
                <?php $form = ActiveForm::begin() ?>
                <?= $form->field($groupForm, 'leaveGroupFlag')->checkbox(['label' => 'Я подтверждаю выход из группы'])->label(false) ?>
                <?= Html::submitButton('Покинуть группу', ['class' => 'btn btn-danger btn-flat', 'data-confirm' => 'Вы уверены, что хотите покинуть группу?']) ?>
                <?php ActiveForm::end(); ?>
            <?php else : ?>
                Вы являетесь администратором группы "<?= $groupForm->_group->name ?>" (ID#<?= $groupForm->_group->id ?>)!<br/>
                Будучи администратором, невозможно покинуть группу.
            <?php endif; ?>
        </div>
    </div>
</div>
