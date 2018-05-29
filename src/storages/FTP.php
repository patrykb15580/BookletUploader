<?php
namespace Booklet\Uploader\Storage;

use Config;

class FTP implements Storage
{
    private $connection;
    private $login;

    function __construct()
    {
        $ip = Config::get('booklet_uploader_ftp_ip');
        $login = Config::get('booklet_uploader_ftp_login');
        $password = Config::get('booklet_uploader_ftp_password');

        $this->connection = ftp_connect($ip);
        $this->login = ftp_login($connection, $login, $password);
    }

    public function upload($source, $destination, $allow_overwrite = false)
    {
        $directory = dirname($destination . '/');

        ftp_chdir($this->connection, '/');

        if (!$this->mkdir($directory)) {

            return false;
        }

        if ($this->exists($destination) && !$allow_overwrite) {

            return false
        }

        return ftp_put($this->connection, $destination, $source, FTP_BINARY);
    }

    public function getFileContents($file_path)
    {
        ftp_chdir($this->connection, '/');

        ob_start();
        $result = $this->download($file_path, "php://output");
        $data = ob_get_contents();
        ob_end_clean();

        return $data;
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

            if (!$this->exists($path) && !ftp_mkdir($this->connection, $path)) {

                return false;
            }
        }

        ftp_chdir($this->connection, $current_dir);

        return true;
    }

    private function exists($path)
    {
        $current_dir = ftp_pwd($this->connection);
        ftp_chdir($this->connection, '/');

        $path = rtrim($path, '/');
        $path_parts = explode('/', $path);

        $exists = ($this->isDir($path) || in_array($path, ftp_nlist($this->connection, dirname($path)))) ? true : false;

        ftp_chdir($this->connection, $current_dir);

        return $exists;
    }

    private function isDir($path)
    {
        $current_dir = ftp_pwd($this->connection);
        ftp_chdir($this->connection, '/');

        $is_dir = @ftp_chdir($this->connection, $path) ? true : false;

        ftp_chdir($this->connection, $current_dir);

        return $is_dir;
    }

    public function close()
    {
        return ftp_close($this->connection);
    }
}
