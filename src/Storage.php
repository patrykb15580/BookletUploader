<?php
namespace Booklet\Uploader\Storage;

interface Storage
{
    // Save file in storage
    public function upload($source, $destination, $allow_overwrite = false);

    // Get uploaded file contents
    public function getFileContents($source);
}
