var BookletUploaderHelpers = (function() {
    var generateHash = function() {

        return Math.random().toString(36).substr(2, 9);
    };

    var sizeToSizeString = function(bytes) {
        var units = ['B','kB','MB','GB','TB','PB','EB','ZB','YB'];
        var size = bytes;
        var unit_index = 0;

        while (Math.abs(size) >= 1024 && unit_index < units.length) {
            size /= 1024;
            ++unit_index;
        }

        return Math.round(size * 10) / 10 + ' ' + units[unit_index];
    };

    var isVarEmpty = function(variable) {
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
    }

    return {
        sizeToSizeString: sizeToSizeString,
        generateHash: generateHash,
        isVarEmpty: isVarEmpty
    }
})();

var BookletUploader = (function() {
    var defaults = {
        endpoint: null,
        template: 'default',
        custom_template: null,
        locale: 'en',
        store_to: 'local',
        multiple: true,
        max_files: null,
        validations: {
            type: null,
            max_size: null,
            min_size: null,
        },
        crop: null,
    };

    var plugin_directory_parts = document.currentScript.src.split('/');
    plugin_directory_parts.splice(0, 3);
    plugin_directory_parts.splice(-2, 2);

    var plugin_directory = '/' + plugin_directory_parts.join('/') + '/';

    var _openPanel = function(options = {}) {
        return new BookletUploaderPanel(options);
    }

    var openDialog = function(options = {}) {
        var panel = _openPanel(options);

        return panel.openUploader();
    };

    var openEditor = function(file_hash, options = {}) {
        var panel = _openPanel(options);

        return panel.openEditor(file_hash);
    };

    var getTemplate = function(template_name) {
        var template_file = plugin_directory + 'templates/' + template_name + '/template.html';

        var template = $.Deferred();
        template.promise();

        template = $.extend(template, {
            path: template_file,
            html: null,
            getHTML: function() {
                $.get(this.path, function(html) {
                    template.html = html;
                    template.resolve();
                });
            },
            getSection: function(section) {
                return $(this.html).filter(section).html();
            },
            render: function(html, data) {
                return $(Mustache.render(html, data));
            }
        });

        template.getHTML();

        return template;
    }

    var locale = function(locale = 'en') {
        var locales = {
            en: {
                header: {
                    uploader: 'Select files to upload',
                    editor: 'Add effects to your image'
                },
                done: 'Done',
                upload: 'Upload',
                save: 'Save',
                files_picker: {
                    single: 'Select file',
                    multiple: 'Select files'
                },
                drop_area: {
                    single: 'Drag and drop file here<br /> or',
                    multiple: 'Drag and drop files here<br /> or'
                },
                info: {
                    max_size: 'Max size of uploaded file is <b>%max_file_size%</b>'
                },
                files_counter: {
                    default: 'Uploaded <b>%files_number%</b> files',
                    limit: 'Uploaded <b>%files_number%</b> from <b>%files_number_limit%</b> files'
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
                        max_files_number_exceeded: 'Max files number limit exceeded',
                        max_size_exceeded: 'Max file size limit exceeded',
                        min_size_exceeded: 'Min file size limit exceeded'
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
                    editor: 'Dodaj efekty do swojego zdjęcia'
                },
                done: 'Zakończ',
                upload: 'Wyślij',
                save: 'Zapisz',
                files_picker: {
                    single: 'Kliknij aby wybrać plik',
                    multiple: 'Kliknij aby wybrać pliki'
                },
                drop_area: {
                    single: 'Przeciągnij i upuść tutaj plik<br /> lub',
                    multiple: 'Przeciągnij i upuść tutaj pliki<br /> lub'
                },
                info: {
                    max_size: 'Maksymalna waga przesyłanego pliku wynosi <b>%max_file_size%</b>'
                },
                files_counter: {
                    default: 'Wybrano <b>%files_number%</b> plików',
                    limit: 'Wybrano <b>%files_number%</b> z <b>%files_number_limit%</b> plików'
                },
                effects: {
                    crop: 'Kadrowanie',
                    rotate: 'Obrót',
                    flip: 'Odbicie pionowe',
                    mirror: 'Odbicie poziome',
                    grayscale: 'Szarość',
                    negative: 'Negatyw',
                },
                errors: {
                    file: {
                        invalid_type: 'Nieprawidłowy format pliku',
                        max_files_number_exceeded: 'Wybrano maksymalną liczbę plików',
                        max_size_exceeded: 'Zbyt duży rozmiar pliku',
                        min_size_exceeded: 'Zbyt mały rozmiar pliku'
                    },
                    upload: {
                        default: 'Błąd podczas wysyłania',
                        abort: 'Wysyłanie przerwane'
                    }
                }
            }
        };

        var locale = locales[locale] || locales['en'];

        if (typeof BOOKLET_UPLOADER_LOCALE !== 'undefined') {
            locale = $.extend(locale, BOOKLET_UPLOADER_LOCALE);
        }

        return locale;
    }

    return {
        defaults: defaults,
        getTemplate: getTemplate,
        openDialog: openDialog,
        openEditor: openEditor,
        locale: locale,
        directory: plugin_directory,
    }
})();

var BookletUploaderPanel = function(options) {
    var options = $.extend(BookletUploader.defaults, options);
    var locale = BookletUploader.locale(options.locale);

    var _renderPanel = function() {
        panel.html = panel.template.getSection('#booklet-uploader-panel');
        panel.element = $(panel.html);
    };

    var _bindEvents = function() {
        panel.element.on('click', '.booklet-uploader--panel .booklet-uploader--panel-footer .booklet-uploader--dialog-done', function() {
            panel.resolve();

            _close();
        });

        panel.element.on('click', '.booklet-uploader--panel .booklet-uploader--panel-header .booklet-uploader--dialog-close', function() {
            panel.reject();

            _close();
        });
    };

    var _close = function() {
        panel.element.fadeOut(300, function() { $(this).remove(); });
    };

    var panel = $.Deferred();
    panel.promise();

    panel = $.extend(panel, {
        element: null,
        html: null,
        template: BookletUploader.getTemplate(options.template),
        options: options,
        locale: locale,
        setLocaleTextVariables: function(text, params = {}) {
            for (var param in params) {
                text = text.replace('%' + param + '%', params[param]);
            }

            return text;
        },
        render: function(template_data, callback = null) {
            this.html = this.template.render(this.html, template_data);
            this.element = $(this.html);

            _bindEvents();

            this.element.hide().appendTo('body').fadeIn(300);

            if (typeof callback == 'function') {
                callback.call();
            }
        },
        openUploader: function() {
            return new BookletUploaderDialog(this);
        },
        openEditor: function(file_hash) {
            return new BookletUploaderFileEditor(this, file_hash);
        }
    });

    panel.template.done(function(template) {
        _renderPanel();
    });

    return panel;
}

var BookletUploaderDialog = function(panel) {
    var options = panel.options;
    var locale = panel.locale;

    var uploaded_or_queued = {};
    var result = {};
    var element = null;
    var validators = {
        type: function(file) {

            if (options.validations.type == '' || options.validations.type == null) { return true; }

            var allowed_types = options.validations.type.replace(' ', '').split(',');

            for (var i = 0; i < allowed_types.length; i++) {
                var type_parts = allowed_types[i].split('/');

                if (file.type == allowed_types[i]) {

                    return true;
                }

                if (file.type.split('/')[0] == type_parts[0] && type_parts[1] == '*') {

                    return true;
                }
            }

            file.error.call(file, locale.errors.file.invalid_type);

            return false;
        },
        maxSize: function(file) {
            if (options.validations.max_size !== null && file.size > options.validations.max_size) {
                console.log('max size');

                file.error.call(file, locale.errors.file.max_size_exceeded);

                return false;
            }

            return true;
        },
        minSize: function(file) {
            if (options.validations.min_size !== null && file.size < options.validations.min_size) {
                console.log('min size');

                file.error.call(file, locale.errors.file.min_size_exceeded);

                return false;
            }

            return true;
        }
    };

    var _numberOfUploadedOrQueued = function() {
        return Object.keys(uploaded_or_queued).length;
    };

    var _templateData = function() {
        var data = {
            panel_title: locale.header.uploader,
            drop_area_text: locale.drop_area.single,
            files_picker: locale.files_picker.single,
            file_size_limit_info: null,
            files_counter: panel.setLocaleTextVariables(locale.files_counter.default, { files_number: _numberOfUploadedOrQueued() }),
            done: locale.upload,
        }

        if (options.multiple) {
            data.drop_area = locale.drop_area.multiple;
            data.files_picker = locale.files_picker.multiple;
        }

        if (options.validations.max_size) {
            data.file_size_limit_info = panel.setLocaleTextVariables(locale.info.max_size, {
                max_file_size: options.validations.max_size
            });
        }

        if (options.max_files) {
            data.files_counter = panel.setLocaleTextVariables(locale.files_counter.limit, {
                files_number: _numberOfUploadedOrQueued(),
                files_number_limit: options.max_files,
            });
        }

        return data;
    };

    var _renderUploader = function() {
        var panel_content = panel.template.getSection('#booklet-uploader-panel-uploader');
        panel.element.find('.booklet-uploader--panel-content').append(panel_content);
        panel.element.find('#booklet-uploader--files-picker').attr({
            multiple: options.multiple,
            accept: options.validations.type
        }).hide();

        var template_data = _templateData();

        panel.html = panel.element[0].outerHTML;
        panel.render(template_data, function() {
            _bindEvents();
        });
    };

    var _bindEvents = function() {
        panel.element.on('click', '#booklet-uploader--files-picker', function(e) {
            if (_isMaxFilesNumberLimitExceeded()) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        panel.element.on('change', '#booklet-uploader--files-picker', function() {
            _onFilesSelect(this.files);
        });

        panel.done(function() {
            var results = [];

            dialog.resolve(Object.values(result));
        });

        panel.fail(function() {
            for (var i = 0; i < result.length; i++) {
                result.abort();
            }

            dialog.reject();
        });

        panel.element.on('dragover', '.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--drop-area', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (!_isMaxFilesNumberLimitExceeded()) {
                $(this).addClass('drag-in');
            }
        });

        panel.element.on('dragleave', '.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--drop-area', function(e) {
            e.preventDefault();
            e.stopPropagation();

            $(this).removeClass('drag-in');
        });

        panel.element.on('drop', '.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--drop-area', function(e) {
            e.preventDefault();
            e.stopPropagation();

            $(this).removeClass('drag-in');

            if (!_isMaxFilesNumberLimitExceeded()) {
                _onFilesSelect(e.originalEvent.dataTransfer.files);
            }
        });

        panel.element.on('click', '.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--files-list .booklet-uploader--file .booklet-uploader--file-actions .booklet-uploader--file-action-button.file-remove', function() {
            var file_elem = $(this).closest('.booklet-uploader--file');
            var hash = file_elem.data('hash');

            if (hash in result) {
                result[hash].delete.call(result);
            }

            if (hash in uploaded_or_queued) {
                delete uploaded_or_queued[hash];
                _updateFilesCounter();
            }
        });
    };

    var _isFileValid = function(file) {
        if ('type' in options.validations && !validators.type(file)) {
            return false;
        }

        if ('max_size' in options.validations && !validators.maxSize(file)) {
            return false;
        }

        if ('min_size' in options.validations && !validators.minSize(file)) {
            return false;
        }

        return true;
    };

    var _onFilesSelect = function(files) {
        $.each(files, function(i, file_data) {
            if (_isMaxFilesNumberLimitExceeded()) {
                return false;
            }

            var file = new BookletUploaderFile(file_data, panel.template);

            result[file.hash] = file;
            panel.element.find('.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--files-list').prepend(file.element);

            if (_isFileValid(file)) {
                uploaded_or_queued[file.hash] = file;
                _updateFilesCounter();

                var transformations = {
                    crop: options.crop
                }

                file.upload.call(file, options.endpoint, options.store_to, transformations).done(function(file_info) {
                    file_info = $.parseJSON(file_info);
                    file.file_info = file_info;
                    file.is_stored = true;

                    if (file_info.preview !== 'undefined' && file_info.preview !== null) {
                        $('<img src="' + file_info.preview + '" alt="' + file_info.name + '" />').on('load', function() {
                            file.element.find('.booklet-uploader--file-preview').append($(this));
                        });
                    }

                    file.resolve(file_info);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    delete uploaded_or_queued[file.hash];

                    file.reject(jqXHR).error(locale.errors.upload.default);

                    _updateFilesCounter();
                }).always(function() {
                    file.element.find('.booklet-uploader--upload-progress').hide();
                });
            } else {
                file.error(locale.errors.file.max_files_number_exceeded);
            }
        });
    };

    var _isMaxFilesNumberLimitExceeded = function() {
        return (options.max_files == null || _numberOfUploadedOrQueued() < options.max_files) ? false : true;
    };

    var _updateFilesCounter = function() {
        var text = (options.max_files) ? locale.files_counter.limit : locale.files_counter.default;

        text = text.replace('%files_number%', _numberOfUploadedOrQueued())
            .replace('%files_number_limit%', options.max_files);

        if (_isMaxFilesNumberLimitExceeded()) {
            panel.element.find('.booklet-uploader--files-counter').html(text).css({ color: '#d80e24' });
        } else {
            panel.element.find('.booklet-uploader--files-counter').html(text).removeAttr('style');
        }
    };

    panel.template.done(function() {
        _renderUploader();
    });

    var dialog = $.Deferred();
    dialog.promise();
    dialog = $.extend(dialog, {
        options: options,
        locale: locale
    });

    return dialog;
};

var BookletUploaderFileEditor = function(panel, file_hash) {
    if (!file_hash) {
        throw 'file_hash in not defined';
    }

    var effects = ['crop', 'rotate', 'mirror', 'flip', 'grayscale', 'negative'];

    var original_url = 'http://kreator.fotobum.test/file/' + file_hash;
    var options = $.extend({ effects: effects }, panel.options);
    var locale = panel.locale;

    var panel_elements = {};

    var effects = {
        applied: {},
        isEffectActive: function(effect) {
            return (BookletUploaderHelpers.isVarEmpty(effects.applied[effect])) ? false : true;
        },
        applyEffect: function(effect, params = true) {
            effects.applied[effect] = params;

            _onEffectChange();
        },
        removeEffect: function(effect) {
            if (effects.applied.hasOwnProperty(effect)) {
                delete effects.applied[effect];

                _onEffectChange();
            }
        },
        disableEffect: function(effect) {
            effects.applied[effect] = false;

            _onEffectChange();
        },
        operations: {
            crop: function() {
                console.log('crop');
            },
            rotate: function() {
                var current_angle = 0;
                if (effects.isEffectActive('rotate')) {
                    current_angle = effects.applied.rotate[0];
                }

                var new_angle = current_angle + 90;
                if (new_angle >= 360) {
                    new_angle = new_angle - (new_angle * (new_angle / 360));
                }

                if (new_angle == 0) {
                    effects.disableEffect('rotate');
                } else {
                    effects.applyEffect('rotate', [new_angle]);
                }
            },
            flip: function() {
                var is_active = effects.isEffectActive('flip');
                var new_state = !is_active;

                effects.applyEffect('flip', new_state);
            },
            mirror: function() {
                var is_active = effects.isEffectActive('mirror');
                var new_state = !is_active;

                effects.applyEffect('mirror', new_state);
            },
            grayscale: function() {
                var is_active = effects.isEffectActive('grayscale');
                var new_state = !is_active;

                effects.applyEffect('grayscale', new_state);
            },
            negative: function() {
                var is_active = effects.isEffectActive('negative');
                var new_state = !is_active;

                effects.applyEffect('negative', new_state);
            },
        }
    }

    var _templateData = function() {
        var data = {
            panel_title: locale.header.editor,
            done: locale.save,
        }

        return data;
    };

    var _renderEditor = function() {
        var panel_content = panel.template.getSection('#booklet-uploader-panel-editor');
        panel.element.find('.booklet-uploader--panel-content').append(panel_content);

        for (var i = 0; i < options.effects.length; i++) {
            panel.element.find('.booklet-uploader--effects-list').append(_renderEffectButton(options.effects[i]));
        }

        panel.html = panel.element[0].outerHTML;
        panel.render({
            panel_title: locale.header.editor,
            done: locale.save,
        }, function() {
            panel_elements = {
                container: panel.element,
                preview: {
                    container: panel.element.find('.booklet-uploader--editor-preview'),
                    image: panel.element.find('.booklet-uploader--editor-preview img').hide(),
                    loader: panel.element.find('.booklet-uploader--editor-preview .booklet-uploader--loader').hide(),
                },
                effects_list: panel.element.find('.booklet-uploader--effects-list'),
            }

            _refreshPreview();
            _bindEvents();
        });
    };

    var _renderEffectButton = function(effect_name) {
        var effect_label = locale.effects[effect_name];

        var button_html = panel.template.getSection('#booklet-uploader-file-editor-effect-button');
        var button = panel.template.render(button_html, {
            effect_name: effect_name,
            effect_label: effect_label
        });

        return button;
    }

    var _refreshPreview = function() {
        var url = _generateModifiedUrl();

        panel_elements.preview.image.fadeOut(200, function() {
            panel_elements.preview.loader.fadeIn(200);

            $(this).attr({ src: url }).on('load', function() {
                panel_elements.preview.loader.fadeOut(200, function() {
                    panel_elements.preview.image.fadeIn(200);
                });
            });
        });
    }

    var _bindEvents = function() {
        panel_elements.effects_list.on('click', '.booklet-uploader--editor-effect', function() {
            var operation = $(this).data('effect-type');

            if (effects.operations.hasOwnProperty(operation)) {
                effects.operations[operation]();
            }
        });
    }

    var _onEffectChange = function() {
        _refreshPreview();
    };

    var _modifiersStringBuilder = function() {
        var modifiers = [];
        var applied_effects = effects.applied;

        for (var effect in applied_effects) {
            var modifier = [effect];
            var params = applied_effects[effect];

            if (params === false) {
                continue;
            }

            if (Array.isArray(params) && params.length > 0) {
                for (var i = 0; i < params.length; i++) {
                    modifier.push(params[i]);
                }
            }

            var modifier_string = modifier.join('/') + '/';

            modifiers.push(modifier_string);
        }

        var modifiers_string = (modifiers.length > 0) ? '-/' + modifiers.join('-/') : '';

        return modifiers_string;
    }

    var _generateModifiedUrl = function() {
        var url = original_url;
        var modifiers = _modifiersStringBuilder();

        url += (modifiers == '') ? '' : '/' + modifiers;

        return url;
    }

    var _openCropper = function() {

    }

    panel.template.done(function() {
        _renderEditor();

        if (options.crop) {
            effects.applyEffect('crop', [options.crop]);
        }
    });

    var editor = $.Deferred();
    editor.promise();
    editor = $.extend(editor, {});

    return editor;
}

var BookletUploaderFile = function(file_data, template) {
    var name = file_data.name;
    var hash = BookletUploaderHelpers.generateHash();
    var size = file_data.size;
    var type = file_data.type;

    var _appendTransformationsData = function(form_data, transformations) {
        if (typeof transformations.crop !== 'undefined' && transformations.crop !== null) {
            form_data.append('transformations[crop]', transformations.crop);
        }

        return form_data;
    }

    var file = $.extend($.Deferred(), {
        name: name,
        hash: hash,
        name: name,
        size: size,
        type: type,
        is_stored: false,
        source: {
            file: file_data,
            source: 'local',
        },
        element: template.render(template.getSection('#booklet-uploader-file'), {
            file_hash: hash,
            file_name: name,
            file_size: BookletUploaderHelpers.sizeToSizeString(size),
        }),
        xhr: null,
        abort: function() {
            if (this.xhr !== null && this.xhr.readyState !== 4) {
                this.xhr.abort();
            }
        },
        upload: function(endpoint, storage, transformations = {}) {
            var data = new FormData();

            data.append('source', file.source.source);
            data.append(0, file.source.file, file.name);

            data = _appendTransformationsData(data, transformations);

            file.element.find('.booklet-uploader--upload-progress').show();

            file.xhr = $.ajax({
                url: endpoint,
                method: 'POST',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                async: true,
                xhr: function(){
                    var xhr = $.ajaxSettings.xhr();

                    xhr.upload.addEventListener('progress', function(e){
                        file.element.find('.booklet-uploader--upload-progress .booklet-uploader--progressbar .booklet-uploader--progress').css({
                            width: ((e.loaded * 100) / e.total) + '%'
                        });
                    });

                    return xhr;
                },
            });

            return file.xhr;
        },
        delete: function() {
            file.abort();

            delete this[file.hash];

            file.element.fadeOut(300, function() { $(this).remove(); });
        },
        error: function(message) {
            this.element.find('.booklet-uploader--file-details .booklet-uploader--upload-error').html(message);
        }
    });

    return file;
}
