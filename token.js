/* ============================================================
   2Pies Tokens Tab - Fixed Loader Version
   Boss Battle + Conquest Token Helper

   This tab is rewritten by DarknessKoc
   ============================================================ */

(function () {
    var root = (typeof unsafeWindow !== "undefined") ? unsafeWindow : window;
    var STORE_KEY = "TwoPiesTokensSettings_v2";

    var TwoPiesTokens = {
        version: "1.1.0",
        box: null,
        timer: null,
        running: false,
        lastClick: 0,

        settings: {
            autoCollect: false,
            bossBattle: true,
            conquest: true,
            safeMode: true,
            scanDelay: 8000
        },

        stats: {
            scans: 0,
            found: 0,
            clicks: 0,
            blocked: 0
        },

        init: function (div) {
            this.box = this.getElement(div);

            if (!this.box) {
                this.openFloatingPanel();
                return;
            }

            this.loadSettings();
            this.draw();
            this.log("2Pies Tokens loaded.");
            this.log("This tab is rewritten by DarknessKoc");

            if (this.settings.autoCollect) {
                this.start();
            }
        },

        getElement: function (div) {
            if (!div) return null;

            if (div.jquery && div[0]) return div[0];
            if (div.nodeType === 1) return div;

            if (typeof div === "string") {
                return document.getElementById(div.replace("#", ""));
            }

            return null;
        },

        draw: function () {
            if (!this.box) return;

            this.box.innerHTML =
                '<div id="tpiesTokensWrap" style="font-family:Arial;background:#071526;color:#ddd;padding:10px;border-radius:8px;">' +

                    '<div style="background:#0b1b33;border:1px solid #c9a53a;border-radius:8px;padding:10px;margin-bottom:10px;">' +
                        '<div style="font-size:18px;font-weight:bold;color:#ffd86b;">⚔ 2Pies Tokens</div>' +
                        '<div style="font-size:11px;color:#bbb;">Boss Battle + Conquest token helper • v' + this.version + '</div>' +
                        '<div style="font-size:11px;color:#999;">This tab is rewritten by DarknessKoc</div>' +
                    '</div>' +

                    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px;">' +
                        this.card("Status", '<span id="tpiesStatus">Stopped</span>') +
                        this.card("Scans", '<span id="tpiesScans">0</span>') +
                        this.card("Found", '<span id="tpiesFound">0</span>') +
                        this.card("Clicks", '<span id="tpiesClicks">0</span>') +
                    '</div>' +

                    '<div style="background:#0b1b33;border:1px solid #2e4770;border-radius:8px;padding:10px;margin-bottom:10px;">' +
                        '<label style="display:block;margin:5px 0;"><input type="checkbox" id="tpiesBoss"> Boss Battle tokens</label>' +
                        '<label style="display:block;margin:5px 0;"><input type="checkbox" id="tpiesConquest"> Conquest tokens</label>' +
                        '<label style="display:block;margin:5px 0;"><input type="checkbox" id="tpiesSafe"> Safe mode - block buy/gem/shop buttons</label>' +

                        '<div style="margin-top:8px;">' +
                            'Scan delay: ' +
                            '<input id="tpiesDelay" type="number" min="3000" step="1000" style="width:90px;background:#071526;color:#ffd86b;border:1px solid #c9a53a;border-radius:4px;padding:3px;"> ms' +
                        '</div>' +
                    '</div>' +

                    '<div style="background:#0b1b33;border:1px solid #2e4770;border-radius:8px;padding:10px;margin-bottom:10px;">' +
                        '<button id="tpiesScanNow" style="' + this.btn() + '">Scan Now</button>' +
                        '<button id="tpiesCollectNow" style="' + this.btn() + '">Collect Now</button>' +
                        '<button id="tpiesStart" style="' + this.btn() + '">Start Auto</button>' +
                        '<button id="tpiesStop" style="' + this.btn() + '">Stop</button>' +
                        '<button id="tpiesClear" style="' + this.btn() + '">Clear Log</button>' +
                    '</div>' +

                    '<div id="tpiesLog" style="background:#050d18;border:1px solid #2e4770;border-radius:8px;padding:8px;height:250px;overflow:auto;font-size:12px;"></div>' +

                '</div>';

            this.bind();
            this.refreshUI();
        },

        card: function (title, value) {
            return '' +
                '<div style="background:#050d18;border:1px solid #2e4770;border-radius:8px;padding:8px;text-align:center;">' +
                    '<div style="font-size:11px;color:#aaa;">' + title + '</div>' +
                    '<div style="font-size:18px;font-weight:bold;color:#ffd86b;">' + value + '</div>' +
                '</div>';
        },

        btn: function () {
            return [
                "background:#101f38",
                "color:#ffd86b",
                "border:1px solid #c9a53a",
                "border-radius:6px",
                "padding:6px 10px",
                "cursor:pointer",
                "font-weight:bold",
                "margin:2px"
            ].join(";");
        },

        bind: function () {
            var self = this;

            this.el("tpiesBoss").checked = this.settings.bossBattle;
            this.el("tpiesConquest").checked = this.settings.conquest;
            this.el("tpiesSafe").checked = this.settings.safeMode;
            this.el("tpiesDelay").value = this.settings.scanDelay;

            this.el("tpiesBoss").onchange = function () {
                self.settings.bossBattle = this.checked;
                self.saveSettings();
            };

            this.el("tpiesConquest").onchange = function () {
                self.settings.conquest = this.checked;
                self.saveSettings();
            };

            this.el("tpiesSafe").onchange = function () {
                self.settings.safeMode = this.checked;
                self.saveSettings();
            };

            this.el("tpiesDelay").onchange = function () {
                var n = parseInt(this.value, 10);
                if (isNaN(n) || n < 3000) n = 3000;

                self.settings.scanDelay = n;
                self.saveSettings();

                if (self.running) {
                    self.stop();
                    self.start();
                }
            };

            this.el("tpiesScanNow").onclick = function () {
                self.scan(false);
            };

            this.el("tpiesCollectNow").onclick = function () {
                self.scan(true);
            };

            this.el("tpiesStart").onclick = function () {
                self.start();
            };

            this.el("tpiesStop").onclick = function () {
                self.stop();
            };

            this.el("tpiesClear").onclick = function () {
                var log = self.el("tpiesLog");
                if (log) log.innerHTML = "";
            };
        },

        el: function (id) {
            return document.getElementById(id);
        },

        start: function () {
            var self = this;

            if (this.running) return;

            this.running = true;
            this.settings.autoCollect = true;
            this.saveSettings();

            this.log("Auto scan started.");

            this.timer = setInterval(function () {
                self.scan(true);
            }, this.settings.scanDelay);

            this.refreshUI();
            this.scan(true);
        },

        stop: function () {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }

            this.running = false;
            this.settings.autoCollect = false;
            this.saveSettings();

            this.log("Auto scan stopped.");
            this.refreshUI();
        },

        scan: function (doClick) {
            var buttons;

            this.stats.scans++;

            buttons = this.findButtons();
            this.stats.found = buttons.length;

            if (!buttons.length) {
                this.log("No token claim buttons found.");
                this.refreshUI();
                return;
            }

            this.log("Found " + buttons.length + " possible token button(s).");

            if (doClick) {
                this.claim(buttons);
            }

            this.refreshUI();
        },

        claim: function (buttons) {
            var self = this;
            var now = Date.now();

            if (now - this.lastClick < 1200) {
                this.log("Skipped: click cooldown active.");
                return;
            }

            this.lastClick = now;

            buttons.forEach(function (item, index) {
                setTimeout(function () {
                    try {
                        if (!item.el || !self.visible(item.el)) return;

                        item.el.click();
                        self.stats.clicks++;

                        self.log("Clicked: " + item.type + " token claim.");
                        self.refreshUI();
                    } catch (e) {
                        self.log("Click failed: " + e.message);
                    }
                }, index * 900);
            });
        },

        findButtons: function () {
            var docs = this.getDocs();
            var results = [];
            var self = this;

            docs.forEach(function (doc) {
                var items;

                try {
                    items = doc.querySelectorAll("button,a,input[type='button'],input[type='submit'],div,span");
                } catch (e) {
                    return;
                }

                Array.prototype.forEach.call(items, function (el) {
                    var text;
                    var context;
                    var combined;
                    var isClaim;
                    var isToken;
                    var isBoss;
                    var isConquest;
                    var blocked;

                    if (!self.visible(el)) return;

                    text = self.textOf(el);
                    context = self.contextOf(el);
                    combined = (text + " " + context).toLowerCase();

                    if (!combined) return;

                    isClaim = /claim|collect|get|redeem|receive|accept/.test(combined);
                    isToken = /token|tokens|boss battle|boss|conquest/.test(combined);
                    isBoss = /boss battle|boss/.test(combined);
                    isConquest = /conquest/.test(combined);

                    blocked = /buy|purchase|spend|gem|gems|coin|coins|gold|shop|store|pay/.test(combined);

                    if (!isClaim || !isToken) return;

                    if (self.settings.safeMode && blocked) {
                        self.stats.blocked++;
                        return;
                    }

                    if (isBoss && !self.settings.bossBattle) return;
                    if (isConquest && !self.settings.conquest) return;

                    if (self.exists(results, el)) return;

                    results.push({
                        el: el,
                        type: isBoss ? "Boss Battle" : isConquest ? "Conquest" : "Token"
                    });
                });
            });

            return results;
        },

        getDocs: function () {
            var docs = [document];

            Array.prototype.forEach.call(document.querySelectorAll("iframe"), function (frame) {
                try {
                    if (frame.contentWindow && frame.contentWindow.document) {
                        docs.push(frame.contentWindow.document);
                    }
                } catch (e) {}
            });

            return docs;
        },

        visible: function (el) {
            var style;
            var rect;

            if (!el) return false;

            style = window.getComputedStyle(el);
            if (!style) return false;

            if (style.display === "none") return false;
            if (style.visibility === "hidden") return false;
            if (parseFloat(style.opacity) === 0) return false;

            rect = el.getBoundingClientRect();

            return !!(rect.width || rect.height || el.getClientRects().length);
        },

        textOf: function (el) {
            var text = "";

            try {
                if (el.tagName === "INPUT") {
                    text = el.value || el.getAttribute("value") || "";
                } else {
                    text = el.innerText || el.textContent || "";
                }
            } catch (e) {}

            return this.clean(text);
        },

        contextOf: function (el) {
            var parent;
            var text = "";

            try {
                parent = el.closest("div,td,tr,li,section");
                if (parent) {
                    text = parent.innerText || parent.textContent || "";
                }
            } catch (e) {}

            text = this.clean(text);

            if (text.length > 500) {
                text = text.substring(0, 500);
            }

            return text;
        },

        clean: function (s) {
            return String(s || "").replace(/\s+/g, " ").trim();
        },

        exists: function (arr, el) {
            var i;

            for (i = 0; i < arr.length; i++) {
                if (arr[i].el === el) return true;
            }

            return false;
        },

        refreshUI: function () {
            if (this.el("tpiesStatus")) {
                this.el("tpiesStatus").innerHTML = this.running ? "Running" : "Stopped";
            }

            if (this.el("tpiesScans")) this.el("tpiesScans").innerHTML = this.stats.scans;
            if (this.el("tpiesFound")) this.el("tpiesFound").innerHTML = this.stats.found;
            if (this.el("tpiesClicks")) this.el("tpiesClicks").innerHTML = this.stats.clicks;
        },

        log: function (msg) {
            var log = this.el("tpiesLog");
            var now = new Date();
            var stamp;

            if (!log) return;

            stamp =
                this.pad(now.getHours()) + ":" +
                this.pad(now.getMinutes()) + ":" +
                this.pad(now.getSeconds());

            log.innerHTML =
                '<div style="border-bottom:1px solid #14223a;padding:3px 0;">' +
                    '<span style="color:#ffd86b;">[' + stamp + ']</span> ' +
                    this.escape(msg) +
                '</div>' + log.innerHTML;
        },

        pad: function (n) {
            return n < 10 ? "0" + n : "" + n;
        },

        escape: function (s) {
            return String(s)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        },

        saveSettings: function () {
            try {
                localStorage.setItem(STORE_KEY, JSON.stringify(this.settings));
            } catch (e) {}
        },

        loadSettings: function () {
            var raw;
            var saved;
            var k;

            try {
                raw = localStorage.getItem(STORE_KEY);
                if (!raw) return;

                saved = JSON.parse(raw);

                for (k in saved) {
                    if (saved.hasOwnProperty(k) && this.settings.hasOwnProperty(k)) {
                        this.settings[k] = saved[k];
                    }
                }
            } catch (e) {}
        },

        openFloatingPanel: function () {
            var panel;
            var body;
            var close;

            panel = document.getElementById("tpiesFloatingPanel");

            if (!panel) {
                panel = document.createElement("div");
                panel.id = "tpiesFloatingPanel";
                panel.style.cssText =
                    "position:fixed;top:80px;right:25px;width:520px;z-index:999999;" +
                    "background:#071526;border:2px solid #c9a53a;border-radius:10px;" +
                    "box-shadow:0 0 20px rgba(0,0,0,.6);";

                close = document.createElement("button");
                close.innerHTML = "×";
                close.style.cssText =
                    "position:absolute;right:6px;top:4px;background:#300;color:#fff;" +
                    "border:1px solid #900;border-radius:5px;cursor:pointer;font-size:16px;";
                close.onclick = function () {
                    panel.style.display = "none";
                };

                body = document.createElement("div");
                body.id = "tpiesFloatingBody";
                body.style.cssText = "padding:28px 8px 8px 8px;";

                panel.appendChild(close);
                panel.appendChild(body);
                document.body.appendChild(panel);
            } else {
                panel.style.display = "block";
                body = document.getElementById("tpiesFloatingBody");
            }

            this.box = body;
            this.draw();
        }
    };

    function makeTabObject() {
        var obj = {
            init: function (div) {
                TwoPiesTokens.init(div);
            },
            show: function () {
                TwoPiesTokens.refreshUI();
            },
            hide: function () {}
        };

        return {
            name: "TwoPiesTokens",
            title: "2Pies Tokens",
            label: "2Pies Tokens",
            tabLabel: "2Pies Tokens",
            tabOrder: 998,
            order: 998,

            obj: obj,

            init: obj.init,
            show: obj.show,
            hide: obj.hide
        };
    }

    function registerTab() {
        var tab;

        root.Tabs = root.Tabs || {};
        tab = makeTabObject();

        root.Tabs.TwoPiesTokens = tab;

        try {
            root.TwoPiesTokens = TwoPiesTokens;
            root.TwoPiesTokensForceOpen = function () {
                TwoPiesTokens.openFloatingPanel();
            };
        } catch (e) {}

        tryPushTabList(root.tabList, tab);
        tryPushTabList(root.Tabs.tabList, tab);
        tryPushTabList(root.Tabs.tabs, tab);
    }

    function tryPushTabList(list, tab) {
        var i;

        if (!list || !list.push) return;

        for (i = 0; i < list.length; i++) {
            if (
                list[i] &&
                (
                    list[i].name === "TwoPiesTokens" ||
                    list[i].title === "2Pies Tokens" ||
                    list[i].tabLabel === "2Pies Tokens"
                )
            ) {
                return;
            }
        }

        try {
            list.push({
                name: "TwoPiesTokens",
                title: "2Pies Tokens",
                label: "2Pies Tokens",
                tabLabel: "2Pies Tokens",
                tabOrder: 998,
                order: 998,
                obj: tab.obj,
                init: tab.init,
                show: tab.show,
                hide: tab.hide
            });
        } catch (e) {}
    }

    function addFallbackButton() {
        var btn;

        if (document.getElementById("tpiesTokenFallbackBtn")) return;
        if (!document.body) return;

        btn = document.createElement("button");
        btn.id = "tpiesTokenFallbackBtn";
        btn.innerHTML = "2Pies Tokens";
        btn.style.cssText =
            "position:fixed;bottom:20px;right:20px;z-index:999999;" +
            "background:#101f38;color:#ffd86b;border:1px solid #c9a53a;" +
            "border-radius:8px;padding:8px 12px;font-weight:bold;cursor:pointer;";

        btn.onclick = function () {
            TwoPiesTokens.openFloatingPanel();
        };

        document.body.appendChild(btn);
    }

    function boot() {
        var tries = 0;

        registerTab();

        var timer = setInterval(function () {
            tries++;
            registerTab();

            if (document.body) {
                addFallbackButton();
            }

            if (tries >= 40) {
                clearInterval(timer);
            }
        }, 500);

        if (document.body) {
            addFallbackButton();
        } else {
            setTimeout(addFallbackButton, 1500);
        }

        try {
            console.log("2Pies Tokens tab registered. If menu does not show it, run: TwoPiesTokensForceOpen()");
        } catch (e) {}
    }

    boot();
})();
