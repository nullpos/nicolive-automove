$(document).ready(function() {
	localStorage.removeItem('ido');
	localStorage.removeItem('idoido');
	localStorage.removeItem('moved');

	const LIVE_STATUS_URL = 'http://watch.live.nicovideo.jp/api/getplayerstatus?v=';
	const LIVE_BASE_URL = 'http://live.nicovideo.jp/watch/';
	const RE_LIVE_NUM = /.*(lv\d+)/;
	const INTERVAL = 20000;
	const LS_NAME = 'nicolive_auto_move';

	var com_url = getComURL();
	var now_live_num = location.href.match(RE_LIVE_NUM)[1];
	var now_live = false;

	var check_page_id, check_latest_id;

	var keys = JSON.parse(localStorage.getItem(LS_NAME));
	if(!keys) keys = {"auto_move": false, "auto_scroll": false};

	if(keys['auto_move']) {
		check_page_id = setInterval(checkNowOnAirInPage, INTERVAL);
	}
	if(keys['auto_scroll']) {
		scroll();
	}

	function getNowLiveUrl(html) {
		var $html = $(html),
			elm;
		if($html.find('a.now_live_inner')[0]) {
			// community
			elm = $html.find('a.now_live_inner');
		} else {
			// channel
			elm = $html.find('p.live_btn>a');
		}
		if(elm) {
			return elm.attr('href');
		} else {
			return null;
		}
	}

	function getNowPageStatus(xml) {
		return $(xml).find('getplayerstatus').attr('status') === 'ok';
	}

	function getComURL() {
		var com_base_elm;
		if($('a.commu_name')[0]) {
			// onair page
			com_base_elm = 'a.commu_name';
		} else if($('div.shosai>a')[0]){
			// offair page
			com_base_elm = 'div.shosai>a';
		} else if($('a.program-community-name')[0]) {
			// html5
			com_base_elm = 'a.program-community-name';
		} else {
			// channel
			com_base_elm = 'a.ch_name'
		}
		return $(com_base_elm + ':eq(0)').attr('href');
	}

	function checkNowOnAirInPage() {
		$.get(LIVE_STATUS_URL + now_live_num, function(data) {
			var status = getNowPageStatus(data);
			if(status) {
				// now onair in now page
				now_live = true;
				setMoveState();
			} else {
				// offair in now page
				now_live = false;
				setMoveState();
				if(keys['auto_move']) {
					clearInterval(check_page_id);
					checkNowOnAir();
					check_latest_id = setInterval(checkNowOnAir, INTERVAL);
				}
			}
		});
	}

	function checkNowOnAir() {
		$.get(com_url, function(data) {
			var url = getNowLiveUrl(data);
			if(url) {
				// new live detected
				now_live = true;
				now_live_num = url.match(RE_LIVE_NUM)[1];
				setMoveState();
				clearInterval(check_latest_id);
				location.href = url;
			} else {
				// not live now in com
				now_live = false;
				setMoveState();
			}
		});
	}

	// ui
	var button_place;
	if($('#watch_player_top_box')[0]) {
		// onair page
		button_place = '#watch_player_top_box';
	} else if($('#bn_gbox')[0]) {
		// offair page
		button_place = '#bn_gbox';
	} else if($('#program-tag-block')[0]) {
		// html5
		button_place = '#program-tag-block';
	}

	$(button_place).after(
		'<div style="width:100%;background-color:#141414;">' +
			'<div id="button_div" style="height:25px;width:960px;background-color:#000;margin:0 auto;">' +
			'</div>' +
		'</div>');
	var $move_btn = $('<span id="move_state" class="_b">少し待ってね</span>');
	var $scroll_btn = $('<span id="scroll_state" class="_b">自動スクロールOFF</span>');

	$move_btn.click(function() {
		keys['auto_move'] = !(keys['auto_move']);
		localStorage.setItem(LS_NAME, JSON.stringify(keys));
		if(keys['auto_move']) {
			if(!check_page_id) {
				check_page_id = setInterval(checkNowOnAirInPage, INTERVAL);
			}
		}
		setMoveState();
		checkNowOnAirInPage();
	});

	$scroll_btn.click(function() {
		keys['auto_scroll'] = !(keys['auto_scroll']);
		localStorage.setItem(LS_NAME, JSON.stringify(keys));
		setScrollState();
	});

	$('#button_div').append($move_btn).append($scroll_btn);

	$("._b").css({
		"background-color":'#ccc',
		"margin":'2px 0 2px 2px',
		"border": '3px solid #ffa500',
		"cursor":'pointer'
	});

	function setMoveState() {
		var html;
		if(now_live) {
			html = '<a href="' + LIVE_BASE_URL + now_live_num + '">' + now_live_num + '</a>';
		} else {
			html = '生放送してないです';
		}
		if(keys['auto_move']) {
			$move_btn.html('自動移動ON ' + html);
		} else {
			$move_btn.html('自動移動OFF ' + html);
		}
	}

	function setScrollState() {
		if(keys['auto_scroll']) {
			$scroll_btn.html('自動スクロールON');
		} else {
			$scroll_btn.html('自動スクロールOFF');
		}
	}

	function scroll() {
		if($('#watch_title_box')[0]) {
			// flash
			$('html,body').animate({ scrollTop: $('#watch_title_box').offset().top - 35}, 'slow');
		} else if($('#program-header-block')[0]){
			// html5
			$('html,body').animate({ scrollTop: $('#program-header-block').offset().top - 35}, 'slow');
		}
	}

	checkNowOnAirInPage();
	setMoveState();
	setScrollState();
});