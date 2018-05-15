<?php
namespace Booklet\Uploader;

use FilesUntils;
use Config;

class Uploader
{
    private $source;
    private $destination;
    private $storage;
    private $destination;


    function __construct($source, $destination, $storage)
    {
        $this->source = $source;
        $this->destination = $destination;
        $this->storage = $storage;
    }

    public function upload()
    {
        $storage = $this->getStorage();

        return $storage->save($this->source, $this->destination);
    }

    private function getStorage()
    {
        return new FTPStorage(Config::get('booklet_uploader_ftp_ip'), Config::get('booklet_uploader_ftp_login'), Config::get('booklet_uploader_ftp_password'));
    }
}
