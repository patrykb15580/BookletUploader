<?php
namespace Booklet\Uploader;

class FTPStorage
{
    private $connection;
    private $login;

    function __construct($ip, $login, $password)
    {
        $this->connection = ftp_connect($ip, $login, $password);
        $this->login = ftp_login($this->connection, $login, $password);
    }

    public function save($source, $destination)
    {
        $directory = dirname($destination . '/');

        if (!@ftp_chdir($directory) && !$this->mkdir($directory)) { return false; }

        ftp_chdir($this->connection, '/');

        $success = ftp_put($this->connection, $destination, $source, FTP_BINARY);

        ftp_close($this->connection);

        return $success;
    }

    private function mkdir($directory)
    {
        ftp_chdir($this->connection, '/');

        foreach (explode('/', $directory) as $part) {
            if (!@ftp_chdir($this->connection, $part)) {
                ftp_mkdir($this->connection, $part);
                ftp_chdir($this->connection, $part);
            }
        }

        ftp_chdir($this->connection, '/');

        return true;
    }
}
