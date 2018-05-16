<?php
namespace Booklet\Uploader;

class LocalStorage
{
    public function save($source, $destination)
    {
        return move_uploaded_file($source, $destination);
    }

    public function file_get_contents($source)
    {
        return file_get_contents($source);
    }

    private function exists($path)
    {
        return file_exists($path);
    }

    private function is_dir($path)
    {
        return is_dir($path);
    }

    private function mkdir($directory)
    {
        return mkdir($directory, 0766, true);
    }
}
