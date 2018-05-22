var booklet_uploader = new function() {
    this.defaults = {
        endpoint: null,
        template: 'default',
        custom_template: null,
        max_files: null,
        max_size: null,
        min_size: null,
        file_types: '',
        multiple: true,
        onFileUploadDone: function(file) {},
        onFileUploadSuccess: function(file) {},
        onFileUploadError: function(file) {},
        onFileUploadAbort: function(file) {},
        onFileReject: function(file) {},
        onDialogOpen: function() {},
    };
    this.generateFileHash = function() { return Math.random().toString(36).substr(2, 9); };
    this.bytesToMagebytes = function(bytes, length = 1) { return parseFloat(bytes / (1024 * 1024)).toFixed(length); };
    this.openDialog = function(options = {}) {
        var dialog = $.Deferred();

        dialog.options = $.extend(this.defaults, options);
        dialog.number_of_uploaded_or_queued = 0;
        dialog.uploaded_files = {};
        dialog.queue = {};
        dialog.elements = {
            container: null,
            input: null,
            buttons: {
                files_picker: null,
                done: null,
                close: null
            },
            drop_area: null,
            files_list: null,
            files_counter: null,
        };
        dialog.onFilesSelect = function(files) {
            for (var i = 0; i < files.length; i++) {
                if (this.isMaxFilesNumberLimitExceeded()) { break; }

                var file = this.pickFile(files[i]);
                file.element.prependTo(this.elements.files_list);

                this.queue[file.hash] = file;

                ++this.number_of_uploaded_or_queued;

                if (this.isFileValid(file)) {
                    file.upload.call(file);
                } else {
                    file.onReject.call(file);
                }


            }
        };
        dialog.isFileValid = function(file) {
            if (this.validations.notAllowedType.call(this, file)) {

                    return false;
            }

            if (this.validations.isMaxSizeExceeded.call(this, file)) {

                    return false;
            }

            if (this.validations.isMinSizeExceeded.call(this, file)) {

                    return false;
            }

            return true;
        };
        dialog.validations = {
            notAllowedType: function(file) {
                if (this.options.file_types == '') { return false; }

                var allowed_mimes = this.options.file_types.replace(' ', '').split(',');

                for (var i = 0; i < allowed_mimes.length; i++) {
                    var mime_parts = allowed_mimes[i].split('/');

                    if (file.type == allowed_mimes[i]) {

                        return false;
                    }

                    if (file.type.split('/')[0] == mime_parts[0] && mime_parts[1] == '*') {

                        return false;
                    }
                }

                file.errors.push(booklet_uploader.locale.invalid_file_type);

                return true;
            },
            isMaxSizeExceeded: function(file) {
                if (this.options.max_size == null || file.size <= this.options.max_size) {

                    return false;
                }

                file.errors.push(booklet_uploader.locale.max_file_size_exceeded);

                return true;
            },
            isMinSizeExceeded: function(file) {
                if (this.options.min_size == null || file.size >= this.options.min_size) {

                    return false;
                }

                file.errors.push(booklet_uploader.locale.min_file_size_exceeded);

                return true;
            }
        };
        dialog.render = function() {
            var texts = {
                panel_title: booklet_uploader.locale.header,
                drop_area_text: booklet_uploader.locale.drop_area.single,
                files_picker: booklet_uploader.locale.files_picker.single,
                file_size_limit_info: null,
                files_counter: booklet_uploader.locale.files_counter.default.replace('%files_number%', this.number_of_uploaded_or_queued),
                done: booklet_uploader.locale.done
            }

            if (this.options.multiple) {
                texts.drop_area = booklet_uploader.locale.drop_area.multiple;
                texts.files_picker = booklet_uploader.locale.files_picker.multiple;
            }

            if (this.options.max_size) {
                var max_size_str = booklet_uploader.bytesToMagebytes(dialog.options.max_size) + ' MB';

                texts.file_size_limit_info = booklet_uploader.locale.info.max_size.replace('%max_file_size%', max_size_str);
            }

            if (this.options.max_files) {
                texts.files_counter = booklet_uploader.locale.files_counter.limit
                    .replace('%files_number%', this.number_of_uploaded_or_queued)
                    .replace('%files_number_limit%', this.options.max_files);
            }

            var template_file = '/vendor/patrykb15580/booklet-uploader/templates/' + this.options.template + '/template.html';
            if (this.options.custom_template) {
                template_file = this.options.custom_template;
            }

            var template = $.get(template_file, function(templates) {
                var template = $(templates).filter('#booklet-uploader-template').html();
                var panel = $(Mustache.render(template, texts));

                dialog.elements.container = panel;
                dialog.elements.input = panel.find('#booklet-uploader--files-picker').attr({ multiple: dialog.options.multiple, accept: dialog.options.file_types }).hide();
                dialog.elements.buttons.files_picker = panel.find('.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--drop-area .booklet-uploader--select-files');
                dialog.elements.buttons.done = panel.find('.booklet-uploader--panel .booklet-uploader--panel-footer .booklet-uploader--dialog-done');
                dialog.elements.buttons.close = panel.find('.booklet-uploader--panel .booklet-uploader--panel-header .booklet-uploader--dialog-close');
                dialog.elements.drop_area = panel.find('.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--drop-area');
                dialog.elements.files_list = panel.find('.booklet-uploader--panel .booklet-uploader--panel-content .booklet-uploader--files-list');
                dialog.elements.files_counter = panel.find('.booklet-uploader--panel .booklet-uploader--panel-footer .booklet-uploader--files-counter');

                panel.hide().appendTo('body').fadeIn(300);

                // Apply events
                dialog.elements.input.on('click', function(e) {
                    if (dialog.isMaxFilesNumberLimitExceeded()) {
                        e.preventDefault();
                        e.stopPropagation();

                        dialog.elements.files_counter.css({ color: '#d80e24' }).fadeOut(200).fadeIn(200).fadeOut(200).fadeIn(200);
                    }
                }).on('change', function() { dialog.onFilesSelect.call(dialog, this.files); });

                // Drag and drop
                dialog.elements.drop_area.bind({
                    dragover: function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!dialog.isMaxFilesNumberLimitExceeded()) {
                            $(this).addClass('drag-in');
                        }
                    },
                    dragleave: function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        $(this).removeClass('drag-in');
                    },
                    drop: function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        $(this).removeClass('drag-in');

                        dialog.onFilesSelect.call(dialog, e.originalEvent.dataTransfer.files);
                    }
                });

                // Close dialog
                dialog.elements.buttons.close.on('click', function() { dialog.close.call(dialog); });

                dialog.elements.buttons.done.on('click', function() {
                    dialog.resolve(dialog.uploaded_files).close.call(dialog);
                });

                dialog.elements.files_list.on('click', '.booklet-uploader--file .booklet-uploader--file-action-button.file-remove', function() {
                    $(this).closest('.booklet-uploader--file').fadeOut(function() {
                        var hash = $(this).data('hash');
                        var file = dialog.uploaded_files[hash];

                        file.delete.call(file);
                    });
                });
            });
        };
        dialog.close = function() {
            for (var file_hash in this.queue) {
                var file = this.queue[file_hash];

                file.xhr.abort();
                file.onUploadAbort();
            }

            this.elements.container.fadeOut(300, function() { $(this).remove(); });
        };
        dialog.updateFilesCounter = function() {
            var text = booklet_uploader.locale.files_counter.default;
            if (this.options.max_files) {
                text = booklet_uploader.locale.files_counter.limit;
            }

            text = text.replace('%files_number%', this.number_of_uploaded_or_queued)
                .replace('%files_number_limit%', this.options.max_files);

            this.elements.files_counter.html(text);
        };
        dialog.pickFile = function(file_data) {
            var file = $.Deferred();
            file.data = file_data;
            file.hash = booklet_uploader.generateFileHash();
            file.name = file_data.name;
            file.size = file_data.size;
            file.type = file_data.type;
            file.errors = [];
            file.element = $('<li class="booklet-uploader--file ' + file.hash + '" data-hash="' + file.hash + '">\
                <div class="booklet-uploader--file-preview"></div>\
                <div class="booklet-uploader--file-details">\
                    <span class="booklet-uploader--file-name">' + file.name + '</span>\
                    <span class="booklet-uploader--file-size">' + booklet_uploader.bytesToMagebytes(file.size) + ' MB</span>\
                </div>\
            </li>');
            file.error = function(message) {
                this.errors.push(message);
                this.element.find('.booklet-uploader--file-details')
                    .append('<span class="booklet-uploader--upload-error">' + message + '</span>')
                    .find('.booklet-uploader--file-size').hide();
            };
            file.showErrors = function() {
                if (this.errors.length > 0 && this.element.find('.file .upload-status').length == 0) {
                    this.element.find('.file').append('<i class="upload-status error fa fa-exclamation"></i>');
                }

                for (var i = 0; i < this.errors.length; i++) {
                    this.element.find('.file-details .file-error-text').remove();
                    this.element.find('.file-details').append('<div class="file-error-text">' + this.errors[i] + '</div>');
                }
            };
            file.xhr = null;
            file.upload = function() {
                var data = new FormData();
                data.append('files[]', this.data, this.name);

                this.element.append('<div class="booklet-uploader--upload-progress">' +
                    '<div class="booklet-uploader--progressbar">' +
                        '<div class="booklet-uploader--progress"></div>' +
                    '</div>' +
                '</div>');

                this.xhr = $.ajax({
                    url: dialog.options.endpoint,
                    type: 'POST',
                    method: 'POST',
                    data: data,
                    cache: false,
                    contentType: false,
                    processData: false,
                    async: true,
                    xhr: function(){
                        var xhr = new window.XMLHttpRequest();
                        xhr.upload.addEventListener("progress", function(e){
                            if (e.lengthComputable) {
                                file.onProgress.call(file, ((e.loaded * 100) / e.total));
                            }
                        }, false);

                        return xhr;
                    },
                }).done(function(file_info) {
                    file_info = $.parseJSON(file_info);

                    file.file_info = file_info;
                    dialog.uploaded_files[file.hash] = file;

                    if (file_info.hasOwnProperty('preview')) {
                        file.element.find('.booklet-uploader--file-preview').css({
                            'background-color': '#ffffff'
                        }).append('<img src="' + file_info.preview + '" alt="' + file.name + '" />');
                    }

                    file.resolve(file_info);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    console.log(jqXHR, textStatus, errorThrown);

                    var response = $.parseJSON(jqXHR.responseText);

                    var message = booklet_uploader.locale.errors.upload.default;
                    if (typeof response.message !== 'undefined') {
                        message = response.message;
                    }

                    --dialog.number_of_uploaded_or_queued;

                    file.reject(jqXHR, textStatus, errorThrown).error(message);
                }).always(function(data, textStatus, errorThrown) {
                    dialog.updateFilesCounter();

                    delete dialog.queue[file.hash];

                    file.element.find('.booklet-uploader--upload-progress').remove();
                }).promise();
            };
            file.onProgress = function(progress) {
                this.element.find('.booklet-uploader--upload-progress .booklet-uploader--progressbar .booklet-uploader--progress').css({ width: progress + '%' });
            },
            file.onReject = function() {
                --dialog.number_of_uploaded_or_queued;

                delete dialog.queue[this.hash];

                this.element.find('.upload-progress').remove();
                this.showErrors();

                dialog.options.onFileReject(this);
            };

            return file;
        };
        dialog.isMaxFilesNumberLimitExceeded = function() {
            return (this.options.max_files == null || this.number_of_uploaded_or_queued < this.options.max_files) ? false : true;
        };


        dialog.render();
        dialog.options.onDialogOpen();

        return dialog.promise();
    };

    var default_locale = {
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
                max_size_exceeded: 'Max file size limit exceeded',
                min_size_exceeded: 'Min file size limit exceeded'
            },
            upload: {
                default: 'Something went wrong',
                abort: 'Upload canceled',
            }
        }
    };

    var custom_locale = (typeof BOOKLET_UPLOADER_LOCALE === 'undefined') ? {} : BOOKLET_UPLOADER_LOCALE;

    this.locale = $.extend(default_locale, custom_locale);
};
