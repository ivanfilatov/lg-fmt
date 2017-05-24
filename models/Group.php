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

    public function transferAdminRights($newAdminName)
    {
        $this->admin = (string)$newAdminName;
        $this->date = (string)date('d.m.Y H:i:s');
        $this->save();
    }

    public function fillMembersFromClanSquad($clanId)
    {
        $squad = LigaHelper::getClanSquadNames($clanId);

        foreach ($squad as $player) {
            $myMembership = new GroupMember();
            $myMembership->group_id = (int)$this->id;
            $myMembership->member = (string)$player;
            $myMembership->date = (string)date('d.m.Y H:i:s');
            $myMembership->save();
        }
    }

    public function dropAllMembers()
    {
        /* @var $existingMemberships GroupMember[] */
        $existingMemberships = GroupMember::find()->where(['group_id' => $this->id])->all();
        foreach ($existingMemberships as $existingMembership) {
            $existingMembership->delete();
        }
    }
}