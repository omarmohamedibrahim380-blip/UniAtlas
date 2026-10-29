<?php
/**
 * Plugin Name:       UniAtlas — Student Super App
 * Plugin URI:        https://www.unibg.it/
 * Description:       أطلس جامعتك: تجربة عربية RTL تبدأ بخريطة العالم لاختيار الجامعة، وUniBg هي الجامعة المتاحة الآن. تشمل خريطة تفاعلية، دليل مباني، مسار أكاديمي، إجراءات، بنك أسئلة، مجتمع، سكن، منح ورسوم، تدريب ووظائف، ومساحة شخصية. استخدم الشورت كود [uniatlas] أو [unibg_super_app].
 * Version:           2.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            UniAtlas
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       uniatlas
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'UNIATLAS_VERSION', '2.0.0' );
define( 'UNIATLAS_FILE', __FILE__ );
define( 'UNIATLAS_DIR', plugin_dir_path( __FILE__ ) );
define( 'UNIATLAS_URL', plugin_dir_url( __FILE__ ) );

/**
 * Create the app page on activation (once).
 *
 * @return void
 */
function uniatlas_activate() {
	$page_id = (int) get_option( 'uniatlas_page_id', 0 );

	if ( $page_id && get_post( $page_id ) ) {
		update_post_meta( $page_id, '_uniatlas_app_page', '1' );
		set_transient( 'uniatlas_activated', 1, 60 );
		return;
	}

	$page_id = wp_insert_post(
		array(
			'post_title'   => 'UniAtlas',
			'post_name'    => 'uniatlas',
			'post_content' => '[uniatlas]',
			'post_status'  => 'publish',
			'post_type'    => 'page',
		)
	);

	if ( $page_id && ! is_wp_error( $page_id ) ) {
		update_option( 'uniatlas_page_id', (int) $page_id );
		update_post_meta( $page_id, '_uniatlas_app_page', '1' );
		set_transient( 'uniatlas_activated', 1, 60 );
	}
}
register_activation_hook( __FILE__, 'uniatlas_activate' );

/**
 * Default options.
 *
 * @return void
 */
function uniatlas_default_options() {
	add_option( 'uniatlas_fullscreen', 1 );
	add_option( 'uniatlas_universities', array() );
}
register_activation_hook( __FILE__, 'uniatlas_default_options' );

/**
 * Get the custom universities added through the University Manager.
 *
 * @return array
 */
function uniatlas_get_universities() {
	$universities = get_option( 'uniatlas_universities', array() );

	if ( ! is_array( $universities ) ) {
		$universities = array();
	}

	/**
	 * Filter the universities passed to the front-end registry.
	 *
	 * @param array $universities Custom universities.
	 */
	$universities = apply_filters( 'uniatlas_universities', $universities );

	return is_array( $universities ) ? $universities : array();
}

/**
 * Is the current request an app page?
 *
 * @return bool
 */
function uniatlas_is_app_page() {
	$page_id = (int) get_option( 'uniatlas_page_id', 0 );

	if ( $page_id && is_page( $page_id ) ) {
		return true;
	}

	if ( is_singular() ) {
		$post = get_post();
		if ( $post && ( has_shortcode( $post->post_content, 'uniatlas' ) || has_shortcode( $post->post_content, 'unibg_super_app' ) ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Enqueue fonts, Leaflet and the app assets.
 *
 * @param bool $force Enqueue even when the current page is not detected as an app page.
 * @return void
 */
function uniatlas_enqueue_assets( $force = false ) {
	if ( ! $force && ! uniatlas_is_app_page() ) {
		return;
	}

	wp_enqueue_style(
		'uniatlas-fonts',
		'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'uniatlas-leaflet',
		'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
		array(),
		'1.9.4'
	);

	wp_enqueue_style(
		'uniatlas-app',
		UNIATLAS_URL . 'assets/css/app.css',
		array( 'uniatlas-fonts', 'uniatlas-leaflet' ),
		UNIATLAS_VERSION
	);

	wp_enqueue_script(
		'uniatlas-leaflet',
		'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
		array(),
		'1.9.4',
		true
	);

	wp_enqueue_script(
		'uniatlas-app',
		UNIATLAS_URL . 'assets/js/app.js',
		array( 'uniatlas-leaflet' ),
		UNIATLAS_VERSION,
		true
	);

	$data = array(
		'universities' => array_values( uniatlas_get_universities() ),
	);

	wp_add_inline_script(
		'uniatlas-app',
		'window.UniAtlasData = ' . wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ';',
		'before'
	);
}
add_action( 'wp_enqueue_scripts', 'uniatlas_enqueue_assets' );

/**
 * Shortcode renderer for [uniatlas] and the legacy [unibg_super_app].
 *
 * @return string
 */
function uniatlas_shortcode() {
	static $rendered = false;

	if ( $rendered ) {
		return '';
	}

	$rendered = true;

	if ( ! wp_style_is( 'uniatlas-app', 'enqueued' ) ) {
		uniatlas_enqueue_assets( true );
	}

	$template = UNIATLAS_DIR . 'templates/app.php';

	if ( ! file_exists( $template ) ) {
		return '<p style="padding:24px;font-family:sans-serif">UniAtlas: template file is missing.</p>';
	}

	ob_start();
	include $template;
	return ob_get_clean();
}
add_shortcode( 'uniatlas', 'uniatlas_shortcode' );
add_shortcode( 'unibg_super_app', 'uniatlas_shortcode' );

/**
 * Use the full-screen template for the app page when enabled.
 *
 * @param string $template Current template path.
 * @return string
 */
function uniatlas_template_include( $template ) {
	if ( ! is_page() ) {
		return $template;
	}

	$page_id = (int) get_option( 'uniatlas_page_id', 0 );
	$current = (int) get_queried_object_id();
	$is_app  = ( $page_id && $page_id === $current ) || get_post_meta( $current, '_uniatlas_app_page', true );

	if ( ! $is_app || ! get_option( 'uniatlas_fullscreen', 1 ) ) {
		return $template;
	}

	$custom = UNIATLAS_DIR . 'templates/fullscreen.php';

	return file_exists( $custom ) ? $custom : $template;
}
add_filter( 'template_include', 'uniatlas_template_include', 99 );

/**
 * Meta box to opt any page into the full-screen app template.
 *
 * @return void
 */
function uniatlas_add_meta_box() {
	add_meta_box(
		'uniatlas_page_box',
		'UniAtlas',
		'uniatlas_render_meta_box',
		'page',
		'side',
		'high'
	);
}
add_action( 'add_meta_boxes', 'uniatlas_add_meta_box' );

/**
 * Render the page meta box.
 *
 * @param WP_Post $post Current post.
 * @return void
 */
function uniatlas_render_meta_box( $post ) {
	wp_nonce_field( 'uniatlas_save_meta', 'uniatlas_meta_nonce' );
	$checked = get_post_meta( $post->ID, '_uniatlas_app_page', true );
	?>
	<p>
		<label>
			<input type="checkbox" name="uniatlas_app_page" value="1" <?php checked( $checked, '1' ); ?>>
			استخدم قالب UniAtlas بملء الشاشة
		</label>
	</p>
	<p style="color:#646970">أضف الشورت كود <code>[uniatlas]</code> إلى الصفحة. القالب يعمل تلقائياً على الصفحة التي ينشئها البلجن.</p>
	<?php
}

/**
 * Save the page meta box.
 *
 * @param int $post_id Post ID.
 * @return void
 */
function uniatlas_save_meta_box( $post_id ) {
	if ( ! isset( $_POST['uniatlas_meta_nonce'] ) ) {
		return;
	}

	$nonce = sanitize_text_field( wp_unslash( $_POST['uniatlas_meta_nonce'] ) );

	if ( ! wp_verify_nonce( $nonce, 'uniatlas_save_meta' ) ) {
		return;
	}

	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! current_user_can( 'edit_page', $post_id ) ) {
		return;
	}

	if ( isset( $_POST['uniatlas_app_page'] ) ) {
		update_post_meta( $post_id, '_uniatlas_app_page', '1' );
	} else {
		delete_post_meta( $post_id, '_uniatlas_app_page' );
	}
}
add_action( 'save_post_page', 'uniatlas_save_meta_box' );

/**
 * Register the admin menu.
 *
 * @return void
 */
function uniatlas_add_admin_menu() {
	add_menu_page(
		'UniAtlas',
		'UniAtlas',
		'manage_options',
		'uniatlas',
		'uniatlas_render_settings',
		'dashicons-location-alt',
		58
	);

	add_submenu_page(
		'uniatlas',
		'الإعدادات',
		'الإعدادات',
		'manage_options',
		'uniatlas',
		'uniatlas_render_settings'
	);

	add_submenu_page(
		'uniatlas',
		'مدير الجامعات',
		'مدير الجامعات',
		'manage_options',
		'uniatlas-universities',
		'uniatlas_render_universities'
	);
}
add_action( 'admin_menu', 'uniatlas_add_admin_menu' );

/**
 * Register settings.
 *
 * @return void
 */
function uniatlas_register_settings() {
	register_setting(
		'uniatlas_settings',
		'uniatlas_fullscreen',
		array(
			'type'              => 'integer',
			'sanitize_callback' => 'absint',
			'default'           => 1,
		)
	);
}
add_action( 'admin_init', 'uniatlas_register_settings' );

/**
 * Create a unique university ID.
 *
 * @param string $name Proposed name.
 * @param array  $existing Existing universities.
 * @return string
 */
function uniatlas_unique_uni_id( $name, $existing ) {
	$base = sanitize_title( $name );
	if ( '' === $base ) {
		$base = 'university';
	}

	$taken = array( 'unibg', 'bologna', 'sapienza', 'polimi', 'barcelona', 'vienna' );
	foreach ( $existing as $uni ) {
		if ( isset( $uni['id'] ) ) {
			$taken[] = $uni['id'];
		}
	}

	$id      = $base;
	$counter = 2;
	while ( in_array( $id, $taken, true ) ) {
		$id = $base . '-' . $counter;
		$counter++;
	}

	return $id;
}

/**
 * Handle add/delete actions from the University Manager.
 *
 * @return void
 */
function uniatlas_handle_university_actions() {
	if ( ! is_admin() || ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( ! isset( $_POST['uniatlas_uni_action'], $_POST['uniatlas_uni_nonce'] ) ) {
		return;
	}

	$nonce = sanitize_text_field( wp_unslash( $_POST['uniatlas_uni_nonce'] ) );
	if ( ! wp_verify_nonce( $nonce, 'uniatlas_uni_manager' ) ) {
		return;
	}

	$action       = sanitize_key( wp_unslash( $_POST['uniatlas_uni_action'] ) );
	$universities = uniatlas_get_universities();
	$notice       = '';

	if ( 'delete' === $action ) {
		$id = isset( $_POST['uniatlas_uni_id'] ) ? sanitize_key( wp_unslash( $_POST['uniatlas_uni_id'] ) ) : '';

		$universities = array_values(
			array_filter(
				$universities,
				function ( $uni ) use ( $id ) {
					return ! isset( $uni['id'] ) || $uni['id'] !== $id;
				}
			)
		);

		update_option( 'uniatlas_universities', $universities );
		$notice = 'deleted';
	} elseif ( 'add' === $action ) {
		$name = isset( $_POST['uni_name'] ) ? sanitize_text_field( wp_unslash( $_POST['uni_name'] ) ) : '';

		if ( '' === $name ) {
			$notice = 'missing';
		} else {
			$lat = isset( $_POST['uni_lat'] ) ? (float) wp_unslash( $_POST['uni_lat'] ) : 0;
			$lng = isset( $_POST['uni_lng'] ) ? (float) wp_unslash( $_POST['uni_lng'] ) : 0;
			$lat = max( -90, min( 90, $lat ) );
			$lng = max( -180, min( 180, $lng ) );

			$highlights = isset( $_POST['uni_highlights'] ) ? sanitize_text_field( wp_unslash( $_POST['uni_highlights'] ) ) : '';
			$highlights = array_values( array_filter( array_map( 'trim', explode( ',', $highlights ) ) ) );

			$accent = isset( $_POST['uni_accent'] ) ? sanitize_hex_color( wp_unslash( $_POST['uni_accent'] ) ) : '';
			if ( ! $accent ) {
				$accent = '#7c5cff';
			}

			$official = isset( $_POST['uni_official'] ) ? esc_url_raw( wp_unslash( $_POST['uni_official'] ) ) : '';

			$universities[] = array(
				'id'           => uniatlas_unique_uni_id( $name, $universities ),
				'name'         => $name,
				'short'        => isset( $_POST['uni_short'] ) ? sanitize_text_field( wp_unslash( $_POST['uni_short'] ) ) : '',
				'ar'           => isset( $_POST['uni_ar'] ) ? sanitize_text_field( wp_unslash( $_POST['uni_ar'] ) ) : '',
				'city'         => isset( $_POST['uni_city'] ) ? sanitize_text_field( wp_unslash( $_POST['uni_city'] ) ) : '',
				'country'      => isset( $_POST['uni_country'] ) ? sanitize_text_field( wp_unslash( $_POST['uni_country'] ) ) : '',
				'flag'         => isset( $_POST['uni_flag'] ) ? sanitize_text_field( wp_unslash( $_POST['uni_flag'] ) ) : '🌍',
				'coords'       => array( $lat, $lng ),
				'status'       => 'coming',
				'established'  => isset( $_POST['uni_established'] ) ? absint( wp_unslash( $_POST['uni_established'] ) ) : 0,
				'students'     => isset( $_POST['uni_students'] ) ? sanitize_text_field( wp_unslash( $_POST['uni_students'] ) ) : '',
				'programs'     => isset( $_POST['uni_programs'] ) ? sanitize_text_field( wp_unslash( $_POST['uni_programs'] ) ) : '',
				'tagline'      => isset( $_POST['uni_tagline'] ) ? sanitize_text_field( wp_unslash( $_POST['uni_tagline'] ) ) : '',
				'blurb'        => isset( $_POST['uni_blurb'] ) ? sanitize_textarea_field( wp_unslash( $_POST['uni_blurb'] ) ) : '',
				'highlights'   => array_slice( $highlights, 0, 4 ),
				'official'     => $official,
				'accent'       => $accent,
				'baseInterest' => isset( $_POST['uni_interest'] ) ? absint( wp_unslash( $_POST['uni_interest'] ) ) : 0,
				'eta'          => isset( $_POST['uni_eta'] ) ? sanitize_text_field( wp_unslash( $_POST['uni_eta'] ) ) : 'قريباً',
			);

			update_option( 'uniatlas_universities', $universities );
			$notice = 'added';
		}
	}

	wp_safe_redirect(
		add_query_arg(
			array(
				'page'             => 'uniatlas-universities',
				'uniatlas_notice'  => $notice,
			),
			admin_url( 'admin.php' )
		)
	);
	exit;
}
add_action( 'admin_init', 'uniatlas_handle_university_actions' );

/**
 * Render the settings page.
 *
 * @return void
 */
function uniatlas_render_settings() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$page_id  = (int) get_option( 'uniatlas_page_id', 0 );
	$page_url = $page_id ? get_permalink( $page_id ) : '';
	?>
	<div class="wrap">
		<h1>UniAtlas — أطلس جامعتك</h1>
		<p style="max-width:820px;font-size:15px;line-height:1.9">
			تجربة الطالب العربية (RTL) التي تبدأ بخريطة العالم لاختيار الجامعة، و<b>UniBg</b> هي الجامعة المتاحة بالكامل الآن.
			أضف الشورت كود <code>[uniatlas]</code> في أي صفحة، أو استخدم الصفحة التي تم إنشاؤها تلقائياً عند التفعيل.
			الشورت كود القديم <code>[unibg_super_app]</code> يعمل أيضاً.
		</p>

		<?php if ( $page_url ) : ?>
			<p>
				<a class="button button-primary" href="<?php echo esc_url( $page_url ); ?>" target="_blank" rel="noopener">افتح الصفحة</a>
				<a class="button" href="<?php echo esc_url( get_edit_post_link( $page_id ) ); ?>">عدّل الصفحة</a>
				<a class="button" href="<?php echo esc_url( admin_url( 'admin.php?page=uniatlas-universities' ) ); ?>">مدير الجامعات</a>
			</p>
			<p>رابط الصفحة: <code><?php echo esc_html( $page_url ); ?></code></p>
		<?php else : ?>
			<p><strong>لم يتم العثور على صفحة التطبيق.</strong> أنشئ صفحة جديدة وضع فيها الشورت كود، أو أعد تفعيل البلجن.</p>
		<?php endif; ?>

		<form method="post" action="options.php" style="max-width:820px;margin-top:24px">
			<?php settings_fields( 'uniatlas_settings' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row">قالب ملء الشاشة</th>
					<td>
						<input type="hidden" name="uniatlas_fullscreen" value="0">
						<label>
							<input type="checkbox" name="uniatlas_fullscreen" value="1" <?php checked( get_option( 'uniatlas_fullscreen', 1 ), 1 ); ?>>
							استخدم قالب UniAtlas النظيف (بدون هيدر/فوتر القالب) لصفحة التطبيق.
						</label>
						<p class="description">لو أطفأت الخيار، ستظهر التجربة داخل قالب موقعك الحالي.</p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>

		<hr style="margin:28px 0">
		<h2>مهم قبل النشر</h2>
		<ul style="list-style:disc;padding-inline-start:22px;line-height:1.9;max-width:820px">
			<li>البيانات المعروضة (المباني، المواد، البروفيسورات، المواعيد، السكن، الرواتب) <strong>تجريبية للعرض</strong> وموسومة بذلك داخل الواجهة.</li>
			<li>روابط المصادر الرسمية موجودة في فوتر التطبيق وفي بطاقات الجامعات. حدّث البيانات دورياً قبل الاعتماد عليها.</li>
			<li>الخريطة تعتمد على Leaflet وخرائط Esri وتحتاج اتصالاً بالإنترنت.</li>
			<li>تفضيلات الطالب (المفضلة، التقدم، المحفوظات، الاهتمام بالجامعات) تُحفظ في متصفح الزائر عبر localStorage — لا تُرسل لأي سيرفر.</li>
			<li>لإضافة جامعة جديدة كـ«قريباً» على الخريطة، استخدم صفحة <a href="<?php echo esc_url( admin_url( 'admin.php?page=uniatlas-universities' ) ); ?>">مدير الجامعات</a>.</li>
		</ul>
	</div>
	<?php
}

/**
 * Render the University Manager page.
 *
 * @return void
 */
function uniatlas_render_universities() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$universities = uniatlas_get_universities();
	$notice       = isset( $_GET['uniatlas_notice'] ) ? sanitize_key( wp_unslash( $_GET['uniatlas_notice'] ) ) : '';
	?>
	<div class="wrap">
		<h1>مدير الجامعات</h1>
		<p style="max-width:860px;font-size:14px;line-height:1.9">
			أضف جامعة واحدة في كل مرة. الجامعة المضافة تظهر فوراً على خريطة UniAtlas كـ«قريباً»، ويقدر الطلاب يسجلوا اهتمامهم بيها.
			الجامعات الست الأساسية (UniBg + 5 جامعات قادمة) مدمجة في التطبيق ومش محتاجة إضافة هنا.
		</p>

		<?php if ( 'added' === $notice ) : ?>
			<div class="notice notice-success is-dismissible"><p>تمت إضافة الجامعة، وهتظهر على الخريطة.</p></div>
		<?php elseif ( 'deleted' === $notice ) : ?>
			<div class="notice notice-success is-dismissible"><p>تم حذف الجامعة من القائمة.</p></div>
		<?php elseif ( 'missing' === $notice ) : ?>
			<div class="notice notice-error is-dismissible"><p>لازم تكتب اسم الجامعة على الأقل.</p></div>
		<?php endif; ?>

		<h2>الجامعات المضافة</h2>
		<?php if ( empty( $universities ) ) : ?>
			<p><em>لسه مفيش جامعات مضافة. استخدم الفورم تحت.</em></p>
		<?php else : ?>
			<table class="widefat striped" style="max-width:1100px;margin-bottom:28px">
				<thead>
					<tr>
						<th>الجامعة</th>
						<th>المدينة / الدولة</th>
						<th>الإحداثيات</th>
						<th>الحالة</th>
						<th>إجراء</th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $universities as $uni ) : ?>
						<?php
						$coords = isset( $uni['coords'] ) && is_array( $uni['coords'] ) ? $uni['coords'] : array( 0, 0 );
						$status = isset( $uni['status'] ) && 'live' === $uni['status'] ? 'متاحة' : 'قريباً';
						?>
						<tr>
							<td>
								<strong><?php echo esc_html( isset( $uni['name'] ) ? $uni['name'] : '' ); ?></strong>
								<?php if ( ! empty( $uni['ar'] ) ) : ?>
									<br><span style="color:#646970"><?php echo esc_html( $uni['ar'] ); ?></span>
								<?php endif; ?>
							</td>
							<td>
								<?php echo esc_html( isset( $uni['city'] ) ? $uni['city'] : '' ); ?>
								<?php echo ! empty( $uni['country'] ) ? ' · ' . esc_html( $uni['country'] ) : ''; ?>
							</td>
							<td><code><?php echo esc_html( $coords[0] . ', ' . $coords[1] ); ?></code></td>
							<td><?php echo esc_html( $status ); ?></td>
							<td>
								<form method="post" onsubmit="return confirm('تحذف الجامعة من الخريطة؟');">
									<?php wp_nonce_field( 'uniatlas_uni_manager', 'uniatlas_uni_nonce' ); ?>
									<input type="hidden" name="uniatlas_uni_action" value="delete">
									<input type="hidden" name="uniatlas_uni_id" value="<?php echo esc_attr( isset( $uni['id'] ) ? $uni['id'] : '' ); ?>">
									<button type="submit" class="button button-link-delete">حذف</button>
								</form>
							</td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>
		<?php endif; ?>

		<hr style="margin:28px 0">

		<h2>إضافة جامعة جديدة</h2>
		<form method="post" style="max-width:980px">
			<?php wp_nonce_field( 'uniatlas_uni_manager', 'uniatlas_uni_nonce' ); ?>
			<input type="hidden" name="uniatlas_uni_action" value="add">

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="uni_name">اسم الجامعة (إنجليزي) *</label></th>
					<td><input type="text" id="uni_name" name="uni_name" class="regular-text" required placeholder="University of Padova"></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_short">الاسم المختصر</label></th>
					<td><input type="text" id="uni_short" name="uni_short" class="regular-text" placeholder="UniPD"></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_ar">الاسم بالعربي</label></th>
					<td><input type="text" id="uni_ar" name="uni_ar" class="regular-text" placeholder="جامعة بادوفا"></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_city">المدينة</label></th>
					<td><input type="text" id="uni_city" name="uni_city" class="regular-text" placeholder="بادوفا"></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_country">الدولة</label></th>
					<td><input type="text" id="uni_country" name="uni_country" class="regular-text" placeholder="إيطاليا"></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_flag">العلم (إيموجي)</label></th>
					<td><input type="text" id="uni_flag" name="uni_flag" class="small-text" value="🇮🇹" maxlength="16"></td>
				</tr>
				<tr>
					<th scope="row">الإحداثيات</th>
					<td>
						<label>Latitude <input type="number" step="any" name="uni_lat" class="small-text" value="45.4064" required></label>
						&nbsp;
						<label>Longitude <input type="number" step="any" name="uni_lng" class="small-text" value="11.8768" required></label>
						<p class="description">انسخ الإحداثيات من خرائط جوجل: دوس بالزر اليمين على المكان واختار «What's here?».</p>
					</td>
				</tr>
				<tr>
					<th scope="row">الحالة</th>
					<td>
						<strong>قريباً</strong>
						<p class="description">الجامعة تظهر على الخريطة كـ«قريباً» ويقدر الطلاب يسجلوا اهتمامهم. التجربة الكاملة لكل جامعة بتتضاف على مراحل.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_established">سنة التأسيس</label></th>
					<td><input type="number" id="uni_established" name="uni_established" class="small-text" placeholder="1222"></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_students">عدد الطلاب</label></th>
					<td><input type="text" id="uni_students" name="uni_students" class="regular-text" placeholder="~60,000"></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_programs">عدد البرامج</label></th>
					<td><input type="text" id="uni_programs" name="uni_programs" class="regular-text" placeholder="180+"></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_tagline">جملة تعريفية قصيرة</label></th>
					<td><input type="text" id="uni_tagline" name="uni_tagline" class="large-text" placeholder="مدينة جامعية عريقة… وقريبة من فينيسيا."></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_blurb">وصف مختصر</label></th>
					<td><textarea id="uni_blurb" name="uni_blurb" rows="3" class="large-text" placeholder="إيه اللي الطالب يعرفه عن الجامعة والمدينة؟"></textarea></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_highlights">أبرز المزايا</label></th>
					<td>
						<input type="text" id="uni_highlights" name="uni_highlights" class="large-text" placeholder="مدينة جامعية, برامج إنجليزية, منح إقليمية">
						<p class="description">حتى 4 مزايا، مفصولة بفاصلة.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_official">الموقع الرسمي</label></th>
					<td><input type="url" id="uni_official" name="uni_official" class="regular-text" placeholder="https://www.unipd.it"></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_accent">لون التمييز</label></th>
					<td><input type="color" id="uni_accent" name="uni_accent" value="#7c5cff"></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_interest">عدد المهتمين الافتراضي</label></th>
					<td><input type="number" id="uni_interest" name="uni_interest" class="small-text" value="0" min="0"></td>
				</tr>
				<tr>
					<th scope="row"><label for="uni_eta">موعد الإطلاق المتوقع</label></th>
					<td><input type="text" id="uni_eta" name="uni_eta" class="regular-text" value="قريباً"></td>
				</tr>
			</table>

			<?php submit_button( 'أضف الجامعة' ); ?>
		</form>
	</div>
	<?php
}

/**
 * Settings link on the plugins screen.
 *
 * @param array $links Action links.
 * @return array
 */
function uniatlas_action_links( $links ) {
	$url = admin_url( 'admin.php?page=uniatlas' );
	array_unshift( $links, '<a href="' . esc_url( $url ) . '">الإعدادات</a>' );
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( UNIATLAS_FILE ), 'uniatlas_action_links' );

/**
 * Activation notice.
 *
 * @return void
 */
function uniatlas_activation_notice() {
	if ( ! get_transient( 'uniatlas_activated' ) ) {
		return;
	}

	delete_transient( 'uniatlas_activated' );
	$page_id = (int) get_option( 'uniatlas_page_id', 0 );
	$url     = $page_id ? get_permalink( $page_id ) : '';
	?>
	<div class="notice notice-success is-dismissible">
		<p>
			<strong>UniAtlas جاهز.</strong>
			<?php if ( $url ) : ?>
				<a href="<?php echo esc_url( $url ); ?>" target="_blank" rel="noopener">افتح صفحة التطبيق</a> أو ابحث عن صفحة «UniAtlas» في الصفحات.
			<?php else : ?>
				أضف الشورت كود <code>[uniatlas]</code> في أي صفحة.
			<?php endif; ?>
		</p>
	</div>
	<?php
}
add_action( 'admin_notices', 'uniatlas_activation_notice' );
