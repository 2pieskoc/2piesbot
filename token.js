/* ============================================================
   2PiesKOC Token Collector Tab
   Boss Battle + Conquest Token Helper
   Add-on tab for PowerBot+/2PiesKOC style bots

   This tab is rewritten by DarknessKoc
   ============================================================ */

(function () {
    var root = (typeof unsafeWindow !== "undefined") ? unsafeWindow : window;

    if (!root.Tabs) {
        root.Tabs = {};
    }

    root.Tabs.TwoPiesTokens = {
        tabLabel: "2Pies Tokens",
        tabOrder: 998,
        tabColor: "#0b1b33",

        init: function (div) {
            TwoPiesTokensTab.init(div);
        },

        show: function () {
            TwoPiesTokensTab.refreshUI();
        }
    };

    var TwoPiesTokensTab = {
        version: "1.0.0",
        div: null,
        timer: null,
        running: false,
        lastCollect: 0,
        logLimit: 120,

        settings: {
            autoCollect: false,
            bossBattle: true,
            conquest: true,
            scanDelay: 8000,
            safeMode: true,
            notify: true
        },

        stats: {
            scans: 0,
            clicks: 0,
            bossClicks: 0,
            conquestClicks: 0,
            blocked: 0,
            lastFound: 0
        },

        init: function (div) {
            this.div = (window.jQuery) ? jQuery(div) : null;

            this.loadSettings();
            this.draw();

            this.log("2Pies Token Collector loaded.");
            this.log("Signature: This tab is rewritten by DarknessKoc");

            if (this.settings.autoCollect) {
                this.start();
            }
        },

        draw: function () {
            if (!this.div) return;

            var html = [];

            html.push('<div id="tpiesTokenWrap" style="font-family:Arial,Helvetica,sans-serif;color:#f7d77a;background:#071526;padding:10px;border-radius:8px;">');

            html.push('<div style="background:#0b1b33;border:1px solid #c9a53a;border-radius:8px;padding:10px;margin-bottom:10px;">');
            html.push('<div style="font-size:18px;font-weight:bold;color:#ffd86b;">⚔ 2Pies Token Collector</div>');
            html.push('<div style="font-size:11px;color:#d7c27a;margin-top:3px;">Boss Battle + Conquest token helper • v' + this.version + '</div>');
            html.push('<div style="font-size:11px;color:#aaa;margin-top:3px;">This tab is rewritten by DarknessKoc</div>');
            html.push('</div>');

            html.push('<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px;">');
            html.push(this.card("Status", '<span id="tpiesTokenStatus">Stopped</span>'));
            html.push(this.card("Scans", '<span id="tpiesTokenScans">0</span>'));
            html.push(this.card("Claims", '<span id="tpiesTokenClicks">0</span>'));
            html.push(this.card("Found", '<span id="tpiesTokenFound">0</span>'));
            html.push('</div>');

            html.push('<div style="background:#0b1b33;border:1px solid #2e4770;border-radius:8px;padding:10px;margin-bottom:10px;">');
            html.push('<div style="font-weight:bold;color:#ffd86b;margin-bottom:8px;">Options</div>');

            html.push('<label style="display:block;margin:5px 0;"><input type="checkbox" id="tpiesBossBattle"> Track Boss Battle tokens</label>');
            html.push('<label style="display:block;margin:5px 0;"><input type="checkbox" id="tpiesConquest"> Track Conquest tokens</label>');
            html.push('<label style="display:block;margin:5px 0;"><input type="checkbox" id="tpiesSafeMode"> Safe mode: do not click buy/spend/gem buttons</label>');
            html.push('<label style="display:block;margin:5px 0;"><input type="checkbox" id="tpiesNotify"> Show small alerts in log</label>');

            html.push('<div style="margin-top:8px;">');
            html.push('Scan delay: ');
            html.push('<input id="tpiesScanDelay" type="number" min="3000" step="1000" style="width:90px;background:#071526;color:#ffd86b;border:1px solid #c9a53a;border-radius:4px;padding:3px;"> ms');
            html.push('</div>');

            html.push('</div>');

            html.push('<div style="background:#0b1b33;border:1px solid #2e4770;border-radius:8px;padding:10px;margin-bottom:10px;">');
            html.push('<button id="tpiesScanNow" style="' + this.btnStyle() + '">Scan Now</button> ');
            html.push('<button id="tpiesCollectNow" style="' + this.btnStyle() + '">Collect Now</button> ');
            html.push('<button id="tpiesStartAuto" style="' + this.btnStyle() + '">Start Auto</button> ');
            html.push('<button id="tpiesStopAuto" style="' + this.btnStyle() + '">Stop</button> ');
            html.push('<button id="tpiesClearLog" style="' + this.btnStyle() + '">Clear Log</button>');
            html.push('</div>');

            html.push('<div style="background:#050d18;border:1px solid #2e4770;border-radius:8px;padding:10px;height:260px;overflow:auto;font-size:12px;color:#d7d7d7;" id="tpiesTokenLog"></div>');

            html.push('</div>');

            this.div.html(html.join(""));

            this.bind();
            this.refreshUI();
        },

        card: function (title, value) {
            return [
                '<div style="background:#050d18;border:1px solid #2e4770;border-radius:8px;padding:8px;text-align:center;">',
                '<div style="font-size:11px;color:#aaa;">' + title + '</div>',
                '<div style="font-size:18px;font-weight:bold;color:#ffd86b;">' + value + '</div>',
                '</div>'
            ].join("");
        },

        btnStyle: function () {
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

            jQuery("#tpiesBossBattle").prop("checked", this.settings.bossBattle);
            jQuery("#tpiesConquest").prop("checked", this.settings.conquest);
            jQuery("#tpiesSafeMode").prop("checked", this.settings.safeMode);
            jQuery("#tpiesNotify").prop("checked", this.settings.notify);
            jQuery("#tpiesScanDelay").val(this.settings.scanDelay);

            jQuery("#tpiesBossBattle").off("change").on("change", function () {
                self.settings.bossBattle = this.checked;
                self.saveSettings();
            });

            jQuery("#tpiesConquest").off("change").on("change", function () {
                self.settings.conquest = this.checked;
                self.saveSettings();
            });

            jQuery("#tpiesSafeMode").off("change").on("change", function () {
                self.settings.safeMode = this.checked;
                self.saveSettings();
            });

            jQuery("#tpiesNotify").off("change").on("change", function () {
                self.settings.notify = this.checked;
                self.saveSettings();
            });

            jQuery("#tpiesScanDelay").off("change").on("change", function () {
                var n = parseInt(this.value, 10);
                if (isNaN(n) || n < 3000) n = 3000;
                self.settings.scanDelay = n;
                self.saveSettings();

                if (self.running) {
                    self.stop();
                    self.start();
                }
            });

            jQuery("#tpiesScanNow").off("click").on("click", function () {
                self.scan(false);
            });

            jQuery("#tpiesCollectNow").off("click").on("click", function () {
                self.scan(true);
            });

            jQuery("#tpiesStartAuto").off("click").on("click", function () {
                self.start();
            });

            jQuery("#tpiesStopAuto").off("click").on("click", function () {
                self.stop();
            });

            jQuery("#tpiesClearLog").off("click").on("click", function () {
                jQuery("#tpiesTokenLog").html("");
            });
        },

        start: function () {
            var self = this;

            if (this.running) return;

            this.running = true;
            this.settings.autoCollect = true;
            this.saveSettings();

            this.log("Auto token scan started.");

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

            this.log("Auto token scan stopped.");
            this.refreshUI();
        },

        scan: function (doClick) {
            this.stats.scans++;

            var found = this.findTokenButtons();
            this.stats.lastFound = found.length;

            if (!found.length) {
                this.log("Scan complete: no claimable token buttons found.");
                this.refreshUI();
                return;
            }

            this.log("Scan found " + found.length + " possible token button(s).");

            if (doClick) {
                this.claim(found);
            }

            this.refreshUI();
        },

        claim: function (buttons) {
            var self = this;
            var now = Date.now();

            if (now - this.lastCollect < 1200) {
                this.log("Claim skipped: cooldown active.");
                return;
            }

            this.lastCollect = now;

            jQuery.each(buttons, function (i, item) {
                setTimeout(function () {
                    try {
                        if (!item.el || !jQuery(item.el).is(":visible")) return;

                        item.el.click();

                        self.stats.clicks++;

                        if (item.type === "boss") {
                            self.stats.bossClicks++;
                            self.log("Clicked Boss Battle token claim.");
                        } else if (item.type === "conquest") {
                            self.stats.conquestClicks++;
                            self.log("Clicked Conquest token claim.");
                        } else {
                            self.log("Clicked token claim.");
                        }

                        self.refreshUI();
                    } catch (e) {
                        self.log("Click failed: " + e.message);
                    }
                }, i * 900);
            });
        },

        findTokenButtons: function () {
            var self = this;
            var results = [];
            var docs = this.getDocuments();

            jQuery.each(docs, function (d, doc) {
                var $doc;

                try {
                    $doc = jQuery(doc);
                } catch (e) {
                    return true;
                }

                var $items = jQuery("button,a,input[type='button'],input[type='submit'],div,span", doc);

                $items.each(function () {
                    var el = this;
                    var $el = jQuery(el);

                    if (!$el.is(":visible")) return;

                    var text = self.getText($el);
                    var context = self.getContextText($el);

                    if (!text && !context) return;

                    var combined = (text + " " + context).toLowerCase();

                    var isClaim =
                        /claim|collect|get|redeem|receive|accept/.test(combined);

                    var isToken =
                        /token|tokens|boss battle|boss|conquest/.test(combined);

                    var isBoss =
                        /boss battle|boss/.test(combined);

                    var isConquest =
                        /conquest/.test(combined);

                    var blocked =
                        /buy|purchase|spend|gem|gems|coin|coins|gold|pay|shop|store/.test(combined);

                    if (!isClaim || !isToken) return;

                    if (self.settings.safeMode && blocked) {
                        self.stats.blocked++;
                        return;
                    }

                    if (isBoss && !self.settings.bossBattle) return;
                    if (isConquest && !self.settings.conquest) return;

                    var type = "token";
                    if (isBoss) type = "boss";
                    if (isConquest) type = "conquest";

                    if (!self.alreadyAdded(results, el)) {
                        results.push({
                            el: el,
                            type: type,
                            text: text
                        });
                    }
                });
            });

            return results;
        },

        getDocuments: function () {
            var docs = [document];

            jQuery("iframe").each(function () {
                try {
                    if (this.contentWindow && this.contentWindow.document) {
                        docs.push(this.contentWindow.document);
                    }
                } catch (e) {
                    // Cross-domain iframe blocked by browser. Normal.
                }
            });

            return docs;
        },

        getText: function ($el) {
            var text = "";

            try {
                if ($el.is("input")) {
                    text = $el.val() || $el.attr("value") || "";
                } else {
                    text = $el.text() || "";
                }
            } catch (e) {
                text = "";
            }

            return jQuery.trim(text).replace(/\s+/g, " ");
        },

        getContextText: function ($el) {
            var text = "";

            try {
                text = $el.closest("div,td,tr,li,section").text() || "";
            } catch (e) {
                text = "";
            }

            text = jQuery.trim(text).replace(/\s+/g, " ");

            if (text.length > 500) {
                text = text.substring(0, 500);
            }

            return text;
        },

        alreadyAdded: function (arr, el) {
            for (var i = 0; i < arr.length; i++) {
                if (arr[i].el === el) return true;
            }
            return false;
        },

        refreshUI: function () {
            jQuery("#tpiesTokenStatus").text(this.running ? "Running" : "Stopped");
            jQuery("#tpiesTokenScans").text(this.stats.scans);
            jQuery("#tpiesTokenClicks").text(this.stats.clicks);
            jQuery("#tpiesTokenFound").text(this.stats.lastFound);
        },

        log: function (msg) {
            var box = jQuery("#tpiesTokenLog");
            if (!box.length) return;

            var time = new Date();
            var stamp =
                this.pad(time.getHours()) + ":" +
                this.pad(time.getMinutes()) + ":" +
                this.pad(time.getSeconds());

            var line = '<div style="border-bottom:1px solid #14223a;padding:3px 0;">' +
                '<span style="color:#ffd86b;">[' + stamp + ']</span> ' +
                this.escapeHtml(msg) +
                '</div>';

            box.prepend(line);

            var rows = box.children("div");
            if (rows.length > this.logLimit) {
                rows.slice(this.logLimit).remove();
            }
        },

        pad: function (n) {
            return n < 10 ? "0" + n : "" + n;
        },

        escapeHtml: function (s) {
            return String(s)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        },

        saveSettings: function () {
            try {
                localStorage.setItem("TwoPiesTokensSettings", JSON.stringify(this.settings));
            } catch (e) {}
        },

        loadSettings: function () {
            try {
                var raw = localStorage.getItem("TwoPiesTokensSettings");
                if (!raw) return;

                var saved = JSON.parse(raw);

                for (var k in saved) {
                    if (saved.hasOwnProperty(k) && this.settings.hasOwnProperty(k)) {
                        this.settings[k] = saved[k];
                    }
                }
            } catch (e) {}
        }
    };
})();