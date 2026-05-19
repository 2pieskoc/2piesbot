// @tabversion 20260519
// 2pies Prime by Darkness - Revive Tab Addon
// Use as an Additional Tab in 2pies Prime by Darkness 5.0.2+.
// Restores the old AutoRevive / wounded troop revive tab as a separate addon so the main GreasyFork script stays under size limit.

/** Revive Tab **/

Tabs.Revive = {
tabLabel: 'Revive',
tabOrder: 2070,
tabColor : 'brown',
myDiv: null,
timer: null,
LoopCounter: 0,
intervalSecs : 5,
autodelay : 0,
citydelay: {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0},
loopaction : false,
revivespeed : 0,
revivecost : 0,
totgold : 0,
ModelCity: null,
ModelCityId: 0,
unitsarr : [],
troopTotal: {},
LastWounded : 'x',
noApothecary : [],
Squire:0,
Knight:0,
Guinevere:0,
Morgana:0,
Arthur:0,
Merlin:0,
Divine:0,
Epic:0,
Legendary:0,
Spectral:0,
Demonic:0,
Cupids:0,
Serpent:0,
Darkmoon:0,
ItemList : [1, 2, 3, 4, 5, 6, 7, 8, 10],
ItemTrans : ["SH","KH","GH","MH","AH","RH","DH","EH","LH"],
ExtraItemList : [80, 81, 82, 83, 84],
ExtraItemTrans : ["PH","NH","CU","SP","DM"],
ExtraHGLimit : [2160000,4320000,12096000,13824000,25920000],
CannotReviveUnit : [27],
Options: {
Running: false,
ThroneCheck: false,
ReviveSpeed: 0,
MinGold : 5000,
Enabled : {1:true,2:true,3:true,4:true,5:true,6:true,7:true,8:true},
HealArray : {1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[]},
BatchMin : 0,
SelectBatchMax : true,
BatchMax : 10000,
UseLH : false,
UseEH : false,
UseDH : false,
UseRH : false,
UseAH : false,
UseMH : false,
UseGH : false,
UseKH : false,
UseSH : false,
UsePH : false,
UseNH : false,
UseCU : false,
UseSP : false,
UseDM : false,
UseOverride : false,
OverrideItem : 0,
OverrideHours : 0,
OverrideMinutes : 1,
Toggle : false,
},
init: function (div) {
var t = Tabs.Revive;
t.myDiv = div;
t.unitsarr = [];
for (var ui in CM.UNIT_TYPES){
var i = CM.UNIT_TYPES[ui];
if (t.CannotReviveUnit.indexOf(parseInt(i)) == -1) {
t.unitsarr.push(i);
}
}
if (!Options.ReviveOptions) {
Options.ReviveOptions = t.Options;
}
else {
for (var y in t.Options) {
if (!Options.ReviveOptions.hasOwnProperty(y)) {
Options.ReviveOptions[y] = t.Options[y];
}
}
}
if (!Options.ReviveOptions.Enabled) { Options.ReviveOptions.Enabled = {}; }
if (!Options.ReviveOptions.HealArray) { Options.ReviveOptions.HealArray = {}; }
for (var rcid in Cities.byID) {
var ridx = Cities.byID[rcid].idx + 1;
if (!Options.ReviveOptions.Enabled.hasOwnProperty(ridx)) { Options.ReviveOptions.Enabled[ridx] = true; }
if (!Options.ReviveOptions.HealArray[ridx]) { Options.ReviveOptions.HealArray[ridx] = []; }
if (Seed.queue_revive && !Seed.queue_revive['city'+rcid]) { Seed.queue_revive['city'+rcid] = []; }
if (Seed.queue_revive2 && !Seed.queue_revive2['city'+rcid]) { Seed.queue_revive2['city'+rcid] = []; }
if (Seed.woundedUnits && !Seed.woundedUnits['city'+rcid]) { Seed.woundedUnits['city'+rcid] = {}; }
}
uWExportFunction('speedupRevive', Tabs.Revive.speedupRevive);
uWExportFunction('cancelRevive', Tabs.Revive.cancelRevive);
uWExportFunction('btRevQueueDeleteAll', Tabs.Revive.deleteRevQueueAll);
uWExportFunction('btRevQueueDelete', Tabs.Revive.deleteRevQueue);
uWExportFunction('btRevQueueUp', Tabs.Revive.RevQueueUp);
uWExportFunction('btRevQueueDn', Tabs.Revive.RevQueueDn);
var ReviveHourGlassName = {};
for (var h=0;h<HourGlasses.length;h++) { ReviveHourGlassName[HourGlasses[h]] = uW.itemlist['i'+HourGlasses[h]].name; }
for (var h=0;h<t.ExtraItemList.length;h++) { ReviveHourGlassName[t.ExtraItemList[h]] = uW.itemlist['i'+t.ExtraItemList[h]].name; }
for (var cid in Cities.byID){
var x = Cities.byID[cid].idx+1;
t.noApothecary[x] = (getCityBuilding(cid, 21).count>0)?false: true;
if(t.noApothecary[x]) { t.noApothecary[x] = (getCityBuilding(cid, 23).count>0)?false: true; }
}
if (Options.ReviveOptions.Toggle) AddSubTabLink('AutoRevive',t.toggleAutoReviveState, 'ReviveToggleTab');
SetToggleButtonState('Revive',Options.ReviveOptions.Running,'Revive');
var m = '<DIV class=divHeader align=center>'+tx('AUTOMATED WOUNDED TROOP REVIVE')+'</div>';
m += '<div align="center">';
m += '<table width=100% class=xtab><tr><td width=30%><INPUT id=btReviveToggle type=checkbox '+ (Options.ReviveOptions.Toggle?'CHECKED ':'') +'/>&nbsp;'+tx("Add toggle button to main screen header")+'</td><td colspan=2 align=center><INPUT id=btAutoReviveState type=submit value="'+tx("AutoRevive")+' = '+ (Options.ReviveOptions.Running?'ON':'OFF')+'"></td><td width=30% align=right>'+tx('Current Revive Speed')+':&nbsp;<span id=btReviveCurrTR></span>&nbsp;&nbsp;</td></tr></table>';
m += '<table width=100% class=xtab><tr><td colspan=2 align=left><INPUT id=btReviveTR type=checkbox '+(Options.ReviveOptions.ThroneCheck?'CHECKED':'')+'> '+tx('Only revive when revive speed is at least')+' <INPUT id=btReviveTRSpeed type=text size=3 maxlength=4 value="'+Options.ReviveOptions.ReviveSpeed+'">&nbsp;%</td>';
m += '<td colspan=2 align=right>'+tx('Current Revive Cost')+':&nbsp;<span id=btReviveCostTR></span>&nbsp;&nbsp;</td></td></tr>';
m += '<tr><td colspan=2 align=left>&nbsp;</td><td colspan=2 align=right>'+tx('Minimum Gold')+':&nbsp;<input type=text size=9 maxlength=10 id=btReviveMinGold value="'+Options.ReviveOptions.MinGold+'">&nbsp;&nbsp;</td></tr>';
m += '</table>';
m += '<br><DIV id=btReviveOverviewDiv style="width:'+GlobalOptions.btWinSize.x+'px;overflow-x:auto;">';
m += '<TABLE width=100% class=xtab cellpadding=1 cellspacing=0 align=center style="font-size:'+Options.OverviewOptions.OverviewFontSize+'px;"><TR valign=bottom><td width=20>&nbsp;</td><td width=100>&nbsp;</td>';
for (var i = 1; i <= Cities.numCities; i++) {
m += '<TD style="font-size:11px;" align=center width=100><span id="btReviveCity_'+i+'"><B>'+Cities.cities[i-1].name.substring(0, 12)+'</b></span></td>';
}
m += '<td>&nbsp;</td>';
m += '</tr><TR align=right class="oddRow"><TD colspan=2 align=right><b>'+tx('Active')+'&nbsp;</b></td>';
for (var i = 1; i <= Cities.numCities; i++) {
m += '<TD><div class=xtabBorder align=center><INPUT class='+i+' id="btReviveAutoCity_'+i+'" type=checkbox '+(Options.ReviveOptions.Enabled[i]?'CHECKED':'')+'></div></td>';
}
m += '</tr><TR align=right class="evenRow"><TD colspan=2 align=right style="padding-top:2px;vertical-align:top;padding-left:0px;"><b>'+tx('Facilities')+'&nbsp;</b></td>';
for (var i = 1; i <= Cities.numCities; i++) {
m += '<TD><div align=center class=xtabBorder style="height:40px;"><span id="btReviveApothecaryCity_'+i+'">&nbsp;</span></div></td>';
}
m += '</tr><TR align=right class="oddRow"><TD colspan=2 align=right style="padding-top:2px;vertical-align:top;padding-left:0px;"><b>'+tx('Arcana Bonus')+'&nbsp;</b></td>';
for (var i = 1; i <= Cities.numCities; i++) {
m += '<TD><div align=center class=xtabBorder><span id="btReviveArcanaCity_'+i+'">&nbsp;</span></div></td>';
}
m += '</tr><TR align=right class="evenRow"><TD colspan=2 align=right style="padding-top:2px;vertical-align:top;padding-left:0px;"><b>'+tx('Queue 1')+'&nbsp;</b></td>';
for (var i = 1; i <= Cities.numCities; i++) {
m += '<TD><div align=center class=xtabBorder style="height:100px;"><span id="btReviveActivityCity1_'+i+'">&nbsp;</span></div></td>';
}
m += '</tr><TR align=right class="oddRow"><TD colspan=2 align=right style="padding-top:2px;vertical-align:top;padding-left:0px;"><b>'+tx('Queue 2')+'&nbsp;</b></td>';
for (var i = 1; i <= Cities.numCities; i++) {
m += '<TD><div align=center class=xtabBorder style="height:100px;"><span id="btReviveActivityCity2_'+i+'">&nbsp;</span></div></td>';
}
m += '</tr><TR align=right class="evenRow"><TD style="padding-left: 0px;"><img height=18 src="'+GoldImage+'" title="'+uW.g_js_strings.commonstr.gold+'"></td><td><div id=btTotGold class="totalCell xtabBorder">&nbsp;</div></td>';
for (var i = 1; i <= Cities.numCities; i++) {
m += '<TD><div align=center class=xtabBorder><span id="btReviveGoldCity_'+i+'">&nbsp;</span></div></td>';
}
m += '</tr></table></div></div>';
m += '<div class="divHeader" align="center">'+tx('USE AUTO-SPEEDUPS')+'</div>';
m += '<table width=100% class=xtab><tr><td><div align=center>';
var ExtraHourGlassHint = ['Usage Condition: 25d+', 'Usage Condition: 50d+', 'Usage Condition: 140d+', 'Usage Condition: 160d+', 'Usage Condition: 300d+'];
var Boosts = '<table width=95% class=xtab align=center cellpadding=0 cellspacing=0><tr style="vertical-align:top;">';
for (var i = 0; i < t.ItemList.length; i++) {
Boosts += '<td width=30 rowspan=2><img height=28 src="'+IMGURL+'items/70/'+t.ItemList[i]+'.jpg" title="'+itemTitle(t.ItemList[i],true)+'\n'+tx(HourGlassHint[i])+'" /></td><td>(<span id=pbreviveUse'+t.ItemTrans[i]+'Label>' + parseIntNan((uW.ksoItems[t.ItemList[i]] && uW.ksoItems[t.ItemList[i]].count) || 0) + '</span>)</td>';
}
Boosts += '<td width=70 rowspan=2 align=right><INPUT id=pbReviveHelp type=submit value="'+tx('HELP')+'!"></td>';
Boosts += '</tr><tr style="vertical-align:top;">';
for (var i = 0; i < t.ItemList.length; i++) {
Boosts += '<td><input type=checkbox id="pbrevive'+t.ItemTrans[i]+'" '+(Options.ReviveOptions["Use"+t.ItemTrans[i]]?"CHECKED" : "")+'></td>';
}
Boosts += '</tr><tr style="vertical-align:top;">';
for (var i = 0; i < t.ExtraItemList.length; i++) {
Boosts += '<td width=30 rowspan=2><img height=28 src="'+IMGURL+'items/70/'+t.ExtraItemList[i]+'.jpg" title="'+itemTitle(t.ExtraItemList[i],true)+'\n'+tx(ExtraHourGlassHint[i])+'" /></td><td>(<span id=pbreviveUse'+t.ExtraItemTrans[i]+'Label>' + parseIntNan((uW.ksoItems[t.ExtraItemList[i]] && uW.ksoItems[t.ExtraItemList[i]].count) || 0) + '</span>)</td>';
}
Boosts += '</tr><tr style="vertical-align:top;">';
for (var i = 0; i < t.ExtraItemList.length; i++) {
Boosts += '<td><input type=checkbox id="pbrevive'+t.ExtraItemTrans[i]+'" '+(Options.ReviveOptions["Use"+t.ExtraItemTrans[i]]?"CHECKED" : "")+'></td>';
}
Boosts += '</tr></table></td></tr>';
Boosts += '<tr><td><div align=center><table width=95% class=xtab align=center cellpadding=0 cellspacing=0><tr><td><input type=checkbox id=pbreviveOV '+(Options.ReviveOptions.UseOverride?'CHECKED':'')+' >'+tx('Override above by always using')+' '+htmlSelector(ReviveHourGlassName,Options.ReviveOptions.OverrideItem, 'id=pbreviveOVItem') + ' '+tx('when more than')+' ';
Boosts += '<INPUT style="width: 30px;text-align:right;" id="pbreviveOVHours" type=text maxlength=4 value="'+Options.ReviveOptions.OverrideHours+'">&nbsp;'+uW.g_js_strings.timestr.timehr+'&nbsp;<INPUT style="width: 30px;text-align:right;" id="pbreviveOVMinutes" type=text maxlength=4 value="'+Options.ReviveOptions.OverrideMinutes+'">&nbsp;'+uW.g_js_strings.timestr.timemin+' '+tx('remaining')+'.</td></tr></table></div></td></tr>';
m += Boosts+'</table></div>';
m += '<a id=btReviveQueueLink class=divLink><div class="divHeader" align="left"><img id=btReviveQueueArrow height="10" src="'+RightArrow+'">&nbsp;'+tx('REVIVE TROOPS')+'</div></a>';
m += '<div id=btReviveQueue style="height:210px; max-height:210px; overflow-y:auto;" class=divHide>';
m += '<TABLE align=center cellpadding=0 cellspacing=0 class=xtab width=100% style="padding-right:0px;"><TR><TD valign=top width=49%>';
m += '<br>';
m += '<TABLE class=xtab><tr><td align=right>'+uW.g_js_strings.commonstr.city+':&nbsp;</td><td colspan=2><DIV style="text-align:center; margin-bottom:5px;"><span id=pbrevivecity></span></div></td></tr><tr><TD align=right>'+tx(uW.g_js_strings.openCastle.trooptype)+':&nbsp;</td><TD colspan=2>';
m += '<SELECT id=btRevType><option value=0>-- '+uW.g_js_strings.commonstr.select+' --</option>';
for (var ui in CM.UNIT_TYPES) {
var u = CM.UNIT_TYPES[ui];
if (t.CannotReviveUnit.indexOf(parseInt(u)) == -1) {
m += '<option value='+u+'>'+uW.unitcost["unt"+u][0]+'</option>';
}
}
m += '</select>&nbsp;'+strButton8(tx('Add ALL Wounded'),'id=btRevAddAllWounded')+'</td></tr><tr><td align=right>'+tx('Total Wounded')+':&nbsp;</td><td colspan=2><span id=btRevWounded>&nbsp;</span></td></tr>';
m += '<tr><td align=right><img style="vertical-align:middle;" height=18 src="'+GoldImage+'" title="'+uW.g_js_strings.commonstr.gold+'"><span style="vertical-align:middle;">&nbsp;'+tx('Total Cost')+':&nbsp;</span></td><td colspan=2><span id=btRevCost>&nbsp;</span></td></tr>';
m += '<TR><td>&nbsp;</td><TD><b>'+tx('Batch Size')+':-&nbsp;</b></td><td id=btRevEstTime>&nbsp;</td></tr><tr><td>&nbsp;</td><td align=left>'+tx('Min')+':&nbsp;<INPUT id=btRevBatchMin type=text size=13 maxlength=11 value="'+ Options.ReviveOptions.BatchMin+'"\></td>';
m += '<td align=right><INPUT type=checkbox id=btRevSelBatchMax '+(Options.ReviveOptions.SelectBatchMax?'CHECKED':'')+'>&nbsp;'+tx("Max")+':&nbsp;<INPUT id=btRevBatchMax type=text size=13 maxlength=11 value="'+ Options.ReviveOptions.BatchMax+'"\></td></tr>';
m += '<tr><td>&nbsp;</td><td colspan=2><INPUT id=btRevButton type=button value="'+tx('Add to Queue')+'"\>&nbsp;<INPUT id=btRevNowButton type=button value="'+tx('Revive Now!')+'"\></td></tr></table>';
m += '</TD><TD valign=top width=49% style="padding-right:0px;"><TABLE class=xtab width=100% style="padding-right:0px;"><tr><td align=center style="padding-right:0px;"><div style="padding-right:0px;color: rgba(0,0,0,0.5);"><b>'+tx('REVIVE QUEUE')+'</b></div></td></tr>';
m += '<tr><td valign=top align=center id="btReviveCityQueue" style="padding-right:0px;">&nbsp;</td></tr>';
m += '</table>';
m += '</td></tr><tr><td colspan=2><div id=btRevMessages align=center>&nbsp;</div></td></tr></table></div>';
m += '<a id=btReviveWoundedLink class=divLink><div class="divHeader" align="left"><img id=btReviveWoundedArrow height="10" src="'+DownArrow+'">&nbsp;'+tx('WOUNDED TROOPS')+'</div></a>';
m += '<div id=btReviveWounded style="min-height:100px; max-height:400px; overflow-y:scroll;">';
m += '<br><DIV id=btReviveWoundedDiv style="width:'+GlobalOptions.btWinSize.x+'px;overflow-x:auto;">&nbsp;</div></div><br>';
div.innerHTML = m;
ById('btReviveQueueLink').addEventListener ('click', function () {ToggleMainDivDisplay("Revive",100,GlobalOptions.btWinSize.x,"btReviveQueue",false)}, false);
ById('btReviveWoundedLink').addEventListener ('click', function () {ToggleMainDivDisplay("Revive",100,GlobalOptions.btWinSize.x,"btReviveWounded",false)}, false);
t.ModelCity = new CdispCityPicker('pbrevive', ById('pbrevivecity'), true, t.clickCitySelect, null);
t.PaintWounded();
for (var i = 1; i <= Cities.numCities; i++) {
ById('btReviveAutoCity_'+i).addEventListener('click', function(e){
var citynum = e.target['className'];
Options.ReviveOptions.Enabled[citynum] = e.target.checked;
if (Options.ReviveOptions.Enabled[citynum]) {
t.citydelay[citynum] = 0;
t.timer = setTimeout(function () { t.doAutoLoop(Number(citynum));}, 0);
}
saveOptions();
}, false);
}
ToggleOption('ReviveOptions','btReviveToggle','Toggle');
ToggleOption('ReviveOptions','pbreviveSH','UseSH');
ToggleOption('ReviveOptions','pbreviveKH','UseKH');
ToggleOption('ReviveOptions','pbreviveGH','UseGH');
ToggleOption('ReviveOptions','pbreviveMH','UseMH');
ToggleOption('ReviveOptions','pbreviveAH','UseAH');
ToggleOption('ReviveOptions','pbreviveRH','UseRH');
ToggleOption('ReviveOptions','pbreviveDH','UseDH');
ToggleOption('ReviveOptions','pbreviveEH','UseEH');
ToggleOption('ReviveOptions','pbreviveLH','UseLH');
ToggleOption('ReviveOptions','pbrevivePH','UsePH');
ToggleOption('ReviveOptions','pbreviveNH','UseNH');
ToggleOption('ReviveOptions','pbreviveCU','UseCU');
ToggleOption('ReviveOptions','pbreviveSP','UseSP');
ToggleOption('ReviveOptions','pbreviveDM','UseDM');
ToggleOption('ReviveOptions','pbreviveOV','UseOverride');
ChangeIntegerOption('ReviveOptions','pbreviveOVItem','OverrideItem');
ChangeIntegerOption('ReviveOptions','pbreviveOVHours','OverrideHours');
ChangeIntegerOption('ReviveOptions','pbreviveOVMinutes','OverrideMinutes');
ById('pbReviveHelp').addEventListener ('click', t.helpPop, false);
ById('btAutoReviveState').addEventListener('click', function(){
t.toggleAutoReviveState(this);
}, false);
ToggleOption('ReviveOptions','btReviveTR','ThroneCheck');
ChangeIntegerOption('ReviveOptions','btReviveTRSpeed','ReviveSpeed');
ChangeIntegerOption('ReviveOptions','btReviveMinGold','MinGold');
ById('btRevType').addEventListener('change', t.PaintCityInfo, false);
ById('btRevAddAllWounded').addEventListener('click', t.AddAllWounded, false);
ById('btRevBatchMax').disabled=(!Options.ReviveOptions.SelectBatchMax);
ChangeIntegerOption('ReviveOptions','btRevBatchMin','BatchMin',0,Tabs.Revive.PaintCityInfo);
ChangeIntegerOption('ReviveOptions','btRevBatchMax','BatchMax',0,Tabs.Revive.PaintCityInfo);
ById('btRevSelBatchMax').addEventListener('change', function(e){
Options.ReviveOptions.SelectBatchMax = e.target.checked;
ById('btRevBatchMax').disabled = (!e.target.checked);
if (!e.target.checked) {
Options.ReviveOptions.BatchMax = "";
ById('btRevBatchMax').value = Options.ReviveOptions.BatchMax;
}
saveOptions();
t.PaintCityInfo();
}, false);
ById("btRevNowButton").addEventListener('click', function(){
if (!t.ModelCity || !t.ModelCity.city) { ById('btRevMessages').innerHTML = tx('No city selected'); return; }
t.Revive_Now(t.ModelCity.city.idx,ById('btRevType').value,parseIntNan(Options.ReviveOptions.BatchMin),parseIntNan(Options.ReviveOptions.BatchMax),Options.ReviveOptions.SelectBatchMax);
},false);
ById("btRevButton").addEventListener('click', function(){
if (!t.ModelCity || !t.ModelCity.city) { ById('btRevMessages').innerHTML = tx('No city selected'); return; }
t.Add_Revive(t.ModelCity.city.idx,ById('btRevType').value,parseIntNan(Options.ReviveOptions.BatchMin),parseIntNan(Options.ReviveOptions.BatchMax),Options.ReviveOptions.SelectBatchMax);
},false);
if (Options.ReviveOptions.Running) {
t.timer = setTimeout(function () { t.doAutoLoop(1,false);}, (25 * 1000));
}
},
toggleAutoReviveState: function(obj){
var t = Tabs.Revive;
obj = ById('btAutoReviveState');
if (Options.ReviveOptions.Running == true) {
Options.ReviveOptions.Running = false;
obj.value = tx("AutoRevive = OFF");
}
else {
Options.ReviveOptions.Running = true;
obj.value = tx("AutoRevive = ON");
t.citydelay = {1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0};
t.timer = setTimeout(function () { t.doAutoLoop(1,false);}, 0);
}
saveOptions();
SetToggleButtonState('Revive',Options.ReviveOptions.Running,'Revive');
t.PaintOverview();
},
show: function (init) {
var t = Tabs.Revive;
var DispCityId = uW.currentcityid;
if (init) { DispCityId = InitialCityId; }
if (t.ModelCityId!=DispCityId) {
t.ModelCity.selectBut(Cities.byID[DispCityId].idx);
}
t.PaintOverview();
t.PaintCityInfo();
},
helpPop : function (){
var t = Tabs.Revive;
var helpText = '<br>'+tx("Using Speedups for Revive");
helpText += '<p>'+tx('Speedups will be used in the following order if they are selected, and the required criteria is met')+' :-</p>';
helpText += '<TABLE class=xtab><TR><TD><b>'+uW.g_js_strings.commonstr.item+'</b></td><TD><b>'+uW.g_js_strings.commonstr.time+'</b></td><TD><b>'+tx('Criteria')+'</b></td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i84.name+'</td><TD>360 days</td><TD>'+tx('More than 300 days remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i83.name+'</td><TD>180 days</td><TD>'+tx('More than 160 days remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i82.name+'</td><TD>150 days</td><TD>'+tx('More than 140 days remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i81.name+'</td><TD>60 days</td><TD>'+tx('More than 50 days remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i80.name+'</td><TD>30 days</td><TD>'+tx('More than 25 days remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i10.name+'</td><TD>4 days</td><TD>'+tx('More than 3 days and 12 hours remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i8.name+'</td><TD>2.5 days</td><TD>'+tx('More than 48 hours remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i7.name+'</td><TD>24 hrs</td><TD>'+tx('More than 23 hours 30 minutes remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i6.name+'</td><TD>15 hrs</td><TD>'+tx('More than 14 hours 30 minutes remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i5.name+'</td><TD>8 hrs</td><TD>'+tx('More than 7 hours 30 minutes remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i4.name+'</td><TD>2.5 hrs</td><TD>'+tx('More than 2 hours remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i3.name+'</td><TD>1 hr</td><TD>'+tx('More than 45 minutes remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i2.name+'</td><TD>15 mins</td><TD>'+tx('More than 5 minutes remaining')+'</td></tr>';
helpText += '<TR><TD>'+uW.itemlist.i1.name+'</td><TD>1 min</td><TD>'+tx('More than 30 seconds remaining')+'</td></tr>';
helpText += '</table>';
helpText += '<p>'+tx('If the override box is ticked, then the override rule specified will take priority')+'.</p><br>';
var pop = new CPopup ('BotHelp', 0, 0, 500, 420, true);
pop.centerMe (mainPop.getMainDiv());
pop.getMainDiv().innerHTML = helpText;
pop.getTopDiv().innerHTML = '<CENTER><B>'+tx("2Pies Help")+': '+tx("Speedups")+'</b></center>';
pop.show (true);
},
EverySecond : function () {
var t = Tabs.Revive;
t.LoopCounter = t.LoopCounter + 1;
if (t.LoopCounter%2==0) { // refresh revive speed and overview display every 2 seconds
var reviveSpeedBonus = 0;
var reviveCostBonus = 0;
try { reviveSpeedBonus = equippedthronestats(97) + equippedthronestats(164); } catch (e1) {}
try { reviveCostBonus = equippedthronestats(98) - (uW.cm.ThroneController.getBoundedEffect(164) || 0); } catch (e2) {}
t.revivespeed = Math.floor(reviveSpeedBonus);
t.revivecost = Math.floor(reviveCostBonus);
try {
if (uW.cm && uW.cm.thronestats && uW.cm.thronestats.boosts && uW.cm.thronestats.boosts.ReviveCost) {
t.revivecost = Math.max(uW.cm.thronestats.boosts.ReviveCost.Min, t.revivecost);
}
} catch (e3) {}
if (tabManager.currentTab.name == 'Revive' && Options.btWinIsOpen){ t.PaintOverview(); }
}
},
clickCitySelect: function (city) {
var t = Tabs.Revive;
t.ModelCityId = city.id;
t.PaintCityInfo();
},
PaintOverview : function () {
var t = Tabs.Revive;
t.Squire = parseIntNan(Seed.items.i1);
t.Knight = parseIntNan(Seed.items.i2);
t.Guinevere = parseIntNan(Seed.items.i3);
t.Morgana = parseIntNan(Seed.items.i4);
t.Arthur = parseIntNan(Seed.items.i5);
t.Merlin = parseIntNan(Seed.items.i6);
t.Divine = parseIntNan(Seed.items.i7);
t.Epic = parseIntNan(Seed.items.i8);
t.Legendary = parseIntNan(Seed.items.i10);
t.Spectral = parseIntNan(Seed.items.i80);
t.Demonic = parseIntNan(Seed.items.i81);
t.Cupids = parseIntNan(Seed.items.i82);
t.Serpent = parseIntNan(Seed.items.i83);
t.Darkmoon = parseIntNan(Seed.items.i84);
ById('pbreviveUseSHLabel').innerHTML = t.Squire;
ById('pbreviveUseKHLabel').innerHTML = t.Knight;
ById('pbreviveUseGHLabel').innerHTML = t.Guinevere;
ById('pbreviveUseMHLabel').innerHTML = t.Morgana;
ById('pbreviveUseAHLabel').innerHTML = t.Arthur;
ById('pbreviveUseRHLabel').innerHTML = t.Merlin;
ById('pbreviveUseDHLabel').innerHTML = t.Divine;
ById('pbreviveUseEHLabel').innerHTML = t.Epic;
ById('pbreviveUseLHLabel').innerHTML = t.Legendary;
ById('pbreviveUsePHLabel').innerHTML = t.Spectral;
ById('pbreviveUseNHLabel').innerHTML = t.Demonic;
ById('pbreviveUseCULabel').innerHTML = t.Cupids;
ById('pbreviveUseSPLabel').innerHTML = t.Serpent;
ById('pbreviveUseDMLabel').innerHTML = t.Darkmoon;
t.PaintWounded();
t.totgold=0;
var now = unixTime();
var q;
for (var i = 0; i < Cities.numCities; i++) {
var citynum = i+1;
var cityId = Cities.cities[i].id;
var citygold = parseIntNan(Seed.citystats["city" + cityId]['gold'][0]);
t.totgold = t.totgold+citygold;
var span = '<span>';
if (citygold < Options.ReviveOptions.MinGold) { span = '<span class=boldRed>'; }
ById("btReviveGoldCity_"+citynum).innerHTML = span+addCommas(citygold)+'</span>';
var blvl = [];
var bname = '';
for (var bpos in Seed.buildings["city"+cityId]) {
var btype = parseInt(Seed.buildings["city"+cityId][bpos][0]);
if (btype == 21 || btype == 23) {
var bname = uW.buildingcost['bdg' + Seed.buildings["city"+cityId][bpos][0]][0];
blvl.push('Lv.' + Seed.buildings["city"+cityId][bpos][1]);
}
}
var str = '';
if (blvl.join(', ')=='') { str = '<SPAN class=boldRed><B>'+tx('No')+'<br>'+uW.buildingcost.bdg21[0]+'</b></span>'; }
else { str = bname + '<br />(' + blvl.join(', ') + ')'; }
if (Seed.cityData.city[cityId].isPrestigeCity) {
if (Seed.cityData.city[cityId].prestigeInfo.blessings.indexOf(106) != -1) {
str += '<br>'+uW.g_js_strings.blessingSystem.blessing_name_106;
}
}
ById('btReviveApothecaryCity_'+citynum).innerHTML = str;
var str = '';
if (ArcanaEnabled()) {
str = Dashboard.GetArcanaEffect(42002,(citynum-1))+'%';
}
ById('btReviveArcanaCity_'+citynum).innerHTML = str;
var q1 = Seed.queue_revive["city"+cityId];
var u = '';
if (q1 != null && q1.length > 0) {
u = q1[0];
str = '<table cellpadding=0 cellspacing=0 width=100% style="padding-right:0px;"><tr><td class=xtab align=center >'+addCommas(u[1])+'&nbsp;'+uW.unitcost["unt"+u[0]][0]+'<br />';
if (parseInt(u[3]) > now) {
str += '('+timestr(parseInt(u[3])-now)+')</td></tr>';
var Speedups = '';
Speedups += t.dspHG(cityId,u[0],1,1,t.Squire);
Speedups += t.dspHG(cityId,u[0],1,2,t.Knight);
Speedups += t.dspHG(cityId,u[0],1,3,t.Guinevere);
Speedups += t.dspHG(cityId,u[0],1,4,t.Morgana);
Speedups += t.dspHG(cityId,u[0],1,5,t.Arthur);
Speedups += '</tr><tr>';
Speedups += t.dspHG(cityId,u[0],1,6,t.Merlin);
Speedups += t.dspHG(cityId,u[0],1,7,t.Divine);
Speedups += t.dspHG(cityId,u[0],1,8,t.Epic);
Speedups += t.dspHG(cityId,u[0],1,10,t.Legendary);
Speedups += '</tr><tr>';
Speedups += t.dspHG(cityId,u[0],1,80,t.Spectral);
Speedups += t.dspHG(cityId,u[0],1,81,t.Demonic);
Speedups += t.dspHG(cityId,u[0],1,82,t.Cupids);
Speedups += t.dspHG(cityId,u[0],1,83,t.Serpent);
Speedups += t.dspHG(cityId,u[0],1,84,t.Darkmoon);
if (Speedups != "") Speedups = '<tr><td style="padding-right:0px;padding-bottom:2px;"><table align=left cellspacing=0 cellpadding=0><tr>' + Speedups + '</tr></table></td></tr>';
str = str+Speedups+'<tr><td class=xtab><table align=center cellspacing=0 cellpadding=0><tr><td class=xtab style="padding-right:0px;"><a class="inlineButton button14" onClick="cancelRevive('+cityId+',1)"><span>'+tx("Cancel")+'</span></a></td></tr></table>';
} else {
str += '(done)';
if (cityId != uW.currentcityid) {
Seed.units["city"+cityId]["unt"+u[0]] = parseInt(Seed.units["city"+cityId]["unt"+u[0]]) + parseInt(u[1]);
Seed.queue_revive["city"+cityId].splice(0,1);
}
}
str += '</td></tr></table>';
} else {
if (t.citydelay[citynum] > 0) { str = '<SPAN class=boldRed><B>'+tx('Busy')+'!</b></span>'; }
else {
if (Options.BuildOptions && Options.BuildOptions.AscensionReady && Options.BuildOptions.AscensionReady[citynum]) { str = '<SPAN>'+tx('Ascension')+'!</span>'; }
else { str = ''; }
}
}
ById('btReviveActivityCity1_'+citynum).innerHTML = str;
var q2 = Seed.queue_revive2["city"+cityId];
var u = '';
if (q2 != null && q2.length > 0) {
u = q2[0];
str = '<table cellpadding=0 cellspacing=0 width=100% style="padding-right:0px;"><tr><td class=xtab align=center >'+addCommas(u[1])+'&nbsp;'+uW.unitcost["unt"+u[0]][0]+'<br />';
if (parseInt(u[3]) > now) {
str += '(' + timestr(parseInt(u[3]) - now) + ')</td></tr>';
var Speedups = '';
Speedups += t.dspHG(cityId,u[0],2,1,t.Squire);
Speedups += t.dspHG(cityId,u[0],2,2,t.Knight);
Speedups += t.dspHG(cityId,u[0],2,3,t.Guinevere);
Speedups += t.dspHG(cityId,u[0],2,4,t.Morgana);
Speedups += t.dspHG(cityId,u[0],2,5,t.Arthur);
Speedups += '</tr><tr>';
Speedups += t.dspHG(cityId,u[0],2,6,t.Merlin);
Speedups += t.dspHG(cityId,u[0],2,7,t.Divine);
Speedups += t.dspHG(cityId,u[0],2,8,t.Epic);
Speedups += t.dspHG(cityId,u[0],2,10,t.Legendary);
Speedups += '</tr><tr>';
Speedups += t.dspHG(cityId,u[0],2,80,t.Spectral);
Speedups += t.dspHG(cityId,u[0],2,81,t.Demonic);
Speedups += t.dspHG(cityId,u[0],2,82,t.Cupids);
Speedups += t.dspHG(cityId,u[0],2,83,t.Serpent);
Speedups += t.dspHG(cityId,u[0],2,84,t.Darkmoon);
if (Speedups != "") Speedups = '<tr><td style="padding-right:0px;padding-bottom:2px;"><table align=left cellspacing=0 cellpadding=0><tr>' + Speedups + '</tr></table></td></tr>';
str = str+Speedups+'<tr><td class=xtab><table align=center cellspacing=0 cellpadding=0><tr><td class=xtab><a class="inlineButton button14" onClick="cancelRevive('+cityId+',2)"><span>'+tx("Cancel")+'</span></a></td></tr></table>';
} else {
str += '(done)';
if (cityId != uW.currentcityid) {
Seed.units["city"+cityId]["unt"+u[0]] = parseInt(Seed.units["city"+cityId]["unt"+u[0]]) + parseInt(u[1]);
Seed.queue_revive2["city"+cityId].splice(0,1);
}
}
str += '</td></tr></table>';
} else {
if (t.citydelay[citynum] > 0) { str = '<SPAN class=boldRed><B>'+tx('Busy')+'!</b></span>'; }
else {
if (Options.BuildOptions && Options.BuildOptions.AscensionReady && Options.BuildOptions.AscensionReady[citynum]) { str = '<SPAN>'+tx('Ascension')+'!</span>'; }
else { str = ''; }
}
}
ById('btReviveActivityCity2_'+citynum).innerHTML = str;
}
ById('btTotGold').innerHTML = addCommas(t.totgold);
var ts;
if (Options.ReviveOptions.ThroneCheck && (t.revivespeed < Number(Options.ReviveOptions.ReviveSpeed))) {
ts = '<span class=boldRed><b>'+t.revivespeed+'%</b></span>';
}
else { ts = t.revivespeed+'%'; }
ById("btReviveCurrTR").innerHTML = ts;
ById("btReviveCostTR").innerHTML = t.revivecost+'%';
},
dspHG : function (cityId, qitem, i, item, count) {
var t = Tabs.Revive;
var n = '';
if (count>0) {
n += '<td class=xtab style="padding-right:2px"><a onClick="speedupRevive('+cityId+','+item+','+qitem+','+i+')"><img height=18 class="btTop btFaint" src="'+IMGURL+'items/70/'+item+'.jpg" title="'+itemTitle(item)+'"></a></td>';
}
return n;
},
PaintCityInfo : function () {
var t = Tabs.Revive;
var cityId = t.ModelCityId;
if (cityId) {
if (!Cities.byID[cityId]) return;
var citynum = Cities.byID[cityId].idx+1;
var unitId = ById('btRevType').value;
ById('btRevType').options.length = 0;
var o = document.createElement("option");
o.text = "-- "+uW.g_js_strings.commonstr.select+" --"
o.value = 0;
ById("btRevType").options.add(o);
for (var ui in CM.UNIT_TYPES) {
var u = CM.UNIT_TYPES[ui];
if (t.CannotReviveUnit.indexOf(parseInt(u)) == -1 && parseIntNan(Seed.woundedUnits['city'+cityId]['unt'+u])>0) {
var o = document.createElement("option");
o.text = uW.unitcost["unt"+u][0];
o.value = u;
if (unitId==u) o.selected = true;
ById("btRevType").options.add(o);
}
}
ById('btRevWounded').innerHTML = '&nbsp;';
ById('btRevCost').innerHTML = '&nbsp;';
if (unitId!=0) {
var unitWounded = parseIntNan(Seed.woundedUnits['city'+cityId]['unt'+unitId]);
ById('btRevWounded').innerHTML = addCommas(unitWounded);
ById('btRevCost').innerHTML = addCommas(t.getRevivalCost(unitId,unitWounded));
if (Seed.woundedUnits['city'+cityId]['unt'+unitId] > parseIntNan(Options.ReviveOptions.BatchMax) && Options.ReviveOptions.SelectBatchMax){ var amt = parseIntNan(Options.ReviveOptions.BatchMax); }
else { var amt = parseIntNan(Seed.woundedUnits['city'+cityId]['unt'+unitId]); }
if (amt<parseIntNan(Options.ReviveOptions.BatchMin)) { amt=parseIntNan(Options.ReviveOptions.BatchMin); }
if (amt>0) { ById('btRevEstTime').innerHTML = tx('Estimated Time')+':&nbsp;'+timestr(t.getReviveTime(cityId,unitId, amt)); }
else { ById('btRevEstTime').innerHTML = '&nbsp;'; }
}
var m = '<DIV style="max-height:160px; height:160px; overflow-y:scroll"><table class=xtab cellpadding=0 cellspacing=0 width=100% style="padding-right:0px;"><tr>';
m += '<TH class=xtabHD align=left>&nbsp;</th><TH class=xtabHD align=left>'+tx(uW.g_js_strings.openCastle.trooptype)+'</th><TH class=xtabHD align=right>'+tx('Min')+'</th><TH class=xtabHD align=right>'+tx('Max')+'</th><TH class=xtabHD align=right>'+strButton14(tx('Clear'),'id=btClearLog onclick="btRevQueueDeleteAll(this,'+citynum+')"')+'</th></tr>';
var rownum = 0;
var gotqueue = false;
for (var i=0; i<Options.ReviveOptions.HealArray[citynum].length; i++){
gotqueue = true;
var style = (rownum++ % 2) ? ' class="evenRow"' : ' class="oddRow"';
var info = Options.ReviveOptions.HealArray[citynum][i];
m += '<tr '+style+'><td align=left><a title="move up" onclick="btRevQueueUp(this,'+i+','+citynum+')"><img class=flip style="height:10px;width:13px;" src="'+DownArrow+'"><br><a title="move down" onclick="btRevQueueDn(this,'+i+','+citynum+')"><img style="height:10px;width:13px;" src="'+DownArrow+'"></td><td align=left>'+uW.unitcost['unt'+info.troop][0]+'</td>';
var dispmax = "";
if (info.max_sel) dispmax = addCommas(info.max);
m += '<td align=right>'+addCommas(info.min)+'</td><td align=right>'+dispmax+'</td><td align=right>'+strButton8(uW.g_js_strings.commonstr.deletetx,'onclick="btRevQueueDelete(this,'+i+','+citynum+')"')+'</td></tr>';
}
if (!gotqueue) { m += '<tr><td colspan=5 align=center><br>'+tx('No wounded troops in revive queue')+'</td></tr>'; }
m += '</table></div>';
ById('btReviveCityQueue').innerHTML = m;
}
},
deleteRevQueueAll : function(obj,citynum) {
var t = Tabs.Revive;
Options.ReviveOptions.HealArray[citynum] = [];
saveOptions();
ById('btRevMessages').innerHTML = tx("City Queue deleted!");
t.PaintCityInfo();
},
deleteRevQueue : function(obj,index,citynum) {
var t = Tabs.Revive;
Options.ReviveOptions.HealArray[citynum].splice(index,1);
saveOptions();
ById('btRevMessages').innerHTML = tx("Queue entry deleted!");
t.PaintCityInfo();
},
RevQueueUp : function(obj,index,citynum) {
var t = Tabs.Revive;
if (index>0) {
Options.ReviveOptions.HealArray[citynum].splice(index-1, 0, Options.ReviveOptions.HealArray[citynum].splice(index, 1)[0]);
}
saveOptions();
t.PaintCityInfo();
},
RevQueueDn : function(obj,index,citynum) {
var t = Tabs.Revive;
if (index<Options.ReviveOptions.HealArray[citynum].length-1) {
Options.ReviveOptions.HealArray[citynum].splice(index+1, 0, Options.ReviveOptions.HealArray[citynum].splice(index, 1)[0]);
}
saveOptions();
t.PaintCityInfo();
},
getRevivalCost : function(unitId,num) {
var d = CM.WorldSettings.getSettingAsObject("APOTHECARY_COST") || {};
var baseCost = d[unitId] ? (+(d[unitId]["Cost"]) || 2000) : 2000;
var reviveCost = 0;
var reviveCost2 = 0;
try { reviveCost = CM.ThroneController.getBoundedEffect(98) || 0; } catch (e1) {}
try { reviveCost2 = -(CM.ThroneController.getBoundedEffect(164) || 0); } catch (e2) {}
var totalCostBonus = reviveCost + reviveCost2;
var hardCapCost = -50;
try {
if (uW.cm && uW.cm.thronestats && uW.cm.thronestats.boosts && uW.cm.thronestats.boosts.ReviveCost) {
hardCapCost = uW.cm.thronestats.boosts.ReviveCost.Min;
}
} catch (e3) {}
var appliedCostBonus = Math.max(hardCapCost, totalCostBonus);
var multiplier = (100 + appliedCostBonus) / 100;
if (multiplier < 0) multiplier = 0;
return Math.floor(baseCost * multiplier) * parseIntNan(num);
},
getReviveTime : function (cid, uid, num) {
var t = Tabs.Revive;
var apoth = getCityBuilding(cid, 23);
var q = apoth && apoth.count ? apoth.count : 0;
var bonus = 0;
try {
var currSet = getFactionBonus(Seed.throne.activeSlot);
if (currSet && currSet.hazBonus && currSet.faction === "druid") {
bonus = CM.ThroneController.effectBonus(96) || 0;
}
} catch (e1) {}
var maxValRevPerc = 0;
var totalPerc = 0;
try { maxValRevPerc = CM.ThroneController.getBoostCap(97) || 0; } catch (e2) { maxValRevPerc = 999999; }
try { totalPerc = (CM.ThroneController.getBoundedEffect(97) || 0) + (CM.ThroneController.getBoundedEffect(164) || 0); } catch (e3) {}
var totalPercTaken = Math.min(maxValRevPerc, totalPerc);
var o = (100 + totalPercTaken) / 100;
try {
if (Dashboard && typeof Dashboard.GetArcanaEffect === 'function' && Cities.byID[cid]) {
o += (Dashboard.GetArcanaEffect(42002, Cities.byID[cid].idx) / 100);
}
} catch (e4) {}
var factor = CM.WorldSettings.getSetting("APOTHECARY_TIME_FACTOR") || 1;
var rate = o * factor;
if (rate <= 0) rate = 1;
var baseTime = (uW.unitcost["unt" + uid] && uW.unitcost["unt" + uid][7]) ? uW.unitcost["unt" + uid][7] : 0;
var p = baseTime * parseIntNan(num) / rate;
p = p >= 5 ? p : 5;
if (q > 1) p = p / 1.2;
p = p - (p * (bonus / 100));
try { p = p - (p * CM.BlessingSystemModel.applyBlessing(CM.BlessingSystemModel.getBlessing().PICK_ME_UP, cid)); } catch (e5) {}
return Math.ceil(p);
},
PaintWounded : function () {
var t = Tabs.Revive;
var rownum = 0;
var irows = [];
var	rows = [];
var	acts = [];
irows[0] = []; // wounded might
function _row(name, row, noTotal, icon, act) {
var t = Tabs.Revive;
var tot = 0;
if (!noTotal) {
for (var i = 0; i < row.length; i++)
tot += parseIntNan(row[i]);
if (tot==0) { return ''; }
}
var style = (rownum++ % 2) ? ' class="evenRow"' : ' class="oddRow"';
var m = [];
m.push('<TR align=right');
m.push(style);
if (noTotal) {
m.push('><TD colspan=2');
}
else {
m.push('><TD');
}
m.push(' style="padding-left: 0px;"');
m.push('>');
if (icon) {
m.push(icon);
}
else {
m.push('<B>'+name+'&nbsp;</B>');
}
m.push('</td>');
if (!noTotal) {
m.push('<TD><div class="totalCell xtabBorder">');
t.troopTotal[name] = tot;
m.push(addCommas(tot));
m.push('</div></td>');
}
for (var i = 0; i < row.length; i++) {
m.push('<TD');
m.push(style);
m.push('><div class=xtabBorder>');
if (act) { m.push('<span class="'+act[i]+'">'); }
else { m.push('<span>'); }
m.push(addCommas(row[i]));
m.push('</span></div></td>');
}
m.push('</tr>');
return m.join('');
}
var m = '<TABLE width=98% class=xtab cellpadding=1 cellspacing=0 align=center style="font-size:'+Options.OverviewOptions.OverviewFontSize+'px;"><TR valign=bottom><td width=20>&nbsp;</td><td align=right width=100><b>&nbsp;</b></td>';
for (var i = 1; i <= Cities.numCities; i++) {
m += '<TD style="font-size:11px;" align=center width=100><span id="btWoundedCity_'+i+'"><B>'+Cities.cities[i-1].name.substring(0, 12)+'</b></span></td>';
irows[0][i-1] = 0;
}
m += "<td>&nbsp;</td></tr>"; // spacer
for (var r = 1; r < t.unitsarr.length + 1; r++) {
rows[r] = [];
acts[r] = [];
for (var i = 0; i < Cities.numCities; i++) {
var cityId = Cities.cities[i].id;
rows[r][i] = 0;
if (Seed.woundedUnits['city'+cityId] && Seed.woundedUnits['city'+cityId]['unt'+t.unitsarr[r-1]]) {
rows[r][i] = parseIntNan(Seed.woundedUnits['city'+cityId]['unt'+t.unitsarr[r-1]]);
}
acts[r][i] = "";
var q1 = Seed.queue_revive["city"+cityId];
var u1 = 0;
if (q1 != null && q1.length > 0) { u1 = q1[0][0]; }
var q2 = Seed.queue_revive2["city"+cityId];
var u2 = 0;
if (q2 != null && q2.length > 0) { u2 = q2[0][0]; }
if (t.unitsarr[r-1]==u1||t.unitsarr[r-1]==u2) { acts[r][i] = "boldGreen"; }
irows[0][i] += parseIntNan(rows[r][i]) * uW.unitmight['unt'+t.unitsarr[r-1]];
}
}
rownum = 0;
for (var j = 1; j < t.unitsarr.length+1; j++) {
m += _row(uW.unitcost['unt'+t.unitsarr[j-1]][0], rows[j], false, TroopImage(t.unitsarr[j-1]),acts[j]);
}
m += '<TR><TD colspan=2 align=right><b>'+tx('Wounded Might')+'&nbsp;</b></td></tr>';
m += _row('', irows[0], false);
m += '</table>';
if (t.LastWounded!=m) {
ById('btReviveWoundedDiv').innerHTML = m;
ResetFrameSize('btMain',100,GlobalOptions.btWinSize.x);
t.LastWounded = m;
}
},
doAutoLoop : function (idx,addqueue) {
var t = Tabs.Revive;
clearTimeout(t.timer);
if (!Options.ReviveOptions.Running) return;
if (!Cities.cities[idx-1]) { idx = 1; }
var cityId = Cities.cities[idx-1].id;
if (idx==1) { t.loopaction = false; } // reset loop action indicator for first city
t.autodelay = 0; // no delay if no action taken!
if (Options.ReviveOptions.HealArray[idx] && !t.noApothecary[idx] && Options.ReviveOptions.Enabled[idx]) {
if (t.citydelay[idx] > 0) { t.citydelay[idx]--; } // city being delayed due to error, reduce delay number and skip city
else {
var now = unixTime();
var qrev;
var slot;
if (addqueue) { qrev = Seed.queue_revive2["city" + cityId] || []; slot=2; }
else { qrev = Seed.queue_revive["city" + cityId] || []; slot=1; }
if (qrev.length > 0 && parseInt(qrev[0][3]) > now) {
t.autoSpeedup (cityId,qrev[0],slot);
}
else {
if (qrev.length > 0 && parseInt(qrev[0][3]) < now) {
if (GlobalOptions.ExtendedDebugMode) { logit(Cities.byID[cityId].name+': Fixing seed.revive array','REVIVE'); }
qrev.pop(); // remove expired revive from queue
}
var ascensionok = (!Options.BuildOptions || !Options.BuildOptions.AscensionReady || !Options.BuildOptions.AscensionReady[idx]);
if (ascensionok && (!Options.ReviveOptions.ThroneCheck || (t.revivespeed >= Options.ReviveOptions.ReviveSpeed))) { // if no revive speed restriction or enough revive speed
var AvailGold = parseIntNan(Seed.citystats["city" + cityId].gold[0]) - parseIntNan(Options.ReviveOptions.MinGold);
if (AvailGold > 0) {
for (var i=0; i<Options.ReviveOptions.HealArray[idx].length; i++){
var info = Options.ReviveOptions.HealArray[idx][i];
var amt = 0;
if (Seed.woundedUnits['city'+cityId]['unt'+info.troop] < info.min) continue;
if (Seed.woundedUnits['city'+cityId]['unt'+info.troop] > info.max && info.max_sel){
amt = info.max;
} else {
amt = Seed.woundedUnits['city'+cityId]['unt'+info.troop];
}
var unitGold = t.getRevivalCost(info.troop,1);
var costGold = unitGold*amt;
if (costGold>AvailGold) {
amt = Math.floor(AvailGold/unitGold);
if (amt < info.min || amt==0) continue;
}
if (info.troop > 0 && amt > 0){
t.autodelay = t.intervalSecs;
t.loopaction = true;
t.Revive(cityId,info.troop,amt);
break;
}
}
}
}
}
if (!addqueue) {
var twoqueues = false;
if (Seed.cityData.city[cityId].isPrestigeCity) {
twoqueues = (Seed.cityData.city[cityId].prestigeInfo.blessings.indexOf(106) != -1);
}
if (twoqueues) { // check additional queue
t.timer = setTimeout(function () { t.doAutoLoop(idx,true); }, (t.autodelay * 1000));
return;
}
}
}
}
if (idx == Cities.numCities) {
if (!t.loopaction) { t.autodelay = t.intervalSecs; } // if no action this loop, apply delay anyway...
t.timer = setTimeout(function () { t.doAutoLoop(1,false); }, (t.autodelay * 1000));
}
else {
t.timer = setTimeout(function () { t.doAutoLoop(idx+1,false); }, (t.autodelay * 1000));
}
},
autoSpeedup: function (cityId,q,slot) {
var t = Tabs.Revive;
var now = unixTime();
var item = 0;
if (!q || !q.length) return;
var totTime = q[3] - now;
if (totTime > 0) {
if (Options.ReviveOptions.UseOverride && Options.ReviveOptions.OverrideItem != 0) {
var THRESHOLD_SECONDS = (parseIntNan(Options.ReviveOptions.OverrideMinutes)*60)+(parseIntNan(Options.ReviveOptions.OverrideHours)*60*60);
if (totTime >= THRESHOLD_SECONDS && uW.ksoItems[Options.ReviveOptions.OverrideItem] && uW.ksoItems[Options.ReviveOptions.OverrideItem].count > 0) { item = Options.ReviveOptions.OverrideItem; }
}
if (item==0 && totTime >= t.ExtraHGLimit[4] && Options.ReviveOptions.UseDM && uW.ksoItems[84] && uW.ksoItems[84].count > 0) { item = 84; }
if (item==0 && totTime >= t.ExtraHGLimit[3] && Options.ReviveOptions.UseSP && uW.ksoItems[83] && uW.ksoItems[83].count > 0) { item = 83; }
if (item==0 && totTime >= t.ExtraHGLimit[2] && Options.ReviveOptions.UseCU && uW.ksoItems[82] && uW.ksoItems[82].count > 0) { item = 82; }
if (item==0 && totTime >= t.ExtraHGLimit[1] && Options.ReviveOptions.UseNH && uW.ksoItems[81] && uW.ksoItems[81].count > 0) { item = 81; }
if (item==0 && totTime >= t.ExtraHGLimit[0] && Options.ReviveOptions.UsePH && uW.ksoItems[80] && uW.ksoItems[80].count > 0) { item = 80; }
if (item==0 && totTime >= HGLimit[8] && Options.ReviveOptions.UseLH && uW.ksoItems[10] && uW.ksoItems[10].count > 0) { item = 10; }
if (item==0 && totTime >= HGLimit[7] && Options.ReviveOptions.UseEH && uW.ksoItems[8] && uW.ksoItems[8].count > 0) { item = 8; }
if (item==0 && totTime >= HGLimit[6] && Options.ReviveOptions.UseDH && uW.ksoItems[7] && uW.ksoItems[7].count > 0) { item = 7; }
if (item==0 && totTime >= HGLimit[5] && Options.ReviveOptions.UseRH && uW.ksoItems[6] && uW.ksoItems[6].count > 0) { item = 6; }
if (item==0 && totTime >= HGLimit[4] && Options.ReviveOptions.UseAH && uW.ksoItems[5] && uW.ksoItems[5].count > 0) { item = 5; }
if (item==0 && totTime >= HGLimit[3] && Options.ReviveOptions.UseMH && uW.ksoItems[4] && uW.ksoItems[4].count > 0) { item = 4; }
if (item==0 && totTime >= HGLimit[2] && Options.ReviveOptions.UseGH && uW.ksoItems[3] && uW.ksoItems[3].count > 0) { item = 3; }
if (item==0 && totTime >= HGLimit[1] && Options.ReviveOptions.UseKH && uW.ksoItems[2] && uW.ksoItems[2].count > 0) { item = 2; }
if (item==0 && totTime >= HGLimit[0] && Options.ReviveOptions.UseSH && uW.ksoItems[1] && uW.ksoItems[1].count > 0) { item = 1; }
}
if (item != 0) {
t.autodelay = t.intervalSecs;
t.loopaction = true;
t.speedupRevive(cityId,item,q[0],slot,true);
}
},
cancelRevive : function (cityId,slotNum) {
var t = Tabs.Revive;
var q;
if (slotNum == 1 && Seed.queue_revive && Seed.queue_revive['city'+cityId]) { q = Seed.queue_revive['city'+cityId][0]; }
if (slotNum == 2 && Seed.queue_revive2 && Seed.queue_revive2['city'+cityId]) { q = Seed.queue_revive2['city'+cityId][0]; }
if(q) {
CM.last_building_opened = 23; // force apothecary view boolean
uW.removeTraining(0, cityId, q[0], q[1], q[3], q[2], q[5], false, 'rev'+slotNum);
}
},
speedupRevive : function (cityId,item,cid,slotNum,noretry) {
var t = Tabs.Revive;
if (!Cities.byID[cityId]) return;
var citynum = Cities.byID[cityId].idx+1;
jQuery('#btReviveCity_'+citynum).css('color', 'magenta');
var params = uW.Object.clone(uW.g_ajaxparams);
params.cid = cityId;
params.iid = item;
params.uid = cid;
params.slotNum = slotNum;
params.apothecary = true;
new MyAjaxRequest(uW.g_ajaxpath + "ajax/speedupTraining.php" + uW.g_ajaxsuffix, {
method: "post",
parameters: params,
onSuccess: function (rslt) {
if (rslt.ok) {
var reduced = CM.intelligentOrdering.getReduceTime(item);
Seed.items["i" + item] = parseIntNan(Seed.items["i" + item]) - 1;
if (uW.ksoItems[item] && typeof uW.ksoItems[item].subtract === 'function') { uW.ksoItems[item].subtract(); }
var qloc = 0;
var timered = 0;
var queue = Seed.queue_revive;
if (params.slotNum == 2) { queue = Seed.queue_revive2; }
queue["city" + cityId][0][3] = rslt.dateTraining;
if (rslt.updateCityUnits) { uW.update_cityUnits(uWCloneInto(rslt.updateCityUnits)); }
if (rslt.updateWoundedCityUnits) { uW.update_woundedCityUnits(uWCloneInto(rslt.updateWoundedCityUnits)); }
timered = SpeedupArray[parseInt(item) - 1];
if (Seed.player.usedSpeedup && Seed.player.usedSpeedup == 0) {
Seed.player.usedSpeedup = 1;
}
if (cityId == uW.currentcityid) uW.update_queue();
}
else {
if (rslt.msg) {
actionLog(Cities.byID[cityId].name+': Revive speedup failed ('+rslt.msg+')','REVIVE');
}
else {
actionLog(Cities.byID[cityId].name+': Revive speedup failed ('+rslt.error_code+')','REVIVE');
}
}
jQuery('#btReviveCity_'+citynum).css('color', 'rgb('+HEXtoRGB(Options.Colors.PanelText).r+','+HEXtoRGB(Options.Colors.PanelText).g+','+HEXtoRGB(Options.Colors.PanelText).b+')');
},
onFailure: function () {
actionLog(Cities.byID[cityId].name+': Revive speedup failed (AJAX Error)','REVIVE');
jQuery('#btReviveCity_'+citynum).css('color', 'rgb('+HEXtoRGB(Options.Colors.PanelText).r+','+HEXtoRGB(Options.Colors.PanelText).g+','+HEXtoRGB(Options.Colors.PanelText).b+')');
},
},noretry);
},
Revive_Now: function(idx,troop,min,max,max_sel){
var t = Tabs.Revive;
ById('btRevMessages').innerHTML = "";
var citynum=idx+1;
if(t.noApothecary[citynum]) {
ById('btRevMessages').innerHTML = tx("No Apothecary")+"!";
return;
}
var cid = Cities.cities[idx].id;
var amt = 0;
var twoqueues = false;
if (Seed.cityData.city[cid].isPrestigeCity) {
twoqueues = (Seed.cityData.city[cid].prestigeInfo.blessings.indexOf(106) != -1);
}
if (Seed.queue_revive['city'+cid].length > 0 && (Seed.queue_revive2['city'+cid].length > 0 || !twoqueues)) {
ById('btRevMessages').innerHTML = tx("Revive queue is full")+"!";
return;
}
var AvailGold = parseIntNan(Seed.citystats["city" + cid].gold[0]) - parseIntNan(Options.ReviveOptions.MinGold);
if (AvailGold < 0) {
ById('btRevMessages').innerHTML = tx("Gold is below minimum threshold")+"!";
return;
}
var woundedCount = parseIntNan(Seed.woundedUnits['city'+cid] && Seed.woundedUnits['city'+cid]['unt'+troop]);
if (woundedCount < min) {
ById('btRevMessages').innerHTML = tx("Wounded troops are below minimum threshold")+"!";
return;
}
if (woundedCount == 0) {
ById('btRevMessages').innerHTML = tx("No troops to revive")+"!";
return;
}
if (woundedCount > max && max_sel){ amt = parseIntNan(max); }
else { amt = woundedCount; }
var unitGold = t.getRevivalCost(troop,1);
var costGold = unitGold*amt;
if (costGold>AvailGold) {
amt = Math.floor(AvailGold/unitGold);
if (amt < min || amt==0) {
ById('btRevMessages').innerHTML = tx("Not enough gold above threshold to revive minimum troop threshold")+"!";
return;
}
}
if(cid > 0 && troop > 0 && amt > 0){
t.Revive(cid,troop,amt);
}
},
Add_Revive: function(idx,troop,min,max,max_sel){
var t = Tabs.Revive;
var citynum = idx+1;
ById('btRevMessages').innerHTML = "";
if(t.noApothecary[citynum]) {
ById('btRevMessages').innerHTML = tx("No Apothecary")+"!";
return;
}
if (troop==0 || (max_sel && max<1) || (max_sel && max<min)) {
ById('btRevMessages').innerHTML = tx("Invalid parameters")+"!";
return;
}
Options.ReviveOptions.HealArray[citynum].push({troop:troop,min:min,max:max,max_sel:max_sel});
saveOptions();
t.PaintCityInfo();
},
AddAllWounded : function () {
var t = Tabs.Revive;
var cityId = t.ModelCityId;
if (!cityId || !Cities.byID[cityId]) { ById('btRevMessages').innerHTML = tx('No city selected'); return; }
if (!Cities.byID[cityId]) return;
var citynum = Cities.byID[cityId].idx+1;
ById('btRevMessages').innerHTML = "";
var min = parseIntNan(Options.ReviveOptions.BatchMin);
var max = parseIntNan(Options.ReviveOptions.BatchMax);
var max_sel = Options.ReviveOptions.SelectBatchMax;
if(t.noApothecary[citynum]) {
ById('btRevMessages').innerHTML = tx("No Apothecary")+"!";
return;
}
if ((max_sel && max<1) || (max_sel && max<min)) {
ById('btRevMessages').innerHTML = tx("Invalid parameters")+"!";
return;
}
for (var w in Seed.woundedUnits['city'+cityId]) {
var unitId = w.split("unt")[1];
if (unitId && (t.CannotReviveUnit.indexOf(parseIntNan(unitId)) == -1) && parseIntNan(Seed.woundedUnits['city'+cityId][w])>0) {
var gottroops = false;
for (var e in Options.ReviveOptions.HealArray[citynum]) {
if (Options.ReviveOptions.HealArray[citynum][e].troop==unitId) {
gottroops = true;
break;
}
}
if (!gottroops) {
t.Add_Revive(t.ModelCity.city.idx,unitId,min,max,max_sel);
}
}
}
},
Revive : function(cityId,unitId,num){
var t = Tabs.Revive;
if (!Cities.byID[cityId]) return;
var citynum = Cities.byID[cityId].idx+1;
jQuery('#btReviveCity_'+citynum).css('color', 'green');
var params = uW.Object.clone(uW.g_ajaxparams);
params.cid = cityId;
params.type = unitId;
params.quant = num;
params.apothecary = true;
var time = t.getReviveTime(cityId,unitId, num);
new MyAjaxRequest(uW.g_ajaxpath + "ajax/train.php" + uW.g_ajaxsuffix, {
method: "post",
parameters: params,
onSuccess: function(rslt) {
if (rslt.ok) {
if (!rslt.initTS) { rslt.initTS = uW.unixTime() - 1; }
if (rslt.queue_revive && rslt.queue_revive["city" + cityId]) {
time = rslt.queue_revive["city" + cityId][0][5];
}
var RQ;
if (Seed.queue_revive["city"+cityId].length == 0) { RQ = Seed.queue_revive["city" + cityId]; }
else { RQ = Seed.queue_revive2["city"+cityId]; }
RQ.push(uWCloneInto([unitId, num, rslt.initTS, parseInt(rslt.initTS) + time, 0, time, null]));
var cost = t.getRevivalCost(unitId, num);
Seed.citystats["city" + cityId].gold[0] -= parseInt(cost);
if (uW.currentcityid == cityId) unsafeWindow.update_gold();
Seed.woundedUnits["city"+cityId]["unt"+unitId]=parseInt(Seed.woundedUnits["city"+cityId]["unt"+unitId])-num;
t.PaintCityInfo();
} else {
if (rslt.error_code == 6) { // city already reviving? delay 10 loops
t.citydelay[citynum] = 10;
}
if (rslt.msg) {
actionLog(Cities.byID[cityId].name+': Revive failed ('+rslt.msg+')','REVIVE');
}
else {
actionLog(Cities.byID[cityId].name+': Revive failed ('+rslt.error_code+')','REVIVE');
}
}
jQuery('#btReviveCity_'+citynum).css('color', 'rgb('+HEXtoRGB(Options.Colors.PanelText).r+','+HEXtoRGB(Options.Colors.PanelText).g+','+HEXtoRGB(Options.Colors.PanelText).b+')');
},
onFailure: function () {
actionLog(Cities.byID[cityId].name+': Revive failed (AJAX Error)','REVIVE');
jQuery('#btReviveCity_'+citynum).css('color', 'rgb('+HEXtoRGB(Options.Colors.PanelText).r+','+HEXtoRGB(Options.Colors.PanelText).g+','+HEXtoRGB(Options.Colors.PanelText).b+')');
},
},true);
}
};
