<?php
namespace Booklet\Uploader;

use Config;

trait UploadTrait
{
    function upload($source, $params = [])
    {
        $uploader = new Uploader($this, $source, $params);

        if ($uploader->upload()) {
            $this->update(['stored_at' => date(Config::get('mysqltime'))]);

            return true;
        }

        return false;
    }
}
