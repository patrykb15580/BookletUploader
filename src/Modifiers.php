<?php
namespace Booklet\Uploader;

class Modifiers
{
    const SEPARATOR = '-/';
    const DEFAULT_QUALITY = 80;
    const VALID_FORMATS = ['jpg', 'jpeg', 'png', 'tiff'];

    public static function resize(int $width, int $height)
    {
        if ($width < 0 || $height < 0) {
            return null;
        }

        return self::SEPARATOR . 'resize/' . $width . 'x' . $height . '/';
    }

    public static function rotate(int $angle)
    {
        if ($angle == 0) {
            return null;
        }

        if ($angle < 0) {
            $angle += ceil($angle / 360) * 360;
        }

        if ($angle >= 360) {
            $angle -= floor($angle / 360) * 360;
        }

        return self::SEPARATOR . 'rotate/' . $angle . '/';
    }

    public static function crop(int $width, int $height, int $x, int $y)
    {
        if ($width < 0) { $width = 0; }
        if ($height < 0) { $height = 0; }
        if ($x < 0) { $x = 0; }
        if ($y < 0) { $y = 0; }

        return self::SEPARATOR . 'crop/' . $width . 'x' . $height . '/' . $x . ',' . $y . '/';
    }

    public static function mirror()
    {
        return self::SEPARATOR . 'mirror/';
    }

    public static function flip()
    {
        return self::SEPARATOR . 'flip/';
    }

    public static function rounded(int $radius = 30)
    {
        if ($radius > 0) {
            return self::SEPARATOR . 'rounded/' . $radius . '/';
        }

        return null;
    }

    public static function negative()
    {
        return self::SEPARATOR . 'negative/';
    }

    public static function grayscale()
    {
        return self::SEPARATOR . 'grayscale/';
    }

    public static function format(string $format)
    {
        if (in_array($format, self::VALID_FORMATS)) {
            return self::SEPARATOR . 'format/' . $format . '/';
        }

        return null;
    }

    public static function quality(int $quality)
    {
        if ($quality >= 0 && $quality <= 100) {
            return self::SEPARATOR . 'quality/' . $quality . '/';
        }

        return null;
    }

    public static function preview(int $width, int $height = null, int $quality = 80)
    {
        if ($width < 0 || ($height && $height < 0) || ($quality < 0 || $quality > 100)) {
            return null;
        }

        return self::SEPARATOR . 'preview/' . $width . 'x' . $height . '/' . $quality . '/';
    }

    public static function thumbnail(int $width, int $height = null)
    {
        if ($width > 0 && (!$height || $height > 0)) {
            return self::SEPARATOR . 'thumbnail/' . $width . 'x' . $height . '/';
        }

        return null;
    }

    public static function listFromString(string $string)
    {
        $modifiers = explode('-/', $string);

        array_shift($modifiers);

        $modifiers_array = [];
        foreach ($modifiers as $modifier) {
            $modifier_parts = explode('/', $modifier);
            $modifier_name = array_shift($modifier_parts);

            $modifiers_array[$modifier_name] = [];

            foreach ($modifier_parts as $modifier_param) {
                if (!empty($modifier_param) && !is_bool($modifier_param)) {
                    $modifiers_array[$modifier_name][] = $modifier_param;
                }
            }
        }

        return $modifiers_array;
    }
}
