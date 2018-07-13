var BookletUploaderTemplate = (function() {
    var _html = {
        panel: '<div id="bu--dialog">\
            <div class="bu--panel">\
                <div class="bu--panel-header">{{header}}</div>\
                <div class="bu--panel-content"></div>\
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
        editor: '<div class="bu--editor-sidebar">\
            <ul class="bu--editor-menu"></ul>\
        </div>\
        <div class="bu--editor-content">\
            <div class="bu--editor-preview">\
                <img src="" alt="" />\
            </div>\
            <div class="bu--image-cropper">\
                <div class="bu--cropper-preview">\
                    <img src="" alt="" />\
                </div>\
            </div>\
        </div>',
        effect_button: '<li class="bu--editor-menu-item action-{{action}}" data-action="{{action}}">\
            <i class="bu--icon icon-{{action}} sm"></i>\
            {{label}}\
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
    var plugin_directory_parts = document.currentScript.src.split('/');
    plugin_directory_parts.splice(0, 3);
    plugin_directory_parts.splice(-2, 2);
    var plugin_directory = '/' + plugin_directory_parts.join('/') + '/';

    var defaults = {
        locale: 'en',
        store_to: 'local',
        multiple: true,
        max_files: null,
        drag_and_drop: false,
        images_only: false,
        max_size: null,
        validations: {
            type: null,
            max_size: null,
            min_size: null,
        },
        crop: null,
    };

    var _panel = null;

    var image_file_types = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/tiff', 'image/bmp'];
    var helpers = {
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
        isVarEmpty: function(variable) {
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
                reject: 'Cancel',
                max_size_info: 'Max size of uploaded file is %max_size%',
                files_counter: 'Uploaded %files_number% files',
                from: 'of %number%',
                from_files: 'of %files_number% files',
                multiple: {
                    files_picker: 'Choose files',
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
                reject: 'Anuluj',
                max_size_info: 'Maksymalny rozmiar pliku wynosi %max_size%',
                files_counter: 'Przesłano %files_number% plików',
                from: ' z %number%',
                from_files: ' z %files_number% plików',
                multiple: {
                    files_picker: 'Wybierz pliki',
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
                        files_counter: helpers.setTextVariables(uploader.locale.files_counter, { files_number: _selectedFilesNumber() })
                    }

                    if (uploader.options.multiple) {
                        data.files_picker = uploader.locale.multiple.files_picker;
                    }

                    if (uploader.options.max_size) {
                        data.max_size_info = helpers.setTextVariables(uploader.locale.max_size_info, {
                            max_size: helpers.sizeToSizeString(uploader.options.max_size)
                        });
                    }

                    if (uploader.options.max_files) {
                        data.files_counter += helpers.setTextVariables(uploader.locale.from_files, { files_number: uploader.options.max_files });
                    }

                    return data;
                };

                var _renderUploader = function() {
                    var uploader_content = BookletUploaderTemplate.getHTML('uploader');

                    uploader.element.addClass('bu--uploader').css({ height: window.innerHeight });
                    uploader.element.find('.bu--panel-content').append(uploader_content);
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
                            selected_files[hash].delete();

                            delete selected_files[hash];
                            delete uploaded_files[hash];

                            _updateFilesCounter();
                        }
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
                    var text = helpers.setTextVariables(uploader.locale.files_counter, { files_number: _uploadedFilesNumber() });

                    if (uploader.options.max_files) {
                        text += helpers.setTextVariables(uploader.locale.from_files, { files_number: uploader.options.max_files });
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
                            hash: helpers.uid(),
                            size: file_data.size,
                            type: file_data.type
                        });

                        if (uploader.options.images_only && !helpers.inArray(file.type, image_file_types)) {
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

                        var upload = new Upload(file, file_data, { crop: uploader.options.crop });

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

                var editor_elements = {};

                _cropper = null;
                var modifiers = {
                    modifiers_order: ['crop', 'resize', 'rotate', 'flip', 'mirror', 'grayscale', 'negative'],
                    applied: {},
                    apply: function(effect, params = []) {
                        this.applied[effect] = params;

                        _onEffectChange();
                    },
                    isApplied: function(modifier) {
                        return this.applied.hasOwnProperty(modifier);
                    },
                    remove: function(modifier) {
                        delete this.applied[modifier];

                        _onEffectChange();
                    },
                    defaultModifiers: function() {
                        if (editor.options.crop) {
                            var source_width = editor.file.file_info.image_info.original_width, width = source_width;
                            var source_height = editor.file.file_info.image_info.original_height, height = source_height;

                            var x = 0;
                            var y = 0;

                            var source_ratio = width / height;
                            var target_ratio = editor.options.crop;

                            if (source_ratio !== target_ratio) {
                                if (source_ratio > target_ratio) {
                                    width = height / target_ratio;
                                    x = (source_width - width) / 2;
                                } else {
                                    height = width * target_ratio;
                                    y = (source_height - height) / 2;
                                }

                                this.apply('crop', [ width + 'x' + height, x + ',' + y ]);
                            }
                        }
                    },
                    toString: function() {
                        var m = [];

                        for (var i = 0; i < this.modifiers_order.length; i++) {
                            var effect = this.modifiers_order[i];

                            if (!this.applied.hasOwnProperty(effect) || !this.applied[effect]) {
                                continue;
                            }

                            var params = this.applied[effect];
                            var modifier = effect + '/';

                            if (Array.isArray(params) && params.length > 0) {
                                modifier += params.join('/') + '/';
                            }

                            m.push(modifier);
                        }

                        var string = m.join('-/');

                        if (string !== '') {
                            string = '-/' + string;
                        }

                        return string;
                    },
                    toUrl: function() {
                        return editor.file.file_info.original_url + this.toString();
                    },
                    methods: {
                        crop: function() {
                            _cropper = new CropTool().open();
                            _cropper.done(function(data) {
                                var dimensions = data.width + 'x' + data.height;
                                var position = data.x + ',' + data.y;

                                modifiers.apply('crop', [ dimensions, position ]);
                            }).always(function() {
                                _cropper = null;
                            });
                        },
                        rotate: function() {
                            var current_angle = (modifiers.isApplied('rotate')) ? modifiers.applied.rotate[0] : 0;
                            var new_angle = current_angle + 90;
                            if (new_angle >= 360) {
                                new_angle = new_angle - (new_angle * (new_angle / 360));
                            }

                            if (new_angle == 0) {
                                modifiers.remove('rotate');
                            } else {
                                modifiers.apply('rotate', [new_angle]);
                            }
                        },
                        flip: function() {
                            if (modifiers.isApplied('flip')) {
                                modifiers.remove('flip');
                            } else {
                                modifiers.apply('flip', []);
                            }
                        },
                        mirror: function() {
                            if (modifiers.isApplied('mirror')) {
                                modifiers.remove('mirror');
                            } else {
                                modifiers.apply('mirror', []);
                            }
                        },
                        grayscale: function() {
                            if (modifiers.isApplied('grayscale')) {
                                modifiers.remove('grayscale');
                            } else {
                                modifiers.apply('grayscale', []);
                            }
                        },
                        negative: function() {
                            if (modifiers.isApplied('negative')) {
                                modifiers.remove('negative');
                            } else {
                                modifiers.apply('negative', []);
                            }
                        },
                    }
                }

                var _templateData = function() {
                    return {
                        header: editor.locale.header.editor,
                        done: editor.locale.save,
                        reject: editor.locale.reject,
                    };
                };

                var _refreshPreview = function() {
                    var img = editor.elements.preview.find('img');
                    img.fadeOut(200, function() {
                        $(this).attr({ src: modifiers.toUrl() }).load(function() {
                            $(this).fadeIn(200);
                        });
                    });
                }

                var _onEffectChange = function() {
                    _refreshPreview();
                };

                var CropTool = function() {
                    var aspect_ratio = String(editor.options.crop).replace(/[\\,:]/g, '/');
                    aspect_ratio = (aspect_ratio == 'free') ? null : eval(aspect_ratio);

                    var cropper = $.Deferred();
                    cropper.element = editor.elements.cropper.find('.bu--cropper-preview img');
                    cropper.cropper = new Cropper(cropper.element[0], {
                        aspectRatio: aspect_ratio,
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
                    });
                    cropper.getData = function() {
                        return cropper.cropper.getData(true);
                    };
                    cropper.open = function() {
                        editor.element.find('.bu--editor-menu-item.action-crop').addClass('active');
                        editor.element.find('.bu--panel-done').removeClass('bu--panel-done').addClass('bu--cropper-done');
                        editor.element.find('.bu--panel-close').removeClass('bu--panel-close').addClass('bu--cropper-cancel');

                        editor.elements.preview.hide();
                        editor.elements.cropper.show();

                        return cropper;
                    };
                    cropper.close = function() {
                        cropper.cropper.destroy();

                        editor.element.find('.bu--editor-menu-item.action-crop').removeClass('active');
                        editor.element.find('.bu--cropper-done').removeClass('bu--cropper-done').addClass('bu--panel-done');
                        editor.element.find('.bu--cropper-cancel').removeClass('bu--cropper-cancel').addClass('bu--panel-close');

                        editor.elements.preview.show();
                        editor.elements.cropper.hide();
                    };
                    cropper.always(function() {
                        cropper.close();
                    });

                    editor.element.on('click', '.bu--cropper-done', function() {
                        cropper.resolve(cropper.getData());
                    });

                    editor.element.on('click', '.bu--cropper-cancel', function() {
                        cropper.reject();
                    });

                    return cropper;
                }

                var _renderEditor = function() {
                    editor.element.addClass('bu--editor').css({ height: window.innerHeight });

                    var editor_content = BookletUploaderTemplate.getHTML('editor');
                    editor.element.find('.bu--panel-content').append(editor_content);
                    editor.element.find('.bu--image-cropper').hide();

                    var html = editor.element[0].outerHTML;
                    editor.element = BookletUploaderTemplate.render(html, _templateData());

                    editor.render();

                    editor.elements = {
                        menu: editor.element.find('.bu--editor-menu'),
                        preview: editor.element.find('.bu--editor-preview'),
                        cropper: editor.element.find('.bu--image-cropper'),
                        done: editor.element.find('.bu--panel-done'),
                        cancel: editor.element.find('.bu--panel-close'),
                    }

                    for (var i = 0; i < editor.options.effects.length; i++) {
                        var effect = editor.options.effects[i];

                        var button_html = BookletUploaderTemplate.getHTML('effect_button');
                        var data = {
                            action: effect,
                            label: editor.locale.effects[effect]
                        };
                        var button = BookletUploaderTemplate.render(button_html, data);

                        editor.elements.menu.append(button);
                    }
                }

                var _bindEvents = function() {
                    $(window).resize(function() {
                        editor.element.css({ height: window.innerHeight });
                    });

                    editor.elements.menu.on('click', '.bu--editor-menu-item', function() {
                        if (!_cropper) {
                            var action = $(this).data('action');
                            var operation = modifiers.methods[action];

                            operation.call();
                        }
                    });

                    editor.element.on('click', '.bu--panel-done', function() {
                        var result = $.Deferred();
                        var data = { file: { modifiers: modifiers.toString() } };

                        $.post('/file/' + editor.file.hash, data, function(response) {
                            result.resolve(response.data);
                        }, 'json').fail(function() {
                            result.reject();
                        });

                        panel.resolve(result.promise());
                    });

                    editor.element.on('click', '.bu--panel-close', function() {
                        panel.reject();
                    });

                    editor.always(function() {
                        panel.close();
                    });
                }


                _renderEditor();
                _bindEvents();

                var options = editor.options;
                var locale = editor.locale;
                var element = editor.element;
                var elements = editor.elements;
                var render = editor.render;
                var close = editor.close;

                editor = editor.promise();
                editor.options = options;
                editor.locale = locale;
                editor.element = element;
                editor.elements = elements;
                editor.render = render;
                editor.close = close;
                editor.file = new File({ hash: file_hash }).file_info();

                editor.file.done(function(response) {
                    var file_info = response.data;

                    editor.file.name = file_info.name;
                    editor.file.hash = file_info.hash;
                    editor.file.size = file_info.size;
                    editor.file.type = file_info.type;
                    editor.file.is_stored = true;
                    editor.file.file_info = file_info;

                    editor.elements.preview.find('img').attr({ src: editor.file.file_info.url });
                    editor.elements.cropper.find('img').attr({ src: editor.file.file_info.original_url });

                    modifiers.defaultModifiers();
                    _refreshPreview();
                }).fail(function() {
                    editor.element.find('.bu--panel-content').empty().append('<div class="file-load-error">Błąd ładowania pliku</div>');
                    editor.element.find('.bu--panel-done').remove();
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
            upload.request = $.ajax({
                url: '/file/create',
                method: 'POST',
                dataType:'json',
                data: upload.data(),
                cache: false,
                contentType: false,
                processData: false,
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
                file_size: helpers.sizeToSizeString(file.size),
            });

            return file;
        };
        file.file_info = function() {
            return $.ajax({
                type: 'GET',
                url: '/file/' + file.hash,
                data: {},
                dataType: 'json'
            });
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
        helpers: helpers,
        locale: locale,
        openUploader: openUploader,
        openEditor: openEditor,
    }
})();
