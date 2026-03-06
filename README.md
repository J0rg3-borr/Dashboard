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

> El dashboard carga automáticamente los datos desde `data.json` (incluido en el repo). Para cambiar los datos, reemplaza `data.json` con una versión nueva generada desde tu Excel.

> El dashboard toma como base las columnas presentes en el archivo:
> - `PAIS` (o similar)
> - `AÑO` (u "ANO")
> - `TIPO DE ATAQUE`
> - `OBJECTIVO INDUSTRIAL` (o `OBJETIVO INDUSTRIAL`)
> - `PERDIDA FINANCIERA` (idealmente en millones)
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

## Actualizar los datos (si cambias el Excel)

Si cambias los datos de tu Excel y quieres que el dashboard los muestre:

1. Genera un nuevo `data.json` desde el Excel (puedes usar el script de ejemplo abajo).
2. Reemplaza el archivo `data.json` en el repositorio.
3. Haz `git add data.json && git commit -m "Actualizar datos" && git push`.

### Script rápido (Python)

```python
import pandas as pd
import json

df = pd.read_excel("Global_Cybersecurity_Threats_2015-2024.xlsx")
records = df.where(pd.notnull(df), None).to_dict(orient="records")
with open("data.json", "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, indent=2)
```


## Personalización rápida

- Puedes cambiar los colores y el estilo en `styles.css`.
- Agrega nuevas visualizaciones en `app.js` usando `Chart.js`.
- Si necesitas leer otras columnas, ajusta la lista de claves en `app.js`.

---

**Nota:** Este dashboard analiza los datos en tu navegador. No se envía información a ningún servidor.
