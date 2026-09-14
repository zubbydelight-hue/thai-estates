<?php
/* ============================================================
   ALVO — серверная отправка заявок
   Работает на любом хостинге с PHP 7+ (Beget, Timeweb и т.п.),
   ничего в настройках хостинга менять не нужно.

   Зачем: сервис formsubmit.co при отправке прямо из браузера
   требует заголовок Referer и отдельную активацию для каждого
   домена (www / без www). Мобильные браузеры, блокировщики
   рекламы и приватные режимы Referer вырезают — заявка теряется.
   Этот скрипт принимает заявку от сайта и отправляет её уже
   с сервера, где всё под контролем.

   Каналы доставки (по порядку, пока один не сработает):
   1. formsubmit.co — с сервера, с корректным Referer сайта.
   2. PHP mail() хостинга — письмо с адреса на домене сайта.

   Файл должен лежать в корне сайта рядом с index.html.
   Проверка: откройте https://ваш-домен/send-lead.php — должен
   вернуться JSON {"ok":false,"error":"method",...}. Значит PHP
   работает и скрипт на месте.
   ============================================================ */

$LEAD_EMAIL = 'facebook.dax@yandex.ru';        // куда приходят заявки
$SITE_URL   = 'https://alvo-company.ru/';      // домен, на котором активирована форма formsubmit
$FROM_NAME  = 'Сайт ALVO';
// Отправитель для mail(): Beget и другие хостинги требуют адрес на домене сайта,
// иначе подменяют его на unverified@... и письмо уходит в спам. Берём домен автоматически.
$host = isset($_SERVER['HTTP_HOST']) ? strtolower(preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'])) : '';
$host = preg_replace('/^www\./', '', $host);
if ($host === '' || !preg_match('/^[a-z0-9.-]+\.[a-z]{2,}$/', $host)) $host = 'alvo-company.ru';
$FROM_EMAIL = 'noreply@' . $host;

ini_set('display_errors', '0'); // любые notice хостинга не должны ломать JSON-ответ
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  http_response_code(405);
  echo json_encode(
    array('ok' => false, 'error' => 'method', 'hint' => 'send-lead.php на месте и PHP работает. Заявки принимаются методом POST.'),
    JSON_UNESCAPED_UNICODE
  );
  exit;
}

/* ---------- входные данные ---------- */
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) $data = $_POST;

$fields = array();
foreach ($data as $k => $v) {
  if (!is_scalar($v)) continue;
  $k = trim((string) preg_replace('/[\r\n\t]+/u', ' ', (string) $k));
  $v = trim((string) preg_replace('/[\r\n\t]+/u', ' ', (string) $v));
  if ($k === '' || $v === '' || $k[0] === '_') continue; // служебные поля formsubmit не пропускаем
  $fields[mb_substr($k, 0, 120)] = mb_substr($v, 0, 1000);
  if (count($fields) >= 40) break;
}

$phone = isset($fields['Телефон']) ? $fields['Телефон'] : '';
if (strlen(preg_replace('/\D/', '', $phone)) < 6) {
  http_response_code(400);
  echo json_encode(array('ok' => false, 'error' => 'phone'), JSON_UNESCAPED_UNICODE);
  exit;
}

$fields['Время'] = date('d.m.Y H:i') . ' (' . date_default_timezone_get() . ')';
$ip = isset($_SERVER['HTTP_X_FORWARDED_FOR']) ? trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]) : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '');
if ($ip !== '') $fields['IP'] = $ip;

$source  = isset($fields['Источник']) ? $fields['Источник'] : 'сайт';
$subject = 'Заявка ALVO | ' . $source . ' | ' . $phone;

$errors = array();
$via    = '';

/* ---------- 1. formsubmit.co с сервера ---------- */
$payload = array_merge(
  array('_subject' => $subject, '_template' => 'table', '_captcha' => 'false'),
  $fields
);
$res = alvo_post_json('https://formsubmit.co/ajax/' . $LEAD_EMAIL, $payload, $SITE_URL);
if (is_array($res) && isset($res['success']) && (string) $res['success'] === 'true') {
  $via = 'formsubmit';
} else {
  $errors[] = 'formsubmit: ' . (is_array($res) && isset($res['message']) ? $res['message'] : 'нет ответа');
}

/* ---------- 2. PHP mail() хостинга ---------- */
if ($via === '') {
  $html    = alvo_build_html($fields, $subject);
  $headers = "MIME-Version: 1.0\r\n"
    . "Content-Type: text/html; charset=UTF-8\r\n"
    . 'From: ' . alvo_mime($FROM_NAME) . " <$FROM_EMAIL>\r\n"
    . "Reply-To: $FROM_EMAIL\r\n"
    . 'X-Mailer: ALVO-site';
  $ok = @mail($LEAD_EMAIL, alvo_mime($subject), $html, $headers, '-f' . $FROM_EMAIL);
  if ($ok) {
    $via = 'mail';
  } else {
    $errors[] = 'mail(): отказ';
  }
}

if ($via !== '') {
  echo json_encode(array('ok' => true, 'via' => $via), JSON_UNESCAPED_UNICODE);
} else {
  http_response_code(502);
  echo json_encode(array('ok' => false, 'error' => 'delivery', 'details' => $errors), JSON_UNESCAPED_UNICODE);
}
exit;

/* ---------- helpers ---------- */

function alvo_post_json($url, $payload, $referer) {
  $body    = json_encode($payload, JSON_UNESCAPED_UNICODE);
  $headers = array(
    'Content-Type: application/json',
    'Accept: application/json',
    'Origin: ' . rtrim($referer, '/'),
    'Referer: ' . $referer,
    'User-Agent: Mozilla/5.0 (compatible; ALVO-site lead relay)'
  );

  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, array(
      CURLOPT_POST           => true,
      CURLOPT_POSTFIELDS     => $body,
      CURLOPT_HTTPHEADER     => $headers,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_CONNECTTIMEOUT => 8,
      CURLOPT_TIMEOUT        => 15
    ));
    $out = curl_exec($ch);
    curl_close($ch);
  } else {
    $ctx = stream_context_create(array('http' => array(
      'method'        => 'POST',
      'header'        => implode("\r\n", $headers),
      'content'       => $body,
      'timeout'       => 15,
      'ignore_errors' => true
    )));
    $out = @file_get_contents($url, false, $ctx);
  }
  if (!is_string($out) || $out === '') return null;
  $json = json_decode($out, true);
  return is_array($json) ? $json : null;
}

function alvo_mime($str) {
  return '=?UTF-8?B?' . base64_encode($str) . '?=';
}

function alvo_build_html($fields, $title) {
  $rows = '';
  foreach ($fields as $k => $v) {
    $rows .= '<tr>'
      . '<td style="padding:8px 12px;border:1px solid #e5e2da;background:#f7f5f0;font-weight:600;white-space:nowrap">' . htmlspecialchars($k, ENT_QUOTES, 'UTF-8') . '</td>'
      . '<td style="padding:8px 12px;border:1px solid #e5e2da">' . htmlspecialchars($v, ENT_QUOTES, 'UTF-8') . '</td>'
      . '</tr>';
  }
  return '<!doctype html><html><body style="font-family:Arial,sans-serif;font-size:14px;color:#111">'
    . '<h2 style="margin:0 0 14px;font-size:18px">' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</h2>'
    . '<table cellspacing="0" cellpadding="0" style="border-collapse:collapse">' . $rows . '</table>'
    . '</body></html>';
}
