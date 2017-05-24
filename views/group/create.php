<?php

/**
 * @var $this yii\web\View
 * @var $groupForm GroupForm
 * @var $clans []
 */

use app\models\GroupForm;
use yii\helpers\Html;
use yii\widgets\ActiveForm;

$this->title = 'Создание группы';
?>
<div class="group-create">
    <div class="panel panel-default">
        <div class="panel-heading">
            Создание группы
        </div>
        <div class="panel-body">
            <?php if ($groupForm->_group) : ?>
                Вы уже состоите в группе "<?= $groupForm->_group->name ?>" (ID#<?= $groupForm->_group->id ?>)!
            <?php else : ?>
                <?php $form = ActiveForm::begin() ?>
                <?= $form->field($groupForm, 'name')->textInput(['placeholder' => 'Имя группы', 'maxlength' => true, 'autofocus' => true])->label('Имя группы') ?>
                <?= $form->field($groupForm, 'clanId')->dropDownList($clans, ['prompt' => 'Выберите клан'])->label('Выберите клан') ?>
                <?= Html::submitButton('Создать', ['class' => 'btn btn-primary btn-flat']) ?>
                <?php ActiveForm::end(); ?>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php
$this->registerJs("
$(document).ready(function () {
    $('.group-create select[name=\"GroupForm[clanId]\"]').on('change', function () {
        if ($('.group-create select[name=\"GroupForm[clanId]\"] > option:selected').val() != '') {
            $('.group-create input[name=\"GroupForm[name]\"]').attr('readonly', true);
            $('.group-create input[name=\"GroupForm[name]\"]').val($('.group-create select[name=\"GroupForm[clanId]\"] > option:selected').text());
        } else {
            $('.group-create input[name=\"GroupForm[name]\"]').attr('readonly', false);
            $('.group-create input[name=\"GroupForm[name]\"]').val('');
        }
        
        var form = $('#w0'), 
        data = form.data('yiiActiveForm');
        $.each(data.attributes, function() {
            this.status = 3;
        });
        form.yiiActiveForm('validate');
    });
});
")
?>
