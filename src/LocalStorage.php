<?php
namespace Booklet\Uploader;

class LocalStorage
{
    public function save($source, $destination)
    {
        $dir_path = dirname($destination);

        if (!$this->exists($dir_path) && !$this->mkdir($dir_path)) { return false; }

        return ($this->exists($destination)) ? false : move_uploaded_file($source, ltrim($destination, '/'));
    }

    public function file_get_contents($source)
    {
        return file_get_contents(ltrim($source, '/'));
    }

    private function exists($path)
    {
        return file_exists(ltrim($path, '/'));
    }

    private function is_dir($path)
    {
        return is_dir(ltrim($path, '/'));
    }

    private function mkdir($directory)
    {
        return mkdir(ltrim($directory, '/'), 0775, true);
    }
}
