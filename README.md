# Dashboard de Ciberataques (Estático)

Este proyecto es un dashboard estático que permite cargar un archivo Excel con datos de incidentes de ciberseguridad y visualizar gráficos clave.

## Qué hace

- 📊 Calcula la **cantidad total de incidentes**.
- 🌍 Muestra los **países más atacados**.
- 🧨 Muestra los **tipos de ataque más frecuentes**.
- 🏢 Muestra los **sectores industriales más afectados**.
- 🪳 Muestra las **vulnerabilidades más explotadas**.
- 🛡️ Muestra los **mecanismos de defensa utilizados**.
- ⏱️ Calcula el **tiempo promedio de resolución**.
- 💸 Muestra el **impacto en pérdidas financieras y usuarios afectados**.
- 📈 Muestra la **evolución de ataques por año**.


## Cómo usar localmente

1. Guarda este proyecto en una carpeta.
2. Abre `index.html` en tu navegador.
3. Selecciona tu archivo Excel (`.xlsx`, `.xls`, `.csv`).

> El dashboard toma como base las columnas presentes en el archivo:
> - `PAIS` (o similar)
> - `AÑO` (u "ANO")
> - `TIPO DE ATAQUE`
> - `OBJECTIVO INDUSTRIAL` (o `OBJETIVO INDUSTRIAL`)
> - `PERDIDA FINANCIERA` (ideally en millones)
> - `NUMEROS DE USUARIOS AFECTADOS`
> - `TIPO DE VULNERABILIDAD DE SEGURIDAD`
> - `MECANISMO DE DEFENSA UTILIZADO`
> - `TIEMPO DE RESOLUCION DE INCIDENTE`


## Despliegue en Vercel (estático)

1. Crea un repositorio (GitHub, GitLab, etc.) con este proyecto.
2. Ve a [Vercel](https://vercel.com/) y crea un nuevo proyecto.
3. Conecta tu repositorio y selecciona la carpeta raíz donde está `index.html`.
4. Vercel detectará automáticamente que es un sitio estático.

¡Listo! Tu dashboard estará disponible con una URL pública.


## Personalización rápida

- Puedes cambiar los colores y el estilo en `styles.css`.
- Agrega nuevas visualizaciones en `app.js` usando `Chart.js`.
- Si necesitas leer otras columnas, ajusta la lista de claves en `app.js`.

---

**Nota:** Este dashboard analiza los datos en tu navegador. No se envía información a ningún servidor.
