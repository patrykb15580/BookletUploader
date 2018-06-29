<?php
namespace Booklet\Uploader\Image;

interface Editor
{
    public function resize(int $width, int $height);
    public function rotate(int $angle);
    public function crop(int $width, int $height, int $x, int $y);
    public function mirror();
    public function flip();
    public function rounded($radius = 30);
    public function negative();
    public function grayscale();
    public function format($format);
    public function quality(int $quality);
    public function preview(int $width = 600, int $height = 600, int $quality = 75);
    public function thumbnail(int $size);
    public function output($filename);
}
