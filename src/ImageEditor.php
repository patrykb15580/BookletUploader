<?php
namespace Booklet\Uploader;

use WideImage\WideImage as WideImage;

class ImageEditor
{
    const VALID_FORMATS = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/bmp',
    ];

    const TEMP_FILES_DIR = 'system/uploader/temp/';

    private $file;
    private $file_path;
    private $temp_file_path;
    private $image;
    private $modifiers;

    function __construct($file, $modifiers = '')
    {
        $this->file = $file;
        $this->file_path = $file->path();

        $signature = md5($this->file->hash_id . '/' . $modifiers);
        $extension = pathinfo($this->file->name, PATHINFO_EXTENSION);

        $this->temp_file_path = self::TEMP_FILES_DIR . $signature . '.' . $extension;

        $this->image = WideImage::load($this->file_path);

        $this->modifiers = $this->listModifiers($modifiers);
    }

    public function transform()
    {
        if (file_exists($this->temp_file_path)) {
            return $this->temp_file_path;
        }

        foreach ($this->modifiers as $method => $params) {
            $this->applyTransformation($method, $params);
        }

        return ($this->save()) ? $this->temp_file_path : false;
    }

    private function save()
    {
        $directory = self::TEMP_FILES_DIR;

        if (!file_exists($directory) && !mkdir($directory, 0755, true)) {
            return false;
        }

        chmod($directory, 0777);

        $this->image->saveToFile($this->temp_file_path);

        return file_exists($this->temp_file_path);
    }

    private function toString()
    {
        $file_format = pathinfo($this->file->name, PATHINFO_EXTENSION);

        if ($this->isJPG()) {
            return $this->image->asString('jpg', 100);
        }

        return $this->image->asString($file_format);
    }

    private function hasValidFormat()
    {
        return in_array($this->file->type, self::VALID_FORMATS);
    }

    private function isJPG()
    {
        return ($this->file->type == 'image/jpeg') ? true : false;
    }

    private function isPNG()
    {
        return ($this->file->type == 'image/png') ? true : false;
    }

    private function isGIF()
    {
        return ($this->file->type == 'image/gif') ? true : false;
    }

    private function isBMP()
    {
        return ($this->file->type == 'image/bmp') ? true : false;
    }

    private function applyTransformation($method, $params)
    {
        if ($method == 'resize') {
            $this->resize($params[0], $params[1] ?? 'inside', $params[2] ?? 'any');
        }

        if ($method == 'crop') {
            $this->crop($params[0], $params[1]);
        }

        if ($method == 'preview') {
            $this->preview($params[0] ?? '600x600');
        }

        if ($method == 'thumbnail') {
            $this->thumbnail();
        }

        if ($method == 'rounded') {
            $this->roundCorners();
        }

        if ($method == 'circle') {
            $this->circle();
        }

        if ($method == 'rotate') {
            $this->rotate($params[0]);
        }

        if ($method == 'flip') {
            $this->flip();
        }

        if ($method == 'mirror') {
            $this->mirror();
        }

        if ($method == 'negative') {
            $this->negative();
        }

        if ($method == 'grayscale') {
            $this->grayscale();
        }
    }

    private function listModifiers($modifiers_str)
    {
        $modifiers_str = ltrim($modifiers_str, '-/');

        $modifiers = [];
        foreach (explode('-/', $modifiers_str) as $modifier) {
            $modifier = rtrim($modifier, '/');
            $params = explode('/', $modifier);

            $name = $params[0];
            unset($params[0]);
            $params = array_values($params);

            $modifiers[$name] = $params;
        }

        return $modifiers;
    }

    private function preview($size)
    {
        $this->resize($size, 'inside', 'down');
    }

    private function thumbnail()
    {
        $this->resize('100x100', 'outside');
        $this->crop('100x100', 'center,center');
    }

    private function resize($size, $fit = 'inside', $scale = 'any')
    {
        list($width, $height) = explode('x', $size);

        $this->image = $this->image->resize($width, $height, $fit, $scale);
    }

    private function crop($size, $pos)
    {
        list($width, $height) = explode('x', $size);
        list($x, $y) = explode(',', $pos);

        $this->image = $this->image->crop($x, $y, $width, $height);
    }

    private function roundCorners()
    {
        $this->image = $this->image->roundCorners(20, null, 4);
    }

    private function circle()
    {
        $this->cropToRatio('1:1');
        $radius = $this->image->getWidth() / 2;

        $this->image = $this->image->roundCorners($radius, null, 4);
    }

    private function rotate($angle)
    {
        $this->image = $this->image->rotate($angle, null, false);
    }

    private function flip()
    {
        $this->image = $this->image->flip();
    }

    private function mirror()
    {
        $this->image = $this->image->mirror();
    }

    private function negative()
    {
        $this->image = $this->image->asNegative();
    }

    private function grayscale()
    {
        $this->image = $this->image->asGrayscale();
    }

    public static function calcParamsForCropToRatio($source_width, $source_height, $target_ratio)
    {
        $width = $source_width;
        $height = $source_height;

        $x = 0;
        $y = 0;

        $source_ratio = $width / $height;

        $target_ratio = explode(':', $target_ratio);
        $target_ratio = $target_ratio[0] / $target_ratio[1];

        if ($source_ratio == $target_ratio) {
            return [$width . 'x' . $height, '0,0'];
        }

        if ($source_ratio > $target_ratio) {
            $width = intval($height * $target_ratio);
            $x = ($source_width - $width) / 2;
        } else {
            $height = intval($width / $target_ratio);
            $y = ($source_height - $height) / 2;
        }

        return [$width . 'x' . $height, $x . ',' . $y];
    }
}
