<?php
/**
 * Batch Image Optimizer - PHP Version
 * For hosts without shell access or Windows servers
 * 
 * USAGE OPTIONS:
 * 
 * 1. WP-CLI (recommended):
 *    wp eval-file batch-optimize-images.php
 * 
 * 2. Browser (add to theme temporarily):
 *    Add to functions.php: include_once('path/to/batch-optimize-images.php');
 *    Visit: yoursite.com/?run_image_optimizer=1&secret=YOUR_SECRET_KEY
 * 
 * 3. Direct execution (if PHP CLI available):
 *    php batch-optimize-images.php /path/to/wp-content/uploads
 */

// Configuration
define('CT_MAX_WIDTH', 2000);
define('CT_MAX_HEIGHT', 2000);
define('CT_JPEG_QUALITY', 82);
define('CT_PNG_COMPRESSION', 8);
define('CT_BATCH_SIZE', 50);        // Process N images per run (prevents timeout)
define('CT_SECRET_KEY', 'change_this_secret_key_123');  // For browser access

class CT_Batch_Optimizer {
    
    private $processed = 0;
    private $skipped = 0;
    private $errors = 0;
    private $bytes_saved = 0;
    private $log = [];
    
    /**
     * Run the optimizer
     */
    public function run($directory = null, $limit = CT_BATCH_SIZE) {
        // Determine uploads directory
        if (!$directory) {
            if (function_exists('wp_upload_dir')) {
                $upload = wp_upload_dir();
                $directory = $upload['basedir'];
            } else {
                $this->log("Error: No directory specified and WordPress not loaded");
                return false;
            }
        }
        
        if (!is_dir($directory)) {
            $this->log("Error: Directory not found: $directory");
            return false;
        }
        
        // Check GD library
        if (!extension_loaded('gd')) {
            $this->log("Error: GD library not available");
            return false;
        }
        
        $this->log("===========================================");
        $this->log("Batch Image Optimizer - PHP Version");
        $this->log("===========================================");
        $this->log("Directory: $directory");
        $this->log("Max size: " . CT_MAX_WIDTH . "x" . CT_MAX_HEIGHT . "px");
        $this->log("JPEG quality: " . CT_JPEG_QUALITY . "%");
        $this->log("Batch limit: $limit images");
        $this->log("===========================================");
        
        // Get progress file (to resume from last position)
        $progress_file = $directory . '/.optimizer_progress';
        $last_processed = file_exists($progress_file) ? file_get_contents($progress_file) : '';
        
        // Find all images
        $images = $this->find_images($directory);
        $total = count($images);
        $this->log("Found $total images total");
        
        // Skip already processed (for resuming)
        $start_processing = empty($last_processed);
        $count = 0;
        
        foreach ($images as $image) {
            if (!$start_processing) {
                if ($image === $last_processed) {
                    $start_processing = true;
                }
                continue;
            }
            
            if ($count >= $limit) {
                file_put_contents($progress_file, $image);
                $this->log("\n⏸️  Batch limit reached. Run again to continue.");
                break;
            }
            
            $this->optimize_image($image);
            $count++;
        }
        
        // If we processed all images, remove progress file
        if ($count < $limit) {
            @unlink($progress_file);
            $this->log("\n✅ All images processed!");
        }
        
        $this->log("\n===========================================");
        $this->log("RESULTS");
        $this->log("===========================================");
        $this->log("Processed: " . $this->processed);
        $this->log("Skipped: " . $this->skipped);
        $this->log("Errors: " . $this->errors);
        $this->log("Bytes saved: " . $this->human_size($this->bytes_saved));
        
        return $this->log;
    }
    
    /**
     * Find all image files recursively
     */
    private function find_images($directory) {
        $images = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, RecursiveDirectoryIterator::SKIP_DOTS)
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $ext = strtolower($file->getExtension());
                if (in_array($ext, ['jpg', 'jpeg', 'png'])) {
                    $images[] = $file->getPathname();
                }
            }
        }
        
        sort($images); // Consistent ordering for resume
        return $images;
    }
    
    /**
     * Optimize a single image
     */
    private function optimize_image($file) {
        $this->log("\nProcessing: " . basename($file));
        
        $orig_size = filesize($file);
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        
        // Get dimensions
        $size = @getimagesize($file);
        if (!$size) {
            $this->log("  ❌ Could not read image");
            $this->errors++;
            return false;
        }
        
        $orig_width = $size[0];
        $orig_height = $size[1];
        
        // Calculate new dimensions
        $new_width = $orig_width;
        $new_height = $orig_height;
        $needs_resize = false;
        
        if ($orig_width > CT_MAX_WIDTH || $orig_height > CT_MAX_HEIGHT) {
            $ratio = min(CT_MAX_WIDTH / $orig_width, CT_MAX_HEIGHT / $orig_height);
            $new_width = round($orig_width * $ratio);
            $new_height = round($orig_height * $ratio);
            $needs_resize = true;
            $this->log("  📐 Resizing: {$orig_width}x{$orig_height} → {$new_width}x{$new_height}");
        }
        
        // Load image
        switch ($ext) {
            case 'jpg':
            case 'jpeg':
                $image = @imagecreatefromjpeg($file);
                break;
            case 'png':
                $image = @imagecreatefrompng($file);
                break;
            default:
                $this->skipped++;
                return false;
        }
        
        if (!$image) {
            $this->log("  ❌ Failed to load image");
            $this->errors++;
            return false;
        }
        
        // Create optimized version
        $optimized = imagecreatetruecolor($new_width, $new_height);
        
        // Handle transparency for PNG
        if ($ext === 'png') {
            imagealphablending($optimized, false);
            imagesavealpha($optimized, true);
            $transparent = imagecolorallocatealpha($optimized, 0, 0, 0, 127);
            imagefilledrectangle($optimized, 0, 0, $new_width, $new_height, $transparent);
        }
        
        // Resample
        imagecopyresampled(
            $optimized, $image,
            0, 0, 0, 0,
            $new_width, $new_height,
            $orig_width, $orig_height
        );
        
        // Save
        switch ($ext) {
            case 'jpg':
            case 'jpeg':
                imagejpeg($optimized, $file, CT_JPEG_QUALITY);
                break;
            case 'png':
                imagepng($optimized, $file, CT_PNG_COMPRESSION);
                break;
        }
        
        // Cleanup
        imagedestroy($image);
        imagedestroy($optimized);
        
        // Calculate savings
        clearstatcache(true, $file);
        $new_size = filesize($file);
        $saved = $orig_size - $new_size;
        
        if ($saved > 0) {
            $this->bytes_saved += $saved;
            $this->log("  ✅ Saved " . $this->human_size($saved) . 
                      " (" . $this->human_size($orig_size) . " → " . $this->human_size($new_size) . ")");
        } else {
            $this->log("  ○ Already optimized");
        }
        
        $this->processed++;
        return true;
    }
    
    /**
     * Convert bytes to human readable
     */
    private function human_size($bytes) {
        if ($bytes < 1024) return $bytes . 'B';
        if ($bytes < 1048576) return round($bytes / 1024, 1) . 'KB';
        return round($bytes / 1048576, 2) . 'MB';
    }
    
    /**
     * Log message
     */
    private function log($message) {
        $this->log[] = $message;
        
        // Output immediately if CLI
        if (php_sapi_name() === 'cli') {
            echo $message . "\n";
        }
    }
    
    /**
     * Get log array
     */
    public function get_log() {
        return $this->log;
    }
}

// =============================================================================
// AUTO-EXECUTION HANDLERS
// =============================================================================

// CLI execution
if (php_sapi_name() === 'cli') {
    $directory = isset($argv[1]) ? $argv[1] : null;
    $limit = isset($argv[2]) ? (int)$argv[2] : CT_BATCH_SIZE;
    
    $optimizer = new CT_Batch_Optimizer();
    $optimizer->run($directory, $limit);
    exit;
}

// WordPress browser execution (with secret key protection)
if (isset($_GET['run_image_optimizer']) && isset($_GET['secret'])) {
    if ($_GET['secret'] !== CT_SECRET_KEY) {
        die('Invalid secret key');
    }
    
    // Increase limits for long operation
    @set_time_limit(300);
    @ini_set('memory_limit', '512M');
    
    header('Content-Type: text/plain');
    
    $optimizer = new CT_Batch_Optimizer();
    $log = $optimizer->run(null, CT_BATCH_SIZE);
    
    echo implode("\n", $log);
    exit;
}

// WP-CLI execution
if (defined('WP_CLI') && WP_CLI) {
    $optimizer = new CT_Batch_Optimizer();
    $optimizer->run();
}
