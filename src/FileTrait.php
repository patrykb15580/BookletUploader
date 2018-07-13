<?php
namespace Booklet\Uploader;

use Config;
use PathHelper;
use Booklet\Uploader\Image\Image as Image;
use Booklet\Uploader\Image\ImageUtils as ImageUtils;

trait FileTrait
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
            'image/tiff',
            'image/bmp',
        ]);
    }

    public function imageInfo()
    {
        list($original_width, $original_height) = getimagesize($this->path());

        $directory = Image::TRANSFORMED_FILES_DIR;
        $sig = ImageUtils::sig($this->hash_id, $this->modifiers);

        $file = glob($directory . $sig . '.*')[0] ?? null;

        if (!$file) {
            $image = new Image($this->hash_id, $this->path(), $this->modifiers);
            $image->transform();

            $file = glob($directory . $sig . '.*')[0];
        }

        list($width, $height) = getimagesize($file);

        return [
            'original_width' => $original_width,
            'original_height' => $original_height,
            'width' => $width,
            'height' => $height
        ];
    }

    public function info()
    {
        return [
            'hash' => $this->hash_id,
            'name' => $this->name,
            'type' => $this->type,
            'size' => $this->size,
            'source' => $this->source,
            'modifiers' => $this->modifiers,
            'preview' => $this->preview(),
            'url' => $this->url(),
            'original_url' => $this->originalUrl(),
            'is_image' => $this->isImage(),
            'image_info' => $this->imageInfo(),
        ];
    }

    public function isStored()
    {
        return ($this->stored_at && !$this->isDeleted()) ? true : false;
    }

    public function isDeleted()
    {
        return ($this->deleted_at) ? true : false;
    }

    public function transformedFileSignture($modifiers = '')
    {
        return md5($this->hash_id . $modifiers);
    }

    public function preview()
    {
        if ($this->isImage()) {
            $transformations = $this->transformations();
            $transformations['preview'] = ['120x120'];

            return $this->transformUrl($transformations);
        }

        $previews = Config::get('booklet_uploader_previews_paths');

        return $previews[$this->type] ?? $previews['default'];
    }

    public function transformations()
    {
        $transformations = [];

        if ($this->editable()) {
            $modifiers = ltrim($this->modifiers, '-/');
            $modifiers = explode('-/', $modifiers);

            foreach ($modifiers as $modifier) {
                if (empty($modifier)) {
                    continue;
                }

                $modifier = rtrim($modifier, '/');
                $modifier_parts = explode('/', $modifier);

                $transformation = $modifier_parts[0];
                $params = array_shift($modifier_parts);

                $transformations[$transformation] = $params;
            }
        }

        return $transformations;
    }

    public static function listTransformationsFromModifiers($modifiers)
    {
        $modifiers = ltrim($modifiers, '-/');

        $transformations = [];
        foreach (explode('-/', $modifiers) as $modifier) {
            $modifier = rtrim($modifier, '/');
            $params = explode('/', $modifier);

            $name = $params[0];
            unset($params[0]);

            $transformations[$name] = (empty($params)) ? true : array_values($params);
        }

        return $transformations;
    }

    public function hasTransformation($transformation_name)
    {
        if (!$this->editable() || !$this->modifiers) {
            return false;
        }

        foreach ($this->transformations() as $name => $params) {
            if ($name == $transformation_name) {
                return true;
            }
        }

        return false;
    }

    public function transform(array $transformations = [])
    {
        $modifiers = [];

        if ($this->editable()) {
            foreach ($transformations as $transformation => $params) {
                $modifier_parts = [$transformation];

                if (is_array($params) && !empty($params)) {
                    $modifier_parts = array_merge($modifier_parts, $params);
                }

                $modifiers[] = join('/', $modifier_parts) . '/';
            }

            if (!empty($modifiers[0])) {
                array_unshift($modifiers, '');
            }
        }

        return join('-/', $modifiers);
    }

    public function modifiersToTransformationsArray($modifiers = '')
    {
        $modifiers = ltrim($modifiers, '-/');

        $transformations = [];
        foreach (explode('-/', $modifiers) as $modifier) {
            $modifier = rtrim($modifier, '/');
            $modifier_parts = explode('/', $modifier);

            $transformation = $modifier_parts[0];
            $params = array_shift($modifier_parts);

            $transformations[$transformation] = $params;
        }

        return $transformations;
    }

    public function transformUrl($transformations = [])
    {
        if (empty($transformations)) {
            return $this->originalUrl();
        }

        $modifiers = $this->transform($transformations);

        return \PathHelper::url('file_show', ['hash' => $this->hash_id, 'modifiers' => $modifiers]);
    }

    public function directory()
    {
        return Uploader::FILES_DIRECTORY . $this->idToPath();
    }

    public function path()
    {
        return $this->directory() . $this->name;
    }

    public function originalUrl()
    {
        return \PathHelper::url('file_show', ['hash' => $this->hash_id, 'modifiers' => '']);
    }

    public function url()
    {
        return \PathHelper::url('file_show', ['hash' => $this->hash_id, 'modifiers' => $this->modifiers ?? '']);
    }

    private function idToPath()
    {
        $str = str_pad($this->id, 9, '0', STR_PAD_LEFT);

        return chunk_split($str, 3, '/');
    }
}


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
