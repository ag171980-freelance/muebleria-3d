# Configurador de Ironwoods

Aplicación en React + Three.js donde el cliente arma su mueble de hierro y madera en
3D, elige medidas, especie, laqueado y color de la estructura, y pide el presupuesto.
El pedido llega con el detalle del mueble, el cómputo de materiales y una foto del
visor.

## De dónde sale la marca

Todo lo de marca está verificado contra ironwoods.com.ar, no inferido del nombre.
Se leyó del CSS que sirve su tema Astra y de los selectores reales de su tienda.

**Paleta** (sus variables `--ast-global-color-N`): `#151616` casi negro (es el fondo
de sus botones, encabezado y pie), `#393C40`, `#65696F`, `#737880`, `#F6F6F6` y
blanco. Es **monocromática**: no tienen color de acento. La única calidez de la
página viene de la madera del visor, y la interfaz se mantiene neutra a propósito
para no pelearle el protagonismo.

Una sola desviación: su gris más claro, `#737880`, da 4,11 de contraste sobre
`#F6F6F6` y no llega al mínimo de 4,5 de WCAG AA para texto chico. Para `--tinta-3`
se usa `#676C72`, el mismo gris dos pasos más oscuro, que da 4,90.

**Tipografías**: **DM Sans** 400/500 en interfaz y **Unna** 400 en títulos, que es
exactamente lo que cargan (`h1..h6, .site-title` van en Unna). Son las dos del
`fonts.googleapis.com` de su `<head>`.

**Radio de borde**: 3px, que es el que usan en casi todo (70 apariciones contra 14
de 0px). Casi recto, como corresponde a un mueble de hierro.

**Construcción**, de sus fichas de producto:

| Dato | Valor |
| --- | --- |
| Caño de escritorios | 30×60 |
| Caño de rack | 25×25 |
| Caño de estantería | 20×20 |
| Pintura | Epoxi al horno, blanca o negra |
| Especies | Eucalipto o pino, maciza |
| Espesores | 30 mm en tapas, 20 mm en estantes y cuerpos |
| Laqueados | Natural, Roble claro, Cedro, Roble oscuro, Nogal |

Los hexadecimales de cada laqueado son aproximaciones de pantalla, no una carta de
color calibrada, y la pantalla lo aclara.

## La pata de los escritorios

En las fotos de la marca la pata **no son cuatro postes sueltos**: es un marco
rectangular cerrado de caño chato por cada extremo, con la cara ancha de costado
y el travesaño de abajo apoyado en el piso. Los dos marcos se unen con un
travesaño largo atrás, y adelante no va nada porque ahí van las rodillas. El
escritorio en L lleva un tercer marco en la punta del retorno.

El marco llega del herrero **soldado y entero**, así que en el código es un
`Conjunto` (`src/lib/geometria.ts`): un grupo de caños que cuenta como **una
sola pieza**. Eso significa que:

- En la **lista de corte** sale un renglón, "Marco de hierro", con la medida del
  marco entero. No cuatro renglones de barras que nadie pide por separado.
- Al **desarmar**, el marco se acuesta en el piso de una pieza.
- Al **pasarle el puntero**, se señala el marco completo, no una barra suelta.

La pata recta sí son cuatro caños sueltos, y en ese caso van como piezas
independientes.

`PATAS` en `src/data/marca.ts` ofrece tres terminaciones:

| Id | Qué es |
| --- | --- |
| `marco` | Marco cerrado, el de la marca. Es el que viene por defecto |
| `marco-u` | El mismo marco sin el travesaño del piso |
| `recta` | Cuatro postes sueltos |

La bandeja para la CPU apoya **dentro del marco izquierdo**, sobre el travesaño
de abajo, como en sus fotos: no va colgada bajo la tapa.

Esto aplica solo a la distribución `escritorio`, que es donde hay fotos que lo
muestren. El rack y las mesas de luz siguen con patas de caño sueltas.

## Las tarjetas del catálogo

Las tarjetas copian las de la tienda de la marca: vista previa, nombre y debajo
los **chips de opciones** (estructura, especie, medida y laqueado), con el
elegido marcado oscureciendo el borde, sin relleno.

Lo que se elige en la tarjeta se ve **al toque en la vista previa 3D** y viaja al
configurador, así el cliente no tiene que volver a elegir lo mismo adentro:
`elegirModelo(modeloId, ajustes)` arranca desde la configuración inicial del
modelo y le aplica encima lo que vino de la tarjeta.

Las medidas de los chips son las que la marca publica en su tienda y están en
`medidas` dentro de cada modelo en `src/data/modelos.ts`. El configurador deja
moverse entre medidas porque fabrican a medida; los chips son el punto de
partida.

## El configurador va por pasos

El panel es un asistente, no una pila de pestañas. Los pasos están en
`src/ui/pasos.ts`:

1. **Medidas**: ancho, alto, profundidad y espesor
2. **Madera**: especie y laqueado
3. **Hierro**: color de la pintura, terminación de la pata o base
4. **Interior**: cajones, puertas, estantes y tiradores
5. **Pedido**: repaso, cómputo, despiece, guardar y formulario

El cuarto paso **no aparece** si el mueble no tiene nada adentro, y **cambia de
nombre a "Agregados"** cuando lo único que se suma es la bandeja para la CPU:
llamarle "Interior" a eso hace buscar cajones que no existen.

El último paso abre con un **repaso** de lo elegido donde cada línea tiene un
"Cambiar" que vuelve al paso donde se decidió. Sin eso, corregir una medida al
final obliga a buscar en qué paso estaba, que es lo que hace sentir laberíntico
a un configurador.

El indicador de pasos baja de renglón cuando no entra en una línea, en vez de
truncar los nombres. El botón "Desarmar" del visor lleva al paso del pedido y
abre el despiece.

**Una etiqueta por control.** El panel tenía el título del grupo y encima la
etiqueta del campo diciendo casi lo mismo ("COLOR DEL HIERRO" y debajo "Pintura
epoxi al horno"), más dos textos de ayuda por grupo. Eso hacía el panel alto y
confuso. Ahora el título del grupo **es** la etiqueta: el campo la lleva igual
pero con `etiquetaOculta`, que la deja para el lector de pantalla y la saca de
la vista. Lo que sobraba era repetirla a la vista, no la etiqueta en sí.

## Estructura, madera y laqueado

La marca separa tres cosas que no son lo mismo, y el configurador las mantiene
separadas:

- **Especie** (`maderaId`): eucalipto o pino. Define la veta y los nudos, no el color.
  El pino muestra nudos; el eucalipto no.
- **Laqueado** (`acabadoId`): es el que lleva el **color**. Los cinco tonos de su
  selector.
- **Estructura** (`estructuraId`): negra o blanca. Patas, travesaños, rieles y
  tiradores van **todos** en esa pintura epoxi: en un mueble de hierro y madera el
  herraje es parte del hierro, así que no hay una elección aparte de terminación del
  metal.

En `materiales.ts`, el color final es el del laqueado corregido por el tinte de la
especie, porque el pino tira a amarillo y el eucalipto a rosado incluso debajo de la
laca.

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

## Datos de la marca

`src/data/marca.ts`, constante `MARCA`: nombre, bajada, sello, WhatsApp, Instagram y
sitio. El WhatsApp y el Instagram son los que publica el sitio. **No encontré un mail
publicado**, así que `email` queda vacío y el pie no lo muestra: cuando lo
confirmen, se completa ahí y aparece solo.

El mismo archivo tiene `ESTRUCTURAS` (los dos colores de epoxi) y `CANIO` (las
secciones de caño de cada familia de mueble).

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

## El ambiente del visor

El mueble no flota en un vacio de color: hay un **piso** y una **pared** detras,
en `src/three/Escenario.tsx`. Sin eso no se lee la escala ni se entiende que es
un mueble en un ambiente.

La pared se dibuja **de una sola cara**, mirando al frente. Cuando el cliente gira
la camara para ver el mueble por atras, la pared desaparece sola en vez de
taparle la vista. Es el mismo truco de un decorado de teatro.

Los colores salen de `AMBIENTE` en `src/lib/tema.ts`. La pared va casi blanca y el
piso bastante más oscuro, y no es solo gusto: la estructura es hierro pintado de
negro o de blanco, y **la pata se ve parada contra la pared, no contra el piso**.
Con la pared clara el hierro negro se recorta; con el piso oscuro, el blanco.

Dos cosas que conviene saber si se tocan esos valores:

- **Son albedo, no el gris que sale en pantalla.** El piso mira de frente al foco,
  así que la luz lo levanta bastante: para que se vea gris medio hay que pintarlo
  bastante más oscuro de lo que uno esperaría.
- **En modo oscuro no hay valor de piso que salve al hierro negro**: da 1,1 de
  contraste, es negro sobre negro. Por eso ahí el contraste lo carga la pared, que
  va bastante más clara que el resto del tema.

La pared **no recibe sombra**. El mapa de sombras cubre solo el entorno del
mueble, y donde se termina, Three repite el último texel: sobre una pared grande
eso pinta un triángulo oscuro con borde recto que se nota enseguida. En el piso
la sombra sí vale la pena.

## Cotas

El visor muestra siempre el **ancho, el alto y la profundidad** alrededor del
mueble (`src/three/Cotas.tsx`). La linea va en 3D y el numero en una etiqueta
HTML encima del lienzo, asi el texto se lee derecho y del mismo tamaño sin
importar desde donde mire la camara, que es como se leen las cotas de un plano.

Las cotas se esconden cuando el mueble esta desarmado: miden la caja del mueble
armado, y con las piezas en el piso no hay caja que medir.

Como las cotas se dibujan **por fuera** del mueble, el encuadre de camara usa un
margen mas holgado que el minimo (1,24 en vez de 1,05): con el encuadre justo
quedaban cortadas contra el borde del lienzo.

## Despiece

El botón **Desarmar** del visor separa el mueble en sus piezas, y el paso del
pedido trae la lista de corte: cada pieza con su largo, ancho y espesor en
milímetros, agrupada por medida igual. La lista se baja como CSV para mandársela
a quien hace los cortes.

Con el mueble desarmado, **pasando el puntero por una pieza aparece un cartel
sobre ella** con su nombre y su medida, se le dibuja el contorno y se resalta su
fila en la lista. Al revés también: señalando una fila de la lista se resalta la
pieza en el 3D. El dato sigue apareciendo además en la franja de abajo.

El cartel y las cotas se declaran con `pointerEvents: 'none'`, también en el
contenedor que arma drei: un cartel que capture el puntero se pondría encima de
la pieza y el hover entraría en un ciclo de aparecer y desaparecer.

El despiece **no explota en el aire**: las piezas se vacían sobre el piso del
taller. `acostarEnElPiso()` en `src/lib/geometria.ts` apoya cada una de plano (el
lado más finito pasa a ser el alto), las ordena de mayor a menor y las acomoda en
filas hasta llenar el ancho de la tirada, centrando el conjunto en el origen.

Cada pieza guarda su destino en el campo `tendido` (posición y giro), y el visor
interpola **posición y giro a la vez**, así la pieza se ve bajar y darse vuelta en
el mismo movimiento. Los frentes de cajón y las hojas de puerta viajan con su
tirador puesto, como salen del taller.

Las medidas del despiece son las reales de corte: ya tienen descontadas las luces
entre frentes y el espesor de las placas. La agrupación la hace
`listaDePiezas()` en `src/lib/piezas.ts`, con la misma clave que usa el taller
(mismo nombre y misma medida).

## Agregar un mueble al catálogo

1. Agregá la entrada en `src/data/modelos.ts` con sus rangos de medidas, qué grupos de
   ajustes muestra el panel y la configuración inicial.
2. Elegí su `distribucion`. Las que hay cubren todo el catálogo actual:

   | Distribución | Qué arma | Muebles |
   | --- | --- | --- |
   | `escritorio` | Tapa sobre bastidor de hierro, con retorno en L y bandeja de CPU opcionales | Escritorios y Mesa Clásica |
   | `estanteria-hierro` | Parantes de hierro con estantes pasantes, sin cuerpo cerrado | Estantería |
   | `columnas` | Cuerpo con cajonera a un lado y puertas al otro | Rack TV |
   | `cajones` | Cuerpo cerrado con cajones a la vista | Cajonera Móvil, Mesa de Luz |
   | `placar` | Cuerpo con cajones abajo y puertas arriba | (sin uso en este catálogo) |
   | `estantes` | Cuerpo cerrado con estantes | (sin uso en este catálogo) |

   El escritorio en L se marca con `retornoEnL: true` en el modelo, no con un `if`
   sobre el id.
3. Si el mueble necesita una geometría nueva, agregá la rama en `armar()` dentro de
   `src/lib/geometria.ts`.

No hace falta tocar el 3D ni el presupuesto: ambos leen el despiece que devuelve
`armar()`.

## Cómo está armado

```
src/
  data/        Catálogo: marca, modelos, maderas, herrajes y datos de corte
    marca.ts       Identidad, contacto, colores de estructura y secciones de caño
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

## Qué quedó del configurador anterior

Las distribuciones `placar` y `estantes` siguen en el código pero ningún mueble del
catálogo las usa: Ironwoods no vende placards. Quedaron porque funcionan y porque
volver a enchufarlas es agregar una entrada en `modelos.ts`.

Las puertas **corredizas** y la **grilla de cajones** sí se siguen usando: el Rack TV
ofrece hojas batientes o corredizas, y los cajones se configuran a lo alto y a lo
ancho en el rack y la cajonera.

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
