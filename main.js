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

require([ "jquery", "jquery-ui", "jquery.cookie" ], function ($) {
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

        var mapWidth = 25,
            mapHeight = 25,
            map = [],
            ticks = 0,
            processed = [];

        var entities = [];

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

        entities[0] = {
            name: "Emptiness",
            on: { move: true }
        };

        entities[1] = {
            name: "Soil",
            on: { dig: true }
        };

        var playerVec, playerVec2;

        entities[2] = entities[3] = entities[4] = entities[5] = {
            name: "Player",
            can: { move: true, dig: true, collect: true },
            process: function (map, col, row) {
                if (!playerVec) {
                    return;
                }

                var vec = playerVec;

                if (this.moveTo(vec)) {
                    // todo: cycle tile
                    //     tile = tile + 1;
                    //     if (tile > 5) {
                    //         tile = 2;
                    //     }
                }
            }
        };

        entities[56] = entities[57] = entities[58] = entities[59] = {
            name: "Zombie",
            process: function (map, col, row) {
                var converted = false;

                neighVecs.forEach(function (vec) {
                    var neigh = map[row + vec.y][col + vec.x];
                    if (neigh >= 2 && neigh <= 5) {
                        map[row + vec.y][col + vec.x] = 56;
                        processed[row + vec.y][col + vec.x] = ticks;
                        converted = true;
                    }
                });

                if (converted) {
                    return;
                }

                //var vec = neighVecs[Math.floor(prng() * 4)];
                if (!playerVec2) {
                    return;
                }
                var vec = playerVec2;
                if (map[row + vec.y][col + vec.x] === 0 || map[row + vec.y][col + vec.x] === 1 || map[row + vec.y][col + vec.x] === 28) {
                    var tile = map[row][col];
                    tile = tile + 1;
                    if (tile > 59) {
                        tile = 56;
                    }
                    map[row][col] = 0;
                    map[row + vec.y][col + vec.x] = tile;
                    processed[row + vec.y][col + vec.x] = ticks;
                }
            }
        };

        entities[46] = {
            name: "Exploding Player",
            transition: true,
            process: function (map, col, row) {
                crystallize(col, row);
            }
        };

        entities[6] = entities[7] = entities[8] = entities[9] = {
            name: "Firefly",
            process: function (map, col, row) {
                var contact = false;

                neighVecs.forEach(function (vec) {
                    var neigh = map[row + vec.y][col + vec.x];
                    if (neigh >= 2 && neigh <= 5) {
                        map[row + vec.y][col + vec.x] = 46;
                        processed[row + vec.y][col + vec.x] = ticks;
                        contact = true;
                    }
                });

                if (contact) {
                    return;
                }

                var bearing = map[row][col] - 6,
                    bearingVec = neighVecs[bearing],
                    hand = (bearing + 1) % 4,
                    handVec = neighVecs[hand];
                if (map[row + handVec.y][col + handVec.x] === 0) {
                    map[row][col] = 0;
                    map[row + handVec.y][col + handVec.x] = 6 + hand;
                    processed[row + handVec.y][col + handVec.x] = ticks;
                } else if (map[row + bearingVec.y][col + bearingVec.x] === 0) {
                    map[row][col] = 0;
                    map[row + bearingVec.y][col + bearingVec.x] = 6 + bearing;
                    processed[row + bearingVec.y][col + bearingVec.x] = ticks;
                } else {
                    map[row][col] = 6 + ((bearing + 3) % 4)
                }
            }
        };

        entities[10] = {
            name: "Exploding Firefly",
            transition: true,
            process: function (map, col, row) {
                explode(col, row);
            }
        };

        entities[11] = entities[12] = entities[13] = entities[14] = {
            name: "Butterfly",
            process: function (map, col, row) {
                var contact = false;

                neighVecs.forEach(function (vec) {
                    var neigh = map[row + vec.y][col + vec.x];
                    if (neigh >= 2 && neigh <= 5) {
                        map[row + vec.y][col + vec.x] = 46;
                        processed[row + vec.y][col + vec.x] = ticks;
                        contact = true;
                    }
                });

                if (contact) {
                    return;
                }

                var bearing = map[row][col] - 11,
                    bearingVec = neighVecs[bearing],
                    hand = (bearing + 3) % 4,
                    handVec = neighVecs[hand];
                if (map[row + handVec.y][col + handVec.x] === 0) {
                    map[row][col] = 0;
                    map[row + handVec.y][col + handVec.x] = 11 + hand;
                    processed[row + handVec.y][col + handVec.x] = ticks;
                } else if (map[row + bearingVec.y][col + bearingVec.x] === 0) {
                    map[row][col] = 0;
                    map[row + bearingVec.y][col + bearingVec.x] = 11 + bearing;
                    processed[row + bearingVec.y][col + bearingVec.x] = ticks;
                } else {
                    map[row][col] = 11 + ((bearing + 1) % 4)
                }
            }
        };

        entities[15] = {
            name: "Exploding Butterfly",
            transition: true,
            process: function (map, col, row) {
                crystallize(col, row);
            }
        };

        entities[28] = {
            name: "Diamond",
            on: { collect: true },
            process: function (map, col, row) {
                if (map[row + 1][col] === 0) {
                    map[row][col] = 0;
                    map[row + 1][col] = 29;
                    processed[row + 1][col] = ticks;
                } else if ((map[row + 1][col] === 28 || map[row + 1][col] === 30) && map[row + 2][col] !== 0) {
                    if (map[row][col - 1] === 0 && map[row + 1][col - 1] === 0) {
                        map[row][col] = 0;
                        map[row][col - 1] = 29;
                        processed[row][col - 1] = ticks;
                    } else if (map[row][col + 1] === 0 && map[row + 1][col + 1] === 0) {
                        map[row][col] = 0;
                        map[row][col + 1] = 29;
                        processed[row][col + 1] = ticks;
                    }
                }
            }
        };

        entities[29] = {
            name: "Falling Diamond",
            transition: true,
            process: function (map, col, row) {
                // tile.allows(...)
                if (map[row + 1][col] >= 2 && map[row + 1][col] <= 5) {
                    map[row][col] = 28;
                    map[row + 1][col] = 46;
                    processed[row + 1][col] = ticks;
                } else if (map[row + 1][col] >= 6 && map[row + 1][col] <= 9) {
                    map[row][col] = 28;
                    map[row + 1][col] = 10;
                    processed[row + 1][col] = ticks;
                } else if (map[row + 1][col] >= 11 && map[row + 1][col] <= 14) {
                    map[row][col] = 28;
                    map[row + 1][col] = 15;
                    processed[row + 1][col] = ticks;
                } else if (map[row + 1][col] === 0) {
                    map[row][col] = 0;
                    map[row + 1][col] = 29;
                    processed[row + 1][col] = ticks;
                } else {
                    map[row][col] = 28;
                }
            }
        };

        entities[30] = {
            name: "Boulder",
            process: function (map, col, row) {
                // tile.allows(...)
                if (map[row + 1][col] === 0) {
                    map[row][col] = 0;
                    map[row + 1][col] = 31;
                    processed[row + 1][col] = ticks;
                } else if ((map[row + 1][col] === 28 || map[row + 1][col] === 30) && map[row + 2][col] !== 0 /*don't like this here*/) {
                    if (map[row][col - 1] === 0 && map[row + 1][col - 1] === 0) {
                        map[row][col] = 0;
                        map[row][col - 1] = 31;
                        processed[row][col - 1] = ticks;
                    } else if (map[row][col + 1] === 0 && map[row + 1][col + 1] === 0) {
                        map[row][col] = 0;
                        map[row][col + 1] = 31;
                        processed[row][col + 1] = ticks;
                    }
                }
            }
        };

        entities[31] = {
            name: "Falling Boulder",
            transition: true,
            process: function (map, col, row) {
                // tile.allows(...)
                if (map[row + 1][col] >= 2 && map[row + 1][col] <= 5) {
                    map[row][col] = 30;
                    map[row + 1][col] = 46;
                    processed[row + 1][col] = ticks;
                } else if (map[row + 1][col] >= 6 && map[row + 1][col] <= 9) {
                    map[row][col] = 30;
                    map[row + 1][col] = 10;
                    processed[row + 1][col] = ticks;
                } else if (map[row + 1][col] >= 11 && map[row + 1][col] <= 14) {
                    map[row][col] = 30;
                    map[row + 1][col] = 15;
                    processed[row + 1][col] = ticks;
                } else if (map[row + 1][col] === 0) {
                    map[row][col] = 0;
                    map[row + 1][col] = 31;
                    processed[row + 1][col] = ticks;
                } else {
                    map[row][col] = 30;
                }
            }
        };

        entities[35] = {
            name: "Indestructible Wall"
        };

        entities[36] = {
            name: "Destructible Wall"
        };

        entities[37] = {
            name: "Enchanted Wall"
        };

        entities[16] = entities[17] = entities[18] = entities[19] = {
            name: "Amoeba",
            process: function (map, col, row) {
                var stifle = 0;

                neighVecs.forEach(function (vec) {
                    var neigh = map[row + vec.y][col + vec.x];
                    if (neigh >= 6 && neigh <= 9) {
                        map[row + vec.y][col + vec.x] = 10;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 11 && neigh <= 14) {
                        map[row + vec.y][col + vec.x] = 15;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 48 && neigh <= 51) {
                        map[row + vec.y][col + vec.x] = 48; // wake up stifled neigh
                        processed[row + vec.y][col + vec.x] = ticks;
                        stifle++;
                    } else if (neigh === 0 || neigh === 1) {
                        if (prng() < 0.01) {
                            map[row + vec.y][col + vec.x] = 16;
                            processed[row + vec.y][col + vec.x] = ticks;
                        }
                    } else {
                        stifle++;
                    }
                });

                if (stifle < 4) {
                    var tile = map[row][col];
                    tile = tile + 1;
                    if (tile > 19) {
                        tile = 16;
                    }
                    map[row][col] = tile;
                } else {
                    map[row][col] = 48;
                }

                // tile.allows(...)
                /*if (row < mapHeight - 1 && map[row + 1][col] === 0) {
                    map[row][col] = 0;
                    map[row + 1][col] = 30;
                    processed[row + 1][col] = ticks;
                }*/
            }
        };

        entities[47] = {
            name: "Exploding Amoeba",
            transition: true,
            process: function (map, col, row) {
                explode(col, row);
            }
        };

        entities[48] = entities[49] = entities[50] = entities[51] = {
            name: "Stifled Amoeba",
            transition: true,
            process: function (map, col, row) {
                var stifle = 0;
                var tile = map[row][col];

                neighVecs.forEach(function (vec) {
                    var neigh = map[row + vec.y][col + vec.x];
                    if (neigh >= 6 && neigh <= 9) {
                        map[row + vec.y][col + vec.x] = 10;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 11 && neigh <= 14) {
                        map[row + vec.y][col + vec.x] = 15;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 48 && neigh <= 51) {
                        //if (neigh - tile > 0) {
                            map[row + vec.y][col + vec.x] = tile;
                            processed[row + vec.y][col + vec.x] = ticks;
                        //}
                        /*if (neigh - tile > 2) {
                            map[row + vec.y][col + vec.x] = neigh - 1; // make neigh less stifened
                            processed[row + vec.y][col + vec.x] = ticks;
                        }*/
                        stifle++;
                    } else if (neigh === 0 || neigh === 1) {
                        map[row][col] = 16;
                    } else {
                        stifle++;
                    }
                });

                if (stifle === 4) {
                    tile = tile + 1;
                    if (tile > 51) {
                        tile = 24;
                    }
                    map[row][col] = tile;
                }
            }
        };

        entities[20] = entities[21] = entities[22] = entities[23] = {
            name: "Explosion",
            process: function (map, col, row) {
                var tile = map[row][col];
                tile = tile + 1;
                if (tile > 23) {
                    tile = 0;
                }
                map[row][col] = tile;
            }
        };

        entities[24] = entities[25] = entities[26] = entities[27] = {
            name: "Crystallization",
            process: function (map, col, row) {
                var tile = map[row][col];
                tile = tile + 1;
                map[row][col] = tile;
            }
        };

        entities[42] = entities[43] = entities[44] = entities[45] = {
            name: "Space Amoeba",
            process: function (map, col, row) {
                var stifle = 0;

                neighVecs.forEach(function (vec) {
                    var neigh = map[row + vec.y][col + vec.x];
                    if (neigh >= 2 && neigh <= 5) {
                        map[row + vec.y][col + vec.x] = 46;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 6 && neigh <= 9) {
                        map[row + vec.y][col + vec.x] = 10;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 11 && neigh <= 14) {
                        map[row + vec.y][col + vec.x] = 15;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 16 && neigh <= 19 || neigh >= 48 && neigh <= 51) {
                        map[row + vec.y][col + vec.x] = 47;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 52 && neigh <= 55) {
                        map[row + vec.y][col + vec.x] = 52; // wake up stifled neigh
                        processed[row + vec.y][col + vec.x] = ticks;
                        stifle++;
                    } else if (neigh === 0 || neigh === 1) {
                        if (prng() < 0.01) {
                            map[row + vec.y][col + vec.x] = 42;
                            processed[row + vec.y][col + vec.x] = ticks;
                        }
                    } else {
                        stifle++;
                    }
                });

                if (stifle < 4) {
                    var tile = map[row][col];
                    tile = tile + 1;
                    if (tile > 45) {
                        tile = 42;
                    }
                    map[row][col] = tile;
                } else {
                    map[row][col] = 52;
                }
                // tile.allows(...)
                /*if (row < mapHeight - 1 && map[row + 1][col] === 0) {
                    map[row][col] = 0;
                    map[row + 1][col] = 30;
                    processed[row + 1][col] = ticks;
                }*/
            }
        };

        entities[52] = entities[53] = entities[54] = entities[55] = {
            name: "Stifled Space Amoeba",
            transition: true,
            process: function (map, col, row) {
                var stifle = 0;
                var tile = map[row][col];

                neighVecs.forEach(function (vec) {
                    var neigh = map[row + vec.y][col + vec.x];

                    if (neigh >= 2 && neigh <= 5) {
                        map[row + vec.y][col + vec.x] = 46;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 6 && neigh <= 9) {
                        map[row + vec.y][col + vec.x] = 10;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 11 && neigh <= 14) {
                        map[row + vec.y][col + vec.x] = 15;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 16 && neigh <= 19 || neigh === 48) {
                        map[row + vec.y][col + vec.x] = 47;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 52 && neigh <= 55) {
                        //if (neigh - tile > 0) {
                            map[row + vec.y][col + vec.x] = tile;
                            processed[row + vec.y][col + vec.x] = ticks;
                        //}
                        /*if (neigh - tile > 2) {
                            map[row + vec.y][col + vec.x] = neigh - 1; // make neigh less stifened
                            processed[row + vec.y][col + vec.x] = ticks;
                        }*/
                        stifle++;
                    } else if (neigh === 0 || neigh === 1) {
                        map[row][col] = 42;
                    } else {
                        stifle++;
                    }
                });

                if (stifle === 4) {
                    if (tile < 55) {
                    tile = tile + 1;
                    /*if (tile > 55) {
                        tile = 30;
                    }*/
                    map[row][col] = tile;
                    }
                }
            }
        };

        entities[60] = entities[61] = /*entities[62] = entities[63] =*/ {
            name: "Fire",
            process: function (map, col, row) {
                var tile = map[row][col];

                neighVecs.forEach(function (vec) {
                    var neigh = map[row + vec.y][col + vec.x];

                    if (neigh >= 2 && neigh <= 5) {
                        map[row + vec.y][col + vec.x] = 46;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 6 && neigh <= 9) {
                        map[row + vec.y][col + vec.x] = 10;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 11 && neigh <= 14) {
                        map[row + vec.y][col + vec.x] = 15;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 56 && neigh <= 59) {
                        map[row + vec.y][col + vec.x] = 46;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 16 && neigh <= 19 || neigh >= 48 && neigh <= 51) {
                        map[row + vec.y][col + vec.x] = 47;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }/* else if (neigh === 64) {
                        map[row + vec.y][col + vec.x] = 93;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (neigh >= 93 && neigh <= 95) {
                        map[row + vec.y][col + vec.x] = neigh + 1;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }*/
                });

                tile = tile + 1;

                if (tile > 61) {
                    tile = 60;
                }

                map[row][col] = tile;
            }
        };

        entities[64] = {
            name: "Wooden Wall",
            process: function (map, col, row) {
                var tile = map[row][col];

                neighVecs.forEach(function (vec) {
                    var neigh = map[row + vec.y][col + vec.x];

                    if (neigh >= 60 && neigh <= 61 || neigh >= 20 && neigh <= 23) {
                        map[row][col] = 93;
                    }
                });
            }
        };

        entities[65] = {
            name: "East Laser",
            process: function (map, col, row) {
                if (map[row][col + 1] === 0) {
                    map[row][col + 1] = 69;
                    processed[row][col + 1] = ticks;
                }
            }
        };

        entities[66] = {
            name: "North Laser",
            process: function (map, col, row) {
                if (map[row - 1][col] === 0) {
                    map[row - 1][col] = 71;
                    processed[row - 1][col] = ticks;
                }
            }
        };

        entities[67] = {
            name: "West Laser",
            process: function (map, col, row) {
                if (map[row][col - 1] === 0) {
                    map[row][col - 1] = 69;
                    processed[row][col - 1] = ticks;
                }
            }
        };

        entities[68] = {
            name: "South Laser",
            process: function (map, col, row) {
                if (map[row + 1][col] === 0) {
                    map[row + 1][col] = 71;
                    processed[row + 1][col] = ticks;
                }
            }
        };

        entities[69] = entities[70] = {
            name: "East-West Laser",
            transition: true,
            process: function (map, col, row) {
                var tile = map[row][col];

                tile = tile + 1;

                if (tile > 70) {
                    tile = 69;
                }

                map[row][col] = tile;

                if (map[row][col - 1] === 0) {
                    map[row][col - 1] = tile;
                    processed[row][col - 1] = ticks;
                } else if (map[row][col + 1] === 0) {
                    map[row][col + 1] = tile;
                    processed[row][col + 1] = ticks;
                } else if (map[row][col - 1] === 71 || map[row][col - 1] === 72) {
                    map[row][col - 1] = 73 + tile - 69;
                    processed[row][col - 1] = ticks;
                } else if (map[row][col + 1] === 71 || map[row][col + 1] === 72) {
                    map[row][col + 1] = 73 + tile - 69;
                    processed[row][col + 1] = ticks;
                }
            }
        };

        entities[71] = entities[72] = {
            name: "North-South Laser",
            transition: true,
            process: function (map, col, row) {
                var tile = map[row][col];

                tile = tile + 1;

                if (tile > 72) {
                    tile = 71;
                }

                map[row][col] = tile;

                if (map[row - 1][col] === 0) {
                    map[row - 1][col] = tile;
                    processed[row - 1][col] = ticks;
                } else if (map[row + 1][col] === 0) {
                    map[row + 1][col] = tile;
                    processed[row + 1][col] = ticks;
                } else if (map[row - 1][col] === 69 || map[row - 1][col] === 70) {
                    map[row - 1][col] = 73 + tile - 71;
                    processed[row - 1][col] = ticks;
                } else if (map[row + 1][col] === 69 || map[row + 1][col] === 70) {
                    map[row + 1][col] = 73 + tile - 71;
                    processed[row + 1][col] = ticks;
                }
            }
        };

        entities[73] = entities[74] = {
            name: "Laser Intersection",
            transition: true,
            process: function (map, col, row) {
                var tile = map[row][col];

                tile = tile + 1;

                if (tile > 74) {
                    tile = 73;
                }

                map[row][col] = tile;

                // todo: do this by scanning neighs instead
                if (map[row - 1][col] === 0) {
                    map[row - 1][col] = 71 + tile - 73;
                    processed[row - 1][col] = ticks;
                } else if (map[row + 1][col] === 0) {
                    map[row + 1][col] = 71 + tile - 73;
                    processed[row + 1][col] = ticks;
                } else if (map[row - 1][col] === 69 || map[row - 1][col] === 70) {
                    map[row - 1][col] = 73 + tile - 73;
                    processed[row - 1][col] = ticks;
                } else if (map[row + 1][col] === 69 || map[row + 1][col] === 70) {
                    map[row + 1][col] = 73 + tile - 73;
                    processed[row + 1][col] = ticks;
                } else if (map[row][col - 1] === 0) {
                    map[row][col - 1] = 69 + tile - 73;
                    processed[row][col - 1] = ticks;
                } else if (map[row][col + 1] === 0) {
                    map[row][col + 1] = 69 + tile - 73;
                    processed[row][col + 1] = ticks;
                } else if (map[row][col - 1] === 71 || map[row][col - 1] === 72) {
                    map[row][col - 1] = 73 + tile - 73;
                    processed[row][col - 1] = ticks;
                } else if (map[row][col + 1] === 71 || map[row][col + 1] === 72) {
                    map[row][col + 1] = 73 + tile - 73;
                    processed[row][col + 1] = ticks;
                }
            }
        };

        entities[77] = {
            name: "Bomb",
            process: function (map, col, row) {
                if (map[row + 1][col] === 0) {
                    map[row][col] = 0;
                    map[row + 1][col] = 78;
                    processed[row + 1][col] = ticks;
                }
            }
        };

        entities[78] = {
            name: "Falling Bomb",
            transition: true,
            process: function (map, col, row) {
                if (map[row + 1][col] === 0) {
                    map[row][col] = 0;
                    map[row + 1][col] = 78;
                    processed[row + 1][col] = ticks;
                } else {
                    map[row][col] = 79;
                }
            }
        };

        entities[79] = {
            name: "Exploding Bomb",
            transition: true,
            process: function (map, col, row) {
                explode(col, row);
            }
        };

        entities[80] = {
            name: "Rail"
        };

        entities[81] = {
            name: "Docked Magnet",
            process: function (map, col, row) {
                if (!playerVec) {
                    return;
                }

                var vec = playerVec;

                if (vec.x) {
                    if (map[row + vec.y][col + vec.x] === 80) {
                        map[row][col] = 80;
                        map[row + vec.y][col + vec.x] = 81;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }
                } else if (vec.y > 0) {
                    if (map[row + vec.y][col + vec.x] === 0) {
                        map[row][col] = 82;
                        map[row + vec.y][col + vec.x] = 83;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }
                }
            }
        };

        entities[82] = {
            name: "Magnet Attachment",
            transition: true/*,
            process: function (map, col, row) {
                if (!playerVec) {
                    return;
                }

                var vec = playerVec;

                if (vec.x) {
                    if (map[row + vec.y][col + vec.x] === 80) {
                        map[row][col] = 80;
                        map[row + vec.y][col + vec.x] = 82;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }
                }
            }*/
        };

        entities[83] = {
            name: "Magnet",
            transition: true,
            process: function (map, col, row) {
                if (map[row + 1][col] === 30) {
                    map[row][col] = 85;
                    return;
                }

                if (!playerVec) {
                    return;
                }

                var vec = playerVec;

                /*if (vec.x) {
                    if (map[row + vec.y][col + vec.x] === 0) {
                        map[row][col] = 0;
                        map[row + vec.y][col + vec.x] = 83;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }
                } else */if (vec.y === 1) {
                    if (map[row + vec.y][col + vec.x] === 0) {
                        map[row][col] = 84;
                        map[row + vec.y][col + vec.x] = 83;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }
                } else if (vec.y === -1) {
                    if (map[row + vec.y][col + vec.x] === 84) {
                        map[row][col] = 0;
                        map[row + vec.y][col + vec.x] = 83;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (map[row + vec.y][col + vec.x] === 82) {
                        map[row][col] = 0;
                        map[row + vec.y][col + vec.x] = 81;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }
                }
            }
        };

       entities[84] = {
            name: "Magnet Chain",
            transition: true/*,
            process: function (map, col, row) {
                if (!playerVec) {
                    return;
                }

                var vec = playerVec;

                if (vec.x) {
                    if (map[row + vec.y][col + vec.x] === 0) {
                        map[row][col] = 0;
                        map[row + vec.y][col + vec.x] = 84;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }
                }
            }*/
        };

        entities[85] = entities[86] = entities[87] = entities[88] = {
            name: "Active Magnet",
            transition: true,
            process: function (map, col, row) {
                var tile = map[row][col];

                tile = tile + 1;

                if (tile > 88) {
                    tile = 85;
                }

                map[row][col] = tile;

                if (map[row + 1][col] !== 30) {
                    map[row][col] = 83;
                    return;
                }

                if (!playerVec) {
                    processed[row + 1][col] = ticks;
                    return;
                }

                var vec = playerVec;

                /*if (vec.x) {
                    if (map[row + vec.y][col + vec.x] === 0) {
                        map[row][col] = 0;
                        map[row + vec.y][col + vec.x] = 83;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }
                } else */
                if (vec.y === 1) {
                    map[row][col] = 83;
                    /*if (map[row + vec.y][col + vec.x] === 0) {
                        map[row][col] = 84;
                        map[row + vec.y][col + vec.x] = 83;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }*/
                } else if (vec.y === -1) {
                    if (map[row + vec.y][col + vec.x] === 84) {
                        map[row][col] = 30;
                        map[row + 1][col] = 0;
                        map[row + vec.y][col + vec.x] = tile;
                        processed[row + vec.y][col + vec.x] = ticks;
                    } else if (map[row + vec.y][col + vec.x] === 82) {
                        map[row][col] = 30;
                        map[row + 1][col] = 0;
                        map[row + vec.y][col + vec.x] = 89 + tile - 85;
                        processed[row + vec.y][col + vec.x] = ticks;
                        /*map[row][col] = 0;
                        map[row + vec.y][col + vec.x] = 81;
                        processed[row + vec.y][col + vec.x] = ticks;*/
                    }
                }

                processed[row + 1][col] = ticks;
            }
        };

        entities[89] = entities[90] = entities[91] = entities[92] = {
            name: "Active Docked Magnet",
            transition: true,
            process: function (map, col, row) {
                var tile = map[row][col];

                tile = tile + 1;

                if (tile > 92) {
                    tile = 89;
                }

                map[row][col] = tile;

                if (map[row + 1][col] !== 30) {
                    map[row][col] = 81;
                    return;
                }

                if (!playerVec) {
                    processed[row + 1][col] = ticks;
                    return;
                }

                var vec = playerVec;

                if (vec.x) {
                    if (map[row + vec.y][col + vec.x] === 80) {
                        map[row][col] = 80;
                        map[row + vec.y][col + vec.x] = tile;
                        processed[row + vec.y][col + vec.x] = ticks;
                        map[row + 1][col] = 0;
                        map[row + vec.y + 1][col + vec.x] = 30;
                        processed[row + vec.y + 1][col + vec.x] = ticks;
                    }

                /*if (vec.x) {
                    if (map[row + vec.y][col + vec.x] === 0) {
                        map[row][col] = 0;
                        map[row + vec.y][col + vec.x] = 83;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }
                } else */
                } else if (vec.y === 1) {
                    map[row][col] = 81;
                    /*if (map[row + vec.y][col + vec.x] === 0) {
                        map[row][col] = 84;
                        map[row + vec.y][col + vec.x] = 83;
                        processed[row + vec.y][col + vec.x] = ticks;
                    }*/
                }

                processed[row + 1][col] = ticks;
            }
        };

        entities[93] = entities[94] = entities[95] = {
            name: "Heating Wooden Wall",
            transition: true,
            process: function (map, col, row) {
                var tile = map[row][col],
                    ambientHeat = 0;

                neighVecs.forEach(function (vec) {
                    var neigh = map[row + vec.y][col + vec.x];

                    if (neigh >= 60 && neigh <= 61 || neigh >= 20 && neigh <= 23) {
                        ambientHeat++;
                    }

                });

                if (ambientHeat > 0) {
                    tile++;
                    if (tile > 95) {
                        tile = 60;
                    }
                } else {
                    tile--;
                    if (tile < 93) {
                        tile = 64;
                    }
                }

                map[row][col] = tile;
            }
        };

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
                prngSeed = parseInt($.cookie("ps"));

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
            if (ink >= 0 && cursor.col > 0 && cursor.col < mapWidth - 1
                && cursor.row > 0 && cursor.row < mapHeight - 1) {
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
                map[row][col] = ink;
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

        var keyVecs = [{
            key: $.ui.keyCode.LEFT,
            x: -1,
            y: 0
        }, {
            key: $.ui.keyCode.UP,
            x: 0,
            y: -1
        }, {
            key: $.ui.keyCode.RIGHT,
            x: 1,
            y: 0
        }, {
            key: $.ui.keyCode.DOWN,
            x: 0,
            y: 1
        }];

        keyVecs.forEach(function (vec) {
            keyVecs[vec.key] = vec;
        });

        var keyVecs2 = [{
            key: "A".charCodeAt(0),
            x: -1,
            y: 0
        }, {
            key: "W".charCodeAt(0),
            x: 0,
            y: -1
        }, {
            key: "D".charCodeAt(0),
            x: 1,
            y: 0
        }, {
            key: "S".charCodeAt(0),
            x: 0,
            y: 1
        }];

        keyVecs2.forEach(function (vec) {
            keyVecs2[vec.key] = vec;
        });

        function arrowKeyDown(key) {
            playerVec = keyVecs[key];
        }

        function arrowKeyUp(key) {
            if (playerVec === keyVecs[key]) {
                playerVec = null;
            }
        }

        function arrowKeyDown2(key) {
            playerVec2 = keyVecs2[key];
        }

        function arrowKeyUp2(key) {
            if (playerVec2 === keyVecs2[key]) {
                playerVec2 = null;
            }
        }

        $(document).keydown(function (evt) {
            if (keyVecs[evt.which]) {
                arrowKeyDown(evt.which);
            } else if (keyVecs2[evt.which]) {
                arrowKeyDown2(evt.which);
            } else {
                switch (evt.which) {
                case $.ui.keyCode.BACKSPACE:
                    undo();
                    break;
                case $.ui.keyCode.SPACE:
                    togglePause();
                    break;
                default:
                    return;
                }
            }

            evt.preventDefault();
        });

        $(document).keyup(function (evt) {
            if (keyVecs[evt.which]) {
                arrowKeyUp(evt.which);
            } else if (keyVecs2[evt.which]) {
                arrowKeyUp2(evt.which);
            }
        });
    });

});
