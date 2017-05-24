<?php

/**
 * @var $this yii\web\View
 * @var $groupForm GroupForm
 */

use app\models\GroupForm;
use yii\helpers\Html;
use yii\widgets\ActiveForm;

$this->title = 'Смена имени группы';
?>
<div class="group-rename">
    <div class="panel panel-default">
        <div class="panel-heading">
            Смена имени группы
        </div>
        <div class="panel-body">
            <?php if (!$groupForm->_group) : ?>
                Вы не состоите в группе!
            <?php elseif ($groupForm->_group->isClanGroup()) : ?>
                Группа "<?= $groupForm->_group->name ?>" (ID#<?= $groupForm->_group->id ?>) привязана к клану!<br/>
                Изменить название клановой группы невозможно.
            <?php elseif (!$groupForm->_group->administrationAvailable()) : ?>
                Вы не являетесь администратором группы "<?= $groupForm->_group->name ?>" (ID#<?= $groupForm->_group->id ?>)!<br/>
                Текущий администратор: <?= $groupForm->_group->admin ?>.
            <?php else : ?>
                <?php $form = ActiveForm::begin() ?>
                <?= $form->field($groupForm, 'name')->textInput(['placeholder' => 'Имя группы', 'maxlength' => true, 'autofocus' => true])->label('Имя группы') ?>
                <?= Html::submitButton('Переименовать', ['class' => 'btn btn-primary btn-flat']) ?>
                <?php ActiveForm::end(); ?>
            <?php endif; ?>
        </div>
    </div>
</div>
