<?php
// send_email.php - Clean version (only email sending)

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');

// Include PHPMailer files
require 'phpmailer/src/Exception.php';
require 'phpmailer/src/PHPMailer.php';
require 'phpmailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get form data (validation is done in JavaScript)
    $subject = trim($_POST['subject'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $message = trim($_POST['message'] ?? '');

    try {
        $mail = new PHPMailer(true);

        // SMTP Configuration
        $mail->isSMTP();
        $mail->Host = 'mail.perfectshine.me';
        $mail->SMTPAuth = true;
        $mail->Username = 'info@perfectshine.me';
        $mail->Password = 'I(zb7@L84chGP9';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('info@perfectshine.me', 'Perfect Shine Contact Form');
        $mail->addAddress('info@perfectshine.me', 'Perfect Shine');
        $mail->addReplyTo('info@perfectshine.me', 'Perfect Shine');

        $mail->isHTML(true);
        $mail->Subject = "Perfect Shine Contact: " . $subject;
        $mail->CharSet = 'UTF-8';

        // Email content
        $emailBody = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
                .header { background: #667eea; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; color: white; }
                .field { margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>📧 Nova poruka sa Perfect Shine sajta</h2>
                </div>
                <div class='field'><strong>📋 Tema:</strong><br>" . htmlspecialchars($subject) . "</div>
                <div class='field'><strong>📞 Telefon:</strong><br>" . htmlspecialchars($phone) . "</div>
                <div class='field'><strong>💬 Poruka:</strong><br>" . nl2br(htmlspecialchars($message)) . "</div>
                <div style='margin-top: 20px; padding-top: 15px; border-top: 2px solid #667eea; font-size: 12px; color: #666; text-align: center;'>
                    <p>Poruka poslana: " . date('d.m.Y H:i:s') . "</p>
                </div>
            </div>
        </body>
        </html>
        ";

        $mail->Body = $emailBody;
        $mail->AltBody = "NOVA PORUKA\nTema: $subject\nTelefon: $phone\nPoruka:\n$message\n\nPoslato: " . date('d.m.Y H:i:s');

        $mail->send();

        echo json_encode([
            'success' => true,
            'message' => 'Poruka je uspješno poslana! Kontaktiraćemo vas uskoro.'
        ]);
    } catch (Exception $e) {
        error_log("Email Error: " . $e->getMessage());

        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Došlo je do greške prilikom slanja poruke. Pokušajte ponovo kasnije.'
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metoda nije dozvoljena.']);
}
