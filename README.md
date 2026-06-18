# Cartas para Darlyn

Proyecto simple para crear y leer cartas (mensajes) que Darlyn pueda ver.

Instrucciones rápidas

1) Inicializar repositorio Git y subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
# crea un repo en GitHub y conecta el remoto
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git branch -M main
git push -u origin main
```

2) Conectar Firebase Realtime Database (para que las cartas se compartan entre dispositivos)

- Crea un proyecto en https://console.firebase.google.com/
- En "Realtime Database" crea una base de datos en modo de prueba (o configura reglas y auth apropiadas).
- Copia la URL de la base de datos (termina en `.firebaseio.com` o `default-rtdb.firebaseio.com`).
- En el proyecto local duplica `firebase-config.example.js` a `firebase-config.js` y pega la URL:

```js
window.CARTAS_DB_CONFIG = {
  firebaseDatabaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com"
};
```

Nota: `firebase-config.js` está en `.gitignore` para evitar subir datos del proyecto.

3) Reglas mínimas para pruebas

En Realtime Database > Reglas, usa algo temporalmente permisivo solo para pruebas:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

4) Abrir la página

Abre `index.html` en un navegador (o sirve la carpeta con un servidor simple):

```bash
# Python 3
python -m http.server 8000
# luego abre http://localhost:8000
```

5) Seguridad

- Para producción, configura Realtime Database Rules y autenticación (Firebase Auth) para limitar quién puede escribir/leer.
- Alternativamente, crea un endpoint seguro en un servidor que valide peticiones antes de escribir en la DB.

Si quieres, puedo:
- Preparar un pequeño script para desplegar automáticamente a GitHub Pages.
- Añadir autenticación básica con Firebase Auth para que solo usuarios autorizados puedan agregar o borrar cartas.
# De-todos-los-que-te-queremos
para DARLYN
