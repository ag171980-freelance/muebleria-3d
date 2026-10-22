<?php
/**
 * Recibe los pedidos de presupuesto del configurador.
 *
 * Guarda cada pedido en api/data/pedidos/<referencia>.json, la miniatura del
 * mueble en api/data/pedidos/<referencia>.png, y agrega una linea al indice
 * api/data/pedidos.csv para abrirlo con una planilla.
 *
 * Para que llegue un aviso por mail, completar DESTINATARIO y dejar
 * AVISAR_POR_MAIL en true. En XAMPP local el mail no sale si no esta
 * configurado sendmail: el pedido igual queda guardado en disco.
 */

declare(strict_types=1);

const AVISAR_POR_MAIL = false;
const DESTINATARIO = 'presupuestos@tallermendia.com.ar';
const LIMITE_BYTES = 3 * 1024 * 1024;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function responder(int $codigo, array $datos): void
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['ok' => false, 'error' => 'Solo se aceptan pedidos por POST.']);
}

$crudo = file_get_contents('php://input');
if ($crudo === false || $crudo === '') {
    responder(400, ['ok' => false, 'error' => 'El pedido llego vacio.']);
}
if (strlen($crudo) > LIMITE_BYTES) {
    responder(413, ['ok' => false, 'error' => 'El pedido es demasiado grande.']);
}

$pedido = json_decode($crudo, true);
if (!is_array($pedido) || !isset($pedido['contacto'], $pedido['config'])) {
    responder(400, ['ok' => false, 'error' => 'El pedido no tiene el formato esperado.']);
}

$contacto = is_array($pedido['contacto']) ? $pedido['contacto'] : [];
$nombre = trim((string)($contacto['nombre'] ?? ''));
$telefono = trim((string)($contacto['telefono'] ?? ''));
if ($nombre === '' || $telefono === '') {
    responder(422, ['ok' => false, 'error' => 'Hace falta el nombre y un telefono de contacto.']);
}

$base = __DIR__ . '/data';
$carpeta = $base . '/pedidos';
if (!is_dir($carpeta) && !mkdir($carpeta, 0750, true) && !is_dir($carpeta)) {
    responder(500, ['ok' => false, 'error' => 'No se pudo preparar la carpeta de pedidos.']);
}

// Un .htaccess en data/ evita que los pedidos queden expuestos en la web.
$guardia = $base . '/.htaccess';
if (!file_exists($guardia)) {
    @file_put_contents($guardia, "Require all denied\nDeny from all\n");
}

$referencia = date('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));

// La miniatura se guarda aparte: en el JSON ocuparia varios cientos de kilobytes.
$miniatura = (string)($pedido['miniatura'] ?? '');
$archivoImagen = null;
if (preg_match('#^data:image/png;base64,([A-Za-z0-9+/=]+)$#', $miniatura, $partes) === 1) {
    $binario = base64_decode($partes[1], true);
    if ($binario !== false && strlen($binario) < LIMITE_BYTES) {
        $archivoImagen = $referencia . '.png';
        file_put_contents($carpeta . '/' . $archivoImagen, $binario);
    }
}
unset($pedido['miniatura']);

$registro = [
    'referencia' => $referencia,
    'recibido' => date('c'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'imagen' => $archivoImagen,
    'pedido' => $pedido,
];

$guardado = file_put_contents(
    $carpeta . '/' . $referencia . '.json',
    json_encode($registro, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);
if ($guardado === false) {
    responder(500, ['ok' => false, 'error' => 'No se pudo guardar el pedido.']);
}

// Indice plano para revisar los pedidos del mes de un vistazo.
$indice = $base . '/pedidos.csv';
$nuevo = !file_exists($indice);
$planilla = fopen($indice, 'a');
if ($planilla !== false) {
    if ($nuevo) {
        fputcsv($planilla, ['referencia', 'fecha', 'nombre', 'telefono', 'email', 'localidad', 'mueble', 'medidas', 'placas']);
    }
    $resumen = is_array($pedido['resumen'] ?? null) ? $pedido['resumen'] : [];
    fputcsv($planilla, [
        $referencia,
        date('Y-m-d H:i'),
        $nombre,
        $telefono,
        (string)($contacto['email'] ?? ''),
        (string)($contacto['localidad'] ?? ''),
        (string)($resumen['Mueble'] ?? ''),
        (string)($resumen['Medidas'] ?? ''),
        (string)($resumen['Placas'] ?? ''),
    ]);
    fclose($planilla);
}

if (AVISAR_POR_MAIL) {
    $cuerpo = "Nuevo pedido de presupuesto: $referencia\n\n"
        . "Nombre: $nombre\n"
        . 'Telefono: ' . $telefono . "\n"
        . 'Email: ' . (string)($contacto['email'] ?? '') . "\n"
        . 'Localidad: ' . (string)($contacto['localidad'] ?? '') . "\n"
        . 'Plazo: ' . (string)($contacto['plazo'] ?? '') . "\n\n"
        . "Comentarios:\n" . (string)($contacto['comentarios'] ?? '') . "\n\n"
        . 'Diseño: ' . (string)($pedido['enlace'] ?? '') . "\n";
    @mail(DESTINATARIO, "Pedido de presupuesto $referencia - $nombre", $cuerpo);
}

responder(200, ['ok' => true, 'referencia' => $referencia]);
