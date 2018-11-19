<?php
namespace Booklet\Uploader\Image;

class ImageUtils
{
    const PROPORTIONS_TOLLERANCE = 0.04;

    public static function calcCropParams(int $source_width, int $source_height, float $target_ratio)
    {
        $width = $source_width;
        $height = $source_height;

        $source_ratio = $width / $height;

        $x = 0;
        $y = 0;

        if ($source_ratio !== $target_ratio) {
            if ($source_ratio > $target_ratio) {
                $width = round($height * $target_ratio);
                $x = round(($source_width - $width) / 2);
            } else {
                $height = round($width / $target_ratio);
                $y = round(($source_height - $height) / 2);
            }
        }

        $image_ratio = $width / $height;

        if (abs($image_ratio - $target_ratio) > self::PROPORTIONS_TOLLERANCE) {
            return false;
        }

        return [ $width, $height, $x, $y, $image_ratio];
    }

    public static function calculateProportionallyHeight($new_width, $image_width, $image_height)
    {
        return intval($new_width / ($image_width / $image_height));
    }

    public static function calculateProportionallyWidth($new_height, $image_width, $image_height)
    {
        return intval($new_height * ($image_width / $image_height));
    }

    public static function sig($hash, $modifiers = '')
    {
        return md5($hash . $modifiers);
    }
}
