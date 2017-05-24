<?php

namespace app\models;

class User extends \yii\redis\ActiveRecord implements \yii\web\IdentityInterface
{
    public $id;
    public $name;
    public $code;
    public $accessToken;
    public $authKey;

    private static $users = [
        '1' => [
            'id' => '1',
            'name' => 'Фортис',
            'code' => 'hvn86x01ge',
            'accessToken' => '',
            'authKey' => '',
        ],
    ];

    /**
     * @inheritdoc
     */
    public static function findIdentity($id)
    {
        return isset(self::$users[$id]) ? new static(self::$users[$id]) : null;
    }

    /**
     * @inheritdoc
     */
    public static function findIdentityByAccessToken($token, $type = null)
    {
        foreach (self::$users as $user) {
            if ($user['accessToken'] === $token) {
                return new static($user);
            }
        }

        return null;
    }

    /**
     * Finds user by name
     *
     * @param string $name
     * @return static|null
     */
    public static function findByName($name)
    {
        foreach (self::$users as $user) {
            if (strcasecmp($user['name'], $name) === 0) {
                return new static($user);
            }
        }

        return null;
    }

    /**
     * @inheritdoc
     */
    public function getId()
    {
        return $this->id;
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
        return $this->code === $code;
    }
}
