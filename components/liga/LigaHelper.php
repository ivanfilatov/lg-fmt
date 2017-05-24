<?php

namespace app\components\liga;


class LigaHelper
{
    public static function getClanList()
    {
        $clanFile = file("http://www.fantasyland.ru/cgi/w.JS");
        $clanIds = explode(", ", mb_substr(iconv("CP1251", "UTF-8", $clanFile[1]), 20, -3));
        $clanNames = explode("', '", mb_substr(iconv("CP1251", "UTF-8", $clanFile[2]), 24, -4));
        $clanGuilds = explode(", ", mb_substr(iconv("CP1251", "UTF-8", $clanFile[4]), 18, -3));
        $clans = [];
        foreach ($clanIds as $position => $id) {
            if ($clanGuilds[$position] == 1) {
                $clans[$id] = $clanNames[$position];
            }
        }

        return $clans;
    }

    public static function checkIfPlayerExists($name)
    {
        $ligaPlayer = iconv("windows-1251", "UTF-8", file_get_contents('http://fantasyland.ru/cgi/pl_info.php?login=' . urlencode(iconv("UTF-8", "windows-1251", $name))));
        if (!preg_match("/Игрока с именем .{1,256} не существует\.$/", $ligaPlayer)) {
            return true;
        }

        return false;
    }

    public static function checkIfClanExists($clanId)
    {
        return count(self::getClanSquadUnparsed($clanId)) > 0;
    }

    public static function checkIfPlayerIsMemberOfClan($name, $clanId)
    {
        return in_array($name, self::getClanSquadNames($clanId));
    }

    public static function getClanSquadNames($clanId)
    {
        $squadUnparsed = self::getClanSquadUnparsed($clanId);
        $squad = [];
        foreach ($squadUnparsed as $memberUnparsed) {
            $squad[] = explode("#", $memberUnparsed)[3];
        }

        return $squad;
    }

    public static function getClanSquadUnparsed($clanId)
    {
        $filename = "http://www.fantasyland.ru/cgi/technical_clan_status.php?clan_id=" . (int)$clanId;
        $f = fopen($filename, "rt");
        $str = fread($f, 10);
        while (!feof($f)) {
            $str .= fread($f, 10);
        }
        fclose($f);
        $str = str_replace(' "', '"', $str);
        $str = str_replace(')"', '"', $str);
        $str = str_replace(')[', '[', $str);
        $str = str_replace(');', ')+', $str);
        $str = substr($str, 0, -1);
        $str = str_replace('")', '"', $str);
        $str = str_replace('w("', '"', $str);
        $str = str_replace('"', '', $str);
        $str = iconv("CP1251", "UTF-8", $str);
        $squad = explode("+", $str);

        return $squad;
    }
}