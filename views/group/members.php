<?php

/**
 * @var $this yii\web\View
 * @var $groupForm GroupForm
 */

use app\models\GroupForm;
use app\models\GroupMember;
use yii\helpers\Html;
use yii\widgets\ActiveForm;

$this->title = 'Управление составом группы';
?>
<div class="group-members">
    <div class="panel panel-default">
        <div class="panel-heading">
            Управление составом группы
        </div>
        <div class="panel-body">
            <?php if (!$groupForm->_group) : ?>
                Вы не состоите в группе!
            <?php elseif ($groupForm->_group->isClanGroup()) : ?>
                Группа "<?= $groupForm->_group->name ?>" (ID#<?= $groupForm->_group->id ?>) привязана к клану!<br/>
                Состав клановой группы обновляется ежедневно.
            <?php elseif (!$groupForm->_group->administrationAvailable()) : ?>
                Вы не являетесь администратором группы "<?= $groupForm->_group->name ?>" (ID#<?= $groupForm->_group->id ?>)!<br/>
                Текущий администратор: <?= $groupForm->_group->admin ?>.
            <?php else : ?>
                <?php $form = ActiveForm::begin() ?>
                <?= $form->field($groupForm, 'membershipToAdd')->textInput(['placeholder' => 'Имя игрока', 'maxlength' => true, 'autofocus' => true])->label('Имя игрока') ?>
                <?= Html::submitButton('Добавить игрока', ['class' => 'btn btn-primary btn-flat']) ?>
                <?php ActiveForm::end(); ?>
            <?php endif; ?>
        </div>
    </div>
    <div class="panel panel-default">
        <div class="panel-heading">
            Текущий состав группы
        </div>
        <div class="panel-body">
            <?php if (!$groupForm->_group) : ?>
                Вы не состоите в группе!
            <?php elseif ($groupForm->_group->isClanGroup() || !$groupForm->_group->administrationAvailable()) : ?>
                <div class="row">
                    <?php foreach ($groupForm->_group->members as $groupMembership) : ?>
                        <?php /* @var $groupMembership GroupMember */ ?>
                        <div class="col-lg-2">
                            <div class="well well-sm text-center">
                                <?= $groupMembership->member ?>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else : ?>
                <div class="row">
                    <?php foreach ($groupForm->_group->members as $groupMembership) : ?>
                        <?php /* @var $groupMembership GroupMember */ ?>
                        <div class="col-lg-2">
                            <?php $form = ActiveForm::begin(['fieldConfig' => ['options' => ['tag' => false]]]) ?>
                            <div class="well well-sm text-center">
                                <?= $groupMembership->member ?>
                                <?= $form->field($groupForm, 'membershipToDelete', ['template' => '{input}'])->hiddenInput(['value' => $groupMembership->id])->label(false) ?>
                                <?= Html::submitButton(\rmrevin\yii\fontawesome\FA::i('times'), ['class' => 'btn btn-xs btn-danger pull-right']) ?>
                            </div>
                            <?php ActiveForm::end(); ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
