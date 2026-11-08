<?php
/**
 * Plugin Name: DCVC Zeffy Webhook Forwarder & Reverse Proxy
 * Description: Intercepts POST requests to /api/webhooks/zeffy on diversitycollectivevc.org and transparently proxies them to the DCVC Cloudflare Worker backend, preserving raw payload bytes and HMAC-SHA256 signatures.
 * Author: Diversity Collective Ventura County
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('init', function () {
    // Only intercept requests targeting /api/webhooks/zeffy
    $request_uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (rtrim($request_uri, '/') !== '/api/webhooks/zeffy') {
        return;
    }

    // Only process POST requests (or OPTIONS preflight)
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Zeffy-Signature, X-Webhook-Signature, X-Zeffy-Secret');
        http_response_code(204);
        exit;
    }

    if ($method !== 'POST') {
        http_response_code(405);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Method not allowed. Webhooks must use POST.']);
        exit;
    }

    // 1. Target Cloudflare Worker Backend URL
    // Configured via constant in wp-config.php or default worker URL
    $target_worker_url = defined('DCVC_WORKER_BACKEND_URL') 
        ? DCVC_WORKER_BACKEND_URL 
        : 'https://dcvc-api.workers.dev/api/webhooks/zeffy';

    // 2. Read EXACT Raw Input Body (CRITICAL: Do NOT decode or re-encode, as HMAC requires identical bytes)
    $raw_body = file_get_contents('php://input');

    // 3. Extract and preserve all Zeffy webhook headers
    $forward_headers = [
        'Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'application/json'),
        'Accept: application/json',
        'X-Forwarded-Host: ' . ($_SERVER['HTTP_HOST'] ?? 'diversitycollective.org'),
        'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1')
    ];

    if (!empty($_SERVER['HTTP_X_ZEFFY_SIGNATURE'])) {
        $forward_headers[] = 'X-Zeffy-Signature: ' . $_SERVER['HTTP_X_ZEFFY_SIGNATURE'];
    }
    if (!empty($_SERVER['HTTP_X_WEBHOOK_SIGNATURE'])) {
        $forward_headers[] = 'X-Webhook-Signature: ' . $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'];
    }
    if (!empty($_SERVER['HTTP_X_ZEFFY_SECRET'])) {
        $forward_headers[] = 'X-Zeffy-Secret: ' . $_SERVER['HTTP_X_ZEFFY_SECRET'];
    }
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $forward_headers[] = 'Authorization: ' . $_SERVER['HTTP_AUTHORIZATION'];
    }

    // Forward any query parameters (e.g. ?secret=...)
    $query_string = $_SERVER['QUERY_STRING'] ?? '';
    if (!empty($query_string)) {
        $target_worker_url .= '?' . $query_string;
    }

    // 4. Dispatch transparent forward request via cURL
    $ch = curl_init($target_worker_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $raw_body);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $forward_headers);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

    $response_body = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_error) {
        http_response_code(502);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => 'Failed to reach backend Cloudflare Worker',
            'details' => $curl_error
        ]);
        exit;
    }

    // 5. Stream response directly back to caller (Zeffy)
    http_response_code($http_code ?: 200);
    header('Content-Type: application/json');
    echo $response_body;
    exit;
});

