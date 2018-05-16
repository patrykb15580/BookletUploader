<?php
namespace Booklet\Uploader;

use FilesUntils;
use Config;

class Uploader
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

    private function getStorage($type)
    {
        return new FTPStorage(Config::get('booklet_uploader_ftp_ip'), Config::get('booklet_uploader_ftp_login'), Config::get('booklet_uploader_ftp_password'));
    }
}
