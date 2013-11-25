define(function () {
    "use strict";

    var entities = [];

    entities[0] = {
        name: "Emptiness",
        on: { move: true }
    };

    entities[1] = {
        name: "Soil",
        on: { dig: true }
    };

    entities[2] = entities[3] = entities[4] = entities[5] = {
        name: "Player",
        can: { move: true, dig: true, collect: true },
        process: function (map, col, row) {
            if (!this.playerVec) {
                return;
            }

            var vec = this.playerVec;

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

            this.neighVecs.forEach(function (vec) {
                var neigh = map[row + vec.y][col + vec.x];
                if (neigh >= 2 && neigh <= 5) {
                    map[row + vec.y][col + vec.x] = 56;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                    converted = true;
                }
            }, this);

            if (converted) {
                return;
            }

            //var vec = this.neighVecs[Math.floor(this.prng() * 4)];
            if (!this.playerVec2) {
                return;
            }
            var vec = this.playerVec2;
            if (map[row + vec.y][col + vec.x] === 0 || map[row + vec.y][col + vec.x] === 1 || map[row + vec.y][col + vec.x] === 28) {
                var tile = map[row][col];
                tile = tile + 1;
                if (tile > 59) {
                    tile = 56;
                }
                map[row][col] = 0;
                map[row + vec.y][col + vec.x] = tile;
                this.processed[row + vec.y][col + vec.x] = this.ticks;
            }
        }
    };

    entities[46] = {
        name: "Exploding Player",
        transition: true,
        process: function (map, col, row) {
            this.crystallize(col, row);
        }
    };

    entities[6] = entities[7] = entities[8] = entities[9] = {
        name: "Firefly",
        process: function (map, col, row) {
            var contact = false;

            this.neighVecs.forEach(function (vec) {
                var neigh = map[row + vec.y][col + vec.x];
                if (neigh >= 2 && neigh <= 5) {
                    map[row + vec.y][col + vec.x] = 46;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                    contact = true;
                }
            }, this);

            if (contact) {
                return;
            }

            var bearing = map[row][col] - 6,
                bearingVec = this.neighVecs[bearing],
                hand = (bearing + 1) % 4,
                handVec = this.neighVecs[hand];
            if (map[row + handVec.y][col + handVec.x] === 0) {
                map[row][col] = 0;
                map[row + handVec.y][col + handVec.x] = 6 + hand;
                this.processed[row + handVec.y][col + handVec.x] = this.ticks;
            } else if (map[row + bearingVec.y][col + bearingVec.x] === 0) {
                map[row][col] = 0;
                map[row + bearingVec.y][col + bearingVec.x] = 6 + bearing;
                this.processed[row + bearingVec.y][col + bearingVec.x] = this.ticks;
            } else {
                map[row][col] = 6 + ((bearing + 3) % 4);
            }
        }
    };

    entities[10] = {
        name: "Exploding Firefly",
        transition: true,
        process: function (map, col, row) {
            this.explode(col, row);
        }
    };

    entities[11] = entities[12] = entities[13] = entities[14] = {
        name: "Butterfly",
        process: function (map, col, row) {
            var contact = false;

            this.neighVecs.forEach(function (vec) {
                var neigh = map[row + vec.y][col + vec.x];
                if (neigh >= 2 && neigh <= 5) {
                    map[row + vec.y][col + vec.x] = 46;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                    contact = true;
                }
            }, this);

            if (contact) {
                return;
            }

            var bearing = map[row][col] - 11,
                bearingVec = this.neighVecs[bearing],
                hand = (bearing + 3) % 4,
                handVec = this.neighVecs[hand];
            if (map[row + handVec.y][col + handVec.x] === 0) {
                map[row][col] = 0;
                map[row + handVec.y][col + handVec.x] = 11 + hand;
                this.processed[row + handVec.y][col + handVec.x] = this.ticks;
            } else if (map[row + bearingVec.y][col + bearingVec.x] === 0) {
                map[row][col] = 0;
                map[row + bearingVec.y][col + bearingVec.x] = 11 + bearing;
                this.processed[row + bearingVec.y][col + bearingVec.x] = this.ticks;
            } else {
                map[row][col] = 11 + ((bearing + 1) % 4)
            }
        }
    };

    entities[15] = {
        name: "Exploding Butterfly",
        transition: true,
        process: function (map, col, row) {
            this.crystallize(col, row);
        }
    };

    entities[28] = {
        name: "Diamond",
        on: { collect: true },
        process: function (map, col, row) {
            if (map[row + 1][col] === 0) {
                map[row][col] = 0;
                map[row + 1][col] = 29;
                this.processed[row + 1][col] = this.ticks;
            } else if ((map[row + 1][col] === 28 || map[row + 1][col] === 30) && map[row + 2][col] !== 0) {
                if (map[row][col - 1] === 0 && map[row + 1][col - 1] === 0) {
                    map[row][col] = 0;
                    map[row][col - 1] = 29;
                    this.processed[row][col - 1] = this.ticks;
                } else if (map[row][col + 1] === 0 && map[row + 1][col + 1] === 0) {
                    map[row][col] = 0;
                    map[row][col + 1] = 29;
                    this.processed[row][col + 1] = this.ticks;
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
                this.processed[row + 1][col] = this.ticks;
            } else if (map[row + 1][col] >= 6 && map[row + 1][col] <= 9) {
                map[row][col] = 28;
                map[row + 1][col] = 10;
                this.processed[row + 1][col] = this.ticks;
            } else if (map[row + 1][col] >= 11 && map[row + 1][col] <= 14) {
                map[row][col] = 28;
                map[row + 1][col] = 15;
                this.processed[row + 1][col] = this.ticks;
            } else if (map[row + 1][col] === 0) {
                map[row][col] = 0;
                map[row + 1][col] = 29;
                this.processed[row + 1][col] = this.ticks;
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
                this.processed[row + 1][col] = this.ticks;
            } else if ((map[row + 1][col] === 28 || map[row + 1][col] === 30) && map[row + 2][col] !== 0 /*don't like this here*/) {
                if (map[row][col - 1] === 0 && map[row + 1][col - 1] === 0) {
                    map[row][col] = 0;
                    map[row][col - 1] = 31;
                    this.processed[row][col - 1] = this.ticks;
                } else if (map[row][col + 1] === 0 && map[row + 1][col + 1] === 0) {
                    map[row][col] = 0;
                    map[row][col + 1] = 31;
                    this.processed[row][col + 1] = this.ticks;
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
                this.processed[row + 1][col] = this.ticks;
            } else if (map[row + 1][col] >= 6 && map[row + 1][col] <= 9) {
                map[row][col] = 30;
                map[row + 1][col] = 10;
                this.processed[row + 1][col] = this.ticks;
            } else if (map[row + 1][col] >= 11 && map[row + 1][col] <= 14) {
                map[row][col] = 30;
                map[row + 1][col] = 15;
                this.processed[row + 1][col] = this.ticks;
            } else if (map[row + 1][col] === 0) {
                map[row][col] = 0;
                map[row + 1][col] = 31;
                this.processed[row + 1][col] = this.ticks;
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

            this.neighVecs.forEach(function (vec) {
                var neigh = map[row + vec.y][col + vec.x];
                if (neigh >= 6 && neigh <= 9) {
                    map[row + vec.y][col + vec.x] = 10;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 11 && neigh <= 14) {
                    map[row + vec.y][col + vec.x] = 15;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 48 && neigh <= 51) {
                    map[row + vec.y][col + vec.x] = 48; // wake up stifled neigh
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                    stifle++;
                } else if (neigh === 0 || neigh === 1) {
                    if (this.prng() < 0.01) {
                        map[row + vec.y][col + vec.x] = 16;
                        this.processed[row + vec.y][col + vec.x] = this.ticks;
                    }
                } else {
                    stifle++;
                }
            }, this);

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
                this.processed[row + 1][col] = this.ticks;
            }*/
        }
    };

    entities[47] = {
        name: "Exploding Amoeba",
        transition: true,
        process: function (map, col, row) {
            this.explode(col, row);
        }
    };

    entities[48] = entities[49] = entities[50] = entities[51] = {
        name: "Stifled Amoeba",
        transition: true,
        process: function (map, col, row) {
            var stifle = 0;
            var tile = map[row][col];

            this.neighVecs.forEach(function (vec) {
                var neigh = map[row + vec.y][col + vec.x];
                if (neigh >= 6 && neigh <= 9) {
                    map[row + vec.y][col + vec.x] = 10;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 11 && neigh <= 14) {
                    map[row + vec.y][col + vec.x] = 15;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 48 && neigh <= 51) {
                    //if (neigh - tile > 0) {
                        map[row + vec.y][col + vec.x] = tile;
                        this.processed[row + vec.y][col + vec.x] = this.ticks;
                    //}
                    /*if (neigh - tile > 2) {
                        map[row + vec.y][col + vec.x] = neigh - 1; // make neigh less stifened
                        this.processed[row + vec.y][col + vec.x] = this.ticks;
                    }*/
                    stifle++;
                } else if (neigh === 0 || neigh === 1) {
                    map[row][col] = 16;
                } else {
                    stifle++;
                }
            }, this);

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

            this.neighVecs.forEach(function (vec) {
                var neigh = map[row + vec.y][col + vec.x];
                if (neigh >= 2 && neigh <= 5) {
                    map[row + vec.y][col + vec.x] = 46;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 6 && neigh <= 9) {
                    map[row + vec.y][col + vec.x] = 10;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 11 && neigh <= 14) {
                    map[row + vec.y][col + vec.x] = 15;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 16 && neigh <= 19 || neigh >= 48 && neigh <= 51) {
                    map[row + vec.y][col + vec.x] = 47;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 52 && neigh <= 55) {
                    map[row + vec.y][col + vec.x] = 52; // wake up stifled neigh
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                    stifle++;
                } else if (neigh === 0 || neigh === 1) {
                    if (this.prng() < 0.01) {
                        map[row + vec.y][col + vec.x] = 42;
                        this.processed[row + vec.y][col + vec.x] = this.ticks;
                    }
                } else {
                    stifle++;
                }
            }, this);

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
                this.processed[row + 1][col] = this.ticks;
            }*/
        }
    };

    entities[52] = entities[53] = entities[54] = entities[55] = {
        name: "Stifled Space Amoeba",
        transition: true,
        process: function (map, col, row) {
            var stifle = 0;
            var tile = map[row][col];

            this.neighVecs.forEach(function (vec) {
                var neigh = map[row + vec.y][col + vec.x];

                if (neigh >= 2 && neigh <= 5) {
                    map[row + vec.y][col + vec.x] = 46;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 6 && neigh <= 9) {
                    map[row + vec.y][col + vec.x] = 10;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 11 && neigh <= 14) {
                    map[row + vec.y][col + vec.x] = 15;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 16 && neigh <= 19 || neigh === 48) {
                    map[row + vec.y][col + vec.x] = 47;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 52 && neigh <= 55) {
                    //if (neigh - tile > 0) {
                        map[row + vec.y][col + vec.x] = tile;
                        this.processed[row + vec.y][col + vec.x] = this.ticks;
                    //}
                    /*if (neigh - tile > 2) {
                        map[row + vec.y][col + vec.x] = neigh - 1; // make neigh less stifened
                        this.processed[row + vec.y][col + vec.x] = this.ticks;
                    }*/
                    stifle++;
                } else if (neigh === 0 || neigh === 1) {
                    map[row][col] = 42;
                } else {
                    stifle++;
                }
            }, this);

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

            this.neighVecs.forEach(function (vec) {
                var neigh = map[row + vec.y][col + vec.x];

                if (neigh >= 2 && neigh <= 5) {
                    map[row + vec.y][col + vec.x] = 46;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 6 && neigh <= 9) {
                    map[row + vec.y][col + vec.x] = 10;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 11 && neigh <= 14) {
                    map[row + vec.y][col + vec.x] = 15;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 56 && neigh <= 59) {
                    map[row + vec.y][col + vec.x] = 46;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 16 && neigh <= 19 || neigh >= 48 && neigh <= 51) {
                    map[row + vec.y][col + vec.x] = 47;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                }/* else if (neigh === 64) {
                    map[row + vec.y][col + vec.x] = 93;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (neigh >= 93 && neigh <= 95) {
                    map[row + vec.y][col + vec.x] = neigh + 1;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                }*/
            }, this);

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

            this.neighVecs.forEach(function (vec) {
                var neigh = map[row + vec.y][col + vec.x];

                if (neigh >= 60 && neigh <= 61 || neigh >= 20 && neigh <= 23) {
                    map[row][col] = 93;
                }
            }, this);
        }
    };

    entities[65] = {
        name: "East Laser",
        process: function (map, col, row) {
            if (map[row][col + 1] === 0) {
                map[row][col + 1] = 69;
                this.processed[row][col + 1] = this.ticks;
            }
        }
    };

    entities[66] = {
        name: "North Laser",
        process: function (map, col, row) {
            if (map[row - 1][col] === 0) {
                map[row - 1][col] = 71;
                this.processed[row - 1][col] = this.ticks;
            }
        }
    };

    entities[67] = {
        name: "West Laser",
        process: function (map, col, row) {
            if (map[row][col - 1] === 0) {
                map[row][col - 1] = 69;
                this.processed[row][col - 1] = this.ticks;
            }
        }
    };

    entities[68] = {
        name: "South Laser",
        process: function (map, col, row) {
            if (map[row + 1][col] === 0) {
                map[row + 1][col] = 71;
                this.processed[row + 1][col] = this.ticks;
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
                this.processed[row][col - 1] = this.ticks;
            } else if (map[row][col + 1] === 0) {
                map[row][col + 1] = tile;
                this.processed[row][col + 1] = this.ticks;
            } else if (map[row][col - 1] === 71 || map[row][col - 1] === 72) {
                map[row][col - 1] = 73 + tile - 69;
                this.processed[row][col - 1] = this.ticks;
            } else if (map[row][col + 1] === 71 || map[row][col + 1] === 72) {
                map[row][col + 1] = 73 + tile - 69;
                this.processed[row][col + 1] = this.ticks;
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
                this.processed[row - 1][col] = this.ticks;
            } else if (map[row + 1][col] === 0) {
                map[row + 1][col] = tile;
                this.processed[row + 1][col] = this.ticks;
            } else if (map[row - 1][col] === 69 || map[row - 1][col] === 70) {
                map[row - 1][col] = 73 + tile - 71;
                this.processed[row - 1][col] = this.ticks;
            } else if (map[row + 1][col] === 69 || map[row + 1][col] === 70) {
                map[row + 1][col] = 73 + tile - 71;
                this.processed[row + 1][col] = this.ticks;
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
                this.processed[row - 1][col] = this.ticks;
            } else if (map[row + 1][col] === 0) {
                map[row + 1][col] = 71 + tile - 73;
                this.processed[row + 1][col] = this.ticks;
            } else if (map[row - 1][col] === 69 || map[row - 1][col] === 70) {
                map[row - 1][col] = 73 + tile - 73;
                this.processed[row - 1][col] = this.ticks;
            } else if (map[row + 1][col] === 69 || map[row + 1][col] === 70) {
                map[row + 1][col] = 73 + tile - 73;
                this.processed[row + 1][col] = this.ticks;
            } else if (map[row][col - 1] === 0) {
                map[row][col - 1] = 69 + tile - 73;
                this.processed[row][col - 1] = this.ticks;
            } else if (map[row][col + 1] === 0) {
                map[row][col + 1] = 69 + tile - 73;
                this.processed[row][col + 1] = this.ticks;
            } else if (map[row][col - 1] === 71 || map[row][col - 1] === 72) {
                map[row][col - 1] = 73 + tile - 73;
                this.processed[row][col - 1] = this.ticks;
            } else if (map[row][col + 1] === 71 || map[row][col + 1] === 72) {
                map[row][col + 1] = 73 + tile - 73;
                this.processed[row][col + 1] = this.ticks;
            }
        }
    };

    entities[77] = {
        name: "Bomb",
        process: function (map, col, row) {
            if (map[row + 1][col] === 0) {
                map[row][col] = 0;
                map[row + 1][col] = 78;
                this.processed[row + 1][col] = this.ticks;
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
                this.processed[row + 1][col] = this.ticks;
            } else {
                map[row][col] = 79;
            }
        }
    };

    entities[79] = {
        name: "Exploding Bomb",
        transition: true,
        process: function (map, col, row) {
            this.explode(col, row);
        }
    };

    entities[80] = {
        name: "Rail"
    };

    entities[81] = {
        name: "Docked Magnet",
        process: function (map, col, row) {
            if (!this.playerVec) {
                return;
            }

            var vec = this.playerVec;

            if (vec.x) {
                if (map[row + vec.y][col + vec.x] === 80) {
                    map[row][col] = 80;
                    map[row + vec.y][col + vec.x] = 81;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                }
            } else if (vec.y > 0) {
                if (map[row + vec.y][col + vec.x] === 0) {
                    map[row][col] = 82;
                    map[row + vec.y][col + vec.x] = 83;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
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
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
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

            if (!this.playerVec) {
                return;
            }

            var vec = this.playerVec;

            /*if (vec.x) {
                if (map[row + vec.y][col + vec.x] === 0) {
                    map[row][col] = 0;
                    map[row + vec.y][col + vec.x] = 83;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                }
            } else */if (vec.y === 1) {
                if (map[row + vec.y][col + vec.x] === 0) {
                    map[row][col] = 84;
                    map[row + vec.y][col + vec.x] = 83;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                }
            } else if (vec.y === -1) {
                if (map[row + vec.y][col + vec.x] === 84) {
                    map[row][col] = 0;
                    map[row + vec.y][col + vec.x] = 83;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (map[row + vec.y][col + vec.x] === 82) {
                    map[row][col] = 0;
                    map[row + vec.y][col + vec.x] = 81;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
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
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
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

            if (!this.playerVec) {
                this.processed[row + 1][col] = this.ticks;
                return;
            }

            var vec = this.playerVec;

            /*if (vec.x) {
                if (map[row + vec.y][col + vec.x] === 0) {
                    map[row][col] = 0;
                    map[row + vec.y][col + vec.x] = 83;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                }
            } else */
            if (vec.y === 1) {
                map[row][col] = 83;
                /*if (map[row + vec.y][col + vec.x] === 0) {
                    map[row][col] = 84;
                    map[row + vec.y][col + vec.x] = 83;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                }*/
            } else if (vec.y === -1) {
                if (map[row + vec.y][col + vec.x] === 84) {
                    map[row][col] = 30;
                    map[row + 1][col] = 0;
                    map[row + vec.y][col + vec.x] = tile;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                } else if (map[row + vec.y][col + vec.x] === 82) {
                    map[row][col] = 30;
                    map[row + 1][col] = 0;
                    map[row + vec.y][col + vec.x] = 89 + tile - 85;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                    /*map[row][col] = 0;
                    map[row + vec.y][col + vec.x] = 81;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;*/
                }
            }

            this.processed[row + 1][col] = this.ticks;
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

            if (!this.playerVec) {
                this.processed[row + 1][col] = this.ticks;
                return;
            }

            var vec = this.playerVec;

            if (vec.x) {
                if (map[row + vec.y][col + vec.x] === 80) {
                    map[row][col] = 80;
                    map[row + vec.y][col + vec.x] = tile;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                    map[row + 1][col] = 0;
                    map[row + vec.y + 1][col + vec.x] = 30;
                    this.processed[row + vec.y + 1][col + vec.x] = this.ticks;
                }

            /*if (vec.x) {
                if (map[row + vec.y][col + vec.x] === 0) {
                    map[row][col] = 0;
                    map[row + vec.y][col + vec.x] = 83;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                }
            } else */
            } else if (vec.y === 1) {
                map[row][col] = 81;
                /*if (map[row + vec.y][col + vec.x] === 0) {
                    map[row][col] = 84;
                    map[row + vec.y][col + vec.x] = 83;
                    this.processed[row + vec.y][col + vec.x] = this.ticks;
                }*/
            }

            this.processed[row + 1][col] = this.ticks;
        }
    };

    entities[93] = entities[94] = entities[95] = {
        name: "Heating Wooden Wall",
        transition: true,
        process: function (map, col, row) {
            var tile = map[row][col],
                ambientHeat = 0;

            this.neighVecs.forEach(function (vec) {
                var neigh = map[row + vec.y][col + vec.x];

                if (neigh >= 60 && neigh <= 61 || neigh >= 20 && neigh <= 23) {
                    ambientHeat++;
                }

            }, this);

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

    return entities;
});
