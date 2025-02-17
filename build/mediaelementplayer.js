/*!
 *
 * MediaElementPlayer
 * http://mediaelementjs.com/
 *
 * Creates a controller bar for HTML5 <video> add <audio> tags
 * using jQuery and MediaElement.js (HTML5 Flash/Silverlight wrapper)
 *
 * Copyright 2010-2013, John Dyer (http://j.hn/)
 * License: MIT
 *
 */
if (typeof jQuery != 'undefined') {
	mejs.$ = jQuery;
} else if (typeof Zepto != 'undefined') {
	mejs.$ = Zepto;

	// define `outerWidth` method which has not been realized in Zepto
	Zepto.fn.outerWidth = function(includeMargin) {
		var width = $(this).width();
		if (includeMargin) {
			width += parseInt($(this).css('margin-right'), 10);
			width += parseInt($(this).css('margin-left'), 10);
		}
		return width
	}

} else if (typeof ender != 'undefined') {
	mejs.$ = ender;
}
/**
 * Returns true if targetNode appears after sourceNode in the dom.
 * @param {HTMLElement} sourceNode - the source node for comparison
 * @param {HTMLElement} targetNode - the node to compare against sourceNode
 */
function isAfter(sourceNode, targetNode) {
	return !!(
		sourceNode &&
		targetNode &&
		sourceNode.compareDocumentPosition(targetNode) & Node.DOCUMENT_POSITION_PRECEDING
	);
}

function constrainedSeekTo(player, media, targetTime) {
	if (!isNaN(media.duration) && media.duration > 0) {
		if (player.isVideo) {
			player.showControls();
			player.startControlsTimer();
		}
		var newTime = Math.min(Math.max(0, targetTime), media.duration);
		media.setCurrentTime(newTime);
	}
}

(function ($) {

	// default player values
	mejs.MepDefaults = {
		// url to poster (to fix iOS 3.x)
		poster: '',
		// Whether to hide the poster on play (useful for audio files)
		hidePosterOnPlay: true,
		// When the video is ended, we can show the poster.
		showPosterWhenEnded: false,
		// default if the <video width> is not specified
		defaultVideoWidth: 480,
		// default if the <video height> is not specified
		defaultVideoHeight: 270,
		// if set, overrides <video width>
		videoWidth: -1,
		// if set, overrides <video height>
		videoHeight: -1,
		// default if the user doesn't specify
		defaultAudioWidth: 400,
		// default if the user doesn't specify
		defaultAudioHeight: 30,
		// default amount to move back when back key is pressed
		defaultSeekBackwardInterval: function(media) {
			return (media.duration * 0.05);
		},
		// default amount to move forward when forward key is pressed
		defaultSeekForwardInterval: function(media) {
			return (media.duration * 0.05);
		},
		// default amount to move back when Page Up key is pressed
		defaultJumpBackwardInterval: function(media) {
			return (media.duration * 0.05);
		},
		// default amount to move forward when Page Down key is pressed
		defaultJumpForwardInterval: function(media) {
			return (media.duration * 0.05);
		},
		// set dimensions via JS instead of CSS
		setDimensions: true,
		// width of audio player
		audioWidth: -1,
		// height of audio player
		audioHeight: -1,
		// initial volume when the player starts (overrided by user cookie)
		startVolume: 0.8,
		// useful for <audio> player loops
		loop: false,
		// rewind to beginning when media ends
		autoRewind: true,
		// resize to media dimensions
		enableAutosize: true,
		/*
		 * Time format to use. Default: 'mm:ss'
		 * Supported units:
		 *   h: hour
		 *   m: minute
		 *   s: second
		 *   f: frame count
		 * When using 'hh', 'mm', 'ss' or 'ff' we always display 2 digits.
		 * If you use 'h', 'm', 's' or 'f' we display 1 digit if possible.
		 *
		 * Example to display 75 seconds:
		 * Format 'mm:ss': 01:15
		 * Format 'm:ss': 1:15
		 * Format 'm:s': 1:15
		 */
		timeFormat: '',
		// forces the hour marker (##:00:00)
		alwaysShowHours: false,
		// show framecount in timecode (##:00:00:00)
		showTimecodeFrameCount: false,
		// used when showTimecodeFrameCount is set to true
		framesPerSecond: 25,
		// automatically calculate the width of the progress bar based on the sizes of other elements
		autosizeProgress : true,
		// Hide controls when playing and mouse is not over the video
		alwaysShowControls: false,
		// Display the video control
		hideVideoControlsOnLoad: false,
		// Enable click video element to toggle play/pause
		clickToPlayPause: true,
		// Time in ms to hide controls
		controlsTimeoutDefault: 1500,
		// Time in ms to trigger the timer when mouse moves
		controlsTimeoutMouseEnter: 2500,
		// Time in ms to trigger the timer when mouse leaves
		controlsTimeoutMouseLeave: 1000,
		// Time in ms to hide menu on when mouse leaves
		menuTimeoutMouseLeave: 500,
		// force iPad's native controls
		iPadUseNativeControls: false,
		// force iPhone's native controls
		iPhoneUseNativeControls: false,
		// force Android's native controls
		AndroidUseNativeControls: false,
		// features to show
		features: ['playpause','current','progress','duration','tracks','volume','fullscreen'],
		// only for dynamic
		isVideo: true,
		// stretching modes (auto, fill, responsive, none)
		stretching: 'auto',
		// turns keyboard support on and off for this instance
		enableKeyboard: true,
		// when this player starts, it will pause other players
		pauseOtherPlayers: true,
		// array of keyboard actions such as play pause
		keyActions: [
				{
						keys: [
								32, // SPACE
								179 // GOOGLE play/pause button
								 ],
						action: function(player, media, key, event) {

							if (!mejs.MediaFeatures.isFirefox) {
								if (media.paused || media.ended) {
									media.play();
								} else {
									media.pause();
								}
							}
						}
				},
				{
						keys: [38], // UP
						action: function(player, media, key, event) {
								player.container.find('.mejs-volume-slider').css('display','block');
								if (player.isVideo) {
										player.showControls();
										player.startControlsTimer();
								}

								var newVolume = Math.min(media.volume + 0.1, 1);
								media.setVolume(newVolume);
						}
				},
				{
						keys: [40], // DOWN
						action: function(player, media, key, event) {
								player.container.find('.mejs-volume-slider').css('display','block');
								if (player.isVideo) {
										player.showControls();
										player.startControlsTimer();
								}

								var newVolume = Math.max(media.volume - 0.1, 0);
								media.setVolume(newVolume);
						}
				},
				{
						keys: [
								37, // LEFT
								227 // Google TV rewind
						],
						action: function(player, media, key, event) {
								if (!isNaN(media.duration) && media.duration > 0) {
										if (player.isVideo) {
												player.showControls();
												player.startControlsTimer();
										}

										// 5%
										var newTime = Math.max(media.currentTime - player.options.defaultSeekBackwardInterval(media), 0);
										media.setCurrentTime(newTime);
								}
						}
				},
				{
						keys: [
								39, // RIGHT
								228 // Google TV forward
						],
						action: function(player, media, key, event) {
								if (!isNaN(media.duration) && media.duration > 0) {
										if (player.isVideo) {
												player.showControls();
												player.startControlsTimer();
										}

										// 5%
										var newTime = Math.min(media.currentTime + player.options.defaultSeekForwardInterval(media), media.duration);
										media.setCurrentTime(newTime);
								}
						}
				},
				{
						keys: [
								33, // PAGE UP
						],
						action: function(player, media) {
							var newTime = media.currentTime + player.options.defaultJumpBackwardInterval(media);
							constrainedSeekTo(player, media, newTime);
						}
				},
				{
						keys: [
								34, // PAGE DOWN
						],
						action: function(player, media) {
							var newTime = media.currentTime + player.options.defaultJumpForwardInterval(media);
							constrainedSeekTo(player, media, newTime);
						}
				},
				{
						keys: [70], // F
						action: function(player, media, key, event) {
								if (typeof player.enterFullScreen != 'undefined') {
										if (player.isFullScreen) {
												player.exitFullScreen();
										} else {
												player.enterFullScreen();
										}
								}
						}
				},
				{
						keys: [77], // M
						action: function(player, media, key, event) {
								player.container.find('.mejs-volume-slider').css('display','block');
								if (player.isVideo) {
										player.showControls();
										player.startControlsTimer();
								}
								if (player.media.muted) {
										player.setMuted(false);
								} else {
										player.setMuted(true);
								}
						}
				}
		]
	};

	mejs.mepIndex = 0;

	mejs.players = {};

	// wraps a MediaElement object in player controls
	mejs.MediaElementPlayer = function(node, o) {
		// enforce object, even without "new" (via John Resig)
		if ( !(this instanceof mejs.MediaElementPlayer) ) {
			return new mejs.MediaElementPlayer(node, o);
		}

		var t = this;

		// these will be reset after the MediaElement.success fires
		t.$media = t.$node = $(node);
		t.node = t.media = t.$media[0];

		if(!t.node) {
			return;
		}

		// check for existing player
		if (typeof t.node.player != 'undefined') {
			return t.node.player;
		}


		// try to get options from data-mejsoptions
		if (typeof o == 'undefined') {
			o = t.$node.data('mejsoptions');
		}

		// extend default options
		t.options = $.extend({},mejs.MepDefaults,o);

		if (!t.options.timeFormat) {
			// Generate the time format according to options
			t.options.timeFormat = 'mm:ss';
			if (t.options.alwaysShowHours) {
				t.options.timeFormat = 'hh:mm:ss';
			}
			if (t.options.showTimecodeFrameCount) {
				t.options.timeFormat += ':ff';
			}
		}

		mejs.Utility.calculateTimeFormat(0, t.options, t.options.framesPerSecond || 25);

		// unique ID
		t.id = 'mep_' + mejs.mepIndex++;

		// add to player array (for focus events)
		mejs.players[t.id] = t;

		// start up
		t.init();

		return t;
	};

	// actual player
	mejs.MediaElementPlayer.prototype = {

		hasFocus: false,

		controlsAreVisible: true,

		init: function() {

			var
				t = this,
				mf = mejs.MediaFeatures,
				// options for MediaElement (shim)
				meOptions = $.extend(true, {}, t.options, {
					success: function(media, domNode) { t.meReady(media, domNode); },
					error: function(e) { t.handleError(e);}
				}),
				tagName = t.media.tagName.toLowerCase();

			t.isDynamic = (tagName !== 'audio' && tagName !== 'video');

			if (t.isDynamic) {
				// get video from src or href?
				t.isVideo = t.options.isVideo;
			} else {
				t.isVideo = (tagName !== 'audio' && t.options.isVideo);
			}

			// use native controls in iPad, iPhone, and Android
			if ((mf.isiPad && t.options.iPadUseNativeControls) || (mf.isiPhone && t.options.iPhoneUseNativeControls)) {

				// add controls and stop
				t.$media.attr('controls', 'controls');

				// attempt to fix iOS 3 bug
				//t.$media.removeAttr('poster');
								// no Issue found on iOS3 -ttroxell

				// override Apple's autoplay override for iPads
				if (mf.isiPad && t.media.getAttribute('autoplay') !== null) {
					t.play();
				}

			} else if (mf.isAndroid && t.options.AndroidUseNativeControls) {

				// leave default player

			} else if (t.isVideo || (!t.isVideo && t.options.features.length)) {

				// DESKTOP: use MediaElementPlayer controls

				// remove native controls
				t.$media.removeAttr('controls');
				var videoPlayerTitle = t.isVideo ?
					mejs.i18n.t('mejs.video-player') : mejs.i18n.t('mejs.audio-player');

				if (t.options.titleText) {
					videoPlayerTitle = t.options.titleText;
				}

				// insert description for screen readers
				$('<span class="mejs-offscreen">').text(videoPlayerTitle).insertBefore(t.$media);
				// build container
				t.container =
					$('<div id="' + t.id + '" class="mejs-container ' + (mejs.MediaFeatures.svgAsImg ? 'svg' : 'no-svg') +
					  '" tabindex="0" role="application">'+
						'<div class="mejs-inner">'+
							'<div class="mejs-mediaelement"></div>'+
							'<div class="mejs-layers"></div>'+
							'<div class="mejs-controls"></div>'+
							'<div class="mejs-clear"></div>'+
						'</div>' +
					'</div>')
          .attr('aria-label', videoPlayerTitle)
					.addClass(t.$media[0].className)
					.insertBefore(t.$media)
					.focus(function ( e ) {
						if( !t.controlsAreVisible && !t.hasFocus && t.controlsEnabled) {
							t.showControls(true);
							// In versions older than IE11, the focus causes the playbar to be displayed
							// if user clicks on the Play/Pause button in the control bar once it attempts
							// to hide it
							if (!t.hasMsNativeFullScreen) {
								// If e.relatedTarget appears before container, send focus to play button,
								// else send focus to last control button.
								var btnSelector = '.mejs-playpause-button > button';

								if (mejs.Utility.isNodeAfter(e.relatedTarget, t.container[0])) {
									btnSelector = '.mejs-controls .mejs-button:last-child > button';
								}

								var button = t.container.find(btnSelector);
								button.focus();
							}
						}
					});

				// When no elements in controls, hide bar completely
				if (!t.options.features.length) {
					t.container.css('background', 'transparent').find('.mejs-controls').hide();
				}
 
				if (t.isVideo && t.options.stretching === 'fill' && !t.container.parent('mejs-fill-container').length) {
					// outer container
					t.outerContainer = t.$media.parent();
					t.container.wrap('<div class="mejs-fill-container"/>');
				}

				// add classes for user and content
				t.container.addClass(
					(mf.isAndroid ? 'mejs-android ' : '') +
					(mf.isiOS ? 'mejs-ios ' : '') +
					(mf.isiPad ? 'mejs-ipad ' : '') +
					(mf.isiPhone ? 'mejs-iphone ' : '') +
					(t.isVideo ? 'mejs-video ' : 'mejs-audio ')
				);


				// move the <video/video> tag into the right spot
				t.container.find('.mejs-mediaelement').append(t.$media);

				// needs to be assigned here, after iOS remap
				t.node.player = t;

				// find parts
				t.controls = t.container.find('.mejs-controls');
				t.layers = t.container.find('.mejs-layers');

				// determine the size

				/* size priority:
					(1) videoWidth (forced),
					(2) style="width;height;"
					(3) width attribute,
					(4) defaultVideoWidth (for unspecified cases)
				*/

				var tagType = (t.isVideo ? 'video' : 'audio'),
					capsTagName = tagType.substring(0,1).toUpperCase() + tagType.substring(1);



				if (t.options[tagType + 'Width'] > 0 || t.options[tagType + 'Width'].toString().indexOf('%') > -1) {
					t.width = t.options[tagType + 'Width'];
				} else if (t.media.style.width !== '' && t.media.style.width !== null) {
					t.width = t.media.style.width;
				} else if (t.media.getAttribute('width') !== null) {
					t.width = t.$media.attr('width');
				} else {
					t.width = t.options['default' + capsTagName + 'Width'];
				}

				if (t.options[tagType + 'Height'] > 0 || t.options[tagType + 'Height'].toString().indexOf('%') > -1) {
					t.height = t.options[tagType + 'Height'];
				} else if (t.media.style.height !== '' && t.media.style.height !== null) {
					t.height = t.media.style.height;
				} else if (t.$media[0].getAttribute('height') !== null) {
					t.height = t.$media.attr('height');
				} else {
					t.height = t.options['default' + capsTagName + 'Height'];
				}

				// set the size, while we wait for the plugins to load below
				t.setPlayerSize(t.width, t.height);

				// create MediaElementShim
				meOptions.pluginWidth = t.width;
				meOptions.pluginHeight = t.height;
			}
			// Hide media completely for audio that doesn't have any features
			else if (!t.isVideo && !t.options.features.length) {
				t.$media.hide();
			}

			// create MediaElement shim
			mejs.MediaElement(t.$media[0], meOptions);

			if (typeof(t.container) !== 'undefined' && t.options.features.length && t.controlsAreVisible) {
				// controls are shown when loaded
				t.container.trigger('controlsshown');
			}
		},

		showControls: function(doAnimation) {
			var t = this;

			doAnimation = typeof doAnimation == 'undefined' || doAnimation;

			if (t.controlsAreVisible)
				return;

			if (doAnimation) {
				t.controls
					.removeClass('mejs-offscreen')
					.stop(true, true).fadeIn(200, function() {
						t.controlsAreVisible = true;
						t.container.trigger('controlsshown');
					});

				// any additional controls people might add and want to hide
				t.container.find('.mejs-control')
					.removeClass('mejs-offscreen')
					.stop(true, true).fadeIn(200, function() {t.controlsAreVisible = true;});

			} else {
				t.controls
					.removeClass('mejs-offscreen')
					.css('display','block');

				// any additional controls people might add and want to hide
				t.container.find('.mejs-control')
					.removeClass('mejs-offscreen')
					.css('display','block');

				t.controlsAreVisible = true;
				t.container.trigger('controlsshown');
			}

			t.setControlsSize();

		},

		hideControls: function(doAnimation) {
			var t = this;

			doAnimation = typeof doAnimation == 'undefined' || doAnimation;

			if (!t.controlsAreVisible || t.options.alwaysShowControls || t.keyboardAction || t.media.paused || t.media.ended)
				return;

			if (doAnimation) {
				// fade out main controls
				t.controls.stop(true, true).fadeOut(200, function() {
					$(this)
						.addClass('mejs-offscreen')
						.css('display','block');

					t.controlsAreVisible = false;
					t.container.trigger('controlshidden');
				});

				// any additional controls people might add and want to hide
				t.container.find('.mejs-control').stop(true, true).fadeOut(200, function() {
					$(this)
						.addClass('mejs-offscreen')
						.css('display','block');
				});
			} else {

				// hide main controls
				t.controls
					.addClass('mejs-offscreen')
					.css('display','block');

				// hide others
				t.container.find('.mejs-control')
					.addClass('mejs-offscreen')
					.css('display','block');

				t.controlsAreVisible = false;
				t.container.trigger('controlshidden');
			}
		},

		controlsTimer: null,

		startControlsTimer: function(timeout) {

			var t = this;

			timeout = typeof timeout != 'undefined' ? timeout : t.options.controlsTimeoutDefault;

			t.killControlsTimer('start');

			t.controlsTimer = setTimeout(function() {
				//
				t.hideControls();
				t.killControlsTimer('hide');
			}, timeout);
		},

		killControlsTimer: function(src) {

			var t = this;

			if (t.controlsTimer !== null) {
				clearTimeout(t.controlsTimer);
				delete t.controlsTimer;
				t.controlsTimer = null;
			}
		},

		controlsEnabled: true,

		disableControls: function() {
			var t= this;

			t.killControlsTimer();
			t.hideControls(false);
			this.controlsEnabled = false;
		},

		enableControls: function() {
			var t= this;

			t.showControls(false);

			t.controlsEnabled = true;
		},

		// Sets up all controls and events
		meReady: function(media, domNode) {


			var t = this,
				mf = mejs.MediaFeatures,
				autoplayAttr = domNode.getAttribute('autoplay'),
				autoplay = !(typeof autoplayAttr == 'undefined' || autoplayAttr === null || autoplayAttr === 'false'),
				featureIndex,
				feature;

			// make sure it can't create itself again if a plugin reloads
			if (t.created) {
				return;
			} else {
				t.created = true;
			}

			t.media = media;
			t.domNode = domNode;

			if (!(mf.isAndroid && t.options.AndroidUseNativeControls) && !(mf.isiPad && t.options.iPadUseNativeControls) && !(mf.isiPhone && t.options.iPhoneUseNativeControls)) {

				// In the event that no features are specified for audio,
				// create only MediaElement instance rather than
				// doing all the work to create a full player
				if (!t.isVideo && !t.options.features.length) {

					// force autoplay for HTML5
					if (autoplay && media.pluginType == 'native') {
						t.play();
					}


					if (t.options.success) {

						if (typeof t.options.success == 'string') {
							window[t.options.success](t.media, t.domNode, t);
						} else {
							t.options.success(t.media, t.domNode, t);
						}
					}

					return;
				}

				// two built in features
				t.buildposter(t, t.controls, t.layers, t.media);
				t.buildkeyboard(t, t.controls, t.layers, t.media);
				t.buildoverlays(t, t.controls, t.layers, t.media);

				// grab for use by features
				t.findTracks();

				// add user-defined features/controls
				for (featureIndex in t.options.features) {
					feature = t.options.features[featureIndex];
					if (t['build' + feature]) {
						try {
							t['build' + feature](t, t.controls, t.layers, t.media);
						} catch (e) {
							// TODO: report control error
							//throw e;
							
							
						}
					}
				}

				t.container.trigger('controlsready');

				// reset all layers and controls
				t.setPlayerSize(t.width, t.height);
				t.setControlsSize();


				// controls fade
				if (t.isVideo) {

					if (mejs.MediaFeatures.hasTouch && !t.options.alwaysShowControls) {

						// for touch devices (iOS, Android)
						// show/hide without animation on touch

						t.$media.bind('touchstart', function() {

							// toggle controls
							if (t.controlsAreVisible) {
								t.hideControls(false);
							} else {
								if (t.controlsEnabled) {
									t.showControls(false);
								}
							}
						});

					} else {

						// create callback here since it needs access to current
						// MediaElement object
						t.clickToPlayPauseCallback = function() {
							//

							if (t.options.clickToPlayPause) {
								if (t.media.paused) {
									t.play();
								} else {
									t.pause();
								}

								var button = t.$media.closest('.mejs-container').find('.mejs-overlay-button'),
									pressed = button.attr('aria-pressed');
								button.attr('aria-pressed', !pressed);
							}
						};

						// click to play/pause
						t.media.addEventListener('click', t.clickToPlayPauseCallback, false);

						// show/hide controls
						t.container
							.bind('mouseenter', function () {
								if (t.controlsEnabled) {
									if (!t.options.alwaysShowControls ) {
										t.killControlsTimer('enter');
										t.showControls();
										t.startControlsTimer(t.options.controlsTimeoutMouseEnter);
									}
								}
							})
							.bind('mousemove', function() {
								if (t.controlsEnabled) {
									if (!t.options.alwaysShowControls) {
										t.showControls();
										t.startControlsTimer(t.options.controlsTimeoutMouseEnter);
									}
								}
							})
							.bind('mouseleave', function () {
								if (t.controlsEnabled) {
									if (!t.media.paused && !t.options.alwaysShowControls) {
										t.startControlsTimer(t.options.controlsTimeoutMouseLeave);
									}
								}
							});

						t.controls.on('focusin', function () {
							if (t.controlsEnabled) {
								if (!t.options.alwaysShowControls) {
									t.showControls();
								}
							}
            });
					}

					if(t.options.hideVideoControlsOnLoad) {
						t.hideControls(false);
					}

					// check for autoplay
					if (autoplay && !t.options.alwaysShowControls) {
						t.hideControls();
					}

					// resizer
					if (t.options.enableAutosize) {
						t.media.addEventListener('loadedmetadata', function(e) {
							// if the <video height> was not set and the options.videoHeight was not set
							// then resize to the real dimensions
							if (t.options.videoHeight <= 0 && t.domNode.getAttribute('height') === null && !isNaN(e.target.videoHeight)) {
								t.setPlayerSize(e.target.videoWidth, e.target.videoHeight);
								t.setControlsSize();
								t.media.setVideoSize(e.target.videoWidth, e.target.videoHeight);
							}
						}, false);
					}
				}

				// EVENTS

				// FOCUS: when a video starts playing, it takes focus from other players (possibly pausing them)
				t.media.addEventListener('play', function() {
					var playerIndex;

					// go through all other players
					for (playerIndex in mejs.players) {
						var p = mejs.players[playerIndex];
						if (p.id != t.id && t.options.pauseOtherPlayers && !p.paused && !p.ended) {
							p.pause();
						}
						p.hasFocus = false;
					}

					t.hasFocus = true;
				},false);


				// ended for all
				t.media.addEventListener('ended', function (e) {
					if(t.options.autoRewind) {
						try{
							t.media.setCurrentTime(0);
							// Fixing an Android stock browser bug, where "seeked" isn't fired correctly after ending the video and jumping to the beginning
							window.setTimeout(function(){
								$(t.container).find('.mejs-overlay-loading').parent().hide();
							}, 20);
						} catch (exp) {

						}
					}
					if (t.media.pluginType === 'youtube') {
						t.media.stop();
					} else {
						t.media.pause();
					}

					if (t.setProgressRail) {
						t.setProgressRail();
					}
					if (t.setCurrentRail) {
						t.setCurrentRail();
					}

					if (t.options.loop) {
						t.play();
					} else if (!t.options.alwaysShowControls && t.controlsEnabled) {
						t.showControls();
					}
				}, false);

				// resize on the first play
				t.media.addEventListener('loadedmetadata', function() {

					mejs.Utility.calculateTimeFormat(t.duration, t.options, t.options.framesPerSecond || 25);

					if (t.updateDuration) {
						t.updateDuration();
					}
					if (t.updateCurrent) {
						t.updateCurrent();
					}

					if (!t.isFullScreen) {
						t.setPlayerSize(t.width, t.height);
						t.setControlsSize();
					}
				}, false);

				// Only change the time format when necessary
				var duration = null;
				t.media.addEventListener('timeupdate',function() {
					if (duration !== this.duration) {
						duration = this.duration;
						mejs.Utility.calculateTimeFormat(duration, t.options, t.options.framesPerSecond || 25);
						
						// make sure to fill in and resize the controls (e.g., 00:00 => 01:13:15
						if (t.updateDuration) {
							t.updateDuration();
						}
						if (t.updateCurrent) {
							t.updateCurrent();
						}
						t.setControlsSize();
						
					}
				}, false);

				t.container.focusout(function (e) {
					if( e.relatedTarget ) { //FF is working on supporting focusout https://bugzilla.mozilla.org/show_bug.cgi?id=687787
						var $target = $(e.relatedTarget);
						if (t.keyboardAction && $target.parents('.mejs-container').length === 0) {
							t.keyboardAction = false;
							if (t.isVideo && !t.options.alwaysShowControls) {
								t.hideControls(true);
							}

						}
					}
				});

				// webkit has trouble doing this without a delay
				setTimeout(function () {
					t.setPlayerSize(t.width, t.height);
					t.setControlsSize();
				}, 50);

				// adjust controls whenever window sizes (used to be in fullscreen only)
				t.globalBind('resize', function() {

					// don't resize for fullscreen mode
					if ( !(t.isFullScreen || (mejs.MediaFeatures.hasTrueNativeFullScreen && document.webkitIsFullScreen)) ) {
						t.setPlayerSize(t.width, t.height);
					}

					// always adjust controls
					t.setControlsSize();
				});

				// This is a work-around for a bug in the YouTube iFrame player, which means
				// we can't use the play() API for the initial playback on iOS or Android;
				// user has to start playback directly by tapping on the iFrame. Due to changes
				// in the Chrome 72 autoplay policy, this mitigation was enabled for all browsers
				if (t.media.pluginType == 'youtube') {
					t.container.find('.mejs-overlay-play').hide();
					t.container.find('.mejs-poster').hide();
				}
			}

			// force autoplay for HTML5
			if (autoplay && media.pluginType == 'native') {
				t.play();
			}


			if (t.options.success) {

				if (typeof t.options.success == 'string') {
					window[t.options.success](t.media, t.domNode, t);
				} else {
					t.options.success(t.media, t.domNode, t);
				}
			}
		},

		handleError: function(e) {
			var t = this;

			if (t.controls) {
				t.controls.hide();
			}

			// Tell user that the file cannot be played
			if (t.options.error) {
				t.options.error(e);
			}
		},

		setPlayerSize: function(width,height) {
			var t = this;

			if( !t.options.setDimensions ) {
				return false;
			}

			if (typeof width != 'undefined') {
				t.width = width;
			}

			if (typeof height != 'undefined') {
				t.height = height;
			}
 
			// check stretching modes
			switch (t.options.stretching) {
				case 'fill':
					// The 'fill' effect only makes sense on video; for audio we will set the dimensions
					if (t.isVideo) {
						this.setFillMode();
					} else {
						this.setDimensions(t.width, t.height);
					}
					break;
				case 'responsive':
					this.setResponsiveMode();
					break;
				case 'none':
					this.setDimensions(t.width, t.height);
					break;
				// This is the 'auto' mode
				default:
					if (this.hasFluidMode() === true) {
						this.setResponsiveMode();
					} else {
						this.setDimensions(t.width, t.height);
					}
					break;
			}
		},
 
		hasFluidMode: function() {
			var t = this;
	 
			// detect 100% mode - use currentStyle for IE since css() doesn't return percentages
			return (t.height.toString().indexOf('%') > 0 || (t.$node.css('max-width') !== 'none' && t.$node.css('max-width') !== 't.width') || (t.$node[0].currentStyle && t.$node[0].currentStyle.maxWidth === '100%'));
		},
 
		setResponsiveMode: function() {
			var t = this;
		
			// do we have the native dimensions yet?
			var nativeWidth = (function() {
				if (t.isVideo) {
					if (t.media.videoWidth && t.media.videoWidth > 0) {
						return t.media.videoWidth;
					} else if (t.media.getAttribute('width') !== null) {
						return t.media.getAttribute('width');
					} else {
						return t.options.defaultVideoWidth;
					}
				} else {
					return t.options.defaultAudioWidth;
				}
			})();
		
			var nativeHeight = (function() {
				if (t.isVideo) {
					if (t.media.videoHeight && t.media.videoHeight > 0) {
						return t.media.videoHeight;
					} else if (t.media.getAttribute('height') !== null) {
						return t.media.getAttribute('height');
					} else {
						return t.options.defaultVideoHeight;
					}
				} else {
					return t.options.defaultAudioHeight;
				}
			})();
		
			var parentWidth = t.container.parent().closest(':visible').width(),
			parentHeight = t.container.parent().closest(':visible').height(),
			newHeight = t.isVideo || !t.options.autosizeProgress ? parseInt(parentWidth * nativeHeight/nativeWidth, 10) : nativeHeight;
			
			// When we use percent, the newHeight can't be calculated so we get the container height
			if (isNaN(newHeight) || ( parentHeight !== 0 && newHeight > parentHeight && parentHeight > nativeHeight)) {
				newHeight = parentHeight;
			}
		
			if (t.container.parent().length > 0 && t.container.parent()[0].tagName.toLowerCase() === 'body') { // && t.container.siblings().count == 0) {
				parentWidth = $(window).width();
				newHeight = $(window).height();
			}
		
			if ( newHeight && parentWidth ) {
			
				// set outer container size
				t.container
					.width(parentWidth)
					.height(newHeight);
				
				// set native <video> or <audio> and shims
				t.$media.add(t.container.find('.mejs-shim'))
					.width('100%')
					.height('100%');
				
				// if shim is ready, send the size to the embeded plugin
				if (t.isVideo) {
					if (t.media.setVideoSize) {
						t.media.setVideoSize(parentWidth, newHeight);
					}
				}
		
				// set the layers
				t.layers.children('.mejs-layer')
					.width('100%')
					.height('100%');
			}
		},
 
		setFillMode: function() {
			var t = this,
				parent = t.outerContainer;
 
			if (!parent.width()) {
				parent.height(t.$media.width());
			}
 
			if (!parent.height()) {
				parent.height(t.$media.height());
			}
 
			var parentWidth = parent.width(),
				parentHeight = parent.height();
			
			t.setDimensions('100%', '100%');
			
			// This prevents an issue when displaying poster
			t.container.find('.mejs-poster img').css('display', 'block');
			
			targetElement = t.container.find('object, embed, iframe, video');
			
			// calculate new width and height
			var initHeight = t.height,
				initWidth = t.width,
				// scale to the target width
				scaleX1 = parentWidth,
				scaleY1 = (initHeight * parentWidth) / initWidth,
				// scale to the target height
				scaleX2 = (initWidth * parentHeight) / initHeight,
				scaleY2 = parentHeight,
				// now figure out which one we should use
				bScaleOnWidth = !(scaleX2 > parentWidth),
				finalWidth = bScaleOnWidth ? Math.floor(scaleX1) : Math.floor(scaleX2),
				finalHeight = bScaleOnWidth ? Math.floor(scaleY1) : Math.floor(scaleY2);
			
			if (bScaleOnWidth) {
				targetElement.height(finalHeight).width(parentWidth);
				if (t.media.setVideoSize) {
					t.media.setVideoSize(parentWidth, finalHeight);
				}
			} else {
				targetElement.height(parentHeight).width(finalWidth);
				if (t.media.setVideoSize) {
					t.media.setVideoSize(finalWidth, parentHeight);
				}
			}
			
			targetElement.css({
				'margin-left': Math.floor((parentWidth - finalWidth) / 2),
				'margin-top': 0
			});
		},
	 
		setDimensions: function(width, height) {
			var t = this;
			
			t.container
				.width(width)
				.height(height);
			
			t.layers.children('.mejs-layer')
				.width(width)
				.height(height);
		},

		setControlsSize: function() {
			var t = this,
				usedWidth = 0,
				railWidth = 0,
				rail = t.controls.find('.mejs-time-rail'),
				total = t.controls.find('.mejs-time-total'),
				others = rail.siblings().filter(':visible'), // don't include `display: none` controls when sizing
				lastControl = others.last(),
				lastControlPosition = null,
				avoidAutosizeProgress = t.options && !t.options.autosizeProgress;

			// skip calculation if hidden
			if (!t.container.is(':visible') || !rail.length || !rail.is(':visible')) {
				return;
			}

			// allow the size to come from custom CSS
			if (avoidAutosizeProgress) {
				// Also, frontends devs can be more flexible
				// due the opportunity of absolute positioning.
				railWidth = parseInt(rail.css('width'), 10);
			}

			// attempt to autosize
			if (railWidth === 0 || !railWidth) {

				// find the size of all the other controls besides the rail
				others.each(function() {
					var $this = $(this);
					if ($this.css('position') != 'absolute') {
						usedWidth += $(this).outerWidth(true);
					}
				});

				// fit the rail into the remaining space
				railWidth = t.controls.width() - usedWidth - (rail.outerWidth(true) - rail.width());
			}

			// resize the rail,
			// but then check if the last control (say, the fullscreen button) got pushed down
			// this often happens when zoomed
			do {
				// outer area
				// we only want to set an inline style with the width of the rail
				// if we're trying to autosize.
				if (!avoidAutosizeProgress) {
					rail.width(railWidth);
				}

				// dark space
				total.width(railWidth - (total.outerWidth(true) - total.width()));

				if (lastControl.css('position') != 'absolute') {
					lastControlPosition = lastControl.length ? lastControl.position() : null;
					railWidth--;
				}
			} while (lastControlPosition !== null && lastControlPosition.top.toFixed(2) > 0 && railWidth > 0);

			t.container.trigger('controlsresize');
		},


		buildposter: function(player, controls, layers, media) {
			var t = this,
				poster =
				$('<div class="mejs-poster mejs-layer">' +
				'</div>')
					.appendTo(layers),
				posterUrl = player.$media.attr('poster');

			// prioriy goes to option (this is useful if you need to support iOS 3.x (iOS completely fails with poster)
			if (player.options.poster !== '') {
				posterUrl = player.options.poster;
			}

			// second, try the real poster
			if ( posterUrl ) {
				t.setPoster(posterUrl);
			} else {
				poster.hide();
			}

			media.addEventListener('play',function() {
				if (player.options.hidePosterOnPlay) { poster.hide(); }
			}, false);

			if(player.options.showPosterWhenEnded && player.options.autoRewind){
				media.addEventListener('ended',function() {
					poster.show();
				}, false);
			}
		},

		setPoster: function(url) {
			var t = this,
				posterDiv = t.container.find('.mejs-poster'),
				posterImg = posterDiv.find('img');

			if (posterImg.length === 0) {
				posterImg = $('<img width="100%" height="100%" alt="" />').appendTo(posterDiv);
			}

			posterImg.attr('src', url);
			posterDiv.css({'background-image' : 'url(' + url + ')'});
		},

		buildoverlays: function(player, controls, layers, media) {
			var t = this;
			if (!player.isVideo)
				return;

			var
			loading =
				$('<div class="mejs-overlay mejs-layer">'+
					'<div class="mejs-overlay-loading"><span></span></div>'+
				'</div>')
				.hide() // start out hidden
				.appendTo(layers),
			error =
				$('<div class="mejs-overlay mejs-layer">'+
					'<div class="mejs-overlay-error"></div>'+
				'</div>')
				.hide() // start out hidden
				.appendTo(layers),
			// this needs to come last so it's on top
			bigPlay =
				$('<div class="mejs-overlay mejs-layer mejs-overlay-play">'+
					'<div class="mejs-overlay-button" role="button" aria-label="' + mejs.i18n.t('mejs.play') + '" aria-pressed="false"></div>'+
				'</div>')
				.appendTo(layers)
				.bind('click', function() {	 // Removed 'touchstart' due issues on Samsung Android devices where a tap on bigPlay started and immediately stopped the video
					if (t.options.clickToPlayPause) {
						if (media.paused) {
							media.play();
						}

						var button = $(this).find('.mejs-overlay-button'),
							pressed = button.attr('aria-pressed');
						button.attr('aria-pressed', !!pressed);
					}
				});

			/*
			if (mejs.MediaFeatures.isiOS || mejs.MediaFeatures.isAndroid) {
				bigPlay.remove();
				loading.remove();
			}
			*/


			// show/hide big play button
			media.addEventListener('play',function() {
				bigPlay.hide();
				loading.hide();
				controls.find('.mejs-time-buffering').hide();
				error.hide();
			}, false);

			media.addEventListener('playing', function() {
				bigPlay.hide();
				loading.hide();
				controls.find('.mejs-time-buffering').hide();
				error.hide();
			}, false);

			media.addEventListener('seeking', function() {
				loading.show();
				controls.find('.mejs-time-buffering').show();
			}, false);

			media.addEventListener('seeked', function() {
				loading.hide();
				controls.find('.mejs-time-buffering').hide();
			}, false);

			media.addEventListener('pause',function() {
				if (!mejs.MediaFeatures.isiPhone) {
					bigPlay.show();
				}
			}, false);

			media.addEventListener('waiting', function() {
				loading.show();
				controls.find('.mejs-time-buffering').show();
			}, false);


			// show/hide loading
			media.addEventListener('loadeddata',function() {
				// for some reason Chrome is firing this event
				//if (mejs.MediaFeatures.isChrome && media.getAttribute && media.getAttribute('preload') === 'none')
				//	return;

				loading.show();
				controls.find('.mejs-time-buffering').show();
				// Firing the 'canplay' event after a timeout which isn't getting fired on some Android 4.1 devices (https://github.com/johndyer/mediaelement/issues/1305)
				if (mejs.MediaFeatures.isAndroid) {
					media.canplayTimeout = window.setTimeout(
						function() {
							if (document.createEvent) {
								var evt = document.createEvent('HTMLEvents');
								evt.initEvent('canplay', true, true);
								return media.dispatchEvent(evt);
							}
						}, 300
					);
				}
			}, false);
			media.addEventListener('canplay',function() {
				loading.hide();
				controls.find('.mejs-time-buffering').hide();
				clearTimeout(media.canplayTimeout); // Clear timeout inside 'loadeddata' to prevent 'canplay' to fire twice
			}, false);

			// error handling
			media.addEventListener('error',function(e) {
				t.handleError(e);
				loading.hide();
				bigPlay.hide();
				error.show();
				error.find('.mejs-overlay-error').html("Error loading this resource");
			}, false);

			media.addEventListener('keydown', function(e) {
				t.onkeydown(player, media, e);
			}, false);
		},

		buildkeyboard: function(player, controls, layers, media) {

				var t = this;

				t.container.keydown(function () {
					t.keyboardAction = true;
				});

				// listen for key presses
				t.globalBind('keydown', function(event) {
					player.hasFocus = $(event.target).closest('.mejs-container').length !== 0
						&& $(event.target).closest('.mejs-keyboard-insulator').length === 0
						&& $(event.target).closest('.mejs-container').attr('id') === player.$media.closest('.mejs-container').attr('id');
					return t.onkeydown(player, media, event);
				});


				// check if someone clicked outside a player region, then kill its focus
				t.globalBind('click', function(event) {
					player.hasFocus = $(event.target).closest('.mejs-container').length !== 0
						&& $(event.target).closest('.mejs-keyboard-insulator').length === 0;
				});

		},
		onkeydown: function(player, media, e) {
			if (player.hasFocus && player.options.enableKeyboard) {
				// find a matching key
				for (var i = 0, il = player.options.keyActions.length; i < il; i++) {
					var keyAction = player.options.keyActions[i];

					for (var j = 0, jl = keyAction.keys.length; j < jl; j++) {
						if (e.keyCode == keyAction.keys[j]) {
							if (typeof(e.preventDefault) == "function") e.preventDefault();
							keyAction.action(player, media, e.keyCode, e);
							return false;
						}
					}
				}
			}

			return true;
		},

		findTracks: function() {
			var t = this,
				tracktags = t.$media.find('track');

			// store for use by plugins
			t.tracks = [];
			tracktags.each(function(index, track) {

				track = $(track);

				t.tracks.push({
					srclang: (track.attr('srclang')) ? track.attr('srclang').toLowerCase() : '',
					src: track.attr('src'),
					kind: track.attr('kind'),
					label: track.attr('label') || '',
					entries: [],
					isLoaded: false
				});
			});
		},
		changeSkin: function(className) {
			this.container[0].className = 'mejs-container ' + className;
			this.setPlayerSize(this.width, this.height);
			this.setControlsSize();
		},
		play: function() {
			this.load();
			this.media.play();
		},
		pause: function() {
			try {
				this.media.pause();
			} catch (e) {}
		},
		load: function() {
			if (!this.isLoaded) {
				this.media.load();
			}

			this.isLoaded = true;
		},
		setMuted: function(muted) {
			this.media.setMuted(muted);
		},
		setCurrentTime: function(time) {
			this.media.setCurrentTime(time);
		},
		getCurrentTime: function() {
			return this.media.currentTime;
		},
		setVolume: function(volume) {
			this.media.setVolume(volume);
		},
		getVolume: function() {
			return this.media.volume;
		},
		setSrc: function(src) {
			var
				t = this;

			// If using YouTube, its API is different to load a specific source
			if (t.media.pluginType === 'youtube') {
				var videoId;

				if (typeof src !== 'string') {
					var i, media;

					for (i=0; i<src.length; i++) {
						media = src[i];
						if (this.canPlayType(media.type)) {
							src = media.src;
							break;
						}
					}
				}

				// youtu.be url from share button
				if (src.lastIndexOf('youtu.be') !== -1) {
					videoId = src.substr(src.lastIndexOf('/') + 1);

					if (videoId.indexOf('?') !== -1) {
						videoId = videoId.substr(0, videoId.indexOf('?'));
					}

				} else {
					// https://www.youtube.com/watch?v=
					var videoIdMatch = src.match(/[?&]v=([^&#]+)|&|#|$/);

					if (videoIdMatch) {
						videoId = videoIdMatch[1];
					}
				}

				if (t.media.getAttribute('autoplay') !== null) {
					t.media.pluginApi.loadVideoById(videoId);
				} else {
					t.media.pluginApi.cueVideoById(videoId);
				}

			}
			else {
				t.media.setSrc(src);
			}
		},
		remove: function() {
			var t = this, featureIndex, feature;

			t.container.prev('.mejs-offscreen').remove();

			// invoke features cleanup
			for (featureIndex in t.options.features) {
				feature = t.options.features[featureIndex];
				if (t['clean' + feature]) {
					try {
						t['clean' + feature](t);
					} catch (e) {
						// TODO: report control error
						//throw e;
						//
						//
					}
				}
			}

			// grab video and put it back in place
			if (!t.isDynamic) {
				t.$media.prop('controls', true);
				// detach events from the video
				// TODO: detach event listeners better than this;
				//		 also detach ONLY the events attached by this plugin!
				t.$node.clone().insertBefore(t.container).show();
				t.$node.remove();
			} else {
				t.$node.insertBefore(t.container);
			}

			if (t.media.pluginType !== 'native') {
				t.media.remove();
			}

			// Remove the player from the mejs.players object so that pauseOtherPlayers doesn't blow up when trying to pause a non existance flash api.
			delete mejs.players[t.id];

			if (typeof t.container == 'object') {
				t.container.remove();
			}
			t.globalUnbind();
			delete t.node.player;
		},
		rebuildtracks: function(){
			var t = this;
			t.findTracks();
			t.buildtracks(t, t.controls, t.layers, t.media);
		},
		resetSize: function(){
			var t = this;
			// webkit has trouble doing this without a delay
			setTimeout(function () {
				//
				t.setPlayerSize(t.width, t.height);
				t.setControlsSize();
			}, 50);
		}
	};

	(function(){
		var rwindow = /^((after|before)print|(before)?unload|hashchange|message|o(ff|n)line|page(hide|show)|popstate|resize|storage)\b/;

		function splitEvents(events, id) {
			// add player ID as an event namespace so it's easier to unbind them all later
			var ret = {d: [], w: []};
			$.each((events || '').split(' '), function(k, v){
				var eventname = v + '.' + id;
				if (eventname.indexOf('.') === 0) {
					ret.d.push(eventname);
					ret.w.push(eventname);
				}
				else {
					ret[rwindow.test(v) ? 'w' : 'd'].push(eventname);
				}
			});
			ret.d = ret.d.join(' ');
			ret.w = ret.w.join(' ');
			return ret;
		}

		mejs.MediaElementPlayer.prototype.globalBind = function(events, data, callback) {
			var t = this;
			var doc = t.node ? t.node.ownerDocument : document;

			events = splitEvents(events, t.id);
			if (events.d) $(doc).bind(events.d, data, callback);
			if (events.w) $(window).bind(events.w, data, callback);
		};

		mejs.MediaElementPlayer.prototype.globalUnbind = function(events, callback) {
			var t = this;
			var doc = t.node ? t.node.ownerDocument : document;

			events = splitEvents(events, t.id);
			if (events.d) $(doc).unbind(events.d, callback);
			if (events.w) $(window).unbind(events.w, callback);
		};
	})();

	// turn into jQuery plugin
	if (typeof $ != 'undefined') {
		$.fn.mediaelementplayer = function (options) {
			if (options === false) {
				this.each(function () {
					var player = $(this).data('mediaelementplayer');
					if (player) {
						player.remove();
					}
					$(this).removeData('mediaelementplayer');
				});
			}
			else {
				this.each(function () {
					$(this).data('mediaelementplayer', new mejs.MediaElementPlayer(this, options));
				});
			}
			return this;
		};


		$(document).ready(function() {
			// auto enable using JSON attribute
			$('.mejs-player').mediaelementplayer();
		});
	}

	// push out to window
	window.MediaElementPlayer = mejs.MediaElementPlayer;

})(mejs.$);

(function($) {

	$.extend(mejs.MepDefaults, {
		playText: '',
		pauseText: ''
	});


	// PLAY/pause BUTTON
	$.extend(MediaElementPlayer.prototype, {
		buildplaypause: function(player, controls, layers, media) {
			var 
				t = this,
				op = t.options,
				playTitle = op.playText ? op.playText : mejs.i18n.t('mejs.play'),
				pauseTitle = op.pauseText ? op.pauseText : mejs.i18n.t('mejs.pause'),
				play =
				$('<div class="mejs-button mejs-playpause-button mejs-play" >' +
					'<button type="button" aria-controls="' + t.id + '" title="' + playTitle + '" aria-label="' + pauseTitle + '"></button>' +
				'</div>')
				.appendTo(controls)
				.click(function(e) {
					e.preventDefault();
				
					if (media.paused) {
						media.play();
					} else {
						media.pause();
					}
					
					return false;
				}),
				play_btn = play.find('button');


			function togglePlayPause(which) {
				if ('play' === which) {
					play.removeClass('mejs-play').addClass('mejs-pause');
					play_btn.attr({
						'title': pauseTitle,
						'aria-label': pauseTitle
					});
				} else {
					play.removeClass('mejs-pause').addClass('mejs-play');
					play_btn.attr({
						'title': playTitle,
						'aria-label': playTitle
					});
				}
			};
			togglePlayPause('pse');

			media.addEventListener('play',function() {
                               if (t.options.playbackRate) {
                                 media.playbackRate = t.options.playbackRate;
                               }
				togglePlayPause('play');
			}, false);
			media.addEventListener('playing',function() {
				togglePlayPause('play');
			}, false);


			media.addEventListener('pause',function() {
                               if (t.options.playbackRate) {
                                 media.playbackRate = t.options.playbackRate;
                               }
				togglePlayPause('pse');
			}, false);
			media.addEventListener('paused',function() {
				togglePlayPause('pse');
			}, false);
			media.addEventListener('unstarted',function() {
				togglePlayPause('pse');
			}, false);
		}
	});
	
})(mejs.$);

(function($) {

	$.extend(mejs.MepDefaults, {
		stopText: 'Stop'
	});

	// STOP BUTTON
	$.extend(MediaElementPlayer.prototype, {
		buildstop: function(player, controls, layers, media) {
			var t = this;

			$('<div class="mejs-button mejs-stop-button mejs-stop">' +
					'<button type="button" aria-controls="' + t.id + '" title="' + t.options.stopText + '" aria-label="' + t.options.stopText + '"></button>' +
				'</div>')
				.appendTo(controls)
				.click(function() {
					if (!media.paused) {
						media.pause();
					}
					if (media.currentTime > 0) {
						media.setCurrentTime(0);
                        media.pause();
						controls.find('.mejs-time-current').width('0px');
						controls.find('.mejs-time-handle').css('left', '0px');
						controls.find('.mejs-time-float-current').html( mejs.Utility.secondsToTimeCode(0, player.options));
						controls.find('.mejs-currenttime').html( mejs.Utility.secondsToTimeCode(0, player.options));
						layers.find('.mejs-poster').show();
					}
				});
		}
	});
	
})(mejs.$);

(function($) {

	$.extend(mejs.MepDefaults, {
		// Enable tooltip that shows time in progress bar
		enableProgressTooltip: true,
		progressHelpText: ''
	});

	// progress/loaded bar
	$.extend(MediaElementPlayer.prototype, {
		buildprogress: function(player, controls, layers, media) {

			var
				t = this,
				mouseIsDown = false,
				mouseIsOver = false,
				lastKeyPressTime = 0,
				startedPaused = false,
				autoRewindInitial = player.options.autoRewind,
				progressTitle = t.options.progressHelpText ? t.options.progressHelpText : mejs.i18n.t('mejs.time-help-text'),
				tooltip = player.options.enableProgressTooltip ? '<span class="mejs-time-float">' +
					'<span class="mejs-time-float-current">00:00</span>' +
					'<span class="mejs-time-float-corner"></span>' +
				'</span>' : "";

			$('<div class="mejs-time-rail">' +
				'<span  class="mejs-time-total mejs-time-slider">' +
				//'<span class="mejs-offscreen">' + progressTitle + '</span>' +
					'<span class="mejs-time-buffering"></span>' +
					'<span class="mejs-time-loaded"></span>' +
					'<span class="mejs-time-current"></span>' +
					'<span class="mejs-time-handle"></span>' +
					 tooltip +
				'</span>' +
			'</div>')
				.appendTo(controls);
			controls.find('.mejs-time-buffering').hide();

			t.total = controls.find('.mejs-time-total');
			t.loaded  = controls.find('.mejs-time-loaded');
			t.current  = controls.find('.mejs-time-current');
			t.handle  = controls.find('.mejs-time-handle');
			t.timefloat  = controls.find('.mejs-time-float');
			t.timefloatcurrent  = controls.find('.mejs-time-float-current');
			t.slider = controls.find('.mejs-time-slider');

			var handleMouseMove = function (e) {

					var offset = t.total.offset(),
						width = t.total.width(),
						percentage = 0,
						newTime = 0,
						pos = 0,
						x;

					// mouse or touch position relative to the object
					if (e.originalEvent && e.originalEvent.changedTouches) {
						x = e.originalEvent.changedTouches[0].pageX;
					} else if (e.changedTouches) { // for Zepto
						x = e.changedTouches[0].pageX;
					} else {
						x = e.pageX;
					}

					if (media.duration) {
						if (x < offset.left) {
							x = offset.left;
						} else if (x > width + offset.left) {
							x = width + offset.left;
						}

						pos = x - offset.left;
						percentage = (pos / width);
						newTime = percentage * media.duration;

						// seek to where the mouse is
						if (mouseIsDown && newTime !== media.currentTime) {
							media.setCurrentTime(newTime);
						}

						// position floating time box
						if (!mejs.MediaFeatures.hasTouch) {
							t.timefloat.css('left', pos);
							t.timefloatcurrent.html( mejs.Utility.secondsToTimeCode(newTime, player.options) );
							t.timefloat.show();
						}
					}
				},
				updateSlider = function (e) {
					t.slider.attr(sliderA11yAttrs(media.duration, media.currentTime));
				},
				restartPlayer = function () {
					var now = new Date();
					if (now - lastKeyPressTime >= 1000) {
						media.play();
					}
				},
				// Accessibility for slider
				sliderA11yAttrs = function (duration, currentSeconds) {
					var timeSliderText = mejs.i18n.t('mejs.time-slider'),
						time = mejs.Utility.secondsToTimeCode(currentSeconds, player.options);

					return {
						'aria-label': timeSliderText,
						'aria-valuemin': 0,
						'aria-valuemax': duration,
						'aria-valuenow': currentSeconds,
						'aria-valuetext': time,
						'role': 'slider',
						'tabindex': 0
					};
				};

			t.slider.attr(sliderA11yAttrs(0, 0)); // initial a11y setup
			t.slider.bind('focus', function (e) {
				player.options.autoRewind = false;
			});

			t.slider.bind('blur', function (e) {
				player.options.autoRewind = autoRewindInitial;
			});

			t.slider.bind('keydown', function (e) {

				if ((new Date() - lastKeyPressTime) >= 1000) {
					startedPaused = media.paused;
				}

				var keyCode = e.keyCode,
					duration = media.duration,
					seekTime = media.currentTime,
					seekForward  = player.options.defaultSeekForwardInterval(media),
					seekBackward = player.options.defaultSeekBackwardInterval(media);
					jumpForward  = player.options.defaultJumpForwardInterval(media),
					jumpBackward = player.options.defaultJumpBackwardInterval(media);

				switch (keyCode) {
					case 37: // left
					case 40: // Down
						seekTime -= seekBackward;
						break;
					case 39: // Right
					case 38: // Up
						seekTime += seekForward;
						break;
					case 33: // Page Up
						seekTime += jumpForward;
						break;
					case 34: // Page Down
						seekTime -= jumpBackward;
						break;
					case 36: // Home
						seekTime = 0;
						break;
					case 35: // end
						seekTime = duration;
						break;
					case 32: // space
					case 13: // enter
						media.paused ? media.play() : media.pause();
						return;
					default:
						return;
				}

				seekTime = seekTime < 0 ? 0 : (seekTime >= duration ? duration : Math.floor(seekTime));
				lastKeyPressTime = new Date();
				if (!startedPaused) {
					media.pause();
				}

				if (seekTime < media.duration && !startedPaused) {
					setTimeout(restartPlayer, 1100);
				}

				media.setCurrentTime(seekTime);

				e.preventDefault();
				e.stopPropagation();
				return false;
			});


			// handle clicks
			//controls.find('.mejs-time-rail').delegate('span', 'click', handleMouseMove);
			t.total
				.bind('mousedown touchstart', function (e) {
					// only handle left clicks or touch
					if (e.which === 1 || e.which === 0) {
						mouseIsDown = true;
						handleMouseMove(e);
						t.globalBind('mousemove.dur touchmove.dur', function(e) {
							handleMouseMove(e);
						});
						t.globalBind('mouseup.dur touchend.dur', function (e) {
							mouseIsDown = false;
							if (typeof t.timefloat !== 'undefined') {
								t.timefloat.hide();
							}
							t.globalUnbind('.dur');
						});
					}
				})
				.bind('mouseenter', function(e) {
					mouseIsOver = true;
					t.globalBind('mousemove.dur', function(e) {
						handleMouseMove(e);
					});
					if (typeof t.timefloat !== 'undefined' && !mejs.MediaFeatures.hasTouch) {
						t.timefloat.show();
					}
				})
				.bind('mouseleave',function(e) {
					mouseIsOver = false;
					if (!mouseIsDown) {
						t.globalUnbind('.dur');
						if (typeof t.timefloat !== 'undefined') {
							t.timefloat.hide();
						}
					}
				});

			// loading
			media.addEventListener('progress', function (e) {
				player.setProgressRail(e);
				player.setCurrentRail(e);
			}, false);

			// current time
			media.addEventListener('timeupdate', function(e) {
				player.setProgressRail(e);
				player.setCurrentRail(e);
				updateSlider(e);
			}, false);

			t.container.on('controlsresize', function(e) {
				player.setProgressRail(e);
				player.setCurrentRail(e);
			});
		},
		setProgressRail: function(e) {

			var
				t = this,
				target = (e !== undefined) ? e.target : t.media,
				percent = null;

			// newest HTML5 spec has buffered array (FF4, Webkit)
			var buffer = target && target.buffered; 
			if (buffer && buffer.length > 0 && buffer.end && target.duration) {
			// account for a real array with multiple values - always read the end of the last buffer
			percent = buffer.end(buffer.length - 1) / target.duration;
			}
			// Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
			// to be anything other than 0. If the byte count is available we use this instead.
			// Browsers that support the else if do not seem to have the bufferedBytes value and
			// should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.
			else if (target && target.bytesTotal !== undefined && target.bytesTotal > 0 && target.bufferedBytes !== undefined) {
				percent = target.bufferedBytes / target.bytesTotal;
			}
			// Firefox 3 with an Ogg file seems to go this way
			else if (e && e.lengthComputable && e.total !== 0) {
				percent = e.loaded / e.total;
			}

			// finally update the progress bar
			if (percent !== null) {
				percent = Math.min(1, Math.max(0, percent));
				// update loaded bar
				if (t.loaded && t.total) {
					t.loaded.width(t.total.width() * percent);
				}
			}
		},
		setCurrentRail: function() {

			var t = this;

			if (t.media.currentTime !== undefined && t.media.duration) {

				// update bar and handle
				if (t.total && t.handle) {
					var
						newWidth = Math.round(t.total.width() * t.media.currentTime / t.media.duration),
						handlePos = newWidth - Math.round(t.handle.outerWidth(true) / 2);

					t.current.width(newWidth);
					t.handle.css('left', handlePos);
				}
			}

		}
	});
})(mejs.$);

(function($) {
	
	// options
	$.extend(mejs.MepDefaults, {
		duration: -1,
		timeAndDurationSeparator: '<span> | </span>'
	});


	// current and duration 00:00 / 00:00
	$.extend(MediaElementPlayer.prototype, {
		buildcurrent: function(player, controls, layers, media) {
			var t = this;
			
			$('<div class="mejs-time" role="timer" aria-live="off">' +
					'<span class="mejs-currenttime">' + 
						mejs.Utility.secondsToTimeCode(0, player.options) +
                    '</span>'+
				'</div>')
			.appendTo(controls);
			
			t.currenttime = t.controls.find('.mejs-currenttime');

			media.addEventListener('timeupdate',function() {
				if (t.controlsAreVisible) {
					player.updateCurrent();
				}

			}, false);
		},


		buildduration: function(player, controls, layers, media) {
			var t = this;
			
			if (controls.children().last().find('.mejs-currenttime').length > 0) {
				$(t.options.timeAndDurationSeparator +
					'<span class="mejs-duration">' + 
						mejs.Utility.secondsToTimeCode(t.options.duration, t.options) +
					'</span>')
					.appendTo(controls.find('.mejs-time'));
			} else {

				// add class to current time
				controls.find('.mejs-currenttime').parent().addClass('mejs-currenttime-container');
				
				$('<div class="mejs-time mejs-duration-container">'+
					'<span class="mejs-duration">' + 
						mejs.Utility.secondsToTimeCode(t.options.duration, t.options) +
					'</span>' +
				'</div>')
				.appendTo(controls);
			}
			
			t.durationD = t.controls.find('.mejs-duration');

			media.addEventListener('timeupdate',function() {
				if (t.controlsAreVisible) {
					player.updateDuration();
				}
			}, false);
		},
		
		updateCurrent:  function() {
			var t = this;
			
			var currentTime = t.media.currentTime;
			
			if (isNaN(currentTime)) {
				currentTime = 0;
			}

			if (t.currenttime) {
				t.currenttime.html(mejs.Utility.secondsToTimeCode(currentTime, t.options));
			}
		},
		
		updateDuration: function() {
			var t = this;
			
			var duration = t.media.duration;
			if (t.options.duration > 0) {
				duration = t.options.duration;
			}
			
			if (isNaN(duration)) {
				duration = 0;
			}

			//Toggle the long video class if the video is longer than an hour.
			t.container.toggleClass("mejs-long-video", duration > 3600);
			
			if (t.durationD && duration > 0) {
				t.durationD.html(mejs.Utility.secondsToTimeCode(duration, t.options));
			}		
		}
	});

})(mejs.$);

(function ($) {

	$.extend(mejs.MepDefaults, {
		muteText: mejs.i18n.t('mejs.mute-toggle'),
		allyVolumeControlText: mejs.i18n.t('mejs.volume-help-text'),
		hideVolumeOnTouchDevices: true,

		audioVolume: 'horizontal',
		videoVolume: 'vertical'
	});

	$.extend(MediaElementPlayer.prototype, {
		buildvolume: function (player, controls, layers, media) {

			// Android and iOS don't support volume controls
			if ((mejs.MediaFeatures.isAndroid || mejs.MediaFeatures.isiOS) && this.options.hideVolumeOnTouchDevices)
				return;

			// prefer `getVolume` accessor to `volume` property
			function getVolume() {
				if (typeof media.getVolume === 'function') {
					return media.getVolume();
				} else {
					return media.volume;
				}
			}

			var t = this,
				mode = (t.isVideo) ? t.options.videoVolume : t.options.audioVolume,
				mute = (mode == 'horizontal') ?

					// horizontal version
					$('<div class="mejs-button mejs-volume-button mejs-mute">' +
						'<button type="button" aria-controls="' + t.id +
						'" title="' + t.options.muteText +
						'" aria-label="' + t.options.muteText +
						'"></button>' +
						'</div>' +
						'<a href="javascript:void(0);" class="mejs-horizontal-volume-slider">' + // outer background
						'<span class="mejs-offscreen">' + t.options.allyVolumeControlText + '</span>' +
						'<div class="mejs-horizontal-volume-total"></div>' + // line background
						'<div class="mejs-horizontal-volume-current"></div>' + // current volume
						'<div class="mejs-horizontal-volume-handle"></div>' + // handle
						'</a>'
					)
					.appendTo(controls) :

					// vertical version
					$('<div class="mejs-button mejs-volume-button mejs-mute">' +
						'<button type="button" aria-controls="' + t.id +
						'" title="' + t.options.muteText +
						'" aria-label="' + t.options.muteText +
						'"></button>' +
						'<a href="javascript:void(0);" class="mejs-volume-slider mejs-offscreen">' + // outer background
						'<span class="mejs-offscreen">' + t.options.allyVolumeControlText + '</span>' +
						'<div class="mejs-volume-total"></div>' + // line background
						'<div class="mejs-volume-current"></div>' + // current volume
						'<div class="mejs-volume-handle"></div>' + // handle
						'</a>' +
						'</div>')
					.appendTo(controls),
				volumeSlider = t.container.find('.mejs-volume-slider, .mejs-horizontal-volume-slider'),
				volumeTotal = t.container.find('.mejs-volume-total, .mejs-horizontal-volume-total'),
				volumeCurrent = t.container.find('.mejs-volume-current, .mejs-horizontal-volume-current'),
				volumeHandle = t.container.find('.mejs-volume-handle, .mejs-horizontal-volume-handle'),

				positionVolumeHandle = function (volume, secondTry) {

					if (!volumeSlider.is(':visible') && typeof secondTry == 'undefined') {
						volumeSlider.show();
						positionVolumeHandle(volume, true);
						volumeSlider.hide();
						return;
					} else if (volumeSlider.hasClass('mejs-offscreen') && typeof secondTry == 'undefined') {
						volumeSlider.removeClass('mejs-offscreen');
						positionVolumeHandle(volume, true);
						volumeSlider.addClass('mejs-offscreen');
						return;
					}

					// correct to 0-1
					volume = Math.max(0, volume);
					volume = Math.min(volume, 1);

					// adjust mute button style
					if (volume === 0) {
						mute.removeClass('mejs-mute').addClass('mejs-unmute');
						mute.children('button').attr('title', mejs.i18n.t('mejs.unmute')).attr('aria-label', mejs.i18n.t('mejs.unmute'));
					} else {
						mute.removeClass('mejs-unmute').addClass('mejs-mute');
						mute.children('button').attr('title', mejs.i18n.t('mejs.mute')).attr('aria-label', mejs.i18n.t('mejs.mute'));
					}

					// top/left of full size volume slider background
					var totalPosition = volumeTotal.position();
					// position slider
					if (mode == 'vertical') {
						var
							// height of the full size volume slider background
							totalHeight = volumeTotal.height(),

							// the new top position based on the current volume
							// 70% volume on 100px height == top:30px
							newTop = totalHeight - (totalHeight * volume);

						// handle
						volumeHandle.css('top', Math.round(totalPosition.top + newTop - (volumeHandle.height() / 2)));

						// show the current visibility
						volumeCurrent.height(totalHeight - newTop);
						volumeCurrent.css('top', totalPosition.top + newTop);
					} else {
						var
							// height of the full size volume slider background
							totalWidth = volumeTotal.width(),

							// the new left position based on the current volume
							newLeft = totalWidth * volume;

						// handle
						volumeHandle.css('left', Math.round(totalPosition.left + newLeft - (volumeHandle.width() / 2)));

						// rezize the current part of the volume bar
						volumeCurrent.width(Math.round(newLeft));
					}
				},
				handleVolumeMove = function (e) {

					var volume = null,
						totalOffset = volumeTotal.offset();

					// calculate the new volume based on the moust position
					if (mode === 'vertical') {

						var
							railHeight = volumeTotal.height(),
							newY = e.pageY - totalOffset.top;

						volume = (railHeight - newY) / railHeight;

						// the controls just hide themselves (usually when mouse moves too far up)
						if (totalOffset.top === 0 || totalOffset.left === 0) {
							return;
						}

					} else {
						var
							railWidth = volumeTotal.width(),
							newX = e.pageX - totalOffset.left;

						volume = newX / railWidth;
					}

					// ensure the volume isn't outside 0-1
					volume = Math.max(0, volume);
					volume = Math.min(volume, 1);

					// position the slider and handle
					positionVolumeHandle(volume);

					// set the media object (this will trigger the volumechanged event)
					if (volume === 0) {
						media.setMuted(true);
					} else {
						media.setMuted(false);
					}
					media.setVolume(volume);
				},
				mouseIsDown = false,
				mouseIsOver = false;

			// SLIDER

			mute
			.hover(function () {
				volumeSlider.removeClass('mejs-offscreen');
				mouseIsOver = true;
			}, function () {
				mouseIsOver = false;

				if (!mouseIsDown && mode == 'vertical') {
					volumeSlider.addClass('mejs-offscreen');
				}
			});

			var updateVolumeSlider = function (e) {

				var volume = Math.floor(getVolume(media) * 100);

				volumeSlider.attr({
					'aria-label': mejs.i18n.t('mejs.volume-slider'),
					'aria-valuemin': 0,
					'aria-valuemax': 100,
					'aria-valuenow': volume,
					'aria-valuetext': volume + '%',
					'role': 'slider',
					'tabindex': 0
				});

			};

			var closeOnFocusOut = mejs.Utility.debounce(function (e) { // Safari triggers focusout multiple times
				// Firefox does NOT support e.relatedTarget to see which element
				// just lost focus, so wait to find the next focused element
				setTimeout(function () {
					var parent = $(document.activeElement).closest('.mejs-mute');
					if (!parent.length) {
						// focus is outside the control; close menu
						if (!mouseIsOver && mode == 'vertical') {
							volumeSlider.addClass('mejs-offscreen');
						}
					}
				}, 0);
			}, 100);

			volumeSlider
			.bind('mouseover', function () {
				mouseIsOver = true;
			})
			.bind('mousedown', function (e) {
				handleVolumeMove(e);
				t.globalBind('mousemove.vol', function (e) {
					handleVolumeMove(e);
				});
				t.globalBind('mouseup.vol', function () {
					mouseIsDown = false;
					t.globalUnbind('.vol');

					if (!mouseIsOver && mode == 'vertical') {
						volumeSlider.addClass('mejs-offscreen');
					}
				});
				mouseIsDown = true;

				return false;
			})
			.bind('keydown', function (e) {
				var keyCode = e.keyCode;
				var volume = getVolume();
				switch (keyCode) {
					case 38: // Up
						volume = Math.min(volume + 0.1, 1);
						break;
					case 40: // Down
						volume = Math.max(0, volume - 0.1);
						break;
					default:
						return true;
				}

				mouseIsDown = false;
				positionVolumeHandle(volume);
				media.setVolume(volume);
				return false;
			})

			// Keyboard input
			.bind('focus', function () {
				volumeSlider.removeClass('mejs-offscreen');
			})

			// close menu when tabbing away
			.on('focusout', closeOnFocusOut);

			// MUTE button
			mute.find('button').click(function () {
				media.setMuted(!media.muted);
			})

			// Keyboard input
			.bind('focus', function () {
				volumeSlider.removeClass('mejs-offscreen');
			})

			// close menu when tabbing away
			.on('focusout', closeOnFocusOut);

			// listen for volume change events from other sources
			media.addEventListener('volumechange', function (e) {
				if (!mouseIsDown) {
					if (media.muted) {
						positionVolumeHandle(0);
						mute.removeClass('mejs-mute').addClass('mejs-unmute');
					} else {
						positionVolumeHandle(getVolume());
						mute.removeClass('mejs-unmute').addClass('mejs-mute');
					}
				}
				updateVolumeSlider(e);
			}, false);

			// mutes the media and sets the volume icon muted if the initial volume is set to 0
			if (player.options.startVolume === 0) {
				media.setMuted(true);
			}

			// shim gets the startvolume as a parameter, but we have to set it on the native <video> and <audio> elements
			if (media.pluginType === 'native') {
				media.setVolume(player.options.startVolume);
			}

			t.container.on('controlsresize', function () {
				if (media.muted) {
					positionVolumeHandle(0);
					mute.removeClass('mejs-mute').addClass('mejs-unmute');
				} else {
					positionVolumeHandle(getVolume());
					mute.removeClass('mejs-unmute').addClass('mejs-mute');
				}
			});
    }
	});

})(mejs.$);

(function($) {

	$.extend(mejs.MepDefaults, {
		usePluginFullScreen: true,
		newWindowCallback: function() { return '';},
		fullscreenText: ''
	});

	$.extend(MediaElementPlayer.prototype, {

		isFullScreen: false,

		isNativeFullScreen: false,

		// Possible modes
		// (1) 'native-native' 	HTML5 video  + browser fullscreen (IE10+, etc.)
		// (2) 'plugin-native' 	plugin video + browser fullscreen (fails in some versions of Firefox)
		// (3) 'fullwindow' 	Full window (retains all UI)
		// usePluginFullScreen = true
		// (4) 'plugin-click' 	Flash 1 - click through with pointer events
		// (5) 'plugin-hover' 	Flash 2 - hover popup in flash (IE6-8)
		fullscreenMode: '',

		buildfullscreen: function(player, controls, layers, media) {

			if (!player.isVideo)
				return;

			// detect on start
			media.addEventListener('loadstart', function() { player.detectFullscreenMode(); });

			// build button
			var t = this,
				hideTimeout = null,
				fullscreenTitle = t.options.fullscreenText ? t.options.fullscreenText : mejs.i18n.t('mejs.fullscreen'),
				fullscreenBtn =
					$('<div class="mejs-button mejs-fullscreen-button">' +
						'<button type="button" aria-controls="' + t.id + '" title="' + fullscreenTitle + '" aria-label="' + fullscreenTitle + '" aria-live="assertive"></button>' +
					'</div>')
					.appendTo(controls)
					.on('click', function() {

						// toggle fullscreen
						var isFullScreen = (mejs.MediaFeatures.hasTrueNativeFullScreen && mejs.MediaFeatures.isFullScreen()) || player.isFullScreen;
	
						if (isFullScreen) {
							player.exitFullScreen();
						} else {
							player.enterFullScreen();
						}
					})
					.on('mouseover', function() {

						// very old browsers with a plugin
						if (t.fullscreenMode == 'plugin-hover') {
							if (hideTimeout !== null) {
								clearTimeout(hideTimeout);
								delete hideTimeout;
							}

							var buttonPos = fullscreenBtn.offset(),
								containerPos = player.container.offset();

							media.positionFullscreenButton(buttonPos.left - containerPos.left, buttonPos.top - containerPos.top, true);
						}

					})
					.on('mouseout', function() {

						if (t.fullscreenMode == 'plugin-hover') {
							if (hideTimeout !== null) {
								clearTimeout(hideTimeout);
								delete hideTimeout;
							}

							hideTimeout = setTimeout(function() {
								media.hideFullscreenButton();
							}, 1500);
						}

					});



			player.fullscreenBtn = fullscreenBtn;

			player.fullscreenBtn.setLabel = function (newLabel) {
				var label = mejs.i18n.t(newLabel);

				player.fullscreenBtn.find('button')
					.attr('aria-label', label)
					.attr('title', label);
			}

			t.globalBind('keydown',function (e) {
				if (e.keyCode == 27 && ((mejs.MediaFeatures.hasTrueNativeFullScreen && mejs.MediaFeatures.isFullScreen()) || t.isFullScreen)) {
					player.exitFullScreen();
				}
			});

			t.normalHeight = 0;
			t.normalWidth = 0;

			// setup native fullscreen event
			if (mejs.MediaFeatures.hasTrueNativeFullScreen) {

				// chrome doesn't alays fire this in an iframe
				var fullscreenChanged = function(e) {
					if (player.isFullScreen) {
						if (mejs.MediaFeatures.isFullScreen()) {
							player.isNativeFullScreen = true;
							// reset the controls once we are fully in full screen
							player.setControlsSize();
						} else {
							player.isNativeFullScreen = false;
							// when a user presses ESC
							// make sure to put the player back into place
							player.exitFullScreen();
						}
					}
				};

				player.globalBind(mejs.MediaFeatures.fullScreenEventName, fullscreenChanged);
			}

		},


		detectFullscreenMode: function() {

			var t = this,
				mode = '',
				features = mejs.MediaFeatures;

			if (features.hasTrueNativeFullScreen && t.media.pluginType === 'native') {
				mode = 'native-native';
			} else if (features.hasTrueNativeFullScreen && t.media.pluginType !== 'native' && !features.hasFirefoxPluginMovingProblem) {
				mode = 'plugin-native';
			} else if (t.usePluginFullScreen) {
				if (mejs.MediaFeatures.supportsPointerEvents) {
					mode = 'plugin-click';
					// this needs some special setup
					t.createPluginClickThrough();
				} else {
					mode = 'plugin-hover';
				}

			} else {
				mode = 'fullwindow';
			}


			t.fullscreenMode = mode;
			return mode;
		},

		isPluginClickThroughCreated: false,

		createPluginClickThrough: function() {

			var t = this;

			// don't build twice
			if (t.isPluginClickThroughCreated) {
				return;
			}

			// allows clicking through the fullscreen button and controls down directly to Flash

			/*
			 When a user puts his mouse over the fullscreen button, we disable the controls so that mouse events can go down to flash (pointer-events)
			 We then put a divs over the video and on either side of the fullscreen button
			 to capture mouse movement and restore the controls once the mouse moves outside of the fullscreen button
			*/

			var fullscreenIsDisabled = false,
				restoreControls = function() {
					if (fullscreenIsDisabled) {
						// hide the hovers
						for (var i in hoverDivs) {
							hoverDivs[i].hide();
						}

						// restore the control bar
						t.fullscreenBtn.css('pointer-events', '');
						t.controls.css('pointer-events', '');

						// prevent clicks from pausing video
						t.media.removeEventListener('click', t.clickToPlayPauseCallback);

						// store for later
						fullscreenIsDisabled = false;
					}
				},
				hoverDivs = {},
				hoverDivNames = ['top', 'left', 'right', 'bottom'],
				i, len,
				positionHoverDivs = function() {
					var fullScreenBtnOffsetLeft = fullscreenBtn.offset().left - t.container.offset().left,
						fullScreenBtnOffsetTop = fullscreenBtn.offset().top - t.container.offset().top,
						fullScreenBtnWidth = fullscreenBtn.outerWidth(true),
						fullScreenBtnHeight = fullscreenBtn.outerHeight(true),
						containerWidth = t.container.width(),
						containerHeight = t.container.height();

					for (i in hoverDivs) {
						hoverDivs[i].css({position: 'absolute', top: 0, left: 0}); //, backgroundColor: '#f00'});
					}

					// over video, but not controls
					hoverDivs['top']
						.width( containerWidth )
						.height( fullScreenBtnOffsetTop );

					// over controls, but not the fullscreen button
					hoverDivs['left']
						.width( fullScreenBtnOffsetLeft )
						.height( fullScreenBtnHeight )
						.css({top: fullScreenBtnOffsetTop});

					// after the fullscreen button
					hoverDivs['right']
						.width( containerWidth - fullScreenBtnOffsetLeft - fullScreenBtnWidth )
						.height( fullScreenBtnHeight )
						.css({top: fullScreenBtnOffsetTop,
							 left: fullScreenBtnOffsetLeft + fullScreenBtnWidth});

					// under the fullscreen button
					hoverDivs['bottom']
						.width( containerWidth )
						.height( containerHeight - fullScreenBtnHeight - fullScreenBtnOffsetTop )
						.css({top: fullScreenBtnOffsetTop + fullScreenBtnHeight});
				};

			t.globalBind('resize', function() {
				positionHoverDivs();
			});


			for (i = 0, len = hoverDivNames.length; i < len; i++) {
				hoverDivs[hoverDivNames[i]] = $('<div class="mejs-fullscreen-hover" />').appendTo(t.container).mouseover(restoreControls).hide();
			}

			// on hover, kill the fullscreen button's HTML handling, allowing clicks down to Flash
			fullscreenBtn.on('mouseover',function() {

				if (!t.isFullScreen) {

					var buttonPos = fullscreenBtn.offset(),
						containerPos = player.container.offset();

					// move the button in Flash into place
					media.positionFullscreenButton(buttonPos.left - containerPos.left, buttonPos.top - containerPos.top, false);

					// allows click through
					t.fullscreenBtn.css('pointer-events', 'none');
					t.controls.css('pointer-events', 'none');

					// restore click-to-play
					t.media.addEventListener('click', t.clickToPlayPauseCallback);

					// show the divs that will restore things
					for (i in hoverDivs) {
						hoverDivs[i].show();
					}

					positionHoverDivs();

					fullscreenIsDisabled = true;
				}

			});

			// restore controls anytime the user enters or leaves fullscreen
			media.addEventListener('fullscreenchange', function(e) {
				t.isFullScreen = !t.isFullScreen;
				// don't allow plugin click to pause video - messes with
				// plugin's controls
				if (t.isFullScreen) {
					t.media.removeEventListener('click', t.clickToPlayPauseCallback);
				} else {
					t.media.addEventListener('click', t.clickToPlayPauseCallback);
				}
				restoreControls();
			});


			// the mouseout event doesn't work on the fullscren button, because we already killed the pointer-events
			// so we use the document.mousemove event to restore controls when the mouse moves outside the fullscreen button

			t.globalBind('mousemove', function(e) {

				// if the mouse is anywhere but the fullsceen button, then restore it all
				if (fullscreenIsDisabled) {

					var fullscreenBtnPos = fullscreenBtn.offset();


					if (e.pageY < fullscreenBtnPos.top || e.pageY > fullscreenBtnPos.top + fullscreenBtn.outerHeight(true) ||
						e.pageX < fullscreenBtnPos.left || e.pageX > fullscreenBtnPos.left + fullscreenBtn.outerWidth(true)
						) {

						fullscreenBtn.css('pointer-events', '');
						t.controls.css('pointer-events', '');

						fullscreenIsDisabled = false;
					}
				}
			});

			t.isPluginClickThroughCreated = true;
		},

		cleanfullscreen: function(player) {
			player.exitFullScreen();
		},

        containerSizeTimeout: null,

		enterFullScreen: function() {

			var t = this;

			if (mejs.MediaFeatures.isiOS && mejs.MediaFeatures.hasiOSFullScreen && typeof t.media.webkitEnterFullscreen === 'function') {
			    t.media.webkitEnterFullscreen();
				return;
			}

			// set it to not show scroll bars so 100% will work
            $(document.documentElement).addClass('mejs-fullscreen');

			// store sizing
			t.normalHeight = t.container.height();
			t.normalWidth = t.container.width();

			// attempt to do true fullscreen
			if (t.fullscreenMode === 'native-native' || t.fullscreenMode === 'plugin-native') {

				mejs.MediaFeatures.requestFullScreen(t.container[0]);

			} else if (t.fullscreeMode == 'fullwindow') {
				// move into position

			}

			// make full size
			t.container
				.addClass('mejs-container-fullscreen')
				.width('100%')
				.height('100%');
				//.css({position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', width: '100%', height: '100%', 'z-index': 1000});

			// Only needed for safari 5.1 native full screen, can cause display issues elsewhere
			// Actually, it seems to be needed for IE8, too
			//if (mejs.MediaFeatures.hasTrueNativeFullScreen) {
				t.containerSizeTimeout = setTimeout(function() {
					t.container.css({width: '100%', height: '100%'});
					t.setControlsSize();
				}, 500);
			//}

			if (t.media.pluginType === 'native') {
				t.$media
					.width('100%')
					.height('100%');
			} else {
				t.container.find('.mejs-shim')
					.width('100%')
					.height('100%');

				setTimeout(function() {
					var win = $(window),
						winW = win.width(),
						winH = win.height();

					t.media.setVideoSize(winW,winH);
				}, 500);
			}

			t.layers.children('div')
				.width('100%')
				.height('100%');

			if (t.fullscreenBtn) {
				t.fullscreenBtn
					.removeClass('mejs-fullscreen')
					.addClass('mejs-unfullscreen');
			}

			t.setControlsSize();
			t.isFullScreen = true;

			var zoomFactor = Math.min(screen.width / t.width, screen.height / t.height);
			t.container.find('.mejs-captions-text').css('font-size', zoomFactor * 100 + '%');
			t.container.find('.mejs-captions-text').css('line-height', 'normal');
			t.container.find('.mejs-captions-position').css('bottom', '45px');

			t.fullscreenBtn.setLabel('Exit Fullscreen');
			t.container.trigger('enteredfullscreen');
		},

		exitFullScreen: function() {

			var t = this;

            // Prevent container from attempting to stretch a second time
            clearTimeout(t.containerSizeTimeout);

			// firefox can't adjust plugins
			/*
			if (t.media.pluginType !== 'native' && mejs.MediaFeatures.isFirefox) {
				t.media.setFullscreen(false);
				//player.isFullScreen = false;
				return;
			}
			*/

			// come out of native fullscreen
			if (mejs.MediaFeatures.hasTrueNativeFullScreen && (mejs.MediaFeatures.isFullScreen() || t.isFullScreen)) {
				mejs.MediaFeatures.cancelFullScreen();
			}

			// restore scroll bars to document
            $(document.documentElement).removeClass('mejs-fullscreen');

			t.container
				.removeClass('mejs-container-fullscreen')
				.width(t.normalWidth)
				.height(t.normalHeight);

			if (t.media.pluginType === 'native') {
				t.$media
					.width(t.normalWidth)
					.height(t.normalHeight);
			} else {
				t.container.find('.mejs-shim')
					.width(t.normalWidth)
					.height(t.normalHeight);

				t.media.setVideoSize(t.normalWidth, t.normalHeight);
			}

			t.layers.children('div')
				.width(t.normalWidth)
				.height(t.normalHeight);

			t.fullscreenBtn
				.removeClass('mejs-unfullscreen')
				.addClass('mejs-fullscreen');

			t.setControlsSize();
			t.isFullScreen = false;

			t.container.find('.mejs-captions-text').css('font-size','');
			t.container.find('.mejs-captions-text').css('line-height', '');
			t.container.find('.mejs-captions-position').css('bottom', '');

			t.fullscreenBtn.setLabel('Enter Fullscreen');
			t.container.trigger('exitedfullscreen');
		}
	});

})(mejs.$);

(function($) {

	// Speed
	$.extend(mejs.MepDefaults, {

		// We also support to pass object like this:
		// [{name: 'Slow', value: '0.75'}, {name: 'Normal', value: '1.00'}, ...]
		speeds: ['2.00', '1.50', '1.25', '1.00', '0.75'],

		defaultSpeed: '1.00',

		speedChar: 'x',

		speedLabel: 'Change playback speed'
	});

	$.extend(MediaElementPlayer.prototype, {

		buildspeed: function(player, controls, layers, media) {
			var t = this;
			var hoverTimeout;

			if (t.media.pluginType == 'native') {
				var
					speedButton = null,
					speedSelector = null,
					playbackSpeed = null,
					inputId = null,
					isCurrent = null;

				var speeds = [];
				var defaultInArray = false;
				for (var i=0, len=t.options.speeds.length; i < len; i++) {
					var s = t.options.speeds[i];
					if (typeof(s) === 'string'){
						speeds.push({
							name: s + t.options.speedChar,
							value: s
						});
						if(s === t.options.defaultSpeed) {
							defaultInArray = true;
						}
					}
					else {
						speeds.push(s);
						if(s.value === t.options.defaultSpeed) {
							defaultInArray = true;
						}
					}
				}

				if (!defaultInArray) {
					speeds.push({
						name: t.options.defaultSpeed + t.options.speedChar,
						value: t.options.defaultSpeed
					});
				}

				speeds.sort(function(a, b) {
					return parseFloat(b.value) - parseFloat(a.value);
				});

				var getSpeedNameFromValue = function(value) {
					for(i=0,len=speeds.length; i <len; i++) {
						if (speeds[i].value === value) {
							return speeds[i].name;
						}
					}
				};

				var speedLabel = function(speed) {
					return mejs.i18n.t(t.options.speedLabel + ': Current speed ' + getSpeedNameFromValue(speed));
				}

				var html = '<div class="mejs-button mejs-speed-button">' +
							'<button role="button" aria-haspopup="true" aria-controls="' + t.id + '" type="button" aria-label="' + speedLabel(t.options.defaultSpeed) + '" aria-live="assertive">' + getSpeedNameFromValue(t.options.defaultSpeed) + '</button>' +
							'<div class="mejs-speed-selector mejs-offscreen" role="menu" aria-expanded="false" aria-hidden="true">' +
							'<ul>';

				for (i = 0, il = speeds.length; i<il; i++) {
					inputId = t.id + '-speed-' + speeds[i].value;
					isCurrent = (speeds[i].value === t.options.defaultSpeed);
					html += '<li>' +
								'<input type="radio" name="speed" role="menuitemradio"' +
											'value="' + speeds[i].value + '" ' +
											'id="' + inputId + '" ' +
											(isCurrent ? ' checked="checked"' : '') +
											' aria-selected="' + isCurrent + '"' +
											' aria-label="' + getSpeedNameFromValue(speeds[i].value) + '"' +
											' tabindex="-1"' +
											' />' +
								'<label for="' + inputId + '" ' + 'aria-hidden="true"' +
											(isCurrent ? ' class="mejs-speed-selected"' : '') +
											'>' + speeds[i].name + '</label>' +
							'</li>';
				}
				html += '</ul></div></div>';

				player.speedButton = speedButton = $(html).appendTo(controls);
				speedSelector = speedButton.find('.mejs-speed-selector');

				playbackSpeed = t.options.defaultSpeed;

				media.addEventListener('loadedmetadata', function(e) {
					if (playbackSpeed) {
						media.playbackRate = parseFloat(playbackSpeed);
					}
				}, true);

				speedSelector
					.on('click', 'input[type="radio"]', function() {
						// set aria states
						$(this).attr('aria-selected', true).attr('checked', 'checked');
						$(this).closest('.mejs-speed-selector').find('input[type=radio]').not(this).attr('aria-selected', 'false').removeAttr('checked');

						var newSpeed = $(this).attr('value');
						playbackSpeed = newSpeed;
                                               var newPlaybackRate = parseFloat(newSpeed);
						media.playbackRate = newPlaybackRate;

                                               // IE11 doesn't remember the user-selected playbackRate once
                                               // clicking play/pause after setting the rate, so we save
                                               // the value to `this` and reference it in the play/pause handler
                                               // see: mep-feature-playpause.js
                                               t.options.playbackRate = newPlaybackRate;

                                               speedButton.find('button')
							.html(getSpeedNameFromValue(newSpeed))
							.attr('aria-label', speedLabel(newSpeed));
						speedButton.find('.mejs-speed-selected').removeClass('mejs-speed-selected');
						speedButton.find('input[type="radio"]:checked').next().addClass('mejs-speed-selected');
					});
				speedButton
				// set size on demand
					.one( 'mouseenter focusin', function() {
						speedSelector
							.height(
								speedButton.find('.mejs-speed-selector ul').outerHeight(true) +
								speedButton.find('.mejs-speed-translations').outerHeight(true))
							.css('top', (-1 * speedSelector.height()) + 'px');
						})

						// hover
						.hover(function() {
							clearTimeout(hoverTimeout);
							player.showSpeedSelector();
						}, function() {
							hoverTimeout = setTimeout(function () {
								player.hideSpeedSelector();
							}, t.options.menuTimeoutMouseLeave);
						})

						// keyboard menu activation
						.on('keydown', function (e) {
							var keyCode = e.keyCode;

							switch (keyCode) {
							case 32: // space
								if (!mejs.MediaFeatures.isFirefox) { // space sends the click event in Firefox
									player.showSpeedSelector();
								}
								$(this).find('.mejs-speed-selector')
									.find('input[type=radio]:checked').first().focus();
								break;
							case 13: // enter
								player.showSpeedSelector();
								$(this).find('.mejs-speed-selector')
									.find('input[type=radio]:checked').first().focus();
								break;
							case 27: // esc
								player.hideSpeedSelector();
								$(this).find('button').focus();
								break;
							default:
								return true;
						}
					})

					// close menu when tabbing away
					.on('focusout', mejs.Utility.debounce(function (e) { // Safari triggers focusout multiple times
						// Firefox does NOT support e.relatedTarget to see which element
						// just lost focus, so wait to find the next focused element
						setTimeout(function () {
							var parent = $(document.activeElement).closest('.mejs-speed-selector');
							if (!parent.length) {
								// focus is outside the control; close menu
								player.hideSpeedSelector();
							}
						}, 0);
					}, 100))

					// Handle click so that screen readers can toggle the menu
					.on('click', 'button', function (e) {
						if ($(this).siblings('.mejs-speed-selector').hasClass('mejs-offscreen')) {
							player.showSpeedSelector();
							$(this).siblings('.mejs-speed-selector').find('input[type=radio]:checked').first().focus();
						} else {
							player.hideSpeedSelector();
						}
					});
			}
		},

		hideSpeedSelector: function () {
			this.speedButton.find('.mejs-speed-selector')
				.addClass('mejs-offscreen')
				.attr('aria-expanded', 'false')
				.attr('aria-hidden', 'true')
				.find('input[type=radio]') // make radios not focusable
				.attr('tabindex', '-1');
		},

		showSpeedSelector: function () {
			this.speedButton.find('.mejs-speed-selector')
				.removeClass('mejs-offscreen')
				.attr('aria-expanded', 'true')
				.attr('aria-hidden', 'false')
				.find('input[type=radio]')
				.attr('tabindex', '0');
		}
	});

})(mejs.$);

(function($) {

	// add extra default options
	$.extend(mejs.MepDefaults, {
		// this will automatically turn on a <track>
		startLanguage: '',

		tracksText: '',

		// By default, no WAI-ARIA live region - don't make a
		// screen reader speak captions over an audio track.
		tracksAriaLive: false,

		// option to remove the [cc] button when no <track kind="subtitles"> are present
		hideCaptionsButtonWhenEmpty: true,

		// If true and we only have one track, change captions to popup
		toggleCaptionsButtonWhenOnlyOne: false,

		// #id or .class
		slidesSelector: ''
	});

	$.extend(MediaElementPlayer.prototype, {

		hasChapters: false,

		cleartracks: function(player, controls, layers, media){
			if(player) {
				if(player.captions) player.captions.remove();
				if(player.chapters) player.chapters.remove();
				if(player.captionsText) player.captionsText.remove();
				if(player.captionsButton) player.captionsButton.remove();
			}
		},
		buildtracks: function(player, controls, layers, media) {
			if (player.tracks.length === 0)
				return;

			var t = this,
				attr = t.options.tracksAriaLive ?
					'role="log" aria-live="assertive" aria-atomic="false"' : '',
				tracksTitle = t.options.tracksText ? t.options.tracksText : mejs.i18n.t('mejs.captions-subtitles'),
				i,
				kind;

			if (t.domNode.textTracks) { // if browser will do native captions, prefer mejs captions, loop through tracks and hide
				for (i = t.domNode.textTracks.length - 1; i >= 0; i--) {
					t.domNode.textTracks[i].mode = "hidden";
				}
			}
			t.cleartracks(player, controls, layers, media);
			player.chapters =
					$('<div class="mejs-chapters mejs-layer"></div>')
						.prependTo(layers).hide();
			player.captions =
					$('<div class="mejs-captions-layer mejs-layer"><div class="mejs-captions-position mejs-captions-position-hover" ' +
					attr + '><span class="mejs-captions-text"></span></div></div>')
						.prependTo(layers).hide();
			player.captionsText = player.captions.find('.mejs-captions-text');
			player.captionsButton =
					$('<div class="mejs-button mejs-captions-button">'+
						'<button type="button" aria-controls="' + t.id + '" title="' + tracksTitle + '" aria-label="' + tracksTitle + '"></button>'+
						'<div class="mejs-captions-selector mejs-offscreen" role="menu" aria-expanded="false" aria-hidden="true">'+
							'<ul>'+
								'<li>'+
									'<input type="radio" name="' + player.id + '_captions" id="' + player.id + '_captions_none" value="none" checked="checked" role="menuitemradio" aria-selected="true" aria-label="' + mejs.i18n.t('mejs.none') + '" tabindex="-1" />' +
									'<label for="' + player.id + '_captions_none" aria-hidden="true">' + mejs.i18n.t('mejs.none') +'</label>'+
								'</li>'	+
							'</ul>'+
						'</div>'+
					'</div>')
						.appendTo(controls);


			var subtitleCount = 0;
			for (i=0; i<player.tracks.length; i++) {
				kind = player.tracks[i].kind;
				if (kind === 'subtitles' || kind === 'captions') {
					subtitleCount++;
				}
			}

			// if only one language then just make the button a toggle
			if (t.options.toggleCaptionsButtonWhenOnlyOne && subtitleCount == 1){
				// click
				player.captionsButton.on('click',function() {
					if (player.selectedTrack === null) {
						lang = player.tracks[0].srclang;
					} else {
						lang = 'none';
					}
					player.setTrack(lang);
				});
			} else {
				// hover
				var hoverTimeout;
				player.captionsButton.hover(function() {
					clearTimeout(hoverTimeout);
					player.showCaptionsSelector();
				}, function() {
					hoverTimeout = setTimeout(function() {
						player.hideCaptionsSelector();
					}, t.options.menuTimeoutMouseLeave);
				})

				// handle clicks to the language radio buttons
				.on('keydown', function(e) {
					var keyCode = e.keyCode;
					switch (keyCode) {
						case 32: // space
							if (!mejs.MediaFeatures.isFirefox) { // space sends the click event in Firefox
								player.showCaptionsSelector();
							}
							$(this).find('.mejs-captions-selector')
								.find('input[type=radio]:checked').first().focus()
							break;
						case 13: // enter
							player.showCaptionsSelector();
							$(this).find('.mejs-captions-selector')
								.find('input[type=radio]:checked').first().focus()
							break;
						case 27: // esc
							player.hideCaptionsSelector();
							$(this).find('button').focus();
							break;
						default:
							return true;
					}
				})

				// close menu when tabbing away
				.on('focusout', mejs.Utility.debounce(function (e) { // Safari triggers focusout multiple times
					// Firefox does NOT support e.relatedTarget to see which element
					// just lost focus, so wait to find the next focused element
					setTimeout(function () {
						var parent = $(document.activeElement).closest('.mejs-captions-selector');
						if (!parent.length) {
							// focus is outside the control; close menu
							player.hideCaptionsSelector();
						}
					}, 0);
				}, 100))

				// handle clicks to the language radio buttons
				.on('click', 'input[type=radio]', function() {
					lang = this.value;
					player.setTrack(lang);
				})

				.on('click', 'button', function() {
					if ($(this).siblings('.mejs-captions-selector').hasClass('mejs-offscreen')) {
						player.showCaptionsSelector();
						$(this).siblings('.mejs-captions-selector').find('input[type=radio]:checked').first().focus();
					} else {
						player.hideCaptionsSelector();
					}
				});

			}

			if (!player.options.alwaysShowControls) {
				// move with controls
				player.container
					.bind('controlsshown', function () {
						// push captions above controls
						player.container.find('.mejs-captions-position').addClass('mejs-captions-position-hover');

					})
					.bind('controlshidden', function () {
						if (!media.paused) {
							// move back to normal place
							player.container.find('.mejs-captions-position').removeClass('mejs-captions-position-hover');
						}
					});
			} else {
				player.container.find('.mejs-captions-position').addClass('mejs-captions-position-hover');
			}

			player.trackToLoad = -1;
			player.selectedTrack = null;
			player.isLoadingTrack = false;

			// add to list
			for (i=0; i<player.tracks.length; i++) {
				kind = player.tracks[i].kind;
				if (kind === 'subtitles' || kind === 'captions') {
					player.addTrackButton(player.tracks[i].srclang, player.tracks[i].label);
				}
			}

			// start loading tracks
			player.loadNextTrack();

			media.addEventListener('timeupdate',function() {
				player.displayCaptions();
			}, false);

			if (player.options.slidesSelector !== '') {
				player.slidesContainer = $(player.options.slidesSelector);

				media.addEventListener('timeupdate',function() {
					player.displaySlides();
				}, false);

			}

			media.addEventListener('loadedmetadata', function() {
				player.displayChapters();
			}, false);

			player.container.hover(
				function () {
					// chapters
					if (player.hasChapters) {
						player.chapters.removeClass('mejs-offscreen');
						player.chapters.fadeIn(200).height(player.chapters.find('.mejs-chapter').outerHeight());
					}
				},
				function () {
					if (player.hasChapters && !media.paused) {
						player.chapters.fadeOut(200, function() {
							$(this).addClass('mejs-offscreen');
							$(this).css('display','block');
						});
					}
				});

			t.container.on('controlsresize', function() {
				t.adjustLanguageBox();
			});

			// check for autoplay
			if (player.node.getAttribute('autoplay') !== null) {
				player.chapters.addClass('mejs-offscreen');
			}
		},

		hideCaptionsSelector: function () {
			this.captionsButton.find('.mejs-captions-selector')
				.addClass('mejs-offscreen')
				.attr('aria-expanded', 'false')
				.attr('aria-hidden', 'true')
				.find('input[type=radio]') // make radios not focusable
				.attr('tabindex', '-1');
		},

		showCaptionsSelector: function () {
			this.captionsButton.find('.mejs-captions-selector')
				.removeClass('mejs-offscreen')
				.attr('aria-expanded', 'true')
				.attr('aria-hidden', 'false')
				.find('input[type=radio]')
				.attr('tabindex', '0');
		},

		setTrackAriaLabel: function() {
			var label = this.options.tracksText
			var current = this.selectedTrack

			if (current) {
				label += ': ' + current.label;
			}

			this.captionsButton.find('button')
				.attr('aria-label', label)
				.attr('title', label);
		},

		setTrack: function(lang){

			var t = this,
				i;

			$(this).attr('aria-selected', true).attr('checked', 'checked');
			$(this).closest('.mejs-captions-selector').find('input[type=radio]').not(this).attr('aria-selected', 'false').removeAttr('checked');
			if (lang == 'none') {
				t.selectedTrack = null;
				t.captionsButton.removeClass('mejs-captions-enabled');
			} else {
				for (i=0; i<t.tracks.length; i++) {
					if (t.tracks[i].srclang == lang) {
						if (t.selectedTrack === null)
							t.captionsButton.addClass('mejs-captions-enabled');
						t.selectedTrack = t.tracks[i];
						t.captions.attr('lang', t.selectedTrack.srclang);
						t.displayCaptions();
						break;
					}
				}
			}

			t.setTrackAriaLabel();
		},

		loadNextTrack: function() {
			var t = this;

			t.trackToLoad++;
			if (t.trackToLoad < t.tracks.length) {
				t.isLoadingTrack = true;
				t.loadTrack(t.trackToLoad);
			} else {
				// add done?
				t.isLoadingTrack = false;

				t.checkForTracks();
			}
		},

		loadTrack: function(index){
			var
				t = this,
				track = t.tracks[index],
				after = function() {

					track.isLoaded = true;

					t.enableTrackButton(track.srclang, track.label);

					t.loadNextTrack();

				};


			if (track.src !== undefined || track.src !== "") {
				$.ajax({
					url: track.src,
					dataType: "text",
					success: function(d) {

						// parse the loaded file
						track.entries = mejs.TrackFormatParser.webvtt.parse(d);

						after();

						if (track.kind == 'chapters') {
							t.media.addEventListener('play', function() {
								if (t.media.duration > 0) {
									t.displayChapters(track);
								}
							}, false);
						}

						if (track.kind == 'slides') {
							t.setupSlides(track);
						}
					},
					error: function() {
						t.removeTrackButton(track.srclang);
						t.loadNextTrack();
					}
				});
			}
		},

		enableTrackButton: function(lang, label) {
			var t = this;

			if (label === '') {
				label = mejs.language.codes[lang] || lang;
			}

			t.captionsButton
				.find('input[value=' + lang + ']')
					.prop('disabled', false)
					.attr('aria-label', label)
				.siblings('label')
					.html( label );

			// auto select
			if (t.options.startLanguage == lang) {
				$('#' + t.id + '_captions_' + lang).prop('checked', true).trigger('click');
			}

			t.adjustLanguageBox();
		},

		removeTrackButton: function(lang) {
			var t = this;

			t.captionsButton.find('input[value=' + lang + ']').closest('li').remove();

			t.adjustLanguageBox();
		},

		addTrackButton: function(lang, label) {
			var t = this;
			if (label === '') {
				label = mejs.language.codes[lang] || lang;
			}

			t.captionsButton.find('ul').append(
				$('<li>'+
					'<input type="radio" name="' + t.id + '_captions" id="' + t.id + '_captions_' + lang + '" value="' + lang + '" disabled="disabled" />' +
					'<label for="' + t.id + '_captions_' + lang + '">' + label + ' (loading)' + '</label>'+
				'</li>')
			);

			t.adjustLanguageBox();

			// remove this from the dropdownlist (if it exists)
			t.container.find('.mejs-captions-translations option[value=' + lang + ']').remove();
		},

		adjustLanguageBox:function() {
			var t = this;
			// adjust the size of the outer box
			t.captionsButton.find('.mejs-captions-selector').height(
				t.captionsButton.find('.mejs-captions-selector ul').outerHeight(true) +
				t.captionsButton.find('.mejs-captions-translations').outerHeight(true)
			);
		},

		checkForTracks: function() {
			var
				t = this,
				hasSubtitles = false;

			// check if any subtitles
			if (t.options.hideCaptionsButtonWhenEmpty) {
				for (var i=0; i<t.tracks.length; i++) {
					var kind = t.tracks[i].kind;
					if ((kind === 'subtitles' || kind === 'captions') && t.tracks[i].isLoaded) {
						hasSubtitles = true;
						break;
					}
				}

				if (!hasSubtitles) {
					t.captionsButton.hide();
					t.setControlsSize();
				}
			}
		},

		displayCaptions: function() {

			if (typeof this.tracks == 'undefined')
				return;

			var
				t = this,
				track = t.selectedTrack,
				i,
				sanitize = function (html) {
					parser = new DOMParser();
					doc = parser.parseFromString(html, "text/html");

					// Remove all nodes except those that are whitelisted
					var elementWhitelist = [
						'i', 'b', 'u', 'v', 'c',
						'ruby', 'rt', 'lang', 'link'
					];
					var elements = Array.from(doc.body.children || []);
					while (elements.length) {
						var node = elements.shift();
						if (elementWhitelist.includes(node.tagName.toLowerCase())) {
							elements = elements.concat(Array.from(node.children || []));
						} else {
							node.parentNode.removeChild(node);
						}
					}

					// Loop the elements and remove anything that contains value="javascript:" or an `on*` attribute
					// (`onerror`, `onclick`, etc.)
					var allElements = doc.body.getElementsByTagName('*');
					for (var i = 0, n = allElements.length; i < n; i++) {
						var
							attributesObj = allElements[i].attributes,
							attributes = Array.prototype.slice.call(attributesObj)
						;

						for (var j = 0, total = attributes.length; j < total; j++) {
							if (attributes[j].name.startsWith('on') || attributes[j].value.startsWith('javascript')) {
								allElements[i].parentNode.removeChild(allElements[i]);
							} else if (attributes[j].name === 'style') {
								allElements[i].removeAttribute(attributes[j].name);
							}
						}

					}

					return doc.body.innerHTML;
				};

			if (track !== null && track.isLoaded) {
				for (i=0; i<track.entries.times.length; i++) {
					if (t.media.currentTime >= track.entries.times[i].start && t.media.currentTime <= track.entries.times[i].stop) {
						// Set the line before the timecode as a class so the cue can be targeted if needed
						t.captionsText.html(sanitize(track.entries.text[i])).attr('class', 'mejs-captions-text ' + (track.entries.times[i].identifier || ''));
						t.captions.show().height(0);
						return; // exit out if one is visible;
					}
				}
				t.captions.hide();
			} else {
				t.captions.hide();
			}
		},

		setupSlides: function(track) {
			var t = this;

			t.slides = track;
			t.slides.entries.imgs = [t.slides.entries.text.length];
			t.showSlide(0);

		},

		showSlide: function(index) {
			if (typeof this.tracks == 'undefined' || typeof this.slidesContainer == 'undefined') {
				return;
			}

			var t = this,
				url = t.slides.entries.text[index],
				img = t.slides.entries.imgs[index];

			if (typeof img == 'undefined' || typeof img.fadeIn == 'undefined') {

				t.slides.entries.imgs[index] = img = $('<img src="' + url + '">')
						.on('load', function() {
							img.appendTo(t.slidesContainer)
								.hide()
								.fadeIn()
								.siblings(':visible')
									.fadeOut();

						});

			} else {

				if (!img.is(':visible') && !img.is(':animated')) {

					//

					img.fadeIn()
						.siblings(':visible')
							.fadeOut();
				}
			}

		},

		displaySlides: function() {

			if (typeof this.slides == 'undefined')
				return;

			var
				t = this,
				slides = t.slides,
				i;

			for (i=0; i<slides.entries.times.length; i++) {
				if (t.media.currentTime >= slides.entries.times[i].start && t.media.currentTime <= slides.entries.times[i].stop){

					t.showSlide(i);

					return; // exit out if one is visible;
				}
			}
		},

		displayChapters: function() {
			var
				t = this,
				i;

			for (i=0; i<t.tracks.length; i++) {
				if (t.tracks[i].kind == 'chapters' && t.tracks[i].isLoaded) {
					t.drawChapters(t.tracks[i]);
					t.hasChapters = true;
					break;
				}
			}
		},

		drawChapters: function(chapters) {
			var
				t = this,
				i,
				dur,
				//width,
				//left,
				percent = 0,
				usedPercent = 0;

			t.chapters.empty();

			for (i=0; i<chapters.entries.times.length; i++) {
				dur = chapters.entries.times[i].stop - chapters.entries.times[i].start;
				percent = Math.floor(dur / t.media.duration * 100);
				if (percent + usedPercent > 100 || // too large
					i == chapters.entries.times.length-1 && percent + usedPercent < 100) // not going to fill it in
					{
					percent = 100 - usedPercent;
				}
				//width = Math.floor(t.width * dur / t.media.duration);
				//left = Math.floor(t.width * chapters.entries.times[i].start / t.media.duration);
				//if (left + width > t.width) {
				//	width = t.width - left;
				//}

				t.chapters.append( $(
					'<div class="mejs-chapter" rel="' + chapters.entries.times[i].start + '" style="left: ' + usedPercent.toString() + '%;width: ' + percent.toString() + '%;">' +
						'<div class="mejs-chapter-block' + ((i==chapters.entries.times.length-1) ? ' mejs-chapter-block-last' : '') + '">' +
							'<span class="ch-title">' + chapters.entries.text[i] + '</span>' +
							'<span class="ch-time">' + mejs.Utility.secondsToTimeCode(chapters.entries.times[i].start, t.options) + '&ndash;' + mejs.Utility.secondsToTimeCode(chapters.entries.times[i].stop, t.options) + '</span>' +
						'</div>' +
					'</div>'));
				usedPercent += percent;
			}

			t.chapters.find('div.mejs-chapter').click(function() {
				t.media.setCurrentTime( parseFloat( $(this).attr('rel') ) );
				if (t.media.paused) {
					t.media.play();
				}
			});

			t.chapters.show();
		}
	});



	mejs.language = {
		codes:  {
			af:'Afrikaans',
			sq:'Albanian',
			ar:'Arabic',
			be:'Belarusian',
			bg:'Bulgarian',
			ca:'Catalan',
			zh:'Chinese',
			'zh-cn':'Chinese Simplified',
			'zh-tw':'Chinese Traditional',
			hr:'Croatian',
			cs:'Czech',
			da:'Danish',
			nl:'Dutch',
			en:'English',
			et:'Estonian',
			fl:'Filipino',
			fi:'Finnish',
			fr:'French',
			gl:'Galician',
			de:'German',
			el:'Greek',
			ht:'Haitian Creole',
			iw:'Hebrew',
			hi:'Hindi',
			hu:'Hungarian',
			is:'Icelandic',
			id:'Indonesian',
			ga:'Irish',
			it:'Italian',
			ja:'Japanese',
			ko:'Korean',
			lv:'Latvian',
			lt:'Lithuanian',
			mk:'Macedonian',
			ms:'Malay',
			mt:'Maltese',
			no:'Norwegian',
			fa:'Persian',
			pl:'Polish',
			pt:'Portuguese',
			// 'pt-pt':'Portuguese (Portugal)',
			ro:'Romanian',
			ru:'Russian',
			sr:'Serbian',
			sk:'Slovak',
			sl:'Slovenian',
			es:'Spanish',
			sw:'Swahili',
			sv:'Swedish',
			tl:'Tagalog',
			th:'Thai',
			tr:'Turkish',
			uk:'Ukrainian',
			vi:'Vietnamese',
			cy:'Welsh',
			yi:'Yiddish'
		}
	};

	/*
	Parses WebVTT format which should be formatted as
	================================
	WEBVTT

	1
	00:00:01,1 --> 00:00:05,000
	A line of text

	2
	00:01:15,1 --> 00:02:05,000
	A second line of text

	===============================

	Adapted from: http://www.delphiki.com/html5/playr
	*/
	mejs.TrackFormatParser = {
		webvtt: {
			pattern_timecode: /^((?:[0-9]{1,2}:)?[0-9]{2}:[0-9]{2}([,.][0-9]{1,3})?) --\> ((?:[0-9]{1,2}:)?[0-9]{2}:[0-9]{2}([,.][0-9]{3})?)(.*)$/,

			parse: function(trackText) {
				var
					i = 0,
					lines = mejs.TrackFormatParser.split2(trackText, /\r?\n/),
					entries = {text:[], times:[]},
					timecode,
					text,
					identifier;
				for(; i<lines.length; i++) {
					timecode = this.pattern_timecode.exec(lines[i]);

					if (timecode && i<lines.length) {
						if ((i - 1) >= 0 && lines[i - 1] !== '') {
							identifier = lines[i - 1];
						}
						i++;
						// grab all the (possibly multi-line) text that follows
						text = lines[i];
						i++;
						while(lines[i] !== '' && i<lines.length){
							text = text + '\n' + lines[i];
							i++;
						}
						text = $.trim(text).replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>");
						// Text is in a different array so I can use .join
						entries.text.push(text);
						entries.times.push(
						{
							identifier: identifier,
							start: (mejs.Utility.convertSMPTEtoSeconds(timecode[1]) === 0) ? 0.200 : mejs.Utility.convertSMPTEtoSeconds(timecode[1]),
							stop: mejs.Utility.convertSMPTEtoSeconds(timecode[3]),
							settings: timecode[5]
						});
					}
					identifier = '';
				}
				return entries;
			}
		},
		split2: function (text, regex) {
			// normal version for compliant browsers
			// see below for IE fix
			return text.split(regex);
		}
	};

	// test for browsers with bad String.split method.
	if ('x\n\ny'.split(/\n/gi).length != 3) {
		// add super slow IE8 and below version
		mejs.TrackFormatParser.split2 = function(text, regex) {
			var
				parts = [],
				chunk = '',
				i;

			for (i=0; i<text.length; i++) {
				chunk += text.substring(i,i+1);
				if (regex.test(chunk)) {
					parts.push(chunk.replace(regex, ''));
					chunk = '';
				}
			}
			parts.push(chunk);
			return parts;
		};
	}

})(mejs.$);

// Source Chooser Plugin
(function($) {

	$.extend(mejs.MepDefaults, {
		sourcechooserText: ''
	});

	$.extend(MediaElementPlayer.prototype, {
		sources: [],

		buildsourcechooser: function(player, controls, layers, media) {

			var
				t = this,
				sourceTitle = t.options.sourcechooserText ? t.options.sourcechooserText : mejs.i18n.t('mejs.source-chooser'),
				hoverTimeout
			;

			player.sourcechooserButton =
				$('<div class="mejs-button mejs-sourcechooser-button">'+
						'<button type="button" role="button" aria-haspopup="true" aria-controls="' + t.id + '" title="' + sourceTitle + '" aria-label="' + sourceTitle + '" aria-live="assertive"></button>'+
						'<div class="mejs-sourcechooser-selector mejs-offscreen" role="menu" aria-expanded="false" aria-hidden="true">'+
							'<ul>'+
							'</ul>'+
						'</div>'+
					'</div>')
					.appendTo(controls)

					// hover
					.hover(function() {
						clearTimeout(hoverTimeout);
						player.showSourcechooserSelector();
					}, function() {
						hoverTimeout = setTimeout(function () {
						player.hideSourcechooserSelector();
						}, t.options.menuTimeoutMouseLeave);
					})

					// keyboard menu activation
					.on('keydown', function (e) {
						var keyCode = e.keyCode;

						switch (keyCode) {
							case 32: // space
								if (!mejs.MediaFeatures.isFirefox) { // space sends the click event in Firefox
									player.showSourcechooserSelector();
								}
								$(this).find('.mejs-sourcechooser-selector')
									.find('input[type=radio]:checked').first().focus();
								break;
							case 13: // enter
								player.showSourcechooserSelector();
								$(this).find('.mejs-sourcechooser-selector')
									.find('input[type=radio]:checked').first().focus();
								break;
							case 27: // esc
								player.hideSourcechooserSelector();
								$(this).find('button').focus();
								break;
							default:
								return true;
								}
							})

					// close menu when tabbing away
					.on('focusout', mejs.Utility.debounce(function (e) { // Safari triggers focusout multiple times
						// Firefox does NOT support e.relatedTarget to see which element
						// just lost focus, so wait to find the next focused element
						setTimeout(function () {
							var parent = $(document.activeElement).closest('.mejs-sourcechooser-selector');
							if (!parent.length) {
								// focus is outside the control; close menu
								player.hideSourcechooserSelector();
							}
						}, 0);
					}, 100))

					// handle clicks to the source radio buttons
					.delegate('input[type=radio]', 'click', function() {
						// set aria states
						$(this).attr('aria-selected', true).attr('checked', 'checked');
						$(this).closest('.mejs-sourcechooser-selector').find('input[type=radio]').not(this).attr('aria-selected', 'false').removeAttr('checked');

						var src = this.value;

						if (media.currentSrc != src) {
							var currentTime = media.currentTime;
							var paused = media.paused;
							media.pause();
							media.setSrc(src);

							media.addEventListener('loadedmetadata', function(e) {
								media.currentTime = currentTime;
							}, true);

							var canPlayAfterSourceSwitchHandler = function(e) {
								if (!paused) {
									media.play();
								}
								media.removeEventListener("canplay", canPlayAfterSourceSwitchHandler, true);
							};
							media.addEventListener('canplay', canPlayAfterSourceSwitchHandler, true);
							media.load();
						}

						t.setSourcechooserAriaLabel(media);
					})

					// Handle click so that screen readers can toggle the menu
					.delegate('button', 'click', function (e) {
						if ($(this).siblings('.mejs-sourcechooser-selector').hasClass('mejs-offscreen')) {
							player.showSourcechooserSelector();
							$(this).siblings('.mejs-sourcechooser-selector').find('input[type=radio]:checked').first().focus();
						} else {
							player.hideSourcechooserSelector();
						}
					});

			// add to list
			for (var i in this.node.children) {
				var src = this.node.children[i];
				if (src.nodeName === 'SOURCE' && (media.canPlayType(src.type) == 'probably' || media.canPlayType(src.type) == 'maybe')) {
					t.sources.push(src);
					player.addSourceButton(src.src, src.title, src.type, media.src == src.src);
				}
			}

			t.setSourcechooserAriaLabel(media);
		},

		setSourcechooserAriaLabel: function(media) {
			var label = this.options.sourcechooserText ? this.options.sourcechooserText : mejs.i18n.t('mejs.source-chooser');
			var current = this.currentSource(media);

			if (current) {
				label += ': ' + current;
			}

			this.sourcechooserButton.find('button')
				.attr('aria-label', label)
				.attr('title', label);
		},

		addSourceButton: function(src, label, type, isCurrent) {
			var t = this;
			if (label === '' || label == undefined) {
				label = src;
			}
			type = type.split('/')[1];

			t.sourcechooserButton.find('ul').append(
				$('<li>'+
						'<input type="radio" name="' + t.id + '_sourcechooser" id="' + t.id + '_sourcechooser_' + label + type + '" role="menuitemradio" value="' + src + '" ' + (isCurrent ? 'checked="checked"' : '') + 'aria-selected="' + isCurrent + '" aria-label="' + label + '" tabindex="-1" />'+
						'<label for="' + t.id + '_sourcechooser_' + label + type + '" aria-hidden="true">' + label + ' (' + type + ')</label>'+
					'</li>')
			);

			t.adjustSourcechooserBox();

		},

		currentSource: function(media) {
			var current = this.sources.filter(function(src) {
				return src.src == media.src;
			})[0];

			if (current) {
				return current.title || '';
			}

			return '';
		},

		adjustSourcechooserBox: function() {
			var t = this;
			// adjust the size of the outer box
			t.sourcechooserButton.find('.mejs-sourcechooser-selector').height(
				t.sourcechooserButton.find('.mejs-sourcechooser-selector ul').outerHeight(true)
			);
		},

		hideSourcechooserSelector: function () {
			this.sourcechooserButton.find('.mejs-sourcechooser-selector')
				.addClass('mejs-offscreen')
				.attr('aria-expanded', 'false')
				.attr('aria-hidden', 'true')
				.find('input[type=radio]') // make radios not focusable
				.attr('tabindex', '-1');
		},

		showSourcechooserSelector: function () {
			this.sourcechooserButton.find('.mejs-sourcechooser-selector')
				.removeClass('mejs-offscreen')
				.attr('aria-expanded', 'true')
				.attr('aria-hidden', 'false')
				.find('input[type=radio]')
				.attr('tabindex', '0');
		}
	});

})(mejs.$);

/*
* ContextMenu Plugin
* 
*
*/

(function($) {

$.extend(mejs.MepDefaults,
	{ 'contextMenuItems': [
		// demo of a fullscreen option
		{ 
			render: function(player) {
				
				// check for fullscreen plugin
				if (typeof player.enterFullScreen == 'undefined')
					return null;
			
				if (player.isFullScreen) {
					return mejs.i18n.t('mejs.fullscreen-off');
				} else {
					return mejs.i18n.t('mejs.fullscreen-on');
				}
			},
			click: function(player) {
				if (player.isFullScreen) {
					player.exitFullScreen();
				} else {
					player.enterFullScreen();
				}
			}
		}
		,
		// demo of a mute/unmute button
		{ 
			render: function(player) {
				if (player.media.muted) {
					return mejs.i18n.t('mejs.unmute');
				} else {
					return mejs.i18n.t('mejs.mute');
				}
			},
			click: function(player) {
				if (player.media.muted) {
					player.setMuted(false);
				} else {
					player.setMuted(true);
				}
			}
		},
		// separator
		{
			isSeparator: true
		}
		,
		// demo of simple download video
		{ 
			render: function(player) {
				return mejs.i18n.t('mejs.download-video');
			},
			click: function(player) {
				window.location.href = player.media.currentSrc;
			}
		}	
	]}
);


	$.extend(MediaElementPlayer.prototype, {
		buildcontextmenu: function(player, controls, layers, media) {
			
			// create context menu
			player.contextMenu = $('<div class="mejs-contextmenu"></div>')
								.appendTo($('body'))
								.hide();
			
			// create events for showing context menu
			player.container.bind('contextmenu', function(e) {
				if (player.isContextMenuEnabled) {
					e.preventDefault();
					player.renderContextMenu(e.clientX-1, e.clientY-1);
					return false;
				}
			});
			player.container.bind('click', function() {
				player.contextMenu.hide();
			});	
			player.contextMenu.bind('mouseleave', function() {

				//
				player.startContextMenuTimer();
				
			});		
		},

		cleancontextmenu: function(player) {
			player.contextMenu.remove();
		},
		
		isContextMenuEnabled: true,
		enableContextMenu: function() {
			this.isContextMenuEnabled = true;
		},
		disableContextMenu: function() {
			this.isContextMenuEnabled = false;
		},
		
		contextMenuTimeout: null,
		startContextMenuTimer: function() {
			//
			
			var t = this;
			
			t.killContextMenuTimer();
			
			t.contextMenuTimer = setTimeout(function() {
				t.hideContextMenu();
				t.killContextMenuTimer();
			}, 750);
		},
		killContextMenuTimer: function() {
			var timer = this.contextMenuTimer;
			
			//
			
			if (timer != null) {				
				clearTimeout(timer);
				delete timer;
				timer = null;
			}
		},		
		
		hideContextMenu: function() {
			this.contextMenu.hide();
		},
		
		renderContextMenu: function(x,y) {
			
			// alway re-render the items so that things like "turn fullscreen on" and "turn fullscreen off" are always written correctly
			var t = this,
				html = '',
				items = t.options.contextMenuItems;
			
			for (var i=0, il=items.length; i<il; i++) {
				
				if (items[i].isSeparator) {
					html += '<div class="mejs-contextmenu-separator"></div>';
				} else {
				
					var rendered = items[i].render(t);
				
					// render can return null if the item doesn't need to be used at the moment
					if (rendered != null) {
						html += '<div class="mejs-contextmenu-item" data-itemindex="' + i + '" id="element-' + (Math.random()*1000000) + '">' + rendered + '</div>';
					}
				}
			}
			
			// position and show the context menu
			t.contextMenu
				.empty()
				.append($(html))
				.css({top:y, left:x})
				.show();
				
			// bind events
			t.contextMenu.find('.mejs-contextmenu-item').each(function() {
							
				// which one is this?
				var $dom = $(this),
					itemIndex = parseInt( $dom.data('itemindex'), 10 ),
					item = t.options.contextMenuItems[itemIndex];
				
				// bind extra functionality?
				if (typeof item.show != 'undefined')
					item.show( $dom , t);
				
				// bind click action
				$dom.click(function() {			
					// perform click action
					if (typeof item.click != 'undefined')
						item.click(t);
					
					// close
					t.contextMenu.hide();				
				});				
			});	
			
			// stop the controls from hiding
			setTimeout(function() {
				t.killControlsTimer('rev3');	
			}, 100);
						
		}
	});
	
})(mejs.$);
(function($) {
	// skip back button

	$.extend(mejs.MepDefaults, {
		skipBackInterval: 30,
		// %1 will be replaced with skipBackInterval in this string
		skipBackText: ''
	});

	$.extend(MediaElementPlayer.prototype, {
		buildskipback: function(player, controls, layers, media) {
			var
				t = this,
				defaultTitle = mejs.i18n.t('mejs.time-skip-back', t.options.skipBackInterval),
				skipTitle = t.options.skipBackText ? t.options.skipBackText : defaultTitle,
				// create the loop button
				loop =
				$('<div class="mejs-button mejs-skip-back-button">' +
					'<button type="button" aria-controls="' + t.id + '" title="' + skipTitle + '" aria-label="' + skipTitle + '">' + t.options.skipBackInterval + '</button>' +
				'</div>')
				// append it to the toolbar
				.appendTo(controls)
				// add a click toggle event
				.click(function() {
					media.setCurrentTime(Math.max(media.currentTime - t.options.skipBackInterval, 0));
					$(this).find('button').blur();
				});
		}
	});

})(mejs.$);

/**
 * Postroll plugin
 */
(function($) {

	$.extend(mejs.MepDefaults, {
		postrollCloseText: ''
	});

	// Postroll
	$.extend(MediaElementPlayer.prototype, {
		buildpostroll: function(player, controls, layers, media) {
			var
				t = this,
				postrollTitle = t.options.postrollCloseText ? t.options.postrollCloseText : mejs.i18n.t('mejs.close'),
				postrollLink = t.container.find('link[rel="postroll"]').attr('href');

			if (typeof postrollLink !== 'undefined') {
				player.postroll =
					$('<div class="mejs-postroll-layer mejs-layer"><a class="mejs-postroll-close" onclick="$(this).parent().hide();return false;">' + postrollTitle + '</a><div class="mejs-postroll-layer-content"></div></div>').prependTo(layers).hide();

				t.media.addEventListener('ended', function (e) {
					$.ajax({
						dataType: 'html',
						url: postrollLink,
						success: function (data, textStatus) {
							layers.find('.mejs-postroll-layer-content').html(data);
						}
					});
					player.postroll.show();
				}, false);
			}
		}
	});

})(mejs.$);
/*
MediaElement-Markers is a MediaElement.js plugin that lets you add Visual Cues in the progress time rail. 
This plugin also lets you register a custom callback function that will be called everytime the play position reaches a marker. 
Marker position and a reference to the MediaElement Player object is passed to the registered callback function for any post processing. Marker color is configurable.

*/

(function ($) {
    // markers

    $.extend(mejs.MepDefaults, {
        markerColor: '#E9BC3D', //default marker color
        markers: [],
        markerCallback: function () {

        }
    });

    $.extend(MediaElementPlayer.prototype, {
        buildmarkers: function (player, controls, layers, media) {
            var t = this,
                i = 0,
                currentPos = -1,
                currentMarker = -1,
                lastPlayPos = -1, //Track backward seek
                lastMarkerCallBack = -1; //Prevents successive firing of callbacks

            for (i = 0; i < player.options.markers.length; ++i) {
                controls.find('.mejs-time-total').append('<span class="mejs-time-marker"></span>');
            }

            media.addEventListener('durationchange', function (e) {
                player.setmarkers(controls);
            });
            media.addEventListener('timeupdate', function (e) {
                currentPos = Math.floor(media.currentTime);
                if (lastPlayPos > currentPos) {
                    if (lastMarkerCallBack > currentPos) {
                        lastMarkerCallBack = -1;
                    }
                } else {
                    lastPlayPos = currentPos;
                }

                for (i = 0; i < player.options.markers.length; ++i) {
                    currentMarker = Math.floor(player.options.markers[i]); 
                    if (currentPos === currentMarker && currentMarker !== lastMarkerCallBack) {
                        player.options.markerCallback(media, media.currentTime); //Fires the callback function
                        lastMarkerCallBack = currentMarker;
                    }
                }

            }, false);

        },
        setmarkers: function (controls) {
            var t = this,
                i = 0,
                left;

            for (i = 0; i < t.options.markers.length; ++i) {
                if (Math.floor(t.options.markers[i]) <= t.media.duration && Math.floor(t.options.markers[i]) >= 0) {
                    left = 100 * Math.floor(t.options.markers[i]) / t.media.duration;
                    $(controls.find('.mejs-time-marker')[i]).css({
                        "width": "1px",
                        "left": left+"%",
                        "background": t.options.markerColor
                    });
                }
            }

        }
    });
})(mejs.$);