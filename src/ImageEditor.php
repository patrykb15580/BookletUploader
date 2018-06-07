<?php
namespace Booklet\Uploader;

use WideImage\WideImage as WideImage;

class ImageEditor
{
    private $file;
    private $image;
    private $transformations;

    function __construct($file, $modifiers = '')
    {
        $this->file = $file;
        $this->image = WideImage::load($file->path());
        $this->transformations = $this->listTransformations($modifiers);
    }

    public function transform()
    {
        foreach ($this->transformations as $method => $params) {
            $this->applyTransformation($method, $params);
        }

        $file_format = pathinfo($this->file->name, PATHINFO_EXTENSION);

        $aditional_param = null;
        if ($file_format == 'jpg' || $file_format == 'jpeg') {
            $aditional_param = 100;
        }

        return $this->image->asString($file_format, $aditional_param);
    }

    private function applytransformation($method, $params)
    {
        if (is_string($params)) {
            $params = explode(',', $params);
        }

        if ($method == 'preview') {
            $this->preview();
        }

        if ($method == 'thumbnail') {
            $this->thumbnail();
        }

        if ($method == 'resize') {
            $width = $params[0] ?? null;
            $height = $params[1] ?? null;
            $fit = $params[2] ?? 'inside';
            $scale = $params[3] ?? 'any';

            $this->resize($width, $height, $fit, $scale);
        }

        if ($method == 'crop') {
            // If is ratio string
            if (preg_match('/\d:\d/', $params[0])) {
                $this->cropToRatio($params[0]);
            } else {
                $x = $params[0] ?? 0;
                $y = $params[1] ?? 0;
                $width = $params[2];
                $height = $params[3];

                $this->crop($x, $y, $width, $height);
            }
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

        if ($method == 'monochrome') {
            $this->monochrome();
        }
    }

    private function listTransformations($modifiers)
    {
        $transformations = [];
        foreach (explode('&', $modifiers) as $transformation) {
            $parts = explode('=', $transformation);

            $name = $parts[0];
            $params = $parts[1] ?? true;

            $transformations[$name] = $params;
        }

        return $transformations;
    }

    private function preview()
    {
        $this->resize(600, 600, 'inside', 'down');
    }

    private function thumbnail()
    {
        $this->resize(100, 100, 'outside');
        $this->crop('center', 'center', 100, 100);
    }

    private function resize($width, $height, $fit = 'inside', $scale = 'any')
    {
        $this->image = $this->image->resize($width, $height, $fit, $scale);
    }

    private function crop($x, $y, $width, $height)
    {
        $this->image = $this->image->crop($x, $y, $width, $height);
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
            $new_width = intval($height * $target_ratio);
            $new_height = $height;

            $x = ($width - $new_width) / 2;
            $y = 0;
        } else {
            $new_width = $width;
            $new_height = intval($width / $target_ratio);

            $x = 0;
            $y = ($height - $new_height) / 2;
        }

        $this->crop($x, $y, $new_width, $new_height);
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

    private function monochrome()
    {
        $this->image = $this->image->asGrayscale();
    }
}
