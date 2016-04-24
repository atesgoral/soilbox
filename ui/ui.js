define([ "jquery" ], function ($) {
    "use strict";

    return {
        initialize: function () {
            var ui = this;

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
                ui.playerVec = keyVecs[key];
            }

            function arrowKeyUp(key) {
                if (ui.playerVec === keyVecs[key]) {
                    ui.playerVec = null;
                }
            }

            function arrowKeyDown2(key) {
                ui.playerVec2 = keyVecs2[key];
            }

            function arrowKeyUp2(key) {
                if (ui.playerVec2 === keyVecs2[key]) {
                    ui.playerVec2 = null;
                }
            }

            $(window.document)
                .keydown(function (evt) {
                    if (keyVecs[evt.which]) {
                        arrowKeyDown(evt.which);
                    } else if (keyVecs2[evt.which]) {
                        arrowKeyDown2(evt.which);
                    } else {
                        switch (evt.which) {
                        case $.ui.keyCode.BACKSPACE:
                            $(ui).trigger("undo");
                            break;
                        case $.ui.keyCode.SPACE:
                            $(ui).trigger("togglePause");
                            break;
                        default:
                            return;
                        }
                    }

                    evt.preventDefault();
                })
                .keyup(function (evt) {
                    if (keyVecs[evt.which]) {
                        arrowKeyUp(evt.which);
                    } else if (keyVecs2[evt.which]) {
                        arrowKeyUp2(evt.which);
                    }
                });
        }
    };
});