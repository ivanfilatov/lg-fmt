<?php

namespace app\controllers;

use app\components\liga\LigaHelper;
use app\models\GroupForm;
use app\models\GroupMember;
use Redis;
use Yii;
use yii\filters\AccessControl;
use yii\redis\Connection;
use yii\web\Controller;
use yii\filters\VerbFilter;
use app\models\LoginForm;
use app\models\ContactForm;

class GroupController extends Controller
{
    /**
     * @inheritdoc
     */
    public function behaviors()
    {
        return [
            'access' => [
                'class' => AccessControl::className(),
                'rules' => [
                    [
                        'actions' => ['create', 'rename', 'members', 'transfer', 'leave', 'disband'],
                        'allow' => true,
                        'roles' => ['@'],
                    ],
                ],
            ],
        ];
    }

    /**
     * @inheritdoc
     */
    public function actions()
    {
        return [
            'error' => [
                'class' => 'yii\web\ErrorAction',
            ],
        ];
    }

    /**
     * Displays create group page.
     *
     * @return string
     */
    public function actionCreate()
    {
        $groupForm = new GroupForm(['scenario' => GroupForm::SCENARIO_CREATE]);

        $myMembership = GroupMember::find()->where(['member' => Yii::$app->user->identity->name])->one();
        if ($myMembership) {
            /* @var $myMembership GroupMember */
            $groupForm->_group = $myMembership->group;
        }

        if (Yii::$app->request->isPost) {
            if ($groupForm->load(Yii::$app->request->post()) && $groupForm->validate()) {
                $groupForm->createGroup();
                Yii::$app->session->setFlash('success', 'Группа создана');
                return $this->redirect(['create']);
            }
        }

        return $this->render('create', [
            'groupForm' => $groupForm,
            'clans' => LigaHelper::getClanList()
        ]);
    }

    /**
     * Displays rename group page.
     *
     * @return string
     */
    public function actionRename()
    {
        $groupForm = new GroupForm(['scenario' => GroupForm::SCENARIO_RENAME]);

        $myMembership = GroupMember::find()->where(['member' => Yii::$app->user->identity->name])->one();
        if ($myMembership) {
            /* @var $myMembership GroupMember */
            $groupForm->_group = $myMembership->group;
            $groupForm->name = $myMembership->group->name;

            if ($myMembership->group->administrationAvailable()) {
                if (Yii::$app->request->isPost) {
                    if ($groupForm->load(Yii::$app->request->post()) && $groupForm->validate()) {
                        $groupForm->renameGroup();
                        Yii::$app->session->setFlash('success', 'Группа переименована');
                        return $this->redirect(['rename']);
                    }
                }
            }
        }

        return $this->render('rename', [
            'groupForm' => $groupForm
        ]);
    }

    /**
     * Displays members management page.
     *
     * @return string
     */
    public function actionMembers()
    {
        $groupForm = new GroupForm(['scenario' => GroupForm::SCENARIO_MEMBERS]);

        $myMembership = GroupMember::find()->where(['member' => Yii::$app->user->identity->name])->one();
        if ($myMembership) {
            /* @var $myMembership GroupMember */
            $groupForm->_group = $myMembership->group;

            if ($myMembership->group->administrationAvailable()) {
                if (Yii::$app->request->isPost) {
                    if ($groupForm->load(Yii::$app->request->post()) && $groupForm->validate()) {
                        $groupForm->editMembers();
                        Yii::$app->session->setFlash('success', 'Состав группы обновлен');
                        return $this->redirect(['members']);
                    }
                }
            }
        }

        return $this->render('members', [
            'groupForm' => $groupForm
        ]);
    }

    /**
     * Displays transfer admin rights page.
     *
     * @return string
     */
    public function actionTransfer()
    {
        $groupForm = new GroupForm(['scenario' => GroupForm::SCENARIO_TRANSFER]);

        $myMembership = GroupMember::find()->where(['member' => Yii::$app->user->identity->name])->one();
        if ($myMembership) {
            /* @var $myMembership GroupMember */
            $groupForm->_group = $myMembership->group;

            if ($myMembership->group->administrationAvailable()) {
                if (Yii::$app->request->isPost) {
                    if ($groupForm->load(Yii::$app->request->post()) && $groupForm->validate()) {
                        $groupForm->changeGroupAdmin();
                        Yii::$app->session->setFlash('success', 'Администратор группы изменен');
                        return $this->redirect(['transfer']);
                    }
                }
            }
        }

        return $this->render('transfer', [
            'groupForm' => $groupForm
        ]);
    }

    /**
     * Displays leave group page.
     *
     * @return string
     */
    public function actionLeave()
    {
        $groupForm = new GroupForm(['scenario' => GroupForm::SCENARIO_LEAVE]);

        $myMembership = GroupMember::find()->where(['member' => Yii::$app->user->identity->name])->one();
        if ($myMembership) {
            /* @var $myMembership GroupMember */
            $groupForm->_group = $myMembership->group;

            if ($myMembership->group->administrationAvailable()) {
                if (Yii::$app->request->isPost) {
                    if ($groupForm->load(Yii::$app->request->post()) && $groupForm->validate()) {
                        $groupForm->leaveGroup();
                        Yii::$app->session->setFlash('success', 'Вы покинули группу');
                        return $this->redirect(['transfer']);
                    }
                }
            }
        }

        return $this->render('leave', [
            'groupForm' => $groupForm
        ]);
    }

    /**
     * Displays disband group page.
     *
     * @return string
     */
    public function actionDisband()
    {
        $groupForm = new GroupForm(['scenario' => GroupForm::SCENARIO_DISBAND]);

        $myMembership = GroupMember::find()->where(['member' => Yii::$app->user->identity->name])->one();
        if ($myMembership) {
            /* @var $myMembership GroupMember */
            $groupForm->_group = $myMembership->group;

            if ($myMembership->group->administrationAvailable()) {
                if (Yii::$app->request->isPost) {
                    if ($groupForm->load(Yii::$app->request->post()) && $groupForm->validate()) {
                        $groupForm->disbandGroup();
                        Yii::$app->session->setFlash('success', 'Группа распущена');
                        return $this->redirect(['transfer']);
                    }
                }
            }
        }

        return $this->render('disband', [
            'groupForm' => $groupForm
        ]);
    }
}
