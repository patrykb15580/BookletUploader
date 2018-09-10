var BookletUploaderTemplate = (function() {
    var _html = {
        panel: '<div id="bu--dialog">\
            <div class="bu--panel">\
                <div class="bu--panel-header">{{header}}</div>\
                <div class="bu--panel-body"></div>\
                <div class="bu--panel-footer">\
                    <ul class="bu--footer-nav">\
                        <li class="bu--footer-nav--left">\
                            <button class="bu--button bu--panel-close">{{reject}}</button>\
                        </li>\
                        <li class="bu--footer-nav--right">\
                            <button class="bu--button bu--button-primary bu--panel-done">{{done}}</button>\
                        </li>\
                    </ul>\
                </div>\
            </div>\
        </div>',
        uploader: '<input id="bu--files-picker" class="bu--files-picker" type="file" />\
        <div class="bu--uploader-header">\
            <label class="bu--button bu--button-primary bu--select-files" for="bu--files-picker">\
                {{files_picker}}\
            </label>\
            {{#max_size_info}}\
                <div class="bu--max-file-size-info">\
                    {{max_size_info}}\
                </div>\
            {{/max_size_info}}\
        </div>\
        <ul class="bu--files-list"></ul>\
        <div class="bu--files-counter">\
            {{files_counter}}\
        </div>',
        file: '<li class="bu--file file-{{file_hash}}" data-hash="{{file_hash}}">\
            <div class="bu--file-preview"></div>\
            <div class="bu--file-details">\
                <div class="bu--file-name">{{file_name}}</div>\
                <div class="bu--file-size">{{file_size}}</div>\
                <div class="bu--file-upload-progress">\
                    <div class="bu--progressbar">\
                        <div class="bu--progress"></div>\
                    </div>\
                    <div class="bu--file-upload-error"></div>\
                </div>\
            </div>\
            <ul class="bu--file-actions">\
                <li class="bu--file-action-button file-action-remove">\
                    <i class="fa fa-trash"></i>\
                </li>\
            </ul>\
        </li>',
        editor: '<div class="bu--panel-content bu--editor-content">\
            <div class="bu--editor-preview">\
                <div class="bu--loader lg"></div>\
            </div>\
            <div class="bu--panel-menu bu--editor-menu"></div>\
        </div>\
        <div class="bu--panel-content bu--cropper">\
            <div class="bu--cropper-holder">\
                <img src="" alt="" />\
            </div>\
            <div class="bu--panel-menu bu--cropper-menu"></div>\
        </div>',
        editor_effect_button: '<li class="bu--menu-item bu--effect-button bu--effect-{{effect}}" title="{{label}}" data-effect="{{effect}}">\
            <i class="bu--icon icon-{{effect}} sm"></i>\
        </li>',
        cropper_crop_size_button: '<li class="bu--menu-item" data-label="{{label}}">\
            <div class="bu--crop-size"></div>\
        </li>'
    };

    var getHTML = function(elem_name) {
        return _html[elem_name];
    }

    var getElement = function(elem_name) {
        return $(getHTML(elem_name));
    }

    var render = function(html, data) {
        return $(Mustache.render(html, data));
    }

    return {
        getHTML: getHTML,
        getElement: getElement,
        render: render,
    };
})();

var BookletUploader = (function() {
    // Add clean method to array prototype
    Array.prototype.clean = function(value = '') {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == value) {
                this.splice(i, 1);
                i--;
            }
        }

        return this;
    };

    var routing = {
        routes: {
            test: { method: 'GET', path: '/test' },
            file_show: { method: 'GET', path: '/file/[:hash_id]' },
            file_create: { method: 'POST', path: '/file/create' },
            file_update: { method: 'POST', path: '/file/[:hash_id]' },
        },
        path: function(name, params = {}) {
            var route = this.routes[name];

            if (typeof route === 'undefined') {
                console.error('Generate route:', name, params);
                throw 'generate undefined route';

                return false;
            }

            var path = route.path;

            for (var param in params) {
                path = path.replace('[:' + param + ']', params[param]);
            }

            return path;
        },
        url: function(path_name, path_params = {}) {
            var env = $('body').data('env');
            var service_url = (env == 'production') ? 'https://kreator.fotobum.pl' : 'http://kreator.fotobum.test';

            return service_url + this.path(path_name, path_params);
        },
        request: function(path_name, path_params = {}, data = {}, options = {}) {
            var route = this.routes[path_name];

            if (typeof route === 'undefined') {
                return false;
            }

            var defaults = {
                dataType: 'json',
                cache: false,
                contentType: false,
                processData: false
            }
            var options = $.extend(defaults, options, {
                url: this.url(path_name, path_params),
                type: route.method,
                data: data,
            });

            return $.ajax(options);
        }
    }

    var defaults = {
        locale: 'en',
        store_to: 'local',
        multiple: true,
        max_files: null,
        drag_and_drop: false,
        images_only: false,
        max_size: null,
        crop: null,
    };

    var _panel = null;

    var image_file_types = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff', 'image/bmp'];
    var utils = {
        uid: function() {
            var hex_chr = '0123456789abcdef';
            var uid = '';
            for (var i = 0; i < 32; i++) {
                var a = Math.floor(Math.random() * (hex_chr.length - 1));

                 uid += hex_chr.charAt(a);
            }

            return uid;
        },
        sizeToSizeString: function(bytes) {
            var units = ['B','kB','MB','GB','TB','PB','EB','ZB','YB'];
            var size = bytes;
            var unit_index = 0;

            while (Math.abs(size) >= 1024 && unit_index < units.length) {
                size /= 1024;
                ++unit_index;
            }

            return Math.round(size * 10) / 10 + ' ' + units[unit_index];
        },
        isEmpty: function(variable) {
            // Check if object/array is empty
            if (typeof variable == 'object') {
                for (var key in variable) {
                    if (variable.hasOwnProperty(key)) {
                        return false;
                    }
                }

                return true;
            }

            var undef;
            var empty_values = [null, false, 0, '0', '', undef];

            for (var i = 0; i < empty_values.length; i++) {
                if (variable === empty_values[i]) {
                    return true;
                }
            }

            return false;
        },
        inArray: function(needle, haystack) {
            for (var i = 0; i < haystack.length; i++) {
                if (needle == haystack[i]) {
                    return true;
                }
            }

            return false;
        },
        setTextVariables: function(text, params = {}) {
            for (var param in params) {
                text = text.replace('%' + param + '%', params[param]);
            }

            return text;
        },
        clearArray: function(array, value = '') {
            if (typeof array == array) {
                var new_array = [];

                for (var i = 0; i < array.length; i++) {
                    if (array[i] !== value) {
                        new_array.push(array[i]);
                    }
                }

                array = new_array;
            }

            return array;
        },
        isAspectRatioString: function(string) {
            return new RegExp(/\d\/\d/gi).test(string);
        },
        stringToAspectRatio: function(string) {
            var aspect_ratio = string.replace(/ /g, '').split(',').clean()[0];
            if (this.isAspectRatioString(aspect_ratio)) {
                var parts = aspect_ratio.split('/');

                return parts[0] / parts[1];
            }

            return null;
        },
        listAspectRatiosFromString: function(string) {
            var parts = string.replace(/ /g, '').split(',').clean();
            var aspect_ratios = [];

            for (var i = 0; i < parts.length; i++) {
                var str = parts[i];

                if (str == 'free' || this.isAspectRatioString(str)) {
                    aspect_ratios.push(str);
                }
            }

            if (aspect_ratios.length == 0) {
                aspect_ratios.push('free');
            }

            return aspect_ratios;
        }
    };
    var locale = function(locale = 'en') {
        var locales = {
            en: {
                header: {
                    uploader: 'Select files to upload',
                    editor: 'Edit your image'
                },
                files_picker: 'Choose file',
                done: 'Done',
                upload: 'Upload',
                save: 'Save',
                apply: 'Apply',
                reject: 'Cancel',
                max_size_info: 'Max size of uploaded file is %max_size%',
                files_counter: 'Uploaded %files_number% files',
                from: 'of %number%',
                from_files: 'of %files_number% files',
                multiple: {
                    files_picker: 'Choose files',
                },
                crop: {
                    free: 'Free'
                },
                effects: {
                    crop: 'Crop',
                    rotate: 'Rotate',
                    flip: 'Flip',
                    mirror: 'Mirror',
                    grayscale: 'Grayscale',
                    negative: 'Negative',
                },
                errors: {
                    file: {
                        load: 'Load file error',
                        invalid_type: 'Invalid file type',
                        max_size: 'Max file size limit exceeded',
                        min_size: 'Min file size limit exceeded'
                    },
                    upload: {
                        default: 'Something went wrong',
                        abort: 'Upload canceled',
                    }
                }
            },
            pl: {
                header: {
                    uploader: 'Wybierz pliki do przesłania',
                    editor: 'Edycja zdjęcia'
                },
                files_picker: 'Wybierz plik',
                done: 'Zakończ',
                upload: 'Wyślij',
                save: 'Zapisz',
                apply: 'Zatwierdź',
                reject: 'Anuluj',
                max_size_info: 'Maksymalny rozmiar pliku wynosi %max_size%',
                files_counter: 'Przesłano %files_number% plików',
                from: ' z %number%',
                from_files: ' z %files_number% plików',
                multiple: {
                    files_picker: 'Wybierz pliki',
                },
                crop: {
                    free: 'Dowolny'
                },
                effects: {
                    crop: 'Kadrowanie',
                    rotate: 'Obrót',
                    flip: 'Odbicie poziome',
                    mirror: 'Odbicie pionowe',
                    grayscale: 'Szarość',
                    negative: 'Negatyw',
                },
                errors: {
                    file: {
                        load: 'Błąd ładowania pliku',
                        invalid_type: 'Nieprawidłowy format pliku',
                        max_size: 'Zbyt duży rozmiar pliku',
                        min_size: 'Zbyt mały rozmiar pliku'
                    },
                    upload: {
                        default: 'Błąd podczas wysyłania',
                        abort: 'Wysyłanie przerwane',
                    }
                }
            }
        };

        var locale = locales[locale] || locales['en'];

        if (typeof BOOKLET_UPLOADER_LOCALE !== 'undefined') {
            locale = $.extend(locale, BOOKLET_UPLOADER_LOCALE);
        }

        return locale;
    };
    var openUploader = function(options = {}) {
        return new _openPanel(options).openUploader();
    }
    var openEditor = function(file_hash, options = {}) {
        return new _openPanel(options).openEditor(file_hash);
    }

    var _openPanel = function(options = {}) {
        if (_panel) {
            _panel.close();
        }

        var options = $.extend(defaults, options);

        var panel = $.extend($.Deferred(), {
            element: BookletUploaderTemplate.getElement('panel'),
            options: options,
            locale: locale(options.locale),
            render: function() {
                this.element.hide().appendTo('body').fadeIn(300);
            },
            close: function() {
                _panel = null;

                this.element.fadeOut(300, function() { $(this).remove(); });
            },
            openUploader: function() {
                var uploader = panel;

                var selected_files = {};
                var uploaded_files = {};

                var _selectedFilesNumber = function() {
                    return Object.keys(selected_files).length;
                }

                var _uploadedFilesNumber = function() {
                    return Object.keys(uploaded_files).length;
                }

                var _isMaxFilesNumberSelected = function() {
                    var files_number_limit = uploader.options.max_files;

                    if (files_number_limit && files_number_limit <= _selectedFilesNumber()) {
                        return true;
                    }

                    return false;
                }

                var _isMaxFilesNumberUploaded = function() {
                    var files_number_limit = uploader.options.max_files;

                    if (files_number_limit && files_number_limit <= _uploadedFilesNumber()) {
                        return true;
                    }

                    return false;
                }

                var _templateData = function() {
                    var data = {
                        header: uploader.locale.header.uploader,
                        reject: uploader.locale.reject,
                        done: uploader.locale.upload,
                        files_picker: uploader.locale.files_picker,
                        max_size_info: null,
                        files_counter: utils.setTextVariables(uploader.locale.files_counter, { files_number: _selectedFilesNumber() })
                    }

                    if (uploader.options.multiple) {
                        data.files_picker = uploader.locale.multiple.files_picker;
                    }

                    if (uploader.options.max_size) {
                        data.max_size_info = utils.setTextVariables(uploader.locale.max_size_info, {
                            max_size: utils.sizeToSizeString(uploader.options.max_size)
                        });
                    }

                    if (uploader.options.max_files) {
                        data.files_counter += utils.setTextVariables(uploader.locale.from_files, { files_number: uploader.options.max_files });
                    }

                    return data;
                };

                var _renderUploader = function() {
                    var uploader_content = BookletUploaderTemplate.getHTML('uploader');

                    uploader.element.addClass('bu--uploader').css({ height: window.innerHeight });
                    uploader.element.find('.bu--panel-body').append(uploader_content);
                    uploader.element.find('#bu--files-picker').attr('multiple', uploader.options.multiple).hide();

                    if (uploader.options.images_only) {
                        uploader.element.find('#bu--files-picker').attr('accept', image_file_types.join(','));
                    }

                    var html = uploader.element[0].outerHTML;
                    uploader.element = BookletUploaderTemplate.render(html, _templateData());

                    uploader.render();

                    uploader.elements = {
                        files_list: uploader.element.find('.bu--files-list'),
                        files_picker: uploader.element.find('#bu--files-picker'),
                        files_counter: uploader.element.find('.bu--files-counter'),
                        done: uploader.element.find('.bu--panel-done'),
                        cancel: uploader.element.find('.bu--panel-close'),
                    }
                };

                var _bindEvents = function() {
                    $(window).resize(function() {
                        uploader.element.css({ height: window.innerHeight });
                    });

                    uploader.elements.files_picker.on({
                        click: function(e) {
                            if (_isMaxFilesNumberSelected()) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        },
                        change: function() {
                            _onFilesSelect(this.files);
                        }
                    });

                    uploader.element.on('dragover dragleave drop', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                    });

                    if (uploader.options.drag_and_drop) {
                        uploader.element.on({
                            dragover: function(e) {
                                if (!_isMaxFilesNumberSelected()) {
                                    uploader.elements.files_list.addClass('bu--dragin');
                                }
                            },
                            dragleave: function(e) {
                                uploader.elements.files_list.removeClass('bu--dragin');
                            },
                            drop: function(e) {
                                uploader.elements.files_list.removeClass('bu--dragin');

                                if (!_isMaxFilesNumberSelected()) {
                                    _onFilesSelect(e.originalEvent.dataTransfer.files);
                                }
                            }
                        });
                    }

                    uploader.elements.files_list.on('click', '.bu--file .bu--file-action-button.file-action-remove', function() {
                        var file_elem = $(this).closest('.bu--file');
                        var hash = file_elem.data('hash');

                        if (hash in selected_files) {
                            selected_files[hash].reject();

                            delete selected_files[hash];
                            delete uploaded_files[hash];

                            _updateFilesCounter();
                        }

                        file_elem.fadeOut(300, function() { $(this).remove(); });
                    });

                    uploader.element.on('click', '.bu--panel-done', function() {
                        panel.resolve(Object.values(uploaded_files));
                    });

                    uploader.fail(function() {
                        $.each(selected_files, function(i, file) { file.reject(); });
                    });

                    uploader.element.on('click', '.bu--panel-close', function() {
                        panel.reject();
                    });

                    uploader.always(function() {
                        panel.close();
                    });
                };

                var _updateFilesCounter = function() {
                    var text = utils.setTextVariables(uploader.locale.files_counter, { files_number: _uploadedFilesNumber() });

                    if (uploader.options.max_files) {
                        text += utils.setTextVariables(uploader.locale.from_files, { files_number: uploader.options.max_files });
                    }

                    uploader.elements.files_counter.html(text);

                    if (_isMaxFilesNumberUploaded()) {
                        uploader.elements.files_counter.css({ color: '#53be31' });
                    } else {
                        uploader.elements.files_counter.removeAttr('style');
                    }
                };

                var _onFilesSelect = function(files) {
                    uploader.elements.done.removeClass('bu--panel-done bu--button-primary').addClass('bu--button-disabled');

                    $.each(files, function(i, file_data) {
                        if (_isMaxFilesNumberSelected()) {
                            return false; // return false == break
                        }

                        var file = new File({
                            name: file_data.name,
                            hash: utils.uid(),
                            size: file_data.size,
                            type: file_data.type
                        });

                        if (uploader.options.images_only && !utils.inArray(file.type, image_file_types)) {
                            return true; // return true == continue
                        }

                        if (uploader.options.max_size && file.size > uploader.options.max_size) {
                            return true; // return true == continue
                        }

                        file.done(function() {
                            uploaded_files[file.hash] = file;

                            _updateFilesCounter();
                        }).always(function() {
                            file.element.find('.bu--progressbar').hide();
                        });

                        uploader.elements.files_list.append(file.element);
                        file.element.find('.bu--progressbar').show();

                        var upload = new Upload(file, file_data, { crop: utils.stringToAspectRatio(uploader.options.crop) });

                        file.upload = upload;
                        selected_files[file.hash] = file;

                        upload.done(function() {
                            file.is_stored = true;
                            file.element.addClass('uploaded').find('.bu--file-preview').append('<div class="bu--loader sm"></div>');

                            file.file_info().done(function(response) {
                                var file_info = response.data;
                                var preview = $('<img src="' + file_info.preview + '" alt="" />');

                                file.element.find('.bu--file-preview').append(preview);

                                preview.on('load error', function() {
                                    file.element.find('.bu--file-preview .bu--loader').remove();
                                });

                                file.resolve(file_info);
                            }).fail(function(xhr) {
                                file.reject().element.find('.bu--file-preview .bu--loader').remove();
                            });
                        }).fail(function() {
                            delete selected_files[file.hash];

                            file.reject().error(panel.locale.errors.upload.default);
                        }).always(function() {
                            delete file.upload;
                        }).progress(function(progress) {
                            file.element.find('.bu--progress').css({ 'width': progress + '%' });
                        });

                        file.upload.start();
                    });

                    $.when.apply($, Object.values(selected_files)).always(function() {

                        // Double check in case select files before always callback called
                        $.when.apply($, Object.values(selected_files)).always(function() {
                            uploader.elements.done.removeClass('bu--button-disabled').addClass('bu--panel-done bu--button-primary');
                        });
                    });
                };

                _renderUploader();
                _bindEvents();

                var options = uploader.options;
                var locale = uploader.locale;
                var element = uploader.element;
                var elements = uploader.elements;
                var render = uploader.render;
                var close = uploader.close;

                uploader = uploader.promise();
                uploader.options = options;
                uploader.locale = locale;
                uploader.element = element;
                uploader.elements = elements;
                uploader.render = render;
                uploader.close = close;

                return uploader;
            },
            openEditor: function(file_hash) {
                var editor = panel;
                editor.options = $.extend({ effects: ['crop', 'rotate', 'mirror', 'flip', 'grayscale', 'negative'] }, editor.options);

                var transformations = {
                    order: ['crop', 'resize', 'rotate', 'flip', 'mirror', 'grayscale', 'negative'],
                    applied: {
                        crop: false,
                        resize: false,
                        rotate: false,
                        flip: false,
                        mirror: false,
                        grayscale: false,
                        negative: false
                    },
                    apply: function(transformation, params, callback = null) {
                        if (this.applied.hasOwnProperty(transformation)) {
                            this.applied[transformation] = params;
                        }

                        if (callback && typeof callback == 'function') {
                            callback.call();
                        }
                    },
                    remove: function(transformation, callback = null) {
                        if (this.applied.hasOwnProperty(transformation)) {
                            this.apply(transformation, false);
                        }

                        if (callback && typeof callback == 'function') {
                            callback.call();
                        }
                    },
                    get: function(transformation) {
                        return this.applied[transformation];
                    },
                    isActive: function(transformation) {
                        return (this.get(transformation)) ? true : false;
                    },
                    setDefault: function() {
                        // Set default transformations
                        var aspect_ratio = utils.stringToAspectRatio(editor.options.crop);
                        if (aspect_ratio) {
                            var source_width = editor.file.file_info.image_info.original_width, width = source_width;
                            var source_height = editor.file.file_info.image_info.original_height, height = source_height;

                            var x = 0, y = 0;

                            var source_ratio = width / height, target_ratio = aspect_ratio;

                            if (source_ratio !== target_ratio) {
                                if (source_ratio > target_ratio) {
                                    width = height / target_ratio, x = (source_width - width) / 2;
                                } else {
                                    height = width * target_ratio, y = (source_height - height) / 2;
                                }

                                transformations.apply('crop', [ width + 'x' + height, x + ',' + y ]);
                            }
                        }

                        // Set image transformation, override defaults is necessary
                        var modifiers = editor.file.file_info.modifiers.split('-/').clean();

                        for (var i = 0; i < modifiers.length; i++) {
                            var modifier = modifiers[i];
                            var params = modifier.split('/').clean();
                            var transformation = params.shift();

                            if (params.length == 0) {
                                params = true;
                            }

                            this.apply(transformation, params);
                        }
                    },
                    toString: function() {
                        var modifiers = [];

                        for (var i = 0; i < this.order.length; i++) {
                            var transformation = this.order[i];

                            if (this.applied[transformation]) {
                                var params = this.applied[transformation];
                                var modifier = transformation + '/';

                                if (Array.isArray(params) && params.length > 0) {
                                    modifier += params.join('/') + '/';
                                }

                                modifiers.push(modifier);
                            }
                        }

                        modifiers = modifiers.join('-/');

                        if (modifiers !== '') {
                            modifiers = '-/' + modifiers;
                        }

                        return modifiers;
                    },
                    toUrl: function() {
                        return editor.file.file_info.original_url + this.toString();
                    },
                }

                var operations = {
                    crop: function() {
                        var operation = $.Deferred();

                        var cropper = $.Deferred();
                        cropper.element = $('<img src="' + editor.file.file_info.original_url + '" alt="" />');
                        cropper.cropper = new Cropper(cropper.element[0], {
                            aspectRatio: null,
                            autoCropArea: 1,
                            dragMode: 'move',
                            restore: false,
                            viewMode: 1,
                            movable: false,
                            rotatable: false,
                            scalable: false,
                            zoomable: false,
                            zoomOnTouch: false,
                            zoomOnWheel: false,
                            toggleDragModeOnDblclick: false,
                            responsive: true,
                            ready: function() {
                                editor.elements.cropper.holder.find('.bu--loader').remove();
                            }
                        });
                        cropper.changeAspectRatio = function(aspect_ratio) {
                            cropper.cropper.setAspectRatio(aspect_ratio);
                        };
                        cropper.data = function() {
                            return cropper.cropper.getData();
                        };
                        cropper.open = function() {
                            editor.elements.cropper.crop_size_selector.find('.bu--item-current').removeClass('bu--item-current');

                            var btn = editor.elements.cropper.crop_size_selector.find('.bu--menu-item').first().addClass('bu--item-current');
                            var aspect_ratio = utils.stringToAspectRatio(btn.data('label'));

                            cropper.changeAspectRatio(aspect_ratio);

                            editor.elements.cropper.holder.empty().append(['<div class="bu--loader lg"></div>', cropper.element]);

                            editor.elements.container.hide();
                            editor.elements.cropper.container.show();

                            editor.elements.done.removeClass('bu--panel-done').addClass('bu--cropper-done').html(editor.locale.apply);
                            editor.elements.cancel.removeClass('bu--panel-close').addClass('bu--cropper-cancel');
                        };
                        cropper.close = function() {
                            cropper.cropper.destroy();

                            editor.elements.preview.removeClass('bu--cropper-preview').addClass('bu--editor-preview');
                            editor.elements.cropper.container.hide();
                            editor.elements.container.show();

                            editor.elements.done.removeClass('bu--cropper-done').addClass('bu--panel-done').html(editor.locale.save);
                            editor.elements.cancel.removeClass('bu--cropper-cancel').addClass('bu--panel-close');

                            _refreshEditor();
                        };

                        cropper.done(function(data) {
                            var dimensions = parseInt(data.width) + 'x' + parseInt(data.height);
                            var position = parseInt(data.x) + ',' + parseInt(data.y);

                            transformations.apply('crop', [ dimensions, position ]);

                            operation.resolve();
                        }).fail(function() {
                            operation.reject();
                        }).always(function() {
                            cropper.close();
                        }).open();

                        editor.element.on('click', '.bu--cropper-done', function() {
                            cropper.resolve(cropper.data());
                        });

                        editor.element.on('click', '.bu--cropper-cancel', function() {
                            cropper.reject();
                        });

                        editor.elements.cropper.crop_size_selector.on('click', '.bu--menu-item', function() {
                            var button = $(this);
                            var aspect_ratio = utils.stringToAspectRatio(button.data('label'));

                            cropper.changeAspectRatio(aspect_ratio);

                            editor.elements.cropper.crop_size_selector.find('.bu--item-current').removeClass('bu--item-current');
                            button.addClass('bu--item-current');
                        });

                        return operation;
                    },
                    rotate: function() {
                        var current_angle = transformations.get('rotate')[0] || 0;
                        var new_angle = current_angle + 90;

                        if (new_angle > 0 && new_angle < 360) {
                            transformations.apply('rotate', [new_angle], _refreshEditor);
                        } else {
                            transformations.remove('rotate', _refreshEditor);
                        }

                        return $.Deferred().resolve();
                    },
                    flip: function() {
                        transformations.apply('flip', !transformations.isActive('flip'), _refreshEditor);

                        return $.Deferred().resolve();
                    },
                    mirror: function() {
                        transformations.apply('mirror', !transformations.isActive('mirror'), _refreshEditor);

                        return $.Deferred().resolve();
                    },
                    grayscale: function() {
                        transformations.apply('grayscale', !transformations.isActive('grayscale'), _refreshEditor);

                        return $.Deferred().resolve();
                    },
                    negative: function() {
                        transformations.apply('negative', !transformations.isActive('negative'), _refreshEditor);

                        return $.Deferred().resolve();
                    }
                };

                var _renderEditor = function() {
                    editor.element.addClass('bu--editor').css({ height: window.innerHeight });

                    var editor_content = BookletUploaderTemplate.getHTML('editor');
                    editor.element.find('.bu--panel-body').append(editor_content);

                    var html = editor.element[0].outerHTML;
                    editor.element = BookletUploaderTemplate.render(html, {
                        header: editor.locale.header.editor,
                        done: editor.locale.save,
                        reject: editor.locale.reject,
                    });

                    editor.render();

                    editor.elements = {
                        content: editor.element.find('.bu--panel-content'),
                        container: editor.element.find('.bu--editor-content'),
                        preview: editor.element.find('.bu--editor-preview'),
                        effect_selector: editor.element.find('.bu--editor-content .bu--panel-menu'),
                        cropper: {
                            container: editor.element.find('.bu--cropper'),
                            holder: editor.element.find('.bu--cropper-holder'),
                            crop_size_selector: editor.element.find('.bu--cropper .bu--panel-menu'),
                        },
                        done: editor.element.find('.bu--panel-done'),
                        cancel: editor.element.find('.bu--panel-close'),
                    }

                    for (var i = 0; i < editor.options.effects.length; i++) {
                        var effect = editor.options.effects[i];

                        var button_html = BookletUploaderTemplate.getHTML('editor_effect_button');
                        var button = BookletUploaderTemplate.render(button_html, {
                            effect: effect,
                            label: editor.locale.effects[effect]
                        });

                        editor.elements.effect_selector.append(button);
                    }

                    var aspect_ratios = utils.listAspectRatiosFromString(editor.options.crop);
                    for (var i = 0; i < aspect_ratios.length; i++) {
                        var aspect_ratio = aspect_ratios[i];

                        var button_html = BookletUploaderTemplate.getHTML('cropper_crop_size_button');
                        var button = BookletUploaderTemplate.render(button_html, {
                            label: aspect_ratio,
                        });

                        var aspect_ratio = utils.stringToAspectRatio(aspect_ratio);
                        var icon = button.find('.bu--crop-size');

                        var icon_width = '24px';
                        var icon_height = '24px';

                        if (aspect_ratio && aspect_ratio !== 1) {
                            if (aspect_ratio > 1) {
                                icon_height = parseInt(24 / aspect_ratio) + 'px';
                            } else {
                                icon_width = parseInt(24 * aspect_ratio) + 'px';
                            }
                        }

                        if (!aspect_ratio) {
                            button.attr('data-label', editor.locale.crop.free);
                        }

                        icon.css({ width: icon_width, height: icon_height });

                        editor.elements.cropper.crop_size_selector.append(button);
                    }
                }

                var _bindEvents = function() {
                    $(window).resize(function() {
                        editor.element.css({ height: window.innerHeight });
                    });

                    editor.elements.effect_selector.on('click', '.bu--effect-button', function() {
                        var button = $(this);
                        var transformation = button.data('effect');

                        if (operations.hasOwnProperty(transformation)) {
                            var operation = operations[transformation].call();

                            operation.always(function() {});
                        }
                    });

                    editor.element.on('click', '.bu--panel-done', function() {
                        var result = $.Deferred();
                        var data = JSON.stringify({ file: { modifiers: transformations.toString() } });

                        routing.request('file_update', { hash_id: editor.file.hash }, data).done(function(response) {
                            result.resolve(response.data);
                        }).fail(function() {
                            result.reject();
                        });

                        editor.resolve(result.promise());
                    });

                    editor.element.on('click', '.bu--panel-close', function() {
                        editor.reject();
                    });

                    editor.always(function() {
                        editor.close();
                    });
                }

                var _refreshEditor = function() {
                    // Refresh preview
                    editor.elements.preview.empty().append('<div class="bu--loader lg">');

                    var preview_image = $('<img src="' + transformations.toUrl() + '" alt="" />').on({
                        load: function() {
                            editor.elements.preview.empty().append(preview_image);
                        },
                        error: function() {
                            editor.elements.done.removeClass('bu--panel-done bu--button-primary').addClass('bu--button-disabled');
                            editor.elements.content.empty().append('<div class="bu--editor-file-error">' + editor.locale.errors.file.load + '</div>');
                        }
                    });
                }

                _renderEditor();
                _bindEvents();

                editor.file = new File({ hash: file_hash });
                editor.file.file_info().done(function(response) {
                    var file_info = response.data;

                    editor.file = $.extend(editor.file, {
                        name: file_info.name,
                        hash: file_info.hash,
                        size: file_info.size,
                        type: file_info.type,
                        is_stored: true,
                        file_info: file_info
                    });

                    editor.elements.preview.find('img').attr({ src: editor.file.file_info.url });
                    transformations.setDefault();

                    _refreshEditor();
                }).fail(function() {
                    editor.elements.content.empty().append('<div class="bu--editor-file-error">' + editor.locale.errors.file.load + '</div>');
                    editor.elements.done.removeClass('bu--panel-done bu--button-primary').addClass('bu--button-disabled');
                });

                return editor;
            }
        });

        _panel = panel;

        return panel;
    };

    var Upload = function(file, source_file, transformations = {}) {
        var upload = $.Deferred();
        upload.file = {
            file: file,
            source: source_file,
            transformations: transformations
        };
        upload.request = null;
        upload.data = function() {
            var data = new FormData();
            data.append('hash_id', upload.file.file.hash);
            data.append('source', upload.file.file.source);
            data.append(0, upload.file.source, upload.file.file.name);

            if (upload.file.transformations.crop && upload.file.transformations.crop !== 'free') {
                data.append('transformations[crop]', upload.file.transformations.crop);
            }

            return data;
        };
        upload.start = function() {
            upload.request = routing.request('file_create', {}, upload.data(), {
                async: true,
                xhr: function() {
                    var xhr = $.ajaxSettings.xhr();
                    xhr.upload.addEventListener('progress', function(e){
                        var progress = (e.loaded * 100) / e.total;

                        upload.notify(progress);
                    });

                    return xhr;
                }
            }).done(function(response) {
                upload.resolve(response.data);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                upload.reject(jqXHR, textStatus, errorThrown);
            });

            return upload;
        };
        upload.abort = function() {
            if (upload.request && upload.request.readyState !== 4) {
                upload.request.abort();
            }

            upload.reject();
        };
        upload.onProgress = function(progress) {};

        return upload;
    };
    var File = function(file_data) {
        var file = $.Deferred();
        file.name = null;
        file.hash = null;
        file.size = null;
        file.type = null;
        file.is_stored = false;
        file.transformations = {
            applied: {},
            apply: function(effect, params = []) {
                file.transformations.applied[effect] = [];
            },
            remove: function(effect) {
                delete file.transformations.applied[effect];
            }
        };
        file.source = 'local';
        file.element = null;
        file.renderElement = function() {
            var element_html = BookletUploaderTemplate.getHTML('file');

            file.element = BookletUploaderTemplate.render(element_html, {
                file_hash: file.hash,
                file_name: file.name,
                file_size: utils.sizeToSizeString(file.size),
            });

            return file;
        };
        file.file_info = function() {
            return routing.request('file_show', { 'hash_id': file.hash });
        };
        file.abort = function functionName() {
            if (file.hasOwnProperty('upload') && file.upload) {
                file.upload.abort();
            }
        };
        file.delete = function() {
            file.reject().element.fadeOut(300, function() { $(this).remove(); });
        };
        file.error = function(message) {
            file.element.find('.bu--file-details .bu--file-upload-error').html(message);
        };

        file.fail(function() {
            if (file.hasOwnProperty('upload') && file.upload) {
                file.upload.abort();

                delete file.upload;
            }
        });

        return $.extend(file, file_data).renderElement();
    }

    return {
        defaults: defaults,
        utils: utils,
        locale: locale,
        openUploader: openUploader,
        openEditor: openEditor,
    }
})();
