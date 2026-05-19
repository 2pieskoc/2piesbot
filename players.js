// @tabversion 20260519
// 2pies Prime by Darkness - Player Tab Addon
// Use as an Additional Tab in 2pies Prime by Darkness 5.0.2+.
// Restores the old Players tab as a separate addon so the main GreasyFork script stays under size limit.

/** Player Tab **/

Tabs.Player = {
	tabOrder : 1010,
	tabLabel : 'Players',
	myDiv : null,
	MemberListRslt : {},
	userobj : {},
	dat : [],
	friendEta : false,
	hidePlayerInfo : false,
	ModelCity : null,
	unitId : 0,
	ModelCityId : 0,
	curPage :0,
	maxPage :-1,
	friendbtn : '',
	neutralbtn : '',
	hostilebtn : '',
	aName : '',
	ReqSent : {},
	Options : {
		sortColNum: 8,
		sortDir: 1,
	},
	champpos : {x: -999, y: -999},

// t.dat
// 0 - p.displayName
// 1 - p.might
// 2 - p.officerType
// 3 - p.numCities
// 4 - p.cities[c].tileLevel
// 5 - p.cities[c].xCoord
// 6 - p.cities[c].yCoord
// 7 - p.cities[c].cityName
// 8 - distance
// 9 - Online
// 10 - ETA
// 11 - p.cities[c].cityId
// 12 - prestige
// 13 - p.userId
// 14 - prestigelvl
// 15 - prestigeexp
// 16 - p.cities[c].prestigeBuffExpire (for sorting)
// 17 - prestige + prestigelvl (for sorting)
// 18 - p.cities[c].blessing
// 19 - Defending

	init : function (div){
		var t = Tabs.Player;
		t.myDiv = div;

		if (!Options.PlayerOptions) {
			Options.PlayerOptions = t.Options;
		}
		else {
			for (var y in t.Options) {
				if (!Options.PlayerOptions.hasOwnProperty(y)) {
					Options.PlayerOptions[y] = t.Options[y];
				}
			}
		}

		uWExportFunction('ptPlayClick', Tabs.Player.clickedPlayerDetails);
		uWExportFunction('ptSetDiplomacy', Tabs.Player.setDiplomacy);
		uWExportFunction('ptInvite', Tabs.Player.clickedSendInvite);
		uWExportFunction('ptViewChamps', Tabs.Player.ViewChamps);
		uWExportFunction('ptGetMembers', Tabs.Player.eventGetMembers);
		uWExportFunction('ptPaintMembers', Tabs.Player.GetDataForMap);
		uWExportFunction('ptAllClickPrev', Tabs.Player.eventListPrev);
		uWExportFunction('ptAllClickNext', Tabs.Player.eventListNext);
		uWExportFunction('ptPlayerDetails', Tabs.Player.eventPlayerExternalTabClick);
		uWExportFunction('ptAllianceDetails', Tabs.Player.eventAllianceExternalTabClick);
		uWExportFunction('ptplayClickSort', Tabs.Player.playClickSort);

		m = '<div class="divHeader" align="center">'+tx('PLAYER AND ALLIANCE SEARCH')+'</div>';
		m += '<br><table class=xtab>';
		m += '<tr><td width=10>&nbsp;</td><td>'+uW.g_js_strings.modal_fow_leaderboard.searchuser+':&nbsp;</td><td><INPUT id=allplayname size=20 type=text />&nbsp;</td><td><a id=allplaysubmit class="inlineButton btButton blue20"><span>'+uW.g_js_strings.modal_fow_leaderboard.searchuser+'</span></a>&nbsp;<a id=alluidsubmit class="inlineButton btButton blue20"><span>UID</span></a></td>';
		m += '<td class="ErrText" id=allplayerr>&nbsp;</td></tr>';
		m += '<tr><td width=10>&nbsp;</td><td>'+uW.g_js_strings.setDiplomacyWindow.srchalli+':&nbsp;</td><td><INPUT id=allalliname type=text />&nbsp;</td><td><a id=allallisubmit class="inlineButton btButton blue20"><span>'+uW.g_js_strings.modal_fow_leaderboard.findalli+'</span></a></td>';
		m += '<td class="ErrText" id=allallierr>&nbsp;</td></tr>';
		m += '<TR><td width=10>&nbsp;</td><TD><INPUT align=left id=alllistsubmit type=button value="'+tx('List Alliances')+'"/></td>';
		if (Seed.allianceDiplomacies) {
			m += '<TD><INPUT align=right id=allmyallisubmit type=submit value="'+getMyAlliance()[1]+'"/></td>';
			m += '<TD><INPUT id=pbshowfriendlies type=checkbox>'+tx('Show Friendly Alliances')+'&nbsp;&nbsp;&nbsp;&nbsp;<INPUT id=pbshowhostiles type=checkbox>'+tx('Show Hostile Alliances')+'</td>';
		}
		m += '</tr></table>';
		m += '<div id=pbfriendlydiv style="display:none;padding:5px;">&nbsp;</div>';
		m += '<div id=pbhostilediv style="display:none;padding:5px;">&nbsp;</div>';
		m += '<div id=allPlayerInfo style="display:none;">&nbsp;</div><HR>';
		m += '<div id=allCitySelect style="display:none;padding:5px;">';
		m += '<table class=xtab width=100%>';
		m += '<TR><TD>'+tx('Show distance from')+':&nbsp;X:&nbsp;<INPUT size=2 type=text id=plyrX />&nbsp;Y:&nbsp;<INPUT size=2 type=text id=plyrY />&nbsp;'+tx('or choose city')+':&nbsp;<span id=dmcoords></span></td><td align=right>&nbsp;</td></tr>';
		m += '<tr><td>';
		if (Tabs.BulkScout) m += strButton20(tx('Add to Scout List'), 'id=ptScoutExport')+'&nbsp;';
		if (Tabs.BulkAttack) m += strButton20(tx('Add to Attack List'), 'id=ptBulkAttackExport')+'&nbsp;';
		m += strButton20(tx('Highlight Defending Cities'),'id=ptHighDefenders')+'</td><td align=right>&nbsp;'+tx('ETA')+':&nbsp;</b></span><select id="idFindETASelect"><option value="0">-- '+uW.g_js_strings.commonstr.select+' --</option>';
		for (var ui in CM.UNIT_TYPES){
			i = CM.UNIT_TYPES[ui];
			m += '<option value="'+i+'">'+uW.unitcost["unt"+i][0]+'</option>';
		}
		m += '</td></tr></table>'
		m += '</div>';
		m += '<div id=allListOut style="min-height:200px;">&nbsp;</div><br>';

		div.innerHTML = m;
		ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);

		t.ModelCity = new CdispCityPicker('plyrdcp', ById('dmcoords'), true, t.eventCoords, null);
		t.ModelCity.bindToXYboxes(ById('plyrX'), ById('plyrY'));

		if (ById('ptScoutExport')) ById('ptScoutExport').addEventListener('click', t.ExportScoutList, false);
		if (ById('ptBulkAttackExport')) ById('ptBulkAttackExport').addEventListener('click', t.ExportAttackList, false);
		ById('ptHighDefenders').addEventListener('click', t.HighlightDefenders, false);
		ById('idFindETASelect').addEventListener('click', t.handleEtaSelect, false);

		ById('allplayname').addEventListener('keypress', function (e) {
			if (e.which == 13) ById('allplaysubmit').click();
		}, false);
		ById('allalliname').addEventListener('keypress', function (e) {
			if (e.which == 13) ById('allallisubmit').click();
		}, false);

		if (Seed.allianceDiplomacies) {
			ById('allmyallisubmit').addEventListener('click', t.showMyAlliance, false);
			ById('pbshowfriendlies').addEventListener('change', function () {
				if (this.checked) {
					t.paintFriendlyDiv();
				} else {
					ById('pbfriendlydiv').style.display = 'none';
					ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);
				}
			});
			ById('pbshowhostiles').addEventListener('change', function () {
				if (this.checked) {
					t.paintHostilesDiv();
				} else {
					ById('pbhostilediv').style.display = 'none';
					ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);
				}
			});
		}
		ById('allallisubmit').addEventListener('click', t.eventSubmit, false);
		ById('allplaysubmit').addEventListener('click', t.eventPlayerSubmit, false);
		ById('alluidsubmit').addEventListener('click', t.eventPlayerUIDSubmit, false);
		ById('allalliname').addEventListener('focus', function () {
			ById('allallierr').innerHTML = '';
		}, false);
		ById('allplayname').addEventListener('focus', function () {
			ById('allplayerr').innerHTML = '';
		}, false);
		ById('alllistsubmit').addEventListener('click', t.eventListSubmit, false);
	},

	playClickSort : function (e) {
		var t = Tabs.Player;
		var newColNum = e.id.substr(8);
		ById('clickCol' + Options.PlayerOptions.sortColNum).className = 'buttonv2 std blue';
		e.className = 'buttonv2 std green';
		if (newColNum == Options.PlayerOptions.sortColNum) { Options.PlayerOptions.sortDir *= -1; }
		else { Options.PlayerOptions.sortColNum = newColNum; }
		saveOptions();
		t.RepaintList();
	},

	paintFriendlyDiv : function () {
		var t = Tabs.Player;
		var mess = '<div class=divHeader align=center>'+tx('FRIENDLY ALLIANCES')+'</div>';
		for (var k in Seed.allianceDiplomacies.friendly) {
			mess += '<INPUT id=pbFriendly_' + k + ' type=submit value="' + Seed.allianceDiplomacies.friendly[k].allianceName + '"> ';
		}
		ById('pbfriendlydiv').innerHTML = mess;
		ById('pbfriendlydiv').style.display = 'block';
		ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);
		for (var q in Seed.allianceDiplomacies.friendly) {
			ById('pbFriendly_' + q).addEventListener('click', function () {
				t.eventGetMembers(this.id.substr(12))
			});
		}
	},

	paintHostilesDiv : function () {
		var t = Tabs.Player;
		var mess = '<div class=divHeader align=center>'+tx('HOSTILE ALLIANCES')+'</div>';
		for (var k in Seed.allianceDiplomacies.hostile) {
			mess += '<INPUT id=pbHostile_' + k + ' type=submit value="' + Seed.allianceDiplomacies.hostile[k].allianceName + '"> ';
		}
		ById('pbhostilediv').innerHTML = mess;
		ById('pbhostilediv').style.display = 'block';
		ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);
		for (var q in Seed.allianceDiplomacies.hostile) {
			ById('pbHostile_' + q).addEventListener('click', function () {
				t.eventGetMembers(this.id.substr(11))
			});
		}
	},

	eventSubmit : function () {
		var t = Tabs.Player;
		ById('allallierr').innerHTML = '';
		t.aName = ById('allalliname').value;
		if (t.aName.length < 3) {
			ById('allallierr').innerHTML = uW.g_js_strings.getAllianceSearchResults.entryatleast3;
			return;
		}
		var myA = getMyAlliance();
		if (myA[0] == 0) {
			ById('allallierr').innerHTML = tx('You need to belong to an alliance to search alliances by name');
			return;
		}

		ById('allCitySelect').style.display = 'none';
		ById('allPlayerInfo').style.display = 'none';
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);
		if (myA[0] != 0 && myA[1].toUpperCase().indexOf(t.aName.toUpperCase()) >= 0) // need to merge own alliance details into results...
			t.fetchAllianceList(t.aName, myA[0], t.eventGotAllianceList);
		else
			t.fetchAllianceList(t.aName, null, t.eventGotAllianceList);
	},

	eventPlayerSubmit : function () {
		var t = Tabs.Player;
		ById('allplayerr').innerHTML = '';
		var name = ById('allplayname').value;
		name = name.replace(/\'/g, "_").replace(/\,/g, "_").replace(/\-/g, "_");
		t.pName = name;
		if (name.length < 3) {
			ById('allplayerr').innerHTML = uW.g_js_strings.getAllianceSearchResults.entryatleast3;
			return;
		}
		var myA = getMyAlliance();
		if (myA[0] == 0) {
			ById('allplayerr').innerHTML = tx('You need to belong to an alliance to search players by name');
			return;
		}
		ById('allCitySelect').style.display = 'none';
		ById('allPlayerInfo').style.display = 'none';
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);
		fetchPlayerList(name, t.eventGotPlayerList);
	},

	eventPlayerExternalTabClick : function (uid) {
		var t = Tabs.Player;
		ById('bttcPlayer').click();
		ById('allplayerr').innerHTML = '';
		ById('allCitySelect').style.display = 'none';
		ById('allPlayerInfo').style.display = 'none';
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);

		var uList = [];
		uList.push(uid);
		getOnline(uList, function (r) {
			if (!r.ok) { t.DisplayMessage(rslt.errorMsg);return; }
			else { t.clickedPlayerDetails(uid,r.data[uid]);}
		});
	},

	eventMapExternalTabClick : function (aid,aname) {
		var t = Tabs.Player;
		ById('bttcPlayer').click();
		ById('allplayerr').innerHTML = '';
		ById('allCitySelect').style.display = 'none';
		ById('allPlayerInfo').style.display = 'none';
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);
		t.GetDataForMap(aid,aname);
	},

	eventAllianceExternalTabClick: function (aid) {
		var t = Tabs.Player;
		ById('bttcPlayer').click();
		ById('allplayerr').innerHTML = '';
		ById('allCitySelect').style.display = 'none';
		ById('allPlayerInfo').style.display = 'none';
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);
		t.fetchAllianceMemberList(aid, null, t.eventGotMemberList);
	},

	eventPlayerUIDSubmit : function () {
		var t = Tabs.Player;
		ById('allplayerr').innerHTML = '';
		var uid = ById('allplayname').value;
		ById('allCitySelect').style.display = 'none';
		ById('allPlayerInfo').style.display = 'none';
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);

		var uList = [];
		uList.push(uid);
		getOnline(uList, function (r) {
			if (!r.ok) { t.DisplayMessage(rslt.errorMsg);return; }
			else { t.clickedPlayerDetails(uid,r.data[uid]);}
		});
	},

	eventListSubmit : function () {
		var t = Tabs.Player;
		var myA = getMyAlliance();

		ById('allCitySelect').style.display = 'none';
		ById('allPlayerInfo').style.display = 'none';
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);
		t.curPage = 1;
		t.fetchOtherAllianceInfo(1, t.eventGotOtherAlliancePage);
	},

	eventGotPlayerList: function (rslt) {
		var t = Tabs.Player;
		if (!rslt.ok) {
			t.DisplayMessage(rslt.msg);
			return;
		}
		t.playerList = rslt.matchedUsers;
		var uList = [];
		for (var k in rslt.matchedUsers)
			uList.push(rslt.matchedUsers[k].userId);
		getOnline(uList, function (r) { t.eventGotPlayerOnlineList(r);});
	},

	eventGotPlayerOnlineList: function (rslt) {
		var t = Tabs.Player;
		if (!rslt.ok) {
			t.DisplayMessage(rslt.errorMsg);
			return;
		}

		var m = '<DIV class=divHeader align=center>' + uW.g_js_strings.recommendSelectedFriends.playersrch + ': "' + t.pName + '"</div><br>';
		m += '<div style="padding-right:6px;width:'+GlobalOptions.btWinSize.x+'px;overflow-x:scroll;height:500px;overflow-y:scroll;"><TABLE align=center cellspacing=0 cellpadding=1 width=98% class=xtab><TR><TH align=left class=xtabHD>' + uW.g_js_strings.commonstr.nametx + '</th><TH align=left class=xtabHD>UID</th>';
		m += '<TH align=right class=xtabHD>'+uW.g_js_strings.commonstr.might+'</th>';
		var numlinks = 5;
		if (Options.ChatOptions.chatIcons) {
			m += '<TH align=center class=xtabHD>Facebook</th>';
			numlinks = 4;
		}
		else {
			m += '<TH align=center class=xtabHD>&nbsp;</th>';
		}
		m += '<TH align=left colspan='+numlinks+' class=xtabHD>' + tx('Player Links')+'</th></tr>';
		var r = 0;
		for (var k in t.playerList) {
			if (++r % 2) { rowClass = 'evenRow'; }
			else { rowClass = 'oddRow'; }
			var u = t.playerList[k];
			var status = '<img title="Offline" style="vertical-align:bottom" src="'+OFFLINE+'"/>';
			if (rslt.data[u.userId]) status = '<img title="Online" style="vertical-align:bottom" src="'+ONLINE+'"/>';

			m += '<TR class='+rowClass+'><TD>'+status+'<SPAN onclick="ptPlayClick(\''+u.userId+'\','+rslt.data[u.userId]+')"><A class=xlink>'+u.genderAndName+'</a></span></td><TD>';
			if (KOCMON_ON) m += '<A class=xlink target="_blank" href="http://www.rycamelot.com/player/' + getServerId() + '/' + u.userId + '">' + u.userId + '</a>';
			else m += u.userId;
			m += '</td>';
			m += '<TD align=right>' + addCommasInt(u.might) + '</td>';
			if (Options.ChatOptions.chatIcons) { m += '<TD align=center><A target="_blank" href="https://www.facebook.com/profile.php?id=' + t.playerList[k].fbuid + '"><img width=40 src="https://graph.facebook.com/' + t.playerList[k].fbuid + '/picture">'; }
			else { m += '<td>&nbsp;</td><TD><A target="_blank" href="https://www.facebook.com/profile.php?id=' + t.playerList[k].fbuid + '">'+tx('Facebook'); }
			m += '</a></td>';
			m += '<TD><a class=xlink onclick="ptPlayClick(\''+u.userId+'\','+rslt.data[u.userId]+')">'+tx('Details')+'</a></td>';
			m += '<TD>'+MonitorLink(u.userId,'Monitor')+'</td>';
			m += '<TD><a class=xlink onclick="ptViewChamps(\''+u.userId+'\',\''+u.name.replace(/\'/g, "")+'\')">'+tx('Champions')+'</a></td>';
			m += '<TD><SPAN onclick="getInfoForAnUser(\''+u.userId+'\')"><A class=xlink>'+uW.g_js_strings.commonstr.profile+'</a></span><\TD></tr>';
		}
		m += '</table>';
		ById('allListOut').innerHTML = m;
		ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);

	},

	fetchAllianceList: function (allianceName, myAid, notify) {
		var t = Tabs.Player;
		function combineResults(rsltA, rsltM, notify) {
			if (!rsltA.ok) {
				if (rsltA.msg.indexOf(tx("No alliance found under")) != 0 || !rsltM.ok) {
					notify(rsltA);
					return;
				}
				rsltA.ok = true;
				rsltA.count = 0;
				rsltA.alliancesMatched = {};
			}
			if (rsltM.ok) {
				rsltA.alliancesMatched['a' + rsltM.allianceInfo.allianceId] = {
					allianceId: rsltM.allianceInfo.allianceId,
					allianceName: rsltM.allianceInfo.allianceName,
					membersCount: rsltM.allianceInfo.members,
					relation: null,
					might: rsltM.allianceInfo.might,
					ranking: rsltM.allianceInfo.ranking
				};
				++rsltA.count;
			}
			notify(rsltA);
		}
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.allianceName = allianceName.replace(/\ /g,"_");
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/allianceGetSearchResults.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) {
				if (myAid != null && myAid > 0) {
					t.fetchMyAllianceInfo(function (r) { combineResults(rslt, r, notify);});
				}
				else {
					notify(rslt);
				}
			},
			onFailure: function () { notify({errorMsg: 'AJAX error'}); },
		});
	},

	eventGotAllianceList: function (rslt) {
		var t = Tabs.Player;
		if (!rslt.ok) {
			t.DisplayMessage(rslt.errorMsg);
			return;
		}
		var m = '<DIV class=divHeader align=center>'+uW.g_js_strings.commonstr.alliances+'&nbsp;"' + t.aName + '"</div><br>';
		m += '<TABLE align=center cellspacing=0 cellpadding=1 width=98% class=xtab><TR><TH align=left class=xtabHD>' + uW.g_js_strings.commonstr.alliance + '</th><TH align=right class=xtabHD>' + uW.g_js_strings.commonstr.rank + '</th><TH align=right class=xtabHD>' + uW.g_js_strings.commonstr.members + '</th>';
		m += '<TH align=right class=xtabHD>'+tx('Total Might')+'</th><TH align=left class=xtabHD>' + uW.g_js_strings.getAllianceSearchResults.currdiplo + '</th><TH align=left colspan=3 class=xtabHD>' + tx('Alliance Links')+'</th></tr>';
		var r = 0;
		for (var k in rslt.alliancesMatched) {
			if (++r % 2) { rowClass = 'evenRow'; }
			else { rowClass = 'oddRow'; }
			var all = rslt.alliancesMatched[k];
			m += '<TR class='+rowClass+'><TD>'+all.allianceName+'</td><TD align=right>'+all.ranking+'</td><TD align=right>'+all.membersCount+'</td>';
			m += '<TD align=right>' + addCommasInt(all.might) + '</td><TD id=adiplo'+all.allianceId+' class=xtab>&nbsp;</td>';
			m += '<TD><a class=xlink onclick="ptGetMembers('+all.allianceId+')">'+uW.g_js_strings.commonstr.members+'</a></td>';
			m += '<TD><a class=xlink onclick="ptPaintMembers('+all.allianceId+',\''+all.allianceName.replace(/\'/g, "")+'\')">'+uW.g_js_strings.commonstr.viewmap+'</a></td>';
			if (KOCMON_ON) m += '<TD><a class=xlink target="_blank" href="http://www.rycamelot.com/alliance/' + getServerId() + '/' + all.allianceId + '">'+tx('kocmon')+'</a></td>';
			m += '</tr>';
		}
		m += '</table>';
		ById('allListOut').innerHTML = m;

		for (var k in rslt.alliancesMatched) {
			var all = rslt.alliancesMatched[k];
			var dip = getDiplomacy(all.allianceId);
			if (dip == uW.g_js_strings.commonstr.friendly) { dip = 1; }
			else {
				if (dip == uW.g_js_strings.commonstr.hostile) { dip = 2; }
				else { dip = 0;	}
			}
			t.PaintDiplomacy(all.allianceId,dip,'adiplo');
		}
		ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);
	},

	eventGotOtherAlliancePage: function (rslt) {
		var t = Tabs.Player;
		if (!rslt.ok) {
			t.DisplayMessage(rslt.errorMsg);
			return;
		}
		t.MaxPage = rslt.noOfPages;

		var m = '<DIV class=divHeader align=center>'+uW.g_js_strings.modal_alliance.allilist + '</div><br>';
		m += '<TABLE align=center cellspacing=0 cellpadding=1 width=98% class=xtab><TR><TH align=left class=xtabHD>' + uW.g_js_strings.commonstr.alliance + '</th><TH align=right class=xtabHD>' + uW.g_js_strings.commonstr.rank + '</th><TH align=right class=xtabHD>' + uW.g_js_strings.commonstr.members + '</th>';
		m += '<TH align=right class=xtabHD>'+tx('Total Might')+'</th><TH align=right class=xtabHD>'+tx('Total Glory')+'</th><TH align=left class=xtabHD>' + uW.g_js_strings.getAllianceSearchResults.currdiplo + '</th><TH align=left colspan=3 class=xtabHD>' + tx('Alliance Links')+'</th></tr>';
		var r = 0;

		for (var k in rslt.otherAlliances) {
			var all = rslt.otherAlliances[k];
			if (all.allianceId) {
				if (++r % 2) { rowClass = 'evenRow'; }
				else { rowClass = 'oddRow'; }
				var rowcol = "";
				if (getMyAlliance()[0] == all.allianceId) { rowcol = "whiteOnGreen"; }

				m += '<TR class='+rowClass+'><TD><span class="'+rowcol+'">'+all.name+'</span></td><TD align=right><span>'+all.ranking+'</span></td><TD align=right><span>'+all.membersCount+'</span></td>';
				m += '<TD align=right><span>' + addCommasInt(all.might) + '</span></td><TD align=right><span>' + addCommasInt(all.glory) + '</span></td><TD id=odiplo'+all.allianceId+' class=xtab>&nbsp;</td>';
				m += '<TD><a class=xlink onclick="ptGetMembers('+all.allianceId+')">'+uW.g_js_strings.commonstr.members+'</a></td>';
				m += '<TD><a class=xlink onclick="ptPaintMembers('+all.allianceId+',\''+all.name.replace(/\'/g, "")+'\')">'+uW.g_js_strings.commonstr.viewmap+'</a></td>';
				if (KOCMON_ON) m += '<TD><a class=xlink target="_blank" href="http://www.rycamelot.com/alliance/' + getServerId() + '/' + all.allianceId + '">'+tx('kocmon')+'</a></td>';
				m += '</tr>';
				r++;
			}
		}
		m += '</table>';

		m += '<br><div style="padding-left:10px;font-weight:bold;height:20px;width:560px;"><span>';
		m += '<a class="buttonv2 std blue" onclick="ptAllClickPrev(-1)">|<</a>';
		m += '<a class="buttonv2 std blue" onclick="ptAllClickPrev(10)"><10</a>';
		m += '<a class="buttonv2 std blue" onclick="ptAllClickPrev(5)"><5</a>';
		m += '<a class="buttonv2 std blue" onclick="ptAllClickPrev(1)"><</a>';
		m += '<a class="buttonv2 std blue" onclick="ptAllClickNext(1)">></a>';
		m += '<a class="buttonv2 std blue" onclick="ptAllClickNext(5)">>5</a>';
		m += '<a class="buttonv2 std blue" onclick="ptAllClickNext(10)">>10</a>';
		m += '<a class="buttonv2 std blue" onclick="ptAllClickNext(9999)">>|</a>';
		m += '&nbsp;&nbsp;'+tx('Page')+'&nbsp;<INPUT align=right id=idPageNum type="text" class=btInput value='+t.curPage+' size=4 />&nbsp;'+uW.g_js_strings.commonstr.of+'&nbsp;'+t.MaxPage+'.&nbsp;<a class=xlink id=idFindMyAlliance>'+tx('Find My Alliance')+'</a>';
		m += '</span></div>';

		ById('allListOut').innerHTML = m;

		ById('idPageNum').addEventListener ('change', t.PageNumChange, false);
		ById('idPageNum').addEventListener ('keyup', function (e){ StartKeyTimer(e.target, t.PageNumChange); }, false);
		ById('idFindMyAlliance').addEventListener ('click', t.FindMyAlliance, false);

		for (var k in rslt.otherAlliances) {
			var all = rslt.otherAlliances[k];
			var dip = getDiplomacy(all.allianceId);
			if (dip == uW.g_js_strings.commonstr.friendly) { dip = 1; }
			else {
				if (dip == uW.g_js_strings.commonstr.hostile) { dip = 2; }
				else { dip = 0;	}
			}
			t.PaintDiplomacy(all.allianceId,dip,'odiplo');
		}
		ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);
	},

	eventListNext: function (amt) {
		var t = Tabs.Player;
		if (parseInt(amt) >= 9999) { t.curPage = t.MaxPage; }
		else {
			t.curPage = parseInt(t.curPage) + parseInt(amt);
			if (t.curPage > t.MaxPage) { t.curPage = t.MaxPage;	}
		}
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);
		t.fetchOtherAllianceInfo(t.curPage, t.eventGotOtherAlliancePage);
	},

	eventListPrev: function (amt) {
		var t = Tabs.Player;
		if (amt <= -1) { t.curPage = 1; }
		else {
			t.curPage = parseInt(t.curPage) - parseInt(amt);
			if (t.curPage < 1) { t.curPage = 1; }
		}
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);
		t.fetchOtherAllianceInfo(t.curPage, t.eventGotOtherAlliancePage);
	},

	FindMyAlliance : function () {
		var t = Tabs.Player;
		if (getMyAlliance()[0] == 0) { return; }
		t.fetchMyAllianceInfo(function (rslt) {
			if (rslt.ok) {
				t.gotoPage(Math.ceil(parseIntNan(rslt.allianceInfo.ranking)/10));
			}
		});
	},

	PageNumChange : function () {
		var t = Tabs.Player;
		if (KeyTimer) { clearTimeout(KeyTimer); }
		t.gotoPage(parseIntNan(ById('idPageNum').value));
	},

	gotoPage : function (val) {
		var t = Tabs.Player;
		if (t.MaxPage < 0 ) { return; }
		if (val > t.MaxPage) { val = t.MaxPage; }
		if (val < 1) { val = 1; }
		t.curPage = val;
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);
		t.fetchOtherAllianceInfo(t.curPage, t.eventGotOtherAlliancePage);
	},

	fetchOtherAllianceInfo: function (pageNum, notify) {
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.pageNo = pageNum;
		params.cityId = uW.currentcityid;
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/allianceGetOtherInfo.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) { notify(rslt); },
			onFailure: function () { notify({errorMsg: 'AJAX error'});},
		});
	},

	fetchMyAllianceInfo: function (notify) {
		var params = uW.Object.clone(uW.g_ajaxparams);
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/allianceGetInfo.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) { notify(rslt); },
			onFailure: function () { notify({errorMsg: 'AJAX error'}); },
		});
	},

	showMyAlliance : function () {
		var t = Tabs.Player;
		var aid = getMyAlliance()[0];
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);
		if (aid != 0) {
			t.eventGetMembers(aid);
		} else {
			t.DisplayMessage(uW.g_js_strings.membersInfo.youmustbelong);
		}
	},

	eventGetMembers: function (aid) {
		var t = Tabs.Player;
		ById('allCitySelect').style.display = 'none';
		ById('allPlayerInfo').style.display = 'none';
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);
		t.fetchAllianceMemberList(aid, null, t.eventGotMemberList);
	},

	fetchAllianceMemberList: function (allianceId, allianceName, notify) {
		var t = Tabs.Player;
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.type = "might";
		params.page = 1;
		params.perPage = 100;
		if (allianceName) { params.allianceName = allianceName; }
		if (allianceId && allianceId != 0) { params.allianceId = allianceId; }
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/getUserLeaderboard.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) { notify(rslt); },
			onFailure: function () { notify({errorMsg: 'AJAX error'}); },
		});
	},

	eventGotMemberList: function (rslt) {
		var t = Tabs.Player;
		if (!rslt.ok) {
			t.DisplayMessage(rslt.errorMsg);
			return;
		}
		t.MemberListRslt = rslt;
		var uList = [];
		for (var k in rslt.results) {
			uList.push(rslt.results[k].userId);
		}
		getOnline(uList, function (r) { t.eventGotMemberOnlineList(r);});
	},

	eventGotMemberOnlineList: function (rslt) {
		var t = Tabs.Player;
		var numInvalid = 0;
		var numPlayers = 0;
		var aid = getMyAlliance()[0];
		var prestige = "";
		t.dat = [];
		for (var i = 0; i < t.MemberListRslt.results.length; i++) {
			p = t.MemberListRslt.results[i];
			if (p.userId == 0) { ++numInvalid; }
			else {
				++numPlayers;
				if (aid == p.allianceId) { t.friendEta = true; }
				else { t.friendEta = false; }
				for (var c = 0; c < p.cities.length; c++) {
					var pt = p.cities[c].prestigeType;
					var prestige = getFactionName(pt);
					if (prestige == "") { prestigelvl = ""; }
					else { prestigelvl = " (" + p.cities[c].prestigeLevel + ")"; }
					ExpTime = convertTime(new Date(p.cities[c].prestigeBuffExpire.replace(" ", "T")+"Z"));
					if ((ExpTime + (3600 * 24) < unixTime()) || isNaN(ExpTime)) {
						prestigeexp = "";
					} else {
						prestigeexp = t.getDuration(p.cities[c].prestigeBuffExpire);
					}
					t.dat.push([p.displayName, parseInt(p.might), p.officerType, parseInt(p.numCities), parseInt(p.cities[c].tileLevel),
						parseInt(p.cities[c].xCoord), parseInt(p.cities[c].yCoord), p.cities[c].cityName, 0, rslt.data[p.userId]?1:0, '--',
						p.cities[c].cityId, prestige, p.userId, prestigelvl, prestigeexp, p.cities[c].prestigeBuffExpire, prestige + prestigelvl, p.cities[c].blessing,false]);
				}
			}
		}
		t.setDistances(Cities.byID[t.ModelCityId].x, Cities.byID[t.ModelCityId].y);
		t.setEta();
		t.displayMembers(t.MemberListRslt.allianceName, numPlayers);
	},

	handleEtaSelect: function () {
		var t = Tabs.Player;
		t.unitId = ById('idFindETASelect').value;
		t.setEta();
		t.RepaintList();
	},

	setDistances: function (x, y) {
		var t = Tabs.Player;
		for (var i = 0; i < t.dat.length; i++) {
			t.dat[i][8] = distance(x, y, t.dat[i][5], t.dat[i][6]);
		}
	},

	setEta: function () {
		var t = Tabs.Player;

		var speed = 0;
		var speedfriend = 0;

		if (t.unitId!=0) {
			var MarchTime = March.getMarchTime(t.ModelCityId,{unit:t.unitId},0,'',false,false,false,false);
			speed = MarchTime.speed;
			speedfriend = MarchTime.speedfriend;
		}

		var delay = CM.WorldSettings.isOn("MARCH_SINGLE_TRIP_DELAY") ? parseInt(uW.g_marchSingleTripDelay) : 0;

		for (var i = 0; i < t.dat.length; i++) {
			var distance = t.dat[i][8];
			if (distance) {
				if (speed == 0 || distance == 0) {
					t.dat[i][10] = 0;
				}
				else {
					var time = 0;
					var timefriend = 0;
					if (speed > 0) { time = Math.ceil(parseFloat(distance) * 6000 / speed); }
					if (speedfriend > 0) { timefriend = Math.ceil(parseFloat(distance) * 6000 / speedfriend); }

					time += delay;
					timefriend += delay;

					if (Seed.playerEffects.returnExpire > uW.unixtime()) {
						time = parseInt(time * 0.75);
						timefriend = parseInt(timefriend * 0.75);
					}

					time = Math.ceil(time < 30 ? 30 : time);
					timefriend = Math.ceil(timefriend < 30 ? 30 : timefriend);

					if (t.friendEta) { t.dat[i][10] = timefriend; }
					else { t.dat[i][10] = time; }
				}
			}
		}
	},

	displayPlayer: function (uid,locations) {
		var t = Tabs.Player;

		t.hidePlayerInfo = false;
		var u = t.userobj[uid];
		var n = '<DIV class=divHeader align=center style="padding-right:0px;"><TABLE width=100% cellspacing=0><TR><TD class=xtab width=100>&nbsp;</td><td class=xtab align=center>'+u.name+'&nbsp;('+parseInt(u.userId)+')</td><td class=xtab align=right width=100><a class=xlink id=ptplayershowhide>'+tx('Hide Details')+'</a></td></tr></table></div>';
		n += '<div id=ptplayerinfo style="max-width:'+GlobalOptions.btWinSize.x+'px;padding:5px;"><table style="padding-right:0px;" class=xtab cellspacing=0 width=100%><tr><td style="vertical-align:top;"><table style="padding-right:0px;" class=xtab cellspacing=0 width=100%>';
		if (u.allianceId && u.allianceId != 0) {
			n += '<tr><td>'+uW.g_js_strings.commonstr.alliance+':&nbsp;</td><td colspan=2><b><a class=xlink onclick="ptGetMembers(' + u.allianceId + ')">' + u.allianceName + '</a></b></td></tr>';
			n += '<TR><TD>'+tx('Diplomacy')+':&nbsp;</td><TD colspan=2 id=diplo'+u.allianceId+'>&nbsp;</td></tr>';
		}
		else {
			n += '<tr><td>'+uW.g_js_strings.commonstr.alliance+':&nbsp;</td><td colspan=2><b>'+uW.g_js_strings.commonstr.none+'!</b></td></tr>';
		}

		if (!u.online) {
			n += ' <tr><TD>'+uW.g_js_strings.modal_messages_viewreports_view.lastlogin+':&nbsp;</td><TD colspan=2><b>'+ t.getLastLogDuration(u.lastLogin) +'</b></td></tr>';
		}
		else {
			n += ' <tr><TD>'+tx('Last login')+':&nbsp;</td><TD colspan=2><b><span style="color:#800">'+tx('ONLINE')+'</span></b></td></tr>';
		}
		if (u.misted)
			n += '<tr><TD>'+tx('Misted')+':&nbsp;</td><TD colspan=2><b>' + Tabs.Monitor.getDuration(u.fogExpireTimestamp) + '</b></td></tr>';
		n += '<tr><TD>'+uW.g_js_strings.commonstr.status+':&nbsp;</td><TD colspan=2><b>' + Tabs.Monitor.GetStatusText(u.warStatus,u.truceExpireTimestamp) + '</b></td></tr>';
		n += '<tr><TD>'+uW.g_js_strings.commonstr.might+':&nbsp;</td><TD colspan=2><b>' + addCommas(Math.round(u.might)) + '</b></td></tr>';
		n += '<tr><TD>'+tx('Classic Might')+':&nbsp;</td><TD colspan=2><b>' + addCommas(Math.round(u.mightClassic)) + '</b></td></tr>';
		if (Options.ShowGloryMight) {
			n += '<tr><TD>'+tx('Glory Might')+':&nbsp;</td><TD colspan=2><b>' + addCommas(Math.round(u.mightGlory)) + '</b></td></tr>';
		}
		n += '<TR><TD>'+uW.g_js_strings.commonstr.glory+':&nbsp;</td><TD width=50><b><DIV id=ptPaintGlory></div></b></td><td valign=middle rowspan=3 id=ptGloryIcon>&nbsp;</td></tr>';
		n += '<TR><TD>'+tx('Maximum Glory')+':&nbsp;</td><TD><b><DIV id=ptPaintMaxGlory></div></b></td></tr>';
		n += '<TR><TD>'+tx('Lifetime Glory')+':&nbsp;</td><TD><b><DIV id=ptPaintLifetimeGlory></div></b></td></tr>';

		var pids = u.provinceIds.split(',');
		var p = [];
		for (var i = 0; i < pids.length; i++) {
			p.push(uW.provincenames['p' + pids[i]]);
		}
		n += '<tr><td>'+tx('Provinces')+':&nbsp;</td><td colspan=2><div class="wrap" style="width:'+(GlobalOptions.btWinSize.x-300)+'px;">'+p.join(', ')+'</div></td></tr>';
		// create notes link
		var notes = "";
		if (Tabs.Notes && Tabs.Notes.noteValues[uid]) {
			notes = Tabs.Notes.noteValues[uid];
			notes = notes.text;
		}

		var dip = getDiplomacy(u.allianceId);
		if (dip == uW.g_js_strings.commonstr.friendly) { dip = 1; }
		else {
			if (dip == uW.g_js_strings.commonstr.hostile) { dip = 2; }
			else { dip = 0;	}
		}

		n += '<TR><TD class=xtab valign=top><a class=xlink id=ptplayernoteslink>'+tx('Player Notes')+':</a></td><TD colspan=2 id=ptplayernotes class=xtabBRTop><div class="wrap" style="width:'+(GlobalOptions.btWinSize.x-300)+'px;">' + notes + '</div></td></tr>';
		n += '</table></td><td style="vertical-align:top;" align=right><table style="padding-right:0px;" class=xtab cellspacing=0 width=100%>';
		
		/*
        * KOC-425 - Remove FB Profile Link
			n += '<tr><TD style="padding-right:0px;" align=right><A target="_blank" href="https://www.facebook.com/profile.php?id=' + u.fbuid + '">';
			if (Options.ChatOptions.chatIcons) { n += '<img width=50 src="https://graph.facebook.com/' + u.fbuid + '/picture">'; }
			else { n += '<img width=50 src="'+u.avatarurl+'">'; }
			n += '</a></td></tr>';
			n += '<tr><TD style="padding-right:0px;" align=right><A class=xlink onclick="getInfoForAnUser(\''+u.userId+'\')">'+tx('Profile')+'</a></td></tr>';
		*/

		if (KOCMON_ON) n += '<tr><TD style="padding-right:0px;" align=right><A class=xlink target="_blank" href="http://www.rycamelot.com/player/' + getServerId() + '/' + u.userId + '">'+tx('kocmon')+'</a></td></tr>';
		if (!uW.isNewServer()) {
			n += '<tr><TD style="padding-right:0px;" align=right>'+MonitorLink(u.userId,tx('Throne Monitor'))+'</td></tr>';
			n += '<tr><TD style="padding-right:0px;" align=right><a class=xlink onclick="ptViewChamps(\''+u.userId+'\',\''+u.name.replace(/\'/g, "")+'\')">'+tx('Champions Hall')+'</a></td></tr>';
		}
		if ((allianceleader||trusted) && dip!=2) { // no invite option for hostiles
			n += '<tr><TD style="padding-right:0px;" align=right><SPAN onclick="ptInvite(this, \''+ u.userId +'\')"><A class=xlink>'+uW.g_js_strings.membersInfo.invitealli+'</a></span></td></tr>';
		}
		n += '</table></td></tr></table></div>';

		ById('allPlayerInfo').innerHTML = n;

		if (Tabs.Notes) { ById('ptplayernoteslink').addEventListener('click',function() {Tabs.Notes.createPopup({id:uid,username:u.name});},false); }
		ById('ptplayershowhide').addEventListener('click',t.PlayerShowHide,false);

		t.PaintDiplomacy(u.allianceId,dip,'diplo');

		var m = '<DIV class=divHeader style="padding-right:0px;"><TABLE width=100% cellspacing=0><TR><TD class=xtab>&nbsp;</td>';
		if (!locations) {
			m += '<TD class=xtab align=center>'+tx('City locations unavailable')+'</td>';
		}
		else {
			m += '<TD class=xtab align=center>'+uW.g_js_strings.commonstr.distance+'&nbsp;'+uW.g_js_strings.commonstr.from+'&nbsp;<SPAN id=distFrom>'+Cities.byID[t.ModelCityId].name+'&nbsp;('+Cities.byID[t.ModelCityId].x+','+Cities.byID[t.ModelCityId].y+')</span></td>';
		}
		m += '<TD class=xtab align=right>&nbsp;</td></tr></table></div>';
		if (locations) {
			m += '<div style="padding-right:6px;width:'+GlobalOptions.btWinSize.x+'px;overflow-x:scroll;height:200px;overflow-y:scroll;"><TABLE id=tabAllMembers align=left cellpadding=0 cellspacing=0 width=100%>';
			m += '<TR><TD nowrap><A id=clickCol0 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+uW.g_js_strings.commonstr.player+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol1 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+uW.g_js_strings.commonstr.might+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol2 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+uW.g_js_strings.commonstr.rank+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol7 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+uW.g_js_strings.commonstr.city+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol4 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Lvl')+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol17 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+uW.g_js_strings.commonstr.faction+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol16 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Protection Left')+'&nbsp;</span></a></td>\
				<TD nowrap><a id=clickCol9 class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="padding-right:10px;vertical-align:middle;display:inline-block;width:100%;"><INPUT id=ToggleScoutCheckbox type=checkbox></span></a></td>\
				<TD nowrap><A id=clickCol5 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Co-ords')+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol8 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Distance')+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol10 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:88%;">&nbsp;'+tx('ETA')+'&nbsp;</span></a></td>\
				</tr>';
			m += '<TBODY id=allBody></tbody></table></div>';
		}

		ById('allListOut').innerHTML = m;
		t.PaintGlory(uid);
		ById('allPlayerInfo').style.display = 'block';

		if (locations) {
			ById('allCitySelect').style.display = 'block';
		}
		ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);

		if (locations) {
			ById('clickCol' + Options.PlayerOptions.sortColNum).className = 'buttonv2 std green';
			ById('ToggleScoutCheckbox').addEventListener('change', t.doSelectall, false);
			t.RepaintList();
		}
	},

	PlayerShowHide : function() {
		var t = Tabs.Player;
		var a = ById('ptplayershowhide');
		t.hidePlayerInfo = !t.hidePlayerInfo;
		if (t.hidePlayerInfo) {
			disp = 'none';
			if (a) a.innerHTML = tx('Show Details');
		}else{
			disp = 'block';
			if (a) a.innerHTML = tx('Hide Details');
		}
		ById('ptplayerinfo').style.display = disp;
	},

	displayMembers: function (allName, numPlayers) {
		var t = Tabs.Player;

		var m = '<DIV class=divHeader style="padding-right:0px;"><TABLE width=100% cellspacing=0><TR><TD class=xtab>&nbsp;'+allName+'&nbsp;('+t.MemberListRslt.allianceId+')</td>';
		m += '<TD class=xtab align=center>'+uW.g_js_strings.commonstr.distance+'&nbsp;'+uW.g_js_strings.commonstr.from+'&nbsp;<SPAN id=distFrom>'+Cities.byID[t.ModelCityId].name+'&nbsp;('+Cities.byID[t.ModelCityId].x+','+Cities.byID[t.ModelCityId].y+')</span></td>';
		m += '<TD class=xtab align=right>'+numPlayers+'&nbsp;'+uW.g_js_strings.commonstr.members+'&nbsp;&nbsp;<a class=xlink onclick="ptPaintMembers('+t.MemberListRslt.allianceId+',\''+allName.replace(/\'/g, "")+'\')">'+uW.g_js_strings.commonstr.viewmap+'</a>';
		if (KOCMON_ON) m += '&nbsp;&nbsp;<a target="_blank" href="http://www.rycamelot.com/alliance/' + getServerId() + '/' + t.MemberListRslt.allianceId + '"><img title="'+tx('View alliance on kocmon')+'" style="width:16px;vertical-align:bottom;margin-top:-6px;" src="'+KOCMON_LOGO+'"></a>';
		m += '</td></tr></table></div>';
		m += '<div style="padding-right:6px;width:'+GlobalOptions.btWinSize.x+'px;overflow-x:scroll;height:500px;overflow-y:scroll;"><TABLE id=tabAllMembers align=left cellpadding=0 cellspacing=0 width=100%>';
		m += '<TR><TD nowrap><A id=clickCol0 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+uW.g_js_strings.commonstr.player+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol1 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+uW.g_js_strings.commonstr.might+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol2 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+uW.g_js_strings.commonstr.rank+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol7 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+uW.g_js_strings.commonstr.city+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol4 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Lvl')+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol17 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+uW.g_js_strings.commonstr.faction+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol16 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Protection Left')+'&nbsp;</span></a></td>\
				<TD nowrap><a id=clickCol9 class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="padding-right:10px;vertical-align:middle;display:inline-block;width:100%;"><INPUT id=ToggleScoutCheckbox type=checkbox></span></a></td>\
				<TD nowrap><A id=clickCol5 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Co-ords')+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol8 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:100%;">&nbsp;'+tx('Distance')+'&nbsp;</span></a></td>\
				<TD nowrap><A id=clickCol10 onclick="ptplayClickSort(this)" class="buttonv2 std blue" style="padding-left:0px;padding-right:0px;"><span style="display:inline-block;width:88%;">&nbsp;'+tx('ETA')+'&nbsp;</span></a></td>\
				</tr>';
		m += '<TBODY id=allBody></tbody></table></div>';

		ById('allListOut').innerHTML = m;
		ById('allCitySelect').style.display = 'block';
		ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);

		ById('clickCol' + Options.PlayerOptions.sortColNum).className = 'buttonv2 std green';
		ById('ToggleScoutCheckbox').addEventListener('change', t.doSelectall, false);
		t.RepaintList();
	},

	clickedPlayerDetails : function (uid,online) {
		var t = Tabs.Player;
		ById('allCitySelect').style.display = 'none';
		ById('allPlayerInfo').style.display = 'none';
		t.DisplayMessage(uW.g_js_strings.commonstr.loadingddd);

		var params = uW.Object.clone(uW.g_ajaxparams);
		params.uid = uid;
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/getUserGeneralInfo.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) {
				if (rslt.ok) {
					t.userobj = {};
					t.userobj[uid] = rslt.userInfo[0];
					t.userobj[uid].might = Math.round(t.userobj[uid].might);
					t.userobj[uid].online = (online?true:false);

					fetchPlayerCourt(uid, function (rslt2) {
						if (rslt2.ok) {
							u = unixTime();
							f = convertTime(new Date(rslt2.playerInfo.fogExpireTimestamp.replace(" ","T")+"Z"));
							t.userobj[uid].misted = (f >= u);
							t.userobj[uid].fogExpireTimestamp = rslt2.playerInfo.fogExpireTimestamp;
							t.userobj[uid].warStatus = rslt2.playerInfo.warStatus;
							t.userobj[uid].truceExpireTimestamp = rslt2.playerInfo.truceExpireTimestamp;
							t.userobj[uid].cityCount = rslt2.playerInfo.cityCount;
							t.userobj[uid].mightClassic = rslt2.playerInfo.mightClassic;
							t.userobj[uid].mightGlory = rslt2.playerInfo.mightGlory;
							t.userobj[uid].fbuid = parseInt(rslt2.playerInfo.fbuid);
							t.userobj[uid].lastLogin = rslt2.playerInfo.lastLogin;

							t.fetchPlayerLeaderboard(uid, function (r) { t.gotPlayerLeaderboard(r, uid) });
						}
						else {
							t.DisplayMessage(uW.g_js_strings.barbarian.erroroccured);
						}
					});
				}
				else {
					t.DisplayMessage(uW.g_js_strings.barbarian.erroroccured);
				}
			},
			onFailure: function () {t.DisplayMessage(uW.g_js_strings.errorcode.err_602);},
		});
	},

	fetchPlayerLeaderboard: function (uid, notify) {
		var t = Tabs.Player;
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.userId = uid;
		params.type = "might";
		params.page = 1;
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/getUserLeaderboard.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) { notify(rslt); },
			onFailure: function () { notify({errorMsg: 'AJAX error'});},
		});
	},

	gotPlayerLeaderboard : function (rslt,uid) {
		var t = Tabs.Player;
		if (!rslt.ok) {
			t.DisplayMessage(rslt.errorMsg);
			return;
		}
		t.dat = [];
		var prestige = "";
		var aid = getMyAlliance()[0];
		if (rslt.totalResults == 0) {
			t.displayPlayer(uid,false);
			return;
		}

		var p = rslt.results[0];
		if (aid == p.allianceId) { t.friendEta = true; }
		else { t.friendEta = false; }
		for (var c = 0; c < p.cities.length; c++) {
			var pt = p.cities[c].prestigeType;
			var prestige = getFactionName(pt);
			if (prestige == "") { prestigelvl = ""; }
			else { prestigelvl = " (" + p.cities[c].prestigeLevel + ")"; }
			ExpTime = convertTime(new Date(p.cities[c].prestigeBuffExpire.replace(" ", "T")+"Z"));
			if ((ExpTime + (3600 * 24) < unixTime()) || isNaN(ExpTime)) {
				prestigeexp = "";
			} else {
				prestigeexp = t.getDuration(p.cities[c].prestigeBuffExpire);
			}
			t.dat.push([p.displayName, parseInt(p.might), p.officerType, parseInt(p.numCities), parseInt(p.cities[c].tileLevel),
				parseInt(p.cities[c].xCoord), parseInt(p.cities[c].yCoord), p.cities[c].cityName, 0, t.userobj[uid].online, '--',
				p.cities[c].cityId, prestige, p.userId, prestigelvl, prestigeexp, p.cities[c].prestigeBuffExpire, prestige + prestigelvl, p.cities[c].blessing,false]);
		}
		t.setDistances(Cities.byID[t.ModelCityId].x, Cities.byID[t.ModelCityId].y);
		t.setEta();
		t.displayPlayer(uid,true);
	},

	RepaintList: function () {
		var t = Tabs.Player;

		function sortFunc(a, b) {
			var t = Tabs.Player;
			if (typeof (a[Options.PlayerOptions.sortColNum]) == 'number') {
				if (Options.PlayerOptions.sortDir > 0)
					return a[Options.PlayerOptions.sortColNum] - b[Options.PlayerOptions.sortColNum];
				else
					return b[Options.PlayerOptions.sortColNum] - a[Options.PlayerOptions.sortColNum];
			} else if (typeof (a[Options.PlayerOptions.sortColNum]) == 'boolean') {
				return 0;
			} else {
				if (Options.PlayerOptions.sortDir > 0)
					return a[Options.PlayerOptions.sortColNum].localeCompare(b[Options.PlayerOptions.sortColNum]);
				else
					return b[Options.PlayerOptions.sortColNum].localeCompare(a[Options.PlayerOptions.sortColNum]);
			}
		}

		t.dat.sort(sortFunc);

		var m = '';
		var RowId = "";
		var r = 0;
		for (var i = 0; i < t.dat.length; i++) {
			RowId = 'ptplay_'+t.dat[i][5].toString()+'_'+t.dat[i][6].toString();
			var bless = showBlessings(t.dat[i][18]);
			if (bless != "") {
				var bless = '<a class=trimg><img style="vertical-align:bottom" src="'+IMGURL+'bonus_prestige.png"><SPAN class=trtip><table width=200 class=xtab>'+bless+'</table></span></a>';
			}
			var status = '<img title="Offline" style="vertical-align:bottom" src="'+OFFLINE+'"/>';
			if (t.dat[i][9] == 1) status = '<img title="Online" style="vertical-align:bottom" src="'+ONLINE+'"/>';
			if (++r % 2) { rowClass = 'evenRow'; }
			else { rowClass = 'oddRow'; }
			if (t.dat[i][19]) rowClass += ' highRow';

			m += '<TR id="'+RowId+'" class="'+rowClass+'" style="max-height:30px"><TD class=xtab nowrap>'+status+'<SPAN onclick="ptPlayClick(\''+t.dat[i][13]+'\','+t.dat[i][9]+')"><A class=xlink>'+t.dat[i][0]+'</a></span></td>';
			m += '<TD class=xtab align=right>'+(t.dat[i][1]==4294967295?'<span style="opacity:0.6"><i>4 BILLION +</i></span>':addCommasInt(t.dat[i][1]))+'</td>';
			m += '<TD class=xtab nowrap>'+officerId2String(t.dat[i][2])+'</td>';
			m += '<TD class=xtab nowrap>'+t.dat[i][7]+'</td>';
			m += '<TD class=xtab align=right>'+t.dat[i][4]+'</td>';
			m += '<TD class=xtab align=left nowrap>'+bless+t.dat[i][12]+t.dat[i][14]+'</td>';
			m += '<TD class=xtab align=center>'+t.dat[i][15]+'</td>';
			m += '<TD class=xtab align=center style="padding-left:4px;padding-right:0px;"><INPUT id=ptScout_'+t.dat[i][11]+' type=checkbox></td>';
			m += '<TD class=xtab align=center onclick="btGotoMap('+t.dat[i][5]+','+t.dat[i][6]+')"><A class=xlink>'+t.dat[i][5]+','+t.dat[i][6]+'</a></td>';
			m += '<TD class=xtab align=right>'+t.dat[i][8].toFixed(2)+'</td>';
			m += '<TD class=xtab align=right>'+(t.dat[i][10]?'<SPAN>'+(t.dat[i][10]>0?timestr(t.dat[i][10],1):'--')+'</span>':'<SPAN>--</span>')+'</td>';
		}
		if (ById('allBody')) {
			ById('allBody').innerHTML = m;
			ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);
		}
	},

	doSelectall: function () {
		var t = Tabs.Player;
		var city = "";
		for (var k = 0; k < t.dat.length; k++) {
			city = t.dat[k][11].toString();
			if (ById('ToggleScoutCheckbox').checked) ById('ptScout_' + city).checked = true;
			else ById('ptScout_' + city).checked = false;
		}
	},

	eventCoords: function (city, x, y) {
		var t = Tabs.Player;
		var m = '';
		if (city != null) {
			m = city.name + ' (' + city.x + ',' + city.y + ')';
			t.ModelCityId = city.id;
		}
		else {
			m = x + ',' + y;
		}
		var distFrom = ById('distFrom');
		if (distFrom)
			distFrom.innerHTML = m;
		t.setDistances(x, y);
		t.setEta();
		t.RepaintList();
	},

	getLastLogDuration : function (datestr){
		if (!datestr) return;
		var Interval = convertTime(new Date(datestr.replace(" ","T")+"Z")) - unixTime();
		if (Interval < 0) return uW.timestr(Interval*(-1)) +' ago';
		else return 'minutes ago';
	},

	ExportScoutList : function () {
		var t = Tabs.Player;
		var coordlist = t.getSelected();
		if (coordlist != "") {
			Tabs.BulkScout.ImportCoords(coordlist.split(" "));
		}
	},

	ExportAttackList : function () {
		var t = Tabs.Player;
		var coordlist = t.getSelected();
		if (coordlist != "") {
			Tabs.BulkAttack.ImportCoords(coordlist.split(" "));
		}
	},

	getSelected : function () {
		var t = Tabs.Player;
		var coordlist = "";
		var city = "";
		for (var k = 0; k < t.dat.length; k++) {
			city = t.dat[k][11].toString();
			if (ById('ptScout_' + city).checked) {
				coordlist += t.dat[k][5].toString()+','+t.dat[k][6].toString()+' ';
				ById('ptScout_' + city).checked = false;
			}
		}
		return coordlist;
	},

	HighlightDefenders : function () {
		var t = Tabs.Player;

		var delayer = 0;
		ById('ptHighDefenders').outerHTML = '<span id=ptHighDefendersProg>&nbsp;</span>';

		for (var k = 0; k < t.dat.length; k++) {
			if (!t.ReqSent[t.dat[k][5]+'_'+t.dat[k][6]] || t.ReqSent[t.dat[k][5]+'_'+t.dat[k][6]]==0) {
				t.ReqSent[t.dat[k][5]+'_'+t.dat[k][6]]=1;
				setTimeout(getDefendStatus,(250*delayer),t.dat[k][5],t.dat[k][6],false,false,t.UpdateDefendStatus,k,t.dat.length,'ptHighDefendersProg');
				delayer = delayer + 1;
			}
		}

		function ClearAtEnd () {
			if (ById('ptHighDefendersProg')) {
				ById('ptHighDefendersProg').outerHTML = strButton20(tx('Highlight Defending Cities'),'id=ptHighDefenders');
				ById('ptHighDefenders').addEventListener('click', t.HighlightDefenders, false);
			}
		};

		setTimeout (ClearAtEnd,(250*delayer));
	},

	UpdateDefendStatus : function (rslt,x,y,k) {
		var t = Tabs.Player;
		t.ReqSent[x+'_'+y]=0;
		var div = ById('ptplay_'+x+'_'+y);
		var	city = t.dat[k][11].toString();
		if (rslt.ok && rslt.ok=="true") {
			t.dat[k][19] = true;
			if (div) jQuery(div).addClass("highRow");
			if (ById('ptScout_' + city)) ById('ptScout_' + city).checked = true;
		}
		else {
			t.dat[k][19] = false;
			if (div) jQuery(div).removeClass("highRow");
			if (ById('ptScout_' + city)) ById('ptScout_' + city).checked = false;
		}
	},

	PaintGlory: function (uid) {
		var t = Tabs.Player;
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.userId = uid;
		params.ctrl = 'PlayerProfile';
		params.action = 'get';
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/_dispatch.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) {
				if (rslt.ok) {
					ById('ptPaintGlory').innerHTML = addCommas(rslt.profile.glory);
					ById('ptPaintMaxGlory').innerHTML = addCommas(rslt.profile.maxGlory);
					ById('ptPaintLifetimeGlory').innerHTML = addCommas(parseIntNan(rslt.profile.lifetimeGlory));
					ById('ptGloryIcon').innerHTML = '<img src="'+IMGURL+'chat_'+rslt.profile.gloryIconId+'.png">';
				}
				else {
					ById('ptPaintGlory').innerHTML = '(error)';
					ById('ptPaintMaxGlory').innerHTML = '(error)';
					ById('ptPaintLifetimeGlory').innerHTML = '(error)';
					ById('ptGloryIcon').innerHTML = '&nbsp;';
				}
			},
		},true);
	},

	getDuration: function (datestr) {
		var t = Tabs.Player;
		var Interval = convertTime(new Date(datestr.replace(" ", "T")+"Z")) - unixTime();
		if (Interval >= 0) {
			return uW.timestr(Interval);
		} else
			return '<span style="color:#800;">'+tx('Expired')+' ' + uW.timestr(Interval * (-1)) + ' '+tx('Ago')+'</span>';
	},

	clickedSendInvite : function (span, uid){
		var t = Tabs.Player;
		var popConfirm = null;
		popConfirm = new CPopup('ptConfirmAction', 0, -100, 500, 70, true, function () { clearTimeout(1000); });
		popConfirm.centerMe(mainPop.getMainDiv());
		var m = '<DIV style="height:50px;"><br><TABLE align=center cellpadding=0 cellspacing=0 width=100% class="ptTab">';
		m += '<tr><TD align=center><INPUT id=ptConfirm type=submit value="'+uW.g_js_strings.changeview_court_content.invitealli+'" \>&nbsp;<INPUT id=ptCancel type=submit value="'+uW.g_js_strings.commonstr.cancel+'" \></td></tr></table></div>';
		popConfirm.getMainDiv().innerHTML = m;
		ResetFrameSize('ptConfirmAction',70,500);
		popConfirm.getTopDiv().innerHTML = '<DIV align=center><b>'+tx('Confirm Alliance Invite')+'?</b></div>';
		popConfirm.show(true);
		ById('ptConfirm').addEventListener('click', function () {
			popConfirm.show(false);
			popConfirm.onClose();
			popConfirm.destroy();
			popConfirm = null;
			span.onclick = '';
			span.innerHTML = "Sending ...";
			t.invitePlayer (uid, function (r) {t.gotInviteResult(r, span)});
		}, false);
		ById('ptCancel').addEventListener('click', function () {
			popConfirm.show(false);
			popConfirm.onClose();
			popConfirm.destroy();
			popConfirm = null;
		}, false);
	},

	invitePlayer : function (uid, notify){
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.type = 'userId';
		params.friendId = uid;
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/allianceSendInviteToFriends.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) { notify (rslt); },
			onFailure: function () { notify ({errorMsg:'AJAX error'}); },
		});
	},

	gotInviteResult : function (rslt, span){
		var t = Tabs.Player;
		if (rslt.ok) {
			m = '<span style="color:black">Invite Sent!</span>';
		}
		else {
			m = '<span style="color:black">Send Invite Failed!</span>';
		}
		span.innerHTML = m;
	},

	setDiplomacy : function (aid,dip,elem){ // 1 - friendly, 0 - neutral, 2 - hostile
		var t = Tabs.Player;
		var popConfirm = null;
		popConfirm = new CPopup('ptConfirmAction', 0, -100, 500, 70, true, function () { clearTimeout(1000); });
		var DiploText = uW.g_js_strings.commonstr.neutral.toUpperCase();
		if (dip==1) DiploText = uW.g_js_strings.commonstr.friendly.toUpperCase();
		if (dip==2) DiploText = uW.g_js_strings.commonstr.hostile.toUpperCase();
		popConfirm.centerMe(mainPop.getMainDiv());
		var m = '<DIV style="height:50px;"><br><TABLE align=center cellpadding=0 cellspacing=0 width=100% class=xtab>';
		m += '<tr><TD align=center><INPUT id=ptConfirm type=submit value="'+uW.g_js_strings.commonstr.set+' '+DiploText+'" \>&nbsp;<INPUT id=ptCancel type=submit value="'+uW.g_js_strings.commonstr.cancel+'" \></td></tr></table></div>';
		popConfirm.getMainDiv().innerHTML = m;
		ResetFrameSize('ptConfirmAction',70,500);
		popConfirm.getTopDiv().innerHTML = '<DIV align=center><b>'+tx('Confirm Set Diplomacy')+'?</b></div>';
		popConfirm.show(true);
		ById('ptConfirm').addEventListener('click', function () {
			popConfirm.show(false);
			popConfirm.onClose();
			popConfirm.destroy();
			popConfirm = null;
			var params = uW.Object.clone(uW.g_ajaxparams);
			params.allianceSelected = aid;
			params.diplomacyStatus = dip;
			new MyAjaxRequest(uW.g_ajaxpath + "ajax/allianceSetDiplomacies.php" + uW.g_ajaxsuffix, {
				method : "post",
				parameters : params,
				onSuccess : function(rslt) {
					if (rslt.ok) {
						t.PaintDiplomacy(aid,dip,elem);
					}
				}
			},true); // noretry
		}, false);
		ById('ptCancel').addEventListener('click', function () {
			popConfirm.show(false);
			popConfirm.onClose();
			popConfirm.destroy();
			popConfirm = null;
		}, false);
	},

	PaintDiplomacy : function (aid,dip,elem) {
		var t = Tabs.Player;
		if (ById(elem+aid)) {
			if (allianceleader) {
				t.friendbtn = '<INPUT style="color:#080;font-size:9px" onclick="ptSetDiplomacy('+aid+',1,\''+elem+'\');" type=submit value="F" />';
				t.neutralbtn = '<INPUT style="font-size:9px" onclick="ptSetDiplomacy('+aid+',0,\''+elem+'\');" type=submit value="N" />';
				t.hostilebtn = '<INPUT style="color:#800;font-size:9px" onclick="ptSetDiplomacy('+aid+',2,\''+elem+'\');" type=submit value="H" />';
			}

			if (dip == 1) {
				dip = '<span style="color:#080;"><b>'+uW.g_js_strings.commonstr.friendly+'</b></span>&nbsp;'+t.neutralbtn+'&nbsp;'+t.hostilebtn;
			}
			else {
				if (dip == 2) {
					dip = '<span style="color:#800;"><b>'+uW.g_js_strings.commonstr.hostile+'</b></span>&nbsp;'+t.friendbtn+'&nbsp;'+t.neutralbtn;
				}
				else {
					if (getMyAlliance()[0]!=aid) {
						dip = 'Neutral&nbsp;'+t.friendbtn+'&nbsp;'+t.hostilebtn;
					}
					else {
						dip = '<span style="color:#088;"><b>'+uW.g_js_strings.commonstr.yours+'</b></span>&nbsp;';
					}
				}
			}
			ById(elem+aid).innerHTML = dip;
		}
	},

	GetDataForMap: function (allianceId,allianceName) {
		var t = Tabs.Player;
		var params = uW.Object.clone(uW.g_ajaxparams);
		var Data = [];
		params.perPage = 100;
		params.allianceId = allianceId;
		params.type = "might";
		params.page = 1;
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/getUserLeaderboard.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			onSuccess: function (rslt) {
				var city = '';
				for (var i = 0; i < rslt.results.length; i++) {
					if (rslt.results[i]['userId'] != 0) {
						player = rslt.results[i]['cities'];
						if (player) {
							for (var ii = 0; ii < player.length; ii++) {
								Data.push({
									name: rslt.results[i]['displayName'],
									city: player[ii]['cityName'],
									X: player[ii]['xCoord'],
									Y: player[ii]['yCoord']
								});
							}
						}
					}
				}
				if (Data != []) t.PaintDataOnMap(Data,allianceId,allianceName);
			},
			onFailure: function () { notify({ errorMsg: 'AJAX error' }); },
		});
	},

	PaintDataOnMap: function (Data,allianceId,allianceName) {
		var t = Tabs.Player;
		var map = '<div class=divHeader align=center><a class=xlink onclick="ptGetMembers(' + allianceId + ')">'+allianceName+'</a></div><br><table align=center cellspacing=0 cellpadding=1><tr><td class=xtab align=left><DIV id=ptAlliProvMap style="height:' + provMapCoords.imgHeight + 'px; width:' + provMapCoords.imgWidth + 'px; background-repeat:no-repeat; background-image:url(\'' + URL_PROVINCE_MAP + '\')"></div></td><tr></table>';
		ById('allListOut').innerHTML = map;
		ById('allCitySelect').style.display = 'none';
		ById('allPlayerInfo').style.display = 'none';
		ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);

		var eMap = ById('ptAlliProvMap');
		for (var cc = 0; cc < Seed.cities.length; cc++) {
			var city = Cities.cities[cc];
			var Xplot = parseInt((provMapCoords.mapWidth * city.x) / 750);
			var Yplot = parseInt((provMapCoords.mapHeight * city.y) / 750);
			var cf = document.createElement('div');
			cf.style.backgroundImage = "url('"+URL_CASTLE_BUT+"')";
			cf.style.backgroundSize = "16px 16px"
			cf.style.opacity = '1.0';
			cf.style.position = 'relative';
			cf.style.display = 'block';
			cf.style.width = '16px';
			cf.style.height = '16px';
			cf.style.border = '1px solid #000';
			cf.style.color = 'black';
			cf.style.fontWeight = 'bold';
			cf.style.fontSize = '10px';
			cf.style.textAlign = 'center';
			cf.style.top = (Yplot + provMapCoords.topMargin - (cc * 16) - 8) + 'px';
			cf.style.left = (Xplot + provMapCoords.leftMargin - 8) + 'px';
			cf.title = city.name+' ('+city.x+','+city.y+')';
			eMap.appendChild(cf);
			cf.innerHTML = (cc + 1) + '';
		}
		for (var i = 0; i < Data.length; i++) {
			var x = parseInt(Data[i]['X']);
			var y = parseInt(Data[i]['Y']);
			var name = Data[i]['name'];
			var city = Data[i]['city'];
			var xplot = parseInt((provMapCoords.mapWidth * x) / 750);
			var yplot = parseInt((provMapCoords.mapHeight * y) / 750);
			var ce = document.createElement('div');
			ce.style.background = 'red';
			ce.style.opacity = '1.0';
			ce.style.position = 'relative';
			ce.style.display = 'block';
			ce.style.width = '4px';
			ce.style.height = '4px';
			ce.style.top = (yplot + provMapCoords.topMargin - (4 * i) - ((Seed.cities.length) * 18)) + 'px';
			ce.style.left = (xplot + provMapCoords.leftMargin - 2) + 'px';
			ce.title = name+ '\n'+city+' ('+x+','+y+')';
			ce.innerHTML = '<a onclick="btGotoMap('+x+','+y+')">&nbsp;</a>';
			eMap.appendChild(ce);
		}
		if (Seed.allianceHQ && allianceId==getMyAlliance()[0]) {
			PlotAllianceHQ(eMap,Data);
		}
	},

	ViewChamps: function (uid,name,calledfrom) {
		if (uW.isNewServer()) { return; }
		var t = Tabs.Player;
		var params = uW.Object.clone(uW.g_ajaxparams);
		params.action = 'getEquipped';
		params.playerId = uid;
		new MyAjaxRequest(uW.g_ajaxpath + "ajax/otherChampionHall.php" + uW.g_ajaxsuffix, {
			method: "post",
			parameters: params,
			loading: true,
			onSuccess: function (rslt) {
				if (t.popChamp) {
					t.popChamp.show(false);
					if (t.popChamp.onClose) t.popChamp.onClose();
					t.popChamp.destroy();
					t.popChamp = null;
				}
				t.popChamp = new CPopup('btChamp', t.champpos.x, t.champpos.y, 100, 100, true, function () { t.champpos = t.popChamp.getLocation(); clearTimeout(1000); });
				if ((t.champpos.x == -999) && (t.champpos.y == -999)) {
					if (calledfrom) {
						t.popChamp.centerMe(calledfrom);
					}
					else {
						t.popChamp.centerMe(mainPop.getMainDiv());
					}
				}
				var m = '<div>';
				if (rslt.ok) {
					m += '<div align=center><table width=99% cellpadding=1 cellspacing=1><tr>';
					for (var c in rslt.champion.champions) {
						var champ = rslt.champion.champions[c];
						if (champ.name && champ.status) {
							if (champ.status != '10') {champstat = '<span class=xtab style="color:#080">'+uW.g_js_strings.commonstr.status+':&nbsp;'+uW.g_js_strings.commonstr.defending+'</span>';}
							else { champstat = '<span class=xtab style="color:#f00">'+uW.g_js_strings.commonstr.status+':&nbsp;'+uW.g_js_strings.commonstr.marching+'</span>';}
							if (champ.assignedCity && champ.assignedCity!=0) {
								for (var cities in rslt.cities) {
									if (champ.assignedCity==rslt.cities[cities][0]) {
										champcity = uW.g_js_strings.commonstr.city+':&nbsp;'+rslt.cities[cities][1];
										break;
									}
								}
							}
							else {
								champcity = '<i>'+tx('No City Assigned')+'</i>';
								champstat = '&nbsp;';
							};
							m += '<td align=center style="vertical-align:top;" class=xtab><table style="vertical-align:top;border:1px solid black;"><tr><td colspan=2 style="background-color:'+Options.Colors.Panel+';"><table style="vertical-align:top;background-color:'+Options.Colors.Panel+';"><tr><td rowspan=3 class=xtab><img src="'+IMGURL+'champion_hall/championPort_0'+champ.avatarId+'_50x50.jpg"></td><td class=xtab><b>Name:&nbsp;'+champ.name+'</b></td></tr><tr><td class=xtab>'+champcity+'</td></tr><tr><td class=xtab>'+champstat+'</td></tr></table></td></tr>';
							if (uW.btFetchChampion) {
								m += '<tr><td class=xtab align=center colspan=2>'+strButton8(tx('View Cards'),'onClick=btFetchChampion('+uid+',"'+name+'",'+champ.championId+',"'+champ.name+'")')+'</td></tr>';
							}
							// equipped items

							var CHAMP_DATA = BuildChampData (rslt.champion.equipment,champ.championId);
							var equippedchampstats = CHAMP_DATA.equippedchampstats;
							var equippedtroopstats = CHAMP_DATA.equippedtroopstats;
							var equippedbossstats = CHAMP_DATA.equippedbosstats;
							var SteelHoofCount = CHAMP_DATA.SteelHoofCount;
							var LightBringerCount = CHAMP_DATA.LightBringerCount;
							var DragonScaleCount = CHAMP_DATA.DragonScaleCount;
							var TestCount = CHAMP_DATA.TestCount;
							var WildHideCount = CHAMP_DATA.WildHideCount;
							var VespersCount = CHAMP_DATA.VespersCount;
							var SilverCount = CHAMP_DATA.SilverCount;
							var might = CHAMP_DATA.might;
							var TroopBonus = 0;

							m += '<tr><td class=xtab colspan=2><b>Might:&nbsp;</b>'+addCommas(might)+'</td></tr>';
							m += '<tr><td colspan=2 class=xtab><b>'+uW.g_js_strings.report_view.champion_stats+'</b></td></tr>';
							for (var k in equippedchampstats) {
								str = uW.g_js_strings.effects['name_'+k];
								var chEffect = getChampCappedValue(k,equippedchampstats[k]);
								if (k>= 300) {
									if (k==314) { str = '<span style="color:#808;">'+tx('Add. Defend Bonus')+'</span>'; }
									else {
										str = '<span style="color:#808;">'+tx('Inc. Bonus')+' '+str.split(" "+tx("equipment"))[0]+'</span>';
//										TroopBonus += chEffect;
									}
									var champvalue = '<span style="color:#808;">'+((chEffect*100).toFixed(2))+"%</span>";
								}
								else {
									var champvalue = +(chEffect.toFixed(2));
								}
								if (str && str!= "") { m += '<tr><td class=xtab>'+str+':</td><td class=xtab>'+champvalue+'</td></tr>'; }
							}
							if (VespersCount >= 4) {
								m+="<tr><td class=xtab>"+uW.g_js_strings.champ.vespers+": "+uW.g_js_strings.champ.damage+"</td><td class=xtab>"+CM.CHAMPION.getVespersDamageSetBonus().replace('+','')+"</td></tr>";
							}
							m += '<tr><td colspan=2 class=xtab><b>'+uW.g_js_strings.report_view.troop_stats+'</b></td></tr>';
							var gottroops = false;
							if ((SteelHoofCount >= 4 && LightBringerCount >= 5) || (DragonScaleCount >= 6 && LightBringerCount >= 5)) {
								gottroops = true;
								if (SteelHoofCount >= 4 && LightBringerCount >= 5) {
									m+='<tr><td class=xtab><span style="color:#880;">'+uW.g_js_strings.champ.doubleBonus+': '+uW.g_js_strings.champ.attackRange+'</span></td><td class=xtab><span style="color:#080;">'+CM.CHAMPION.getSteelhoofsRangeSetBonus().replace('+','')+'</span></td></tr>';
								}
								else {
									m+='<tr><td class=xtab><span style="color:#880;">'+uW.g_js_strings.champ.doubleBonus+': '+uW.g_js_strings.champ.attackLife+'</span></td><td class=xtab><span style="color:#080;">'+CM.CHAMPION.getSteelhoofsRangeSetBonus().replace('+','')+'</span></td></tr>';
								}
							} else {
								if (SteelHoofCount >= 4 || DragonScaleCount >= 6) {
									gottroops = true;
									if (SteelHoofCount >= 4) {
										m+='<tr><td class=xtab><span style="color:#080;">'+uW.g_js_strings.champ.steelhoofsBonus+': '+uW.g_js_strings.champ.range+'</span></td><td class=xtab><span style="color:#080;">'+CM.CHAMPION.getSteelhoofsRangeSetBonus().replace('+','')+'</span></td></tr>';
									}
									else {
										m+='<tr><td class=xtab><span style="color:#080;">'+uW.g_js_strings.champ.dragonscalesBonus+': '+uW.g_js_strings.champ.life+'</span></td><td class=xtab><span style="color:#080;">'+CM.CHAMPION.getDragonscaleLifeSetBonus().replace('+','')+'</span></td></tr>';
									}
								} else {
									if (LightBringerCount >= 5) {
										gottroops = true;
										m+='<tr><td class=xtab><span style="color:#800;">'+uW.g_js_strings.champ.lightbringersBonus+': '+uW.g_js_strings.champ.attack+'</span></td><td class=xtab><span style="color:#080;">'+CM.CHAMPION.getLightbringersRangeSetBonus().replace('+','')+'</span></td></tr>';
									}
									else {
										if (WildHideCount >= 5) {
											gottroops = true;
											m+='<tr><td class=xtab><span style="color:#800;">'+uW.g_js_strings.champ.wildhideBonus+': '+uW.g_js_strings.champ.attack+'</span></td><td class=xtab><span style="color:#080;">'+CM.CHAMPION.getWildhideAttackSetBonus().replace('+','')+'</span></td></tr>';
										}
										else {
											if (SilverCount >= 5) {
												gottroops = true;
												m+='<tr><td class=xtab><span style="color:#800;">'+uW.g_js_strings.champ.silver+': '+uW.g_js_strings.champ.silverKnightBonus+'</span></td><td class=xtab><span style="color:#080;">'+CM.CHAMPION.getSilverknightSpeedDefenceSetBonus().replace('+','')+'</span></td></tr>';
											}
										}
									}
								}
							}
							for (var k in equippedtroopstats) {
								var TRStyles = getTREffectStyle(k);
								gottroops=true;
								if (str && str!= "") {
									str = uW.g_js_strings.effects['name_'+k];
									var chEffect = getChampCappedValue(k,equippedtroopstats[k]);
									m += '<tr><td class=xtab>'+TRStyles.LineStyle+str+':'+TRStyles.EndStyle+'</td><td class=xtab>'+TRStyles.LineStyle+(Math.round((chEffect+(chEffect*TroopBonus))*100)/100)+TRStyles.EndStyle+'</td></tr>';
								}
							}
							if (!gottroops) {
								m += '<tr><td colspan=2 class=xtab><i>'+tx('No Troop Stats')+'</i></td></tr>';
							}
							for (var k in equippedbossstats) {
								var gotboss = false;
								var bosseffects = '';
								for (var kk in equippedbossstats[k]) {
									gotboss = true;
									str = uW.g_js_strings.effects['name_'+kk];
									if (str && str!= "") {
										var chEffect = getChampCappedValue(kk,equippedbossstats[k][kk]);
										var champvalue = '<span style="color:'+Options.Colors.PanelText+';">'+(chEffect.toFixed(2))+"%</span>";
										bosseffects+="<tr><td class=xtab>"+str+"</td><td class=xtab>"+champvalue+"</td></tr>";
									}
								}
								if (gotboss) { m += "<tr><td colspan=2 class=xtab><b>"+uW.itemlist['i'+k].name+' '+uW.g_js_strings.commonstr.stats+"</b></td></tr>"+bosseffects; }
							}
							m += '</table></td>';
						}
					}
					m += '</tr></table></div><div align=center>'+strButton20(tx('Refresh'), 'id=ptchamprefresh')+'</div>';
				}
				else {
					if (rslt.msg) {
						m += '<div align=center><br>'+rslt.msg+'<br></div>';
					}
					else {
						m += '<div align=center><br>'+tx('Unknown error trying to display champion hall')+'</div>';
					}
					m += '<div align=center><br>'+strButton20(tx('Refresh'), 'id=ptchamprefresh')+'<br></div>';
				}
				m += '</div>';
				t.popChamp.getMainDiv().innerHTML = m;

				ById('ptchamprefresh').addEventListener('click',function() {t.ViewChamps(uid,name);}, false);

				t.popChamp.getTopDiv().innerHTML = '<DIV style="white-space:nowrap;" align=center>&nbsp;&nbsp;<B>'+uW.g_js_strings.champ.title_pos.replace("%1$s", name)+'</B>&nbsp;&nbsp;</DIV>';
				t.popChamp.show(true);
				ResetFrameSize('btChamp',100,100);
			},
		},true);
	},

	DisplayMessage : function(msg) {
		ById('allListOut').innerHTML = '<BR><BR><CENTER>'+msg+'</center>';
		ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);
	},

	show : function (init){
		var t = Tabs.Player;
		var DispCityId = uW.currentcityid;
		if (init) { DispCityId = InitialCityId; }
		if (t.ModelCityId!=DispCityId) {
			t.ModelCity.selectBut(Cities.byID[DispCityId].idx);
		}
		AreYouALeader();
	},
}
