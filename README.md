# BookletUploader

## Instalacja

**Composer**
```json
"require": {
    "patrykb15580/booklet-uploader": "dev-master"
}
```
```bash
php composer install
```
**Dodanie plików `uploader.js` oraz `styles.css`**\

```html
<link rel="stylesheet" href="/path/to/plugin/directory/styles.css" />
<script src="/path/to/plugin/directory/js/uploader.js" charset="utf-8"></script>
```

**Własne tłumaczenie**\
Aby dodać własne tłumaczenie należy utworzyć stałą `BOOKLET_UPLOADER_LOCALE` przed dołączeniem pliku `uploader.js`.
Podane teksty zastąpią domyślne tłumaczenia.
```js
BOOKLET_UPLOADER_LOCALE = {
    upload: 'Wyślij pliki',
    ...
}
```
## Uploader
```js
BookletUploader.openUploader({
    multiple: true,
    locale: 'pl',
    max_files: 10,
    crop: 16/9,
    validations: {
        type: 'image/jpeg, image/png'
    }
});

uploader.done(function(files) { 
    // Pętla po wybranych plikach
    $.each(files, function(i, file) { 
        file.done(function(file_info) {
            // Zakończenie uploadu pliku
        }).fail(function() {
            // Błąd podczas przesyłania
        });
    });
});
```

## Edytor zdjęć
```js
var editor = BookletUploader.openEditor(image_hash, {
    locale: 'pl',
    crop: 16/9,
    effects: ['crop', 'rotate', 'mirror', 'flip', 'grayscale', 'negative']
});

editor.done(function(file) {
    file.done(function(file_data) {
        // Aktualizacja danych pliku
    }).fail(function() {
        // Błąd podczas aktualizacji pliku
    });
});
```
