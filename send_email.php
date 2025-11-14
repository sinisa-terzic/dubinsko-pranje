<?php
// send_email.php - Perfect Shine Mail Server Version

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set content type and character encoding
header('Content-Type: application/json; charset=utf-8');

// Check if PHPMailer files exist
$phpmailer_path = 'phpmailer/src/';
$required_files = [
    'Exception.php',
    'PHPMailer.php',
    'SMTP.php'
];

foreach ($required_files as $file) {
    if (!file_exists($phpmailer_path . $file)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Server error: PHPMailer files missing - ' . $file
        ]);
        exit;
    }
}

// Include PHPMailer files
require $phpmailer_path . 'Exception.php';
require $phpmailer_path . 'PHPMailer.php';
require $phpmailer_path . 'SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get and sanitize form data
    $subject = trim($_POST['subject'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $message = trim($_POST['message'] ?? '');

    // Basic validation
    if (empty($subject) || empty($phone) || empty($message)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Sva polja su obavezna.'
        ]);
        exit;
    }

    // Validate phone number (basic check)
    if (!preg_match('/^[+]?[0-9\s\-\(\)]{6,20}$/', $phone)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Unesite ispravan broj telefona.'
        ]);
        exit;
    }

    try {
        $mail = new PHPMailer(true);

        // ==================== PERFECT SHINE MAIL SERVER KONFIGURACIJA ====================
        $mail->isSMTP();
        $mail->Host = 'mail.perfectshine.me'; // Tvoj mail server
        $mail->SMTPAuth = true;
        $mail->Username = 'info@perfectshine.me'; // PUN email address kao username
        $mail->Password = 'I(zb7@L84chGP9'; // Tvoja šifra
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // Probaj STARTTLS prvo
        $mail->Port = 587; // Standardni SMTP port

        // Alternative portovi ako 587 ne radi
        $alternative_ports = [587, 465, 25];
        $mail_sent = false;
        $last_error = '';

        foreach ($alternative_ports as $port) {
            try {
                $mail->Port = $port;

                // Probaj različite enkripcije
                if ($port == 465) {
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL
                } else {
                    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // TLS
                }

                // Debug settings (set to 2 for detailed output)
                $mail->SMTPDebug = 0;
                $mail->Debugoutput = 'error_log';

                // ==================== POŠILJALAC I PRIMALAC ====================
                $mail->setFrom('info@perfectshine.me', 'Perfect Shine Contact Form');
                $mail->addAddress('info@perfectshine.me', 'Perfect Shine'); // Šalje SAMO na info@perfectshine.me
                $mail->addReplyTo('info@perfectshine.me', 'Perfect Shine');

                // ==================== EMAIL SADRŽAJ ====================
                $mail->isHTML(true);
                $mail->Subject = "Perfect Shine Contact: " . $subject;
                $mail->CharSet = 'UTF-8';
                $mail->Encoding = 'base64';

                // HTML verzija emaila
                $emailBody = "
                <!DOCTYPE html>
                <html lang='sr'>
                <head>
                    <meta charset='UTF-8'>
                    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                    <title>Nova poruka - Perfect Shine</title>
                    <style>
                        body { 
                            font-family: 'Arial', sans-serif; 
                            line-height: 1.6; 
                            color: #333; 
                            margin: 0; 
                            padding: 20px; 
                            background-color: #f4f4f4;
                        }
                        .container { 
                            max-width: 600px; 
                            margin: 0 auto; 
                            background: white; 
                            padding: 30px; 
                            border-radius: 10px; 
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                        .header { 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            padding: 25px; 
                            border-radius: 8px; 
                            margin-bottom: 25px; 
                            text-align: center;
                            color: white;
                        }
                        .header h2 { 
                            margin: 0; 
                            font-size: 24px; 
                            font-weight: bold;
                        }
                        .field { 
                            margin-bottom: 20px; 
                            padding: 15px; 
                            background: #f8f9fa; 
                            border-radius: 8px; 
                            border-left: 4px solid #667eea;
                        }
                        .label { 
                            font-weight: bold; 
                            color: #2c3e50; 
                            display: block; 
                            margin-bottom: 8px; 
                            font-size: 16px;
                        }
                        .message-content { 
                            padding: 15px; 
                            background: white; 
                            border: 1px solid #e1e5e9; 
                            border-radius: 6px; 
                            white-space: pre-line;
                        }
                        .footer { 
                            margin-top: 25px; 
                            padding-top: 20px; 
                            border-top: 3px solid #667eea; 
                            font-size: 13px; 
                            color: #7f8c8d; 
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>📧 Nova poruka sa Perfect Shine sajta</h2>
                        </div>
                        
                        <div class='field'>
                            <span class='label'>📋 Tema:</span>
                            <div style='font-size: 16px; padding: 5px 0;'>" . htmlspecialchars($subject) . "</div>
                        </div>
                        
                        <div class='field'>
                            <span class='label'>📞 Telefon:</span>
                            <div style='font-size: 16px; padding: 5px 0;'>" . htmlspecialchars($phone) . "</div>
                        </div>
                        
                        <div class='field'>
                            <span class='label'>💬 Poruka:</span>
                            <div class='message-content'>" . nl2br(htmlspecialchars($message)) . "</div>
                        </div>
                        
                        <div class='footer'>
                            <p><strong>Perfect Shine Contact Form</strong></p>
                            <p>Poruka poslana: " . date('d.m.Y H:i:s') . "</p>
                            <p>Sa: https://perfectshine.me</p>
                            <p><em>Ovo je automatski generisana poruka sa kontakt forme.</em></p>
                        </div>
                    </div>
                </body>
                </html>
                ";

                $mail->Body = $emailBody;

                // Plain text verzija
                $mail->AltBody = "NOVA PORUKA SA PERFECT SHINE SAJTA\n\n" .
                    "Tema: " . $subject . "\n" .
                    "Telefon: " . $phone . "\n" .
                    "Poruka:\n" . $message . "\n\n" .
                    "Poslato: " . date('d.m.Y H:i:s') . "\n" .
                    "Ovo je automatski generisana poruka sa kontakt forme.";

                // ==================== SLANJE EMAILA ====================
                $mail->send();
                $mail_sent = true;
                break; // Uspešno poslato, prekini loop

            } catch (Exception $e) {
                $last_error = $e->getMessage();
                error_log("Port $port failed: " . $last_error);
                continue; // Probaj sledeći port
            }
        }

        if ($mail_sent) {
            // Uspešan odgovor
            echo json_encode([
                'success' => true,
                'message' => 'Poruka je uspješno poslana! Kontaktiraćemo vas uskoro.'
            ]);
        } else {
            // Svi portovi failed
            throw new Exception("Svi portovi failed: " . $last_error);
        }
    } catch (Exception $e) {
        // Logovanje greške
        error_log("Perfect Shine Mail Server Error: " . $e->getMessage());

        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Došlo je do greške prilikom slanja poruke. Pokušajte ponovo kasnije. (' . $e->getMessage() . ')'
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Metoda nije dozvoljena.'
    ]);
}
