<?php
ini_set("display_errors", 1);
ini_set("display_startup_errors", 1);
error_reporting(E_ALL);
header("Content-Type: application/json");
require_once __DIR__ . DIRECTORY_SEPARATOR . ".." . DIRECTORY_SEPARATOR . "vendor" . DIRECTORY_SEPARATOR . "autoload.php";

use DeviceDetector\DeviceDetector;

try {
    $data = json_decode(file_get_contents('php://input'), true);
    $dateTime = new DateTime();

    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? "Unavailable";
    $ip = getIPAddress();

    // DeviceDetector instance
    $dd = new DeviceDetector($userAgent);
    $dd->parse();

    // Gets if a bot is visiting the site
    $isBot = $dd->isBot();
    $botName = $isBot ? ($dd->getBot()['name'] ?? 'Unknown') : null;

    // Client data
    $clientData = $dd->getClient(); // Browser
    $browserFamily = $clientData['name'] ?? 'Unknown';
    $browserVersion = $clientData['version'] ?? 'Unknown';

    // S.O. data
    $osData = $dd->getOs();
    $osFamily = $osData['name'] ?? 'Unknown';
    $osVersion = $osData['version'] ?? 'Unknown';

    // Device data
    $deviceType = $dd->getDeviceName(); // Es. desktop, smartphone, tablet
    $deviceBrand = $dd->getBrandName(); // Es. Apple, Samsung
    $deviceModel = $dd->getModel(); // Es. iPhone 12

    // Language data (parsed to an array ordered by lang quality, the preferred)
    $parsedLanguage = parseLanguages($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '');

    $event = [
        'timestamp' => $dateTime->format('Y-m-d H:i:s'),
        'client_data' => [
            'ip' => $ip,
            'ua' => $userAgent,
            'lang' => $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? "Unavailable",
            'ref' => $_SERVER['HTTP_REFERER'] ?? "Unavailable",
            'accept' => $_SERVER['HTTP_ACCEPT'] ?? "Unavailable",
            'reqMethod' => $_SERVER['REQUEST_METHOD'] ?? "Unavailable",
            'protocol' => $_SERVER['SERVER_PROTOCOL'] ?? "Unavailable",
            'port' => $_SERVER['SERVER_PORT'] ?? "Unavailable",
            'qs' => $_SERVER['QUERY_STRING'] ?? "Unavailable",
            'sn' => $_SERVER['SCRIPT_NAME'] ?? "Unavailable",
            'detailed' => [
                'is_bot' => $isBot,
                'bot_name' => $botName,
                'browser-family' => $browserFamily,
                'browser-version' => $browserVersion,
                'os-family' => $osFamily,
                'os-version' => $osVersion,
                'device-type' => $deviceType,
                'device-brand' => $deviceBrand,
                'device-model' => $deviceModel,
                'language_iso_code' => $parsedLanguage[0]['code'] ?? 'Unknown',
                'language-quality' => $parsedLanguage[0]['quality'] ?? 1.0,
                'secondary-languages' => array_slice($parsedLanguage, 1),
                'hostname' => gethostbyaddr($ip),
            ]
        ]
    ];

    return $event;
} catch (Exception $e) {
    throw $e;
}

function getIPAddress()
{
    $ip = '';

    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } else if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        $ip = $_SERVER['REMOTE_ADDR'];
    }

    return $ip == '::1' ? '127.0.0.1' : $ip;
}

function parseLanguages($langString)
{
    $languages = explode(',', $langString);
    $parsedLanguages = [];

    foreach ($languages as $language) {
        $parts = explode(';', $language);
        $langCode = $parts[0];
        $quality = isset($parts[1]) ? floatval(str_replace('q=', '', $parts[1])) : 1.0;
        $parsedLanguages[] = ['code' => $langCode, 'quality' => $quality];
    }

    usort($parsedLanguages, function ($a, $b) {
        return $b['quality'] <=> $a['quality'];
    });

    return $parsedLanguages;
}
