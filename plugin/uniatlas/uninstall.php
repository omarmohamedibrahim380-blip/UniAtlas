<?php
/**
 * Uninstall UniAtlas.
 *
 * Removes the plugin options. The app page and its meta are left in place so
 * the owner does not lose content by accident.
 *
 * @package UniAtlas
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'uniatlas_page_id' );
delete_option( 'uniatlas_fullscreen' );
delete_option( 'uniatlas_universities' );
delete_transient( 'uniatlas_activated' );
