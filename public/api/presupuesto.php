<?php
/**
 * Recibe los pedidos de presupuesto del configurador.
 *
 * Guarda cada pedido en api/data/pedidos/<referencia>.json, la miniatura del
 * mueble en api/data/pedidos/<referencia>.png, la hoja para imprimir en
 * api/data/pedidos/<referencia>.pdf, y agrega una linea al indice
 * api/data/pedidos.csv para abrirlo con una planilla.
 *
 * La hoja llega en un segundo POST, porque recien despues de responder este
 * endpoint el navegador sabe que numero de pedido imprimir.
 *
 * Para que llegue un aviso por mail, completar DESTINATARIO y dejar
 * AVISAR_POR_MAIL en true. En XAMPP local el mail no sale si no esta
 * configurado sendmail: el pedido igual queda guardado en disco.
 */

declare(strict_types=1);

const AVISAR_POR_MAIL = false;
const DESTINATARIO = 'presupuestos@example.com';
const LIMITE_BYTES = 3 * 1024 * 1024;
/** Ventana para subir la hoja del pedido recien registrado, en segundos. */
const PLAZO_HOJA = 600;

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
if (!is_array($pedido)) {
    responder(400, ['ok' => false, 'error' => 'El pedido no tiene el formato esperado.']);
}

$base = __DIR__ . '/data';
$carpeta = $base . '/pedidos';

/**
 * Guarda la hoja del pedido. Solo se acepta para un pedido que exista, que
 * todavia no tenga hoja y que se haya registrado recien: asi la direccion no
 * sirve para pisar hojas viejas probando numeros al azar.
 */
if (($pedido['accion'] ?? '') === 'pdf') {
    $referencia = (string)($pedido['referencia'] ?? '');
    if (preg_match('/^\d{8}-[0-9A-F]{6}$/', $referencia) !== 1) {
        responder(400, ['ok' => false, 'error' => 'El numero de pedido no es valido.']);
    }
    $archivoRegistro = $carpeta . '/' . $referencia . '.json';
    $hoja = $carpeta . '/' . $referencia . '.pdf';
    if (!is_file($archivoRegistro) || file_exists($hoja) || time() - (int)filemtime($archivoRegistro) > PLAZO_HOJA) {
        responder(409, ['ok' => false, 'error' => 'Ese pedido ya no admite una hoja nueva.']);
    }
    $binario = base64_decode((string)($pedido['pdf'] ?? ''), true);
    if ($binario === false || strncmp($binario, '%PDF-', 5) !== 0 || strlen($binario) > LIMITE_BYTES) {
        responder(422, ['ok' => false, 'error' => 'La hoja no llego como un PDF.']);
    }
    if (file_put_contents($hoja, $binario, LOCK_EX) === false) {
        responder(500, ['ok' => false, 'error' => 'No se pudo guardar la hoja.']);
    }
    responder(200, ['ok' => true, 'referencia' => $referencia, 'hoja' => $referencia . '.pdf']);
}

if (!isset($pedido['contacto'], $pedido['config'])) {
    responder(400, ['ok' => false, 'error' => 'El pedido no tiene el formato esperado.']);
}

$contacto = is_array($pedido['contacto']) ? $pedido['contacto'] : [];
$nombre = trim((string)($contacto['nombre'] ?? ''));
$telefono = trim((string)($contacto['telefono'] ?? ''));
if ($nombre === '' || $telefono === '') {
    responder(422, ['ok' => false, 'error' => 'Hace falta el nombre y un telefono de contacto.']);
}

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
