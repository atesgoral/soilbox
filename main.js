requirejs.config({
    paths: {
        "jquery": "lib/jquery/jquery-1.10.2.min",
        "jquery-ui": "lib/jquery-ui/jquery-ui-1.10.3.min",
        "jquery.cookie": "lib/jquery.cookie/jquery.cookie"
    },
    shim: {
        "jquery": {
            exports: "jQuery"
        },
        "jquery-ui": {
            exports: "jQuery.ui",
            deps: [ "jquery" ]
        },
        "jquery.cookie": {
            exports: "jQuery.fn.cookie",
            deps: [ "jquery" ]
        }
    }
});

require([ "jquery", "entities", "ui", "jquery-ui", "jquery.cookie" ], function ($, entities, ui) {
    "use strict";

    $(function () {
        var neighVecs = [{
            x: 0, y: -1
        }, {
            x: 1, y: 0
        }, {
            x: 0, y: 1
        }, {
            x: -1, y: 0
        }];

        var tickInterval = 100;
        var tickTimer;

        var run = false;

        var prngSeed = 1;

        /*seed = (seed*9301+49297) % 233280;
        return seed/(233280.0);*/

        function prng() {
            prngSeed = (prngSeed ^ 1337) * 0xECDAD ^ 0xDEADBEEF;
            return (prngSeed & 0xffff) / 0x10000;
        }

        function explode(col, row) {
            for (var y = -1; y < 2; y++) {
                for (var x = -1; x < 2; x++) {
                    if (map[row + y][col + x] !== 35) {
                        if (map[row + y][col + x] >= 2 && map[row + y][col + x] <= 5) {
                            map[row + y][col + x] = 46;
                        } else if (map[row + y][col + x] >= 6 && map[row + y][col + x] <= 9) {
                            map[row + y][col + x] = 10;
                        } else if (map[row + y][col + x] >= 11 && map[row + y][col + x] <= 14) {
                            map[row + y][col + x] = 15;
                        } else if (map[row + y][col + x] === 77 || map[row + y][col + x] === 78) {
                            map[row + y][col + x] = 79;
                        } else {
                            map[row + y][col + x] = 20;
                        }
                        processed[row + y][col + x] = ticks;
                    }
                }
            }
        }

        function crystallize(col, row) {
            for (var y = -1; y < 2; y++) {
                for (var x = -1; x < 2; x++) {
                    if (map[row + y][col + x] !== 35) {
                        if (map[row + y][col + x] >= 2 && map[row + y][col + x] <= 5) {
                            map[row + y][col + x] = 46;
                        } else if (map[row + y][col + x] >= 6 && map[row + y][col + x] <= 9) {
                            map[row + y][col + x] = 10;
                        } else if (map[row + y][col + x] >= 11 && map[row + y][col + x] <= 14) {
                            map[row + y][col + x] = 15;
                        } else if (map[row + y][col + x] === 77 || map[row + y][col + x] === 78) {
                            map[row + y][col + x] = 79;
                        } else {
                            map[row + y][col + x] = 24;
                        }
                        processed[row + y][col + x] = ticks;
                    }
                }
            }
        }

        function floodFill(col, row, find, replace) {
            if (map[row][col] === find && col > 0 && col < mapWidth - 1 && row > 0 && row < mapHeight - 1) {
                map[row][col] = replace;

                neighVecs.forEach(function (vec) {
                    floodFill(col + vec.x, row + vec.y, find, replace);
                });
            }
        }

        var mapWidth = 25,
            mapHeight = 25,
            map = [],
            ticks = 0,
            processed = [];

        var ink;

        var undoStates = [];

        function save() {
            $.cookie("map", JSON.stringify(map), { expires: 365 });
            $.cookie("ps", prngSeed, { expires: 365 });
        }

        function revert() {
            pushUndo();
            load();
            drawMap();
        }

        function resetProcessed() {
            for (var row = 0; row < mapHeight; row++) {
                processed[row] = [];
                for (var col = 0; col < mapWidth; col++) {
                    processed[row][col] = -1;
                }
            }
        }

        function clear() {
            map = [];

            for (var row = 0; row < mapHeight; row++) {
                map[row] = [];
                for (var col = 0; col < mapWidth; col++) {
                    map[row][col] = 1;
                }
            }
        }

        function enforceBorders() {
            for (var row = 0; row < mapHeight; row++) {
                map[row][0] = map[row][mapWidth - 1] = 35;
            }

            for (var col = 0; col < mapWidth; col++) {
                map[0][col] = map[mapHeight - 1][col] = 35;
            }
        }

        function reset() {
            pushUndo();
            clear();
            prngSeed = 1;
            resetProcessed();
            enforceBorders();
            drawMap();
        }

        function load() {
            try {
                map = JSON.parse($.cookie("map"));
                prngSeed = parseInt($.cookie("ps"), 10);

                if (map === null || isNaN(prngSeed)) {
                    throw "Missing/invalid cookie";
                }
            } catch (e) {
                console.log("Error loading map from cookies: " + e);
                clear();
                prngSeed = 1;
            }

            resetProcessed();
            enforceBorders();
        }

        load();

        var stage = document.getElementById("stage");
        var ctx = stage.getContext("2d");
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        var tilesImg = new Image();
        tilesImg.src = "i/tiles-3x.png";

        var tileSizeSrc = 24,
            tileSizeDest = 24;

        function drawTile(tile, col, row) {
            ctx.drawImage(tilesImg,
                tile * tileSizeSrc, 0,
                tileSizeSrc, tileSizeSrc,
                col * tileSizeDest, row * tileSizeDest,
                tileSizeDest, tileSizeDest);
        }

        function drawMap() {
            for (var row = 0; row < mapHeight; row++) {
                for (var col = 0; col < mapWidth; col++) {
                    ctx.drawImage(tilesImg,
                        map[row][col] * tileSizeSrc, 0,
                        tileSizeSrc, tileSizeSrc,
                        col * tileSizeDest, row * tileSizeDest,
                        tileSizeDest, tileSizeDest);
                }
            }
        }

        function processMap() {
            for (var row = 0; row < mapHeight; row++) {
                for (var col = 0; col < mapWidth; col++) {
                    if (processed[row][col] < ticks) {
                        var entity = entities[map[row][col]];
                        entity && entity.process && entity.process.call({
                            prng: prng,
                            neighVecs: neighVecs,
                            playerVec: ui.playerVec,
                            playerVec2: ui.playerVec2,
                            processed: processed,
                            ticks: ticks,
                            crystallize: crystallize,
                            explode: explode,
                            moveTo: function (vec) {
                                var targetCol = col + vec.x,
                                    targetRow = row + vec.y,
                                    targetEntity = entities[map[targetRow][targetCol]];

                                if (targetEntity.on) {
                                    for (var ability in targetEntity.on) {
                                        if (entity.can[ability]) {
                                            map[targetRow][targetCol] = map[row][col];
                                            processed[targetRow][targetCol] = ticks;
                                            map[row][col] = 0;
                                            break;
                                        }
                                    }
                                }

                            }
                        }, map, col, row);
                    }
                }
            }

            ticks = ticks + 1;
        }

        var cursorBorder = 3;

        function drawCursor() {
            if (ink >= 0 && cursor.col > 0 && cursor.col < mapWidth - 1 && cursor.row > 0 && cursor.row < mapHeight - 1) {
                drawTile(ink, cursor.col, cursor.row);
                ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
                ctx.fillRect(
                    cursor.col * tileSizeDest, cursor.row * tileSizeDest,
                    tileSizeDest, tileSizeDest);
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 1;
                ctx.strokeRect(
                    cursor.col * tileSizeDest + 0.5, cursor.row * tileSizeDest + 0.5,
                    tileSizeDest - 1, tileSizeDest - 1);
                return true;
            } else {
                return false;
            }
        }

        function tick() {
            if (!run) {
                tickTimer = 0;
                return;
            }

            processMap();
            drawMap();
            drawCursor();
            tickTimer = window.setTimeout(tick, tickInterval);
        }

        function drawEntityPalette() {
            var palette = document.getElementById("palette"),
                tmplHtml = document.getElementById("tile-tmpl").innerHTML,
                prevEn;

            entities.forEach(function (en, i) {
                if (en !== prevEn) {
                    if (!en.transition) {
                        var tileHtml = tmplHtml
                            .replace("${tile}", i)
                            .replace("${bgoffset}", i * 24)
                            .replace("${title}", en.name);
                        palette.innerHTML += tileHtml;
                    }
                    prevEn = en;
                }
            });

            $(".palette-item")./*click*/mousedown(function () {
                $(".palette-item-selected").removeClass("palette-item-selected");
                $(this).addClass("palette-item-selected").effect("highlight");
                ink = $(this).data("tile");
            });
        }

        tilesImg.onload = function () {
            drawEntityPalette();
            drawMap();
        };

        var cursor = {};

        stage.onmousemove = function (evt) {
            var col = Math.floor(evt.offsetX / tileSizeDest),
                row = Math.floor(evt.offsetY / tileSizeDest);

            if (cursor.col === col && cursor.row === row) {
                return;
            }

            if (cursor.col >= 0) {
                drawTile(map[cursor.row][cursor.col], cursor.col, cursor.row);
            }

            cursor.col = col;
            cursor.row = row;

            if (drawCursor() && mouseDown) {
                map[row][col] = ink;
            }
        };

        stage.onmouseout = function (evt) {
            mouseDown = false;
            drawTile(map[cursor.row][cursor.col], cursor.col, cursor.row);
            delete cursor.col;
        };

        var mouseDown;

        function undo() {
            if (undoStates.length) {
                var state = undoStates.pop();
                map = state.map;
                prngSeed = state.prngSeed;
                drawMap();
            }
        }

        function pushUndo() {
            // todo pack state into state object FTW

            undoStates.push({
                map: $.extend(true, [], map),
                prngSeed: prngSeed
            });
        }

        stage.onmousedown = function (evt) {
            evt.preventDefault();

            pushUndo();

            mouseDown = true;

            var col = Math.floor(evt.offsetX / tileSizeDest),
                row = Math.floor(evt.offsetY / tileSizeDest);

            cursor.col = col;
            cursor.row = row;

            if (drawCursor()) {
                if (evt.shiftKey) {
                    var entity = map[row][col];
                    if (entity !== ink) {
                        floodFill(col, row, entity, ink);
                        drawMap();
                    }
                } else {
                    map[row][col] = ink;
                }
            }
        };

        stage.onmouseup = function (evt) {
            mouseDown = false;
        };

        $("#speed").slider({
            value: 0,
            animate: true,
            slide: function (evt, ui) {
                tickInterval = 100 - ui.value;
            }
        });

        $("#save")
            .button({
                icons: {
                    primary: "ui-icon-disk"
                }
            })
            .click(save);

                // todo: enable on dirty
                /*$("#revert").button("option", {
                    disabled: false
                });*/

        $("#revert")
            .button({
                //disabled: true,
                icons: {
                    primary: "ui-icon-refresh"
                }
            })
            .click(revert);

        $("#reset")
            .button({
                icons: {
                    primary: "ui-icon-trash"
                }
            })
            .click(reset);

        $("#undo")
            .button({
                icons: {
                    primary: "ui-icon-arrowreturn-1-w"
                }
            })
            .click(undo);

        function togglePause() {
            if (run) {
                $("#play").button("option", {
                    icons: {
                        primary: "ui-icon-play"
                    },
                    label: "Play"
                });
                run = false;
            } else {
                $("#play").button("option", {
                    icons: {
                        primary: "ui-icon-pause"
                    },
                    label: "Pause"
                });
                run = true;
                if (!tickTimer) {
                    tick();
                }
            }
        }

        $("#play")
            .button({
                icons: {
                    primary: "ui-icon-play"
                },
                text: false
            })
            .click(togglePause);

        /*$(document).keypress(function (evt) {
            switch (evt.which) {
            case 32:
                togglePause();
                break;
            default:
                return;
            }

        });*/

        ui.initialize();

        $(ui)
            .on("undo", undo)
            .on("togglePause", togglePause);
    });
});
