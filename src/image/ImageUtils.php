<?php
namespace Booklet\Uploader\Image;

class ImageUtils
{
    public static function calculateCropToRatioDimensionsAndPostition($image_width, $image_height, $target_ratio)
    {
        $source_ratio = $image_width / $image_height;

        $width = $image_width;
        $height = $image_height;

        $x = 0;
        $y = 0;

        if ($source_ratio !== $target_ratio) {
            if ($source_ratio > $target_ratio) {
                $width = intval($height * $target_ratio);
                $x = ($image_width - $width) / 2;
            } else {
                $height = intval($width / $target_ratio);
                $y = ($image_height - $height) / 2;
            }
        }

        return [$width, $height, $x, $y];
    }

    public static function calculateProportionallyHeight($new_width, $image_width, $image_height)
    {
        return intval($new_width / ($image_width / $image_height));
    }

    public static function calculateProportionallyWidth($new_height, $image_width, $image_height)
    {
        return intval($new_height * ($image_width / $image_height));
    }
}
