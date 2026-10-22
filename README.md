# Configurador de muebles a medida

Aplicación en React + Three.js donde el cliente arma su mueble en 3D, elige medidas,
madera, cajones y herrajes, y pide el presupuesto. El pedido le llega al carpintero
con el detalle del mueble, el cómputo de materiales y una foto del visor.

## Poner a andar el proyecto

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/ para revisarlo antes de subir
```

## Publicar en XAMPP

`npm run build` deja todo en `dist/`, incluido el endpoint PHP. Copiá el contenido
de `dist/` a la carpeta pública de Apache:

```bash
npm run build
cp -r dist/* /c/xampp/htdocs/muebleria-publico/
```

El sitio funciona con rutas relativas (`base: './'` en `vite.config.ts`), así que
anda igual en la raíz del dominio o en un subdirectorio.

En el servidor de desarrollo de Vite el PHP **no** se ejecuta. El formulario lo
detecta: si no puede contactar al endpoint, descarga el pedido como archivo JSON y
le ofrece al cliente mandarlo por WhatsApp. No se pierde ningún pedido.

## Dónde caen los pedidos

`api/presupuesto.php` guarda cada pedido en tres lugares:

| Archivo | Para qué sirve |
| --- | --- |
| `api/data/pedidos/<ref>.json` | El pedido completo: configuración, cómputo y contacto |
| `api/data/pedidos/<ref>.png` | Foto del mueble tal como lo dejó el cliente |
| `api/data/pedidos.csv` | Índice para abrir con Excel o LibreOffice |

El script crea un `.htaccess` en `api/data/` que bloquea el acceso web a esa carpeta.
Verificá que Apache tenga `AllowOverride All` para ese directorio, o movelá fuera del
`DocumentRoot`.

Para recibir un aviso por mail, en `public/api/presupuesto.php` poné
`AVISAR_POR_MAIL = true` y completá `DESTINATARIO`. XAMPP local no manda mail sin
configurar sendmail; el pedido queda guardado igual.

## No hay precios en la aplicación

A propósito. El cliente arma el mueble y manda el pedido; el precio lo pone el
carpintero cuando lo recibe. No hay montos en pantalla, ni en el mensaje de
WhatsApp, ni en el archivo que se descarga como respaldo cuando el servidor no
responde.

Lo que sí viaja con el pedido es el **cómputo de materiales**: metros cuadrados de
placa, cuántas placas enteras, metros de tapacanto, bisagras, correderas, tiradores
y peso aproximado. Eso es lo que el taller necesita para cotizar sin volver a medir
nada, y son cantidades, no plata.

`src/data/corte.ts` tiene lo único que queda de ese lado: la medida de la placa
estándar y el desperdicio de corte, que sirven para contar placas.

Si en algún momento querés mostrar un estimado, hay que escribir la función de
precio: el cómputo en `src/lib/computo.ts` ya te da todas las cantidades.

## Datos del taller

`src/lib/guardado.ts`, constante `TALLER`: nombre, bajada, WhatsApp (formato
internacional sin signos, por ejemplo `5491128470193`), email y zona de trabajo.

## Cajones en grilla

Los cajones se configuran en dos ejes: **a lo alto** (filas apiladas, cada una con
su altura) y **a lo ancho** (hasta 3 cajones lado a lado dentro de cada fila).

Cada columna de más agrega su propio **parante**, porque las correderas se amuran a
los costados y sin un parante en el medio no hay dónde atornillarlas. El parante
aparece solo en la lista de corte y en el despiece.

La cantidad de columnas se recorta sola si el mueble no da el ancho: por debajo de
23 cm de luz un cajón no se puede usar, así que `armarGrillaCajones()` baja la
cantidad y la pantalla avisa cuántos entran de verdad.

## Puertas corredizas

Los muebles con puertas ofrecen **batientes** o **corredizas**, y dos modelos del
catálogo vienen con corredizas de fábrica: el `placar-corredizo` y el `aparador`.

Cuando las puertas son corredizas:

- Cada hoja va en **su propio carril**, una por delante de la otra, y las hojas se
  pisan entre sí 35 mm. Al abrirse corren hacia la derecha hasta apilarse contra la
  última, que es lo que hace un placard de riel.
- Las hojas **tapan el frente de punta a punta**, así que los cajones pasan a vivir
  adentro de la caja, detrás de las puertas. Se ven con el botón "Abrir".
- El tirador es **siempre un perfil vertical al ras**, sin importar el herraje
  elegido para los cajones: una perilla que sobresalga choca con la hoja de al lado.
- Se agregan un **riel superior y uno inferior**. Son herraje, no piezas de corte,
  así que no aparecen en la lista de corte.

El conjunto de hojas más el riel se come unos 7 cm de fondo. Eso está contemplado en
la geometría del interior y avisado en pantalla para los placards poco profundos.

## Despiece

El botón **Desarmar** del visor separa el mueble en sus piezas y la pestaña
**Piezas** muestra la lista de corte: cada pieza con su largo, ancho y espesor en
milímetros, agrupada por medida igual. Señalando una fila se resalta la pieza en
el 3D, y al revés: tocando una pieza en el visor se ve su medida en la franja de
abajo. La lista se baja como CSV para mandársela a quien hace los cortes.

Cada pieza declara hacia dónde se aparta en `src/lib/geometria.ts`, en su campo
`desarme`: sale por el eje de su propio espesor, que es como se arma y se desarma
en la realidad. La separación base sale de `pasoDesarme()` y se mide contra el
lado más largo del mueble, así la vista es igual de legible en una mesa de luz que
en un placard.

Las medidas del despiece son las reales de corte: ya tienen descontadas las luces
entre frentes y el espesor de las placas. La agrupación la hace
`listaDePiezas()` en `src/lib/piezas.ts`, con la misma clave que usa el taller
(mismo nombre y misma medida).

## Agregar un mueble al catálogo

1. Agregá la entrada en `src/data/modelos.ts` con sus rangos de medidas, qué grupos de
   ajustes muestra el panel y la configuración inicial.
2. Elegí su `distribucion`. Las cinco existentes cubren la mayoría de los casos:
   `cajones`, `placar`, `estantes`, `columnas` y `mesa`.
3. Si el mueble necesita una geometría nueva, agregá la rama en `armar()` dentro de
   `src/lib/geometria.ts`.

No hace falta tocar el 3D ni el presupuesto: ambos leen el despiece que devuelve
`armar()`.

## Cómo está armado

```
src/
  data/        Catálogo: modelos, maderas, herrajes y datos de corte
  lib/         Lógica sin React
    geometria.ts   Arma el despiece del mueble a partir de la configuración
    cajones.ts     Reparto de alturas de cajones
    computo.ts     Cómputo de materiales
    materiales.ts  Veta de madera generada en canvas, sin archivos externos
    guardado.ts    localStorage, links compartibles y envío del pedido
  three/       Visor 3D, herrajes y vistas previas del catálogo
  ui/          Panel de ajustes, resumen y formulario
  styles/      Tokens de color y tipografía, y la hoja de estilos
```

La pieza central es `armar()` en `src/lib/geometria.ts`: recibe la configuración y
devuelve un despiece declarativo (paneles, cajones, puertas, patas, barrales). El
visor 3D lo dibuja y el presupuesto lo cuenta. Las dos cosas se alimentan de la misma
fuente, así que lo que el cliente ve es exactamente lo que se cotiza.

Todas las medidas internas están en **milímetros**. La conversión a metros para
Three.js se hace al dibujar, y a centímetros al mostrarlas en pantalla.

## Decisiones que conviene conocer

- **No hay texturas ni modelos descargados.** La veta de la madera se dibuja en un
  canvas en tiempo de ejecución y se usa como color, relieve y rugosidad. El mapa de
  entorno sale de `RoomEnvironment` de Three.js. La aplicación funciona sin conexión
  a ningún CDN.
- **El mapa de entorno degrada solo.** Si el navegador cae a WebGL por software y el
  horneado falla, se sigue sin mapa: las luces directas alcanzan y solo se pierde
  brillo en los metales. Los valores de `metalico` de los herrajes están por debajo
  de 0,8 justamente para que nunca se vean negros.
- **Las vistas previas del catálogo son el mueble real**, renderizado en vivo, no
  fotos. Giran solo mientras el puntero está encima, y el resto del tiempo no
  redibujan.
- **El diseño se guarda en tres lados**: un borrador automático en `localStorage`,
  diseños con nombre guardados a mano (los últimos doce), y un link compartible que
  lleva la configuración completa codificada en el hash.

## Accesibilidad y preferencias

- Modo claro y oscuro, con preferencia del sistema y botón para forzar uno.
- `prefers-reduced-motion` desactiva el giro de las vistas previas y vuelve
  instantánea la apertura de cajones y el reencuadre de cámara.
- Etiqueta arriba del campo, error abajo, foco al primer campo con problema al
  enviar el formulario.
