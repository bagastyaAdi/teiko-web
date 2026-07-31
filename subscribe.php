<?php
// subscribe.php – handle newsletter subscription
// Requires db_config.php with MySQL credentials
require_once 'db_config.php';

// Get the page that submitted the form (redirect back there after)
$redirect = (!empty($_SERVER['HTTP_REFERER'])) ? $_SERVER['HTTP_REFERER'] : '/index.html';

// Simple response helper
function respond($msg, $type = 'error') {
    global $redirect;
    echo "<script>alert('" . addslashes($msg) . "'); window.location.href = '" . addslashes($redirect) . "';</script>";
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond('Invalid request method.');
}

$email = trim($_POST['email'] ?? '');
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond('Please provide a valid email address.');
}

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($mysqli->connect_error) {
    respond('Database connection failed.');
}

// Prevent duplicate entries
$stmt = $mysqli->prepare('SELECT id FROM subscribers WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    respond('Email already subscribed.');
}
$stmt->close();

// Insert new subscriber
$stmt = $mysqli->prepare('INSERT INTO subscribers (email) VALUES (?)');
$stmt->bind_param('s', $email);
if ($stmt->execute()) {
    // Send confirmation email (using PHP mail())
    $subject = 'Terima kasih telah berlangganan Teiko Newsletter';
    $message = "Hai,\n\nTerima kasih telah berlangganan newsletter Teiko. Anda akan menerima promo, berita, dan update terbaru.\n\nJika Anda ingin berhenti berlangganan, klik tautan berikut:\n" .
        "http://" . $_SERVER['HTTP_HOST'] . "/unsubscribe.php?email=" . urlencode($email) . "\n\nSalam,\nTim Teiko";
    $headers = "From: info@teiko.co.id\r\n" .
        "Reply-To: info@teiko.co.id\r\n" .
        "Content-Type: text/plain; charset=UTF-8";
    mail($email, $subject, $message, $headers);
    respond('Subscription successful! Check your inbox for a confirmation email.', 'success');
} else {
    respond('Failed to save subscription. Please try again later.');
}
$stmt->close();
$mysqli->close();
?>
