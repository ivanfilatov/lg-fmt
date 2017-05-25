<?php

namespace app\models;

use Yii;
use yii\redis\ActiveRecord;

/**
 * Model GroupMember
 * @package app\models
 *
 * @property integer $id
 * @property integer $group_id
 * @property string $member
 * @property integer $autofilled
 * @property string $date
 *
 * @property Group $group
 */
class GroupMember extends ActiveRecord
{
    const MEMBERSHIP_AUTOFILLED = 1;
    const MEMBERSHIP_MANUAL = 0;

    public static function keyPrefix()
    {
        return Yii::$app->params['dbKeyPrefix'] . parent::keyPrefix();
    }

    public function attributes()
    {
        return ['id', 'group_id', 'member', 'autofilled', 'date'];
    }

    public function getGroup()
    {
        return $this->hasOne(Group::className(), ['id' => 'group_id']);
    }

    public function isAutofilled()
    {
        return (int)$this->autofilled === (int)self::MEMBERSHIP_AUTOFILLED;
    }
}