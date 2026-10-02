# Crest

App de finanzas personales en la nube: React + TypeScript + Vite + Tailwind v4 + Recharts + Firebase (Auth y Firestore).

## 1. Preparar Firebase (una sola vez, en la consola web)

Los nombres de los menús pueden variar un poco; busca lo equivalente.

1. **Authentication → Método de acceso → Correo electrónico/Contraseña → Activar.**
2. **Firestore Database → Crear base de datos.** Elige una ubicación de Europa (p. ej. `eur3`; no se puede cambiar después) y modo **producción**.
3. **Publica las reglas de seguridad** (paso 3 más abajo). Sin ellas, Firestore en modo producción lo deniega todo y Crest mostrará un error de permisos.
4. Si vas a publicar la web (paso 5): **Authentication → Configuración → Dominios autorizados** y añade tu dominio (los de Firebase Hosting ya vienen).

## 2. Instalar y ejecutar en local

Necesitas Node.js 18 o superior.

```bash
npm install            # instala también firebase (ya está en package.json)
npm run dev
```

Abre http://localhost:5173, pulsa **Crear cuenta** y sigue el onboarding.

Las claves de tu proyecto están en `.env.local` (ignorado por Git). Si clonas el proyecto en otro sitio, copia `.env.example` como `.env.local` y rellénalo con la configuración web de Firebase.

## 3. Publicar las reglas de Firestore

Opción A, sin instalar nada: Firestore Database → pestaña **Reglas** → pega el contenido de `firestore.rules` → **Publicar**.

Opción B, por terminal:

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```

(`.firebaserc` ya apunta a tu proyecto `crest-c7c39`.) Puedes probarlas en la consola con el **simulador de reglas** (pestaña Reglas → Simulador): una lectura de `users/otro-uid/goals/x` autenticado como `mi-uid` debe salir denegada.

## 4. Seguridad: qué protege qué

- Las claves `VITE_FIREBASE_*` son públicas por diseño: identifican el proyecto, no lo protegen. **Lo que protege los datos son las reglas de `firestore.rules`**: cada usuario solo lee y escribe lo que cuelga de `users/{su uid}`, con los campos y tipos exactos que usa la app.
- Recomendado: en Google Cloud Console → APIs y servicios → Credenciales → tu clave de navegador, restringe por **referentes HTTP** (`localhost:*`, `crest-c7c39.web.app/*`, `crest-c7c39.firebaseapp.com/*` y tu dominio propio).
- No subas nunca a Git ni compartas archivos de cuenta de servicio (JSON con `private_key`) ni contraseñas. Esos sí son secretos.

## 5. Publicar la web (necesario para Face ID en el móvil)

Face ID y la huella en el navegador solo funcionan en `https://` (o en `localhost`).

```bash
npm run build
npx firebase-tools deploy --only hosting
```

## 6. Face ID / huella: qué es y qué no es

Es un **bloqueo local de la app** (WebAuthn, autenticador de la plataforma): tras entrar con correo y contraseña, puedes exigir Face ID / huella / Windows Hello al abrir Crest y al volver tras 30 s fuera. Se activa en el onboarding o en el icono de cuenta de la cabecera. Cada dispositivo se activa por separado.

**No** sustituye a la contraseña: la sesión la mantiene Firebase y ningún servidor verifica tu huella. Un inicio de sesión con passkeys de verdad necesitaría un backend que valide la firma y emita un token de Firebase (Cloud Functions, plan Blaze de pago por uso).

## 7. Estructura

```
firestore.rules  firebase.json  .firebaserc  .env.local
src/
  App.tsx             acceso: Login → Onboarding → app (con bloqueo biométrico)
  AppShell.tsx        la app: carrusel, menú, hojas emergentes
  screens/            Login, Onboarding, Dashboard, Cuentas, Inversiones, Metas, Gasto
  components/         QuickAdd, AddInvestment, AddGoal, SettingsSheet, LockScreen, Assistant...
  lib/
    firebase.ts       inicialización (Auth + Firestore con caché offline)
    session.tsx       quién ha entrado y si ya hizo el onboarding
    auth.ts           entrar, registrarse, recuperar contraseña
    biometric.ts      bloqueo con Face ID / huella (WebAuthn)
    db.ts             qué se escribe y cómo se lee cada documento
    useCloudData.ts   datos en tiempo real + operaciones
```

Datos en Firestore (importes en céntimos enteros):

```
users/{uid}                     perfil: nombre, saldo inicial, límite mensual
users/{uid}/transactions/{id}   ingresos y gastos
users/{uid}/rules/{id}          gastos e ingresos fijos mensuales
users/{uid}/holdings/{id}       inversiones
users/{uid}/goals/{id}          metas de ahorro
users/{uid}/snapshots/{día}     foto diaria del patrimonio (gráfica de crecimiento)
```

Comandos: `npm run dev`, `npm run build`, `npm run preview`, `npm run typecheck`.
