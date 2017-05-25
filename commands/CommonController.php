<?php

namespace app\commands;


use app\models\Group;
use app\models\User;
use Yii;
use yii\console\Controller;
use yii\helpers\Console;

class CommonController extends Controller
{
    /**
     * php yii common/add-user Name 1|0
     *
     * @param $username
     * @param int $admin
     */
    public function actionAddUser($username, $admin = 0)
    {
        $code = (string)Yii::$app->security->generateRandomString(8);

        $user = new User();
        $user->name = (string)$username;
        $user->code = Yii::$app->security->generatePasswordHash($code);
        $user->admin = (int)$admin;
        $user->accessToken = (string)'';
        $user->authKey = (string)'';
        $user->date = (string)date('d.m.Y H:i:s');
        $user->save();

        $this->stdout('Создан пользователь ' . $user->name . ' с кодом доступа ' . $code . "\n", Console::FG_GREEN);
        return;
    }

    /**
     * php yii common/update-clan-groups
     */
    public function actionUpdateClanGroups()
    {
        $counter = 0;
        /* @var $groups Group[] */
        $groups = Group::find()->all();
        foreach ($groups as $group) {
            if ($group->isClanGroup()) {
                $group->dropAllAutofilledMembers();
                $group->fillMembersFromClanSquad($group->clan);
                $counter++;
            }
        }
        $this->stdout('Кол-во обновленных клановых групп: ' . $counter . "\n", Console::FG_GREEN);
    }

    /**
     * php yii common/process-daily-jobs
     */
    public function actionProcessDailyJobs()
    {
        $this->actionUpdateClanGroups();

        $counter = 0;
        $groupsDataForNodeServer = [];
        /* @var $groups Group[] */
        $groups = Group::find()->all();
        foreach ($groups as $group) {
            foreach ($group->members as $groupMembership) {
                $groupsDataForNodeServer[$groupMembership->member] = (int)$group->id;
                $counter++;
            }
        }
        Yii::$app->redis->set('fmt:_groups', json_encode($groupsDataForNodeServer, JSON_UNESCAPED_UNICODE));
        $this->stdout('Кол-во обновленных записей пользователей: ' . $counter . "\n", Console::FG_GREEN);
        $restartServer = exec('supervisorctl restart fmt');
        if ($restartServer == 'fmt: started') {
            $this->stdout('Сервер перезапущен' . "\n", Console::FG_GREEN);
        } else {
            $this->stdout('Произошла ошибка при перезапуске сервера' . "\n", Console::FG_RED);
        }
    }
}