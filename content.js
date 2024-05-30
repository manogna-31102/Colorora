var WebExtension = chrome || browser;
/*
 * Color deficiency matrices were obtained from the research described in:
 * Gustavo M. Machado, Manuel M. Oliveira, and Leandro A. F. Fernandes "A Physiologically-based Model for Simulation of Color Vision Deficiency". IEEE Transactions on Visualization and Computer Graphics. Volume 15 (2009), Number 6, November/December 2009. pp. 1291-1298.
 * more information http://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html
 */
var colourora = (function () {
    "use strict";
    var modes = ["simulate", "rectify"],
        types = ["normal", "protanopia", "deuteranopia", "tritanopia"],
        Self = {},
        Matrix = (function () {
                self = {
                    // "eye" : function (n) {
                    //     var matrix = [], i, j;
                    //     for (i = 0; i < n; ++i) {
                    //         matrix[i] = [];
                    //         for (j = 0; j < n; ++j) {
                    //             matrix[i][j] = (i === j ? 1 : 0);
                    //         }
                    //     }
                    //     return matrix;
                    // },
                    "dot" : function (A, B) {
                        var i, j, n, m, k, l, matrix = [];

                        for (i = 0, n = B[0].length; i < n; ++i) {
                            matrix[i] = [];
                            for (j = 0, m = A[i].length; j < m; ++j) {
                                matrix[i][j] = 0;
                                for (k = 0, l = A[i].length; k < l; ++k) {
                                    matrix[i][j] += A[i][k] * B[k][j];
                                }
                            }
                        }
                        return matrix;
                    },
                    "algebra" : function (A, B, mode) {
                        var i, j, n, m, matrix = [];

                        for (i = 0, n = B[0].length; i < n; ++i) {
                            matrix[i] = [];
                            for (j = 0, m = A[i].length; j < m; ++j) {
                                switch (mode) {
                                case "add":
                                    matrix[i][j] = A[i][j] + B[i][j];
                                    break;
                                case "substract":
                                    matrix[i][j] = A[i][j] - B[i][j];
                                    break;
                                case "multiply":
                                    matrix[i][j] = A[i][j] * B[i][j];
                                    break;
                                }
                            }
                        }
                        return matrix;
                    },
                    "add" : function (A, B) {
                        return self.algebra(A, B, "add");
                    },
                    "substract" : function (A, B) {
                        return self.algebra(A, B, "substract");
                    },
                    "multiply" : function (A, B) {
                        return self.algebra(A, B, "multiply");
                    }
                };
            return self;
        }()),
        Controller,
        Model = (function () {
            var self = {},
                on = false,
                mode = "",
                type = "",
                init = false,
                style = document.createElement('style'),
                svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
                filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter'),
                feColorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix'),
                default_target = 'body > *',
                createFeMatrix = function (matrix) {
                    var i, n, j, m, FeMatrix = '';
                    for (i = 0, n = 4; i < n; ++i) {
                        if (matrix[i] !== undefined) {
                            for (j = 0, m = 5; j < m; ++j) {
                                if (matrix[i][j] !== undefined) {
                                    FeMatrix += ' ' + matrix[i][j];
                                } else {
                                    FeMatrix += ' 0';
                                }
                            }
                        } else {
                            FeMatrix += ' 0 0 0 1 0';
                        }
                    }
                    return FeMatrix;
                },
                getCompensation = function (type) {
                    var matrices = {
                            protanopia : [[0, 0, 0], [0.7, 1, 0], [0.7, 0, 1]],
                            deuteranopia : [[1, 0.7, 0], [0, 0, 0], [0, 0.7, 1]],
                            tritanopia : [[1, 0, 0.7], [0, 1, 0.7], [0, 0, 0]]

                        },
                        matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

                    if (-1 !== types.indexOf(type)) {
                        matrix = matrices[type];
                    }
                    return matrix;
                },
                getColorDeficiencyMatrix = function (type) {

                    var matrices = {
                            protanopia : [[[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]]],
                            deuteranopia : [[[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]]],
                            tritanopia : [[[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]]]
                        };
                    if (-1 !== ["protanopia", "deuteranopia", "tritanopia"].indexOf(type))
                        return matrices[type][0];
                },
                setStyleSheetTarget = function () {
                    var i, n, sheet = style.sheet;
                    for (i = 0, n = sheet.cssRules.length; i < n; ++i) {
                        sheet.deleteRule(i);
                    }
                    if (type !== "normal") {
                        sheet.insertRule(default_target + " { filter: url('#colourora_filter')}", 0);
                    }
                },
                updateFilter = function () {
                    var sim = getColorDeficiencyMatrix(type),
                        compensateSim = getColorDeficiencyMatrix(type),
                        compensate = getCompensation(type),
                        matrix;
                    switch (mode) {
                    case "simulate":
                        matrix = sim;
                        break;
                    case "rectify":
                        matrix = Matrix.add(Matrix.substract(compensate, Matrix.dot(compensate, compensateSim)), [[1,0,0],[0,1,0],[0,0,1]]);
                        break;
                    default:
                        matrix = [[1,0,0],[0,1,0],[0,0,1]];
                        break;
                    }
                    feColorMatrix.setAttribute('values', createFeMatrix(matrix, type));

                };
            self = {
                "setSetup": function (s) {
                    var is_valid = ((s.mode && modes.indexOf(s.mode) !== -1)
                        && (s.type && types.indexOf(s.type) !== -1)
                        ),
                        update_style_sheet;
                    if (is_valid) {
                        update_style_sheet = (false !== s.only_image || type !== s.type || !init);
                        init = true;
                        mode = s.mode;
                        type = s.type;
                        if (update_style_sheet) {
                            setStyleSheetTarget();
                        }
                        updateFilter();
                    }
                    return is_valid;
                },
                "insertSVG" : function () {
                    style.setAttribute("media", "screen");
                    document.head.appendChild(style);
                    filter.setAttribute("id", 'colourora_filter');
                    feColorMatrix.setAttribute("values", '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');

                    filter.appendChild(feColorMatrix);
                    svg.appendChild(filter);
                    document.body.appendChild(svg);
                    return true;
                },
                "getSetup" : function () {
                    return {
                        "type": type,
                        "mode": mode,
                    };
                }
            };
            WebExtension.storage.sync.get({
                type: 'normal',
                mode: 'simulate',
            }, function (items) {
                mode = items.mode;
                type = items.type;
            });
            return self;
        }());
    Controller = (function () {
        var self = {},
            ini = false;

        self = {
            "init" : function () {
                if (ini) {return true; }
                ini = Model.insertSVG();
                return ini;
            },
            "set" : function (setup) {
                if (self.init()) {
                    Model.setSetup(setup);
                }
            }

        };
        return self;
    }());
    Self = {
        "setSetup" : function (setup) {
            Controller.set(setup);
        },
        "getSetup" : function () {
            return Model.getSetup();
        }
    };
    return Self;
}());

WebExtension.runtime.onMessage.addListener(function (message) {
    'use strict';
    switch (message.action) {
    case "setSetup":
        if (message.setup) {
            colourora.setSetup(message.setup);
        }
        break;
    case "getSetup":
        WebExtension.runtime.sendMessage(
            null,
            {
                "action": "currentSetup",
                "setup": colourora.getSetup()
            }
        );
        break;
    }
});
