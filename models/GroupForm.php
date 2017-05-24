<?php

namespace app\models;

use app\components\liga\LigaHelper;
use app\models\GroupMember;
use Yii;
use yii\base\Model;
use yii\redis\Connection;

/**
 * GroupForm is the model behind the group form.
 *
 * @property Group|null $_group
 *
 */
class GroupForm extends Model
{
    const SCENARIO_CREATE = 'create';
    const SCENARIO_RENAME = 'rename';
    const SCENARIO_MEMBERS = 'members';
    const SCENARIO_TRANSFER = 'transfer';
    const SCENARIO_LEAVE = 'leave';
    const SCENARIO_DISBAND = 'disband';

    public $name;
    public $clanId;
    public $membershipToAdd;
    public $membershipToDelete;
    public $newGroupAdmin;
    public $leaveGroupFlag;
    public $disbandGroupFlag;

    public $_group;

    public function scenarios()
    {
        return [
            self::SCENARIO_CREATE => ['name', 'clanId'],
            self::SCENARIO_RENAME => ['name'],
            self::SCENARIO_MEMBERS => ['membershipToAdd', 'membershipToDelete'],
            self::SCENARIO_TRANSFER => ['newGroupAdmin'],
            self::SCENARIO_LEAVE => ['leaveGroupFlag'],
            self::SCENARIO_DISBAND => ['disbandGroupFlag'],
        ];
    }

    /**
     * @return array the validation rules.
     */
    public function rules()
    {
        return [
            [['name'], 'required', 'message' => 'Необходимо ввести имя группы', 'on' => [self::SCENARIO_CREATE, self::SCENARIO_RENAME]],
            [['name'], 'string', 'max' => 64, 'tooLong' => 'Название группы не может содержать более 64 символов', 'min' => 4, 'tooShort' => 'Название группы не может содержать менее 4 символов', 'on' => [self::SCENARIO_CREATE, self::SCENARIO_RENAME]],
            [['clanId'], 'trim', 'on' => [self::SCENARIO_CREATE]],
            [['clanId'], 'clanIdValidator', 'on' => [self::SCENARIO_CREATE]],

            [['membershipToAdd', 'membershipToDelete'], 'trim', 'on' => [self::SCENARIO_MEMBERS]],
            [['membershipToAdd'], 'addMembershipValidator', 'on' => [self::SCENARIO_MEMBERS]],
            [['membershipToDelete'], 'deleteMembershipValidator', 'on' => [self::SCENARIO_MEMBERS]],

            [['newGroupAdmin'], 'required', 'message' => 'Необходимо выбрать игрока', 'on' => [self::SCENARIO_TRANSFER]],
            [['newGroupAdmin'], 'newGroupAdminValidator', 'on' => [self::SCENARIO_TRANSFER]],

            [['leaveGroupFlag'], 'required', 'requiredValue' => 1, 'message' => 'Необходимо подтвердить выход из группы', 'on' => [self::SCENARIO_LEAVE]],

            [['disbandGroupFlag'], 'required', 'requiredValue' => 1, 'message' => 'Необходимо подтвердить расформирование группы', 'on' => [self::SCENARIO_DISBAND]],
        ];
    }

    public function clanIdValidator($attribute, $params)
    {
        if (!LigaHelper::checkIfClanExists($this->clanId)) {
            $this->addError($attribute, 'Такого клана не существует');
        }

        if (!LigaHelper::checkIfPlayerIsMemberOfClan(Yii::$app->user->identity->name, $this->clanId)) {
            $this->addError($attribute, 'Вы не являетесь членом клана');
        }
    }

    public function addMembershipValidator($attribute, $params)
    {
        /* @var $existingMembership GroupMember */
        $existingMembership = GroupMember::find()->where(['member' => $this->membershipToAdd])->one();
        if ($existingMembership && $existingMembership->group_id == $this->_group->id) {
            $this->addError($attribute, 'Игрок уже состоит в этой группе');
        } elseif ($existingMembership) {
            $this->addError($attribute, 'Игрок уже состоит в другой группе');
        }

        if (!LigaHelper::checkIfPlayerExists($this->membershipToAdd)) {
            $this->addError($attribute, 'Игрока не существует');
        }
    }

    public function deleteMembershipValidator($attribute, $params)
    {
        $existingMembership = GroupMember::find()->where(['id' => $this->membershipToDelete])->one();
        if (!$existingMembership) {
            $this->addError($attribute, 'Игрок не состоит в этой группе');
        }
    }

    public function newGroupAdminValidator($attribute, $params)
    {
        if ($this->newGroupAdmin == Yii::$app->user->identity->name) {
            $this->addError($attribute, 'Вы и так являетесь администратором этой группы');
        }

        $existingMembership = GroupMember::find()->where(['member' => $this->newGroupAdmin, 'group_id' => $this->_group->id])->one();
        if (!$existingMembership) {
            $this->addError($attribute, 'Игрок не состоит в этой группе');
        }

        $existingPanelUser = User::findByName($this->newGroupAdmin);
        if (!$existingPanelUser) {
            $this->addError($attribute, 'Игрок не имеет доступа к панели управления');
        }
    }

    public function createGroup()
    {
        $newGroup = new Group();
        $newGroup->name = (string)$this->name;
        $newGroup->admin = (string)Yii::$app->user->identity->name;
        $newGroup->clan = (int)$this->clanId;
        $newGroup->date = (string)date('d.m.Y H:i:s');
        $newGroup->save();

        if (!$this->clanId) {
            $newGroup->addMember(Yii::$app->user->identity->name);
        } else {
            $newGroup->fillMembersFromClanSquad($this->clanId);
        }
    }

    public function renameGroup()
    {
        if ($this->name) {
            $this->_group->rename($this->name);
        }
    }

    public function editMembers()
    {
        if ($this->membershipToAdd) {
            $this->_group->addMember($this->membershipToAdd);
        }

        if ($this->membershipToDelete) {
            $this->_group->dropMemberByMembershipId($this->membershipToDelete);
        }
    }

    public function changeGroupAdmin()
    {
        if ($this->newGroupAdmin) {
            $this->_group->transferAdminRights($this->newGroupAdmin);
        }
    }

    public function leaveGroup()
    {
        if ($this->leaveGroupFlag) {
            $this->_group->dropMemberByName(Yii::$app->user->identity->name);
        }
    }

    public function disbandGroup()
    {
        if ($this->disbandGroupFlag) {
            $this->_group->dropAllMembers();
            $this->_group->delete();
        }
    }
}
