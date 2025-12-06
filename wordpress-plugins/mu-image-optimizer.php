<?php
/**
 * Plugin Name: Auto Image Optimizer
 * Description: Automatically optimizes uploaded images - resizes, compresses, strips EXIF. No limits, no upsells.
 * Version: 1.0.0
 * Author: Cursed Tours
 * 
 * INSTALLATION:
 * Upload to: wp-content/mu-plugins/mu-image-optimizer.php
 * It activates automatically (mu-plugins = must-use)
 */

if (!defined('ABSPATH')) exit;

class CT_Image_Optimizer {
    
    // Configuration
    private $max_width = 2000;        // Max width in pixels
    private $max_height = 2000;       // Max height in pixels  
    private $jpeg_quality = 82;       // JPEG quality (1-100)
    private $png_compression = 8;     // PNG compression (0-9)
    private $strip_exif = true;       // Remove EXIF/metadata
    private $convert_to_webp = false; // Keep original format for compatibility
    
    public function __construct() {
        // Hook into upload process
        add_filter('wp_handle_upload', [$this, 'optimize_on_upload'], 10, 2);
        
        // Also optimize generated thumbnails
        add_filter('wp_generate_attachment_metadata', [$this, 'optimize_thumbnails'], 10, 2);
        
        // Admin notice to confirm it's working
        add_action('admin_notices', [$this, 'admin_notice']);
    }
    
    /**
     * Optimize image immediately after upload
     */
    public function optimize_on_upload($upload, $context) {
        if (!isset($upload['file']) || !file_exists($upload['file'])) {
            return $upload;
        }
        
        $file = $upload['file'];
        $type = wp_check_filetype($file);
        
        // Only process images
        if (!in_array($type['type'], ['image/jpeg', 'image/png', 'image/gif', 'image/webp'])) {
            return $upload;
        }
        
        $this->optimize_image($file, $type['type']);
        
        // Update file size in upload array
        $upload['size'] = filesize($file);
        
        return $upload;
    }
    
    /**
     * Optimize all generated thumbnail sizes
     */
    public function optimize_thumbnails($metadata, $attachment_id) {
        if (!isset($metadata['sizes']) || empty($metadata['sizes'])) {
            return $metadata;
        }
        
        $upload_dir = wp_upload_dir();
        $base_dir = trailingslashit($upload_dir['basedir']);
        
        // Get the subdirectory from the main file
        $file_dir = '';
        if (isset($metadata['file'])) {
            $file_dir = trailingslashit(dirname($metadata['file']));
        }
        
        foreach ($metadata['sizes'] as $size => $size_data) {
            $file_path = $base_dir . $file_dir . $size_data['file'];
            
            if (file_exists($file_path)) {
                $type = wp_check_filetype($file_path);
                $this->optimize_image($file_path, $type['type']);
                
                // Update filesize in metadata
                $metadata['sizes'][$size]['filesize'] = filesize($file_path);
            }
        }
        
        return $metadata;
    }
    
    /**
     * Core optimization function using GD library
     */
    private function optimize_image($file, $mime_type) {
        // Get original dimensions
        $size = getimagesize($file);
        if (!$size) return false;
        
        $orig_width = $size[0];
        $orig_height = $size[1];
        
        // Calculate new dimensions (maintain aspect ratio)
        $new_width = $orig_width;
        $new_height = $orig_height;
        
        if ($orig_width > $this->max_width || $orig_height > $this->max_height) {
            $ratio = min($this->max_width / $orig_width, $this->max_height / $orig_height);
            $new_width = round($orig_width * $ratio);
            $new_height = round($orig_height * $ratio);
        }
        
        // Load image based on type
        switch ($mime_type) {
            case 'image/jpeg':
                $image = @imagecreatefromjpeg($file);
                break;
            case 'image/png':
                $image = @imagecreatefrompng($file);
                break;
            case 'image/gif':
                $image = @imagecreatefromgif($file);
                break;
            case 'image/webp':
                if (function_exists('imagecreatefromwebp')) {
                    $image = @imagecreatefromwebp($file);
                } else {
                    return false;
                }
                break;
            default:
                return false;
        }
        
        if (!$image) return false;
        
        // Create optimized image
        $optimized = imagecreatetruecolor($new_width, $new_height);
        
        // Preserve transparency for PNG/GIF
        if ($mime_type === 'image/png' || $mime_type === 'image/gif') {
            imagealphablending($optimized, false);
            imagesavealpha($optimized, true);
            $transparent = imagecolorallocatealpha($optimized, 0, 0, 0, 127);
            imagefilledrectangle($optimized, 0, 0, $new_width, $new_height, $transparent);
        }
        
        // Resample (high quality resize)
        imagecopyresampled(
            $optimized, $image,
            0, 0, 0, 0,
            $new_width, $new_height,
            $orig_width, $orig_height
        );
        
        // Save optimized image
        switch ($mime_type) {
            case 'image/jpeg':
                imagejpeg($optimized, $file, $this->jpeg_quality);
                break;
            case 'image/png':
                imagepng($optimized, $file, $this->png_compression);
                break;
            case 'image/gif':
                imagegif($optimized, $file);
                break;
            case 'image/webp':
                if (function_exists('imagewebp')) {
                    imagewebp($optimized, $file, $this->jpeg_quality);
                }
                break;
        }
        
        // Clean up memory
        imagedestroy($image);
        imagedestroy($optimized);
        
        // Strip EXIF data for JPEGs (re-save without EXIF)
        if ($this->strip_exif && $mime_type === 'image/jpeg' && function_exists('exif_read_data')) {
            // Already stripped by re-saving through GD
        }
        
        return true;
    }
    
    /**
     * Admin notice to confirm plugin is active
     */
    public function admin_notice() {
        $screen = get_current_screen();
        if ($screen && $screen->id === 'upload') {
            echo '<div class="notice notice-info is-dismissible">';
            echo '<p><strong>🖼️ Auto Image Optimizer:</strong> Images are automatically optimized on upload ';
            echo '(max ' . $this->max_width . 'x' . $this->max_height . 'px, ' . $this->jpeg_quality . '% JPEG quality)</p>';
            echo '</div>';
        }
    }
}

// Initialize
new CT_Image_Optimizer();
