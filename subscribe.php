<?php
// subscribe.php – handle newsletter subscription
// Requires db_config.php with MySQL credentials
require_once 'db_config.php';

// Nama mailing list cPanel (Email > Mailing Lists) yang mau di-broadcast.
// Ganti kalau nama list di cPanel lu beda dari "subscribers".
define('MAILMAN_LIST', 'subscribers');

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

// Daftarin email ke mailing list cPanel (Mailman) buat broadcast.
// Best-effort: kalau gagal (list beda nama, Mailman down, dll) gak nge-block
// subscribe di DB kita sendiri, cuma dicatat via error_log.
function joinMailmanList($email) {
    $url = 'http://' . $_SERVER['HTTP_HOST'] . '/mailman/subscribe/' . MAILMAN_LIST;
    $postData = http_build_query(['email' => $email, 'subscribe' => 'Subscribe']);
    try {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $postData,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 5,
            ]);
            curl_exec($ch);
            curl_close($ch);
        } else {
            $context = stream_context_create(['http' => [
                'method' => 'POST',
                'header' => 'Content-Type: application/x-www-form-urlencoded',
                'content' => $postData,
                'timeout' => 5,
            ]]);
            @file_get_contents($url, false, $context);
        }
    } catch (Throwable $e) {
        error_log('Gagal join Mailman list: ' . $e->getMessage());
    }
}

// Insert new subscriber
$stmt = $mysqli->prepare('INSERT INTO subscribers (email) VALUES (?)');
$stmt->bind_param('s', $email);
if ($stmt->execute()) {
    joinMailmanList($email);

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
