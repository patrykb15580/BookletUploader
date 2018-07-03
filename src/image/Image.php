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

        $transformed_file = glob(self::TRANSFORMED_FILES_DIR . $this->sig . '.*')[0] ?? null;
        $file_path = $transformed_file ?? $this->file_path;

        $this->editor = new EditorImagick($file_path);
    }

    public function transform()
    {
        $file = glob(self::TRANSFORMED_FILES_DIR . $this->sig . '.*');

        if (empty($file[0])) {
            foreach (explode('-/', $this->modifiers) as $modifier) {
                $modifier_parts = explode('/', $modifier);

                $transformation = array_shift($modifier_parts);
                $params = array_filter($modifier_parts);

                if (method_exists($this, $transformation)) {
                    $this->{$transformation}($params);
                }
            }

            $this->editor->save($this->sig);
        }
    }

    public function output()
    {
        $directory = Image::TRANSFORMED_FILES_DIR;
        $filename = $this->sig;
        $extension = '.' . $this->imageFormat();
        $mime = $this->imageMIME();

        $file_path = $directory . $filename . $extension;

        header('Content-type: ' . $mime);
        header('Content-Disposition: inline; filename=' . $filename . $extension . ';');

        readfile($file_path);
    }

    public function width()
    {
        return $this->editor->width();
    }

    public function height()
    {
        return $this->editor->height();
    }

    public function aspectRatio()
    {
        return $this->editor->aspectRatio();
    }

    public function imageFormat()
    {
        return $this->editor->imageFormat();
    }

    public function imageMIME()
    {
        return $this->editor->imageMIME();
    }

    public function imageInfo()
    {
        return $this->editor->imageInfo();
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

    private function mirror()
    {
        $this->editor->mirror();
    }

    private function flip()
    {
        $this->editor->flip();
    }

    private function rounded($params) {
        $radius = floatval($params[0] ?? 30);

        $this->editor->rounded($radius);
    }

    private function negative()
    {
        $this->editor->negative();
    }

    private function grayscale()
    {
        $this->editor->grayscale();
    }

    private function format($params) {
        $this->editor->format($params[0]);
    }

    private function quality($params) {
        $this->editor->quality($params[0]);
    }

    private function preview($params) {
        $width = 0;
        $height = 0;
        $quality = intval($params[1] ?? 75);

        if (isset($params[0])) {
            $dimensions = explode('x', $params[0]);
            $width = intval($dimensions[0]);
            $height = intval($dimensions[1]);
        }

        $this->editor->preview($width, $height, $quality);
    }

    private function thumbnail($params) {
        $this->editor->thumbnail($params[0] ?? 100);
    }
}
