<?php
define("DS", DIRECTORY_SEPARATOR);

require_once __DIR__ . DS . ".." . DS . "vendor" . DS . "autoload.php";

use \Dotenv\Dotenv;

Dotenv::createImmutable(__DIR__)->load();
