var options = {};

var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server, options);

var redisServer = require("redis");
var redis = redisServer.createClient({password: 'fortistello16'});
var serverExpectedVersion = redis.get('fmt:_version');

server.listen(8080);

io.sockets.on('connection', function (player) {
    player.identity = false;
    player.location = false;
    player.pluginVersion = false;

    player.on('pass-connection', function (clientVersion) {
        if (clientVersion) {
            player.pluginVersion = clientVersion;
        }
        //if(clientVersion == serverExpectVersion) {
        player.emit('approve-connection');
        //} else {
        //    player.emit('reject-connection', "version_mismatch");
        //    console.log('Player '+player.id+' has an old version of client plugin. Disconnected.');
        //    player.disconnect();
        //}
    });

    player.on('pass-identity', function (nickname) {
        if (nickname !== false) {
            player.identity = nickname;
            player.emit('approve-identity', player.identity);
            //console.log('Identified: ' + player.identity);
            redis.set('fmt:identities:' + player.identity, player.id);
            redis.set('fmt:versions:' + player.identity, player.pluginVersion);
            logLastActivity(redis, player.identity);
        }
    });

    player.on('pass-location', function (pl, lc, dp) {
        if (dp !== false && dp !== null) {
            locationName = 'p' + pl + '-l' + lc + '-d' + dp;
        } else {
            locationName = 'p' + pl + '-l' + lc;
        }
        if (locationName != player.location) {
            if (player.location) {
                player.leave(player.location);
                io.to(player.location).emit('leave-location', player.identity);
            }
            player.location = locationName;
            player.join(locationName);
            redis.set('fmt:locations:' + player.identity, player.location);
            io.to(locationName).emit('join-location', player.identity);
        }
        logLastActivity(redis, player.identity);
        player.emit('approve-location', locationName);
        //console.log('Passed location: ' + locationName);
    });

    player.on('pass-celldata', function (pl, lc, dp, xc, yc, data) {
        locationName = 'p' + pl + '-l' + lc + '-d' + dp;
        if (locationName != player.location) {
            if (player.location) {
                player.leave(player.location);
                io.to(player.location).emit('leave-location', player.identity);
            }
            player.location = locationName;
            player.join(locationName);
            redis.set('fmt:locations:' + player.identity, player.location);
            io.to(locationName).emit('join-location', player.identity);
        }
        redis.set('fmt:mazedata:' + locationName + ':' + xc + 'x' + yc, data);
        io.to(locationName).emit('recieve-celldata', pl, lc, dp, xc, yc, data, player.identity);
        logLastActivity(redis, player.identity);
        player.emit('approve-celldata', pl, lc, dp, xc, yc, data);
        //console.log('Passed celldata: ' + locationName + ' - coords ' + xc + 'x' + yc + ' - data ' + data + ' - ' + player.identity);
    });

    player.on('request-mapdata', function (pl, lc, dp) {
        locationName = 'p' + pl + '-l' + lc + '-d' + dp;
        redis.keys('fmt:mazedata:' + locationName + ':*', function (err, cellnames) {
            redis.mget(cellnames, function (err, celldatas) {
                for (var cellcount = 0; cellcount < cellnames.length; cellcount++) {
                    cellnames[cellcount] = cellnames[cellcount].replace('fmt:mazedata:' + locationName + ':', '');
                }
                player.emit('recieve-mapdata', pl, lc, dp, cellnames, celldatas);
            });
        });
    });

    player.on('initiate-combat', function (pl, lc, dp, xc, yc, combatnum) {
        locationName = 'p' + pl + '-l' + lc + '-d' + dp;
        redis.set('fmt:combatdata:' + locationName + ':' + xc + 'x' + yc, combatnum);
        io.to(locationName).emit('recieve-combatdata', pl, lc, dp, xc, yc, combatnum, player.identity);
        logLastActivity(redis, player.identity);
        player.emit('approve-combatdata', pl, lc, dp, xc, yc, combatnum);
        //console.log('Passed combatdata: ' + locationName + ' - coords ' + xc + 'x' + yc + ' - combat ' + combatnum + ' - ' + player.identity);
    });

});

function logLastActivity(r, n) {
    var d = new Date();
    //r.set('fmt:lastactivity:' + n, d.getDay()+'.'+d.getMonth()+'.'+d.getFullYear()+' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds());
    r.set('fmt:lastactivity:' + n, d.toString());
}

//io.sockets.on('disconnect', function (client) {
