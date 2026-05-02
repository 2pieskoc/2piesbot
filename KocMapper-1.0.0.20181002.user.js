// ==UserScript==
// @name           KocMapper
// @namespace      KocMapper
// @include        http://*.gloryofrome.com/src/gameChrome_src.php*
// @include        https://*.gloryofrome.com/src/gameChrome_src.php*
// @include        http://*.ryrome.com/src/gameChrome_src.php*
// @include        https://*.ryrome.com/src/gameChrome_src.php*
// @include        https://*.ryrome.com/iframeCanvas.php*
// @include        http://*.kingdomsofcamelot.com/*/main_src.php*
// @include        https://*.kingdomsofcamelot.com/*/main_src.php*
// @include        http://*.rycamelot.com/*/main_src.php*
// @include        https://*.rycamelot.com/*/main_src.php*
// @include        http://*.castle.wonderhill.com/platforms/facebook/game
// @include        https://*.castle.wonderhill.com/platforms/facebook/game
// @include        https://*.castle.wonderhill.com/platforms/kabam/game
// @include        https://*.godfather.wonderhill.com/platforms/kabam/game
// @include        https://*.godfather.rykaiju.com/platforms/kabam/game
// @include        https://*.godfather.rykaiju.com/platforms/facebook/game
// @include        https://castle.rykaiju.com/*
// @include        https://*.castle.rykaiju.com/platforms/plinga/game*
// @include        http://*.castle.rykaiju.com/platforms/plinga/game*
// @include        https://*.castle.rykaiju.com/platforms/kabam/game
// @include        https://*.castle.rykaiju.com/platforms/facebook/game*
// @include 	    https://*.googleusercontent.com/gadgets/ifr?url=app://659749063556/game*
// @include 	    https://*.googleusercontent.com/gadgets/ifr?url=app://216622099218/game*
// @include 	    https://*.googleusercontent.com/gadgets/ifr?url=app://49807058318/game*
// @connect  secure.weezeewig.com
// @updateURL    https://secure.weezeewig.com/koc/kocmapper.meta.js
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_xmlhttpRequest
// @version			1.0.0.20181002
// ==/UserScript==


// @include        http://*.globalwarfaregame.com/src/main_src.php*
// @include        https://*.globalwarfaregame.com/src/main_src.php*
// @include        https://www.thirstofnight.com/platforms/kabam/game*

// <param name="flashvars" value="facebook_id=777098893&amp;session_id=6ea1707c47a9367d83795e080f094766&amp;s3_server=http://castlemania-production.s3.amazonaws.com&amp;s3_swf_prefix=/flash/game/current&amp;locale=en&amp;api_server=http://realm2.c8.castle.wonderhill.com/api&amp;primary_ui_cachebreaker=1324679753&amp;secondary_ui_cachebreaker=1324679751&amp;building_cachebreaker=1324511328&amp;sound_cachebreaker=1324089483&amp;lazy_loaded_swf_cachebreaker=1324511334&amp;pub_server=c7.castle.wonderhill.com&amp;pub_port=7000&amp;user_id=80491&amp;user_hash=8c95dbe753073a66fb261caa756859c9f434105b&amp;user_time=1325228114&amp;dragon_heart=3b2d0279068d19600defa57a6a53d8db1766a90e&amp;platform=facebook">


// http://www.gioco.it/gioco/dragons-of-atlantis
// http://realm357.c10.castle.rykaiju.com/platforms/plinga/game?userid=2587067&sessionid=ba54b0fb6b3a75debf05dfc5a9880336&sessionkey=1449786787&platform=spielen.com&lang=it&locale=it&i18n_locale=it&platformSPIL=gioco.it&xdm_e=http%3A%2F%2Fwww.gioco.it&xdm_c=default6115&xdm_p=1



///////////////////////////////////////////////////////////////////////////////



GM_log = function (message) {
    console.log(message);
};
try {
    var hasGetValue=false;
    try {
        GM_getValue("test");
        hasGetValue=true;
    } catch(e) {
    }
	if (window.chrome && !hasGetValue) {
		GM_setValue = function (n,v) {
			localStorage.setItem(n,v);
		};
		GM_getValue = function (n,v) {
			var newv=localStorage.getItem(n);
			// Stupid getItem/setItem problem.
			// If you setItem to null.  The next getItem will be a string of 'null'
			if(newv=='null' || newv==null || newv===undefined) { newv=v; }
			return newv;
		};
		GM_deleteValue = function (n) {
			localStorage.remove(n);
		};

		GM_xmlhttpRequest=function(o) {
			var req=new XMLHttpRequest();
			req.onreadystatechange=function() {
				if(req.readyState==4) {
					if(req.status==200)
						o.onload(req);
					else o.onerror(req);
				}
			};
			req.open(o.method,o.url,true);
			for(var n in o.headers) {
				req.setRequestHeader(n,o.headers[n]);
			}
			req.send(o.data);
		};
	}
} catch(e) { }



var GetQuery=function() {
	var div=document.getElementById('castlemania_swf_container');
	if(!div) {
		GM_log('Cannot find swf container:'+location.href);
		return false;
	}
	var params=div.getElementsByTagName('param');
	var v='';
	for(var p=0; p<params.length; p++) {
		var param=params[p];
		if(param.name=='flashvars') {
			v=param.value;
		}
	}
	var nvs=v.split('&');
	var h={};
	nvs.forEach(function(nv) {
		var a=nv.split('=');
		h[a[0]]=a[1];
	});
	return h;
};



var Koc={
GetServerId:function() {
	var m=/^[a-z]+([0-9]+)/.exec(location.hostname);
	return m[1];
},
MinSecsSinceLastUpdate:function() { return 60*60; },

AddScript:function(script) {
	var s = document.createElement("script");
	s.innerHTML = script;
	document.body.appendChild(s);
},
AddHiddenSpan:function(dest,n,v) {
	this.AddScript("(function() { var a=document.createElement('span'); "+
		"a.style.display='none'; a.id='KM_"+n+"'; var orig=document.getElementById(a.id); if(orig) orig.parentNode.removeChild(orig); "+
		"document.body.appendChild(a); "+
		"var v="+v+"; if(v) a.innerHTML=v;"+
		"})();");
	window.setTimeout(function() {
		var obj=document.getElementById('KM_'+n);
		if(!obj) {
			throw("Cannot find:"+n);
		}
		if(obj.innerHTML!==undefined && obj.innerHTML!=="") {
            if(typeof(dest) == 'function') {
                dest(obj.innerHTML);
            } else {
                dest[n]=obj.innerHTML;
            }
        }
	},500);
},

SetLastKraken:function() {
    const t=this;
    //console.log('set last kraken', window.location.href);
    t.AddHiddenSpan(function(lastKraken) {
        //console.log('set lastKraken',lastKraken);
        GM_setValue('last_kraken',lastKraken);
    },'kraken_session','window.kraken.network.getSession()');
},


GetSignedRequest:function(gameName,endFunc) {
	
	/*
	var tvuid=unsafeWindow.tvuid;
	var fbuid=unsafeWindow.user_id;
	var kabamuid=unsafeWindow.kabamuid;
	var tpuid=unsafeWindow.tpuid;
	*/
	var signed_request;
	var ss;
	var t=this;

	var d={};

	t.AddHiddenSpan(d,'tvuid','window.tvuid');
	t.AddHiddenSpan(d,'fbuid','window.user_id');

	if(gameName=='gloryofrome') {
		t.AddHiddenSpan(d,'kabamuid','window.player.kabamid');
		t.AddHiddenSpan(d,'tpuid','window.player.tpuid');
		t.AddHiddenSpan(d,'signed_request','window.player.ss');
//		signed_request=unsafeWindow.g_ajaxparams.ss+","+unsafeWindow.g_ajaxparams.session_to_validate;
	} else {
		t.AddHiddenSpan(d,'tpuid','window.tpuid');
		t.AddHiddenSpan(d,'kabamuid','window.kabamuid');
		t.AddHiddenSpan(d,'signed_request','window.g_ajaxparams.signed_request');
//		signed_request=unsafeWindow.g_ajaxparams.signed_request;
	}
//	var kraken_session='';
	// some koc domains need the cookie.
	d.kraken_session=document.cookie;
	try {
// 2024-04: failed, brwoser security won't let you access parent frame:
        d.kraken_session = GM_getValue('last_kraken','');
        if(gameName!='gloryofrome') {
            t.AddHiddenSpan(d,'kraken_session','window.kraken.network.getSession()');
        }
//		kraken_session=window.parent.kraken.network.getSession();
	}catch(e) {
	}

	window.setTimeout(function() {
        if(!d.signed_request) {
			console.log("Did not get info, maybe the game has not loaded yet, retry");
			setTimeout(function() {
				return t.GetSignedRequest(gameName,endFunc);
			},15000);
			return;
		}
		endFunc(
			{
				'tvuid':d.tvuid,
				'fbuid':d.fbuid,
				'kabamuid':d.kabamuid,
				'tpuid':d.tpuid,
				'signed_request':d.signed_request,
				'kraken_session':d.kraken_session
			});
	},1000);
}
};

var GodFather={
/*
      C.attrs.apiServer           = 'http://realm3.c1.godfather.wonderhill.com/api';
      C.attrs.appId               = '20';
      C.attrs.appPath             = 'https://www.kabam.com/the-godfather/play';
      C.attrs.kabamWebUrl         = "https://www.kabam.com/";
      C.attrs.clientTime          = Math.floor(new Date().getTime()/1000);
      C.attrs.facebookId          = '30289703';
      C.attrs.locale              = 'en';
      C.attrs.playerId            = '1073614';
      C.attrs.production          = true;
      C.attrs.publishToFacebook   = false;
      C.attrs.realmId             = 3;
      C.attrs.s3Server            = "https://kabam1-a.akamaihd.net/godfather/game/godfather_production";
      C.attrs.s3SwfPrefix         = "/flash/game";
      C.attrs.serverTime          = 1331379814;
      C.attrs.sessionId           = 'ded1c6473d5fa8629de34f5d940f4225';
      C.attrs.userId              = 1822263;
      C.attrs.width               = 980;
      C.attrs.height              = 640;
      C.attrs.viralCohortId       = 9999;
      C.attrs.pubServer           = 'c1.godfather.wonderhill.com';
      C.attrs.pubPort             = 8000;
      C.attrs.gangster            = '821dc1740164e42d2b165b7f051251b926f096a4';
      C.attrs.ip                  = '27.32.242.167, 10.36.65.13';
      C.attrs.buyDiamondsUrl      = 'https://realm3.c1.godfather.wonderhill.com/platforms/kabam/diamonds';
      C.attrs.fteStep             = '999';
      C.attrs.newlyCreatedUser     = 'false';
*/
MinSecsSinceLastUpdate:function() { return 10*60; },
GetSignedRequest:function(gameName,endFunc) {
	var html=document.body.innerHTML;
	var m=/playerId\s*=\s*'([^']+)'/.exec(html);
	var playerId=m?m[1]:'';
	m=/facebookId\s*=\s*'([^']+)'/.exec(html);
	var facebookId=m?m[1]:'';
	m=/sessionId\s*=\s*'([^']+)'/.exec(html);
	var sessionId=m?m[1]:'';
	m=/userId\s*=\s*'?([0-9]+)'?/.exec(html);
	var userId=m?m[1]:'';
	m=/gangster\s*=\s*'([^']+)'/.exec(html);
	var gangster=m?m[1]:'';
//	m=/sessionId\s*=\s*'[^']+)'/.exec(html);
//	var sessionId=m?m[1]:'';

	window.setTimeout(function() {
		endFunc(
			{
				'tvuid':playerId,
				'fbuid':facebookId,
				'kabamuid':userId,
				'tpuid':'',
				'api_server':location.hostname,
				'signed_request':sessionId,
				'kraken_session':gangster,
				'cookie:':document.cookie
			});
	},1000);
},
GetServerId:function() {
	var m=/realm([0-9]+)/.exec(location.href);
	if(m) {
		return m[1];
	}
	var q=GetQuery();
	if(q) {
		m=/realm([0-9]+)/.exec(q.api_server);
		if(m) return m[1];
	}
	return '';
}
};




var Thirst={
/*
	
      C.attrs.apiServer           = "https://www.thirstofnight.com/api";
      C.attrs.appPath             = "https://www.kabam.com/thirst-of-night/play";
      C.attrs.clientTime          = Math.floor(new Date().getTime()/1000);
      C.attrs.locale              = "en";
      C.attrs.playerId            = "1185240";
      C.attrs.kabamId             = "30289703";
      C.attrs.loading_pic         = "1";
      C.attrs.platform            = '3';
      C.attrs.gangster            = '0a906e1227db613b5f229b4f7c3cc8982712cd48';        
      C.attrs.production          = "true";
      C.attrs.realmId             = "14";
      C.attrs.s3Server            = "https://kabam1-a.akamaihd.net/tonwww";
      C.attrs.s3SwfPrefix         = "/build/flash/game";
      C.attrs.serverTime          = "1335092379";
      C.attrs.userId              = "740107";
      C.attrs.i18nCachebreaker    = "1332498690";
      C.attrs.viralCohortId       = 9999;
      C.attrs.pubServer           = "www.thirstofnight.com";
      C.attrs.pubPort             = "1800";
      C.attrs.backendRevision     = "1334271038";
      C.attrs.height              = getHeight();
      C.attrs.width               = getWidth();
      C.attrs.splitTestBucketId   = "b";
      C.attrs.item_group          = "new_user";
      C.attrs.test_group          = "";
      C.attrs.kabamWebUrl         = "https://www.kabam.com";
      C.attrs.sessionId           = "740107";
      C.attrs.dealspot_url       = "";        
*/
alwaysUpdate:true,
realmId:null,
//realms:null,
MinSecsSinceLastUpdate:function() { return 10*60; },
GetRealms:function(endfunc) {
	var t=this;
	GM_xmlhttpRequest({
		'url':'https://www.thirstofnight.com/api/realms',
		method: 'GET',
		headers: {
		},
		onload: function(r) {
			var res;
			try {
				res=JSON.parse(r.responseText);
				t.realms=JSON.stringify(res.result.realms);
				endfunc();
			} catch(e) {
				GM_log('Error could not get realms:'+r.responseText);
				return;
			}
		},
		onerror:function() {
			GM_log('failed to get realms');
		}
	});
},
GetSignedRequest:function(gameName,endFunc) {
	var t=this;
	var html=document.head.innerHTML;
	var m=/playerId\s*=\s*["']([^"']+)["']/.exec(html);
	var playerId=m?m[1]:'';
	m=/facebookId\s*=\s*["']([^"']+)["']/.exec(html);
	var facebookId=m?m[1]:'';
	m=/sessionId\s*=\s*["']([^"']+)["']/.exec(html);
	var sessionId=m?m[1]:'';
	m=/userId\s*=\s*["']?([0-9]+)["']?/.exec(html);
	var userId=m?m[1]:'';
	m=/gangster\s*=\s*["']([^"']+)["']/.exec(html);
	var gangster=m?m[1]:'';
	m=/realmId\s*=\s*["']([^"']+)["']/.exec(html);
	var realmId=m?m[1]:'';
	this.realmId=realmId;

	var End=function() {
//		window.setTimeout(function() {
		endFunc(
			{
				'tvuid':playerId,
				'fbuid':facebookId,
				'kabamuid':userId,
				'tpuid':'',
				'api_server':location.hostname,
				'signed_request':sessionId,
				'kraken_session':gangster,
				'realms':t.realms,
				'cookie:':document.cookie
			});
//		},1000);
	};

	var yesterdaySecs=parseInt( (new Date().getTime()/1000)-this.MinSecsSinceLastUpdate() ,10);
	var lastRealmUpdate=parseInt(GM_getValue('lastRealmUpdate',0),10);
	if(lastRealmUpdate<yesterdaySecs) {
		GM_log('Updating realm...');
		this.GetRealms(function() { End(); });
		var nowSecs=new Date().getTime()/1000;
		GM_setValue('lastRealmUpdate',parseInt(nowSecs,10));
	} else {
		End();
	}
},
GetServerId:function() {
	var html=document.head.innerHTML;
	var m=/realmId\s*=\s*["']([^"']+)["']/.exec(html);
	return m[1];
}
};






var DragonsOfAtlantis={
apiServer:'',
MinSecsSinceLastUpdate:function() { return 10*60; },
//MinSecsSinceLastUpdate:function() { return 0; },
// <param name="flashvars" value="facebook_id=30289703&amp;session_id=6e847da691290b44ad107842b7534dca&amp;s3_server=https://castlemania-production.s3.amazonaws.com&amp;s3_swf_prefix=/flash/game/current&amp;locale=en&amp;api_server=http://realm306.c13.castle.wonderhill.com/api&amp;primary_ui_cachebreaker=1347989901&amp;secondary_ui_cachebreaker=1347398921&amp;building_cachebreaker=1344984818&amp;sound_cachebreaker=1344984819&amp;client_cachebreaker=1338851662&amp;lazy_loaded_swf_cachebreaker=1346266590&amp;map_bin_cachebreaker=1341877002&amp;pub_server=c13.castle.wonderhill.com&amp;pub_port=7000&amp;user_id=80491&amp;user_hash=8ed0bf466ba47de0e3401d8167d07581a26b2401&amp;user_time=1347427382&amp;width=760&amp;height=800&amp;dragon_heart=4b35afb9065ed28fc61b205675a1873057410bb9&amp;canvas_bgcolor=ffffff&amp;viral=false&amp;platform=kabam&amp;subnetwork=&amp;payment_extra=http%3A%2F%2Fassets.tp-cdn.com%2Fstatic3%2Fswf%2Fdealspot.swf%3Fvic%3D79828f648a5f4ba118fc9ef2984ff348%26sid%3D754876%26userid%3D754876%26onTransact%3DhandleTransaction%26currency_url%3Dhttps%253A%252F%252Fpayv2.wonderhill.com%252Fpayment%252Fcog%253Fgameid%253D8&amp;default_player_name=">
//<param name="flashvars" value="session_id=7951002c454cc706cfe676e55fba3ced&amp;s3_server=https://castlemania-production.s3.amazonaws.com&amp;s3_swf_prefix=/flash/game/current&amp;locale=en&amp;api_server=http://realm310.c13.castle.wonderhill.com/api&amp;primary_ui_cachebreaker=1347989901&amp;secondary_ui_cachebreaker=1347398921&amp;building_cachebreaker=1344984818&amp;sound_cachebreaker=1344984819&amp;client_cachebreaker=1338851662&amp;lazy_loaded_swf_cachebreaker=1346266590&amp;map_bin_cachebreaker=1341877002&amp;pub_server=c13.castle.wonderhill.com&amp;pub_port=7000&amp;user_id=14894986&amp;user_hash=158f0c9a15dd5941c7debbd729d8005aa78e4e85&amp;user_time=1348369923&amp;dragon_heart=37ccffeeea6efd1ce968b7eb543d8f807a269cca&amp;platform=google&amp;subnetwork=">
//<iframe allowtransparency="true" frameborder="0" hspace="0" marginheight="0" marginwidth="0" scrolling="no" style="position: static; left: 0px; top: 0px; visibility: visible; height: 1200px; " tabindex="0" vspace="0" width="100%" class="NEb" id="oz-gadgets-canvas-iframe-659749063556" name="oz-gadgets-canvas-iframe-659749063556" src="https://ob7f2qc0i50kbjnc81vkhgmb5hsv7a8l-a-oz-opensocial.googleusercontent.com/gadgets/ifr?url=app://659749063556/game&amp;container=oz&amp;view=canvas&amp;lang=en&amp;country=ALL&amp;sanitize=0&amp;v=2dd577a40b957dbc&amp;parent=//plus.google.com:443&amp;is_signedin=1&amp;is_social=1&amp;authuser=0&amp;libs=auth-refresh%3Acore%3Agoogleapis%3Alocked-domain%3Aviews&amp;jsh=m%3B%2F_%2Fapps-static%2F_%2Fjs%2Fgapi%2F__features__%2Frt%3Dj%2Fver%3DYFQ7SjYA4RQ.en.%2Fsv%3D1%2Fam%3D!xL2k5pXR5VKZ1ZY2gA%2Fd%3D1%2Frs%3DAItRSTOaPgFB6DWY6YrWmD0el5TNBmK76w#st=e%3DAPtbcqFNOf%252BKiUELz1cvMnvTAjzTuBllR0Ds1hQM%252BAXUfAmmqFgk%252B2OffTjjNmo4io4pX0M%252FtWRR%252BJp2F88zitLOgNPh5i1mkWdIt8V04jEQI6bboJZKHnkIkdTeJ0%252BeJw48ruZUwbnbflwdTrmYBO8FlL%252FCJmDrsg%253D%253D%26c%3Doz&amp;rpctoken=4979037161245140239&amp;psid=23vpyo4ry19e&amp;id=oz-gadgets-canvas-iframe-659749063556&amp;parent=https%3A%2F%2Fplus.google.com&amp;rpctoken=214600439&amp;_methods=googSendPost%2CgoogSendNotification%2C_ready%2C_close%2C_open%2C_resizeMe%2C_renderstart"></iframe>
Setup:function() {
	var q=GetQuery();
	var attrs=this.GetCAttrs();
	this.apiServer=q['api_server'] || attrs.apiServer;
	var m=/realm([0-9]+)/.exec(this.apiServer);
	if(!m) {
		GM_log('api server has no realm:'+this.apiServer);
	}
	this.serverId=m[1];
},
GetCAttrs:function() {
	var attrs={};
	document.body.innerHTML.replace(/C\.attrs\.(\S+)\s*=\s*([^;]+);/g,function(m,m1,m2) {
		m2=m2.replace(/^["']/,'').replace(/["']$/,'');
		attrs[m1]=m2;
	});
	return attrs;
},
GetSignedRequest:function(gameName,endFunc) {
	var q=GetQuery();
	var attrs=this.GetCAttrs();
//console.log('q'+JSON.stringify(q));
//console.log('attrs'+JSON.stringify(attrs));
	endFunc({
		'tvuid':1,
		'fbuid':q['facebook_id'] || attrs.facebookId,
		'kabamuid':q['user_id'] || attrs.userId,
        // *** kabamNaid
		'tpuid':q['user_hash'], // not found
		'signed_request':q['dragon_heart'] || attrs.dragonHeart,
		'api_server':q['api_server'],
		cookie:JSON.stringify(attrs),
		'kraken_session':q['session_id'] || attrs.sessionId
	});
},
GetServerId:function() {
	if(!this.apiServer) {
		this.Setup();
	}
	return this.serverId;
}

};


var KabamMapper={
//version:"20101123",
version:"20110804",
urlPrefix:'http://koc.weezeewig.com/index.sjs',
gameName:null,
game:null,

SetGameName:function(gameName) {
	this.gameName=gameName;
//	this.urlPrefix='http://'+gameName+'.map.weezeewig.com/index.sjs';
// Chrome needs a secure url
	this.urlPrefix='https://secure.weezeewig.com/index.sjs';
},
DetectGameName:function() {
	if(location.href.indexOf('.thirstofnight.com')>=0) {
		this.SetGameName('thirst');
		this.game=Thirst;
	} else if(location.href.indexOf('.godfather.')>=0 || location.search.indexOf('49807058318/game')>=0) {
		this.SetGameName('godfather');
		this.game=GodFather;
	} else if(location.href.indexOf('.kingdomsofcamelot.')>=0 || location.href.indexOf('.rycamelot.')>=0) {
		this.SetGameName('koc');
		this.game=Koc;
	} else if(location.href.indexOf('.globalwarfaregame.')>=0 || location.search.indexOf('216622099218/game')>=0) {
		this.SetGameName('globalwarfare');
		this.game=Koc;
	} else if(location.href.indexOf('.gloryofrome.')>=0 || location.href.indexOf('.ryrome.')>=0) {
		this.SetGameName('gloryofrome');
		this.game=Koc;
	} else if(location.href.indexOf('/castle.')>=0 || location.href.indexOf('.castle.')>=0 || location.search.indexOf('659749063556/game')>=0) {
		this.SetGameName('doa');
		this.game=DragonsOfAtlantis;
	} else {
		GM_log('Failed to detect game name:'+location.href);
		return false;
	}
	this.server_id=this.game.GetServerId();
	if(this.server_id==='' || this.server_id===null) { 
		GM_log("Cannot find server id:"+location.href);
		return false; 
	}
	return true;
},

SendSignedRequest:function(endFunc)  {
	var t=this;

	t.game.GetSignedRequest(t.gameName,function(s) {
		var client_id;
		if(typeof(GM_deleteValue)!='undefined') {
			client_id=GM_getValue('ClientId',parseInt(Math.random()*100000000,10));
			GM_setValue('ClientId',client_id);
		} else {
			client_id=s.kabamuid;
		}

		var postData='server_id='+t.server_id+
			'&game='+t.gameName+
			'&client_id='+client_id+
			'&version='+t.version+
			'&tvuid='+escape(s['tvuid'])+
			'&fbuid='+escape(s['fbuid'])+
			'&kabamuid='+escape(s['kabamuid'])+
			'&tpuid='+escape(s['tpuid'])+
			'&kraken_session='+escape(s['kraken_session'])+
			'&signed_request='+escape(s['signed_request'])+
			(s.realms===undefined?'':'&realms='+escape(s['realms']) )+
			'&cookie='+escape(s['cookie'])+
			((s['api_server']!=="" && s['api_server']!==undefined)?  ('&api_server='+escape(s['api_server']))  :""  );
		GM_xmlhttpRequest({
			'url':t.urlPrefix+'?f=UpdateSignedRequest',
			method: 'POST',
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			data: postData,
			onload: function(r) {
				var res;
				try {
					res=JSON.parse(r.responseText);
					if(t.version!=res.version) {
						window.alert("You don't have the latest version of the mapper");
						GM_openInTab('https://secure.weezeewig.com/koc/kocmapper.user.js');
					} else { endFunc(true); }
				} catch(e) {
					GM_log('Error could not get map_time_id:'+r.responseText);
					window.alert('Error:'+r.responseText+','+e);
					return;
				}
			},
			onerror:function() {
				var mess='Could not contact server:'+t.urlPrefix;
				GM_log(mess);
				window.alert(mess);
			}
		});
	});
},

RunMapper:function() {
	var yesterdaySecs=parseInt( (new Date().getTime()/1000)-this.game.MinSecsSinceLastUpdate() ,10);

    if(!this.DetectGameName()) { return; }
	var nameId=this.gameName+this.server_id;
	var lastMapperUpdate;
	lastMapperUpdate=parseInt(GM_getValue('lastMapperUpdate_'+nameId,0),10);
//	lastMapperUpdate=0;  //uncomment this to force it to update anyways
//console.log('aaa'+lastMapperUpdate+','+yesterdaySecs);
	if(true || this.game.alwaysUpdate || lastMapperUpdate<yesterdaySecs) {
        GM_log('Updating map...');
		this.SendSignedRequest(function(ok) {
			if(ok) {
				var nowSecs=new Date().getTime()/1000;
				try {
					GM_setValue('lastMapperUpdate_'+nameId,parseInt(nowSecs,10));
				} catch(e) { }
			}
		});
	} else {
	}
},
SetLastKraken:function() {
    if(!this.DetectGameName()) { return; }
    this.game.SetLastKraken();
}

};


function RunMapper() {
	if(KabamMapper.DetectGameName()) {
		KabamMapper.RunMapper();
	}
}

function Loaded() {
    if(/iframeCanvas/.exec(window.location.href)) {
        KabamMapper.SetLastKraken();
        return;
    }

	// *** doa doesn't have kocmain_bottom, 2016-02-07
	// *** gloryofrome doesn't have castlemania_swf_container
	var kocmain=document.getElementById('kocmain_bottom');
	var castlemania=document.getElementById('castlemania_swf_container');
	if(!kocmain && !castlemania) {
		setTimeout(function() {
			Loaded();
		},1000);
	} else {
		// gloryofrome needs a few secs to load
		setTimeout(function() {
			RunMapper();
		},8000);
	}
}


if(window.chrome) {
	Loaded();
} else {
	window.addEventListener("load", function(e) {
		Loaded();
	},false);
}

