<?php

/* @var $this yii\web\View */
/* @var $form yii\bootstrap\ActiveForm */
/* @var $model app\models\LoginForm */

use yii\helpers\Html;
use yii\bootstrap\ActiveForm;

$this->title = 'Вход';
$this->params['breadcrumbs'][] = $this->title;
?>
<div class="login-box">
    <div class="login-logo">
        <a href="/">Картограф <b>FMT</b></a>
    </div>
    <!-- /.login-logo -->
    <div class="login-box-body">
        <p class="login-box-msg">Введите свой ник и код доступа</p>

        <?php $form = ActiveForm::begin([
            'id' => 'login-form',
            'fieldConfig' => [
                'template' => "<div class=\"form-group has-feedback\">\n{input}\n{hint}\n{error}</div>",
                'hintOptions' => ['tag' => false]
            ],
        ]); ?>
        <?=
        $form->field($model, 'name')
            ->textInput(['class' => 'form-control', 'placeholder' => 'Имя игрока', 'autofocus' => true])
            ->hint("<span class=\"glyphicon glyphicon-user form-control-feedback\"></span>")
        ?>
        <?=
        $form->field($model, 'code')
            ->passwordInput(['class' => 'form-control', 'placeholder' => 'Код доступа'])
            ->hint("<span class=\"glyphicon glyphicon-lock form-control-feedback\"></span>")
        ?>
        <div class="row">
            <div class="col-xs-4 col-xs-offset-8">
                <?= Html::submitButton('Войти', ['class' => 'btn btn-primary btn-block btn-flat', 'name' => 'login-button']) ?>
            </div>
        </div>
        <?php ActiveForm::end(); ?>
    </div>
</div>
