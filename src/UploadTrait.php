<?php
namespace Booklet\Uploader;

use Config;
use PathHelper;

trait UploadTrait
{
    public function upload($source, $params = [])
    {
        $uploader = new Uploader($this, $source, $params);

        if ($uploader->upload()) {
            $this->update(['stored_at' => date(Config::get('mysqltime'))]);

            return true;
        }

        return false;
    }

    public function getFileContents()
    {
        $storage = $this->storage();
        $file_path = $this->originalPath();

        $contents = $storage->getFileContents($file_path);

        if (get_class($storage) == 'Booklet\Uploader\Storage\FTP') {
            $storage->close();
        }

        return $contents;
    }

    private function storage()
    {
        if (empty($this->storage)) {
            throw new \Exception('Storage is not set');
        }

        return Uploader::getStorage($this->storage);
    }

    public function isImage()
    {
        return in_array($this->type, [
            'image/gif',
            'image/jpeg',
            'image/png',
            'application/x-shockwave-flash',
            'image/psd',
            'image/bmp',
            'image/tiff',
            'image/tiff',
            'application/octet-stream',
            'image/jp2',
            'application/octet-stream',
            'application/octet-stream',
            'application/x-shockwave-flash',
            'image/iff',
            'image/vnd.wap.wbmp',
            'image/xbm',
            'image/vnd.microsoft.icon',
            'image/webp',
        ]);
    }

    public function isEditable()
    {
        return in_array($this->type, [
            'image/jpeg',
            'image/png',
            'image/svg+xml',
            'image/gif',
            'image/tiff',
            'image/bmp',
        ]);
    }

    public function preview()
    {
        return ($this->isImage()) ? $this->originalUrl() : null;
    }

    public function originalDirectory()
    {
        return Config::get('booklet_uploader_original_files_directory') . $this->idToPath();
    }

    public function originalPath()
    {
        return $this->originalDirectory() . $this->name;
    }

    public function originalUrl()
    {
        return \PathHelper::getUrl('file_show', ['hash' => $this->hash_id]);
    }

    public function directory()
    {
        if ($this->isImage()) {
            return Config::get('booklet_uploader_files_directory') . $this->idToPath();
        }

        return $this->originalDirectory();
    }

    public function path()
    {
        return $this->directory() . $this->name;
    }

    public function url()
    {
        return \PathHelper::getUrl('file_show', ['hash' => $this->hash_id]);
    }

    private function idToPath()
    {
        $str = str_pad($this->id, 9, '0', STR_PAD_LEFT);

        return chunk_split($str, 3, '/');
    }
}
