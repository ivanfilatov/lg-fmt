var IMGPATH = chrome.extension.getURL("img");
var VERSION = '5.51';

Map = {
    NickName: false,

    CurPlace: false,
    CurLocation: false,
    CurPlLocName: '',

    InitStatusChatControls: false,
    InitStatusMapFrame: false,
    ShowStatusMapFrame: false,
    LoadStatusMapData: false,

    InsideMaze: false,
    InsideCombat: false,

    CurDimX: false,
    CurDimY: false,
    CurLevel: false,
    CurCoordX: false,
    CurCoordY: false,
    CurCellData: false,
    CurCellHasItems: false,
    CurCellHasMobs: false,

    CellData: {},

    SocketServer: false,
    InitStatusSocketServer: false,
    NameStatusSocketServer: false,

    // объект запроса
    GetXmlHttp: function () {
        var xmlhttp;
        try {
            xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
        } catch (e) {
            try {
                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (E) {
                xmlhttp = false;
            }
        }
        if (!xmlhttp && typeof XMLHttpRequest != 'undefined') {
            xmlhttp = new XMLHttpRequest();
        }
        return xmlhttp;
    },

    GetGameTime: function () {
        var timeElem = window.top.chat.chinp.document.getElementById('clock');
        return timeElem.innerText.substr(0, 5);
    },

    // функция добавления системных сообщений
    WriteToChat: function (messageText) {
        var parentElem = window.top.chat.chout.document.getElementById('main');
        var timeElem = window.top.chat.chinp.document.getElementById('clock');
        if (parentElem !== undefined && parentElem !== null && timeElem !== undefined && timeElem !== null) {
            var newMessage = window.top.chat.chout.document.createElement('div');
            var curTime = timeElem.innerText.substr(0, 5);
            newMessage.innerHTML = '<font color="555555" size="2">' + '[' + curTime + ']' + '&nbsp;&#8226;FMT&#8226;&nbsp;<i>' + messageText + '</i></font>';
            parentElem.appendChild(newMessage);
        }
    },

    // функции общения с сокет-сервером
    ServerConnect: function () {
        this.SocketServer = io.connect('http://lg.fortis-ts.ru:8080');

        this.SocketServer.on('connect', function () {
            window.top.Map.SocketServer.emit('pass-connection', VERSION);
        });

        this.SocketServer.on('approve-connection', function () {
            window.top.Map.InitStatusSocketServer = true;
            if (window.top.Map.InitStatusChatControls) {
                window.top.Map.WriteToChat('Соединение установлено. Картограф FMT готов к работе.');
            }
            window.top.Map.SocketServer.emit('pass-identity', window.top.Map.NickName);
        });

        this.SocketServer.on('approve-identity', function (identity) {
            window.top.Map.NameStatusSocketServer = true;
        });

        this.SocketServer.on('approve-location', function (location) {
            //console.log('Location passed: ' + location);
        });

        this.SocketServer.on('approve-celldata', function (location) {
            //console.log('Location passed: ' + location);
        });

        this.SocketServer.on('recieve-celldata', function (place, location, level, xcor, ycor, celldata, nickname) {
            if (nickname != window.top.Map.NickName) {
                window.top.Map.CellData['' + place + '-' + location + '-' + level + '_c' + xcor + 'x' + ycor + ''] = celldata;
                window.top.Map.LocatePlayer(xcor, ycor, nickname);
                window.top.Map.StyleCell(place, location, level, xcor, ycor);
            }
        });

        this.SocketServer.on('recieve-mapdata', function (place, location, level, cellnames, celldatas) {
            var cellx;
            var celly;
            for (var cellcount = 0; cellcount < cellnames.length; cellcount++) {
                cellx = cellnames[cellcount].split('x')[0];
                celly = cellnames[cellcount].split('x')[1];
                window.top.Map.CellData['' + place + '-' + location + '-' + level + '_c' + cellx + 'x' + celly + ''] = celldatas[cellcount];
            }
            window.top.Map.LoadMapData(true);
        });

        this.SocketServer.on('join-location', function (player) {
            /*if (player != window.top.Map.NickName) {
             window.top.Map.WriteToChat('Игрок ' + player + ' появился в данной локации.');
             }*/
        });

        this.SocketServer.on('leave-location', function (player) {
            /*if (player != window.top.Map.NickName) {
             window.top.Map.WriteToChat('Игрок ' + player + ' ушел из данной локации.');
             }*/
        });

        this.SocketServer.on('reject-connection', function (message) {
            var alertMessage = 'Сервер разорвал соединение.';
            switch (message) {
                case 'version_mismatch': {
                    alertMessage += ' Версия плагина отличается от требуемой сервером.';
                    break;
                }
                default: {
                    alertMessage += ' Неизвестная ошибка.';
                    break;
                }
            }
            window.top.Map.ShowStatusMapFrame = false;
            window.top.Map.LoadStatusMapData = false;
            window.top.fortismapframe.document.body.innerHTML = this.HTML_LoadingPlaceholder;
            alert(alertMessage);
        });

        this.SocketServer.on('disconnect', function () {
            window.top.Map.InitStatusSocketServer = false;
            window.top.Map.NameStatusSocketServer = false;
            if (window.top.Map.InitStatusChatControls) {
                window.top.Map.WriteToChat('Соединение разорвано, попытка восстановить...');
            }
        });
    },

    // функция инициализации приложения
    Init: function () {
        this.ClearMapFrameSize();
        this.NickName = this.GetNick();
        this.DefineWorldLocation();
        this.ServerConnect();
        this.InitMapFrame();
    },

    // функция, обрабатывающая небоевой фрейм
    ProcessNoCombat: function (fileNoCombat) {
        this.ParseNoCombatFile(fileNoCombat);
        this.LoadStatusMapData = false;

        this.DefineWorldLocation();

        if (!this.InitStatusChatControls) {
            this.InitChatControls();
            this.InitStatusChatControls = true;
        }

        if (this.InsideMaze) {
            this.DrawMap();
            this.ShowMap();
        } else {
            this.LoadStatusMapData = false;
            this.CurLevel = false;
            this.CurDimX = false;
            this.CurDimY = false;
            this.CurCoordX = false;
            this.CurCoordY = false;
            this.CurCellData = false;
            this.CellData = {};
            this.HideMap();
            this.ClearLastKnownPosition();
        }

        if (this.InitStatusChatControls) {
            this.DefineMazeInfo();
        }

        if (this.InitStatusSocketServer && this.NameStatusSocketServer) {
            this.SocketServer.emit('pass-location', this.CurPlace, this.CurLocation, false);
        }
    },

    // функция, обрабатывающая боевой фрейм
    ProcessCombatPanel: function () {
        this.DefineLastKnownPosition();
        this.InsideCombat = true;

        if (!this.InitStatusChatControls) {
            this.InitChatControls();
            this.InitStatusChatControls = true;
        }

        if (this.InsideMaze) {
            if (!this.LoadStatusMapData) {
                this.DrawMap();
                this.ShowMap();
                this.LoadMapData(false);
                this.LocateMe();
            } else {
                this.HideMap();
            }
        } else {
            this.LoadStatusMapData = false;
            this.CurLevel = false;
            this.CurDimX = false;
            this.CurDimY = false;
            this.CurCoordX = false;
            this.CurCoordY = false;
            this.CurCellData = false;
            this.CellData = {};
            this.HideMap();
            this.ClearLastKnownPosition();
        }

        if (this.InitStatusChatControls) {
            this.DefineMazeInfo();
        }

        if (this.InitStatusSocketServer && this.NameStatusSocketServer) {
            this.SocketServer.emit('pass-location', this.CurPlace, this.CurLocation, this.CurLevel);
        }
    },

    ProcessMaze: function (fileMazeRef) {
        var previousPlace = this.CurPlace;
        var previousLocation = this.CurLocation;
        var previousLevel = this.CurLevel;

        this.ParseMazeFile(fileMazeRef);

        if (!this.LoadStatusMapData) {
            this.LoadMapData(false);
        } else {
            if (this.InsideCombat) {
                this.LoadMapData(false);
                this.InsideCombat = false;
            }
        }

        if ((previousLevel !== false && this.CurLevel != previousLevel) ||
            (previousLocation !== false && this.CurLocation != previousLocation) ||
            (previousPlace !== false && this.CurPlace != previousPlace)) {
            this.DrawMap();
            this.LoadMapData(false);
        }

        this.LocateMe();
        this.StyleCell(this.CurPlace, this.CurLocation, this.CurLevel, this.CurCoordX, this.CurCoordY);
        this.SetLastKnownPosition();

        if (this.InitStatusSocketServer && this.NameStatusSocketServer) {
            this.SocketServer.emit('pass-celldata', this.CurPlace, this.CurLocation, this.CurLevel, this.CurCoordX, this.CurCoordY, this.CurCellData);
        }
    },

    DefineWorldLocation: function () {
        this.CurPlace = false;
        this.CurLocation = false;
        this.CurPlLocName = '';
        var xmlhttp = this.GetXmlHttp();
        xmlhttp.open('GET', '/cgi/loc_list.php', false);
        xmlhttp.send(null);
        if (xmlhttp.status == 200) {
            this.CurPlace = xmlhttp.responseText.split(';')[0].split('=')[1];
            this.CurLocation = xmlhttp.responseText.split(';')[1].split('=')[1];

            var t_pl_list = ' ' + this.GetTechPlList();
            var t_loc_list = ' ' + this.GetTechLocList();

            if ((this.CurPlace == 1 && this.CurLocation == 1) || (this.CurPlace == 28)) {
                if (this.CurPlace == 1 && this.CurLocation == 1) {
                    this.CurPlLocName = "Пустошь";
                }
                if (this.CurPlace == 28) {
                    this.CurPlLocName = "Пустота";
                }
            } else {
                //place technical link
                var splitpllist = t_pl_list.split(' ' + this.CurPlace + ' ')[1];
                var symbolP = '';
                var iP = 0;
                var contP = true;
                do {
                    if (iP == splitpllist.split(' ').length - 1) {
                        this.CurPlLocName += splitpllist.split(' ')[iP];
                        contP = false;
                    } else {
                        symbolP = splitpllist.split(' ')[iP + 1][0];
                        if (symbolP == '0' || symbolP == '1' || symbolP == '2' || symbolP == '3' || symbolP == '4' || symbolP == '5' || symbolP == '6' || symbolP == '7' || symbolP == '8' || symbolP == '9') {
                            this.CurPlLocName += splitpllist.split(' ')[iP];
                            contP = false;
                        } else {
                            this.CurPlLocName += splitpllist.split(' ')[iP];
                            if (symbolP === undefined) {
                                contP = false;
                            }
                            iP++;
                        }
                    }

                    if (contP) {
                        this.CurPlLocName += ' ';
                    } else {
                        this.CurPlLocName += ': ';
                    }
                } while (contP);

                //location technical link
                var splitloclist = t_loc_list.split(' ' + this.CurLocation + ' ' + this.CurPlace + ' ')[1];
                var symbolL = '';
                var iL = 0;
                var contL = true;
                do {
                    symbolL = splitloclist.split(' ')[iL + 1][0];
                    if (symbolL == '0' || symbolL == '1' || symbolL == '2' || symbolL == '3' || symbolL == '4' || symbolL == '5' || symbolL == '6' || symbolL == '7' || symbolL == '8' || symbolL == '9') {
                        this.CurPlLocName += splitloclist.split(' ')[iL];
                        contL = false;
                    } else {
                        this.CurPlLocName += splitloclist.split(' ')[iL];
                        iL++;
                    }
                    if (contL) {
                        this.CurPlLocName += ' ';
                    }
                } while (contL);
            }
        }
    },

    // функция инициализирует фрейм над чатом с контроль-элементами
    InitChatControls: function () {
        window.top.chat.document.documentElement.getElementsByTagName('frameset')[0].setAttribute('rows', '36,*,32,0,0,0,0');
        if (window.top.chat.document.documentElement.getElementsByTagName('frameset')[0].children.length == 6) {
            var controlsElem = window.top.chat.document.createElement('frame');
            controlsElem.id = 'fortismapcontrols';
            controlsElem.name = 'fortismapcontrols';
            window.top.chat.document.documentElement.getElementsByTagName('frameset')[0].insertBefore(controlsElem, window.top.chat.document.documentElement.getElementsByTagName('frameset')[0].children[0]);
            if (this.InitStatusSocketServer) {
                window.top.chat.fortismapcontrols.document.body.style.backgroundImage = "url(http://fantasyland.ru/images/grey.gif)";
            } else {
                window.top.chat.fortismapcontrols.document.body.style.backgroundColor = "red";
            }

            var cssId = 'fmt-css-file-ctrl';
            if (!window.top.chat.fortismapcontrols.document.getElementById(cssId)) {
                var headElem = window.top.chat.fortismapcontrols.document.getElementsByTagName('head')[0];
                var styleElem = window.top.chat.fortismapcontrols.document.createElement('style');
                styleElem.id = cssId;
                styleElem.innerHTML = this.CSS_Controls;
                headElem.appendChild(styleElem);
            }
        }

        window.top.chat.fortismapcontrols.document.body.innerHTML = this.HTML_Controls;

        if (!this.InitStatusSocketServer) {
            window.top.chat.fortismapcontrols.document.getElementById('fmt-ctrl-title').innerHTML = 'Картограф FMT v. ' + VERSION + ' (offline)';
        } else {
            this.WriteToChat('Соединение установлено. Картограф FMT готов к работе.');
        }

        window.top.chat.fortismapcontrols.document.getElementById('fmt-scrbar-1').onclick = function () {
            window.top.loc.inv_snd.location.href = '/cgi/inv_wear.php?id=588';
            return false;
        };
        window.top.chat.fortismapcontrols.document.getElementById('fmt-scrbar-2').onclick = function () {
            window.top.loc.inv_snd.location.href = '/cgi/inv_wear.php?id=586';
            return false;
        };
        window.top.chat.fortismapcontrols.document.getElementById('fmt-scrbar-3').onclick = function () {
            window.top.loc.inv_snd.location.href = '/cgi/inv_wear.php?id=589';
            return false;
        };
        window.top.chat.fortismapcontrols.document.getElementById('fmt-scrbar-4').onclick = function () {
            window.top.loc.inv_snd.location.href = '/cgi/inv_wear.php?id=587';
            return false;
        };
        window.top.chat.fortismapcontrols.document.getElementById('fmt-scrbar-5').onclick = function () {
            window.top.loc.inv_snd.location.href = '/cgi/inv_wear.php?id=590';
            return false;
        };
        window.top.chat.fortismapcontrols.document.getElementById('fmt-scrbar-6').onclick = function () {
            window.top.loc.inv_snd.location.href = '/cgi/inv_wear.php?id=591';
            return false;
        };
        window.top.chat.fortismapcontrols.document.getElementById('fmt-scrbar-7').onclick = function () {
            window.top.loc.inv_snd.location.href = '/cgi/inv_wear.php?id=592';
            return false;
        };

        //window.top.chat.fortismapcontrols.document.getElementById('fmt-usebar-1').onclick = function() {window.top.loc.inv_snd.location.href='/cgi/inv_wear.php?id=133010'; return false;};
        //window.top.chat.fortismapcontrols.document.getElementById('fmt-usebar-2').onclick = function() {window.top.loc.inv_snd.location.href='/cgi/inv_wear.php?id=130803'; return false;};
        //window.top.chat.fortismapcontrols.document.getElementById('fmt-usebar-3').onclick = function() {window.top.loc.inv_snd.location.href='/cgi/inv_wear.php?id=130806'; return false;};
        //window.top.chat.fortismapcontrols.document.getElementById('fmt-usebar-4').onclick = function() {window.top.loc.inv_snd.location.href='/cgi/inv_wear.php?id=130809'; return false;};
        //window.top.chat.fortismapcontrols.document.getElementById('fmt-usebar-5').onclick = function() {window.top.loc.inv_snd.location.href='/cgi/inv_wear.php?id=130812'; return false;};
        //window.top.chat.fortismapcontrols.document.getElementById('fmt-usebar-6').onclick = function() {window.top.loc.inv_snd.location.href='/cgi/inv_wear.php?id=130110'; return false;};

        window.top.chat.fortismapcontrols.document.getElementById('fmt-size-def').onclick = function () {
            window.top.fortismapframe.document.getElementById('fmt-main-table').classList.remove('fmt-xl');
            window.top.fortismapframe.document.getElementById('fmt-main-table').classList.remove('fmt-xxl');
            return false;
        };
        window.top.chat.fortismapcontrols.document.getElementById('fmt-size-xl').onclick = function () {
            window.top.fortismapframe.document.getElementById('fmt-main-table').classList.add('fmt-xl');
            window.top.fortismapframe.document.getElementById('fmt-main-table').classList.remove('fmt-xxl');
            return false;
        };
        window.top.chat.fortismapcontrols.document.getElementById('fmt-size-xxl').onclick = function () {
            window.top.fortismapframe.document.getElementById('fmt-main-table').classList.remove('fmt-xl');
            window.top.fortismapframe.document.getElementById('fmt-main-table').classList.add('fmt-xxl');
            return false;
        };

        window.top.chat.fortismapcontrols.document.getElementById('fmt-hidebtn').onclick = function () {
            window.top.Map.HideMap();
            return false;
        };
        window.top.chat.fortismapcontrols.document.getElementById('fmt-unhidebtn').onclick = function () {
            window.top.Map.ShowMap();
            return false;
        };
        window.top.chat.fortismapcontrols.document.getElementById('fmt-reloadbtn').onclick = function () {
            window.top.Map.ReloadMap();
            return false;
        };
    },

    // функция инициализирует фрейм с картой
    InitMapFrame: function () {
        var mainFrame = window.top.document.getElementsByTagName('frameset')[0];
        var mapFrame = '<frame name="fortismapframe" id="fortismapframe" scrolling="yes">';
        window.top.document.getElementsByTagName('frameset')[0].outerHTML = '<frameset name="topframeset" id="topframeset" cols="*" scrolling="yes">\n' + mainFrame.outerHTML + '\n' + mapFrame + '\n</frameset>';
        window.top.fortismapframe.document.body.style.backgroundImage = 'url("http://fantasyland.ru/images/pic/bg.jpg")';
        window.top.fortismapframe.document.body.style.color = "#FFFFFF";
        window.top.fortismapframe.document.body.innerHTML = this.HTML_LoadingPlaceholder;
        this.InitStatusMapFrame = true;
        this.ShowStatusMapFrame = false;
    },

    // функция рисует базовую раскладку карты
    DrawMap: function () {
        // start table
        var mapTable = '\
<div id="fmt-hidestatus" style="display:none;">visible</div>\
<center><h3 id="fmt-mapname">' + this.CurPlLocName + '</h3>\
<hr />\
<h4>Этаж: <span id="fmt-floor">#</span>. Координаты: <span id="fmt-corx">#</span> x <span id="fmt-cory">#</span></h4>\
<hr />\
<table cellspacing="0" class="fmt" id="fmt-main-table">\
';

        // rows
        var xgrid;
        for (var y = 0; y <= this.CurDimY + 1; y++) {
            //top grid
            if (y == 0) {
                mapTable += '<tr><td class="fmt-grid"></td>';
                for (xgrid = 1; xgrid <= this.CurDimX; xgrid++) {
                    mapTable += '<td class="fmt-grid">' + xgrid + '</td>';
                }
                mapTable += '<td class="fmt-grid"></td></tr>\n';
            }
            //cells
            if (y > 0 && y <= this.CurDimY) {
                mapTable += '<tr><td class="fmt-grid">' + y + '</td>';
                for (var x = 1; x <= this.CurDimX; x++) {
                    mapTable += '<td id="c' + x + 'x' + y + '" title="' + x + 'x' + y + '"></td>';
                }
                mapTable += '<td class="fmt-grid">' + y + '</td></tr>\n';
            }
            //bottom grid
            if (y == this.CurDimY + 1) {
                mapTable += '<tr><td class="fmt-grid"></td>';
                for (xgrid = 1; xgrid <= this.CurDimX; xgrid++) {
                    mapTable += '<td class="fmt-grid">' + xgrid + '</td>';
                }
                mapTable += '<td class="fmt-grid"></td></tr>\n';
            }
        }

        mapTable += '</table>\n</center>';
        // end table

        window.top.fortismapframe.document.body.innerHTML = this.CSS_Map + '\n' + mapTable;

        if (window.top.loc.no_combat !== null && window.top.loc.no_combat !== undefined) {
            window.top.loc.no_combat.document.documentElement.onkeyup = function (e) {
                e.which = e.which || e.keyCode;
                if (e.which == 13) {
                    var clickElem = window.top.loc.no_combat.document.querySelector('#picks table td img');
                    if (clickElem !== undefined && clickElem !== null) {
                        window.top.loc.no_combat.document.querySelector('#picks table td img').click();
                    }
                }
                return false;
            };
        }

        this.SetMapFrameSize(Math.min(16 * this.CurDimX, 650));
    },

    HideMap: function () {
        this.ShowStatusMapFrame = false;
        this.SetMapFrameSize(window.top.fortismapframe.document.body.clientWidth);
        window.top.document.getElementsByTagName('frameset')[0].setAttribute('cols', '*');
        if (!this.LoadStatusMapData) {
            window.top.fortismapframe.document.body.innerHTML = this.HTML_LoadingPlaceholder;
        }
    },

    ShowMap: function () {
        this.ShowStatusMapFrame = true;
        if (window.top.document.getElementsByTagName('frameset')[0].getAttribute('cols') == '*') {
            window.top.document.getElementsByTagName('frameset')[0].setAttribute('cols', '*,' + this.GetMapFrameSize());
        } //resize only if 0-width
    },

    ReloadMap: function () {
        this.ShowStatusMapFrame = false;
        this.LoadStatusMapData = false;
        window.top.fortismapframe.document.body.innerHTML = this.HTML_LoadingPlaceholder;
        if (this.InitStatusSocketServer) {
            if (window.top.loc.no_combat !== null && window.top.loc.no_combat !== undefined) {
                window.top.loc.no_combat.location.reload();
            } else {
                window.top.loc.location.reload();
            }
        } else {
            window.location.reload();
        }
        this.DefineMazeInfo();
    },

    CenterMap: function (myPointElement) {
        var fmtTable = window.top.fortismapframe.document.getElementById('fmt-main-table');
        var fmtTableOffsetLeft = fmtTable.offsetLeft;
        var fmtTableOffsetTop = fmtTable.offsetTop;
        var meElemOffsetLeft = myPointElement.offsetLeft;
        var meElemOffsetTop = myPointElement.offsetTop;
        var meElemWidth = myPointElement.offsetWidth;
        var meElemHeight = myPointElement.offsetHeight;
        var frameElemWidth = window.top.fortismapframe.innerWidth;
        var frameElemHeight = window.top.fortismapframe.innerHeight;
        var scrollToX = meElemOffsetLeft - (frameElemWidth - meElemWidth) / 2 + fmtTableOffsetLeft;
        var scrollToY = meElemOffsetTop - (frameElemHeight - meElemHeight) / 2 + fmtTableOffsetTop;
        window.top.fortismapframe.scrollTo(scrollToX, scrollToY);
    },

    LoadMapData: function (styleOnly) {
        if (styleOnly) {
            for (var y = 1; y <= this.CurDimY; y++) {
                for (var x = 1; x <= this.CurDimX; x++) {
                    this.StyleCell(this.CurPlace, this.CurLocation, this.CurLevel, x, y);
                }
            }
            this.LoadStatusMapData = true;
        } else {
            window.top.Map.SocketServer.emit('request-mapdata', this.CurPlace, this.CurLocation, this.CurLevel);
        }
    },

    StyleCell: function (pl, loc, fl, x, y) {
        var cellData = this.CellData['' + pl + '-' + loc + '-' + fl + '_c' + x + 'x' + y + ''];

        var nearx, neary;

        var cell = false;
        var time = false;
        var cellowner = false;
        var cellold = false;
        var cellobj = '';
        if (cellData) {
            var splitCellData = cellData.split('||');
            cell = splitCellData[0];
            time = splitCellData[1];
            cellowner = splitCellData[2];
            var celltime = time.split('-')[1];
            var cellhour = parseInt(time.split('-')[1].split(':')[0]);
            var currhour = parseInt(this.GetGameTime().split(':')[0]);
            if (cellhour < currhour || (cellhour >= 4 && cellhour <= 23 && currhour >= 0 && currhour <= 3)) {
                cellold = true;
            }
            if (splitCellData[3]) {
                cellobj = "\nОбъект: " + splitCellData[3];
            }
        }

        if (cell) {
            var mapCell = window.top.fortismapframe.document.getElementById('c' + x + 'x' + y);
            // serve cell as discovered only if no such class already applied
            if (!mapCell.classList.contains('fmt-dc') && !mapCell.classList.contains('fmt-dc-mob') && !mapCell.classList.contains('fmt-dc-loot')) {
                if (cellold) {
                    mapCell.classList.add('fmt-dc-old');
                } else {
                    mapCell.classList.remove('fmt-dc-old');
                    mapCell.classList.add('fmt-dc');
                }
            }

            if (mapCell.classList.contains('fmt-dc') && mapCell.classList.contains('fmt-dc-old')) {
                mapCell.classList.remove('fmt-dc-old');
            }

            //trap
            if (cell[0] == '1') {
                if (mapCell.classList.contains('fmt-me')) {
                    mapCell.classList.remove('fmt-me');
                    mapCell.classList.remove('fmt-trap'); // remove if already placed...
                    mapCell.classList.add('fmt-me-trap');
                } else {
                    if (mapCell.classList.contains('fmt-pl')) {
                        mapCell.classList.remove('fmt-me');
                        mapCell.classList.remove('fmt-trap');
                        mapCell.classList.add('fmt-pl-trap');
                    } else {
                        if (!mapCell.classList.contains('fmt-me-trap')) {
                            mapCell.classList.add('fmt-trap');
                        }
                    }
                }
            }
            //flag
            if (cell[1] == '1') {
                if (mapCell.classList.contains('fmt-me')) {
                    mapCell.classList.remove('fmt-me');
                    mapCell.classList.remove('fmt-flag'); // remove if already placed...
                    mapCell.classList.add('fmt-me-flag');
                } else {
                    if (mapCell.classList.contains('fmt-pl')) {
                        mapCell.classList.remove('fmt-me');
                        mapCell.classList.remove('fmt-flag');
                        mapCell.classList.add('fmt-pl-flag');
                    } else {
                        if (!mapCell.classList.contains('fmt-me-flag')) {
                            mapCell.classList.add('fmt-flag');
                        }
                    }
                }
            }
            //object
            if (cell[2] == '1') {
                if (mapCell.classList.contains('fmt-me')) {
                    mapCell.classList.remove('fmt-me');
                    mapCell.classList.remove('fmt-object'); // remove if already placed...
                    mapCell.classList.add('fmt-me-object');
                } else {
                    if (mapCell.classList.contains('fmt-pl')) {
                        mapCell.classList.remove('fmt-me');
                        mapCell.classList.remove('fmt-object');
                        mapCell.classList.add('fmt-pl-object');
                    } else {
                        if (!mapCell.classList.contains('fmt-me-object')) {
                            mapCell.classList.add('fmt-object');
                        }
                    }
                }
            }
            //up
            if (cell[3] == '1') {
                if (mapCell.classList.contains('fmt-me')) {
                    mapCell.classList.remove('fmt-me');
                    mapCell.classList.remove('fmt-up'); // remove if already placed...
                    mapCell.classList.add('fmt-me-up');
                } else {
                    if (mapCell.classList.contains('fmt-pl')) {
                        mapCell.classList.remove('fmt-me');
                        mapCell.classList.remove('fmt-up');
                        mapCell.classList.add('fmt-pl-up');
                    } else {
                        if (!mapCell.classList.contains('fmt-me-up')) {
                            mapCell.classList.add('fmt-up');
                        }
                    }
                }
            }
            //down
            if (cell[4] == '1') {
                if (mapCell.classList.contains('fmt-me')) {
                    mapCell.classList.remove('fmt-me');
                    mapCell.classList.remove('fmt-down'); // remove if already placed...
                    mapCell.classList.add('fmt-me-down');
                } else {
                    if (mapCell.classList.contains('fmt-pl')) {
                        mapCell.classList.remove('fmt-me');
                        mapCell.classList.remove('fmt-down');
                        mapCell.classList.add('fmt-pl-down');
                    } else {
                        if (!mapCell.classList.contains('fmt-me-down')) {
                            mapCell.classList.add('fmt-down');
                        }
                    }
                }
            }
            //exit
            if (cell[5] == '1') {
                if (mapCell.classList.contains('fmt-me') || mapCell.classList.contains('fmt-me-exit')) {
                    mapCell.classList.remove('fmt-me');
                    mapCell.classList.remove('fmt-exit'); // remove if already placed...
                    mapCell.classList.add('fmt-me-exit');
                } else {
                    if (mapCell.classList.contains('fmt-pl')) {
                        mapCell.classList.remove('fmt-me');
                        mapCell.classList.remove('fmt-exit');
                        mapCell.classList.add('fmt-pl-exit');
                    } else {
                        if (!mapCell.classList.contains('fmt-me-exit')) {
                            mapCell.classList.add('fmt-exit');
                        }
                    }
                }
            }
            //way-north
            nearx = parseInt(x);
            neary = parseInt(y) - 1;
            mapCell.classList.add('fmt-n-' + cell[6]);
            if (nearx > 0 && neary > 0 && nearx <= this.CurDimX && neary <= this.CurDimY) {
                window.top.fortismapframe.document.getElementById('c' + nearx + 'x' + neary).classList.add('fmt-s-' + cell[6]);
            }
            //way-west
            nearx = parseInt(x) - 1;
            neary = parseInt(y);
            mapCell.classList.add('fmt-w-' + cell[7]);
            if (nearx > 0 && neary > 0 && nearx <= this.CurDimX && neary <= this.CurDimY) {
                window.top.fortismapframe.document.getElementById('c' + nearx + 'x' + neary).classList.add('fmt-e-' + cell[7]);
            }
            //way-east
            nearx = parseInt(x) + 1;
            neary = parseInt(y);
            mapCell.classList.add('fmt-e-' + cell[8]);
            if (nearx > 0 && neary > 0 && nearx <= this.CurDimX && neary <= this.CurDimY) {
                window.top.fortismapframe.document.getElementById('c' + nearx + 'x' + neary).classList.add('fmt-w-' + cell[8]);
            }
            //way-south
            nearx = parseInt(x);
            neary = parseInt(y) + 1;
            mapCell.classList.add('fmt-s-' + cell[9]);
            if (nearx > 0 && neary > 0 && nearx <= this.CurDimX && neary <= this.CurDimY) {
                window.top.fortismapframe.document.getElementById('c' + nearx + 'x' + neary).classList.add('fmt-n-' + cell[9]);
            }

            if (celltime && cellowner) {
                mapCell.setAttribute('title', '' + x + 'x' + y + ' (' + celltime + ', ' + cellowner + ')' + cellobj);
            }
        }
    },

    LocateMe: function () {
        window.top.fortismapframe.document.getElementById('fmt-corx').innerHTML = this.CurCoordX;
        window.top.fortismapframe.document.getElementById('fmt-cory').innerHTML = this.CurCoordY;
        window.top.fortismapframe.document.getElementById('fmt-floor').innerHTML = this.CurLevel;

        var myPointElem = window.top.fortismapframe.document.getElementById('c' + this.CurCoordX + 'x' + this.CurCoordY);
        this.CenterMap(myPointElem);

        // clear my point
        if (window.top.fortismapframe.document.getElementsByClassName('fmt-me')[0] !== undefined) {
            window.top.fortismapframe.document.getElementsByClassName('fmt-me')[0].classList.remove('fmt-me');
        }
        if (window.top.fortismapframe.document.getElementsByClassName('fmt-me-trap')[0] !== undefined) {
            window.top.fortismapframe.document.getElementsByClassName('fmt-me-trap')[0].classList.add('fmt-trap');
            window.top.fortismapframe.document.getElementsByClassName('fmt-me-trap')[0].classList.remove('fmt-me-trap');
        }
        if (window.top.fortismapframe.document.getElementsByClassName('fmt-me-flag')[0] !== undefined) {
            window.top.fortismapframe.document.getElementsByClassName('fmt-me-flag')[0].classList.add('fmt-flag');
            window.top.fortismapframe.document.getElementsByClassName('fmt-me-flag')[0].classList.remove('fmt-me-flag');
        }
        if (window.top.fortismapframe.document.getElementsByClassName('fmt-me-object')[0] !== undefined) {
            window.top.fortismapframe.document.getElementsByClassName('fmt-me-object')[0].classList.add('fmt-object');
            window.top.fortismapframe.document.getElementsByClassName('fmt-me-object')[0].classList.remove('fmt-me-object');
        }
        if (window.top.fortismapframe.document.getElementsByClassName('fmt-me-up')[0] !== undefined) {
            window.top.fortismapframe.document.getElementsByClassName('fmt-me-up')[0].classList.add('fmt-up');
            window.top.fortismapframe.document.getElementsByClassName('fmt-me-up')[0].classList.remove('fmt-me-up');
        }
        if (window.top.fortismapframe.document.getElementsByClassName('fmt-me-down')[0] !== undefined) {
            window.top.fortismapframe.document.getElementsByClassName('fmt-me-down')[0].classList.add('fmt-down');
            window.top.fortismapframe.document.getElementsByClassName('fmt-me-down')[0].classList.remove('fmt-me-down');
        }
        if (window.top.fortismapframe.document.getElementsByClassName('fmt-me-exit')[0] !== undefined) {
            window.top.fortismapframe.document.getElementsByClassName('fmt-me-exit')[0].classList.add('fmt-exit');
            window.top.fortismapframe.document.getElementsByClassName('fmt-me-exit')[0].classList.remove('fmt-me-exit');
        }

        // place my new point
        if (window.top.fortismapframe.document.getElementsByClassName('fmt-me')[0] === undefined) {
            myPointElem.classList.add('fmt-me');

            if (this.CurCellHasItems || this.CurCellHasMobs) {
                if (this.CurCellHasItems) {
                    myPointElem.classList.remove('fmt-dc');
                    myPointElem.classList.add('fmt-dc-loot');
                }
                if (this.CurCellHasMobs) {
                    myPointElem.classList.remove('fmt-dc');
                    myPointElem.classList.remove('fmt-dc-loot');
                    myPointElem.classList.add('fmt-dc-mob');
                }
            } else {
                myPointElem.classList.remove('fmt-dc-loot');
                myPointElem.classList.remove('fmt-dc-mob');
                if (!myPointElem.classList.contains('fmt-dc-old')) {
                    myPointElem.classList.remove('fmt-dc-old');
                }
                if (!myPointElem.classList.contains('fmt-dc')) {
                    myPointElem.classList.add('fmt-dc');
                }
            }
        }
    },

    LocatePlayer: function (xcor, ycor, nickname) {
        // clear player point
        var fmtPl = window.top.fortismapframe.document.querySelector('.fmt-pl[data-player="' + nickname + '"]');
        var fmtPlTrap = window.top.fortismapframe.document.querySelector('.fmt-pl-trap[data-player="' + nickname + '"]');
        var fmtPlFlag = window.top.fortismapframe.document.querySelector('.fmt-pl-flag[data-player="' + nickname + '"]');
        var fmtPlUp = window.top.fortismapframe.document.querySelector('.fmt-pl-up[data-player="' + nickname + '"]');
        var fmtPlDown = window.top.fortismapframe.document.querySelector('.fmt-pl-down[data-player="' + nickname + '"]');
        var fmtPlExit = window.top.fortismapframe.document.querySelector('.fmt-pl-exit[data-player="' + nickname + '"]');
        if (fmtPl !== undefined && fmtPl !== null) {
            fmtPl.classList.remove('fmt-pl');
            fmtPl.removeAttribute('data-player');
        }
        if (fmtPlTrap !== undefined && fmtPlTrap !== null) {
            fmtPlTrap.classList.add('fmt-trap');
            fmtPlTrap.classList.remove('fmt-pl-trap');
            fmtPl.removeAttribute('data-player');
        }
        if (fmtPlFlag !== undefined && fmtPlFlag !== null) {
            fmtPlFlag.classList.add('fmt-flag');
            fmtPlFlag.classList.remove('fmt-pl-flag');
            fmtPl.removeAttribute('data-player');
        }
        if (fmtPlFlag !== undefined && fmtPlFlag !== null) {
            fmtPlFlag.classList.add('fmt-object');
            fmtPlFlag.classList.remove('fmt-pl-object');
            fmtPl.removeAttribute('data-player');
        }
        if (fmtPlUp !== undefined && fmtPlUp !== null) {
            fmtPlUp.classList.add('fmt-up');
            fmtPlUp.classList.remove('fmt-pl-up');
            fmtPl.removeAttribute('data-player');
        }
        if (fmtPlDown !== undefined && fmtPlDown !== null) {
            fmtPlDown.classList.add('fmt-down');
            fmtPlDown.classList.remove('fmt-pl-down');
            fmtPl.removeAttribute('data-player');
        }
        if (fmtPlExit !== undefined && fmtPlExit !== null) {
            fmtPlExit.classList.add('fmt-exit');
            fmtPlExit.classList.remove('fmt-pl-exit');
            fmtPl.removeAttribute('data-player');
        }

        // place player new point
        var fmtPlOld = window.top.fortismapframe.document.querySelector('.fmt-pl[data-player="' + nickname + '"]');
        var fmtPlNew = window.top.fortismapframe.document.getElementById('c' + xcor + 'x' + ycor);
        if (fmtPlOld === undefined || fmtPlOld === null) {
            fmtPlNew.classList.add('fmt-pl');
            fmtPlNew.setAttribute('data-player', nickname);
        }
    },

    /* parsing functions */
    ParseNoCombatFile: function (noCombatFile) {
        if (noCombatFile.indexOf('var maxX=') != -1 && noCombatFile.indexOf(', maxY=') != -1) {
            this.InsideMaze = true;
            this.CurDimX = parseInt(noCombatFile.split('var maxX=')[1].split(',')[0]);
            this.CurDimY = parseInt(noCombatFile.split(', maxY=')[1].split(';')[0]);
        } else {
            this.InsideMaze = false;
            this.CurDimX = false;
            this.CurDimY = false;
        }
    },

    ParseMazeFile: function (mazeFile) {
        var mazeFileStrWS = mazeFile.substr(mazeFile.indexOf('{') + 1, mazeFile.indexOf('}') - mazeFile.indexOf('{'));
        var mazeFileStr = mazeFileStrWS.replace(/\s/g, '');
        var mazeFileArr = mazeFileStr.split(';');

        var trap = 0;
        var object = 0;
        var x;
        var y;
        var lvl;
        var flag = 0;
        var up = 0;
        var down = 0;
        var exit = 0;
        var move_n = 0;
        var move_w = 0;
        var move_e = 0;
        var move_s = 0;
        var items = false;
        var mobs = false;

        var objectRegex = /<TD>';strDiv\+='<b>(.*)<\/b><\/TD>/g;
        var objectInfo = false;

        var moofuncstr = mazeFileArr[mazeFileArr.length - 3];
        var moofunc = moofuncstr.substr(4, moofuncstr.length - 5).split(',');
        x = moofunc[1];
        y = moofunc[2];
        lvl = moofunc[0];

        if (mazeFileStr.indexOf('trap') != -1 || moofunc[4] == "true") {
            trap = 1;
        }
        if (mazeFileArr[0].split(',')[1] == 'true') {
            flag = 1;
        }
        if (mazeFileArr[3].split(',')[2] == '\'5\'') {
            up = 1;
        }
        if (mazeFileArr[8].split(',')[2] == '\'6\'') {
            down = 1;
        }
        if (mazeFileArr[1].split(',')[2] == '\'7\'') {
            exit = 1;
        }
        if (mazeFileStr.indexOf('Вещитут:') != -1) {
            items = true;
        }
        if (mazeFileStr.indexOf('Мобытут:') != -1) {
            mobs = true;
        }
        if (mazeFileStr.indexOf('Вынаходите:') != -1) {
            if (mazeFileStr.indexOf('Портал') != -1 || mazeFileStr.indexOf('Капище') != -1) {
                objectInfo = objectRegex.exec(mazeFileStrWS);
                if (objectInfo.length > 1) {
                    objectInfo = objectInfo[1];
                } else {
                    objectInfo = false;
                }
                exit = 1;
            } else {
                objectInfo = objectRegex.exec(mazeFileStrWS);
                if (objectInfo.length > 1) {
                    objectInfo = objectInfo[1];
                } else {
                    objectInfo = false;
                }
                object = 1;
            }
        }

        if (mazeFileArr[2][0] == 'a') {
            move_n = this.ParseMove(mazeFileArr[2].split(',')[3].substr(1, mazeFileArr[2].split(',')[3].length - 7));
        }
        if (mazeFileArr[4][0] == 'a') {
            move_w = this.ParseMove(mazeFileArr[4].split(',')[3].substr(1, mazeFileArr[4].split(',')[3].length - 7));
        }
        if (mazeFileArr[5][0] == 'a') {
            move_e = this.ParseMove(mazeFileArr[5].split(',')[3].substr(1, mazeFileArr[5].split(',')[3].length - 7));
        }
        if (mazeFileArr[7][0] == 'a') {
            move_s = this.ParseMove(mazeFileArr[7].split(',')[3].substr(1, mazeFileArr[7].split(',')[3].length - 7));
        }

        this.CurCoordX = x;
        this.CurCoordY = y;
        this.CurLevel = lvl;
        var timestamp = 'h-' + this.GetGameTime();
        this.CurCellData = '' + trap + '' + flag + '' + object + '' + up + '' + down + '' + exit + '' + move_n + '' + move_w + '' + move_e + '' + move_s + '||' + timestamp + '||' + this.NickName + (objectInfo ? '||' + objectInfo : '');
        if (items) {
            this.CurCellHasItems = true;
        } else {
            this.CurCellHasItems = false;
        }
        if (mobs) {
            this.CurCellHasMobs = true;
        } else {
            this.CurCellHasMobs = false;
        }
        this.CellData['' + this.CurPlace + '-' + this.CurLocation + '-' + this.CurLevel + '_c' + this.CurCoordX + 'x' + this.CurCoordY + ''] = this.CurCellData;
    },

    ParseMove: function (moveStr) {
        var move;
        switch (moveStr) {
            case 'go2': {
                move = 2;
                break;
            } // red
            case 'go3': {
                move = 3;
                break;
            } // green
            case 'go4': {
                move = 4;
                break;
            } // blue
            case 'go5': {
                move = 5;
                break;
            } // white
            case 'go6': {
                move = 6;
                break;
            } // metal
            case 'go7': {
                move = 7;
                break;
            } // gold
            case 'go8': {
                move = 8;
                break;
            } // mithril
            case 'go9': {
                move = 9;
                break;
            } // ??
            case 'go10': {
                move = 'a';
                break;
            } // simple
            case 'go11': {
                move = 'b';
                break;
            } // bone ?
            case 'go12': {
                move = 'c';
                break;
            } // crystal
            default: {
                move = 1;
                break;
            }
        }

        return move;
    },
    /* parsing functions end */

    /* player parameters functions */
    GetNick: function () {
        var nick = localStorage.getItem('fmt-nick');
        if (nick === null) {
            this.DefineNick();
        } else {
            return nick;
        }
        return this.GetNick();
    },
    DefineNick: function () {
        var xmlhttp = this.GetXmlHttp();
        xmlhttp.open('GET', '/cgi/ch_who.php', false);
        xmlhttp.send(null);
        if (xmlhttp.status == 200) {
            var resp = xmlhttp.responseText;
            localStorage.setItem('fmt-nick', resp.split('var plLogin=\'')[1].split('\'')[0]);
        }
    },
    /* player parameters functions end */

    /* location parameters */
    GetTechLocList: function () {
        var techLocList = localStorage.getItem('fmt-tech_loc_list');
        if (techLocList === null) {
            this.DefineTechLocList();
        } else {
            return techLocList;
        }
        return this.GetTechLocList();
    },
    SetTechLocList: function (value) {
        localStorage.setItem('fmt-tech_loc_list', value);
    },
    DefineTechLocList: function () {
        var xmlhttp = this.GetXmlHttp();
        xmlhttp.open('GET', '/cgi/technical_loc_list.php', false);
        xmlhttp.send(null);
        if (xmlhttp.status == 200) {
            this.SetTechLocList(xmlhttp.responseText);
        }
        return xmlhttp.responseText;
    },
    ClearTechLocList: function () {
        localStorage.removeItem('fmt-tech_loc_list');
    },
    GetTechPlList: function () {
        var techPlList = localStorage.getItem('fmt-tech_pl_list');
        if (techPlList === null) {
            this.DefineTechPlList();
        } else {
            return techPlList;
        }
        return this.GetTechPlList();
    },
    SetTechPlList: function (value) {
        localStorage.setItem('fmt-tech_pl_list', value);
    },
    DefineTechPlList: function () {
        var xmlhttp = this.GetXmlHttp();
        xmlhttp.open('GET', '/cgi/technical_place_list.php', false);
        xmlhttp.send(null);
        if (xmlhttp.status == 200) {
            this.SetTechPlList(xmlhttp.responseText);
        }
        return xmlhttp.responseText;
    },
    ClearTechPlList: function () {
        localStorage.removeItem('fmt-tech_pl_list');
    },
    /* location parameters end */

    /* map frame size */
    GetMapFrameSize: function () {
        var mapFrameSize = localStorage.getItem('fmt-map_frame_size');
        if (mapFrameSize === null) {
            mapFrameSize = false;
        }
        return mapFrameSize;
    },
    SetMapFrameSize: function (value) {
        localStorage.setItem('fmt-map_frame_size', value);
    },
    ClearMapFrameSize: function () {
        localStorage.removeItem('fmt-map_frame_size');
    },
    /* map frame size end */

    /* last known position */
    SetLastKnownPosition: function () {
        localStorage.setItem('fmt-last_pl', this.CurPlace);
        localStorage.setItem('fmt-last_loc', this.CurLocation);
        localStorage.setItem('fmt-last_maze', this.InsideMaze);
        localStorage.setItem('fmt-last_dimx', this.CurDimX);
        localStorage.setItem('fmt-last_dimy', this.CurDimY);
        localStorage.setItem('fmt-last_lvl', this.CurLevel);
        localStorage.setItem('fmt-last_xcor', this.CurCoordX);
        localStorage.setItem('fmt-last_ycor', this.CurCoordY);
    },
    DefineLastKnownPosition: function (value) {
        this.CurPlace = localStorage.getItem('fmt-last_pl');
        this.CurLocation = localStorage.getItem('fmt-last_loc');
        this.InsideMaze = localStorage.getItem('fmt-last_maze');
        this.CurDimX = localStorage.getItem('fmt-last_dimx');
        this.CurDimY = localStorage.getItem('fmt-last_dimy');
        this.CurLevel = localStorage.getItem('fmt-last_lvl');
        this.CurCoordX = localStorage.getItem('fmt-last_xcor');
        this.CurCoordY = localStorage.getItem('fmt-last_ycor');
    },
    ClearLastKnownPosition: function () {
        localStorage.removeItem('fmt-last_pl');
        localStorage.removeItem('fmt-last_loc');
        localStorage.removeItem('fmt-last_maze');
        localStorage.removeItem('fmt-last_dimx');
        localStorage.removeItem('fmt-last_dimy');
        localStorage.removeItem('fmt-last_lvl');
        localStorage.removeItem('fmt-last_xcor');
        localStorage.removeItem('fmt-last_ycor');
    },
    /* last known position end */

    /* get-set functions for main localstorage values end */

    HTML_LoadingPlaceholder: '\
<center>Подождите, карта загружается...<br /><img src="http://fantasyland.ru/images/loading.gif" /></center>\
',

    HTML_Controls: '\
<div id="fmt-ctrl-title" style="font-size:12pt; color: white; float: left; padding: 6px 10px 6px 10px;">Картограф FMT v. ' + VERSION + '</div>\
<div style="color: #ffffff; float: right; padding: 6px 10px 6px 10px; border-left: 2px dashed white;">\
Действия: \
<a id="fmt-hidebtn" style="cursor:hand;cursor:pointer;border:1px solid #aaaaaa; padding: 0 3px;"><b>&rAarr;</b></a>&nbsp;\
<a id="fmt-unhidebtn" style="cursor:hand;cursor:pointer;border:1px solid #aaaaaa; padding: 0 3px;"><b>&lAarr;</b></a>&nbsp;\
<a id="fmt-reloadbtn" style="cursor:hand;cursor:pointer;border:1px solid #aaaaaa; padding: 0 3px;"><b>&orarr;</b></a>\
</div>\
<div style="color: #ffffff; float: right; padding: 7px 10px 7px 10px; border-left: 2px dashed white;">\
Масштаб: \
<a id="fmt-size-def" style="cursor:hand;cursor:pointer;border:1px solid #aaaaaa; padding: 0 3px;"><b>S</b></a>&nbsp;\
<a id="fmt-size-xl" style="cursor:hand;cursor:pointer;border:1px solid #aaaaaa; padding: 0 3px;"><b>M</b></a>&nbsp;\
<a id="fmt-size-xxl" style="cursor:hand;cursor:pointer;border:1px solid #aaaaaa; padding: 0 3px;"><b>L</b></a>\
</div>\
<div style="color: #ffffff; float: right; padding: 0px 10px 0px 10px; border-left: 2px dashed white;">\
<a id="fmt-scrbar-1" style="cursor:hand;cursor:pointer;"><table cellspacing="0" cellpadding="0" border="0" width="32" height="32" style="float: left; border: 0; margin: 0 3px;"><tbody><tr><td valign="middle" background="http://fantasyland.ru/images/grey.gif"><center><img src="http://fantasyland.ru/images/items/scroll_l_f0.gif" border="0" width="32" height="32"></center></td></tr></tbody></table></a>\
<a id="fmt-scrbar-2" style="cursor:hand;cursor:pointer;"><table cellspacing="0" cellpadding="0" border="0" width="32" height="32" style="float: left; border: 0; margin: 0 3px;"><tbody><tr><td valign="middle" background="http://fantasyland.ru/images/grey.gif"><center><img src="http://fantasyland.ru/images/items/scroll_l_s0.gif" border="0" width="32" height="32"></center></td></tr></tbody></table></a>\
<a id="fmt-scrbar-3" style="cursor:hand;cursor:pointer;"><table cellspacing="0" cellpadding="0" border="0" width="32" height="32" style="float: left; border: 0; margin: 0 3px;"><tbody><tr><td valign="middle" background="http://fantasyland.ru/images/grey.gif"><center><img src="http://fantasyland.ru/images/items/scroll_l_f1.gif" border="0" width="32" height="32"></center></td></tr></tbody></table></a>\
<a id="fmt-scrbar-4" style="cursor:hand;cursor:pointer;"><table cellspacing="0" cellpadding="0" border="0" width="32" height="32" style="float: left; border: 0; margin: 0 3px;"><tbody><tr><td valign="middle" background="http://fantasyland.ru/images/grey.gif"><center><img src="http://fantasyland.ru/images/items/scroll_l_s1.gif" border="0" width="32" height="32"></center></td></tr></tbody></table></a>\
<a id="fmt-scrbar-5" style="cursor:hand;cursor:pointer;"><table cellspacing="0" cellpadding="0" border="0" width="32" height="32" style="float: left; border: 0; margin: 0 3px;"><tbody><tr><td valign="middle" background="http://fantasyland.ru/images/grey.gif"><center><img src="http://fantasyland.ru/images/items/scroll_l_t0.gif" border="0" width="32" height="32"></center></td></tr></tbody></table></a>\
<a id="fmt-scrbar-6" style="cursor:hand;cursor:pointer;"><table cellspacing="0" cellpadding="0" border="0" width="32" height="32" style="float: left; border: 0; margin: 0 3px;"><tbody><tr><td valign="middle" background="http://fantasyland.ru/images/grey.gif"><center><img src="http://fantasyland.ru/images/items/scroll_l_dn.gif" border="0" width="32" height="32"></center></td></tr></tbody></table></a>\
<a id="fmt-scrbar-7" style="cursor:hand;cursor:pointer;"><table cellspacing="0" cellpadding="0" border="0" width="32" height="32" style="float: left; border: 0; margin: 0 3px;"><tbody><tr><td valign="middle" background="http://fantasyland.ru/images/grey.gif"><center><img src="http://fantasyland.ru/images/items/scroll_l_up.gif" border="0" width="32" height="32"></center></td></tr></tbody></table></a>\
</div>\
<div style="color: #ffffff; float: right; padding: 3px 10px 3px 10px; border-left: 2px dashed white;">\
<table border="0" width="100%"><tr>\
<td><img src="http://fantasyland.ru/images/miscellaneous/attack_player.gif" style="vertical-align: middle; margin: 0; padding: 0;" /></td><td id="fmt-mazeinfo-mobs" style="color: #ffffff; font-weight: bold;">---</td>\
<td><img src="http://fantasyland.ru/images/miscellaneous/pick_up_gold.gif" style="vertical-align: middle; margin: 0; padding: 0;" /></td><td id="fmt-mazeinfo-loot" style="color: #ffffff; font-weight: bold;">---</td>\
</tr></table>\
</div>\
',

    CSS_Controls: '\
html {\
    border: 2px dashed white;\
    border-top: 0;\
}\
body {\
    margin: 1px 0;\
}',

    CSS_Map: '<style>\
.fmt {border: 1px solid black;}\
.fmt td {font-size: 1px; height: 14px; border: 1px dotted #777777; background-color: #888888; min-width: 10px; min-height: 14px; max-width: 10px; max-height: 14px; background-image: none; background-size: 14px; background-repeat: no-repeat; background-position: center;}\
.fmt.fmt-xl td {font-size: 1px; height: 16px; border: 1px dotted #777777; background-color: #888888; min-width: 12px; min-height: 16px; max-width: 12px; max-height: 16px; background-image: none; background-size: 16px; background-repeat: no-repeat; background-position: center;}\
.fmt.fmt-xxl td {font-size: 1px; height: 18px; border: 1px dotted #777777; background-color: #888888; min-width: 14px; min-height: 18px; max-width: 14px; max-height: 18px; background-image: none; background-size: 18px; background-repeat: no-repeat; background-position: center;}\
.fmt td:focus {outline: none;}\
.fmt-me {background-image: url(\'' + IMGPATH + '/online_me.png\') !important;}\
.fmt-me-object {background-image: url(\'' + IMGPATH + '/online_me.png\'), url(\'' + IMGPATH + '/object.png\') !important;}\
.fmt-me-trap {background-image: url(\'' + IMGPATH + '/online_me.png\'), url(\'' + IMGPATH + '/trap.png\') !important;}\
.fmt-me-flag {background-image: url(\'' + IMGPATH + '/online_me.png\'), url(\'' + IMGPATH + '/flag.png\') !important;}\
.fmt-me-up {background-image: url(\'' + IMGPATH + '/online_me.png\'), url(\'' + IMGPATH + '/up.png\') !important;}\
.fmt-me-down {background-image: url(\'' + IMGPATH + '/online_me.png\'), url(\'' + IMGPATH + '/down.png\') !important;}\
.fmt-me-exit {background-image: url(\'' + IMGPATH + '/online_me.png\'), url(\'' + IMGPATH + '/exit.png\') !important;}\
.fmt-pl {background-image: url(\'' + IMGPATH + '/online.png\') !important;}\
.fmt-pl-object {background-image: url(\'' + IMGPATH + '/online.png\'), url(\'' + IMGPATH + '/object.png\') !important;}\
.fmt-pl-trap {background-image: url(\'' + IMGPATH + '/online.png\'), url(\'' + IMGPATH + '/trap.png\') !important;}\
.fmt-pl-flag {background-image: url(\'' + IMGPATH + '/online.png\'), url(\'' + IMGPATH + '/flag.png\') !important;}\
.fmt-pl-up {background-image: url(\'' + IMGPATH + '/online.png\'), url(\'' + IMGPATH + '/up.png\') !important;}\
.fmt-pl-down {background-image: url(\'' + IMGPATH + '/online.png\'), url(\'' + IMGPATH + '/down.png\') !important;}\
.fmt-pl-exit {background-image: url(\'' + IMGPATH + '/online.png\'), url(\'' + IMGPATH + '/exit.png\') !important;}\
.fmt-grid {text-align: center; font-size:6pt !important; background: transparent !important;}\
.fmt-dc {background-color: #cfcfcf !important;}\
.fmt-dc-old {background-color: #aaaaaa !important;}\
.fmt-dc-mob {background-color: #ff33ff !important;}\
.fmt-dc-loot {background-color: #33ff33 !important;}\
.fmt-object {background-image: url(\'' + IMGPATH + '/object.png\') !important;}\
.fmt-trap {background-image: url(\'' + IMGPATH + '/trap.png\') !important;}\
.fmt-flag {background-image: url(\'' + IMGPATH + '/flag.png\') !important;}\
.fmt-up {background-image: url(\'' + IMGPATH + '/up.png\') !important;}\
.fmt-down {background-image: url(\'' + IMGPATH + '/down.png\') !important;}\
.fmt-exit {background-image: url(\'' + IMGPATH + '/exit.png\') !important;}\
.fmt-n-0 {border-top: 1px solid black !important;}\
.fmt-w-0 {border-left: 1px solid black !important;}\
.fmt-e-0 {border-right: 1px solid black !important;}\
.fmt-s-0 {border-bottom: 1px solid black !important;}\
.fmt-n-1 {border-top: inherit;}\
.fmt-w-1 {border-left: inherit;}\
.fmt-e-1 {border-right: inherit;}\
.fmt-s-1 {border-bottom: inherit;}\
.fmt-n-2 {border-top: 1px solid #ff0000 !important;}\
.fmt-w-2 {border-left: 1px solid #ff0000 !important;}\
.fmt-e-2 {border-right: 1px solid #ff0000 !important;}\
.fmt-s-2 {border-bottom: 1px solid #ff0000 !important;}\
.fmt-n-3 {border-top: 1px solid #119933 !important;}\
.fmt-w-3 {border-left: 1px solid #119933 !important;}\
.fmt-e-3 {border-right: 1px solid #119933 !important;}\
.fmt-s-3 {border-bottom: 1px solid #119933 !important;}\
.fmt-n-4 {border-top: 1px solid #0000ff !important;}\
.fmt-w-4 {border-left: 1px solid #0000ff !important;}\
.fmt-e-4 {border-right: 1px solid #0000ff !important;}\
.fmt-s-4 {border-bottom: 1px solid #0000ff !important;}\
.fmt-n-5 {border-top: 1px solid #ffffff !important;}\
.fmt-w-5 {border-left: 1px solid #ffffff !important;}\
.fmt-e-5 {border-right: 1px solid #ffffff !important;}\
.fmt-s-5 {border-bottom: 1px solid #ffffff !important;}\
.fmt-n-6 {border-top: 1px solid #c19691 !important;}\
.fmt-w-6 {border-left: 1px solid #c19691 !important;}\
.fmt-e-6 {border-right: 1px solid #c19691 !important;}\
.fmt-s-6 {border-bottom: 1px solid #c19691 !important;}\
.fmt-n-7 {border-top: 1px solid #ffff66 !important;}\
.fmt-w-7 {border-left: 1px solid #ffff66 !important;}\
.fmt-e-7 {border-right: 1px solid #ffff66 !important;}\
.fmt-s-7 {border-bottom: 1px solid #ffff66 !important;}\
.fmt-n-8 {border-top: 1px solid #66ccff !important;}\
.fmt-w-8 {border-left: 1px solid #66ccff !important;}\
.fmt-e-8 {border-right: 1px solid #66ccff !important;}\
.fmt-s-8 {border-bottom: 1px solid #66ccff !important;}\
.fmt-n-9 {border-top: 0px;}\
.fmt-w-9 {border-left: 0px;}\
.fmt-e-9 {border-right: 0px;}\
.fmt-s-9 {border-bottom: 0px;}\
.fmt-n-a {border-top: 1px solid #888888 !important;}\
.fmt-w-a {border-left: 1px solid #888888 !important;}\
.fmt-e-a {border-right: 1px solid #888888 !important;}\
.fmt-s-a {border-bottom: 1px solid #888888 !important;}\
.fmt-n-b {border-top: 1px solid #ed8600 !important;}\
.fmt-w-b {border-left: 1px solid #ed8600 !important;}\
.fmt-e-b {border-right: 1px solid #ed8600 !important;}\
.fmt-s-b {border-bottom: 1px solid #ed8600 !important;}\
.fmt-n-c {border-top: 1px solid #079a00 !important;}\
.fmt-w-c {border-left: 1px solid #079a00 !important;}\
.fmt-e-c {border-right: 1px solid #079a00 !important;}\
.fmt-s-c {border-bottom: 1px solid #079a00 !important;}\
</style>',

    DefineMazeInfo: function () {
        var xmlhttpMazeId = this.GetXmlHttp();
        xmlhttpMazeId.open('GET', '/cgi/technical_maze_id.php?loc=' + this.CurLocation + '&place=' + this.CurPlace, false);
        xmlhttpMazeId.onreadystatechange = function () {
            if (xmlhttpMazeId.readyState == 4) {
                if (xmlhttpMazeId.status == 200) {
                    var mazeId = xmlhttpMazeId.responseText;
                    var mobs = '---';
                    var loot = '---';
                    if (mazeId > 0) {
                        var xmlhttpMazeInfo = window.top.Map.GetXmlHttp();
                        xmlhttpMazeInfo.open('GET', '/cgi/technical_lab_info.php?maze_id=' + mazeId, false);
                        xmlhttpMazeInfo.onreadystatechange = function () {
                            if (xmlhttpMazeInfo.readyState == 4) {
                                if (xmlhttpMazeInfo.status == 200) {
                                    var resp = xmlhttpMazeInfo.responseText;
                                    var mazeinfo = resp.split(' ');
                                    if (mazeinfo.length == 2) {
                                        mobs = mazeinfo[1];
                                        loot = mazeinfo[0];
                                    }
                                }
                            }
                        };
                        xmlhttpMazeInfo.send(null);
                    }
                    window.top.chat.fortismapcontrols.document.getElementById('fmt-mazeinfo-mobs').innerHTML = mobs;
                    window.top.chat.fortismapcontrols.document.getElementById('fmt-mazeinfo-loot').innerHTML = loot;
                }
            }
        };
        xmlhttpMazeId.send(null);
    }
};

window.top.Map.Init();

/*
 string CoordRegex = @"L-(\d+?).+?\((\d{1,}).+?(\d{1,})\)";
 string TrapImageRegex = @"name=""title_img"".+/(.+?)""";
 string HruRegex = @"id=""hru"".+?([0-9]+)%";
 string flagRegex = @"name=""flagImg"".+?(display:none)";
 string DoorRegex = @"id=""(d[0-9])"".+/(go.+)\.gif";
 string PlayersRegex = @"addr\('(.+?)'\)\""";
 string PicksBlockRegex = @"<div id=""picks"".+?>(.+?)</div>";
 string PickRegex = @"onclick=""(.+?)"".+?><td>(.+?)</td>";
 string MobsRegex = @"onclick=""javascript:attackPlayer\((-\d+)\).+?<td>\[Lvl.+?(\d+)\].+?<i>(.+?)</i>";
 */