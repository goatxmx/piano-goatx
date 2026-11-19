# Piano GoatX 🎹

Web **gratuita** para aprender piano a tu ritmo, en español y para todas las edades.
Escucha tu propio instrumento (como Simply Piano) y aprende en pasos cortos con racha y
XP (como Duolingo).

- **Gratis y sin cuentas.** Sin muros de pago, sin anuncios, nunca.
- **Con tu piano o sin ninguno.** Micrófono, teclado MIDI por USB o el teclado de la pantalla.
- **Privado por diseño.** El audio del micrófono se procesa en tu navegador y **nunca sale de tu dispositivo**.
- **Funciona offline** (PWA instalable) y es ligera, pensada para celulares de gama media.

> Sub-marca de **GoatX**. Dominio sugerido: `piano.goatx.mx`.

---

## Cómo correrlo

Requiere Node 20+ y npm.

```bash
npm install
npm start           # http://localhost:4200
```

El **micrófono y el MIDI necesitan HTTPS**. Para probar desde el celular con tu piano real:

```bash
npm start -- --ssl --host 0.0.0.0
```

Luego abre `https://<IP-de-tu-compu>:4200` en el teléfono (acepta el certificado).

### Build de producción

```bash
npm run build       # genera dist/ con PWA + service worker
```

---

## Estructura

```
src/app/
  core/        # motor de audio y progreso (notes, note-input, synth, progress)
  data/        # contenido de lecciones (lessons.ts)
  ui/          # componentes propios: piano-keyboard, staff, button, icon, progress-bar, streak-badge
  features/    # home, setup, lesson, complete, estilos
styles/        # tokens.scss (sistema de diseño)
```

La página **`/estilos`** muestra todos los tokens y componentes base.

---

## Contribuir

Maestros y devs son bienvenidos, sobre todo para aportar **lecciones** en `src/app/data/lessons.ts`
(solo melodías de dominio público). Antes de cada commit: `npm run build` sin errores ni warnings.

## Licencia

[MIT](./LICENSE). Hecho con cariño por GoatX. Donaciones opcionales para el hosting; **nunca anuncios**.
