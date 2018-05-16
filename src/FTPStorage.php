<?php
namespace Booklet\Uploader;

class FTPStorage
{
    private $connection;
    private $login;

    function __construct($ip, $login, $password)
    {
        $this->connection = ftp_connect($ip);
        $this->login = ftp_login($this->connection, $login, $password);
    }

    public function save($source, $destination)
    {
        $directory = dirname($destination . '/');

        ftp_chdir($this->connection, '/');

        if (!$this->dir_exists($directory) && !$this->mkdir($directory)) { return false; }

        $success = ftp_put($this->connection, $destination, $source, FTP_BINARY);

        ftp_close($this->connection);

        return $success;
    }

    private function mkdir($directory)
    {
        $current_dir = ftp_pwd($this->connection);
        ftp_chdir($this->connection, '/');

        $directory = ltrim($directory, '/');
        $directory = rtrim($directory, '/');

        $current_path = '/';
        foreach (explode('/', $directory) as $dir_name) {
            if ($this->dir_exists($dir_name) || ftp_mkdir($this->connection, $dir_name)) {
                ftp_chdir($this->connection, $dir_name);
            } else {
                return false;
            }
        }

        ftp_chdir($this->connection, $current_dir);

        return true;
    }

    private function dir_exists($path)
    {
        $current_dir = ftp_pwd($this->connection);
        $exists = (@ftp_chdir($this->connection, $path)) ? true : false;

        ftp_chdir($this->connection, $current_dir);

        return $exists;
    }
}
