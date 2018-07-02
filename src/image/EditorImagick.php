<?php
namespace Booklet\Uploader\Image;

class EditorImagick implements Editor
{
    private $imagick;
    private $input_path;

    const TRANSPARENT = '#00000000';
    const BACKGROUND_COLOR = '#ffffff';

    function __construct($input_path)
    {
        $this->imagick = new \Imagick($input_path);
        $this->input_path = $input_path;
    }

    private function width()
    {
        return $this->imagick->getImageWidth();
    }

    private function height()
    {
        return $this->imagick->getImageHeight();
    }

    private function aspectRatio()
    {
        return $this->width() / $this->height();
    }

    public function resize(int $width, int $height) {
        $bestfit = (!$width || !$height) ? true : false;
        $width = ($width) ? $width : $height;
        $height = ($height) ? $height : $width;

        $this->imagick->resizeImage($width, $height, \Imagick::FILTER_LANCZOS, 1, $bestfit);
    }

    public function rotate(int $angle) {
        $this->imagick->rotateImage(self::BACKGROUND_COLOR, $angle);
    }

    public function crop(int $width, int $height, int $x, int $y) {
        $this->imagick->cropImage($width, $height , $x , $y);
    }

    public function mirror() {
        $this->imagick->flopImage();
    }

    public function flip() {
        $this->imagick->flipImage();
    }

    public function rounded($radius = 30) {
        $this->imagick->roundCorners($radius, $radius);
    }

    public function negative() {
        $this->imagick->negateImage(false);
    }

    public function grayscale() {
        $this->imagick->setImageColorspace(2);
    }

    public function format($format) {
        $this->imagick->setImageFormat($format);
    }

    public function quality(int $quality)
    {
        $this->imagick->setImageCompressionQuality($quality);
    }

    public function preview(int $width = 0, int $height = 0, int $quality = 75) {
        if ($width || $height) {
            $this->imagick->scaleImage($width, $height, false);
        }
        $this->format('jpeg');
        $this->quality($quality);
    }

    public function thumbnail(int $size) {
        $this->imagick->thumbnailImage($size, $size);
    }

    public function output($filename)
    {
        $dir = Image::TRANSFORMED_FILES_DIR;
        $filename .= '.' . strtolower($this->imagick->getImageFormat());
        $file_mime = $this->imagick->getImageMimeType();

        $output_path = $dir . $filename;

        $this->imagick->writeImage($output_path);

        header('Content-type: ' . $file_mime);
        header('Content-Disposition: inline; filename=' . $filename . ';');

        readfile($output_path);
    }
}
