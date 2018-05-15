var booklet_uploader = new function() {
    this.locale = BOOKLET_UPLOADER_LOCALE;
    this.defaults = {
        endpoint: null,
        max_files: null,
        max_size: null,
        min_size: null,
        file_types: '*',
        multiple: false,
        onFileUploadDone: function(file) {},
        onFileUploadSuccess: function(file) {},
        onFileUploadError: function(file) {},
        onFileUploadAbort: function(file) {},
        onFileReject: function(file) {},
        onDialogOpen: function() {},
        onDialogClose: function(files) {},
    };
    this.generateFileHash = function() { return Math.random().toString(36).substr(2, 9); };
    this.bytesToMagebytes = function(bytes) { return parseFloat(bytes / (1024 * 1024)).toFixed(1); };
    this.openDialog = function(options = {}) {
        var dialog = {
            options: $.extend(this.defaults, options),
            number_of_uploaded_or_queued: 0,
            uploaded_files: [],
            queue: {},
            elements: {
                input: $('<input id="booklet-uploader-files-picker" class="booklet-uploader-files-picker" type="file" />'),
                actions: {
                    select_files: $('<label class="select-files" for="booklet-uploader-files-picker">' + this.locale.select_files_button_single_file + '</label>'),
                    close_dialog: $('<button class="close-dialog">' + this.locale.dialog.close_button + '</button>'),
                },
                drop_area: {
                    container: $('<div class="drop-area"></div>'),
                    text: $('<div class="text">' + this.locale.drop_area_text_single_file + '</div>'),
                },
                files_list: $('<ul class="files-list"></ul>'),
                files_counter: $('<div class="files-counter"></div>'),
                dialog: {
                    container: $('<div id="booklet-uploader-dialog"></div>'),
                    dialog: $('<div class="dialog"></div>'),
                    header: $('<div class="dialog-header">' + this.locale.dialog.header_text + '</div>'),
                    content: $('<div class="dialog-content"></div>'),
                    footer: $('<div class="dialog-footer"></div>'),
                },
            },
            isMaxFilesNumberLimitExceeded: function() {
                return (this.options.max_files == null || this.number_of_uploaded_or_queued < this.options.max_files) ? false : true;
            },
            onFilesSelect: function(files) {
                for (var i = 0; i < files.length; i++) {
                    if (this.isMaxFilesNumberLimitExceeded()) { break; }

                    var file = this.pickFile(files[i]);

                    this.queue[file.hash] = file;

                    ++this.number_of_uploaded_or_queued;

                    file.element.prependTo(this.elements.files_list);

                    file.upload();
                }
            },
            render: function() {
                this.elements.input.attr({ multiple: options.multiple, accept: options.file_types }).hide().appendTo(this.elements.dialog.container);

                this.elements.dialog.container.append(this.elements.dialog.dialog);

                this.elements.dialog.dialog.append(this.elements.dialog.header);
                this.elements.dialog.dialog.append(this.elements.dialog.content);
                this.elements.dialog.dialog.append(this.elements.dialog.footer);

                this.elements.drop_area.container.appendTo(this.elements.dialog.content);
                this.elements.drop_area.container.append(this.elements.drop_area.text);
                this.elements.drop_area.container.append(this.elements.actions.select_files);

                if (dialog.options.multiple) {
                    this.elements.drop_area.text.html(booklet_uploader.locale.drop_area_text_multiple_files);
                    this.elements.actions.select_files.html(booklet_uploader.locale.select_files_button_multiple_files);
                }

                if (dialog.options.max_size !== null) {
                    this.elements.drop_area.container.append('<div class="files-size-info">' +
                        booklet_uploader.locale.max_file_size_info.replace('%max_file_size%', booklet_uploader.bytesToMagebytes(dialog.options.max_size) + ' MB') +
                    '</div>');
                }

                this.elements.dialog.content.append(this.elements.files_list);

                this.elements.dialog.footer.append(this.elements.files_counter);
                this.elements.dialog.footer.append(this.elements.actions.close_dialog);

                this.updateFilesCounter();

                /* Events ////////////////////////////////////////////////////*/

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
                this.elements.actions.close_dialog.on('click', function() { dialog.close(); });

                // Show dialog
                this.elements.dialog.container.hide().appendTo('body').fadeIn(300);
            },
            close: function() {
                for (var file_hash in dialog.queue) {
                    var file = this.queue[file_hash];

                    file.xhr.abort();
                    file.onUploadAbort();
                }

                this.elements.dialog.container.fadeOut(300, function() { $(this).remove(); });

                this.options.onDialogClose(dialog.uploaded_files);
            },
            updateFilesCounter: function() {
                var files_counter_text = (this.options.max_files == null) ? booklet_uploader.locale.files_counter : booklet_uploader.locale.files_counter_with_limit;

                files_counter_text = files_counter_text.replace('%files_number%', this.number_of_uploaded_or_queued).replace('%files_number_limit%', this.options.max_files);

                this.elements.files_counter.html(files_counter_text);
            },
            pickFile: function(file_data) {
                var hash = booklet_uploader.generateFileHash();
                var file = {
                    data: file_data,
                    hash: hash,
                    name: file_data.name,
                    size: file_data.size,
                    type: file_data.type,
                    uploaded: false,
                    file_info: null,
                    errors: [],
                    element: $('<li>' +
                        '<div class="file ' + hash + '">' +
                            '<div class="file-thumb"><img src="/public/assets/plugins/uploader/images/file_types/file.svg" alt="' + file_data.name + '" /></div>' +
                            '<div class="file-details">' +
                                '<span class="file-name">' + file_data.name + '</span>' +
                                '<span class="file-size">' + booklet_uploader.bytesToMagebytes(file_data.size) + ' MB</span>' +
                            '</div>' +
                            '<div class="upload-progress"><div class="progress"></div></div>' +
                        '</div>' +
                    '</li>'),
                    isValid: function() {
                        if (!this.validators.isAllowedType()) {
                            var error_text = booklet_uploader.locale.invalid_file_type;

                            this.element.find('.file-details').append('<div class="file-error-text">' + error_text + '</div>');
                            this.errors.push(error_text);

                            return false;
                        }

                        if (this.validators.isMaxSizeExceeded()) {
                            var error_text = booklet_uploader.locale.max_file_size_exceeded;

                            this.element.find('.file-details').append('<div class="file-error-text">' + error_text + '</div>');
                            this.errors.push(error_text);

                            return false;
                        }

                        if (this.validators.isMinSizeExceeded()) {
                            var error_text = booklet_uploader.locale.min_file_size_exceeded;

                            this.element.find('.file-details').append('<div class="file-error-text">' + error_text + '</div>');
                            this.errors.push(error_text);

                            return false;
                        }

                        return true;
                    },
                    validators: {
                        isAllowedType: function() {
                            if (dialog.options.file_types === null || dialog.options.file_types == '*') {
                                return true;
                            }

                            var file_mime_parts = file.type.split('/');
                            var allowed_mimes = dialog.options.file_types.replace(' ', '').split(',');

                            for (var i = 0; i < allowed_mimes.length; i++) {
                                var mime_parts = allowed_mimes[i].split('/');

                                if (file_mime_parts[0] == mime_parts[0] && (mime_parts[1] == '*' || file_mime_parts[1] == mime_parts[1])) {
                                    return true;
                                }
                            }

                            return false;
                        },
                        isMaxSizeExceeded: function() {
                            return (dialog.options.max_size !== null && file.size > dialog.options.max_size) ? true : false;
                        },
                        isMinSizeExceeded: function() {
                            return (dialog.options.min_size == null || file.size >= dialog.options.min_size) ? false : true;
                        },
                    },
                    showErrors: function() {
                        for (var i = 0; i < file.errors.length; i++) {
                            file.element.find('.file-details .file-error-text').remove();
                            file.element.find('.file-details').append('<div class="file-error-text">' + file.errors[i] + '</div>');
                        }
                    },
                    xhr: null,
                    upload: function() {
                        if (!this.isValid()) {
                            this.onFileReject();

                            return false;
                        }

                        var data = new FormData();
                        data.append('files[]', this.data, this.name);

                        this.xhr = $.ajax({
                            url: options.endpoint,
                            type: 'POST',
                            method: 'POST',
                            data: data,
                            cache: false,
                            contentType: false,
                            processData: false,
                            xhr: function() {
                                var xhr = new window.XMLHttpRequest();

                                xhr.upload.addEventListener("progress", function(e){
                                    if (e.lengthComputable) {
                                        var progress = Math.round((e.loaded * 100) / e.total);

                                        file.element.find('.upload-progress .progress').css({ width: progress + '%' });
                                    }

                                    if (!e.lengthComputable || progress == 100) {
                                        file.onUploadDone();
                                    }
                                }, false);

                                xhr.upload.addEventListener("error", function(e){
                                    file.errors.push(booklet_uploader.locale.upload_abort);

                                    file.onUploadDone();
                                }, false);

                                return xhr;
                            },
                            success: function(file_data) { file.onUploadSuccess(file_data); },
                            error: function(xhr) { file.onUploadError(xhr); },
                        });
                    },
                    onUploadDone: function() {
                        this.element.find('.upload-progress').remove();

                        dialog.options.onFileUploadDone(this);
                    },
                    onUploadSuccess: function(file_info) {
                        this.uploaded = true;
                        this.file_info = file_info;

                        this.element.find('.file').addClass('uploaded').append('<i class="upload-status success fa fa-check"></i>');

                        delete dialog.queue[this.hash];
                        dialog.uploaded_files.push(this);

                        dialog.updateFilesCounter();
                        dialog.options.onFileUploadSuccess(this);
                    },
                    onUploadError: function(xhr) {
                        console.error(xhr);

                        --dialog.number_of_uploaded_or_queued;

                        delete dialog.queue[this.hash];

                        this.errors.push(booklet_uploader.locale.upload_error);
                        this.element.find('.file').append('<i class="upload-status error fa fa-exclamation"></i>');
                        this.showErrors();

                        dialog.options.onFileUploadError(this);
                    },
                    onUploadAbort: function() {
                        --dialog.number_of_uploaded_or_queued;

                        delete dialog.queue[this.hash];

                        this.errors.push(booklet_uploader.locale.upload_abort);
                        this.element.find('.upload-progress').remove();
                        this.element.find('.file').append('<i class="upload-status error fa fa-exclamation"></i>');
                        this.showErrors();

                        dialog.options.onFileUploadAbort(this);
                    },
                    onFileReject: function() {
                        --dialog.number_of_uploaded_or_queued;

                        delete dialog.queue[this.hash];

                        this.element.find('.upload-progress').remove();
                        this.element.find('.file').append('<i class="upload-status error fa fa-exclamation"></i>');
                        this.showErrors();

                        dialog.options.onFileReject(this);
                    },
                    onUploadProgress: function(progress) {},
                }

                return file;
            }
        };

        dialog.render();
        dialog.options.onDialogOpen();

        return dialog;
    }
};
