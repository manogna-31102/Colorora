var WebExtension = chrome || browser,
    tab = null,
    modes = ["simulate", "rectify"],
    types = ["normal", "protanopia", "deuteranopia", "tritanopia"];
function hasClassName(el, classname) {
    "use strict";
    var i, n,
        cn = el.getAttribute('class') || '';
    cn = cn.split(' ');

    for (i = 0, n = cn.length; i < n; ++i) {
        if (cn[i] !== '' && cn[i] === classname) {
            return true;
        }
    }
    return false;
}
function addClassName(el, classname) {
    "use strict";
    if (!hasClassName(el, classname)) {
        var cn = (el.getAttribute('class') === null ? '' : el.getAttribute('class')) + ' ' + classname;
        el.setAttribute('class', cn);
    }
}
function removeClassName(el, classname) {
    "use strict";
    var new_cn = [], i, n,
        cn = el.getAttribute('class') || '';
    cn = cn.split(' ');

    for (i = 0, n = cn.length; i < n; ++i) {
        if (cn[i] !== '' && cn[i] !== classname) {
            new_cn.push(cn[i]);
        }
    }
    new_cn = new_cn.join(' ');
    el.setAttribute('class', new_cn);
}
function isValidInput(items) {
    "use strict";

    return ((items.mode && modes.indexOf(items.mode) !== -1)
        && (items.type && types.indexOf(items.type) !== -1)
        //&& (items.CDSStrength && !Number.isNaN(items.CDSStrength) && items.CDSStrength >= 0 && items.CDSStrength <= 100)
        //&& (items.CCSStrength && !Number.isNaN(items.CCSStrength) && items.CCSStrength >= 0 && items.CCSStrength <= 100)
        //&& (items.only_image === true || items.only_image === false)
        );

}
function getSetup() {
    "use strict";
    return {
        "type": document.querySelector('input[name="type"]:checked').value,
        "mode": document.querySelector('input[name="mode"]:checked').value,
        "CCSStrength": 100,
        "CDSStrength": 100,
        "only_image": false
    };
}
function optionsChanged() {
    "use strict";
    var index,
        setup = getSetup();
    if (isValidInput(setup)) {
        WebExtension.tabs.sendMessage(tab, {action: "setSetup", "setup": setup});
        index = modes.indexOf(setup.mode);
        //document.getElementById("CORA-CDSS").disabled = (index === 1);
        //document.getElementById("CORA-CCSS").disabled = (index === 0);
    }
}
function showSaveMessage(hide) {
    "use strict";
    var but = document.getElementById('CORA-savebutton');
    if (hide) {
        removeClassName(but, 'CORA-saving');
        but.innerText = 'Save settings';
    } else {
        addClassName(but, 'CORA-saving');
        but.innerText = 'Settings Saved';
    }
}
function saveSettings() {
    "use strict";
    var setup = getSetup();
    if (isValidInput(setup) && !hasClassName(document.getElementById('CORA-savebutton'), 'CORA-saving')) {
        WebExtension.storage.sync.set(setup,
            function () {
                showSaveMessage();
                setTimeout(function () {
                    showSaveMessage(true);
                }, 1250);
            });
    }
}
WebExtension.runtime.onMessage.addListener(function (message) {
    'use strict';
    switch (message.action) {
    case "currentSetup":
        if (isValidInput(message.setup)) {
            //document.getElementById('CORA-imgonly').checked = message.setup.only_image;
            //document.getElementById("CORA-CDSS").value = 100;
            //document.getElementById("CORA-CCSS").value = 100;

            document.getElementById("CORA-normal").checked  = (message.setup.type === "normal");
            document.getElementById("CORA-deuteranopia").checked  = (message.setup.type === "deuteranopia");
            document.getElementById("CORA-protanopia").checked = (message.setup.type === "protanopia");
            document.getElementById("CORA-tritanopia").checked = (message.setup.type === "tritanopia");
            document.getElementById("CORA-simulate").checked = (message.setup.mode === "simulate");
            document.getElementById("CORA-rectify").checked = (message.setup.mode === "rectify");


            //document.getElementById('CORA-imgonly').addEventListener('change', optionsChanged);
            //document.getElementById("CORA-CDSS").addEventListener('input', optionsChanged);
            //document.getElementById("CORA-CCSS").addEventListener('input', optionsChanged);
            document.getElementById("CORA-normal").addEventListener('change', optionsChanged);
            document.getElementById("CORA-deuteranopia").addEventListener('change', optionsChanged);
            document.getElementById("CORA-protanopia").addEventListener('change', optionsChanged);
            document.getElementById("CORA-tritanopia").addEventListener('change', optionsChanged);
            document.getElementById("CORA-simulate").addEventListener('change', optionsChanged);
            document.getElementById("CORA-rectify").addEventListener('change', optionsChanged);

            document.getElementById('CORA-savebutton').addEventListener('click', saveSettings);
            optionsChanged();
        }

        break;
    }
});

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    WebExtension.tabs.query({active: true, currentWindow: true}, function (tabs) {
        console.log("tab stuff");
        tab = tabs[0].id;
        WebExtension.tabs.sendMessage(tab, {action: "getSetup"});
    });

});