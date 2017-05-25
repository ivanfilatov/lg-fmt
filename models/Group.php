<?php

namespace app\models;

use app\components\liga\LigaHelper;
use Yii;
use yii\redis\ActiveRecord;

/**
 * Model Group
 * @package app\models
 *
 * @property integer $id
 * @property string $name
 * @property string $admin
 * @property integer $clan
 * @property string $date
 *
 * @property GroupMember[] $members
 */
class Group extends ActiveRecord
{
    const NOT_CLAN_GROUP = 0;

    public static function keyPrefix()
    {
        return Yii::$app->params['dbKeyPrefix'] . parent::keyPrefix();
    }

    public function attributes()
    {
        return ['id', 'name', 'admin', 'clan', 'date'];
    }

    public function getMembers()
    {
        return $this->hasMany(GroupMember::className(), ['group_id' => 'id']);
    }

    public function administrationAvailable()
    {
        return (string)Yii::$app->user->identity->name === (string)$this->admin;
    }

    public function isClanGroup()
    {
        return (int)$this->clan !== (int)self::NOT_CLAN_GROUP;
    }

    public function rename($newName)
    {
        $this->name = (string)$newName;
        $this->date = (string)date('d.m.Y H:i:s');
        $this->save();
    }

    public function addMember($name)
    {
        $membership = new GroupMember();
        $membership->group_id = (int)$this->id;
        $membership->member = (string)$name;
        $membership->autofilled = (int)GroupMember::MEMBERSHIP_MANUAL;
        $membership->date = (string)date('d.m.Y H:i:s');
        $membership->save();
    }

    public function dropMemberByName($name)
    {
        /* @var $existingMembership GroupMember */
        $existingMembership = GroupMember::find()->where(['member' => $name, 'group_id' => $this->id])->one();
        $existingMembership->delete();
    }

    public function dropMemberByMembershipId($membershipId)
    {
        $newMembership = GroupMember::find()->where(['id' => (int)$membershipId])->one();
        $newMembership->delete();
    }

    public function dropAllMembers()
    {
        GroupMember::deleteAll(['group_id' => $this->id]);
    }

    public function dropAllAutofilledMembers()
    {
        GroupMember::deleteAll(['group_id' => $this->id, 'autofilled' => GroupMember::MEMBERSHIP_AUTOFILLED]);
    }

    public function fillMembersFromClanSquad($clanId)
    {
        $squad = LigaHelper::getClanSquadNames($clanId);

        foreach ($squad as $player) {
            /* @var $existingMembership GroupMember */
            $existingMembership = GroupMember::find()->where(['member' => $player])->one();
            if (!$existingMembership || ($existingMembership && $existingMembership->isAutofilled())) {
                if ($existingMembership) {
                    $existingMembership->delete();
                }
                $membership = new GroupMember();
                $membership->group_id = (int)$this->id;
                $membership->member = (string)$player;
                $membership->autofilled = (int)GroupMember::MEMBERSHIP_AUTOFILLED;
                $membership->date = (string)date('d.m.Y H:i:s');
                $membership->save();
            }
        }
    }

    public function transferAdminRights($newAdminName)
    {
        $this->admin = (string)$newAdminName;
        $this->date = (string)date('d.m.Y H:i:s');
        $this->save();
    }
}