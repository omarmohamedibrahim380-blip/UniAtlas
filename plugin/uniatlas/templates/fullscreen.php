<?php
/**
 * Full-screen template for the UniAtlas page.
 *
 * @package UniAtlas
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?><!doctype html>
<html <?php language_attributes(); ?> dir="rtl">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<meta name="theme-color" content="#07080f">
	<?php wp_head(); ?>
</head>
<body <?php body_class( 'uniatlas-fullscreen' ); ?>>
<?php wp_body_open(); ?>

<a class="uniatlas-skip-link" href="#appMain">تخطَّ إلى المحتوى</a>

<?php
while ( have_posts() ) {
	the_post();
	the_content();
}
?>

<?php wp_footer(); ?>
</body>
</html>
