<?php
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);
header("Content-Type: application/json");
require_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "db" . DIRECTORY_SEPARATOR . "db.php";

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

try {
    $data = json_decode(file_get_contents("php://input"), true);

    if (is_null($data)) {
        echo json_encode(["status" => false, "message" => "Invalid data received"]);
        exit();
    }

    $name = $data["name"];
    $email = $data["email"];
    $message = $data["message"];

    if (!$name || !$email || !$message) {
        echo json_encode(["status" => false, "message" => "Invalid data received"]);
        exit();
    }

    $mail = new PHPMailer(true);

    $mail->isSMTP();
    $mail->Host = $_ENV['MAIL_HOST'];
    $mail->SMTPAuth = true;
    $mail->Username = $_ENV['MAIL_USERNAME'];
    $mail->Password = $_ENV['MAIL_PSW'];
    $mail->SMTPSecure = $_ENV['MAIL_SMTP_SECURE'];
    $mail->Port = $_ENV['MAIL_PORT'];
    $mail->setFrom($_ENV['MAIL_FROM_ADDRESS'], $_ENV['MAIL_FROM_NAME']);
    $mail->addReplyTo($_ENV['MAIL_REPLY_TO_ADDRESS'], $_ENV['MAIL_REPLY_TO_NAME']);
    $mail->addAddress($_ENV['MAIL_DEFAULT_TO_ADDRESS'], $_ENV['MAIL_DEFAULT_TO_NAME']);

    $mail->IsHTML(true);
    $mail->CharSet = 'UTF-8';
    $mail->Subject = "Nuovo contatto dal tuo sito!";
    $mail->Body = "
                        <html>
                        <head>
                        <link href='https://fonts.googleapis.com/css2?family=Figtree:wght@400;700&display=swap' rel='stylesheet'>
                        <style>
                            body {
                                font-family: 'Figtree','Arial', sans-serif;
                            }

                            .container {
                                max-width: 600px;
                                margin: 20px auto;
                                padding: 20px;
                                background: #ffffff;
                                border-radius: 5px;
                                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                            }

                            h2 {
                                margin-bottom: 20px;
                            }

                            .content {
                                text-align: left;
                                color: #333333;
                            }

                            .icon {
                                width: 64px;
                                height: 64px;
                                margin-bottom: 20px;
                            }
                        </style>
                    </head>
                        <body>
                            <div class='container'>
                            <h2>You've been contacted by {$name}!</h2>
                                <div class='details'>
                                    <p><strong>Name:</strong> {$name}</p>
                                    <p><strong>Email:</strong> {$email}</p>
                                    <p><strong>Message:</strong><br>{$message}</p>
                                </div>
                            </div>
                        </body>
                        </html>
                    ";
    $mail->send();

    $db->beginTransaction();

    $q = "INSERT INTO `web_dev_proj_db`.`contacts` (`name`, email, `message`)
            VALUES (:name, :email, :message)";
    $stmt = $db->prepare($q);
    $stmt->bindValue(":name", $name, PDO::PARAM_STR);
    $stmt->bindValue(":email", $email, PDO::PARAM_STR);
    $stmt->bindValue(":message", $message, PDO::PARAM_STR);
    $stmt->execute();

    $db->commit();

    echo json_encode(['status' => true, 'message' => 'Message sent successfully']);
    exit;
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(['status' => false, 'message' => "An error occurred while sending the message"]);
    exit;
} catch (\Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(['status' => false, 'message' => "An error occurred while sending the message"]);
    exit;
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(['status' => false, 'message' => "An error occurred while sending the message"]);
    exit;
}
