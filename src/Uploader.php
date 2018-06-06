<?php
namespace Booklet\Uploader;

use Config;
use FilesUntils;
use StringUntils;

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
        $this->file_name = $this->safeFileName($this->file);
        $this->file_path = $this->file_directory . '/' . $this->file_name;

        $this->transformations = $params['transformations'] ?? [];
    }

    public function upload()
    {
        if ($this->createDirectory($this->file_directory) && $this->copyFile()) {
            $this->updateFileModelData();

            return true;
        }

        return false;
    }

    private function updateFileModelData()
    {
        $this->file_object->update([
            'stored_at' => date(Config::get('mysqltime'))
        ]);
    }

    private function copyFile()
    {
        if (!rename($this->source_file_path, $this->file_path)) {
            throw new \Exception('File copy failure.');
        }

        chmod($this->file_path, 0644);

        return true;
    }

    private function directory()
    {
        return Uploader::FILES_DIRECTORY . $this->idPath();
    }

    private function createDirectory($directory)
    {
        if (file_exists($directory)) {
            return true;
        }

        if (!mkdir($directory, 0755, true)) {
            throw new \Exception('Can\'t create directory ' . $directory . '.');
        }

        chmod($directory, 0777);

        return true;
    }

    private function idPath()
    {
        return FilesUntils::objectIdToPath($this->file_object);
    }

    private function safeFileName($file)
    {
        return StringUntils::sanitizeFileName($file['name'] ?? basename($file));
    }
}
