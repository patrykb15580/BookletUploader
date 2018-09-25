<?php
namespace Booklet\Uploader;

use Config;
use FilesUntils;
use StringUntils;
use Imagick;

class Uploader
{
    const FILES_DIRECTORY = 'system/uploader/files/';

    private $file_object;
    private $file;

    private $source_file_path;
    private $file_directory;
    private $file_path;
    private $file_name;

    private $transformations;

    function __construct($file_object, $file, array $params = [])
    {
        $this->file_object = $file_object;

        $this->file = (is_array($file) && !isset($file['tmp_name'])) ? $file[0] : $file;
        $this->source_file_path = $this->file['tmp_name'] ?? $this->file;

        $this->file_directory = $this->directory();
        $this->file_name = $this->file_object->name;
        $this->file_path = $this->file_directory . '/' . $this->file_name;

        $this->transformations = $params['transformations'] ?? [];
    }

    public function upload()
    {
        if (!file_exists($this->file_directory) && !mkdir($this->file_directory, 0755, true)) {
            throw new \Exception('Can\'t create directory ' . $directory . '.');

            return false;
        }

        chmod($this->file_directory, 0777);

        if (!rename($this->source_file_path, $this->file_path)) {
            throw new \Exception('File copy failure.');

            return false;
        }

        chmod($this->file_path, 0644);

        if ($this->file_object->editable()) {
            $exif_fixer = new ImageExifFixer($this->file_path);
            $exif_fixer->fix();
        }

        $this->updateFileModelData();

        return true;
    }

    private function updateFileModelData()
    {
        $this->file_object->update([
            'stored_at' => date(Config::get('mysqltime'))
        ]);
    }

    private function directory()
    {
        return Uploader::FILES_DIRECTORY . $this->idPath();
    }

    private function idPath()
    {
        return FilesUntils::objectIdToPath($this->file_object);
    }
}
