(function($){

//var IS_TOUCH_DEVICE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);	
var CLASS_LOADING = 'npm-loading';
var CLASS_SAVING = 'npm-saving';
var CLASS_NOT_ADDED = 'npm-not-added';
var CLASS_ADDED = 'npm-added';
var MODE_DISPLAY = 'npm-display-mode';
var MODE_EDIT = 'npm-edit-mode';
var MODE_DELETE_CONFIRM = 'npm-delete-confirm-mode';
var _need_taglist_update = true;

var _dialog;
var _npm_display;
var _npm_edit;
var _npm_delete_confilm;
var _npm_dialog_header;
var _params;
var _editing;

//var event;
//var ui;

function htmlescape(s){
	return s
		.split('&').join('&amp;')
		.split('<').join('&lt;')
		.split('>').join('&gt;')
		.split('"').join('&quot;')
		.split("'").join('&#39;');
}

function autolink(s){
	var re = /(https?|ftp):\/\/[\x21\x23-\x26\x28-\x3b\x3d\x3f-\x7e]+/gi;
	var match, result = "", pos = 0, url;
	while ((match = re.exec(s)) != null){
		url = htmlescape(match[0]);
		result += htmlescape(s.substring(pos, match.index));
		result += '<a target="_blank" href="' + url + '">' + url + '</a>';
		pos = re.lastIndex;
	}
	result += htmlescape(s.substring(pos));
	return result;
}

function memoCharCountValidate(e, max){
	var memo = $(e);
	var memo_count = _npm_edit.find('.npm-memo-count');
	var len = memo.val().replace(/\r\n|\r|\n/g, "\n").length;
	var rest_count = max - len
	memo_count.html(rest_count);
	_npm_edit.toggleClass('npm-memo-over-count', rest_count < 0);
}

//dialogの初期設定
function init(dialog, options)
{
	_dialog = dialog;
	_npm_display = _dialog.find('.npm-display-container');
	_npm_edit = _dialog.find('.npm-edit-container');
	_npm_delete_confilm = _dialog.find('.npm-delete-confirm-container');
	_npm_dialog_header = _dialog.find('.npm-bookmark-dialog-header');
	
	// submit /////////////////////////////////////////////////////////////////////
	_npm_edit.find('form').submit(function(e){
		e.preventDefault();
		_dialog.find('.npm-dialog-button.npm-send').click();
		return false;
	});
	
	// memo ///////////////////////////////////////////////////////////////////////
	var memo = _npm_edit.find('.npm-memo .npm-memo-textarea');
	var max = memo.data('max-length');
	memo.on('keyup change paste', function(){
		memoCharCountValidate(this, max);
		_editing = true;
	});

	// rationg ////////////////////////////////////////////////////////////////////

	//編集モードの設定
	var ratyOptions = $.extend(options.raty, {
		cancel:true,
		scoreName:'rating',
		//とりあえず、外から渡せないけど
		click: function(score, evt){
			_editing = true;
		}
	});
	
	_npm_edit.find('.npm-rate').raty(ratyOptions);
	
	//表示モードの設定
	ratyOptions.readOnly = true;
	_npm_display.find('.npm-rate-display').raty(ratyOptions);
	
	// tag //////////////////////////////////////////////////////////////////////
	_npm_edit.find('.npm-tags').sdxTag({
		'tagDidChange':function(ui, event){
			//タグのリストを取得しにいくタイミングが、微妙に違ったので、save後に移動しました。
			_editing = true;
		}
	});
	
	//編集モードボタン
	_dialog.find('.npm-dialog-button.npm-edit').click(function(){
		if(_isNotBlocking())
		{
			_toEditMode();
			_updateTagSuggestValues(_npm_edit.find('input[name=kind]').val());
		}
	});
	
	//編集キャンセルボタン
	_dialog.find('.npm-dialog-button.npm-edit-cancel').click(function(){
		if(_isNotBlocking())
		{
			_toDisplayMode();
		}
	});

	//保存ボタン
	_dialog.find('.npm-dialog-button.npm-send').click(function(){
		
		_editing = false;
		
		if(_isNotBlocking())
		{
			var kind = _npm_edit.find('input[name=kind]').val();
			var uid = _npm_edit.find('input[name=uid]').val();
			var params = _npm_edit.find('form').serializeArray();
			$.each(params, function(){
				if (this.name == 'rating' && this.value == ''){
					this.value = '0';
				}
			});
			_npm_edit.addClass(CLASS_SAVING);
			_enterBlocking();
			var saveDeferred = $.npmBookmarkData('bookmark-update', kind, uid, params, true).done(function(data){
//				_setDialogParams(data);
//				_toDisplayMode();
				_need_taglist_update = true;
			}).fail(function(error){
				alert('保存に失敗しました。');
			}).always(function(){
				_leaveBlocking();
				_npm_edit.removeClass(CLASS_SAVING);
			});
		}
	});
	
	//削除確認画面ボタン
	_dialog.find('.npm-dialog-button.npm-delete-confirm').click(function(){
		_toDeleteConfirmMode();
	});

	//削除キャンセルボタン
	_dialog.find('.npm-dialog-button.npm-delete-cancel').click(function(){
		_toDisplayMode();
	});	

	//削除実行ボタン
	_dialog.find('.npm-dialog-button.npm-delete').click(function(){
		if(_isNotBlocking())
		{
			var kind = _npm_edit.find('input[name=kind]').val();
			var uid = _npm_edit.find('input[name=uid]').val();
			
			_enterBlocking();
			var deleteDeferred = $.npmBookmarkData('bookmark-delete', kind, uid).done(function(){
				
			}).fail(function(error){
				alert('削除に失敗しました。');
			}).always(function(){
				_leaveBlocking();
			});
		}
	});
	
	//npm-display-[kind]-[uid]のクラスがついてるものにratingとmemo有り無しclassをくっつける
	$(window).on('npmBookmarkUpdate', function(e, data){
		$.npmBookmarkDisplay(data.item.kind, data.item.uid, {rating:data.rating, memo:!!data.memo});
	});
	
	$(window).on('npmBookmarkDelete', function(e, data){
		$.npmBookmarkDisplay(data.item.kind, data.item.uid);
	});
}

//ダイアログのデータ初期化と登録データの復元
function load(kind, uid, isAdded, title)
{
	_setDialogParams({});
	_toDisplayMode();
	
	$('.npm-title').html(title);
	
	if (isAdded)
	{
		//dataの読み込み
		_npm_dialog_header.addClass(CLASS_LOADING);
		$.npmBookmarkData('bookmark-retrieve', kind, uid).done(function(data){
			_setDialogParams(data);
			_toDisplayMode();
		}).fail(function(error){
			alert('データの取得に失敗しました。');
		}).always(function(data){
			_npm_dialog_header.removeClass(CLASS_LOADING);
		});
		_npm_edit.find('.npm-top-action').show();
	} else {
		_npm_edit.find('.npm-top-action').hide();
		_toEditMode();
		_updateTagSuggestValues(kind);
	}
	
	//uidとkindをくっつける
	_npm_edit.find('input[name=uid]').val(uid);
	_npm_edit.find('input[name=kind]').val(kind);
}

//ラベルの履歴データの更新
function _updateTagSuggestValues(kind)
{
	if(_need_taglist_update)
	{
        $.npmBookmarkData('tag-list', kind).done(function(data){
            _need_taglist_update = false;
            _dialog.find('.npm-tags').sdxTag('setSuggestValues', data.tags);
        });
	}
}

//編集モードへの切り替え
function _toEditMode()
{
	_editing = false;
	//memo(オートリンクを付けながらセット)
	var memo = _npm_edit.find('.npm-memo .npm-memo-textarea');
	var max = memo.data('max-length');
	memo.val(_params.memo);
	memoCharCountValidate(memo[0], max);
	
	//rating
	if (_params.rating)
	{
		_npm_edit.find('.npm-rate').raty('score', _params.rating);
	}
	else
	{
		_npm_edit.find('.npm-rate').raty('cancel', false);
	}
	
	//is_purchased
	_npm_edit.find('input[name=is_purchased]').attr('checked', _params.is_purchased == 1);
	
	//date
	_npm_edit.find('.npm-date .npm-created_at').html(_formatDate(_params.created_at));
	_npm_edit.find('.npm-date .npm-mod_date').html(_formatDate(_params.mod_date));
	
	//tag
	var	tags = _npm_edit.find('.npm-tags');
	tags.sdxTag('removeAll');
	tags.sdxTag('hideSuggestion');
	for(var key in _params.tag)
	{
		tags.sdxTag('addTag', _params.tag[key]);
	}
	
	_dialog.toggleClass(MODE_DISPLAY, false);
	_dialog.toggleClass(MODE_DELETE_CONFIRM, false);
	_dialog.toggleClass(MODE_EDIT, true);
}

//表示モードへの切り替え
function _toDisplayMode()
{
	_editing = false;
	//memo
	var memo_value = autolink(_params.memo || '');
	memo_value = memo_value ? memo_value.replace(/(\r\n|\n|\r)/g, "<br />") : '';
	_npm_display.find('.npm-memo-display').html(memo_value);
	
	//rating
	var $rate_display = _npm_display.find('.npm-rate-display');

	if (typeof _params.rating !== "undefined")
	{
		//初期化してクラスをつける
		$rate_display.attr('class', 'npm-rate-display').addClass('npm-rating-' + _params.rating);
		
		if (_params.rating != '0')
		{
			$rate_display
				.raty('readOnly', false)
				.raty('score', _params.rating)
				.raty('readOnly', true);
		}
	}
	
	//is_purchased
	_npm_display.find('.npm-is-purchased-display').html(_params.is_purchased == 1 ? "遊んだ" : '');
	
	//date
	_npm_display.find('.npm-date .npm-created_at').html(_formatDate(_params.created_at));
	_npm_display.find('.npm-date .npm-mod_date').html(_formatDate(_params.mod_date));
	
	//tag
    var tags_html = '<ul class="tags">';
    if (_params.tag){
		for(var i = 0; i < _params.tag.length; ++i){
			tags_html += '<li class="tag">' + _params.tag[i] + '</li>';
		}
	}
	tags_html += '</ul>'
	_npm_display.find('.npm-tags-display').html(tags_html);
	
	_dialog.toggleClass(MODE_EDIT, false);
	_dialog.toggleClass(MODE_DELETE_CONFIRM, false);
	_dialog.toggleClass(MODE_DISPLAY, true);
}

//削除モードへの切り替え
function _toDeleteConfirmMode()
{
	_dialog.toggleClass(MODE_DISPLAY, false);
	_dialog.toggleClass(MODE_EDIT, false);
	_dialog.toggleClass(MODE_DELETE_CONFIRM, true);
}

//表示後に使用するbookmarkデータの保持
function _setDialogParams(params)
{
	_params = params;
}

//タイムスタンプを元に日付のデータを生成
function _formatDate(unixTimestamp)
{
    var dt = new Date(unixTimestamp * 1000);
    
    if(isNaN(dt.getTime()))
    {
    	return '----/--/-- --:--:--';
    }

    var pad = function(value)
    {
    	if (value < 10)
        {
        	return '0' + value;
        }
    	
    	return '' + value;
    }
    
    var year = dt.getFullYear();
    var month = dt.getMonth() + 1;
    var day = dt.getDate();
    var hours = dt.getHours();
    var minutes = dt.getMinutes();
    var seconds = dt.getSeconds();

    return pad(year) + "/" + pad(month) + "/" + pad(day) + " " + pad(hours) + ":" + pad(minutes) + ":" + pad(seconds);
}

//入力欄など、フォーム関連が編集できる状態かの判定
function _isNotBlocking(){
	return !_dialog.hasClass(CLASS_SAVING);
}

//入力欄などを、編集できない状態にする。
function _enterBlocking(){
	_npm_edit.addClass(CLASS_SAVING);
//ここから下完全に動いてないよ～～～～～！！！
	_npm_edit.find('.npm-memo').attr('disabled', 'disabled');
	_npm_edit.find('input[name=is_purchased]').attr('disabled', 'disabled');
	_npm_edit.find('.npm-tags').attr('disabled', 'disabled');
	_npm_edit.find('.npm-rate').attr('disabled', 'disabled');
}

//入力欄などを、編集出来る状態にする。
function _leaveBlocking(){
	_npm_edit.removeClass(CLASS_SAVING);
//ここから下完全に動いてないよ～～～～～！！！
	_npm_edit.find('.npm-memo').removeAttr('disabled');
	_npm_edit.find('input[name=is_purchased]').removeAttr('disabled');
	_npm_edit.find('.npm-tags').removeAttr('disabled');
	_npm_edit.find('.npm-rate').removeAttr('disabled');
}

function maxLengthValidate(textarea){
	textarea.each(function(){
		var className = this.className;
		if(className.indexOf('max-length-') !== -1){
			var match = className.match(/max-length-\d+/);
			if(!match){
				return;
			}

			var max = match.toString().replace('max-length-', '');
			var maxText = $('<span>').text(max);
			var current = this.value.length;
			var currentText = $('<span>').text(current);
			
			var text = $('<p></p>').append('最大')
				.append(maxText)
				.append('文字  /  現在')
				.append(currentText)
				.append('文字')
				.css('font-size', '80%');

			modNum.apply(this);

			$(this).before(text)
				.bind('keyup', function(){
					modNum.apply(this);
				}).change(function(){
					modNum.apply(this);
				});

			function modNum(){
				var length = this.value.length;
				currentText.text(length);
				if(length > max){
					text.css({
						color: 'white',
						backgroundColor: '#cc0000'
					}).addClass('has_js_valid_error');

					
				} else {
					text.css({
						color: '',
						backgroundColor: ''
					}).removeClass('has_js_valid_error');
				}
			}
		}
	});
}

function isEditing()
{
	return _editing;
}


$.npmBookmark = function(func, p1, p2, p3, p4){
	switch(func){
		case 'init':
			return init(p1, p2);
		case 'load':
			return load(p1, p2, p3, p4);
		case 'isEditing':
			return isEditing();
	}
};

$.fn.npmBookmarkButton = function(options){
	var CLASS_ADDED = 'npm-added';
	if (typeof options == 'string'){
		switch(options){
		case 'isAdded':
			return this.hasClass(CLASS_ADDED);
		default:
			throw 'undefined method';
		}
	}
}

//npm-display-[kind]-[uid]
$.npmBookmarkDisplay = function(kind, uid, data){
	
	var elems = $('.npm-display-'+kind+'-'+uid);
	if(data)
	{
		var CLASS_HAS_MEMO = 'npm-has-memo-';
		var CLASS_RATING = 'npm-rating-';
		
		//クリア
		elems.removeClass(CLASS_HAS_MEMO+'yes '+CLASS_HAS_MEMO+'no');
		for(var i=0; i<=5; i++)
		{
			elems.removeClass(CLASS_RATING + i);
		}
		
		elems.addClass(CLASS_HAS_MEMO + (data.memo ? 'yes' : 'no'));
		elems.addClass(CLASS_RATING + (data.rating ? data.rating : '0'));
		elems.removeClass(CLASS_NOT_ADDED);
		elems.addClass(CLASS_ADDED);
	}
	else
	{
		elems.removeClass(CLASS_ADDED);
		elems.addClass(CLASS_NOT_ADDED);
	}
}

var bookmark_button_parent;
var bookmark_buttons = {};
var bookmark_button_options = {};
$.npmBookmarkButton = function(options){
	var CLASS_NOT_ADDED = 'npm-not-added';
	var CLASS_ADDED = 'npm-added';
	var CLASS_DISABLE = 'npm-disable';
	var CLASS_ENABLE = 'npm-enable';

	//buttonを探す関数
	var use_interval = typeof bookmark_button_options.useInterval == 'undefined' || bookmark_button_options.useInterval;
	function find(){
		var button_elements = bookmark_button_parent.find(bookmark_button_options.target).filter(':not('+'.'+CLASS_ENABLE+', .'+CLASS_DISABLE+')');
		if (!button_elements.length)
		{
			if(use_interval)
			{
				setTimeout(find, 500);
			}
			
			return;
		}
		if(bookmark_button_options.credential)
		{
			checkElements(button_elements).done(function(){
				if(use_interval)
				{
					setTimeout(find, 500);
				}
			}).always(function(){
				button_elements.addClass(CLASS_ENABLE);
			});
			(bookmark_button_options.onButtonAdded || $.noop)(button_elements);
		} else {
			button_elements.addClass(CLASS_DISABLE);					
		}
	}

	if (typeof options == 'string'){
		switch(options){
		case 'update':
			find();
			return this;
		default:
			throw 'undefined method';
		}
	}

	bookmark_button_options = options;
	bookmark_button_parent = $(bookmark_button_options.parent);	

	$(window).on('npmBookmarkUpdate', function(e, data){
		var kind = data.item.kind, uid = data.item.uid;
		if (!bookmark_buttons[kind] || !bookmark_buttons[kind][uid]) return;
		
		$.each(bookmark_buttons[kind][uid], function(){
			this.toggleClass(CLASS_NOT_ADDED, false);
			this.toggleClass(CLASS_ADDED, true);
		});
	}).on('npmBookmarkDelete', function(e, data){
		var kind = data.item.kind, uid = data.item.uid;
		if (!bookmark_buttons[kind] || !bookmark_buttons[kind][uid]) return;
		
		$.each(bookmark_buttons[kind][uid], function(){
			this.toggleClass(CLASS_NOT_ADDED, true);
			this.toggleClass(CLASS_ADDED, false);
		});
	});
	
	function checkElements(button_elements)
	{
		var items = {};
		button_elements.each(function(){
			var elem = $(this);
			
			var kind = elem.attr('data-npm-kind');
			var uid = elem.attr('data-npm-uid');
			
			if(!items[kind])
			{
				items[kind] = [];
			}
			
			if($.inArray(uid, items[kind]) == -1)
			{
				items[kind].push(uid);
			}
			
			if(!bookmark_buttons[kind])
			{
				bookmark_buttons[kind] = {};
			}
	
			if(!bookmark_buttons[kind][uid])
			{
				bookmark_buttons[kind][uid] = [];
			}
	
			bookmark_buttons[kind][uid].push(elem);
		});
		
		//登録されているかのチェック
		return $.npmBookmarkData('bookmark-exists', items).done(function(data){
			
			for(var kind in bookmark_buttons)
			{
				for(var uid in bookmark_buttons[kind])
				{
					$.each(bookmark_buttons[kind][uid], function(){
						var values = data[kind][uid];
						$.npmBookmarkDisplay(kind, uid, values);
						
						var notfound = values == undefined;
						this.toggleClass(CLASS_NOT_ADDED, notfound);
						this.toggleClass(CLASS_ADDED, !notfound);
					});
				}
			}
			
		}).fail(function(error){
			for(var kind in bookmark_buttons)
			{
				for(var uid in bookmark_buttons[kind])
				{
					$.each(bookmark_buttons[kind][uid], function(){
						this.toggleClass(CLASS_ADDED, false);
						this.toggleClass(CLASS_NOT_ADDED, true);
					});
				}
			}
		});
	}
	
	if(bookmark_button_options.credential)
	{
		bookmark_button_parent.on('click', bookmark_button_options.target, function(){
			var $this = $(this);
			if ($this.hasClass(CLASS_ENABLE)){
				$this.trigger('startBookmarkEdit');
				return false;
			}
		});
	}
	
	find();
	
	return this;
};

})(jQuery);
