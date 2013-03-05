(function($) {

var options = {
	relayUri: undefined,
	nocache: undefined
};

var localCache = {};

function init(opt)
{
	options = opt;
}

function genCacheKey(kind, uid)
{
	return uid + "@" + kind;
}

function post(params) {
	return $.ajax({
		type: "POST",
		url: options.relayUri,
		data: params,
		dataType: 'json'
	}).pipe(function(data, status, xhr) {
		if (data && data.error)
		{
			return $.Deferred().rejectWith(this, [data.error]);
		}
		return data;
	}).fail(function(error) {
		if ('console' in window)
		{
			console.error('error:', error);
		}
	});
}

function saveToCache(kind, uid, value) {
	if (options.nocache)
	{
		return undefined;
	}
	localCache[genCacheKey(kind, uid)] = value;
	return value;
}

function loadFromCache(kind, uid, value) {
	if (options.nocache)
	{
		return undefined; 
	}
	var key = genCacheKey(kind, uid);
	if (!(key in localCache))
	{
		return undefined;
	}
	return localCache[key];
}

function removeFromCache(kind, uid) {
	if (options.nocache)
	{
		return undefined;
	}
	var key = genCacheKey(kind, uid);
	if (!(key in localCache))
	{
		return undefined;
	}
	delete localCache[key];
}

function removeAllCache(kind)
{
	var postfix = '@' + kind;
	if (options.nocache)
	{
		return undefined;
	}
	for(var key in localCache)
	{
		if (key.indexOf(postfix) === key.length - postfix.length)
		{
			delete localCache[key];
		}
	}
}

function apiBookmarkUpdate(kind, uid, params, tag_clear)
{
	params.push({name: 'function', value: 'bookmark-update'});
	params.push({name: 'kind', value: kind});
	params.push({name: 'uid', value: uid});
	params.push({name: 'verbose', value: 1});

	var found = false;
	$.each(params, function() {
		found = this.name === 'tag[]';
		return !found;
	});
	if (tag_clear && !found) {
		params.push({name: 'tag', value: ''});
	}

	return post(params).done(function(data) {
		if ($.isArray(data))
		{
			$.each(data, function() {
				saveToCache(this.kind, this.uid, this);
				$(window).trigger('npmBookmarkUpdate', this);
			});
		}
		else
		{
			saveToCache(kind, uid, data);
			$(window).trigger('npmBookmarkUpdate', data);
		}
	});
}

function apiBookmarkRetrieve(kind, uid)
{
	var data = loadFromCache(kind, uid);
	if (data)
	{
		var d = $.Deferred();
		setTimeout(function() {
			d.resolve(data);
		}, 0);
		return d;
	}
	else
	{
		var params = {
			'function': 'bookmark-retrieve',
			kind: kind,
			uid: uid
		};

		return post(params).done(function(data) {
			saveToCache(kind, uid, data);
			$(window).trigger('npmBookmarkRetrieve', data);
		});
	}
}

function apiBookmarkDelete(kind, uid)
{
	var params = {
		'function': 'bookmark-delete',
		kind: kind,
		uid: uid
	};

	return post(params).done(function(data) {
		removeFromCache(params.kind, params.uid);
		$(window).trigger('npmBookmarkDelete', data);
	});
}

//@var kinds Object {1: [111, 222, 333]}
function apiBookmarkExists(kinds)
{
	var params = {
		'function': 'bookmark-exists',
		item: kinds
	};

	return post(params).done(function(data){
		$(window).trigger('npmBookmarkExists', data);
	});
}

function apiTagList(kind)
{
	var params = {
		'function': 'tag-list',
		kind: kind
	};

	return post(params).done(function(data){
		$(window).trigger('npmTagList', data);
	});
}

function apiTagUpdate(kind, currentTag, newTag)
{
	var params = {
		'function': 'tag-update',
		kind: kind,
		'current': currentTag,
		'new': newTag
	};

	return post(params).done(function(data){
		removeAllCache(kind);
		$(window).trigger('npmTagUpdate', data);
	});
}

function apiTagDelete(kind, currentTag)
{
	var params = {
		'function': 'tag-delete',
		kind: kind,
		'current': currentTag
	};

	return post(params).done(function(data){
		removeAllCache(kind);
		$(window).trigger('npmTagDelete', data);
	});
}

$.npmBookmarkData = function(func, p1, p2, p3, p4) {
	if ($.isPlainObject(func)){
		return init(func);
	}
	switch (func) {
		case 'bookmark-update':
			return apiBookmarkUpdate(p1, p2, p3, p4);
		case 'bookmark-retrieve':
			return apiBookmarkRetrieve(p1, p2);
		case 'bookmark-delete':
			return apiBookmarkDelete(p1, p2);
		case 'bookmark-exists':
			return apiBookmarkExists(p1);
		case 'tag-list':
			return apiTagList(p1);
		case 'tag-update':
			return apiTagUpdate(p1, p2, p3);
		case 'tag-delete':
			return apiTagDelete(p1, p2);
	}
};

})(jQuery);
