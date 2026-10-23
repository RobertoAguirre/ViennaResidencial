# Vienna

Registro de conductas para fraccionamientos. Sirve para ubicar vecinos reincidentes —música en la madrugada, basura, estacionamiento— y, aparte, llevar las cuotas del dueño.

Una persona puede rentar una casa sin ser dueña. El dueño tiene su propia cuenta aunque no viva ahí.

## Por qué Postgres

Dueño, habitante, vivienda e incidencia son relaciones. La reincidencia es un conteo por persona y por casa, en 90 días y en un año. Postgres lo resuelve sin armar el vínculo a mano. En producción la base es [Supabase](https://supabase.com). En esta máquina, si no hay `DATABASE_URL`, corre el mismo SQL en Postgres embebido (PGlite) y los datos quedan en `data/`.

## Arrancar

```bash
pnpm install
pnpm dev
```

Abre http://localhost:5173. La contraseña de las cuentas de demostración es `Demo-2026`.

Para empezar, entra como Elena Vargas (administra Los Encinos y Bugambilias), Mariana Solís (dueña que no vive en Encino 12) y Diego Herrera (quien renta esa casa).

Para vaciar la base local: detén el servidor y borra la carpeta `data`.

## Supabase

1. Crea un proyecto.
2. En el editor SQL, ejecuta el contenido de `schemaSql` en `packages/db/src/sql.ts`.
3. En `apps/web/.env` pon la URI del pooler (puerto 6543):

```
DATABASE_URL=postgresql://...
VIENNA_SEED=1
VIENNA_DEMO=1
```

`VIENNA_SEED=1` carga los datos de demostración solo si el proyecto está vacío. Quítalo cuando ya haya datos reales. El navegador no se conecta a Supabase: el servidor de SvelteKit filtra cada consulta por el fraccionamiento de la sesión.

## Qué ve cada cuenta

- Administración y comité: incidencias, confirmación, reincidentes, directorio y cuotas. El pago lo registra solo administración.
- Dueño: sus viviendas, quién las habita, las incidencias de esas casas y sus cuotas. No ve el directorio ni quién reportó.
- Habitante: puede reportar y ver el estado de lo que ocurre en su vivienda. No ve teléfonos de otros vecinos ni la lista de reincidentes.

Un reporte no suma como reincidencia hasta que alguien del comité lo confirma y marca a la persona.
