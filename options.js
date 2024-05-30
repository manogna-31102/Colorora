var browser = chrome || browser;
function isValidInput(items) {
    "use strict";
    var modes = ["simulate", "rectify"],
        types = ["normal", "protanopia", "deuteranopia", "tritanopia"];
    return ((items.mode && modes.indexOf(items.mode) !== -1)
        && (items.type && types.indexOf(items.type) !== -1)
        //&& (items.CDSStrength && !Number.isNaN(items.CDSStrength) && items.CDSStrength >= 0 && items.CDSStrength <= 100)
        //&& (items.CCSStrength && !Number.isNaN(items.CCSStrength) && items.CCSStrength >= 0 && items.CCSStrength <= 100)
        //&& (items.only_image === true || items.only_image === false)
        );

}
function save_options() {
    "use strict";
    var items = {
            "type": document.getElementById('type').value,
            "mode": document.getElementById('mode').value,
            "CCSStrength": 100,
            "CDSStrength": 100,
            //"only_image": document.getElementById('only_image').checked
        };
    if (isValidInput(items)) {
        browser.storage.sync.set({
            "type": items.type,
            "mode": items.mode,
            "CCSStrength": 100,
            "CDSStrength": 100,
            //"only_image": items.only_image
        });
    }
}

function load_options() {
    "use strict";
    browser.storage.sync.get({
        type: 'normal',
        mode: 'simulate',
        only_image: false,
        CCSStrength: 100,
        CDSStrength: 100,
        minimized: false
    }, function (items) {
        document.getElementById('type').value = items.type;
        document.getElementById('mode').value = items.mode;
        //document.getElementById('CCSStrength').value = 100;
        //document.getElementById('CDSStrength').value = 100;
        //document.getElementById('only_image').checked = items.only_image;

        document.getElementById('type').addEventListener('change', save_options);
        document.getElementById('mode').addEventListener('change', save_options);
        //document.getElementById('CCSStrength').addEventListener('input', save_options);
        //document.getElementById('CDSStrength').addEventListener('input', save_options);
        //document.getElementById('only_image').addEventListener('change', save_options);

    });
}
document.addEventListener('DOMContentLoaded', load_options);