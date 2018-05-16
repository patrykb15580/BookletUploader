<?php
namespace Booklet\Uploader;

use FilesUntils;
use Config;

class Client
{
    private $storage;

    function __construct($storage = 'local')
    {
        $this->storage = $this->getStorage($storage);
    }

    public function upload($source, $destination)
    {
        return $this->storage->save($source, $destination) ?? false;
    }

    public function file_get_contents($source)
    {
        return $this->storage->file_get_contents($source);
    }

    private function getStorage($type)
    {
        if ($type == 'ftp') {
            return new FTPStorage(
                Config::get('booklet_uploader_ftp_ip'),
                Config::get('booklet_uploader_ftp_login'),
                Config::get('booklet_uploader_ftp_password')
            );
        }

        return new LocalStorage();
    }
}
