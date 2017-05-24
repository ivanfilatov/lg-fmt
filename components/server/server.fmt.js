var options = {};

var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server, options);

var redisServer = require("redis");
var redis = redisServer.createClient({password: 'fortistello16'});

var serverExpectedVersion;
redis.get('fmt:_version', function (redisGetError, requiredPluginVersion) {
    serverExpectedVersion = requiredPluginVersion;
    console.log(serverExpectedVersion);
});

var serverGroups;
redis.get('fmt:_groups', function (redisGetError, serverDefinedGroups) {
    serverGroups = JSON.parse(serverDefinedGroups);
    console.log(serverGroups);
});

server.listen(8080);

io.sockets.on('connection', function (player) {
    player.identity = false;
    player.group = 0;
    player.location = false;
    player.pluginVersion = false;

    // CONNECTION
    player.on('pass-connection', function (clientVersion) {
        if (clientVersion) {
            player.pluginVersion = clientVersion;
        }
        player.emit('approve-connection');
    });

    // AUTH
    player.on('pass-identity', function (nickname) {
        if (nickname !== false) {
            player.identity = nickname;
            if (serverGroups[player.identity] && serverGroups[player.identity] > 0) {
                player.group = serverGroups[player.identity];
            }
            player.emit('approve-identity', player.identity);
            console.log('Identified: ' + player.identity + ' (group #' + player.group + ')');
            redis.set('fmt:identities:' + player.identity, player.id);
            redis.set('fmt:versions:' + player.identity, player.pluginVersion);
            logLastActivity(redis, player.identity);

            // check plugin version
            if (player.pluginVersion != serverExpectedVersion) {
                player.emit('reject-connection', 'version_mismatch');
                player.disconnect();
                console.log('Player ' + player.identity + ' has an old version of client plugin (' + player.pluginVersion + ' instead of ' + serverExpectedVersion + '). Disconnected.');
            }
        }
    });

    // PROCESS CHANGE OF NO_COMBAT.PHP
    player.on('pass-location', function (pl, lc, dp) {
        var locationName, locationNameGroup;

        // maze or not
        if (dp !== false && dp !== null) {
            locationName = 'p' + pl + '-l' + lc + '-d' + dp;
        } else {
            locationName = 'p' + pl + '-l' + lc;
        }

        // group location
        if (player.group > 0) {
            locationNameGroup = locationName + '-group_' + player.group;
        }

        // process movement between locations
        if (locationName != player.location) {
            // leave location
            if (player.location) {
                player.leave(player.location);
                if (player.group > 0) {
                    player.leave(player.location + '-group_' + player.group);
                    io.to(player.location + '-group_' + player.group).emit('leave-location', player.identity);
                } else {
                    io.to(player.location).emit('leave-location', player.identity);
                }
            }

            // new location
            player.location = locationName;
            player.join(locationName);
            if (player.group > 0) {
                player.join(locationNameGroup);
            }

            // to redis
            redis.set('fmt:locations:' + player.identity, player.location);

            // report only to group if in group
            if (player.group > 0) {
                io.to(locationNameGroup).emit('join-location', player.identity);
            } else {
                io.to(locationName).emit('join-location', player.identity);
            }
        }
        logLastActivity(redis, player.identity);
        player.emit('approve-location', locationName);
        console.log('Passed location: ' + locationName);
    });

    // PROCESS CELLDATA ON MAZE_REF.PHP
    player.on('pass-celldata', function (pl, lc, dp, xc, yc, data) {
        var locationName, locationNameGroup;

        locationName = 'p' + pl + '-l' + lc + '-d' + dp;
        if (player.group > 0) {
            locationNameGroup = locationName + '-group_' + player.group;
        }

        // process movement between locations
        if (locationName != player.location) {
            // leave location
            if (player.location) {
                player.leave(player.location);
                if (player.group > 0) {
                    player.leave(player.location + '-group_' + player.group);
                    io.to(player.location + '-group_' + player.group).emit('leave-location', player.identity);
                } else {
                    io.to(player.location).emit('leave-location', player.identity);
                }
            }

            // new location
            player.location = locationName;
            player.join(locationName);
            if (player.group > 0) {
                player.join(locationNameGroup);
            }

            // to redis
            redis.set('fmt:locations:' + player.identity, player.location);

            // report only to group if in group
            if (player.group > 0) {
                io.to(locationNameGroup).emit('join-location', player.identity);
            } else {
                io.to(locationName).emit('join-location', player.identity);
            }
        }

        // process and save celldata
        var splitData = data.split('||');
        if (player.group > 0) {
            if (splitData[3]) {
                redis.set('fmt:objectdata:' + locationNameGroup + ':' + xc + 'x' + yc, splitData[3]);
            }
            redis.set('fmt:mazedata:' + locationNameGroup + ':' + xc + 'x' + yc, data);
            io.to(locationNameGroup).emit('recieve-celldata', pl, lc, dp, xc, yc, data, player.identity);
        } else {
            if (splitData[3]) {
                redis.set('fmt:objectdata:' + locationName + ':' + xc + 'x' + yc, splitData[3]);
            }
            redis.set('fmt:mazedata:' + locationName + ':' + xc + 'x' + yc, data);
            io.to(locationName).emit('recieve-celldata', pl, lc, dp, xc, yc, data, player.identity);
        }

        // log activity and send confirmation
        logLastActivity(redis, player.identity);
        player.emit('approve-celldata', pl, lc, dp, xc, yc, data);
        console.log('Passed celldata: ' + locationName + ' - coords ' + xc + 'x' + yc + ' - data ' + data + ' - ' + player.identity);
    });

    player.on('request-mapdata', function (pl, lc, dp) {
        var locationName, locationNameGroup;

        // process general data
        locationName = 'p' + pl + '-l' + lc + '-d' + dp;
        redis.keys('fmt:mazedata:' + locationName + ':*', function (err, cellnames) {
            redis.mget(cellnames, function (err, celldatas) {
                for (var cellcount = 0; cellcount < cellnames.length; cellcount++) {
                    cellnames[cellcount] = cellnames[cellcount].replace('fmt:mazedata:' + locationName + ':', '');
                }
                player.emit('recieve-mapdata', pl, lc, dp, cellnames, celldatas);
            });
        });

        // process group data
        if (player.group > 0) {
            locationNameGroup = locationName + '-group_' + player.group;
            redis.keys('fmt:mazedata:' + locationNameGroup + ':*', function (err, cellnames) {
                redis.mget(cellnames, function (err, celldatas) {
                    for (var cellcount = 0; cellcount < cellnames.length; cellcount++) {
                        cellnames[cellcount] = cellnames[cellcount].replace('fmt:mazedata:' + locationNameGroup + ':', '');
                    }
                    player.emit('recieve-mapdata', pl, lc, dp, cellnames, celldatas);
                });
            });
        }
    });

    /*
     player.on('initiate-combat', function (pl, lc, dp, xc, yc, combatnum) {
     locationName = 'p' + pl + '-l' + lc + '-d' + dp;
     redis.set('fmt:combatdata:' + locationName + ':' + xc + 'x' + yc, combatnum);
     io.to(locationName).emit('recieve-combatdata', pl, lc, dp, xc, yc, combatnum, player.identity);
     logLastActivity(redis, player.identity);
     player.emit('approve-combatdata', pl, lc, dp, xc, yc, combatnum);
     //console.log('Passed combatdata: ' + locationName + ' - coords ' + xc + 'x' + yc + ' - combat ' + combatnum + ' - ' + player.identity);
     });
     */

});

function logLastActivity(r, n) {
    var d = new Date();
    //r.set('fmt:lastactivity:' + n, d.getDay()+'.'+d.getMonth()+'.'+d.getFullYear()+' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds());
    r.set('fmt:lastactivity:' + n, d.toString());
}

//io.sockets.on('disconnect', function (client) {
