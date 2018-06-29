<?php
namespace Booklet\Uploader\Image;

interface Editor
{
    public function resize($width, $height);
    public function rotate($angle);
    public function crop($width, $height, $x, $y);
    public function mirror();
    public function flip();
    public function roundCorners($radius = 30);
    public function circle();
    public function negative();
    public function grayscale();
    public function format($format);
    public function preview($width = 600, $height = 600);
    public function thumbnail($size = 100);
}
