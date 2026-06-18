# Cartas para Darlyn

Pagina para leer y agregar cartas desde diferentes dispositivos.

## Como funciona

- GitHub Pages muestra la pagina.
- Firebase Realtime Database guarda las cartas compartidas.
- Las reglas de Firebase permiten agregar cartas nuevas, pero bloquean editar o borrar desde la pagina publica.

## Archivos importantes

- `index.html`: estructura de la pagina.
- `styles.css`: estilos visuales.
- `script.js`: logica de lectura, guardado y conexion online.
- `cartas.js`: cartas base que van incluidas en la pagina.
- `firebase-config.js`: URL de Firebase que usa la pagina publicada.
- `database.rules.json`: reglas recomendadas para Firebase Realtime Database.

## Configurar Firebase

1. Entra a https://console.firebase.google.com/
2. Crea o abre tu proyecto.
3. Ve a Realtime Database.
4. Crea la base de datos.
5. Copia la URL de la base. Se parece a:

```txt
https://tu-proyecto-default-rtdb.firebaseio.com
```

6. Pega esa URL en `firebase-config.js`:

```js
window.CARTAS_DB_CONFIG = {
  firebaseDatabaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com"
};
```

7. En Realtime Database > Reglas, pega el contenido de `database.rules.json`.

## Subir cambios

```bash
git add .
git commit -m "Update page"
git push origin main
```

## Seguridad

Estas reglas dejan que la gente agregue cartas, pero no las pueda editar ni borrar desde la pagina. Para borrar cartas, entra a Firebase Console y borralas desde la base de datos.

Las contrasenas dentro de JavaScript sirven solo para controlar la experiencia de la pagina, pero no son seguridad real porque el navegador puede ver el codigo.
