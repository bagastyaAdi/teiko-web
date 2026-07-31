<?php
// test_db.php – simple script to verify DB credentials in db_config.php
require_once 'db_config.php';

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($mysqli->connect_error) {
    echo "<pre>Connection FAILED: " . $mysqli->connect_error . "</pre>";
} else {
    echo "<pre>Connection SUCCESSFUL. Database: " . DB_NAME . "</pre>";
    // Optionally list a few rows from subscribers table
    $res = $mysqli->query('SELECT id, email FROM subscribers LIMIT 5');
    if ($res) {
        echo "<pre>Sample subscribers (up to 5):\n";
        while ($row = $res->fetch_assoc()) {
            echo $row['id'] . ': ' . $row['email'] . "\n";
        }
        echo "</pre>";
    }
    $mysqli->close();
}
?>
