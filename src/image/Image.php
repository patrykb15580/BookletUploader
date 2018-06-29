<?php
namespace Booklet\Uploader\Image;

class Image
{
    const IMAGES_TYPES = [
        'image/svg+xml',
        'image/gif',
        'image/jpeg',
        'image/png',
        'image/tiff',
        'image/bmp',
    ];

    const TRANSFORMED_FILES_DIR = 'system/uploader/temp/';

    private $file_hash;
    private $file_path;
    private $modifiers;
    private $sig;
    private $editor;

    function __construct($file_hash, $file_path, $modifiers)
    {
        $this->file_hash = $file_hash;
        $this->file_path = $file_path;
        $this->modifiers = ltrim($modifiers, '-/');
        $this->sig = ImageUtils::sig($file_hash, $modifiers);
    }

    public function output()
    {
        $file = glob(self::TRANSFORMED_FILES_DIR . $this->sig . '.*')[0] ?? false;

        if ($file) {
            $filename = basename($this->file_path);
            $extension = pathinfo($filename, PATHINFO_EXTENSION);;
            $file_type = mime_content_type($file);

            header('Content-type: ' . $file_type);
            header('Content-Disposition: inline; filename=' . $filename . $extension . ';');

            readfile($file);
        } else {
            $this->transform();
            $this->editor->output($this->sig);
        }
    }

    public function transform()
    {
        $this->editor = new EditorImagick($this->file_path);

        foreach (explode('-/', $this->modifiers) as $modifier) {
            $modifier_parts = explode('/', $modifier);

            $transformation = array_shift($modifier_parts);
            $params = array_filter($modifier_parts);

            if (method_exists($this, $transformation)) {
                $this->{$transformation}($params);
            }
        }
    }

    private function resize($params) {
        $dimensions = explode('x', $params[0]);
        $width = intval($dimensions[0]);
        $height = intval($dimensions[1]);

        $this->editor->resize($width, $height);
    }

    private function rotate($params) {
        $angle = intval($params[0]);

        $this->editor->rotate($angle);
    }

    private function crop($params) {
        list($width, $height) = explode('x', $params[0]);
        list($x, $y) = explode(',', $params[1]);

        $this->editor->crop($width, $height, $x, $y);
    }

    private function mirror() {
        $this->editor->mirror();
    }

    private function flip() {
        $this->editor->flip();
    }

    private function rounded($params) {
        $radius = floatval($params[0] ?? 30);

        $this->editor->rounded($radius);
    }

    private function negative() {
        $this->editor->negative();
    }

    private function grayscale() {
        $this->editor->grayscale();
    }

    private function format($params) {
        $this->editor->format($params[0]);
    }

    private function quality($params) {
        $this->editor->quality($params[0]);
    }

    private function preview($params) {
        $width = 600;
        $height = 600;
        $quality = $params[1] ?? 75;

        if (isset($params[0])) {
            list($width, $height) = explode('x', $params[0]);
        }

        $this->editor->preview($width, $height, $quality);
    }

    private function thumbnail($params) {
        $this->editor->thumbnail($params[0] ?? 100);
    }
}
