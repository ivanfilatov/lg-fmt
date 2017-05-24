<?php

namespace app\controllers;

use Redis;
use Yii;
use yii\filters\AccessControl;
use yii\redis\Connection;
use yii\web\Controller;
use yii\filters\VerbFilter;
use app\models\LoginForm;
use app\models\ContactForm;

class SiteController extends Controller
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
                        'actions' => ['index', 'logout'],
                        'allow' => true,
                        'roles' => ['@'],
                    ],
                    [
                        'actions' => ['login'],
                        'allow' => true,
                    ],
                ],
            ],
            'verbs' => [
                'class' => VerbFilter::className(),
                'actions' => [
                    'logout' => ['post'],
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
     * Displays homepage.
     *
     * @return string
     */
    public function actionIndex()
    {
        /* @var $redis Connection */
        $redis = Yii::$app->redis;

        $playerIdentitiesDataKeys = $redis->keys('fmt:identities:*');
        $playerNicknames = [];
        $playerActivityDataKeys = [];
        $playerLocationsDataKeys = [];
        foreach ($playerIdentitiesDataKeys as $playerIdentity) {
            $playerNickname = str_replace('fmt:identities:', '', $playerIdentity);
            $playerNicknames[] = $playerNickname;
            $playerActivityDataKeys[] = 'fmt:lastactivity:' . $playerNickname;
            $playerLocationsDataKeys[] = 'fmt:locations:' . $playerNickname;
        }
        $playerActivityDataValues = $redis->mget(...$playerActivityDataKeys);
        $playerLocationsDataValues = $redis->mget(...$playerLocationsDataKeys);

        $objectData = [];
        $objectDataKeys = $redis->keys('fmt:objectdata:*');
        if ($objectDataKeys) {
            $objectDataValues = $redis->mget(...$objectDataKeys);
            $objectData = array_combine($objectDataKeys, $objectDataValues);
        }

        return $this->render('index', [
            'playerNicknames' => $playerNicknames,
            'playerActivityDataValues' => $playerActivityDataValues,
            'playerLocationsDataValues' => $playerLocationsDataValues,
            'objectData' => $objectData,
        ]);
    }

    /**
     * Login action.
     *
     * @return string
     */
    public function actionLogin()
    {
        if (!Yii::$app->user->isGuest) {
            return $this->goHome();
        }

        $model = new LoginForm();
        if ($model->load(Yii::$app->request->post()) && $model->login()) {
            return $this->goBack();
        }

        $this->layout = '//main-login';
        return $this->render('login', [
            'model' => $model,
        ]);
    }

    /**
     * Logout action.
     *
     * @return string
     */
    public function actionLogout()
    {
        Yii::$app->user->logout();

        return $this->goHome();
    }
}
