<?php

/**
 * @var $this yii\web\View
 * @var $groupForm GroupForm
 */

use app\models\GroupForm;
use app\models\GroupMember;
use yii\helpers\Html;
use yii\widgets\ActiveForm;

$this->title = 'Расформирование группы';
?>
<div class="group-transfer">
    <div class="panel panel-default">
        <div class="panel-heading">
            Расформирование группы
        </div>
        <div class="panel-body">
            <?php if (!$groupForm->_group) : ?>
                Вы не состоите в группе!
            <?php elseif (!$groupForm->_group->administrationAvailable()) : ?>
                Вы не являетесь администратором группы "<?= $groupForm->_group->name ?>" (ID#<?= $groupForm->_group->id ?>)!<br/>
                Текущий администратор: <?= $groupForm->_group->admin ?>.
            <?php else : ?>
                <?php $form = ActiveForm::begin() ?>
                <?= $form->field($groupForm, 'disbandGroupFlag')->checkbox(['label' => 'Я подтверждаю расформирование группы'])->label(false) ?>
                <?= Html::submitButton('Расформировать группу', ['class' => 'btn btn-danger btn-flat', 'data-confirm' => 'Вы уверены, что хотите расформировать группу?']) ?>
                <?php ActiveForm::end(); ?>
            <?php endif; ?>
        </div>
    </div>
</div>
