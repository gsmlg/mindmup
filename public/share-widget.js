/*global MM,jQuery,document*/
jQuery.fn.shareWidget = function (googleShortenerApiKey, activityLog) {
	'use strict';
	var shareToolbar = this,
		shareModal = shareToolbar.find('.modal').detach().appendTo('body'),
		links = shareToolbar.find('[data-mm-role="share"]'),
		formElement = shareModal.find('form'),
		validate = function (element) {
			var valid = element.val();
			if (!valid) {
				element.parents('.control-group').addClass('error');
			} else {
				element.parents('.control-group').removeClass('error');
			}
			return valid;
		},
		submitForm = function () {
			var nameElement = formElement.find('[name=q6_yourName]'),
				emailElement = formElement.find('[name=q3_recipientEmail]'),
				messageElement = formElement.find('[name=q5_message]'),
				pathElement = formElement.find('[name=q4_path]'),
				titleElement = formElement.find('[name=q7_title]');
			if (validate(emailElement) && validate(nameElement) && validate(messageElement)) {
				pathElement.val(shareToolbar.data('mm-url'));
				titleElement.val(document.title);
				formElement.submit();
				messageElement.val('');
				emailElement.val('');
				shareModal.modal('hide');
			}
		},
		shortenerRetriesLeft = 5,
		fireShortener = function () {
			jQuery.ajax({
				type: 'post',
				url: 'https://www.googleapis.com/urlshortener/v1/url?key=' + googleShortenerApiKey,
				dataType: 'json',
				contentType: 'application/json',
				data: '{"longUrl": "' + document.location.href + '"}',
				success: function (result) {
					shareToolbar.data('mm-url', result.id);
					shareToolbar.find('[data-mm-role=short-url]').show().val(result.id);
				},
				error: function (xhr, err, msg) {
					if (shortenerRetriesLeft > 0) {
						shortenerRetriesLeft--;
						setTimeout(fireShortener, 1000);
					} else {
						activityLog.log('Map', 'URL shortener failed', err + " " + msg);
					}
				}
			});
		};
	shareToolbar.data('mm-url', document.location.href);
	formElement.find('input').blur(function () { validate(jQuery(this)); });
	shareModal.find('[data-mm-role=submit]').click(submitForm);
	links.click(function () {
		var self = jQuery(this), target = self.attr('data-mm-target'),
			title = encodeURIComponent(document.title), url = encodeURIComponent(shareToolbar.data('mm-url'));
		if (target === 'twitter') {
			self.attr('target', '_blank');
			self.attr('href', 'https://twitter.com/intent/tweet?text=' + title +
				'&url=' + url +
				'&source=mindmup.com&related=mindmup&via=mindmup');
			return true;
		}
		if (target === 'facebook') {
			self.attr('target', '_blank');
			self.attr('href', 'https://www.facebook.com/dialog/feed?app_id=621299297886954&' +
				'link=' + url + '&' +
				'name=' + title + '&' +
				'caption=' + encodeURIComponent('Mind map from mindmup.com') + '&' +
				'picture=' + encodeURIComponent('http://mindmup.s3.amazonaws.com/lib/img/logo_256.png') + '&' +
				'description=' + title + '&' +
				'redirect_uri=' + encodeURIComponent('http://www.mindmup.com/fb'));
			return true;
		}
		if (target === 'email') {
			shareModal.modal('show');
		}
		return false;
	});
	fireShortener();
};
