<aside class="main-sidebar">

    <section class="sidebar">

        <!-- Sidebar user panel -->
        <div class="user-panel">
            <div class="pull-left image">
                <img src="/img/icon-person.png" class="img-circle" alt="User Image"/>
            </div>
            <div class="pull-left info">
                <p><?= Yii::$app->user->identity->name ?></p>

                <a href="#"><i class="fa fa-circle text-success"></i> Online</a>
            </div>
        </div>

        <?= dmstr\widgets\Menu::widget(
            [
                'options' => ['class' => 'sidebar-menu'],
                'items' => [
                    ['label' => 'Управление группой', 'options' => ['class' => 'header']],
                    ['label' => 'Создать группу', 'icon' => 'user-plus', 'url' => ['/group/create']],
                    ['label' => 'Название группы', 'icon' => 'font', 'url' => ['/group/name']],
                    ['label' => 'Состав группы', 'icon' => 'users', 'url' => ['/group/members']],
                    ['label' => 'Расформировать группу', 'icon' => 'user-times', 'url' => ['/group/disband']],

                    //['label' => 'Управление картографом', 'options' => ['class' => 'header']],
                ],
            ]
        ) ?>

    </section>

</aside>
