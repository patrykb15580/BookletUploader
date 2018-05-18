var booklet_uploader = new function() {
    this.defaults = {
        endpoint: null,
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
            if (this.options.multiple) {
                this.elements.drop_area.text.html(booklet_uploader.locale.drop_area_text_multiple_files);
                this.elements.actions.select_files.html(booklet_uploader.locale.select_files_button_multiple_files);
            }

            if (this.options.max_size) {
                var str = booklet_uploader.locale.max_file_size_info;
                var max_size_str = booklet_uploader.bytesToMagebytes(dialog.options.max_size) + ' MB';

                this.elements.max_file_size_info.html(str.replace('%max_file_size%', max_size_str));
            }

            if (this.options.max_files) {
                var str = booklet_uploader.locale.files_counter_with_limit;
                str = str.replace('%files_number%', this.number_of_uploaded_or_queued);
                str = str.replace('%files_number_limit%', this.options.max_files);

                this.elements.files_counter.html(str);
            }

            $('body').append(
                this.elements.dialog.container.hide().append([
                    // File input
                    this.elements.input.attr({ multiple: this.options.multiple, accept: this.options.file_types }).hide(),
                    // Dialog
                    this.elements.dialog.dialog.append([
                        // Dialog header
                        this.elements.dialog.header,
                        // Dialog content
                        this.elements.dialog.content.append([
                            // Drop and drop
                            this.elements.drop_area.container.append([
                                this.elements.drop_area.text,
                                this.elements.actions.select_files,
                                this.elements.max_file_size_info
                            ]),
                            // Selected files list
                            this.elements.files_list
                        ]),
                        // Dialog footer
                        this.elements.dialog.footer.append([
                            this.elements.files_counter,
                            this.elements.actions.close_dialog
                        ])
                    ])
                ]).fadeIn(300)
            );

            // Pick files from input
            this.elements.input.on('click', function(e) {
                if (dialog.isMaxFilesNumberLimitExceeded()) {
                    e.preventDefault();
                    e.stopPropagation();

                    dialog.elements.files_counter.css({ color: '#d80e24' }).fadeOut(200).fadeIn(200).fadeOut(200).fadeIn(200);
                }
            }).on('change', function() { dialog.onFilesSelect.call(dialog, this.files); });

            // Drag and drop
            this.elements.drop_area.container.on('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();

                if (!dialog.isMaxFilesNumberLimitExceeded()) { $(this).addClass('drag-in'); }
            });

            this.elements.drop_area.container.on('dragleave', function(e) {
                e.preventDefault();
                e.stopPropagation();

                $(this).removeClass('drag-in');
            });

            this.elements.drop_area.container.on('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();

                $(this).removeClass('drag-in');
                dialog.onFilesSelect.call(dialog, e.originalEvent.dataTransfer.files);
            });

            // Close dialog
            this.elements.actions.close_dialog.on('click', function() { dialog.close.call(dialog); });
        };
        dialog.close = function() {
            for (var file_hash in this.queue) {
                var file = this.queue[file_hash];

                file.xhr.abort();
                file.onUploadAbort();
            }

            this.elements.dialog.container.fadeOut(300, function() { $(this).remove(); });

            dialog.resolve(dialog.uploaded_files);
        };
        dialog.updateFilesCounter = function() {
            var files_counter_text = (this.options.max_files == null) ? booklet_uploader.locale.files_counter : booklet_uploader.locale.files_counter_with_limit;

            files_counter_text = files_counter_text.replace('%files_number%', this.number_of_uploaded_or_queued).replace('%files_number_limit%', this.options.max_files);

            this.elements.files_counter.html(files_counter_text);
        };
        dialog.pickFile = function(file_data) {
            var file = $.Deferred();
            file.data = file_data;
            file.hash = booklet_uploader.generateFileHash();
            file.name = file_data.name;
            file.size = file_data.size;
            file.type = file_data.type;
            file.errors = [];
            file.element = $('<li>' +
                '<div class="file ' + file.hash + '">' +
                    '<div class="file-preview"></div>' +
                    '<div class="file-details">' +
                        '<span class="file-name">' + file.name + '</span>' +
                        '<span class="file-size">' + booklet_uploader.bytesToMagebytes(file.size) + ' MB</span>' +
                    '</div>' +
                    '<div class="upload-progress"><div class="progress"></div></div>' +
                '</div>' +
            '</li>');
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

                this.element.append('<div class="upload-progress"><div class="progress"></div></div>');

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
                        file.element.find('.file-preview').css({
                            'background-color': '#ffffff'
                        }).append('<img src="' + file_info.preview + '" alt="' + file.name + '" />');
                    }

                    file.resolve(file_info).element.find('.file').append('<i class="upload-status success fa fa-check"></i>');
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    console.log(jqXHR, textStatus, errorThrown);

                    var response = $.parseJSON(jqXHR.responseText);

                    var message = booklet_uploader.locale.upload_error;
                    if (typeof response.message !== 'undefined') {
                        message = response.message;
                    }

                    file.errors.push(message);

                    file.element.find('.file').append('<i class="upload-status error fa fa-exclamation"></i>');

                    --dialog.number_of_uploaded_or_queued;

                    file.reject(jqXHR, textStatus, errorThrown).showErrors();
                }).always(function(data, textStatus, errorThrown) {
                    dialog.updateFilesCounter();

                    delete dialog.queue[file.hash];

                    file.element.find('.upload-progress').remove();
                }).promise();
            };
            file.onProgress = function(progress) {
                this.element.find('.upload-progress .progress').css({ width: progress + '%' });
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
        dialog.elements = {
            input: $('<input id="booklet-uploader-files-picker" class="booklet-uploader-files-picker" type="file" />'),
            actions: {
                select_files: $('<label class="select-files" for="booklet-uploader-files-picker">' + booklet_uploader.locale.select_files_button_single_file + '</label>'),
                close_dialog: $('<button class="close-dialog">' + booklet_uploader.locale.close_button + '</button>'),
            },
            drop_area: {
                container: $('<div class="drop-area"></div>'),
                text: $('<div class="text">' + booklet_uploader.locale.drop_area_text_single_file + '</div>'),
            },
            files_list: $('<ul class="files-list"></ul>'),
            files_counter: $('<div class="files-counter">' + booklet_uploader.locale.files_counter.replace('%files_number%', 0) + '</div>'),
            max_file_size_info: $('<div class="max-file-size-info"></div>'),
            dialog: {
                container: $('<div id="booklet-uploader-dialog"></div>'),
                dialog: $('<div class="dialog"></div>'),
                header: $('<div class="dialog-header">' + booklet_uploader.locale.header_text + '</div>'),
                content: $('<div class="dialog-content"></div>'),
                footer: $('<div class="dialog-footer"></div>'),
            }
        };

        dialog.render();
        dialog.options.onDialogOpen();

        return dialog.promise();
    };

    var default_locale = {
        header_text: 'Select files to upload',
        close_button: 'Upload',
        drop_area_text_single_file: 'Drag and drop file here<br /> or',
        drop_area_text_multiple_files: 'Drag and drop files here<br /> or',
        select_files_button_single_file: 'Select file',
        select_files_button_multiple_files: 'Select files',
        max_file_size_info: 'Max size of uploaded file is <b>%max_file_size%</b>',
        files_counter: 'Uploaded <b>%files_number%</b> files',
        files_counter_with_limit: 'Uploaded <b>%files_number%</b> from <b>%files_number_limit%</b> files',
        invalid_file_type: 'Invalid file type',
        max_file_size_exceeded: 'Max file size limit exceeded',
        min_file_size_exceeded: 'Min file size limit exceeded',
        upload_error: 'Something went wrong',
        upload_abort: 'Upload canceled'
    };

    var custom_locale = (typeof BOOKLET_UPLOADER_LOCALE === 'undefined') ? {} : BOOKLET_UPLOADER_LOCALE;

    this.locale = $.extend(default_locale, custom_locale);
};
