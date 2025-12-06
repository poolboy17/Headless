<?php
/**
 * One-Time Image Optimizer
 * Upload to root, run in browser, delete when done
 * 
 * Usage: https://wp.cursedtours.com/optimize-images.php
 * Add ?reset=1 to start over
 */

// Security: Add a secret key
$SECRET = 'cursed2024optimize';
if (!isset($_GET['key']) || $_GET['key'] !== $SECRET) {
    die('Add ?key=cursed2024optimize to URL');
}

// Settings
$UPLOADS_DIR = __DIR__ . '/wp-content/uploads';
$BATCH_SIZE = 100;
$MAX_WIDTH = 2000;
$MAX_HEIGHT = 2000;
$JPEG_QUALITY = 82;
$PROGRESS_FILE = $UPLOADS_DIR . '/.optimize_progress.json';

// Increase limits
@set_time_limit(300);
@ini_set('memory_limit', '512M');

// Reset progress if requested
if (isset($_GET['reset'])) {
    @unlink($PROGRESS_FILE);
    echo "Progress reset. <a href='?key=$SECRET'>Start optimization</a>";
    exit;
}

// Load progress
$progress = ['index' => 0, 'processed' => 0, 'saved' => 0];
if (file_exists($PROGRESS_FILE)) {
    $progress = json_decode(file_get_contents($PROGRESS_FILE), true) ?: $progress;
}

// Get all images
$files = [];
$iter = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($UPLOADS_DIR, RecursiveDirectoryIterator::SKIP_DOTS)
);
foreach ($iter as $file) {
    if ($file->isFile() && preg_match('/\.(jpg|jpeg|png)$/i', $file->getFilename())) {
        $files[] = $file->getPathname();
    }
}
sort($files);
$total = count($files);

// HTML output
echo "<!DOCTYPE html><html><head><title>Image Optimizer</title>";
echo "<style>body{font-family:monospace;padding:20px;background:#1a1a1a;color:#fff}";
echo ".progress{background:#333;border-radius:10px;overflow:hidden;margin:20px 0}";
echo ".bar{background:linear-gradient(90deg,#8b5cf6,#6366f1);padding:10px;text-align:center}";
echo ".log{background:#000;padding:15px;border-radius:5px;max-height:400px;overflow-y:auto;margin:20px 0}</style></head><body>";

echo "<h1>🖼️ Image Optimizer</h1>";
echo "<p>Uploads: $UPLOADS_DIR</p>";

// Process batch
$batch_processed = 0;
$batch_saved = 0;

echo "<div class='log'>";

for ($i = $progress['index']; $i < $total && $batch_processed < $BATCH_SIZE; $i++) {
    $path = $files[$i];
    $filename = basename($path);
    $orig_size = filesize($path);
    
    $info = @getimagesize($path);
    if (!$info) {
        echo "⏭️ Skip (not image): $filename<br>";
        $progress['index'] = $i + 1;
        continue;
    }
    
    $w = $info[0];
    $h = $info[1];
    $mime = $info['mime'];
    
    // Calculate new size
    $nw = $w;
    $nh = $h;
    $resized = false;
    
    if ($w > $MAX_WIDTH || $h > $MAX_HEIGHT) {
        $ratio = min($MAX_WIDTH / $w, $MAX_HEIGHT / $h);
        $nw = round($w * $ratio);
        $nh = round($h * $ratio);
        $resized = true;
    }
    
    // Load image
    $img = null;
    if ($mime === 'image/png') {
        $img = @imagecreatefrompng($path);
    } elseif ($mime === 'image/jpeg') {
        $img = @imagecreatefromjpeg($path);
    }
    
    if (!$img) {
        echo "⏭️ Skip (load failed): $filename<br>";
        $progress['index'] = $i + 1;
        continue;
    }
    
    // Create optimized
    $new = imagecreatetruecolor($nw, $nh);
    
    if ($mime === 'image/png') {
        imagealphablending($new, false);
        imagesavealpha($new, true);
        $transparent = imagecolorallocatealpha($new, 0, 0, 0, 127);
        imagefilledrectangle($new, 0, 0, $nw, $nh, $transparent);
    }
    
    imagecopyresampled($new, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
    
    // Save
    if ($mime === 'image/png') {
        imagepng($new, $path, 8);
    } else {
        imagejpeg($new, $path, $JPEG_QUALITY);
    }
    
    imagedestroy($img);
    imagedestroy($new);
    
    // Calculate savings
    clearstatcache(true, $path);
    $new_size = filesize($path);
    $saved = $orig_size - $new_size;
    
    $batch_saved += $saved;
    $batch_processed++;
    $progress['index'] = $i + 1;
    $progress['processed']++;
    $progress['saved'] += $saved;
    
    $saved_kb = round($saved / 1024, 1);
    $resize_info = $resized ? " | Resized: {$w}x{$h} → {$nw}x{$nh}" : "";
    echo "✅ $filename | Saved: {$saved_kb}KB$resize_info<br>";
    
    flush();
}

echo "</div>";

// Save progress
file_put_contents($PROGRESS_FILE, json_encode($progress));

// Stats
$pct = $total > 0 ? round(($progress['index'] / $total) * 100) : 100;
$remaining = $total - $progress['index'];
$total_saved_mb = round($progress['saved'] / 1048576, 1);
$batch_saved_mb = round($batch_saved / 1048576, 1);

echo "<div class='progress'><div class='bar' style='width:{$pct}%'>{$pct}% Complete</div></div>";

echo "<table style='width:100%'>";
echo "<tr><td>📊 This batch:</td><td>$batch_processed images, {$batch_saved_mb} MB saved</td></tr>";
echo "<tr><td>📈 Total progress:</td><td>{$progress['processed']} / $total images</td></tr>";
echo "<tr><td>💾 Total saved:</td><td>{$total_saved_mb} MB</td></tr>";
echo "<tr><td>⏳ Remaining:</td><td>$remaining images</td></tr>";
echo "</table>";

if ($remaining > 0) {
    echo "<br><a href='?key=$SECRET' style='display:inline-block;background:#8b5cf6;color:#fff;padding:15px 30px;border-radius:5px;text-decoration:none;font-weight:bold'>▶️ Continue (Next $BATCH_SIZE)</a>";
    echo "<script>setTimeout(function(){window.location.href='?key=$SECRET'},2000);</script>";
    echo "<p style='color:#888'>Auto-continuing in 2 seconds...</p>";
} else {
    @unlink($PROGRESS_FILE);
    echo "<br><h2 style='color:#22c55e'>✅ COMPLETE!</h2>";
    echo "<p>Total saved: {$total_saved_mb} MB</p>";
    echo "<p style='color:#f00'>⚠️ DELETE THIS FILE NOW: optimize-images.php</p>";
}

echo "</body></html>";
