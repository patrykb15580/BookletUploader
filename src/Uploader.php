<?php
namespace Booklet\Uploader;

use Config;
use FilesUntils;
use StringUntils;

class Uploader
{
    const DEFAULT_STORAGE = 'ftp';

    private $file_object;
    private $file;
    private $file_name;
    private $source_file_path;
    private $storage;
    private $transformations;

    function __construct($file_object, $file, array $params = [])
    {
        $this->file_object = $file_object;

        $this->file = (is_array($file) && !isset($file['tmp_name'])) ? $file[0] : $file;
        $this->source_file_path = $this->file['tmp_name'] ?? $this->file;

        $this->file_name = $this->safeFileName($this->file);
        $this->storage = self::getStorage($this->file_object->storage ?? null);

        $this->transformations = $params['transformations'] ?? [];
    }

    public function upload()
    {
        $success = $this->saveOriginalFile();

        if (get_class($this->storage) == 'Booklet\Uploader\Storage\FTP') {
            $this->storage->close();
        }

        return $success;
    }

    private function saveOriginalFile()
    {
        if (!file_exists($this->source_file_path)) {
            throw new \Exception('File missing: ' . $this->source_file_path);
        }

        $path = Config::get('booklet_uploader_original_files_directory');
        $path .= $this->idToPath() . '/' . $this->file_name;

        return $this->storage->upload($this->source_file_path, $path);
    }

    private function idToPath()
    {
        return FilesUntils::objectIdToPath($this->file_object);
    }

    private function safeFileName($file)
    {
        return StringUntils::sanitizeFileName($file['name'] ?? basename($file));
    }

    public static function getStorage($name = self::DEFAULT_STORAGE)
    {
        switch ($name) {
            case 'ftp':
                $storage = new \Booklet\Uploader\Storage\FTP();
                break;

            case 'local':
                $storage = new \Booklet\Uploader\Storage\Local();
                break;

            //default:
            //    $storage = new \Booklet\Uploader\Storage\Local();
            //    break;
        }

        if (empty($storage)) {
            throw new \Exception('Get upload storage failure');
        }

        return $storage;
    }
}
