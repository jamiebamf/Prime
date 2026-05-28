<?php
/**
 * Prime-EPOS Contact Form Handler
 * Place this file at the root of your site as contact.php
 * Receives POST from contact.html and sends an email notification
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

// ── CONFIG — update these ──────────────────────────────────────
define('TO_EMAIL',      'info@prime-epos.co.uk');
define('TO_NAME',       'Prime-EPOS');
define('FROM_EMAIL',    'noreply@prime-epos.co.uk');
define('FROM_NAME',     'Prime-EPOS Website');
define('SUBJECT_PREFIX','[Prime-EPOS Enquiry]');
// ──────────────────────────────────────────────────────────────

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Honeypot check — bots fill hidden fields
if (!empty($_POST['website'])) {
    // Silently succeed so bots don't know they were caught
    echo json_encode(['success' => true]);
    exit;
}

// Sanitise helper
function clean($val) {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

// Collect and sanitise fields
$enquiry_type = clean($_POST['enquiry_type'] ?? 'General Enquiry');
$first_name   = clean($_POST['first_name']   ?? '');
$last_name    = clean($_POST['last_name']    ?? '');
$email        = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$phone        = clean($_POST['phone']        ?? '');
$company      = clean($_POST['company']      ?? '');
$sector       = clean($_POST['sector']       ?? '');
$message      = clean($_POST['message']      ?? '');

// Required field validation
if (!$first_name || !$last_name || !$email || !$phone || !$message) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
    exit;
}

// Email validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}

// Build email subject
$subject = SUBJECT_PREFIX . ' ' . $enquiry_type . ' — ' . $first_name . ' ' . $last_name;

// Build plain text email body
$body  = "New enquiry from the Prime-EPOS website\n";
$body .= str_repeat('─', 50) . "\n\n";
$body .= "Enquiry type : " . $enquiry_type . "\n";
$body .= "Name         : " . $first_name . ' ' . $last_name . "\n";
$body .= "Email        : " . $email . "\n";
$body .= "Phone        : " . $phone . "\n";
if ($company) $body .= "Business     : " . $company . "\n";
if ($sector)  $body .= "Sector       : " . $sector . "\n";
$body .= "\nMessage:\n" . str_repeat('─', 30) . "\n" . wordwrap($message, 80, "\n", false) . "\n\n";
$body .= str_repeat('─', 50) . "\n";
$body .= "Sent: " . date('d/m/Y H:i:s') . "\n";
$body .= "IP  : " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

// Build HTML email body
$html  = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;font-size:14px;color:#333;max-width:600px;margin:0 auto;padding:20px;">';
$html .= '<div style="background:#e85d04;padding:20px 24px;border-radius:8px 8px 0 0;">';
$html .= '<h2 style="color:#fff;margin:0;font-size:18px;">New Enquiry — Prime-EPOS Website</h2></div>';
$html .= '<div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">';
$html .= '<table style="width:100%;border-collapse:collapse;">';

$rows = [
    'Enquiry type' => $enquiry_type,
    'Name'         => $first_name . ' ' . $last_name,
    'Email'        => '<a href="mailto:' . $email . '">' . $email . '</a>',
    'Phone'        => '<a href="tel:' . preg_replace('/\s/', '', $phone) . '">' . $phone . '</a>',
];
if ($company) $rows['Business'] = $company;
if ($sector)  $rows['Sector']   = $sector;

foreach ($rows as $label => $value) {
    $html .= '<tr><td style="padding:8px 12px;background:#f9fafb;font-weight:600;width:130px;border-bottom:1px solid #e5e7eb;">' . $label . '</td>';
    $html .= '<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">' . $value . '</td></tr>';
}

$html .= '</table>';
$html .= '<div style="margin-top:20px;padding:16px;background:#f9fafb;border-radius:6px;border:1px solid #e5e7eb;">';
$html .= '<p style="margin:0 0 8px;font-weight:600;">Message:</p>';
$html .= '<p style="margin:0;line-height:1.6;">' . nl2br($message) . '</p>';
$html .= '</div>';
$html .= '<p style="margin-top:20px;font-size:12px;color:#9ca3af;">Sent: ' . date('d/m/Y H:i:s') . ' &nbsp;|&nbsp; IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . '</p>';
$html .= '</div></body></html>';

// Email headers
$boundary = md5(uniqid(rand(), true));

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
$headers .= "From: " . FROM_NAME . " <" . FROM_EMAIL . ">\r\n";
$headers .= "Reply-To: {$first_name} {$last_name} <{$email}>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

$multipart  = "--{$boundary}\r\n";
$multipart .= "Content-Type: text/plain; charset=UTF-8\r\n";
$multipart .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$multipart .= $body . "\r\n\r\n";
$multipart .= "--{$boundary}\r\n";
$multipart .= "Content-Type: text/html; charset=UTF-8\r\n";
$multipart .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$multipart .= $html . "\r\n\r\n";
$multipart .= "--{$boundary}--";

// Send
$sent = mail(TO_EMAIL, $subject, $multipart, $headers);

if ($sent) {
    // Optional: send auto-reply to the customer
    $reply_subject = 'Thanks for contacting Prime-EPOS — we\'ll be in touch shortly';
    $reply_body  = "Hi {$first_name},\n\n";
    $reply_body .= "Thanks for getting in touch with Prime-EPOS. We've received your message and will get back to you shortly — usually within a few hours during business hours.\n\n";
    $reply_body .= "If you need to speak to someone urgently, you can call us on 07947 246247.\n\n";
    $reply_body .= "Best regards,\nThe Prime-EPOS Team\n\n";
    $reply_body .= "---\nPrime-EPOS | 07947 246247 | info@prime-epos.co.uk\n24/7 UK Support";

    $reply_headers  = "From: " . TO_NAME . " <" . TO_EMAIL . ">\r\n";
    $reply_headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    @mail($email, $reply_subject, $reply_body, $reply_headers);

    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to send. Please try again or call us directly.']);
}
?>
