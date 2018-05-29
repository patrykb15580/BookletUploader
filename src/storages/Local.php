<?php
namespace Booklet\Uploader\Storage;

class Local implements Storage
{
    public function upload($source, $destination)
    {
        if (!rename($source, $destination)) {
            return false;
        }

        chmod($destination, 0644);

        return true;
    }

    public function getFileContents($source)
    {
        return file_get_contents($source);
    }
}
