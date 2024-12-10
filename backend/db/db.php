<?php
require_once __DIR__ . DIRECTORY_SEPARATOR . "loadEnv.php";

$db = new PDO("mysql:host={$_ENV['DB_HOST']};dbname={$_ENV['DB_SCHEMA']}", $_ENV['DB_USERNAME'], $_ENV['DB_PASSWORD']);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
