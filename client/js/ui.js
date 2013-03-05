/**
 * 
 */
(function($, dialog_template){

function getCssPath(){
	return $('#npm-bookmark-css').attr('href').replace(/\/[^\/]+$/, '');
}

$.extend({
	npmBookmarkPc: function(options)
	{
		var dialog = $(dialog_template).appendTo(document.body).sdxTip({
			init: function(event, ui){
				$.npmBookmark('init', ui.tooltip, {
					raty: {
						path: getCssPath() + '/img/',
						starOn:'star-on.png',
						starOff:'star-off.png',
						cancelOn:'cancel-on.png',
						cancelOff:'cancel-off.png',
						size: 44,
						width: 'auto'
					},
					onSave: function(save_deferred){
						save_deferred.done(function(data){
							ui.tooltip.sdxTip('close');
						});
					},
					onDelete: function(delete_deferred){
						delete_deferred.done(function(data){
							ui.tooltip.sdxTip('close');
						});
					}
				});
				
				ui.tooltip.find('.close').on('click', function(){
					dialog.sdxTip('close');
				});
			},
			onBeforeOpen: function(event, ui){
				var $this = ui.element;
				$.npmBookmark('load', $this.data('npm-kind'), $this.data('npm-uid'), $this.npmBookmarkButton('isAdded'), $this.data('npm-title'));
			},
			onClose: function(event, ui){
			},
			onPlaced: function(event, ui){
			}
		});

		$(options.parent).on('startBookmarkEdit', options.target, function(){
			var $this = $(this);
			dialog.sdxTip('open', $this, $this.attr('data-nmp-tipPlace').split(','));
		});
		
		dialog.addClass('npm-device-pc');
		return this;
	},

	npmBookmarkSp: function(options)
	{
		var dialog = $(dialog_template).appendTo(document.body).sdxModalWindow({
			ownerCompareFunc: function(a, b){
				return a.kind == b.kind && a.uid == b.uid;
			},
			init: function(event, ui){
				$.npmBookmark('init', ui.tooltip, {
					raty: {
						path: getCssPath() + '/img/',
						starOn:'star-on.png',
						starOff:'star-off.png',
						cancelOn:'cancel-on.png',
						cancelOff:'cancel-off.png',
						size: 44,
						width: 'auto'
					},
					onSave: function(save_deferred){
						save_deferred.done(function(data){
							ui.tooltip.sdxModalWindow('close');
						});
					},
					onDelete: function(delete_deferred){
						delete_deferred.done(function(data){
							ui.tooltip.sdxModalWindow('close');
						});
					}
				});
				ui.tooltip.find('.close').on('click', function(){
					dialog.sdxModalWindow('close');
				});
			},
			onBeforeOpen: function(event, ui){
				$.npmBookmark('load', ui.owner.kind, ui.owner.uid, ui.owner.isAdded, ui.owner.title);
			},
			onClose: function(event, ui){
			},
			onPlaced: function(event, ui){
			}
		});

		$(options.parent).on('startBookmarkEdit', options.target, function(){
			var $this = $(this);
			dialog.sdxModalWindow('open', { kind: $this.data('npm-kind'), uid: $this.data('npm-uid'), isAdded: $this.npmBookmarkButton('isAdded'), title: $this.data('npm-title') });
		});
		
		dialog.addClass('npm-device-sp');
		dialog.addClass('sp-modal-window');
		return this;
	}
});

$.npmBookmarkDialogTemplate = dialog_template;

})(jQuery, $$_dialog_template_$$);