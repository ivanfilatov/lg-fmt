<?php

namespace app\models;

use Yii;
use yii\redis\ActiveRecord;

/**
 * Model GroupMember
 * @package app\models
 *
 * @property int $id
 * @property int $group_id
 * @property string $member
 * @property string $date
 *
 * @property Group $group
 */
class GroupMember extends ActiveRecord
{
    public static function keyPrefix()
    {
        return Yii::$app->params['dbKeyPrefix'] . parent::keyPrefix();
    }

    public function attributes()
    {
        return ['id', 'group_id', 'member', 'date'];
    }

    public function getGroup()
    {
        return $this->hasOne(Group::className(), ['id' => 'group_id']);
    }
}