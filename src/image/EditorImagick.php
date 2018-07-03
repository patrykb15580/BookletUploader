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

    public function width()
    {
        return $this->imagick->getImageWidth();
    }

    public function height()
    {
        return $this->imagick->getImageHeight();
    }

    public function proportionalWidth($height)
    {
        return $height * $this->aspectRatio();
    }

    public function proportionalHeight($width)
    {
        return $width / $this->aspectRatio();
    }

    public function aspectRatio()
    {
        return $this->width() / $this->height();
    }

    public function imageFormat()
    {
        return strtolower($this->imagick->getImageFormat());
    }

    public function imageMIME()
    {
        return $this->imagick->getImageMimeType();
    }

    public function imageInfo()
    {
        return [
            'width' => $this->width(),
            'height' => $this->height(),
            'format' => $this->imageFormat(),
            'mime' => $this->imageMIME()
        ];
    }

    public function resize(int $width, int $height)
    {
        $bestfit = (!$width || !$height) ? true : false;

        $width = ($width) ? $width : $this->proportionalWidth($height);
        $height = ($height) ? $height : $this->proportionalHeight($width);

        $this->imagick->resizeImage($width, $height, \Imagick::FILTER_LANCZOS, 1, $bestfit);
    }

    public function rotate(int $angle)
    {
        $this->imagick->rotateImage(self::BACKGROUND_COLOR, $angle);
    }

    public function crop(int $width, int $height, int $x, int $y)
    {
        $this->imagick->cropImage($width, $height , $x , $y);
    }

    public function mirror()
    {
        $this->imagick->flopImage();
    }

    public function flip()
    {
        $this->imagick->flipImage();
    }

    public function rounded($radius = 30)
    {
        $this->imagick->roundCorners($radius, $radius);
    }

    public function negative()
    {
        $this->imagick->negateImage(false);
    }

    public function grayscale()
    {
        $this->imagick->setImageColorspace(2);
    }

    public function format($format)
    {
        $this->imagick->setImageFormat($format);
    }

    public function quality(int $quality)
    {
        $this->imagick->setImageCompressionQuality($quality);
    }

    public function preview(int $width = 0, int $height = 0, int $quality = 75)
    {
        $width = ($width) ? $width : $this->proportionalWidth($height);
        $height = ($height) ? $height : $this->proportionalHeight($width);

        $this->imagick->scaleImage($width, $height, true);
        $this->format('jpeg');
        $this->quality($quality);
    }

    public function thumbnail(int $size)
    {
        $this->imagick->thumbnailImage($size, $size);
    }

    public function save($filename)
    {
        $directory = Image::TRANSFORMED_FILES_DIR;
        $extension = '.' . $this->imageFormat();
        $mime = $this->imageMIME();

        $file_path = $directory . $filename . $extension;

        $this->imagick->writeImage($file_path);
    }
}
