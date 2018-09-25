<?php
namespace Booklet\Uploader;

class ImageExifFixer
{
    private $file_path;
    private $exif;
    private $image;

    function __construct($source_file_path)
    {
        $this->file_path = $source_file_path;
        $this->file_info = file_exists($this->file_path) ? pathinfo($source_file_path) : false;
    }

    public function fix()
    {
        if (!file_exists($this->file_path)) {
            return false;
        }

        $this->image = new Imagick(realpath($this->file_path));

        $exif = @read_exif_data($this->file_path, 'IFD0');
        $this->exif = ($exif && is_array($exif)) ? array_change_key_case($exif, CASE_LOWER) : false;

        if (!$this->image || !$this->exif || !is_array($this->exif)) {
            return false;
        }

        $this->removeExif();
        $this->fixOrientation();

        return $this->image->writeImage();
    }

    private function fixOrientation()
    {
        $orientation = $this->exif['orientation'] ?? false;

        if ($orientation) {
            switch ($orientation) {
                case 1:
                    return true;
                    break;

                case 2:
                    return $this->image->flopImage();
                    break;

                case 3:
                    return $this->image->rotateimage('#00000000', 180);
                    break;

                case 4:
                    return ($this->image->rotateimage('#00000000', 180) && $this->image->flopImage()) ? true : false;
                    break;

                case 5:
                    return ($this->image->rotateimage('#00000000', 90) && $this->image->flopImage()) ? true : false;
                    break;

                case 6:
                    return $this->image->rotateimage('#00000000', 90);
                    break;

                case 7:
                    return ($this->image->rotateimage('#00000000', 270) && $this->image->flopImage()) ? true : false;
                    break;

                case 8:
                    return $this->image->rotateimage('#00000000', 270);
                    break;
            }
        }

        return false;
    }

    private function removeExif()
    {
        $profiles = $this->image->getImageProfiles("icc", true);
        $this->image->stripImage();

        if(!empty($profiles)) {
            $this->image->profileImage("icc", $profiles['icc']);
        }
    }
}
