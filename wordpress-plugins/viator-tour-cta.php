<?php
/**
 * Plugin Name: Viator Tour CTA
 * Description: Adds Viator affiliate tour links to posts
 * Version: 1.0.0
 * Author: Cursed Tours
 */

if (!defined('ABSPATH')) exit;

/**
 * Register the viator_tour meta field for REST API exposure
 */
function viator_cta_register_meta() {
    register_post_meta('post', 'viator_tour', [
        'type' => 'object',
        'single' => true,
        'show_in_rest' => [
            'schema' => [
                'type' => 'object',
                'properties' => [
                    'productCode' => ['type' => 'string'],
                    'title' => ['type' => 'string'],
                    'url' => ['type' => 'string'],
                    'price' => ['type' => 'string'],
                    'rating' => ['type' => 'number'],
                    'reviewCount' => ['type' => 'integer'],
                    'thumbnailUrl' => ['type' => 'string'],
                    'destination' => ['type' => 'string'],
                ],
            ],
        ],
        'auth_callback' => function() {
            return current_user_can('edit_posts');
        },
    ]);
}
add_action('init', 'viator_cta_register_meta');

/**
 * Add meta box for manual editing in admin
 */
function viator_cta_add_meta_box() {
    add_meta_box(
        'viator_tour_meta_box',
        '🔮 Viator Tour CTA',
        'viator_cta_render_meta_box',
        'post',
        'side',
        'default'
    );
}
add_action('add_meta_boxes', 'viator_cta_add_meta_box');

/**
 * Render the meta box
 */
function viator_cta_render_meta_box($post) {
    $viator_tour = get_post_meta($post->ID, 'viator_tour', true);
    wp_nonce_field('viator_cta_nonce', 'viator_cta_nonce_field');
    
    $productCode = $viator_tour['productCode'] ?? '';
    $title = $viator_tour['title'] ?? '';
    $url = $viator_tour['url'] ?? '';
    $price = $viator_tour['price'] ?? '';
    $rating = $viator_tour['rating'] ?? '';
    $reviewCount = $viator_tour['reviewCount'] ?? '';
    $destination = $viator_tour['destination'] ?? '';
    ?>
    <p>
        <label><strong>Product Code:</strong></label><br>
        <input type="text" name="viator_productCode" value="<?php echo esc_attr($productCode); ?>" style="width:100%">
    </p>
    <p>
        <label><strong>Tour Title:</strong></label><br>
        <input type="text" name="viator_title" value="<?php echo esc_attr($title); ?>" style="width:100%">
    </p>
    <p>
        <label><strong>Affiliate URL:</strong></label><br>
        <input type="url" name="viator_url" value="<?php echo esc_attr($url); ?>" style="width:100%">
    </p>
    <p>
        <label><strong>Price (e.g., $29.00):</strong></label><br>
        <input type="text" name="viator_price" value="<?php echo esc_attr($price); ?>" style="width:100%">
    </p>
    <p>
        <label><strong>Rating (0-5):</strong></label><br>
        <input type="number" step="0.1" min="0" max="5" name="viator_rating" value="<?php echo esc_attr($rating); ?>" style="width:100%">
    </p>
    <p>
        <label><strong>Review Count:</strong></label><br>
        <input type="number" min="0" name="viator_reviewCount" value="<?php echo esc_attr($reviewCount); ?>" style="width:100%">
    </p>
    <p>
        <label><strong>Destination:</strong></label><br>
        <input type="text" name="viator_destination" value="<?php echo esc_attr($destination); ?>" style="width:100%">
    </p>
    <?php if ($url): ?>
    <p style="background:#f0f0f0;padding:8px;border-radius:4px;">
        <strong>Preview:</strong><br>
        <a href="<?php echo esc_url($url); ?>" target="_blank"><?php echo esc_html($title ?: 'View Tour'); ?></a>
    </p>
    <?php endif;
}

/**
 * Save the meta box data
 */
function viator_cta_save_meta_box($post_id) {
    if (!isset($_POST['viator_cta_nonce_field']) || 
        !wp_verify_nonce($_POST['viator_cta_nonce_field'], 'viator_cta_nonce')) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;
    
    $viator_tour = [
        'productCode' => sanitize_text_field($_POST['viator_productCode'] ?? ''),
        'title' => sanitize_text_field($_POST['viator_title'] ?? ''),
        'url' => esc_url_raw($_POST['viator_url'] ?? ''),
        'price' => sanitize_text_field($_POST['viator_price'] ?? ''),
        'rating' => floatval($_POST['viator_rating'] ?? 0),
        'reviewCount' => intval($_POST['viator_reviewCount'] ?? 0),
        'destination' => sanitize_text_field($_POST['viator_destination'] ?? ''),
    ];
    
    // Only save if at least URL is provided
    if (!empty($viator_tour['url'])) {
        update_post_meta($post_id, 'viator_tour', $viator_tour);
    } else {
        delete_post_meta($post_id, 'viator_tour');
    }
}
add_action('save_post', 'viator_cta_save_meta_box');

/**
 * REST API endpoint to bulk update viator_tour meta
 */
function viator_cta_register_routes() {
    register_rest_route('viator-cta/v1', '/update/(?P<id>\d+)', [
        'methods' => 'POST',
        'callback' => 'viator_cta_update_tour',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
        'args' => [
            'id' => [
                'required' => true,
                'type' => 'integer',
            ],
            'productCode' => ['type' => 'string'],
            'title' => ['type' => 'string'],
            'url' => ['type' => 'string'],
            'price' => ['type' => 'string'],
            'rating' => ['type' => 'number'],
            'reviewCount' => ['type' => 'integer'],
            'destination' => ['type' => 'string'],
        ],
    ]);
    
    register_rest_route('viator-cta/v1', '/bulk-update', [
        'methods' => 'POST',
        'callback' => 'viator_cta_bulk_update',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        },
    ]);
}
add_action('rest_api_init', 'viator_cta_register_routes');

function viator_cta_update_tour($request) {
    $post_id = $request['id'];
    
    $viator_tour = [
        'productCode' => sanitize_text_field($request['productCode'] ?? ''),
        'title' => sanitize_text_field($request['title'] ?? ''),
        'url' => esc_url_raw($request['url'] ?? ''),
        'price' => sanitize_text_field($request['price'] ?? ''),
        'rating' => floatval($request['rating'] ?? 0),
        'reviewCount' => intval($request['reviewCount'] ?? 0),
        'destination' => sanitize_text_field($request['destination'] ?? ''),
    ];
    
    if (!empty($viator_tour['url'])) {
        update_post_meta($post_id, 'viator_tour', $viator_tour);
        return ['success' => true, 'post_id' => $post_id];
    }
    
    return new WP_Error('invalid_data', 'URL is required', ['status' => 400]);
}

function viator_cta_bulk_update($request) {
    $updates = $request->get_json_params();
    $results = [];
    
    foreach ($updates as $update) {
        $post_id = intval($update['id'] ?? 0);
        if (!$post_id) continue;
        
        $viator_tour = [
            'productCode' => sanitize_text_field($update['productCode'] ?? ''),
            'title' => sanitize_text_field($update['title'] ?? ''),
            'url' => esc_url_raw($update['url'] ?? ''),
            'price' => sanitize_text_field($update['price'] ?? ''),
            'rating' => floatval($update['rating'] ?? 0),
            'reviewCount' => intval($update['reviewCount'] ?? 0),
            'destination' => sanitize_text_field($update['destination'] ?? ''),
        ];
        
        if (!empty($viator_tour['url'])) {
            update_post_meta($post_id, 'viator_tour', $viator_tour);
            $results[] = ['post_id' => $post_id, 'success' => true];
        } else {
            $results[] = ['post_id' => $post_id, 'success' => false, 'error' => 'URL required'];
        }
    }
    
    return ['results' => $results, 'total' => count($results)];
}
