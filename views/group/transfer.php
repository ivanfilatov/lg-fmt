<?php

/**
 * @var $this yii\web\View
 * @var $groupForm GroupForm
 */

use app\models\GroupForm;
use app\models\GroupMember;
use yii\helpers\Html;
use yii\widgets\ActiveForm;

$this->title = 'Смена администратора группы';
?>
<div class="group-transfer">
    <div class="panel panel-default">
        <div class="panel-heading">
            Смена администратора группы
        </div>
        <div class="panel-body">
            <?php if (!$groupForm->_group) : ?>
                Вы не состоите в группе!
            <?php elseif (!$groupForm->_group->administrationAvailable()) : ?>
                Вы не являетесь администратором группы "<?= $groupForm->_group->name ?>" (ID#<?= $groupForm->_group->id ?>)!<br/>
                Текущий администратор: <?= $groupForm->_group->admin ?>.
            <?php else : ?>
                <?php $form = ActiveForm::begin() ?>
                <?= $form->field($groupForm, 'newGroupAdmin')->dropDownList(\yii\helpers\ArrayHelper::map($groupForm->_group->members, 'member', 'member'), ['prompt' => 'Выберите игрока'])->label('Выберите игрока') ?>
                <?= Html::submitButton('Передать права', ['class' => 'btn btn-primary btn-flat']) ?>
                <?php ActiveForm::end(); ?>
            <?php endif; ?>
        </div>
    </div>
</div>
