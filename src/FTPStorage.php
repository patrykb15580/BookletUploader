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

        if (!$this->exists($directory) && !$this->mkdir($directory)) { return false; }

        $success = ftp_put($this->connection, $destination, $source, FTP_BINARY);

        ftp_close($this->connection);

        return $success;
    }

    public function download($source, $destination)
    {
        ftp_chdir($this->connection, '/');

        $file = ftp_get($this->connection, $destination , $source, FTP_BINARY);

        ftp_close($this->connection);

        return $file;
    }

    public function file_get_contents($source)
    {
        ftp_chdir($this->connection, '/');

        ob_start();
        $result = ftp_get($this->connection, "php://output", $source, FTP_BINARY);
        $data = ob_get_contents();
        ob_end_clean();

        ftp_close($this->connection);

        return $data;
    }

    private function exists($path)
    {
        $current_dir = ftp_pwd($this->connection);
        ftp_chdir($this->connection, '/');

        $path = rtrim($path, '/');
        $path_parts = explode('/', $path);

        if ($this->is_dir($path)) {
            if (!@ftp_chdir($this->connection, $path)) {
                return false;
            }
        } else {
            if (!in_array($path, ftp_nlist($this->connection, dirname($path)))) {
                return false;
            }
        }

        ftp_chdir($this->connection, $current_dir);

        return true;
    }

    public function file_exists($file_path)
    {
        if ($this->is_dir($file_path)) {
            if (!@ftp_chdir($file_path)) {
                return false;
            }

            return true;
        } else {
            return in_array($file_path, ftp_nlist($this->connection, dirname($file_path)));
        }
    }

    private function is_dir($dir)
    {
        $current_dir = ftp_pwd($this->connection);
        ftp_chdir($this->connection, '/');

        if (!@ftp_chdir($this->connection, $dir)) {

            return false;
        }

        ftp_chdir($this->connection, $current_dir);

        return true;
    }

    private function mkdir($directory)
    {
        $current_dir = ftp_pwd($this->connection);
        ftp_chdir($this->connection, '/');

        $directory = ltrim($directory, '/');
        $directory = rtrim($directory, '/');

        $path = '';
        foreach (explode('/', $directory) as $name) {
            $path .= '/' . $name;

            if (!$this->exists($path) && !ftp_mkdir($this->connection, $name)) {
                ftp_chdir($this->connection, $current_dir);

                return false;
            }

            ftp_chdir($this->connection, $name);
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
