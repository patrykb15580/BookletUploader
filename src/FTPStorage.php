<?php
namespace Booklet\Uploader;

use Config;

class FTPStorage
{
    private $connection;
    private $login;

    private function connection()
    {
        $connection = ftp_connect(Config::get('booklet_uploader_ftp_ip'));
        $login = ftp_login($connection, Config::get('booklet_uploader_ftp_login'), Config::get('booklet_uploader_ftp_password'));

        return ($login) ? $connection : false;
    }

    public function save($source, $destination, $overwrite = false)
    {
        $connection = $this->connection();
        $directory = dirname($destination . '/');

        ftp_chdir($connection, '/');

        if (!$this->exists($directory) && !$this->mkdir($directory)) { return false; }

        $success = ($this->exists($destination) && !$overwrite) ? false : ftp_put($connection, $destination, $source, FTP_BINARY);

        ftp_close($connection);

        return $success;
    }

    public function file_get_contents($source)
    {
        $connection = $this->connection();

        ftp_chdir($connection, '/');

        ob_start();
        $result = ftp_get($connection, "php://output", $source, FTP_BINARY);
        $data = ob_get_contents();
        ob_end_clean();

        ftp_close($connection);

        return $data;
    }

    public function exists($path)
    {
        $connection = $this->connection();

        $current_dir = ftp_pwd($connection);
        ftp_chdir($connection, '/');

        $path = rtrim($path, '/');
        $path_parts = explode('/', $path);

        if ($this->is_dir($path)) {
            if (!@ftp_chdir($connection, $path)) {
                return false;
            }
        } else {
            if (!in_array($path, ftp_nlist($connection, dirname($path)))) {
                return false;
            }
        }

        ftp_chdir($connection, $current_dir);
        ftp_close($connection);

        return true;
    }

    private function is_dir($path)
    {
        $connection = $this->connection();

        $current_dir = ftp_pwd($connection);
        ftp_chdir($connection, '/');

        if (!@ftp_chdir($connection, $path)) {

            return false;
        }

        ftp_chdir($connection, $current_dir);
        ftp_close($connection);

        return true;
    }

    private function mkdir($directory)
    {
        $connection = $this->connection();

        $current_dir = ftp_pwd($connection);
        ftp_chdir($connection, '/');

        $directory = ltrim($directory, '/');
        $directory = rtrim($directory, '/');

        $path = '';
        foreach (explode('/', $directory) as $name) {
            $path .= '/' . $name;

            if (!$this->exists($path) && !ftp_mkdir($connection, $path)) {

                return false;
            }
        }

        ftp_chdir($connection, $current_dir);
        ftp_close($connection);

        return true;
    }
}
