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
**Step 2:** Include `uploader.js` file. This makes `BookletUploader` variable available.
```html
<script src="/path/to/plugin/js/uploader.js" charset="utf-8"></script>
```

**Optional:** if you want change language or add your own translation include language file before `uploader.js` file.
```html
<script src="/path/to/lang/file.js" charset="utf-8"></script>
```
\
**Step 3:** Add uploader styles
```html
<link rel="stylesheet" href="/path/to/styles.css" />
```
\
**Step 4:** Configure endpoint.

## Upload

Open uploader dialog using `openDialog` method on `BookletUploader` variable.
```js
var dialog = BookletUploader.openDialog(Object options);
```
\
Get info of each uploaded file
```js
dialog.done(function(files) {
    $.each(files, function(i, file) {
        file.done(function(file_info) {
            // Do something with file
        });
    });
});
```

## Dialog options

**endpoint** `string`  
Endpoint url `required`

**locale** `string`  
Set uploader language. Default `en`

**store_to** `string`  
Location for stored files. One of `locale` or `ftp`. Default `locale`

**multiple** `boolean`  
Allow pick multiple files. Default `true`

**max_files** `int`  
Limit of selected files number. Default `null`

**template_file** `string`  
Path to uploader template. Default `''`

## File validations  

**validations.type** `string`  
Set allowed file mime types. Default `''`

**validations.max_size** `int`  
Set maximum size of each file. Default `null`

**validations.min_size** `int`  
Set minimum size of each file. Default `null`
