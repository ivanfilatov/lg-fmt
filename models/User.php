<?php

namespace app\models;

use Yii;
use yii\base\NotSupportedException;

/**
 * Class User
 * @package app\models
 *
 * @property integer $id
 * @property string $name
 * @property string $code
 * @property integer $admin
 * @property string $accessToken
 * @property string $authKey
 * @property string $date
 */
class User extends \yii\redis\ActiveRecord implements \yii\web\IdentityInterface
{
    const ROLE_ADMIN = 1;

    public static function keyPrefix()
    {
        return Yii::$app->params['dbKeyPrefix'] . parent::keyPrefix();
    }

    public function attributes()
    {
        return ['id', 'name', 'code', 'admin', 'accessToken', 'authKey', 'date'];
    }

    /**
     * @inheritdoc
     */
    public static function findIdentity($id)
    {
        return static::findOne(['id' => $id]);
    }

    /**
     * @inheritdoc
     */
    public static function findIdentityByAccessToken($token, $type = null)
    {
        throw new NotSupportedException('"findIdentityByAccessToken" is not implemented.');
    }

    /**
     * Finds user by name
     *
     * @param string $name
     * @return static|null
     */
    public static function findByName($name)
    {
        return static::findOne(['name' => $name]);
    }

    /**
     * @inheritdoc
     */
    public function getId()
    {
        return $this->getPrimaryKey();
    }

    /**
     * @inheritdoc
     */
    public function getAuthKey()
    {
        return $this->authKey;
    }

    /**
     * @inheritdoc
     */
    public function validateAuthKey($authKey)
    {
        return $this->authKey === $authKey;
    }

    /**
     * Validates access code
     *
     * @param string $code password to validate
     * @return bool if code provided is valid for current user
     */
    public function validateCode($code)
    {
        return Yii::$app->security->validatePassword($code, $this->code);
    }

    /**
     * Checks if user is admin
     * @return bool
     */
    public function isAdmin()
    {
        return (int)$this->admin === (int)self::ROLE_ADMIN;
    }
}
