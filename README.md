# BookletUploader

## Instalacja

**Step 1:** Update `composer.json` with:
```json
"require": {
    "patrykb15580/booklet-uploader": "dev-master"
}
```
and run Composer:
```bash
php composer install
```
\
**Step 2:** Include `uploader.js` file. This makes `booklet_uploader` variable available.
```html
<script src="/path/to/plugin/js/uploader.js" charset="utf-8"></script>
```

**Optional:** if you want change language or add your own translation include language file before `uploader.js` file.
```html
<script src="/path/to/your/lang/file.js" charset="utf-8"></script>
```
or
```html
<script src="/path/to/plugin/js/lang/uploader.pl.js" charset="utf-8"></script>
```
\
**Step 3:** Add uploader styles
```html
<link rel="stylesheet" href="/path/to/plugin/css/uploader.css" />
```
or
```html
<link rel="stylesheet" href="/path/to/custom/css/file.css" />
```
\
**Step 4:** Configure endpoint. 

For uploading files to FTP server you must define server data via `Config` class
```php
Config::get('booklet_uploader_ftp_ip', 'ftp_server_ip');
Config::get('booklet_uploader_ftp_login', 'ftp_server_login');
Config::get('booklet_uploader_ftp_password', 'ftp_server_password');
```

Endpoint should return response on success like this:
```js
{
    "success": true,
    "file": {
        "hash": "5f33767e5443db19f2ccbddfa8245c24",
        "name": "file.jpg",
        "type": "image/jpeg",
        "size": 17196646,
        "source": "local",
        "is_stored": true,
        "url": "https://booklet.pl/file/5f33767e5443db19f2ccbddfa8245c24",
        "preview": "https://booklet.pl/file/5f33767e5443db19f2ccbddfa8245c24",
        "actions": {
            "edit": "https://booklet.pl/file/5f33767e5443db19f2ccbddfa8245c24/edit",
            "delete": "https://booklet.pl/file/5f33767e5443db19f2ccbddfa8245c24/delete"
        },
        // if image
        "image_info": {
            "width": 1024,
            "height": 768,
        }
    }
}
```
and on error like this:
```json
{
    "success": false,
    "message": "Error message to display"
}
```

## Upload

Open uploader dialog using `openDialog` method on `booklet_uploader` variable.
```js
var dialog = booklet_uploader.openDialog(Object options);
```

In your endpoint upload file via `Booklet\Uploader\Client` class.
```php
$client = new Booklet\Uploader\Client(string $storage_type);
$success = $client_upload->upload($_FILES['files']['tmp_name'][0], '/uploaded/file/destination/file.jpg');

```

## Dialog options

**endpoint** `string`  
Endpoint url `required`

**max_files** `int`  
Limit of files number. Default `null`

**max_size** `int`  
Maximum size limit of each file. Default `null`

**min_size** `int`  
Minimum size limit of each file. Default `null`

**file_types** `string`  
Allowed mime types. Default `''`

## Callbacks

**onFileUploadDone(file)**  
Function to be invoked when the file upload is done, no matters if is successful or not.

**onFileUploadSuccess(file)**  
Function to be invoked after successfully file upload.

**onFileUploadError(file)**  
Function to be invoked when file upload failed.

**onFileUploadAbort(file)**  
Function to be invoked after abort file upload.

**onFileReject(file)**  
Function to be invoked after reject file. For example if file size exceeded max/min size limit or has not allowed mime type.

**onDialogOpen()**  
Function to be invoked after open uploader dialog.

**onDialogClose(files)**  
Function to be invoked after close uploader dialog.
