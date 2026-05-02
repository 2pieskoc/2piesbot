/**
 * TRStatSearch - Full Rewrite With Levels + Card Counts
 * Paste this whole block over your old Tabs.TRSorterByStat block.
 * This tab is rewritten by DarknessKoc
 */

Tabs.TRSorterByStat = {
    tabOrder: 8005,
    tabLabel: "TRStatSearch",

    myDiv: null,

    sortKey: 0,
    sortDir: -1,
    searchText: "",
    levelFilter: 0,

    _styleInjected: false,
    _cardCache: {},
    _textCache: {},
    _lastSignature: "",
    _timer: null,

    // -----------------------------
    // Helpers
    // -----------------------------
    has: function (obj, key) {
        try {
            return Object.prototype.hasOwnProperty.call(obj, key);
        } catch (e) {
            return false;
        }
    },

    byId: function (id) {
        try {
            if (typeof ById === "function") return ById(id);
        } catch (e) {}
        return document.getElementById(id);
    },

    trim: function (s) {
        return String(s == null ? "" : s).replace(/^\s+|\s+$/g, "");
    },

    lower: function (s) {
        return this.trim(s).toLowerCase();
    },

    htmlSafe: function (s) {
        s = String(s == null ? "" : s);
        return s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    getCM: function () {
        try {
            if (typeof uW !== "undefined" && uW && uW.CM) return uW.CM;
        } catch (e) {}

        try {
            if (typeof CM !== "undefined" && CM) return CM;
        } catch (e2) {}

        return null;
    },

    getRef: function () {
        try {
            if (Tabs && Tabs.Reference) return Tabs.Reference;
        } catch (e) {}
        return null;
    },

    deps: function () {
        var ref = this.getRef();
        var cm = this.getCM();

        var refOk = !!(
            ref &&
            ref.UniqueTRItems &&
            typeof ref.DisplayTRCard === "function"
        );

        var cmOk = !!(
            cm &&
            cm.thronestats &&
            cm.thronestats.tiers &&
            cm.thronestats.effects
        );

        return {
            ref: ref,
            cm: cm,
            refOk: refOk,
            cmOk: cmOk
        };
    },

    waitFor: function (testFn, readyFn, timeoutMs) {
        var start = new Date().getTime();

        function tick() {
            var ok = false;

            try {
                ok = !!testFn();
            } catch (e) {
                ok = false;
            }

            if (ok) {
                try { readyFn(false); } catch (e2) {}
                return;
            }

            if (timeoutMs && ((new Date().getTime() - start) > timeoutMs)) {
                try { readyFn(true); } catch (e3) {}
                return;
            }

            setTimeout(tick, 150);
        }

        tick();
    },

    isArray: function (x) {
        return Object.prototype.toString.call(x) === "[object Array]";
    },

    // -----------------------------
    // CSS
    // -----------------------------
    ensureStyle: function () {
        if (this._styleInjected) return;

        if (document.getElementById("trss3_style")) {
            this._styleInjected = true;
            return;
        }

        var css = [];
        css.push("#trss3_wrap{box-sizing:border-box;width:100%;font-size:12px;}");
        css.push(".trss3_credit{width:100%;box-sizing:border-box;text-align:center;font-weight:bold;font-size:13px;padding:7px 10px;margin:0 0 8px 0;border-radius:8px;background:#151515;color:#ffd700;border:1px solid #444;}");
        css.push(".trss3_panel{box-sizing:border-box;width:100%;padding:8px;margin-bottom:8px;border:1px solid #333;border-radius:8px;background:#1d1d1d;color:#eee;}");
        css.push(".trss3_row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}");
        css.push(".trss3_row label{font-weight:bold;}");
        css.push(".trss3_row input[type='text']{width:270px;padding:3px 6px;box-sizing:border-box;}");
        css.push(".trss3_row select{max-width:290px;padding:2px 4px;}");
        css.push(".trss3_btn{padding:3px 10px;cursor:pointer;border-radius:4px;border:1px solid #555;background:#2b2b2b;color:#fff;}");
        css.push(".trss3_btn:hover{background:#3a3a3a;}");
        css.push(".trss3_status{padding:6px 2px;color:#ddd;opacity:0.9;}");
        css.push(".trss3_small{opacity:0.8;font-size:11px;}");
        css.push(".trss3_summary{margin-top:8px;padding:8px;border:1px solid #333;border-radius:8px;background:#111;color:#eee;}");
        css.push(".trss3_summary_title{font-weight:bold;color:#ffd700;margin-bottom:6px;}");
        css.push(".trss3_level_badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;}");
        css.push(".trss3_badge{display:inline-block;padding:3px 7px;border:1px solid #555;border-radius:12px;background:#222;color:#fff;font-size:11px;}");
        css.push(".trss3_table_wrap{max-height:170px;overflow:auto;border:1px solid #333;border-radius:6px;}");
        css.push(".trss3_table{width:100%;border-collapse:collapse;font-size:11px;}");
        css.push(".trss3_table th{position:sticky;top:0;background:#222;color:#ffd700;text-align:left;padding:4px;border-bottom:1px solid #444;}");
        css.push(".trss3_table td{padding:4px;border-bottom:1px solid #292929;}");
        css.push(".trss3_table tr:hover td{background:#1c1c1c;}");
        css.push("#trss3_cards{height:calc(100vh - 410px);min-height:260px;overflow-y:auto;overflow-x:hidden;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;align-items:start;padding:2px;box-sizing:border-box;}");
        css.push("#trss3_cards .trss3_card{width:100%;box-sizing:border-box;border:1px solid #333;border-radius:8px;background:#111;padding:4px;}");
        css.push(".trss3_card_meta{display:flex;justify-content:space-between;gap:5px;align-items:center;padding:3px 5px;margin-bottom:4px;border-radius:5px;background:#222;color:#ffd700;font-weight:bold;font-size:11px;}");
        css.push("#trss3_cards .trss3_card > *{width:100% !important;max-width:100% !important;box-sizing:border-box !important;}");
        css.push("@media(max-width:1300px){#trss3_cards{grid-template-columns:repeat(3,minmax(0,1fr));}}");
        css.push("@media(max-width:950px){#trss3_cards{grid-template-columns:repeat(2,minmax(0,1fr));}}");

        var style = document.createElement("style");
        style.id = "trss3_style";
        style.type = "text/css";
        style.innerHTML = css.join("\n");
        document.head.appendChild(style);

        this._styleInjected = true;
    },

    // -----------------------------
    // Item data
    // -----------------------------
    getItems: function () {
        var d = this.deps();
        var out = [];

        if (!d.refOk) return out;

        var src = d.ref.UniqueTRItems;

        for (var k in src) {
            if (this.has(src, k) && src[k]) {
                out.push(src[k]);
            }
        }

        return out;
    },

    getItemId: function (item) {
        if (!item) return "";

        var id =
            item.Id != null ? item.Id :
            item.ID != null ? item.ID :
            item.ItemId != null ? item.ItemId :
            item.itemId != null ? item.itemId :
            item.id != null ? item.id :
            item.uid != null ? item.uid :
            "";

        return id;
    },

    getItemName: function (item) {
        if (!item) return "";

        var n =
            item.Name != null ? item.Name :
            item.name != null ? item.name :
            item.Title != null ? item.Title :
            item.title != null ? item.title :
            item.DisplayName != null ? item.DisplayName :
            item.displayName != null ? item.displayName :
            "";

        if (this.trim(n) !== "") return String(n);

        if (item.info) {
            n =
                item.info.Name != null ? item.info.Name :
                item.info.name != null ? item.info.name :
                item.info.Title != null ? item.info.Title :
                item.info.title != null ? item.info.title :
                "";

            if (this.trim(n) !== "") return String(n);
        }

        var id = this.getItemId(item);

        try {
            if (
                id !== "" &&
                typeof uW !== "undefined" &&
                uW.itemlist &&
                uW.itemlist["i" + id] &&
                uW.itemlist["i" + id].name
            ) {
                return String(uW.itemlist["i" + id].name);
            }
        } catch (e) {}

        return id !== "" ? "TR Card " + id : "Unknown TR Card";
    },

    getItemLevel: function (item) {
        if (!item) return 0;

        var v =
            item.Level != null ? item.Level :
            item.level != null ? item.level :
            item.Tier != null ? item.Tier :
            item.tier != null ? item.tier :
            item.Rarity != null ? item.Rarity :
            item.rarity != null ? item.rarity :
            item.CardLevel != null ? item.CardLevel :
            item.cardLevel != null ? item.cardLevel :
            item.Lvl != null ? item.Lvl :
            item.lvl != null ? item.lvl :
            null;

        if (v == null && item.info) {
            v =
                item.info.Level != null ? item.info.Level :
                item.info.level != null ? item.info.level :
                item.info.Tier != null ? item.info.Tier :
                item.info.tier != null ? item.info.tier :
                null;
        }

        v = parseInt(v, 10);

        if (isNaN(v) || v < 0) return 0;
        return v;
    },

    readCountField: function (obj) {
        if (!obj) return null;

        var fields = [
            "Count", "count",
            "Qty", "qty",
            "Quantity", "quantity",
            "Amount", "amount",
            "Owned", "owned",
            "Total", "total",
            "Num", "num",
            "Stack", "stack",
            "Have", "have",
            "Copies", "copies",
            "numOwned", "NumOwned",
            "ownedCount", "OwnedCount"
        ];

        for (var i = 0; i < fields.length; i++) {
            if (obj[fields[i]] != null) {
                var n = parseInt(obj[fields[i]], 10);
                if (!isNaN(n) && n >= 0) return n;
            }
        }

        return null;
    },

    getOwnedCount: function (item) {
        if (!item) return 0;

        var direct = this.readCountField(item);
        if (direct != null) return direct;

        if (item.info) {
            var nested = this.readCountField(item.info);
            if (nested != null) return nested;
        }

        var id = this.getItemId(item);

        try {
            if (id !== "" && typeof uW !== "undefined") {
                var sources = [
                    uW.itemcounts,
                    uW.itemCounts,
                    uW.inventory,
                    uW.Inventory,
                    uW.items,
                    uW.Items,
                    uW.ksoItems,
                    uW.itemlist
                ];

                for (var i = 0; i < sources.length; i++) {
                    var src = sources[i];
                    if (!src) continue;

                    var node = src["i" + id] || src[id];
                    var c = this.readCountField(node);

                    if (c != null) return c;
                }
            }
        } catch (e) {}

        // Fallback: if the card object exists, count it as 1.
        return 1;
    },

    getItemEffects: function (item) {
        if (!item) return null;
        return item.effects || item.Effects || item.effect || item.Effect || null;
    },

    getSlotEffectId: function (slot) {
        if (!slot) return 0;

        var id =
            slot.id != null ? slot.id :
            slot.Id != null ? slot.Id :
            slot.effectId != null ? slot.effectId :
            slot.EffectId != null ? slot.EffectId :
            slot.effect != null ? slot.effect :
            slot.Effect != null ? slot.Effect :
            0;

        id = parseInt(id, 10);
        return isNaN(id) ? 0 : id;
    },

    getSlotTier: function (slot) {
        if (!slot) return 0;

        var tier =
            slot.tier != null ? slot.tier :
            slot.Tier != null ? slot.Tier :
            slot.level != null ? slot.level :
            slot.Level != null ? slot.Level :
            0;

        tier = parseInt(tier, 10);
        return isNaN(tier) ? 0 : tier;
    },

    getCacheKey: function (item) {
        var id = this.getItemId(item);
        if (id !== "") return "id:" + id;

        var name = this.getItemName(item);
        var lv = this.getItemLevel(item);

        var eff = "";
        try {
            eff = JSON.stringify(this.getItemEffects(item) || {});
        } catch (e) {}

        return "name:" + name + "|lv:" + lv + "|eff:" + eff;
    },

    // -----------------------------
    // Render cards
    // -----------------------------
    renderCard: function (item) {
        var key = this.getCacheKey(item);

        if (this._cardCache[key]) return this._cardCache[key];

        var html = "";

        try {
            var d = this.deps();

            if (!d.refOk) {
                html = "<div class='trss3_status'>Waiting for TR card renderer...</div>";
            } else {
                var card = d.ref.DisplayTRCard(item, true, 1);
                html = this.isArray(card) ? card.join("") : String(card || "");
            }
        } catch (e) {
            html = "<div class='trss3_status'>Card render failed.</div>";
        }

        this._cardCache[key] = html;
        return html;
    },

    renderCardBox: function (item) {
        var name = this.getItemName(item);
        var lv = this.getItemLevel(item);
        var count = this.getOwnedCount(item);

        var levelText = lv > 0 ? "Level " + lv : "Level ?";
        var countText = "Have: " + count;

        var html = "";
        html += "<div class='trss3_card'>";
        html += "   <div class='trss3_card_meta'>";
        html += "       <span>" + this.htmlSafe(levelText) + "</span>";
        html += "       <span>" + this.htmlSafe(countText) + "</span>";
        html += "   </div>";
        html += this.renderCard(item);
        html += "</div>";

        return html;
    },

    getRenderedText: function (item) {
        var key = this.getCacheKey(item);

        if (this._textCache[key]) return this._textCache[key];

        var text = "";

        try {
            var div = document.createElement("div");
            div.innerHTML = this.renderCard(item);
            text = div.textContent || div.innerText || "";
        } catch (e) {}

        this._textCache[key] = text;
        return text;
    },

    getSearchBlob: function (item) {
        var parts = [];

        parts.push(this.getItemName(item));
        parts.push(this.getItemId(item));
        parts.push("level " + this.getItemLevel(item));
        parts.push("have " + this.getOwnedCount(item));
        parts.push(this.getRenderedText(item));

        try {
            parts.push(JSON.stringify(item));
        } catch (e) {}

        return this.lower(parts.join(" "));
    },

    // -----------------------------
    // Filtering and sorting
    // -----------------------------
    filterBySearch: function (list) {
        var t = this;
        var q = t.lower(t.searchText);

        if (!q) return list;

        var terms = q.split(/\s+/);

        return list.filter(function (item) {
            var blob = t.getSearchBlob(item);

            for (var i = 0; i < terms.length; i++) {
                if (terms[i] && blob.indexOf(terms[i]) === -1) return false;
            }

            return true;
        });
    },

    filterByLevel: function (list) {
        var t = this;

        if (!t.levelFilter) return list;

        return list.filter(function (item) {
            return t.getItemLevel(item) === t.levelFilter;
        });
    },

    itemHasEffect: function (item, effectId) {
        var effects = this.getItemEffects(item);
        effectId = parseInt(effectId, 10);

        if (!effects || !effectId) return false;

        if (this.isArray(effects)) {
            for (var i = 0; i < effects.length; i++) {
                if (this.getSlotEffectId(effects[i]) === effectId) return true;
            }
            return false;
        }

        for (var k in effects) {
            if (this.has(effects, k)) {
                if (this.getSlotEffectId(effects[k]) === effectId) return true;
            }
        }

        return false;
    },

    getItemStat: function (item, effectId) {
        var d = this.deps();
        var effects = this.getItemEffects(item);

        effectId = parseInt(effectId, 10);

        if (!item || !effects || !effectId || !d.cmOk) return 0;

        var tiers = d.cm.thronestats.tiers;
        var total = 0;
        var t = this;

        function addSlot(slot) {
            if (!slot) return;

            var sid = t.getSlotEffectId(slot);
            if (sid !== effectId) return;

            var tier = t.getSlotTier(slot);
            var tierData = null;

            while (tier > 0) {
                if (tiers[effectId] && tiers[effectId][tier]) {
                    tierData = tiers[effectId][tier];
                    break;
                }
                tier--;
            }

            if (tierData) {
                var val =
                    tierData.base != null ? tierData.base :
                    tierData.Base != null ? tierData.Base :
                    tierData.value != null ? tierData.value :
                    tierData.Value != null ? tierData.Value :
                    0;

                val = parseFloat(val);
                if (!isNaN(val)) total += val;
            }
        }

        if (this.isArray(effects)) {
            for (var i = 0; i < effects.length; i++) addSlot(effects[i]);
        } else {
            for (var k in effects) {
                if (this.has(effects, k)) addSlot(effects[k]);
            }
        }

        return total;
    },

    sortItems: function (list) {
        var t = this;

        if (!t.sortKey) {
            list.sort(function (a, b) {
                var al = t.getItemLevel(a);
                var bl = t.getItemLevel(b);

                if (al !== bl) return bl - al;

                var an = t.lower(t.getItemName(a));
                var bn = t.lower(t.getItemName(b));

                if (an < bn) return -1;
                if (an > bn) return 1;
                return 0;
            });

            return list;
        }

        var effectId = parseInt(t.sortKey, 10);

        list = list.filter(function (item) {
            return t.itemHasEffect(item, effectId);
        });

        list.sort(function (a, b) {
            var av = t.getItemStat(a, effectId);
            var bv = t.getItemStat(b, effectId);

            if (av === bv) {
                var al = t.getItemLevel(a);
                var bl = t.getItemLevel(b);

                if (al !== bl) return bl - al;

                var an = t.lower(t.getItemName(a));
                var bn = t.lower(t.getItemName(b));

                if (an < bn) return -1;
                if (an > bn) return 1;
                return 0;
            }

            return (bv - av) * t.sortDir;
        });

        return list;
    },

    // -----------------------------
    // Summary: levels and card counts
    // -----------------------------
    buildSummary: function (items) {
        var byCard = {};
        var byLevel = {};
        var totalCopies = 0;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var name = this.getItemName(item);
            var lv = this.getItemLevel(item);
            var count = this.getOwnedCount(item);
            var id = this.getItemId(item);

            if (count < 0 || isNaN(count)) count = 0;

            totalCopies += count;

            var levelKey = lv > 0 ? String(lv) : "?";

            if (!byLevel[levelKey]) {
                byLevel[levelKey] = {
                    level: levelKey,
                    types: 0,
                    copies: 0
                };
            }

            byLevel[levelKey].copies += count;
            byLevel[levelKey].types += 1;

            var key = name + "||" + levelKey;

            if (!byCard[key]) {
                byCard[key] = {
                    name: name,
                    level: levelKey,
                    copies: 0,
                    types: 0,
                    ids: []
                };
            }

            byCard[key].copies += count;
            byCard[key].types += 1;

            if (id !== "") byCard[key].ids.push(id);
        }

        var levelList = [];
        for (var lk in byLevel) {
            if (this.has(byLevel, lk)) levelList.push(byLevel[lk]);
        }

        levelList.sort(function (a, b) {
            var av = a.level === "?" ? -1 : parseInt(a.level, 10);
            var bv = b.level === "?" ? -1 : parseInt(b.level, 10);
            return bv - av;
        });

        var cardList = [];
        for (var ck in byCard) {
            if (this.has(byCard, ck)) cardList.push(byCard[ck]);
        }

        var self = this;

        cardList.sort(function (a, b) {
            var al = a.level === "?" ? -1 : parseInt(a.level, 10);
            var bl = b.level === "?" ? -1 : parseInt(b.level, 10);

            if (al !== bl) return bl - al;

            if (b.copies !== a.copies) return b.copies - a.copies;

            var an = self.lower(a.name);
            var bn = self.lower(b.name);

            if (an < bn) return -1;
            if (an > bn) return 1;
            return 0;
        });

        return {
            totalCopies: totalCopies,
            levelList: levelList,
            cardList: cardList
        };
    },

    renderSummary: function (items) {
        var div = this.byId("trss3_summary");
        if (!div) return;

        var s = this.buildSummary(items);

        var html = "";

        html += "<div class='trss3_summary_title'>Levels + Card Counts</div>";

        html += "<div class='trss3_level_badges'>";
        html += "<span class='trss3_badge'>Total Have: " + this.htmlSafe(s.totalCopies) + "</span>";
        html += "<span class='trss3_badge'>Card Types: " + this.htmlSafe(items.length) + "</span>";

        for (var i = 0; i < s.levelList.length; i++) {
            var l = s.levelList[i];
            html += "<span class='trss3_badge'>Level " +
                this.htmlSafe(l.level) +
                ": " +
                this.htmlSafe(l.copies) +
                " cards / " +
                this.htmlSafe(l.types) +
                " types</span>";
        }

        html += "</div>";

        html += "<div class='trss3_table_wrap'>";
        html += "<table class='trss3_table'>";
        html += "<thead>";
        html += "<tr>";
        html += "<th>Card Name</th>";
        html += "<th>Level</th>";
        html += "<th>You Have</th>";
        html += "<th>Card Objects</th>";
        html += "<th>IDs</th>";
        html += "</tr>";
        html += "</thead>";
        html += "<tbody>";

        if (!s.cardList.length) {
            html += "<tr><td colspan='5'>No cards match your filters.</td></tr>";
        } else {
            for (var j = 0; j < s.cardList.length; j++) {
                var c = s.cardList[j];

                html += "<tr>";
                html += "<td>" + this.htmlSafe(c.name) + "</td>";
                html += "<td>" + this.htmlSafe(c.level) + "</td>";
                html += "<td><b>" + this.htmlSafe(c.copies) + "</b></td>";
                html += "<td>" + this.htmlSafe(c.types) + "</td>";
                html += "<td>" + this.htmlSafe(c.ids.join(", ")) + "</td>";
                html += "</tr>";
            }
        }

        html += "</tbody>";
        html += "</table>";
        html += "</div>";

        div.innerHTML = html;
    },

    // -----------------------------
    // Dropdowns
    // -----------------------------
    getEffectName: function (effectId) {
        var name = String(effectId);

        try {
            if (
                typeof uW !== "undefined" &&
                uW.g_js_strings &&
                uW.g_js_strings.effects &&
                uW.g_js_strings.effects["name_" + effectId]
            ) {
                name = String(uW.g_js_strings.effects["name_" + effectId]).replace("%1$s", "nn%");
                return name;
            }
        } catch (e) {}

        try {
            var d = this.deps();
            if (
                d.cmOk &&
                d.cm.thronestats.effects[effectId] &&
                d.cm.thronestats.effects[effectId].name
            ) {
                name = d.cm.thronestats.effects[effectId].name;
            }
        } catch (e2) {}

        return name;
    },

    populateSortDropdown: function () {
        var sel = this.byId("trss3_sort");
        if (!sel) return;

        var old = String(this.sortKey || 0);
        var d = this.deps();

        var html = "";
        html += "<option value='0'>-- Sort / Filter By Effect --</option>";

        if (d.cmOk) {
            var keys = [];

            for (var e in d.cm.thronestats.tiers) {
                if (this.has(d.cm.thronestats.tiers, e)) {
                    if (d.cm.thronestats.effects[e]) keys.push(e);
                }
            }

            keys.sort(function (a, b) {
                return parseInt(a, 10) - parseInt(b, 10);
            });

            for (var i = 0; i < keys.length; i++) {
                html += "<option value='" + this.htmlSafe(keys[i]) + "'>" +
                    this.htmlSafe(this.getEffectName(keys[i])) +
                    "</option>";
            }
        }

        sel.innerHTML = html;
        sel.value = old;
    },

    populateLevelDropdown: function () {
        var sel = this.byId("trss3_level");
        if (!sel) return;

        var old = String(this.levelFilter || 0);
        var items = this.getItems();
        var seen = {};
        var levels = [];

        for (var i = 0; i < items.length; i++) {
            var lv = this.getItemLevel(items[i]);

            if (lv > 0 && !seen[lv]) {
                seen[lv] = true;
                levels.push(lv);
            }
        }

        levels.sort(function (a, b) {
            return b - a;
        });

        var html = "";
        html += "<option value='0'>All Levels</option>";

        for (var j = 0; j < levels.length; j++) {
            html += "<option value='" + levels[j] + "'>Level " + levels[j] + "</option>";
        }

        sel.innerHTML = html;
        sel.value = old;
    },

    // -----------------------------
    // UI
    // -----------------------------
    setStatus: function (msg) {
        var s = this.byId("trss3_status");
        if (s) s.innerHTML = msg;
    },

    setCount: function (shown, total, copies) {
        var c = this.byId("trss3_count");
        if (c) {
            c.innerHTML =
                "Showing <b>" + shown + "</b> of <b>" + total + "</b> card types" +
                " | Have <b>" + copies + "</b> total cards";
        }
    },

    resetFilters: function () {
        this.sortKey = 0;
        this.sortDir = -1;
        this.searchText = "";
        this.levelFilter = 0;

        var sort = this.byId("trss3_sort");
        var dir = this.byId("trss3_dir");
        var search = this.byId("trss3_search");
        var level = this.byId("trss3_level");

        if (sort) sort.value = "0";
        if (dir) dir.innerHTML = "Desc";
        if (search) search.value = "";
        if (level) level.value = "0";

        this.repaint(true);
    },

    refreshHard: function () {
        this._cardCache = {};
        this._textCache = {};
        this._lastSignature = "";

        this.populateSortDropdown();
        this.populateLevelDropdown();
        this.repaint(true);
    },

    paintMessage: function (msg) {
        var cards = this.byId("trss3_cards");
        if (!cards) return;

        cards.innerHTML = "<div class='trss3_status'>" + msg + "</div>";
    },

    repaint: function (force) {
        var d = this.deps();
        var cards = this.byId("trss3_cards");

        if (!cards) return;

        if (!d.refOk) {
            this.setStatus("Waiting for Tabs.Reference.UniqueTRItems and DisplayTRCard...");
            this.setCount(0, 0, 0);
            this.paintMessage("Waiting for throne room card data...");
            return;
        }

        var allItems = this.getItems();
        var items = allItems.slice(0);

        items = this.filterBySearch(items);
        items = this.filterByLevel(items);
        items = this.sortItems(items);

        var summary = this.buildSummary(items);

        var sigParts = [];
        sigParts.push("sort:" + this.sortKey);
        sigParts.push("dir:" + this.sortDir);
        sigParts.push("search:" + this.searchText);
        sigParts.push("level:" + this.levelFilter);
        sigParts.push("total:" + allItems.length);
        sigParts.push("shown:" + items.length);
        sigParts.push("copies:" + summary.totalCopies);

        for (var i = 0; i < items.length && i < 120; i++) {
            sigParts.push(this.getCacheKey(items[i]) + ":" + this.getOwnedCount(items[i]));
        }

        var sig = sigParts.join("|");

        if (!force && sig === this._lastSignature) return;

        this._lastSignature = sig;

        this.renderSummary(items);

        var html = "";

        for (var j = 0; j < items.length; j++) {
            html += this.renderCardBox(items[j]);
        }

        if (!html) {
            html = "<div class='trss3_status'>No TR cards match your search or filters.</div>";
        }

        cards.innerHTML = html;

        this.setCount(items.length, allItems.length, summary.totalCopies);

        if (!d.cmOk) {
            this.setStatus("Cards loaded. Waiting for throne stat/effect data for sorting...");
        } else {
            this.setStatus("Ready. Search checks name, ID, level, count, stats, and visible card text.");
        }
    },

    bindEvents: function () {
        var t = this;

        var sort = t.byId("trss3_sort");
        var dir = t.byId("trss3_dir");
        var search = t.byId("trss3_search");
        var level = t.byId("trss3_level");
        var refresh = t.byId("trss3_refresh");
        var reset = t.byId("trss3_reset");

        if (sort) {
            sort.onchange = function () {
                t.sortKey = parseInt(this.value, 10) || 0;
                t.repaint(true);
            };
        }

        if (dir) {
            dir.onclick = function () {
                t.sortDir *= -1;
                this.innerHTML = t.sortDir === -1 ? "Desc" : "Asc";
                t.repaint(true);
            };
        }

        function doSearch() {
            t.searchText = t.lower(search.value || "");
            t.repaint(true);
        }

        if (search) {
            search.oninput = doSearch;
            search.onkeyup = doSearch;
            search.onchange = doSearch;
            search.onpaste = function () {
                setTimeout(doSearch, 50);
            };
        }

        if (level) {
            level.onchange = function () {
                t.levelFilter = parseInt(this.value, 10) || 0;
                t.repaint(true);
            };
        }

        if (refresh) {
            refresh.onclick = function () {
                t.refreshHard();
            };
        }

        if (reset) {
            reset.onclick = function () {
                t.resetFilters();
            };
        }
    },

    init: function (div) {
        var t = this;

        t.myDiv = div;
        t.ensureStyle();

        if (t._timer) {
            try { clearInterval(t._timer); } catch (e) {}
            t._timer = null;
        }

        t._cardCache = {};
        t._textCache = {};
        t._lastSignature = "";

        var html = "";

        html += "<div id='trss3_wrap'>";

        html += "  <div class='trss3_credit'>";
        html += "      This tab is rewritten by DarknessKoc";
        html += "  </div>";

        html += "  <div class='trss3_panel'>";
        html += "      <div class='trss3_row'>";
        html += "          <label>Sort By:</label>";
        html += "          <select id='trss3_sort'>";
        html += "              <option value='0'>-- Sort / Filter By Effect --</option>";
        html += "          </select>";

        html += "          <button id='trss3_dir' class='trss3_btn'>Desc</button>";

        html += "          <label>Search:</label>";
        html += "          <input id='trss3_search' type='text' placeholder='search name, id, level, count, stat...'>";

        html += "          <label>Card Level:</label>";
        html += "          <select id='trss3_level'>";
        html += "              <option value='0'>All Levels</option>";
        html += "          </select>";

        html += "          <button id='trss3_refresh' class='trss3_btn'>Refresh</button>";
        html += "          <button id='trss3_reset' class='trss3_btn'>Reset</button>";
        html += "      </div>";

        html += "      <div class='trss3_status'>";
        html += "          <span id='trss3_count'>Showing <b>0</b> of <b>0</b> card types | Have <b>0</b> total cards</span>";
        html += "          <span class='trss3_small'> | </span>";
        html += "          <span id='trss3_status'>Loading...</span>";
        html += "      </div>";

        html += "      <div id='trss3_summary' class='trss3_summary'>";
        html += "          <div class='trss3_summary_title'>Levels + Card Counts</div>";
        html += "          <div class='trss3_status'>Loading card counts...</div>";
        html += "      </div>";

        html += "  </div>";

        html += "  <div id='trss3_cards'></div>";

        html += "</div>";

        div.innerHTML = html;

        t.bindEvents();

        t.repaint(true);

        t.waitFor(function () {
            return t.deps().refOk;
        }, function () {
            t.populateLevelDropdown();
            t.repaint(true);
        }, 15000);

        t.waitFor(function () {
            return t.deps().cmOk;
        }, function () {
            t.populateSortDropdown();
            t.repaint(true);
        }, 15000);

        t._timer = setInterval(function () {
            try {
                t.repaint(false);
            } catch (e) {}
        }, 3000);
    }
};
