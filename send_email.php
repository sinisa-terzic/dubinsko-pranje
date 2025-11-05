<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Omogući CORS za development
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Funkcija za validaciju email adrese
function isValidEmail($email)
{
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Funkcija za validaciju telefonskog broja
function isValidPhone($phone)
{
    // Dozvoljeni formati: +381 64 123 4567, 064/123-4567, itd.
    $clean_phone = preg_replace('/\s+/', '', $phone);
    return preg_match('/^(\+\d{1,4}[\s\-]?)?(\(?\d{2,4}\)?[\s\-]?)?[\d\s\-]{7,15}$/', $clean_phone);
}

// Funkcija za validaciju imena
function isValidName($name)
{
    return preg_match('/^[a-zA-ZčćžšđČĆŽŠĐ\s]{2,50}$/u', $name);
}

// Funkcija za čišćenje inputa
function cleanInput($data)
{
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

// Inicijalizacija response niza
$response = [
    'success' => false,
    'message' => '',
    'errors' => []
];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        // Proveri da li su sva polja poslana
        $required_fields = ['name', 'email', 'phone', 'subject', 'message'];
        $missing_fields = [];

        foreach ($required_fields as $field) {
            if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
                $missing_fields[] = $field;
            }
        }

        if (!empty($missing_fields)) {
            $response['message'] = 'Molimo popunite sva obavezna polja.';
            foreach ($missing_fields as $field) {
                $response['errors'][] = [
                    'field' => $field,
                    'message' => 'Ovo polje je obavezno.'
                ];
            }
            echo json_encode($response);
            exit;
        }

        // Prikupljanje i čišćenje podataka
        $name = cleanInput($_POST['name']);
        $email = cleanInput($_POST['email']);
        $phone = cleanInput($_POST['phone']);
        $subject = cleanInput($_POST['subject']);
        $message = cleanInput($_POST['message']);

        // Validacija podataka
        $validation_errors = [];

        // Validacija imena
        if (!isValidName($name)) {
            $validation_errors[] = [
                'field' => 'name',
                'message' => 'Ime mora sadržati samo slova i biti između 2 i 50 karaktera.'
            ];
        }

        // Validacija emaila
        if (!isValidEmail($email)) {
            $validation_errors[] = [
                'field' => 'email',
                'message' => 'Unesite ispravnu email adresu.'
            ];
        }

        // Validacija telefona
        if (!isValidPhone($phone)) {
            $validation_errors[] = [
                'field' => 'phone',
                'message' => 'Unesite ispravan broj telefona.'
            ];
        }

        // Validacija naslova
        if (strlen($subject) < 2) {
            $validation_errors[] = [
                'field' => 'subject',
                'message' => 'Naslov mora imati najmanje 2 karaktera.'
            ];
        }

        if (strlen($subject) > 100) {
            $validation_errors[] = [
                'field' => 'subject',
                'message' => 'Naslov ne smije biti duži od 100 karaktera.'
            ];
        }

        // Validacija poruke
        if (strlen($message) < 10) {
            $validation_errors[] = [
                'field' => 'message',
                'message' => 'Poruka mora imati najmanje 10 karaktera.'
            ];
        }

        if (strlen($message) > 1000) {
            $validation_errors[] = [
                'field' => 'message',
                'message' => 'Poruka ne smije biti duža od 1000 karaktera.'
            ];
        }

        // Ako ima grešaka u validaciji
        if (!empty($validation_errors)) {
            $response['message'] = 'Podaci nisu ispravni. Molimo ispravite greške.';
            $response['errors'] = $validation_errors;
            echo json_encode($response);
            exit;
        }

        // Email konfiguracija
        $to = "sinisat@t-com.me";  // zamijeni sa svojim emailom
        $email_subject = "Novi kontakt - " . $subject;

        // Poboljšani sadržaj emaila
        $email_message = "
        Primili ste novu poruku putem kontakt forme.\n\n
        DETALJI PORUKE:\n
        ------------------------\n
        Ime i prezime: {$name}\n
        Email: {$email}\n
        Telefon: {$phone}\n
        Predmet: {$subject}\n
        Vrijeme: " . date('d.m.Y H:i:s') . "\n
        IP adresa: {$_SERVER['REMOTE_ADDR']}\n
        ------------------------\n\n
        PORUKA:\n
        {$message}\n\n
        ------------------------\n
        Ovo je automatska poruka. Molimo ne odgovarajte na ovaj email.
        ";

        // Zaglavlja
        $headers = "From: no-reply@dubinsko-pranje.com\r\n";
        $headers .= "Reply-To: {$email}\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

        // Logovanje prije slanja (opciono za debugging)
        error_log("Attempting to send email to: {$to}");

        // Slanje emaila
        if (mail($to, $email_subject, $email_message, $headers)) {
            $response['success'] = true;
            $response['message'] = 'Poruka je uspješno poslana! Odgovorićemo vam u najkraćem mogućem roku.';
            $response['messageId'] = 'msg_' . time();
        } else {
            throw new Exception('Došlo je do greške prilikom slanja poruke. Pokušajte ponovo.');
        }
    } catch (Exception $e) {
        $response['message'] = $e->getMessage();
        error_log("Email sending error: " . $e->getMessage());
    }
} else {
    $response['message'] = 'Nedozvoljeni metod. Koristite POST.';
}

// Vrati JSON response
echo json_encode($response);
