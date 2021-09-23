/*
** chrome.js
**
** Author: Jason Darwin
**
** Functions to support Readk.it user interface customisation.
*/

 /*global define:false */
define([
    'jquery',
    'app/utility',
    'app/config',
    'zip/zip',
    'zip/inflate',
    'iscroll',
    'lodash',
    'jquery.ba-resize',
    'jquery.noClickDelay',
    'jquery.ui.totop'
], function($, utility, config, zip, inflate, IScroll, _){

    var controller;
    var layout;
    var upload = {};
    var progress_total = 0;
    var identifier;

    /* Constructor */
    var Chrome = function (caller, surface) {
        controller = caller;
        layout = surface;

        // We wait until the publication is loaded into the layout
        // before activating the chrome.
        utility.subscribe('publication_loaded', initialiser);
    };

    function initialiser() {
        identifier = layout.identifier;
        utility.subscribe('history_changed', check_backbutton);

        $().UItoTop({ easingType: 'easeOutQuart', layout: layout });

        //$('.readkit-back').noClickDelay();
        $('.readkit-status').noClickDelay();
        $('.readkit-serif').noClickDelay();
        $('.readkit-sans').noClickDelay();
        $('#readkit-for-size').noClickDelay();
        //$('.readkit-strength-size').noClickDelay();
        $('#readkit-for-lineheight').noClickDelay();
        //$('.readkit-strength-line-height').noClickDelay();
        $('#readkit-for-bookmark').noClickDelay();
        $('#readkit-bookmark-widget a').noClickDelay();
        //$('#readkit-pageWrapper').noClickDelay();

        // Check for stored font preference and apply accordingly.
        var font = utility.storage(identifier, 'font');
        if (font === 'serif') {
            $('.readkit-icon-serif').click();
        } else if (font === 'sans') {
            $('.readkit-icon-sans').click();
        } else {
            // By default we use the publication styles.
            $.each($('link[href$="serif.css"]'), function(i, link) {
                link.disabled=true;
            });
            $.each($('link[href$="sans.css"]'), function(i, link) {
                link.disabled=true;
            });
        }

        // Check for stored font-size preference and apply accordingly.
        var fontsize = utility.storage(identifier, 'font-size');
        if (_.isNumber(fontsize)) {
            $('#readkit-for-size').addClass('readkit-active');
            $('#readkit-pageWrapper').css('font-size', fontsize + 'px');
            $('.readkit-strength-size[data-size="' + fontsize + '"]')
                .removeClass('readkit-inactive')
                .addClass('readkit-active');
        } else {
            // By default we use the publication styles.
            //$('.readkit-strength-size.readkit-small').removeClass('readkit-inactive').addClass('readkit-active');
        }

        // Check for stored line-height preference and apply accordingly.
        var lineheight = utility.storage(identifier, 'line-height');
        if (_.isNumber(lineheight)) {
            $('#readkit-for-lineheight').addClass('readkit-active');
            $('#readkit-pageWrapper')
                .find(config.tags)
                .css('line-height', lineheight);
            $('.readkit-strength-line-height[data-size="' + lineheight + '"]')
                .removeClass('readkit-inactive')
                .addClass('readkit-active');
        } else {
            // By default we use the publication styles.
            //$('.readkit-strength-line-height.readkit-small').removeClass('readkit-inactive').addClass('readkit-active');
        }

        $.resize.delay = config.resize_interval;

        if ($('.readkit-library').attr('data-library')) {
            // Check online status immediately, instead of waiting for the first setInterval
            check_status();

            // Check online status on a regular interval
            setInterval( check_status, config.check_status_interval);
        } else {
            // Hide the library button
            $('.readkit-library').toggle();
        }

        // Check the backbutton status
        check_backbutton();

        // Check the bookmarks status
        check_bookmarks();

        // Remove site preloader
        $('#readkit-sitePreloader').delay('fast').fadeOut('slow', function() {
            layout.refresh();
            $(this).remove();
        });

        document.title = layout.publication.title;
        // $('.readkit-title span').text(layout.publication.title);

        // For file URLs, where the user has most likely double-clicked the index.html
        // show the drag and drop dialogue, as no publication has been loaded.
        if (location.protocol === 'file:' || !$('#readkit-pageScroller .readkit-page').length) {
            // We don't want to show the drag and drop dialogue if the use has
            // double-clicked a readkit solo publication.

            // Dmitry: temporary disabled
            // if (!/readkit.solo/.test(location.href)) {
            //     if (!$('.readkit-drag-upload-window').is(':visible')) {
            //         upload.initalise();
            //     }
            // }
        }
    }

    /* Register handlers. */

    // Setup our back button
    $('.readkit-back').click(function(){
        layout.go_back();
        check_backbutton();
    });

    function check_backbutton() {
        var history = utility.storage(identifier, 'history');
        var status = history && history.length ? 'readkit-active' : 'readkit-inactive';

        if (status === 'readkit-active') {
            $('.readkit-back').removeClass('readkit-inactive');
        } else {
            $('.readkit-back').removeClass('readkit-active');
        }
        $('.readkit-back').addClass(status);
    }

    $('.readkit-status').click(function(){
        document.location = $('.readkit-status a').attr('href');
    });

    // Font style handlers
    $('.readkit-icon-sans').click(function(){
        if (utility.supported(utility.operation.fontSwitch)) {

            var y_percent = layout.location().y / layout.location().height;
            $('.readkit-scroller').resize(function(){
                layout.refresh(layout.location().page, y_percent);

                // We wait for a reasonable amount of time for the DOM
                // to adapt to the CSS changes, and then stop polling for resize.
                // If we don't do this, scroll performance may be affected.
                setTimeout(function () {
                    $('.readkit-scroller').unbind('resize');
                }, config.css_redraw_interval);
            });

            if ( $('.readkit-icon-sans').hasClass('readkit-active') ) {
                $('#readkit-pageWrapper')
                    .find(config.tags)
                    .removeClass('readkit-sans');
                $('.readkit-icon-sans').removeClass('readkit-active');

                utility.storage(identifier, 'font', []);
            } else {
                try {
                    $('#readkit-pageWrapper')
                        .find(config.tags)
                        .addClass('readkit-sans')
                        .removeClass('readkit-serif');
                    $('.readkit-icon-serif').removeClass('readkit-active');
                    $('.readkit-icon-sans').addClass('readkit-active');
                    utility.storage(identifier, 'font', 'sans');
                } catch (e) {
                    utility.log(e.message);
                }
            }
        }
    });

    $('.readkit-icon-serif').click(function(){
        if (utility.supported(utility.operation.fontSwitch)) {

            var y_percent = layout.location().y / layout.location().height;
            $('.readkit-scroller').resize(function(){
                layout.refresh(layout.location().page, y_percent);

                // We wait for a reasonable amount of time for the DOM
                // to adapt to the CSS changes, and then stop polling for resize.
                // If we don't do this, scroll performance may be affected.
                setTimeout(function () {
                    $('.readkit-scroller').unbind('resize');
                }, config.css_redraw_interval);
            });

            if ( $('.readkit-icon-serif').hasClass('readkit-active') ) {
                $('#readkit-pageWrapper')
                    .find(config.tags)
                    .removeClass('readkit-serif');
                $('.readkit-icon-serif').removeClass('readkit-active');

                utility.storage(identifier, 'font', []);
            } else {
                $('#readkit-pageWrapper').find(config.tags)
                    .addClass('readkit-serif')
                    .removeClass('readkit-sans');
                $('.readkit-icon-sans').removeClass('readkit-active');
                $('.readkit-icon-serif').addClass('readkit-active');
                utility.storage(identifier, identifier, 'font', 'serif');
            }
        }
    });

    // Fontsize event handlers
    // For some reason this handler always fires twice in certain browsers
    // (Firefox and Safari, but not Chrome) -- deal with it.
    var readkit_dropdown_size_ready = true;
    $('#readkit-for-size').on('click', function(e){
        if (readkit_dropdown_size_ready) {
            readkit_dropdown_size_ready = false;
            if ( $('#readkit-dropdown-size').is(':visible') ) {
                $('#readkit-dropdown-size').slideUp('slow');
            } else {
                if ( $('#readkit-dropdown-lineheight').is(':visible') ) {
                    $('#readkit-dropdown-lineheight').slideUp();
                }
                if ( $('#readkit-dropdown-bookmark').is(':visible') ) {
                    $('#readkit-dropdown-bookmark').slideUp();
                }
                var value = utility.storage(identifier, 'font-size');
                $('.readkit-strength-size[data-size="' + value + '"]')
                    .removeClass('readkit-inactive')
                    .addClass('readkit-active');
                $('#readkit-dropdown-size').slideDown('slow');
            }
        }

        setTimeout(function () {
            readkit_dropdown_size_ready = true;
        }, 700);
    });

    $('.readkit-strength-size').on('click', function(e){
        e.stopPropagation();

        var y_percent = layout.location().y / layout.location().height;
        $('.readkit-scroller').resize(function(){
            layout.refresh(layout.location().page, y_percent);

            // We wait for a reasonable amount of time for the DOM
            // to adapt to the CSS changes, and then stop polling for resize.
            // If we don't do this, scroll performance may be affected.
            setTimeout(function () {
                $('.readkit-scroller').unbind('resize');
            }, config.css_redraw_interval);
        });

        var value = [];
        if ( $(this).hasClass('readkit-active') ) {
            $('.readkit-strength-size')
                .removeClass('readkit-active')
                .addClass('readkit-inactive');
            $('#readkit-pageWrapper').css('font-size', '');
            $('#readkit-for-size').removeClass('readkit-active');
        } else {
            $('.readkit-strength-size')
                .removeClass('readkit-active')
                .addClass('readkit-inactive');
            $(this)
                .removeClass('readkit-inactive')
                .addClass('readkit-active');
            value = $(this).data('size');
            $('#readkit-pageWrapper').css('font-size', value + 'px');
            $('#readkit-for-size').addClass('readkit-active');
        }

        utility.storage(identifier, 'font-size', value);

        setTimeout(function () {
            $('#readkit-dropdown-size').slideUp('slow');
        }, 700);

    });

    // Line-height event handlers
    // For some reason this handler always fires twice in certain browsers
    // (Firefox and Safari, but not Chrome) -- deal with it.
    var readkit_dropdown_lineheight_ready = true;
    $('#readkit-for-lineheight').on('click', function(){
        if (readkit_dropdown_lineheight_ready) {
            readkit_dropdown_lineheight_ready = false;
            if ( $('#readkit-dropdown-lineheight').is(':visible') ) {
                $('#readkit-dropdown-lineheight').slideUp('slow');
            } else {
                if ( $('#readkit-dropdown-size').is(':visible') ) {
                    $('#readkit-dropdown-size').slideUp();
                }
                if ( $('#readkit-dropdown-bookmark').is(':visible') ) {
                    $('#readkit-dropdown-bookmark').slideUp();
                }
                var value = utility.storage(identifier, 'line-height');
                $('.readkit-strength-line-height[data-size="' + value + '"]')
                    .removeClass('readkit-inactive')
                    .addClass('readkit-active');
                $('#readkit-dropdown-lineheight').slideDown('slow');
            }
        }

        setTimeout(function () {
            readkit_dropdown_lineheight_ready = true;
        }, 700);
    });

    $('.readkit-strength-line-height').on('click', function(e){
        e.stopPropagation();

        var y_percent = layout.location().y / layout.location().height;
        $('.readkit-scroller').resize(function(){
            layout.refresh(layout.location().page, y_percent);

            // We wait for a reasonable amount of time for the DOM
            // to adapt to the CSS changes, and then stop polling for resize.
            // If we don't do this, scroll performance may be affected.
            setTimeout(function () {
                $('.readkit-scroller').unbind('resize');
            }, config.css_redraw_interval);
        });

        var value = [];
        if ( $(this).hasClass('readkit-active') ) {
            $('.readkit-strength-line-height')
                .removeClass('readkit-active')
                .addClass('readkit-inactive');
            $('#readkit-pageWrapper')
                .find(config.tags)
                .css('line-height', '');
            $('#readkit-for-lineheight').removeClass('readkit-active');
        } else {
            $('.readkit-strength-line-height')
                .removeClass('readkit-active')
                .addClass('readkit-inactive');
            $(this)
                .removeClass('readkit-inactive')
                .addClass('readkit-active');
            value = $(this).data('size');
            $('#readkit-pageWrapper')
                .find(config.tags)
                .css('line-height', value);
            $('#readkit-for-lineheight').addClass('readkit-active');
        }

        utility.storage(identifier, 'line-height', value);

        setTimeout(function () {
            $('#readkit-dropdown-lineheight').slideUp('slow');
        }, 700);
    });

    var repeat = function(value, times) {
        times = times || 1;
        return (new Array(times + 1)).join(value);
    };

    var bookmark_scroller;

    // Bookmark event handlers
    function check_bookmarks() {
        var bookmarks = utility.storage(identifier, 'bookmarks')  || [];

        var input = '';
        if (layout.location().file && layout.location().title) {
            input = utility.compile($('#readkit-bookmark-input-tmpl').html(), {
                file:  layout.location().file,
                title: layout.location().title
            });
        }

        if (bookmarks && bookmarks.length) {
            $('#readkit-for-bookmark').addClass('readkit-active').removeClass('readkit-inactive');
            $('#readkit-for-bookmark').addClass('active');
        } else {
            $('#readkit-for-bookmark').addClass('readkit-inactive').removeClass('readkit-active');
        }

        var bookmarkeds = '';
        $.each(bookmarks, function(i, bookmark) {
            bookmarkeds += utility.compile($('#readkit-bookmark-list-item-tmpl').html(), {
                index:  i,
                file:  bookmark.file,
                title: bookmark.title,
                x:     bookmark.x,
                y:     bookmark.y
            });
        });
        var html = utility.compile($('#readkit-bookmark-list-tmpl').html(), {bookmarkeds: bookmarkeds});

        var navs = '';
        $.each(layout.nav(), function(i, item) {
            if (item.title) {
                navs += repeat('<ul style="margin-top:0; margin-bottom:0;">', item.depth + 1);
                navs += utility.compile('<li><a href="#<%url%>"><%title%></a></li>', {url: item.url, title: item.title});
                navs += repeat('</ul>', item.depth + 1);
            }
        });
        html += navs;

        if(navs.length < 2) {
            $('.readkit-bookmark.readkit-slider').remove();
        }

        html = utility.compile(input + $('#readkit-bookmark-widget-tmpl').html(),
            {html: html}
        );

        $('#readkit-dropdown-bookmark').html(html);

        bookmark_scroller = new IScroll('readkit-bookmark-widget', {snap: true, momentum: true, hScroll: false, hScrollbar: false, vScrollbar: false, lockDirection: true,
            onAnimationEnd: function(){
            }
        });
    }

    // For some reason this handler always fires twice in certain browsers
    // (Firefox and Safari, but not Chrome) -- deal with it.
    var readkit_dropdown_bookmark_ready = true;
    $('#readkit-for-bookmark').on('touchstart click', function(){
        if (readkit_dropdown_bookmark_ready) {
            readkit_dropdown_bookmark_ready = false;
            if ( $('#readkit-dropdown-bookmark').is(':visible') ) {
                $('#readkit-dropdown-bookmark').slideUp('slow');
            } else {
                var value = utility.storage(identifier, 'font-bookmark');
                $('.readkit-strength-bookmark[data-size="' + value + '"]').addClass('readkit-active');
                if ( $('#readkit-dropdown-size').is(':visible') ) {
                    $('#readkit-dropdown-size').slideUp();
                }
                if ( $('#readkit-dropdown-lineheight').is(':visible') ) {
                    $('#readkit-dropdown-lineheight').slideUp();
                }

                // Capture clicks on anchors so we can update the scroll position.
                $('#readkit-bookmark-widget a').on('click', function(event) {
                    layout.trap_anchor(this, event);
                    $('#readkit-dropdown-bookmark').slideUp('slow');
                });

                $('#readkit-dropdown-bookmark').slideDown('slow', function() {
                    setTimeout(function () {
                        bookmark_scroller.refresh();
                    }, 0);
                });
            }
        }

        setTimeout(function () {
            readkit_dropdown_bookmark_ready = true;
        }, 700);
    });

    $('#readkit-dropdown-bookmark').on('click', '.readkit-remove-bookmark', function(e){
        e.preventDefault();
        var index = $(this).data('index');

        var bookmarks = utility.storage(identifier, 'bookmarks') || [];
        bookmarks.splice(index,1);
        utility.storage(identifier, 'bookmarks', bookmarks);

        $(this).parent().remove();

        if (!(bookmarks && bookmarks.length)) {
            $('#readkit-for-bookmark').addClass('readkit-inactive').removeClass('readkit-active');
        }

    });

    $('#readkit-dropdown-bookmark').on('click', '.readkit-add-bookmark', function(e){
        e.preventDefault();
        $('#readkit-for-bookmark').addClass('readkit-active').removeClass('readkit-inactive');

        var value = $('#readkit-bookmark-input').val();
        var file = $('#readkit-bookmark-input').attr('data-file');
        var bookmarks = utility.storage(identifier, 'bookmarks') || [];

        var bookmark = {
            title: value,
            file: file,
            x: layout.location().x,
            y: layout.location().y
        };

        var html = utility.compile($('#readkit-bookmark-list-item-tmpl').html(),
            {   index: bookmarks.length,
                file:  bookmark.file,
                title: bookmark.title,
                x:     bookmark.x,
                y:     bookmark.y}
        );

        $('#readkit-bookmark-list').append(html);
        bookmarks.push(bookmark);
        utility.storage(identifier, 'bookmarks', bookmarks);
    });

    // close any open dropdowns if the user clicks elsewhere
    $('#readkit-pageWrapper').on('click', function(){
        $('.readkit-dropdown').slideUp('slow');
    });

    // Initialise online status indicator
    function check_status() {
        var status = navigator.onLine ? 'readkit-online' : 'readkit-offline';
        if ( status === 'readkit-online' ) {
            $('.readkit-status').removeClass('readkit-offline');
        } else {
            $('.readkit-status').removeClass('readkit-online');
        }
        $('.readkit-status').addClass(status);
    }

    $('.readkit-cancel_upload').on('click', function(e){
        e.stopPropagation();
        $('.readkit-drag-upload-window').slideUp('slow', function(){
        $(".readkit-drag-upload-spinner").removeClass('loading');
        });
    });

    upload.handle_drag_enter = function (e) {
        e.stopPropagation();
        e.preventDefault();

        if (! $('.readkit-drag-upload-window').is(':visible')) {
            upload.initalise();
        }

        var epub_drag_upload = $("#readkit-epub-drag-upload")[0];
        epub_drag_upload.addEventListener("drop", upload.prep_dropped_files_for_upload, false);
        epub_drag_upload.addEventListener("dragover", function (e) {
            e.stopPropagation();
            e.preventDefault();
        }, false);
    };

    upload.initalise = function () {
        progress_total = 0;
        $(".readkit-meter span").attr("style", "width:0%");
        $(".readkit-epub-drag-upload-label").removeClass("loading").text("Drag an EPUB file into this space to start reading.");
        $(".readkit-drag-upload-spinner").removeClass('loading');

        $('.readkit-drag-upload-window').slideDown();
    };

    upload.prep_dropped_files_for_upload = function (e) {
        e.stopPropagation();
        e.preventDefault();
        var filelist = e.dataTransfer.files;
        upload.upload_files(e, filelist);
        return false;
    };

    upload.upload_files = function (e, filelist) {
        var files = [];
        filelist = filelist || $("#readkit-id_epub")[0].files;
        if (filelist.length) {

            // Chrome's (and now Firefox) security policies means webworkers are not allowed
            // with file urls, therefore we have to put up with slower
            // single-threaded zip inflation.
            zip.useWebWorkers = location.protocol !== 'file:' && config.mode !== 'reader' && config.mode !== 'solo';

            zip.workerScriptsPath = config.workerScriptsPath;
            var f = filelist[0];
            zip.createReader(new zip.BlobReader(f), function(zipReader){
                zipReader.getEntries(function(entries){

                    $.when.apply(this, $.map(entries, function(entry) {
                        return $.Deferred(function(deferred_entry){

                            if (utility.isTextFile(entry.filename)) {
                                // This is a text-like file that we need to parse or load directly
                                // into the browser, so store as text.
                                try {
                                    // There's an issue with zip.TextWriter failing silently in
                                    // Firefox; we have to supply 'utf-8', and also wrap it in
                                    // a try-catch block for good measure.
                                    // https://github.com/gildas-lormeau/zip.js/issues/58
                                    entry.getData(new zip.TextWriter('utf-8'), function(text){
                                        upload.progress(f, entry);
                                        if (config.log) {
                                            utility.log(entry.filename);
                                        }
                                        deferred_entry.resolve(text);
                                    });
                                } catch (e) {
                                    utility.log('zip.TextWriter failure with ' + entry.filename + ': ' + e);
                                }
                            } else {
                                // Retrieve other files as blobs, i.e. don't uncompress them to text
                                // as in a number of cases we'd simply have to recompress them
                                // to display them (e.g. jpg) and that would be silly.
                                entry.getData(new zip.BlobWriter(), function(blob){
                                    upload.progress(f, entry);
                                    if (config.log) {
                                        utility.log(entry.filename);
                                    }
                                    deferred_entry.resolve(blob);
                                });
                            }

                        }).done(function(value){
                            var filename = entry.filename;
                            files[filename] = value;
                        });
                    })).done(function(){
                        upload.complete(100);
                        setTimeout(function () {
                            $('.readkit-drag-upload-window').slideUp('slow');
                        }, 0);
                        controller.initialise('', {}, files);
                    });
                });

            }, upload.failed);
            $(".readkit-epub-drag-upload-label").addClass("loading").text("Uploading EPUB...");
            $(".readkit-drag-upload-spinner").addClass("loading");
            return false;
        }
    };

    upload.progress = function (f, entry) {
        if (entry.compressedSize) {
            var progress_file = Math.round(entry.compressedSize * 100 / f.size);
            progress_total += progress_file;
            $(".readkit-meter span").attr("style", "width:" + progress_total.toString() + "%");
            if (progress_total <= 99) {
                $(".readkit-epub-drag-upload-label").html("Unpacking EPUB...");
            }
        }
    };

    upload.complete = function (a) {
    $(".readkit-meter span").attr("style", "width:" + a.toString() + "%");
        $(".readkit-epub-drag-upload-label").text("Opening EPUB...");
    };

    upload.failed = function (a) {
        //upload.show_error_message(a.toString());
        utility.error(a.toString());
    };

    upload.cancelled = function (e) {
        utility.debug("The upload has been canceled by the user or the browser dropped the connection.");
    };
/*     if ("FileReader" in window && Modernizr.draganddrop) { */
    if ("FileReader" in window && !config.lite) {
        $("#epub-upload p").show();
        var drag_zone = $("#readkit-pageWrapper")[0];
        drag_zone.addEventListener("dragenter", upload.handle_drag_enter, false);
        var body = $("body")[0];
        body.addEventListener("dragover", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }, false);
        body.addEventListener("drop", function (e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }, false);
    }

    if (window.location.protocol === 'file:') {
        $('#readkit-sitePreloader').hide();
    }

    if (
    ("standalone" in window.navigator) &&
    window.navigator.standalone
    ){
        // Account for the status bar on iOS when in stand-alone mode.
        // http://www.bennadel.com/blog/1950-Detecting-iPhone-s-App-Mode-Full-Screen-Mode-For-Web-Applications.htm
        $('.readkit-header').css({'margin-top': '20px'});
        $('#readkit-pageWrapper').css('top', '60px');
    }

    return (Chrome);
});
