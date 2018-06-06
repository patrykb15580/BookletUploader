<?php
namespace Booklet\Uploader;

use Config;
use PathHelper;

trait UploadTrait
{
    public function upload($source_file_path, $params = [])
    {
        $uploader = new Uploader($this, $source_file_path, $params);

        return $uploader->upload();
    }

    public function getFileContents()
    {
        return file_get_contents($this->path());
    }

    public function isImage()
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

    public function editable()
    {
        return in_array($this->type, [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/bmp',
        ]);
    }

    public function preview()
    {
        // Define previews files paths
        // Config::set('booklet_uploader_previews_paths', [
        //     'default' => 'previews_dir/file.svg',
        //     'application/postscript' => 'previews_dir/ai.svg',
        //     'application/illustrator' => 'previews_dir/ai.svg',
        //     'video/x-msvideo' => 'previews_dir/avi.svg',
        //     'image/x-windows-bmp' => 'previews_dir/bmp.svg',
        //     'text/css' => 'previews_dir/css.svg',
        //     'application/msword' => 'previews_dir/doc.svg',
        //     'application/postscript' => 'previews_dir/eps.svg',
        //     'image/gif' => 'previews_dir/gif.svg',
        //     'text/html' => 'previews_dir/html.svg',
        //     'image/pjpeg' => 'previews_dir/jpg.svg',
        //     'text/ecmascript' => 'previews_dir/js.svg',
        //     'x-music/x-midi' => 'previews_dir/midi.svg',
        //     'video/quicktime' => 'previews_dir/mov.svg',
        //     'video/x-mpeg' => 'previews_dir/mp3.svg',
        //     'video/mpeg' => 'previews_dir/mpg.svg',
        //     'application/pdf' => 'previews_dir/pdf.svg',
        //     'image/png' => 'previews_dir/png.svg',
        //     'application/x-mspowerpoint' => 'previews_dir/ppt.svg',
        //     'application/postscript' => 'previews_dir/ps.svg',
        //     'application/octet-stream' => 'previews_dir/psd.svg',
        //     'image/x-tiff' => 'previews_dir/tif.svg',
        //     'text/plain' => 'previews_dir/txt.svg',
        //     'application/x-msexcel' => 'previews_dir/xls.svg',
        //     'text/xml' => 'previews_dir/xml.svg',
        //     'multipart/x-zip' => 'previews_dir/zip.svg',
        // ]);

        if ($this->isImage()) {
            return $this->url();
        }

        $previews = Config::get('booklet_uploader_previews_paths');

        return $previews[$this->type] ?? $previews['default'];
    }

    public function directory()
    {
        return Uploader::FILES_DIRECTORY . $this->idToPath();
    }

    public function path()
    {
        return $this->directory() . '/' . $this->name;
    }

    public function url()
    {
        return \PathHelper::url('file_show', ['hash' => $this->hash_id]);
    }

    private function idToPath()
    {
        $str = str_pad($this->id, 9, '0', STR_PAD_LEFT);

        return chunk_split($str, 3, '/');
    }
}
