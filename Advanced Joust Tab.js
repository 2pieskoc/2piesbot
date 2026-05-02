/**************************** Advanced Joust Tab ****************************************/
// @tabversion 3.3

Tabs.Joust = {
	tabOrder: 2120,
	tabLabel: 'Joust',
	tabColor: 'gray',

	ValidJoust: false,
	isBusy: false,
	myDiv: null,

	NumJousts: 0,
	NumWins: 0,
	NumLosses: 0,
	CycleCount: 0,
	LastActionTime: 0,

	timerHandles: [],
	activePopup: null,
	activeCurtain: null,

	Options: {
		JoustRunning: false,
		JoustDelay: 9,
		JoustRandomMin: 0.4,
		JoustRandomMax: 1.2,
		JoustAutoRestart: true,
		JoustMaxPerCycle: 5,
		JoustStopOnLosses: 0,
		JoustRetryOnFail: true,

		JoustTargetMode: 'balanced',   // easy | reward | balanced
		JoustRememberTargets: true,
		JoustHistoryWeight: 25,
		JoustMaxHistory: 300,

		TargetHistory: {}
	},

	init: function (div) {
		var t = Tabs.Joust;
		t.myDiv = div;

		if (!Options.JoustOptions) {
			Options.JoustOptions = JSON.parse(JSON.stringify(t.Options));
		} else {
			for (var k in t.Options) {
				if (!Options.JoustOptions.hasOwnProperty(k)) {
					Options.JoustOptions[k] = t.Options[k];
				}
			}
			if (!Options.JoustOptions.TargetHistory) {
				Options.JoustOptions.TargetHistory = {};
			}
		}

		t.CheckEvent(t.show);
	},

	CheckEvent: function (notify) {
		var t = Tabs.Joust;

		try {
			t.ValidJoust = !!(uW.cm && uW.cm.JoustingModel && uW.cm.JoustingModel.getTimeLeft() > 0);
		} catch (e) {
			t.ValidJoust = false;
		}

		var elem = ById("bttcJoust");
		if (elem) {
			elem.style.color = t.ValidJoust ? "#ffffff" : "#999999";
		}

		if (Options.JoustOptions.JoustRunning && !t.isBusy && t.ValidJoust) {
			t.start();
		}

		if (notify) notify();
	},

	getBaseDelayMs: function () {
		var d = parseFloat(Options.JoustOptions.JoustDelay);
		if (isNaN(d) || d < 1) d = 1;
		return Math.floor(d * 1000);
	},

	getRandomDelayMs: function () {
		var min = parseFloat(Options.JoustOptions.JoustRandomMin);
		var max = parseFloat(Options.JoustOptions.JoustRandomMax);

		if (isNaN(min)) min = 0.4;
		if (isNaN(max)) max = 1.2;
		if (max < min) {
			var tmp = min;
			min = max;
			max = tmp;
		}

		return Math.floor((min + Math.random() * (max - min)) * 1000);
	},

	schedule: function (fn, delay) {
		var t = Tabs.Joust;
		var args = Array.prototype.slice.call(arguments, 2);

		var h = setTimeout(function () {
			t.removeTimerHandle(h);
			if (!t.isBusy) return;
			fn.apply(t, args);
		}, delay);

		t.timerHandles.push(h);
		return h;
	},

	removeTimerHandle: function (handle) {
		var t = Tabs.Joust;
		for (var i = t.timerHandles.length - 1; i >= 0; i--) {
			if (t.timerHandles[i] === handle) {
				t.timerHandles.splice(i, 1);
				return;
			}
		}
	},

	clearTimers: function () {
		var t = Tabs.Joust;
		for (var i = 0; i < t.timerHandles.length; i++) {
			clearTimeout(t.timerHandles[i]);
		}
		t.timerHandles = [];
	},

	log: function (msg, color) {
		var div = $("pbjoust_info");
		if (!div) return;

		var c = color || "#ffffff";
		var stamp = new Date();
		var hh = ("0" + stamp.getHours()).slice(-2);
		var mm = ("0" + stamp.getMinutes()).slice(-2);
		var ss = ("0" + stamp.getSeconds()).slice(-2);

		div.innerHTML = '<span style="color:' + c + ';">[' + hh + ':' + mm + ':' + ss + '] ' + msg + '</span><br>' + div.innerHTML;
	},

	updateHeader: function () {
		var t = Tabs.Joust;
		var head = ById("joustHeader");
		if (!head) return;

		var rate = t.NumJousts > 0 ? ((t.NumWins / t.NumJousts) * 100).toFixed(1) : "0.0";
		head.innerHTML = tx('Jousting Results') +
			'... (' + t.NumWins + '/' + t.NumJousts +
			', ' + rate + '% WR, L:' + t.NumLosses +
			', C:' + t.CycleCount + ')';
	},

	getByPath: function (obj, path) {
		if (!obj || !path) return undefined;
		var parts = path.split('.');
		var cur = obj;

		for (var i = 0; i < parts.length; i++) {
			if (cur == null || typeof cur !== 'object' || !(parts[i] in cur)) return undefined;
			cur = cur[parts[i]];
		}
		return cur;
	},

	readNum: function (obj, paths, def) {
		var t = Tabs.Joust;
		for (var i = 0; i < paths.length; i++) {
			var v = t.getByPath(obj, paths[i]);
			if (v !== undefined && v !== null && v !== '' && !isNaN(parseFloat(v))) {
				return parseFloat(v);
			}
		}
		return def;
	},

	readBool: function (obj, paths, def) {
		var t = Tabs.Joust;
		for (var i = 0; i < paths.length; i++) {
			var v = t.getByPath(obj, paths[i]);
			if (v !== undefined && v !== null) return !!v;
		}
		return def;
	},

	readStr: function (obj, paths, def) {
		var t = Tabs.Joust;
		for (var i = 0; i < paths.length; i++) {
			var v = t.getByPath(obj, paths[i]);
			if (v !== undefined && v !== null && v !== '') return String(v);
		}
		return def;
	},

	clamp: function (v, min, max) {
		if (v < min) return min;
		if (v > max) return max;
		return v;
	},

	getTargetHistory: function () {
		if (!Options.JoustOptions.TargetHistory) {
			Options.JoustOptions.TargetHistory = {};
		}
		return Options.JoustOptions.TargetHistory;
	},

	formatHistoryTime: function (ts) {
		if (!ts) return '-';
		try {
			var d = new Date(ts);
			var yy = d.getFullYear();
			var mo = ("0" + (d.getMonth() + 1)).slice(-2);
			var da = ("0" + d.getDate()).slice(-2);
			var hh = ("0" + d.getHours()).slice(-2);
			var mm = ("0" + d.getMinutes()).slice(-2);
			var ss = ("0" + d.getSeconds()).slice(-2);
			return yy + '-' + mo + '-' + da + ' ' + hh + ':' + mm + ':' + ss;
		} catch (e) {
			return '-';
		}
	},

	getHistoryRows: function () {
		var t = Tabs.Joust;
		var hist = t.getTargetHistory();
		var rows = [];

		for (var k in hist) {
			if (!hist.hasOwnProperty(k)) continue;

			var h = hist[k];
			var wins = parseInt(h.wins || 0, 10);
			var losses = parseInt(h.losses || 0, 10);
			var total = wins + losses;
			var rate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";

			rows.push({
				id: h.id || k,
				name: h.name || ('Target ' + k),
				wins: wins,
				losses: losses,
				total: total,
				winRate: rate,
				lastResult: h.lastResult || '-',
				lastTime: h.lastTime || 0
			});
		}

		rows.sort(function (a, b) {
			if ((b.lastTime || 0) !== (a.lastTime || 0)) return (b.lastTime || 0) - (a.lastTime || 0);
			if ((b.total || 0) !== (a.total || 0)) return (b.total || 0) - (a.total || 0);
			return String(a.name).localeCompare(String(b.name));
		});

		return rows;
	},

	renderTargetHistory: function () {
		var t = Tabs.Joust;
		var box = ById('pbJoustHistory');
		if (!box) return;

		var rows = t.getHistoryRows();
		if (!rows.length) {
			box.innerHTML = '<div style="padding:8px;color:#ccc;text-align:center;">No target history yet.</div>';
			return;
		}

		var html = '';
		html += '<table class="xtab" width="100%" cellspacing="0" cellpadding="3" style="font-size:11px;">';
		html += '<tr>';
		html += '<th align="left">Target</th>';
		html += '<th align="center">W</th>';
		html += '<th align="center">L</th>';
		html += '<th align="center">WR%</th>';
		html += '<th align="center">Last</th>';
		html += '<th align="left">Last Seen</th>';
		html += '</tr>';

		for (var i = 0; i < rows.length; i++) {
			var r = rows[i];
			var rowColor = '#ffffff';

			if (r.total > 0) {
				if (parseFloat(r.winRate) >= 70) rowColor = '#66ff66';
				else if (parseFloat(r.winRate) < 40) rowColor = '#ff8888';
				else rowColor = '#ffd966';
			}

			html += '<tr style="color:' + rowColor + ';">';
			html += '<td>' + String(r.name) + ' <span style="color:#999;">(#' + r.id + ')</span></td>';
			html += '<td align="center">' + r.wins + '</td>';
			html += '<td align="center">' + r.losses + '</td>';
			html += '<td align="center">' + r.winRate + '</td>';
			html += '<td align="center">' + r.lastResult + '</td>';
			html += '<td>' + t.formatHistoryTime(r.lastTime) + '</td>';
			html += '</tr>';
		}

		html += '</table>';
		box.innerHTML = html;
	},

	clearTargetHistory: function () {
		Options.JoustOptions.TargetHistory = {};
		var t = Tabs.Joust;
		t.renderTargetHistory();
	},

	rememberTargetResult: function (opponentId, opponentName, won) {
		var t = Tabs.Joust;
		if (!Options.JoustOptions.JoustRememberTargets) return;

		var hist = t.getTargetHistory();
		var key = String(opponentId);

		if (!hist[key]) {
			hist[key] = {
				id: opponentId,
				name: opponentName || ('Target ' + opponentId),
				wins: 0,
				losses: 0,
				lastResult: '',
				lastTime: 0
			};
		}

		if (won) hist[key].wins++;
		else hist[key].losses++;

		hist[key].name = opponentName || hist[key].name;
		hist[key].lastResult = won ? 'win' : 'loss';
		hist[key].lastTime = new Date().getTime();

		var keys = [];
		for (var k in hist) keys.push(k);

		var maxHist = parseInt(Options.JoustOptions.JoustMaxHistory, 10);
		if (isNaN(maxHist) || maxHist < 50) maxHist = 300;

		if (keys.length > maxHist) {
			keys.sort(function (a, b) {
				return (hist[a].lastTime || 0) - (hist[b].lastTime || 0);
			});
			while (keys.length > maxHist) {
				delete hist[keys.shift()];
			}
		}

		t.renderTargetHistory();
	},

	scoreOpponent: function (op) {
		var t = Tabs.Joust;
		var hist = t.getTargetHistory()[String(op.id)] || { wins: 0, losses: 0 };

		var chance = t.readNum(op, [
			'winChance',
			'predictedWinChance',
			'chance',
			'odds',
			'prediction.winChance',
			'stats.winChance',
			'battle.winChance',
			'win_pct',
			'winPercent'
		], NaN);

		if (!isNaN(chance) && chance <= 1) chance = chance * 100;
		if (isNaN(chance)) chance = 50;

		var reward = 0;
		reward += t.readNum(op, ['reward', 'rewardValue', 'prize', 'prizeValue', 'points', 'honor', 'xp'], 0);
		reward += t.readNum(op, ['reward.quantity', 'prize.quantity', 'loot.quantity'], 0) * 2;

		var power = t.readNum(op, [
			'might',
			'power',
			'strength',
			'combatPower',
			'battlePower',
			'armyPower',
			'score',
			'stats.power'
		], 0);

		var lvl = t.readNum(op, ['level', 'lvl', 'rank', 'stats.level'], 0);

		var easyFlag = t.readBool(op, ['easy', 'weak', 'preferred', 'canBeat'], false);
		var hardFlag = t.readBool(op, ['hard', 'strong', 'elite', 'dangerous'], false);

		var historyBonus = (hist.wins * 12) - (hist.losses * 35);
		var mode = String(Options.JoustOptions.JoustTargetMode || 'balanced').toLowerCase();
		var score = 0;

		if (mode === 'easy') {
			score += chance * 5.0;
			score += reward * 0.25;
			score -= power * 0.0018;
			score -= lvl * 2.0;
			score += historyBonus;
		} else if (mode === 'reward') {
			score += chance * 2.5;
			score += reward * 1.8;
			score -= power * 0.0010;
			score -= lvl * 0.8;
			score += historyBonus * 0.8;
		} else {
			score += chance * 4.0;
			score += reward * 0.7;
			score -= power * 0.0014;
			score -= lvl * 1.2;
			score += historyBonus;
		}

		if (easyFlag) score += 20;
		if (hardFlag) score -= 25;

		score += t.clamp(hist.wins - hist.losses, -10, 10) * parseFloat(Options.JoustOptions.JoustHistoryWeight || 25) * 0.1;

		op._pbScore = score;
		op._pbName = t.readStr(op, ['name', 'nam', 'player', 'playerName', 'opponentName'], 'ID ' + op.id);
		op._pbChance = chance;
		op._pbReward = reward;
		op._pbPower = power;
		op._pbLevel = lvl;

		return score;
	},

	pickBestOpponents: function (opponents) {
		var t = Tabs.Joust;
		var picked = opponents.slice(0);

		for (var i = 0; i < picked.length; i++) {
			t.scoreOpponent(picked[i]);
		}

		picked.sort(function (a, b) {
			return (b._pbScore || 0) - (a._pbScore || 0);
		});

		var maxPerCycle = parseInt(Options.JoustOptions.JoustMaxPerCycle, 10);
		if (!isNaN(maxPerCycle) && maxPerCycle > 0 && picked.length > maxPerCycle) {
			picked = picked.slice(0, maxPerCycle);
		}

		return picked;
	},

	show: function () {
		var t = Tabs.Joust;

		if (!t.isBusy) {
			var mode = String(Options.JoustOptions.JoustTargetMode || 'balanced').toLowerCase();
			var m = '';

			m += '<DIV class=divHeader align=center>JOUST</DIV>';
			m += '<div align=center style="padding:4px 0 8px 0;color:#ffd700;font-weight:bold;">This tab is rewritten by DarknessKoc</div>';
			m += '<div style="min-height:590px;padding:8px;">';

			if (t.ValidJoust) {
				m += '<div align=center style="margin-top:8px;">';
				m += tx("Joust interval") + ': <INPUT id=btjoustinterval type=text size=4 value="' + Options.JoustOptions.JoustDelay + '" /> ' + tx("seconds");
				m += '</div>';

				m += '<div align=center style="margin-top:8px;">';
				m += 'Random min: <INPUT id=btjoustRandMin type=text size=4 value="' + Options.JoustOptions.JoustRandomMin + '" /> sec ';
				m += 'Random max: <INPUT id=btjoustRandMax type=text size=4 value="' + Options.JoustOptions.JoustRandomMax + '" /> sec';
				m += '</div>';

				m += '<div align=center style="margin-top:8px;">';
				m += 'Max / cycle: <INPUT id=btjoustMaxPerCycle type=text size=4 value="' + Options.JoustOptions.JoustMaxPerCycle + '" /> ';
				m += 'Stop after losses: <INPUT id=btjoustStopLosses type=text size=4 value="' + Options.JoustOptions.JoustStopOnLosses + '" />';
				m += '</div>';

				m += '<div align=center style="margin-top:10px;">';
				m += 'Target mode: ';
				m += '<select id="btjoustTargetMode">';
				m += '<option value="easy"' + (mode === 'easy' ? ' selected' : '') + '>Easy</option>';
				m += '<option value="balanced"' + (mode === 'balanced' ? ' selected' : '') + '>Balanced</option>';
				m += '<option value="reward"' + (mode === 'reward' ? ' selected' : '') + '>Reward</option>';
				m += '</select>';
				m += '</div>';

				m += '<div align=center style="margin-top:10px;">';
				m += '<label><input type="checkbox" id="btjoustAutoRestart" ' + (Options.JoustOptions.JoustAutoRestart ? 'checked' : '') + ' /> Auto restart</label>';
				m += '&nbsp;&nbsp;';
				m += '<label><input type="checkbox" id="btjoustRetryOnFail" ' + (Options.JoustOptions.JoustRetryOnFail ? 'checked' : '') + ' /> Retry on fail</label>';
				m += '</div>';

				m += '<div align=center style="margin-top:8px;">';
				m += '<label><input type="checkbox" id="btjoustRememberTargets" ' + (Options.JoustOptions.JoustRememberTargets ? 'checked' : '') + ' /> Learn target history</label>';
				m += '</div>';

				m += '<br><center><input type=button value="' + uW.g_js_strings.modal_mmb.playnow + '" id=btJoustStart></center>';
			} else {
				m += '<br><div align=center>' + tx('No active event') + '</div>';
			}

			m += '<div style="margin-top:18px;">';
			m += '<div class=divHeader align=center style="margin-bottom:6px;">Target History Viewer</div>';
			m += '<div align=center style="margin-bottom:6px;">';
			m += '<input type="button" id="btJoustHistoryRefresh" value="Refresh History" /> ';
			m += '<input type="button" id="btJoustHistoryClear" value="Clear History" />';
			m += '</div>';
			m += '<div id="pbJoustHistory" style="height:220px;max-height:220px;overflow-y:auto;border:1px solid #444;background:#111;padding:4px;"></div>';
			m += '</div>';

			m += '</div>';
			m += '<div align=center><div style="position:absolute;margin:5px;bottom:0px;width:' + GlobalOptions.btWinSize.x + 'px;"><br><hr></div></div>';

			t.myDiv.innerHTML = m;
			ResetFrameSize('btMain', 100, GlobalOptions.btWinSize.x);

			if (t.ValidJoust) {
				ById('btJoustStart').addEventListener('click', function () {
					t.start();
				}, false);

				ChangeOption('JoustOptions', 'btjoustinterval', 'JoustDelay');
				ChangeOption('JoustOptions', 'btjoustRandMin', 'JoustRandomMin');
				ChangeOption('JoustOptions', 'btjoustRandMax', 'JoustRandomMax');
				ChangeOption('JoustOptions', 'btjoustMaxPerCycle', 'JoustMaxPerCycle');
				ChangeOption('JoustOptions', 'btjoustStopLosses', 'JoustStopOnLosses');

				ById('btjoustAutoRestart').addEventListener('change', function () {
					Options.JoustOptions.JoustAutoRestart = !!this.checked;
				}, false);

				ById('btjoustRetryOnFail').addEventListener('change', function () {
					Options.JoustOptions.JoustRetryOnFail = !!this.checked;
				}, false);

				ById('btjoustRememberTargets').addEventListener('change', function () {
					Options.JoustOptions.JoustRememberTargets = !!this.checked;
				}, false);

				ById('btjoustTargetMode').addEventListener('change', function () {
					Options.JoustOptions.JoustTargetMode = this.value;
				}, false);
			}

			ById('btJoustHistoryRefresh').addEventListener('click', function () {
				t.renderTargetHistory();
			}, false);

			ById('btJoustHistoryClear').addEventListener('click', function () {
				t.clearTargetHistory();
			}, false);

			t.renderTargetHistory();
		} else {
			t.setCurtain(true);
		}
	},

	setPopup: function (onoff) {
		var t = Tabs.Joust;

		if (onoff) {
			if (t.activePopup && t.activePopup.parentNode) {
				t.activePopup.parentNode.removeChild(t.activePopup);
			}

			var div = document.createElement('div');
			div.id = 'ptJoustPop';
			div.style.backgroundColor = '#808080';
			div.style.zIndex = mainPop.div.zIndex + 2;
			div.style.opacity = '1';
			div.style.border = '3px outset black';
			div.style.width = (GlobalOptions.btWinSize.x - 200) + 'px';
			div.style.height = '320px';
			div.style.display = 'block';
			div.style.position = 'absolute';
			div.style.top = '80px';
			div.style.left = '80px';

			t.myDiv.appendChild(div);
			t.activePopup = div;
			return div;
		}

		var old = ById('ptJoustPop');
		if (old && old.parentNode) old.parentNode.removeChild(old);
		t.activePopup = null;
		return null;
	},

	setCurtain: function (onoff) {
		var t = Tabs.Joust;

		if (onoff) {
			var off = getAbsoluteOffsets(t.myDiv);
			var curtain = ById('ptJoustCurtain');

			if (!curtain) {
				curtain = document.createElement('div');
				curtain.id = 'ptJoustCurtain';
				curtain.style.zIndex = mainPop.div.zIndex + 1;
				curtain.style.backgroundColor = "#000000";
				curtain.style.opacity = '0.5';
				curtain.style.display = 'block';
				curtain.style.position = 'absolute';
				t.myDiv.appendChild(curtain);
			}

			curtain.style.width = (t.myDiv.clientWidth + 4) + 'px';
			curtain.style.height = (t.myDiv.clientHeight + 4) + 'px';
			curtain.style.top = off.top + 'px';
			curtain.style.left = off.left + 'px';

			t.activeCurtain = curtain;
			return;
		}

		var old = ById('ptJoustCurtain');
		if (old && old.parentNode) old.parentNode.removeChild(old);
		t.activeCurtain = null;
	},

	e_Cancel: function () {
		var t = Tabs.Joust;

		if (t.isBusy) {
			t.isBusy = false;
			Options.JoustOptions.JoustRunning = false;
			t.clearTimers();
			t.log(tx('Cancelled') + '!', '#ffcc00');

			var btn = ById('pbJoustCancel');
			if (btn && btn.firstChild) {
				btn.firstChild.innerHTML = uW.g_js_strings.commonstr.close;
			}
			return;
		}

		t.clearTimers();
		t.setCurtain(false);
		t.setPopup(false);
		t.show();
	},

	start: function () {
		var t = Tabs.Joust;
		if (t.isBusy) return;

		t.CheckEvent();
		if (!t.ValidJoust) {
			t.show();
			return;
		}

		t.clearTimers();

		t.isBusy = true;
		t.NumJousts = 0;
		t.NumWins = 0;
		t.NumLosses = 0;
		t.CycleCount = 0;
		t.LastActionTime = 0;

		Options.JoustOptions.JoustRunning = true;

		t.setCurtain(true);
		var popDiv = t.setPopup(true);

		popDiv.innerHTML =
			'<TABLE class=xtab width=100% height=100%>' +
				'<TR>' +
					'<TD align=center>' +
						'<DIV class=divHeader align=center id=joustHeader>' + tx('Jousting Results') + '...</DIV>' +
						'<DIV align=center style="padding:4px 0 6px 0;color:#ffd700;font-weight:bold;">This tab is rewritten by DarknessKoc</DIV>' +
						'<DIV id=pbjoust_info style="padding:10px; height:245px; max-height:245px; overflow-y:auto"></DIV>' +
					'</TD>' +
				'</TR>' +
				'<TR>' +
					'<TD align=center>' + strButton20(uW.g_js_strings.commonstr.cancel, 'id=pbJoustCancel') + '</TD>' +
				'</TR>' +
			'</TABLE>';

		ById('pbJoustCancel').addEventListener('click', t.e_Cancel, false);

		t.log('Joust started.', '#00ff99');
		t.updateHeader();
		t.nextfight();
	},

	finishRun: function () {
		var t = Tabs.Joust;
		t.isBusy = false;
		Options.JoustOptions.JoustRunning = false;
		t.clearTimers();

		var btn = ById('pbJoustCancel');
		if (btn && btn.firstChild) {
			btn.firstChild.innerHTML = uW.g_js_strings.commonstr.close;
		}
	},

	nextfight: function () {
		var t = Tabs.Joust;
		if (!t.isBusy) return;

		t.CheckEvent();
		if (!t.ValidJoust) {
			t.log(tx('No active event') + '.', '#ff6666');
			t.finishRun();
			return;
		}

		t.eventDoJoust();
	},

	eventDoJoust: function () {
		var t = Tabs.Joust;
		if (!t.isBusy) return;

		var params = uW.Object.clone(uW.g_ajaxparams);
		params.ctrl = 'jousting\\JoustingController';
		params.action = 'opponents';

		t.log('Fetching opponents...', '#aaddff');

		new MyAjaxRequest(uW.g_ajaxpath + "ajax/_dispatch53.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,

			onSuccess: function (rslt) {
				if (!t.isBusy) return;

				if (!rslt || !rslt.ok) {
					t.log(tx('Server Error') + (rslt && rslt.msg ? (' ' + rslt.msg) : ''), '#ff6666');

					if (Options.JoustOptions.JoustRetryOnFail) {
						t.log('Retrying in 5 seconds...', '#ffcc00');
						t.schedule(t.nextfight, 5000);
					} else {
						t.finishRun();
					}
					return;
				}

				if (!rslt.opponents || !rslt.opponents.length) {
					t.log('No opponents returned.', '#ffcc00');

					if (Options.JoustOptions.JoustAutoRestart) {
						t.schedule(t.nextfight, 4000);
					} else {
						t.finishRun();
					}
					return;
				}

				var opponents = t.pickBestOpponents(rslt.opponents);

				t.CycleCount++;
				t.log('Cycle #' + t.CycleCount + ' | Picked ' + opponents.length + ' best targets', '#ffffff');

				for (var z = 0; z < opponents.length; z++) {
					t.log(
						'#' + (z + 1) + ' ' + (opponents[z]._pbName || ('ID ' + opponents[z].id)) +
						' | Score=' + ((opponents[z]._pbScore || 0).toFixed ? opponents[z]._pbScore.toFixed(2) : opponents[z]._pbScore) +
						' | Chance=' + (opponents[z]._pbChance || 0) +
						' | Reward=' + (opponents[z]._pbReward || 0) +
						' | Power=' + (opponents[z]._pbPower || 0),
						'#aaddff'
					);
				}

				t.updateHeader();

				var totalDelay = 0;
				for (var i = 0; i < opponents.length; i++) {
					var stepDelay = (i === 0 ? 500 : t.getBaseDelayMs() + t.getRandomDelayMs());
					totalDelay += stepDelay;
					t.schedule(t.eventDoFight, totalDelay, opponents[i].id, opponents[i].serverid);
				}

				var nextLoopDelay = totalDelay + t.getBaseDelayMs() + t.getRandomDelayMs();

				if (Options.JoustOptions.JoustAutoRestart) {
					t.schedule(t.nextfight, nextLoopDelay);
				} else {
					t.schedule(function () {
						t.log('Cycle complete.', '#00ff99');
						t.finishRun();
					}, nextLoopDelay);
				}
			},

			onFailure: function () {
				if (!t.isBusy) return;

				t.log(tx('Server Error') + '!', '#ff6666');

				if (Options.JoustOptions.JoustRetryOnFail) {
					t.log('Retrying in 5 seconds...', '#ffcc00');
					t.schedule(t.nextfight, 5000);
				} else {
					t.finishRun();
				}
			}
		}, true);
	},

	eventDoFight: function (opponent, opponentServerId) {
		var t = Tabs.Joust;
		if (!t.isBusy) return;

		var params = uW.Object.clone(uW.g_ajaxparams);
		params.ctrl = 'jousting\\JoustingController';
		params.action = 'fight';
		params.opponent = opponent;
		params.opponentServerId = opponentServerId;

		t.LastActionTime = new Date().getTime();

		new MyAjaxRequest(uW.g_ajaxpath + "ajax/_dispatch53.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,

			onSuccess: function (rslt2) {
				if (!t.isBusy) return;

				if (!rslt2 || !rslt2.ok) {
					t.log(tx('Server Error') + (rslt2 && rslt2.msg ? (' ' + rslt2.msg) : ''), '#ff6666');
					t.updateHeader();
					return;
				}

				t.NumJousts++;

				var rewardText = '';
				if (rslt2.reward && rslt2.reward.itemId) {
					try {
						if (uW.ksoItems && uW.ksoItems[rslt2.reward.itemId]) {
							uW.ksoItems[rslt2.reward.itemId].add(rslt2.reward.quantity);
						}
						if (typeof Seed !== "undefined" && Seed.items) {
							var key = "i" + rslt2.reward.itemId;
							if (!Seed.items[key]) Seed.items[key] = 0;
							Seed.items[key] = parseInt(Seed.items[key], 10) + rslt2.reward.quantity;
						}
					} catch (e) {}

					if (uW.itemlist && uW.itemlist['i' + rslt2.reward.itemId]) {
						rewardText = ' - ' + tx('Awarded') + ' ' + rslt2.reward.quantity + ' ' + uW.itemlist['i' + rslt2.reward.itemId].name;
					} else {
						rewardText = ' - ' + tx('Awarded') + ' ' + rslt2.reward.quantity + ' item #' + rslt2.reward.itemId;
					}
				}

				var oppName = 'Unknown';
				try {
					oppName = rslt2.report && rslt2.report.s0 && rslt2.report.s0.nam ? rslt2.report.s0.nam : 'Unknown';
				} catch (e) {
					oppName = 'Unknown';
				}

				var won = false;
				try {
					won = !!(rslt2.report && rslt2.report.s1 && rslt2.report.s1.won);
				} catch (e) {
					won = false;
				}

				t.rememberTargetResult(opponent, oppName, won);

				if (won) {
					t.NumWins++;
					t.log(tx('Won against') + ' ' + oppName + rewardText, '#66ff66');
				} else {
					t.NumLosses++;
					t.log(tx('Lost against') + ' ' + oppName + rewardText, '#ff6666');

					var stopLosses = parseInt(Options.JoustOptions.JoustStopOnLosses, 10);
					if (!isNaN(stopLosses) && stopLosses > 0 && t.NumLosses >= stopLosses) {
						t.log('Loss limit reached. Stopping.', '#ffcc00');
						t.finishRun();
						t.updateHeader();
						return;
					}
				}

				t.updateHeader();
			},

			onFailure: function () {
				if (!t.isBusy) return;
				t.log(tx('Server Error') + '!', '#ff6666');
				t.updateHeader();
			}
		}, true);
	}
};