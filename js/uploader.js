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

    return {
        sizeToSizeString: sizeToSizeString,
        generateHash: generateHash,
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
        template_file: '/vendor/patrykb15580/booklet-uploader/templates/default/template.html',
        validations: {
            type: null,
            max_size: null,
            min_size: null,
        },
        crop: null,
    };

    var openDialog = function(options) {
        var dialog = new BookletUploaderDialog(options);
        dialog.init();

        return dialog;
    };

    var locale = function(locale = 'en') {
        var locales = {
            en: {
                header: 'Select files to upload',
                done: 'Upload',
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
                header: 'Wybierz pliki do przesłania',
                done: 'Wyślij',
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
        var custom_locale = (typeof BOOKLET_UPLOADER_LOCALE == 'undefined') ? {} : BOOKLET_UPLOADER_LOCALE;

        return $.extend(locale, custom_locale);
    }

    return {
        defaults: defaults,
        openDialog: openDialog,
        locale: locale,
    }
})();



var BookletUploaderDialog = function(options) {
    var options = $.extend(BookletUploader.defaults, options);
    var locale = BookletUploader.locale(options.locale);
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

    var template = (function() {
        var template = $.extend($.Deferred(), {
            path: options.template_file,
            html: null,
            getHTML: function() {
                $.get(this.path, function(html) {
                    template.html = html;
                    template.resolve();
                });
            },
            render: function(selector, data) {
                var html = $(this.html).filter(selector).html();

                return $(Mustache.render(html, data));
            }
        });

        template.getHTML();

        return template;
    })();

    var init = function() {
        template.done(function(template) {
            _renderPanel();
            _bindEvents();
        });
    };

    var _getLocaleText = function(text, params = {}) {
        for (var param in params) {
            text = text.replace('%' + param + '%', params[param]);
        }

        return text;
    };

    var _numberOfUploadedOrQueued = function() {
        return Object.keys(uploaded_or_queued).length;
    };

    var _templateData = function() {
        var data = {
            panel_title: _getLocaleText(locale.header),
            drop_area_text: _getLocaleText(locale.drop_area.single),
            files_picker: _getLocaleText(locale.files_picker.single),
            file_size_limit_info: null,
            files_counter: _getLocaleText(locale.files_counter.default, { files_number: _numberOfUploadedOrQueued() }),
            done: _getLocaleText(locale.done),
        }

        if (options.multiple) {
            data.drop_area = _getLocaleText(locale.drop_area.multiple);
            data.files_picker = _getLocaleText(locale.files_picker.multiple);
        }

        if (options.validations.max_size) {
            data.file_size_limit_info = _getLocaleText(locale.info.max_size, {
                max_file_size: BookletUploaderHelpers.sizeToSizeString(options.validations.max_size)
            });
        }

        if (options.max_files) {
            data.files_counter = _getLocaleText(locale.files_counter.limit, {
                files_number: _numberOfUploadedOrQueued(),
                files_number_limit: options.max_files,
            });
        }

        return data;
    };

    var _renderPanel = function() {
        var template_data = _templateData();
        element = template.render('#booklet-uploader-panel', template_data);

        element.find('#booklet-uploader--files-picker').attr({
            multiple: options.multiple,
            accept: options.validations.type
        }).hide();

        element.hide().appendTo('body').fadeIn(300);
    };

    var _bindEvents = function() {
        element.on('click', '#booklet-uploader--files-picker', function(e) {
            if (_isMaxFilesNumberLimitExceeded()) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        element.on('change', '#booklet-uploader--files-picker', function() {
            _onFilesSelect(this.files);
        });

        element.on('click', '.booklet-uploader--panel .booklet-uploader--panel-footer .booklet-uploader--dialog-done', function() {
            var results = [];

            dialog.resolve(Object.values(result));
            _close();
        });

        element.on('click', '.booklet-uploader--panel .booklet-uploader--panel-header .booklet-uploader--dialog-close', function() {
            for (var i = 0; i < result.length; i++) {
                result.abort();
            }

            dialog.reject();
            _close();
        });

        element.on('dragover', '.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--drop-area', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (!_isMaxFilesNumberLimitExceeded()) {
                $(this).addClass('drag-in');
            }
        });

        element.on('dragleave', '.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--drop-area', function(e) {
            e.preventDefault();
            e.stopPropagation();

            $(this).removeClass('drag-in');
        });

        element.on('drop', '.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--drop-area', function(e) {
            e.preventDefault();
            e.stopPropagation();

            $(this).removeClass('drag-in');

            if (!_isMaxFilesNumberLimitExceeded()) {
                _onFilesSelect(e.originalEvent.dataTransfer.files);
            }
        });

        element.on('click', '.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--files-list .booklet-uploader--file .booklet-uploader--file-actions .booklet-uploader--file-action-button.file-remove', function() {
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

            var file = new BookletUploaderFile(file_data, template);

            result[file.hash] = file;
            element.find('.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--files-list').prepend(file.element);

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

    var _close = function() {
        element.fadeOut(300, function() { $(this).remove(); });
    };

    var _isMaxFilesNumberLimitExceeded = function() {
        return (options.max_files == null || _numberOfUploadedOrQueued() < options.max_files) ? false : true;
    };

    var _updateFilesCounter = function() {
        var text = (options.max_files) ? locale.files_counter.limit : locale.files_counter.default;

        text = text.replace('%files_number%', _numberOfUploadedOrQueued())
            .replace('%files_number_limit%', options.max_files);

        if (_isMaxFilesNumberLimitExceeded()) {
            element.find('.booklet-uploader--files-counter').html(text).css({ color: '#d80e24' });
        } else {
            element.find('.booklet-uploader--files-counter').html(text).removeAttr('style');
        }
    };

    var dialog = $.extend($.Deferred(), {
        init: init,
        options: options,
        locale: locale,
        element: element,
    });

    return dialog;
};

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
        element: template.render('#booklet-uploader-file', {
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
