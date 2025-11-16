<?php

/**
 * SEND_EMAIL.PHP - CONTACT FORM HANDLER WITH SECURITY & VALIDATION
 * 
 * FEATURES:
 * - SMTP email sending with PHPMailer
 * - Server-side validation
 * - Anti-spam protection (honeypot + rate limiting)
 * - Security measures (input sanitization, XSS protection)
 * - JSON responses for AJAX handling
 */

// Enable error reporting for development
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json; charset=utf-8');

// Load environment variables for SMTP credentials
$env_file = __DIR__ . '/.env';
if (file_exists($env_file)) {
    $env_vars = parse_ini_file($env_file);
    foreach ($env_vars as $key => $value) {
        $_ENV[$key] = $value;
    }
}

// Include PHPMailer classes
require 'phpmailer/src/Exception.php';
require 'phpmailer/src/PHPMailer.php';
require 'phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Start session for rate limiting
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * HONEYPOT SPAM PROTECTION
 * - Checks for hidden form field filled by bots
 * - Returns success to confuse spam bots
 */
if (!empty($_POST['website'])) {
    // Silent treatment for bots - return success to confuse them
    echo json_encode(['success' => true, 'message' => 'Poruka je uspješno poslana!']);
    exit;
}

/**
 * RATE LIMITING PROTECTION
 * - Prevents spam by limiting submissions to 1 per 30 seconds
 * - Uses session to track last submission time
 */
$lastSubmission = $_SESSION['last_form_submission'] ?? 0;
if (time() - $lastSubmission < 30) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Molimo sačekajte 30 sekundi prije slanja nove poruke.'
    ]);
    exit;
}

/**
 * MAIN FORM PROCESSING
 * - Handles POST requests only
 * - Validates and sanitizes input
 * - Sends email via SMTP
 */
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    /**
     * INPUT SANITIZATION
     * - Trims whitespace
     * - Converts special characters to HTML entities
     * - Prevents XSS attacks
     */
    $subject = trim(htmlspecialchars($_POST['subject'] ?? '', ENT_QUOTES, 'UTF-8'));
    $phone = trim(htmlspecialchars($_POST['phone'] ?? '', ENT_QUOTES, 'UTF-8'));
    $message = trim(htmlspecialchars($_POST['message'] ?? '', ENT_QUOTES, 'UTF-8'));

    /**
     * SERVER-SIDE VALIDATION
     * - Validates each field for required, length, and format
     * - Returns specific error messages for each validation failure
     */
    $errors = [];

    // Subject validation
    if (empty($subject)) {
        $errors[] = 'Tema je obavezna.';
    } elseif (strlen($subject) < 2) {
        $errors[] = 'Tema mora imati najmanje 2 karaktera.';
    } elseif (strlen($subject) > 100) {
        $errors[] = 'Tema ne smije biti duža od 100 karaktera.';
    }

    // Phone validation
    if (empty($phone)) {
        $errors[] = 'Broj telefona je obavezan.';
    } elseif (!preg_match('/^[\d\s\+\-\(\)]{6,20}$/', $phone)) {
        $errors[] = 'Unesite ispravan broj telefona.';
    }

    // Message validation
    if (empty($message)) {
        $errors[] = 'Poruka je obavezna.';
    } elseif (strlen($message) < 5) {
        $errors[] = 'Poruka mora imati najmanje 5 karaktera.';
    } elseif (strlen($message) > 2000) {
        $errors[] = 'Poruka ne smije biti duža od 2000 karaktera.';
    }

    /**
     * ANTI-SPAM PATTERN DETECTION
     * - Checks for common spam patterns in content
     * - Blocks messages containing URLs, spam keywords, etc.
     */
    $spamPatterns = [
        '/http(s)?:\/\//i',
        '/\[url\]/i',
        '/www\./i',
        '/viagra|cialis|porn|casino|loan/i',
        '/[a-z0-9]{30,}/i' // Very long words/sequences
    ];

    $fullText = $subject . ' ' . $message;
    foreach ($spamPatterns as $pattern) {
        if (preg_match($pattern, $fullText)) {
            $errors[] = 'Poruka sadrži nedozvoljene karaktere.';
            break;
        }
    }

    // Return validation errors if any
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $errors[0]]);
        exit;
    }

    /**
     * EMAIL SENDING WITH PHPMailer
     * - Uses SMTP authentication
     * - Sends both HTML and plain text versions
     * - Includes proper encoding and security headers
     */
    try {
        $mail = new PHPMailer(true);

        // SMTP Configuration from environment variables
        $mail->isSMTP();
        $mail->Host = $_ENV['SMTP_HOST'] ?? 'mail.perfectshine.me';
        $mail->SMTPAuth = true;
        $mail->Username = $_ENV['SMTP_USER'] ?? 'info@perfectshine.me';
        $mail->Password = $_ENV['SMTP_PASS'] ?? '';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $_ENV['SMTP_PORT'] ?? 587;
        $mail->Timeout = 15;
        $mail->SMTPDebug = 0; // Set to 0 for production

        // Email headers and addressing
        $mail->setFrom($_ENV['SMTP_USER'] ?? 'info@perfectshine.me', 'Perfect Shine Contact Form');
        $mail->addAddress('info@perfectshine.me', 'Perfect Shine');
        $mail->addReplyTo($_ENV['SMTP_USER'] ?? 'info@perfectshine.me', 'Perfect Shine');

        // Email content and formatting
        $mail->isHTML(true);
        $mail->Subject = "📧 Perfect Shine Contact: " . $subject;
        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';

        /**
         * HTML EMAIL TEMPLATE
         * - Professional styling
         * - Clear information presentation
         * - Responsive design
         */
        $emailBody = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { background: #fdc64a; padding: 25px; border-radius: 10px 10px 0 0; text-align: center; color: #333; }
                .field { margin: 0; padding: 20px; border-bottom: 1px solid #eee; }
                .field:last-child { border-bottom: none; }
                .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1 style='margin: 0;'>📧 Nova poruka</h1>
                    <p style='margin: 5px 0 0 0; opacity: 0.9;'>Perfect Shine Website Contact Form</p>
                </div>
                
                <div class='field'>
                    <strong style='color: #fdc64a;'>📋 Tema:</strong><br>
                    <div style='margin-top: 8px; padding: 10px; background: #f8f9fa; border-radius: 5px;'>" . $subject . "</div>
                </div>
                
                <div class='field'>
                    <strong style='color: #fdc64a;'>📞 Telefon:</strong><br>
                    <div style='margin-top: 8px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 18px;'>" . $phone . "</div>
                </div>
                
                <div class='field'>
                    <strong style='color: #fdc64a;'>💬 Poruka:</strong><br>
                    <div style='margin-top: 8px; padding: 15px; background: #f8f9fa; border-radius: 5px; white-space: pre-line;'>" . nl2br($message) . "</div>
                </div>
                
                <div class='footer'>
                    <p>Poruka poslana: " . date('d.m.Y H:i:s') . " | IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown') . "</p>
                    <p><strong>Perfect Shine</strong> - Dubinsko pranje Tivat, Kotor, Budva</p>
                </div>
            </div>
        </body>
        </html>
        ";

        $mail->Body = $emailBody;

        /**
         * PLAIN TEXT EMAIL VERSION
         * - For email clients that don't support HTML
         * - Same information as HTML version
         */
        $mail->AltBody = "NOVA PORUKA SA PERFECT SHINE SAJTA\n\n" .
            "Tema: " . $subject . "\n" .
            "Telefon: " . $phone . "\n" .
            "Poruka:\n" . $message . "\n\n" .
            "Poslato: " . date('d.m.Y H:i:s') . "\n" .
            "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'Unknown');

        /**
         * SEND EMAIL AND HANDLE RESPONSE
         * - Updates rate limiting on success
         * - Returns appropriate JSON response
         */
        if ($mail->send()) {
            $_SESSION['last_form_submission'] = time();
            echo json_encode([
                'success' => true,
                'message' => 'Poruka je uspješno poslana! Kontaktiraćemo vas uskoro.'
            ]);
        } else {
            throw new Exception('Mailer failed to send');
        }
    } catch (Exception $e) {
        /**
         * ERROR HANDLING
         * - Logs errors for debugging
         * - Returns user-friendly error message
         * - Includes fallback contact information
         */
        error_log("Perfect Shine Email Error [" . date('Y-m-d H:i:s') . "]: " . $e->getMessage());

        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Došlo je do greške prilikom slanja poruke. Pokušajte ponovo kasnije ili nas pozovite na +382 68 069 211'
        ]);
    }
} else {
    /**
     * METHOD NOT ALLOWED HANDLING
     * - Returns error for non-POST requests
     */
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metoda nije dozvoljena.']);
}
