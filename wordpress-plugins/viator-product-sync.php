<?php
/**
 * Plugin Name: Viator Product Sync
 * Description: Syncs Viator tour products daily and stores them in WordPress database
 * Version: 1.0.0
 * Author: Cursed Tours
 */

if (!defined('ABSPATH')) exit;

define('VIATOR_SYNC_TABLE', 'viator_products');
define('VIATOR_SYNC_CRON_HOOK', 'viator_daily_product_sync');

/**
 * Plugin activation - create database table
 */
function viator_sync_activate() {
    global $wpdb;
    $table_name = $wpdb->prefix . VIATOR_SYNC_TABLE;
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        product_code varchar(50) NOT NULL,
        title varchar(500) NOT NULL,
        description text,
        url varchar(500) NOT NULL,
        thumbnail_url varchar(500),
        price varchar(50),
        currency varchar(10) DEFAULT 'USD',
        rating decimal(2,1),
        review_count int DEFAULT 0,
        duration varchar(100),
        destination_id varchar(20),
        destination_name varchar(200),
        category varchar(200),
        is_active tinyint(1) DEFAULT 1,
        has_free_cancellation tinyint(1) DEFAULT 0,
        last_verified datetime DEFAULT CURRENT_TIMESTAMP,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY product_code (product_code),
        KEY destination_id (destination_id),
        KEY is_active (is_active)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);

    // Schedule daily cron if not already scheduled
    if (!wp_next_scheduled(VIATOR_SYNC_CRON_HOOK)) {
        wp_schedule_event(time(), 'daily', VIATOR_SYNC_CRON_HOOK);
    }

    // Store plugin version
    update_option('viator_sync_version', '1.0.0');
}
register_activation_hook(__FILE__, 'viator_sync_activate');

/**
 * Plugin deactivation - remove cron
 */
function viator_sync_deactivate() {
    wp_clear_scheduled_hook(VIATOR_SYNC_CRON_HOOK);
}
register_deactivation_hook(__FILE__, 'viator_sync_deactivate');

/**
 * Admin menu for settings
 */
function viator_sync_admin_menu() {
    add_options_page(
        'Viator Product Sync',
        'Viator Sync',
        'manage_options',
        'viator-sync',
        'viator_sync_settings_page'
    );
}
add_action('admin_menu', 'viator_sync_admin_menu');

/**
 * Settings page
 */
function viator_sync_settings_page() {
    global $wpdb;
    $table_name = $wpdb->prefix . VIATOR_SYNC_TABLE;
    
    // Handle manual sync trigger
    if (isset($_POST['viator_sync_now']) && wp_verify_nonce($_POST['viator_sync_nonce'], 'viator_sync_action')) {
        $result = viator_sync_products();
        $message = $result['success'] ? 
            "Sync completed! {$result['synced']} products synced, {$result['errors']} errors." :
            "Sync failed: {$result['message']}";
    }
    
    // Get stats
    $total_products = $wpdb->get_var("SELECT COUNT(*) FROM $table_name");
    $active_products = $wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE is_active = 1");
    $last_sync = get_option('viator_last_sync', 'Never');
    $next_sync = wp_next_scheduled(VIATOR_SYNC_CRON_HOOK);
    
    ?>
    <div class="wrap">
        <h1>Viator Product Sync</h1>
        
        <?php if (isset($message)): ?>
        <div class="notice notice-<?php echo $result['success'] ? 'success' : 'error'; ?>">
            <p><?php echo esc_html($message); ?></p>
        </div>
        <?php endif; ?>
        
        <div class="card" style="max-width: 600px; padding: 20px;">
            <h2>Sync Status</h2>
            <table class="form-table">
                <tr>
                    <th>Total Products</th>
                    <td><strong><?php echo esc_html($total_products); ?></strong></td>
                </tr>
                <tr>
                    <th>Active Products</th>
                    <td><strong><?php echo esc_html($active_products); ?></strong></td>
                </tr>
                <tr>
                    <th>Last Sync</th>
                    <td><?php echo esc_html($last_sync); ?></td>
                </tr>
                <tr>
                    <th>Next Scheduled Sync</th>
                    <td><?php echo $next_sync ? date('Y-m-d H:i:s', $next_sync) : 'Not scheduled'; ?></td>
                </tr>
            </table>
            
            <form method="post" style="margin-top: 20px;">
                <?php wp_nonce_field('viator_sync_action', 'viator_sync_nonce'); ?>
                <button type="submit" name="viator_sync_now" class="button button-primary">
                    Sync Now
                </button>
            </form>
        </div>
        
        <div class="card" style="max-width: 600px; padding: 20px; margin-top: 20px;">
            <h2>API Settings</h2>
            <form method="post" action="options.php">
                <?php settings_fields('viator_sync_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th><label for="viator_api_key">Viator API Key</label></th>
                        <td>
                            <input type="password" id="viator_api_key" name="viator_api_key" 
                                value="<?php echo esc_attr(get_option('viator_api_key')); ?>" 
                                class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th><label for="viator_partner_id">Partner ID (PID)</label></th>
                        <td>
                            <input type="text" id="viator_partner_id" name="viator_partner_id" 
                                value="<?php echo esc_attr(get_option('viator_partner_id', 'P00166886')); ?>" 
                                class="regular-text">
                        </td>
                    </tr>
                    <tr>
                        <th><label for="viator_destinations">Destination IDs</label></th>
                        <td>
                            <textarea id="viator_destinations" name="viator_destinations" 
                                rows="5" class="large-text"><?php echo esc_textarea(get_option('viator_destinations', "675\n737\n739\n4283\n50249\n673\n687\n678\n22093\n4282\n4177\n684\n503")); ?></textarea>
                            <p class="description">One destination ID per line (e.g., 675 for New Orleans)</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="viator_search_terms">Search Terms</label></th>
                        <td>
                            <input type="text" id="viator_search_terms" name="viator_search_terms" 
                                value="<?php echo esc_attr(get_option('viator_search_terms', 'ghost haunted tour')); ?>" 
                                class="regular-text">
                            <p class="description">Keywords to search for tours</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button('Save Settings'); ?>
            </form>
        </div>
    </div>
    <?php
}

/**
 * Register settings
 */
function viator_sync_register_settings() {
    register_setting('viator_sync_settings', 'viator_api_key');
    register_setting('viator_sync_settings', 'viator_partner_id');
    register_setting('viator_sync_settings', 'viator_destinations');
    register_setting('viator_sync_settings', 'viator_search_terms');
}
add_action('admin_init', 'viator_sync_register_settings');

/**
 * Main sync function - calls Viator API and updates database
 */
function viator_sync_products() {
    global $wpdb;
    $table_name = $wpdb->prefix . VIATOR_SYNC_TABLE;
    
    $api_key = get_option('viator_api_key');
    if (empty($api_key)) {
        return ['success' => false, 'message' => 'API key not configured'];
    }
    
    $destinations = array_filter(array_map('trim', explode("\n", get_option('viator_destinations', ''))));
    $search_terms = get_option('viator_search_terms', 'ghost haunted tour');
    $partner_id = get_option('viator_partner_id', 'P00166886');
    
    $synced = 0;
    $errors = 0;
    $processed_codes = [];
    
    foreach ($destinations as $dest_id) {
        $products = viator_api_search_products($api_key, $dest_id, $search_terms);
        
        if (is_wp_error($products)) {
            $errors++;
            error_log("Viator sync error for destination $dest_id: " . $products->get_error_message());
            continue;
        }
        
        foreach ($products as $product) {
            $product_code = $product['productCode'] ?? '';
            if (empty($product_code) || in_array($product_code, $processed_codes)) {
                continue;
            }
            
            $processed_codes[] = $product_code;
            
            // Build affiliate URL
            $product_url = "https://www.viator.com/tours/{$product_code}?pid={$partner_id}";
            
            $data = [
                'product_code' => $product_code,
                'title' => sanitize_text_field($product['title'] ?? ''),
                'description' => sanitize_textarea_field($product['description'] ?? ''),
                'url' => esc_url_raw($product_url),
                'thumbnail_url' => esc_url_raw($product['thumbnailURL'] ?? $product['thumbnailHiResURL'] ?? ''),
                'price' => sanitize_text_field($product['price']['fromPrice'] ?? ''),
                'currency' => sanitize_text_field($product['price']['currencyCode'] ?? 'USD'),
                'rating' => floatval($product['reviews']['combinedAverageRating'] ?? 0),
                'review_count' => intval($product['reviews']['totalReviews'] ?? 0),
                'duration' => sanitize_text_field($product['duration'] ?? ''),
                'destination_id' => sanitize_text_field($dest_id),
                'destination_name' => sanitize_text_field($product['destinationName'] ?? ''),
                'category' => sanitize_text_field($product['primaryGroupName'] ?? ''),
                'is_active' => 1,
                'has_free_cancellation' => !empty($product['flags']['freeCancellation']) ? 1 : 0,
                'last_verified' => current_time('mysql'),
            ];
            
            // Upsert product
            $existing = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM $table_name WHERE product_code = %s",
                $product_code
            ));
            
            if ($existing) {
                $wpdb->update($table_name, $data, ['product_code' => $product_code]);
            } else {
                $data['created_at'] = current_time('mysql');
                $wpdb->insert($table_name, $data);
            }
            
            $synced++;
        }
    }
    
    // Mark products not found in this sync as potentially inactive
    // (only if they haven't been verified in the last 7 days)
    $week_ago = date('Y-m-d H:i:s', strtotime('-7 days'));
    if (!empty($processed_codes)) {
        $placeholders = implode(',', array_fill(0, count($processed_codes), '%s'));
        $wpdb->query($wpdb->prepare(
            "UPDATE $table_name SET is_active = 0 
             WHERE product_code NOT IN ($placeholders) 
             AND last_verified < %s",
            array_merge($processed_codes, [$week_ago])
        ));
    }
    
    update_option('viator_last_sync', current_time('mysql'));
    
    return ['success' => true, 'synced' => $synced, 'errors' => $errors];
}

/**
 * Call Viator API to search for products
 */
function viator_api_search_products($api_key, $destination_id, $search_terms) {
    $api_url = 'https://api.viator.com/partner/products/search';
    
    $body = [
        'filtering' => [
            'destination' => $destination_id,
            'tags' => [], // Can add category tags here
            'flags' => ['FREE_CANCELLATION'],
        ],
        'searchTerm' => $search_terms,
        'currency' => 'USD',
        'pagination' => [
            'start' => 1,
            'count' => 50,
        ],
    ];
    
    $response = wp_remote_post($api_url, [
        'timeout' => 30,
        'headers' => [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'Accept-Language' => 'en-US',
            'exp-api-key' => $api_key,
        ],
        'body' => json_encode($body),
    ]);
    
    if (is_wp_error($response)) {
        return $response;
    }
    
    $status_code = wp_remote_retrieve_response_code($response);
    if ($status_code !== 200) {
        return new WP_Error('api_error', "API returned status $status_code");
    }
    
    $data = json_decode(wp_remote_retrieve_body($response), true);
    
    return $data['products'] ?? [];
}

/**
 * Cron handler
 */
add_action(VIATOR_SYNC_CRON_HOOK, 'viator_sync_products');

/**
 * REST API endpoints for products
 */
function viator_sync_register_rest_routes() {
    // Get all active products
    register_rest_route('viator-sync/v1', '/products', [
        'methods' => 'GET',
        'callback' => 'viator_sync_get_products',
        'permission_callback' => '__return_true',
        'args' => [
            'destination' => [
                'type' => 'string',
                'description' => 'Filter by destination ID',
            ],
            'active_only' => [
                'type' => 'boolean',
                'default' => true,
            ],
            'per_page' => [
                'type' => 'integer',
                'default' => 50,
                'maximum' => 100,
            ],
            'page' => [
                'type' => 'integer',
                'default' => 1,
            ],
        ],
    ]);
    
    // Get single product by code
    register_rest_route('viator-sync/v1', '/products/(?P<code>[a-zA-Z0-9_-]+)', [
        'methods' => 'GET',
        'callback' => 'viator_sync_get_product',
        'permission_callback' => '__return_true',
    ]);
    
    // Get sync status
    register_rest_route('viator-sync/v1', '/status', [
        'methods' => 'GET',
        'callback' => 'viator_sync_get_status',
        'permission_callback' => '__return_true',
    ]);
    
    // Trigger manual sync (requires auth)
    register_rest_route('viator-sync/v1', '/sync', [
        'methods' => 'POST',
        'callback' => 'viator_sync_trigger',
        'permission_callback' => function() {
            return current_user_can('manage_options');
        },
    ]);
}
add_action('rest_api_init', 'viator_sync_register_rest_routes');

/**
 * Get products REST callback
 */
function viator_sync_get_products($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . VIATOR_SYNC_TABLE;
    
    $destination = $request->get_param('destination');
    $active_only = $request->get_param('active_only');
    $per_page = min(intval($request->get_param('per_page')), 100);
    $page = max(intval($request->get_param('page')), 1);
    $offset = ($page - 1) * $per_page;
    
    $where = [];
    $params = [];
    
    if ($active_only) {
        $where[] = 'is_active = 1';
    }
    
    if ($destination) {
        $where[] = 'destination_id = %s';
        $params[] = $destination;
    }
    
    $where_sql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // Get total count
    $count_sql = "SELECT COUNT(*) FROM $table_name $where_sql";
    $total = $wpdb->get_var($params ? $wpdb->prepare($count_sql, $params) : $count_sql);
    
    // Get products
    $query = "SELECT * FROM $table_name $where_sql ORDER BY rating DESC, review_count DESC LIMIT %d OFFSET %d";
    $params[] = $per_page;
    $params[] = $offset;
    
    $products = $wpdb->get_results($wpdb->prepare($query, $params), ARRAY_A);
    
    // Format response
    $formatted = array_map(function($p) {
        return [
            'productCode' => $p['product_code'],
            'title' => $p['title'],
            'description' => $p['description'],
            'url' => $p['url'],
            'thumbnailUrl' => $p['thumbnail_url'],
            'price' => $p['price'],
            'currency' => $p['currency'],
            'rating' => floatval($p['rating']),
            'reviewCount' => intval($p['review_count']),
            'duration' => $p['duration'],
            'destinationId' => $p['destination_id'],
            'destinationName' => $p['destination_name'],
            'category' => $p['category'],
            'isActive' => (bool) $p['is_active'],
            'hasFreeCancellation' => (bool) $p['has_free_cancellation'],
            'lastVerified' => $p['last_verified'],
        ];
    }, $products);
    
    return [
        'products' => $formatted,
        'pagination' => [
            'total' => intval($total),
            'per_page' => $per_page,
            'current_page' => $page,
            'total_pages' => ceil($total / $per_page),
        ],
    ];
}

/**
 * Get single product
 */
function viator_sync_get_product($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . VIATOR_SYNC_TABLE;
    
    $code = $request->get_param('code');
    $product = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table_name WHERE product_code = %s",
        $code
    ), ARRAY_A);
    
    if (!$product) {
        return new WP_Error('not_found', 'Product not found', ['status' => 404]);
    }
    
    return [
        'productCode' => $product['product_code'],
        'title' => $product['title'],
        'description' => $product['description'],
        'url' => $product['url'],
        'thumbnailUrl' => $product['thumbnail_url'],
        'price' => $product['price'],
        'currency' => $product['currency'],
        'rating' => floatval($product['rating']),
        'reviewCount' => intval($product['review_count']),
        'duration' => $product['duration'],
        'destinationId' => $product['destination_id'],
        'destinationName' => $product['destination_name'],
        'category' => $product['category'],
        'isActive' => (bool) $product['is_active'],
        'hasFreeCancellation' => (bool) $product['has_free_cancellation'],
        'lastVerified' => $product['last_verified'],
    ];
}

/**
 * Get sync status
 */
function viator_sync_get_status($request) {
    global $wpdb;
    $table_name = $wpdb->prefix . VIATOR_SYNC_TABLE;
    
    return [
        'lastSync' => get_option('viator_last_sync', null),
        'nextScheduledSync' => wp_next_scheduled(VIATOR_SYNC_CRON_HOOK) ? 
            date('Y-m-d H:i:s', wp_next_scheduled(VIATOR_SYNC_CRON_HOOK)) : null,
        'totalProducts' => intval($wpdb->get_var("SELECT COUNT(*) FROM $table_name")),
        'activeProducts' => intval($wpdb->get_var("SELECT COUNT(*) FROM $table_name WHERE is_active = 1")),
        'destinations' => $wpdb->get_results(
            "SELECT destination_id, destination_name, COUNT(*) as count 
             FROM $table_name WHERE is_active = 1 
             GROUP BY destination_id, destination_name",
            ARRAY_A
        ),
    ];
}

/**
 * Trigger sync manually via REST
 */
function viator_sync_trigger($request) {
    $result = viator_sync_products();
    return $result;
}
