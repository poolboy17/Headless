#!/bin/bash
# =============================================================================
# Batch Image Optimizer for WordPress
# Optimizes all existing images in wp-content/uploads/
# 
# REQUIREMENTS:
# - ImageMagick (convert, mogrify commands)
# - jpegoptim (for JPEG optimization)
# - optipng (for PNG optimization)
# - cwebp (optional, for WebP generation)
#
# INSTALLATION (Ubuntu/Debian):
# sudo apt-get install imagemagick jpegoptim optipng webp
#
# USAGE:
# 1. Upload this script to your server
# 2. chmod +x batch-optimize-images.sh
# 3. ./batch-optimize-images.sh /path/to/wp-content/uploads
#
# =============================================================================

set -e

# Configuration
MAX_WIDTH=2000
MAX_HEIGHT=2000
JPEG_QUALITY=82
PNG_COMPRESSION="-o5"  # optipng level 0-7
BACKUP=false           # Set to true to keep originals as .bak
DRY_RUN=false          # Set to true to preview without changes
GENERATE_WEBP=false    # Set to true to create .webp versions

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_FILES=0
PROCESSED=0
SKIPPED=0
ERRORS=0
BYTES_SAVED=0

# Check dependencies
check_dependencies() {
    local missing=()
    
    command -v convert >/dev/null 2>&1 || missing+=("imagemagick")
    command -v jpegoptim >/dev/null 2>&1 || missing+=("jpegoptim")
    command -v optipng >/dev/null 2>&1 || missing+=("optipng")
    
    if [ ${#missing[@]} -gt 0 ]; then
        echo -e "${RED}Missing dependencies: ${missing[*]}${NC}"
        echo "Install with: sudo apt-get install ${missing[*]}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All dependencies found${NC}"
}

# Get human readable file size
human_size() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$((bytes / 1024))KB"
    else
        echo "$((bytes / 1048576))MB"
    fi
}

# Optimize a single JPEG file
optimize_jpeg() {
    local file="$1"
    local orig_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
    
    # Resize if too large
    local dimensions=$(identify -format "%wx%h" "$file" 2>/dev/null)
    local width=$(echo $dimensions | cut -d'x' -f1)
    local height=$(echo $dimensions | cut -d'x' -f2)
    
    if [ "$width" -gt "$MAX_WIDTH" ] || [ "$height" -gt "$MAX_HEIGHT" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "  ${YELLOW}[DRY RUN]${NC} Would resize: ${width}x${height} -> max ${MAX_WIDTH}x${MAX_HEIGHT}"
        else
            convert "$file" -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" -quality $JPEG_QUALITY "$file"
        fi
    fi
    
    # Optimize with jpegoptim
    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${YELLOW}[DRY RUN]${NC} Would optimize JPEG"
    else
        jpegoptim --strip-all --max=$JPEG_QUALITY -q "$file"
    fi
    
    local new_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
    local saved=$((orig_size - new_size))
    
    if [ $saved -gt 0 ]; then
        BYTES_SAVED=$((BYTES_SAVED + saved))
        echo -e "  ${GREEN}✓${NC} Saved $(human_size $saved) ($(human_size $orig_size) → $(human_size $new_size))"
    else
        echo -e "  ${BLUE}○${NC} Already optimized"
    fi
}

# Optimize a single PNG file
optimize_png() {
    local file="$1"
    local orig_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
    
    # Resize if too large
    local dimensions=$(identify -format "%wx%h" "$file" 2>/dev/null)
    local width=$(echo $dimensions | cut -d'x' -f1)
    local height=$(echo $dimensions | cut -d'x' -f2)
    
    if [ "$width" -gt "$MAX_WIDTH" ] || [ "$height" -gt "$MAX_HEIGHT" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "  ${YELLOW}[DRY RUN]${NC} Would resize: ${width}x${height}"
        else
            convert "$file" -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" "$file"
        fi
    fi
    
    # Optimize with optipng
    if [ "$DRY_RUN" = true ]; then
        echo -e "  ${YELLOW}[DRY RUN]${NC} Would optimize PNG"
    else
        optipng $PNG_COMPRESSION -quiet "$file"
    fi
    
    local new_size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
    local saved=$((orig_size - new_size))
    
    if [ $saved -gt 0 ]; then
        BYTES_SAVED=$((BYTES_SAVED + saved))
        echo -e "  ${GREEN}✓${NC} Saved $(human_size $saved)"
    else
        echo -e "  ${BLUE}○${NC} Already optimized"
    fi
}

# Generate WebP version
generate_webp() {
    local file="$1"
    local webp_file="${file%.*}.webp"
    
    if [ -f "$webp_file" ]; then
        echo -e "  ${BLUE}○${NC} WebP already exists"
        return
    fi
    
    if command -v cwebp >/dev/null 2>&1; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "  ${YELLOW}[DRY RUN]${NC} Would create WebP"
        else
            cwebp -q 80 -quiet "$file" -o "$webp_file"
            echo -e "  ${GREEN}✓${NC} Created WebP version"
        fi
    fi
}

# Process a single file
process_file() {
    local file="$1"
    local ext="${file##*.}"
    ext=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
    
    TOTAL_FILES=$((TOTAL_FILES + 1))
    
    echo -e "\n${BLUE}[$TOTAL_FILES]${NC} Processing: $(basename "$file")"
    
    # Backup if enabled
    if [ "$BACKUP" = true ] && [ "$DRY_RUN" = false ]; then
        cp "$file" "${file}.bak"
    fi
    
    case "$ext" in
        jpg|jpeg)
            optimize_jpeg "$file"
            [ "$GENERATE_WEBP" = true ] && generate_webp "$file"
            PROCESSED=$((PROCESSED + 1))
            ;;
        png)
            optimize_png "$file"
            [ "$GENERATE_WEBP" = true ] && generate_webp "$file"
            PROCESSED=$((PROCESSED + 1))
            ;;
        gif|webp)
            echo -e "  ${YELLOW}⊘${NC} Skipped (format not optimized)"
            SKIPPED=$((SKIPPED + 1))
            ;;
        *)
            SKIPPED=$((SKIPPED + 1))
            ;;
    esac
}

# Main function
main() {
    local upload_dir="$1"
    
    if [ -z "$upload_dir" ]; then
        echo "Usage: $0 /path/to/wp-content/uploads"
        echo ""
        echo "Options (edit script to change):"
        echo "  MAX_WIDTH=$MAX_WIDTH"
        echo "  MAX_HEIGHT=$MAX_HEIGHT"
        echo "  JPEG_QUALITY=$JPEG_QUALITY"
        echo "  DRY_RUN=$DRY_RUN"
        echo "  BACKUP=$BACKUP"
        exit 1
    fi
    
    if [ ! -d "$upload_dir" ]; then
        echo -e "${RED}Error: Directory not found: $upload_dir${NC}"
        exit 1
    fi
    
    echo "============================================="
    echo "  WordPress Image Batch Optimizer"
    echo "============================================="
    echo "Directory: $upload_dir"
    echo "Max size: ${MAX_WIDTH}x${MAX_HEIGHT}px"
    echo "JPEG quality: $JPEG_QUALITY%"
    echo "Dry run: $DRY_RUN"
    echo "Backup: $BACKUP"
    echo "============================================="
    
    check_dependencies
    
    echo -e "\n${YELLOW}Scanning for images...${NC}"
    
    # Find and process all images
    find "$upload_dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r file; do
        process_file "$file"
    done
    
    echo ""
    echo "============================================="
    echo "  OPTIMIZATION COMPLETE"
    echo "============================================="
    echo "Total files scanned: $TOTAL_FILES"
    echo "Processed: $PROCESSED"
    echo "Skipped: $SKIPPED"
    echo "Errors: $ERRORS"
    echo -e "Total saved: ${GREEN}$(human_size $BYTES_SAVED)${NC}"
    echo "============================================="
}

# Run
main "$@"
