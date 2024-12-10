<?php
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);
header("Content-Type: application/json");
require_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "db" . DIRECTORY_SEPARATOR . "db.php";

try {
    $event = require_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "utils" . DIRECTORY_SEPARATOR . "userAgentParser.php";
    $event = json_encode($event);

    $db->beginTransaction();

    $q = "INSERT INTO `web_dev_proj_db`.`views` (`event`) VALUES (:event)";
    $stmt = $db->prepare($q);
    $stmt->bindValue(":event", $event, PDO::PARAM_STR);
    $stmt->execute();

    $db->commit();
    echo json_encode(['status' => true, 'message' => "Ok"]);
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(['status' => false, 'message' => "An error occurred while logging the event"]);
    exit;
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(['status' => false, 'message' => "An error occurred while logging the event"]);
    exit;
}
