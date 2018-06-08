<?php
namespace Booklet\Uploader;

use WideImage\WideImage as WideImage;

class ImageEditor
{
    private $file;
    private $image;
    private $modifiers;

    function __construct($file, $modifiers = '')
    {
        $this->file = $file;
        $this->image = WideImage::load($file->path());
        $this->modifiers = $this->listModifiers($modifiers);
    }

    public function transform()
    {
        foreach ($this->modifiers as $method => $params) {
            $this->applyTransformation($method, $params);
        }

        return $this->toString();
    }

    private function toString()
    {
        $file_format = pathinfo($this->file->name, PATHINFO_EXTENSION);

        if ($file_format == 'jpg' || $file_format == 'jpeg') {
            return $this->image->asString('jpg', 100);
        }

        return $this->image->asString($file_format);
    }

    private function applyTransformation($method, $params)
    {
        if ($method == 'resize') {
            $dim = $params[0];
            $fit = $params[1] ?? 'inside';
            $scale = $params[2] ?? 'any';

            $this->resize($dim, $fit, $scale);
        }

        if ($method == 'crop') {
            // If is ratio string

            if (preg_match('/\d:\d/', $params[0])) {
                $this->cropToRatio($params[0]);
            } else {
                $this->crop($params[0], $params[1] ?? '0,0');
            }
        }

        if ($method == 'preview') {
            $this->preview();
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

        if ($method == 'flop') {
            $this->flop();
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

    private function preview()
    {
        $this->resize('600x600', 'inside', 'down');
    }

    private function thumbnail()
    {
        $this->resize('100x100', 'outside');
        $this->crop('100x100', 'center,center');
    }

    private function resize($dim, $fit = 'inside', $scale = 'any')
    {
        $dim = explode('x', $dim);

        $width = empty($dim[0]) ? null : $dim[0];
        $height = empty($dim[1]) ? null : $dim[1];

        $this->image = $this->image->resize($width, $height, $fit, $scale);
    }

    private function crop($dim, $pos)
    {
        $dim = explode('x', $dim);
        $pos = explode(',', $pos);

        $this->image = $this->image->crop($pos[0], $pos[1], $dim[0], $dim[1]);
    }

    private function cropToRatio($target_ratio)
    {
        $width = $this->image->getWidth();
        $height = $this->image->getHeight();

        $source_ratio = $width / $height;

        $target_ratio = explode(':', $target_ratio);
        $target_ratio = $target_ratio[0] / $target_ratio[1];

        if ($source_ratio == $target_ratio) {
            return true;
        }

        if ($source_ratio > $target_ratio) {
            $width = intval($height * $target_ratio);
        } else {
            $height = intval($width / $target_ratio);
        }

        $dim = $width . 'x' . $height;

        $this->crop($dim, 'center,center');
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

    private function flop()
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
}
