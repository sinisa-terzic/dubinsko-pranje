<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Prikupljanje podataka iz forme
    $subject = htmlspecialchars(trim($_POST['subject']));
    $phone = htmlspecialchars(trim($_POST['phone']));
    $message = htmlspecialchars(trim($_POST['message']));

    // Vaša email adresa na koju želite da se podaci šalju
    $to = "sinisat@t-com.me";  // Zamijenite sa vašim emailom

    // Naslov emaila
    $email_subject = "Novi kontakt - " . $subject;

    // Sadržaj emaila
    $email_message = "Primili ste novu poruku putem kontakt forme.\n\n";
    $email_message .= "Predmet: " . $subject . "\n";
    $email_message .= "Telefon: " . $phone . "\n";
    $email_message .= "Poruka:\n" . $message . "\n";

    // Zaglavlja
    $headers = "From: no-reply@yourdomain.com\r\n";  
    $headers .= "Reply-To: no-reply@yourdomain.com\r\n";  

    // Slanje emaila
    if (mail($to, $email_subject, $email_message, $headers)) {
        echo "Poruka je uspješno poslana!";
    } else {
        echo "Došlo je do greške prilikom slanja poruke.";
    }
}
?>
