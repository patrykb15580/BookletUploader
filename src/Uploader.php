<?php
namespace Booklet\Uploader;

use Config;
use FilesUntils;
use StringUntils;

class Uploader
{
    const DEFAULT_STORAGE = 'ftp';

    private $model_object;
    private $file;
    private $file_name;
    private $source_file_path;
    private $storage;
    private $transformations;

    function __construct($model_object, $file, array $params = [])
    {
        $model_object, $file, $storage

        $this->model_object = $file_object;

        if (is_array($file)) {
            $this->file = (isset($file['tmp_name'])) ? $params['file'] : $params['file'][0];
        } else {
            $this->file = $params['file'];
        }

        $this->transformations = $params['transformations'] ?? [];

        $this->file_name = $this->safeFileName($this->file);
        $this->source_file_path = $this->file['tmp_name'] ?? $this->file;
        $this->storage = $this->getStorage($params['storage'] ?? self::DEFAULT_STORAGE);
    }

    public function upload()
    {
        return $this->saveOriginalFile();
    }

    private function saveOriginalFile()
    {
        if (!file_exists($this->source_file_path)) {
            throw new \Exception('File missing: ' . $this->source_file_path);
        }

        $path = Config::get('booklet_uploader_original_files_directory');
        $path .= $this->idToPath() . '/' . $this->safe_file_name;

        return $this->storage->upload($this->source_file_path, $path);
    }

    private function idToPath()
    {
        return FilesUntils::objectIdToPath($this->model_object);
    }

    private function safeFileName($file)
    {
        return StringUntils::sanitizeFileName($file['name'] ?? basename($file));
    }

    private function getStorage($name)
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
