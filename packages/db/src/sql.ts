export const schemaSql = `
CREATE TABLE IF NOT EXISTS fraccionamientos (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  ciudad text NOT NULL,
  estado text NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  correo text NOT NULL UNIQUE,
  telefono text,
  hash_contrasena text,
  supabase_id text,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sesiones (
  token text PRIMARY KEY,
  usuario_id text NOT NULL REFERENCES usuarios(id),
  fraccionamiento_id text NOT NULL REFERENCES fraccionamientos(id),
  expira_en timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS membresias (
  id text PRIMARY KEY,
  usuario_id text NOT NULL REFERENCES usuarios(id),
  fraccionamiento_id text NOT NULL REFERENCES fraccionamientos(id),
  rol text NOT NULL CHECK (rol IN ('administracion', 'comite', 'dueno', 'habitante')),
  UNIQUE (usuario_id, fraccionamiento_id, rol)
);

CREATE TABLE IF NOT EXISTS viviendas (
  id text PRIMARY KEY,
  fraccionamiento_id text NOT NULL REFERENCES fraccionamientos(id),
  calle text NOT NULL,
  numero text NOT NULL,
  UNIQUE (fraccionamiento_id, calle, numero)
);

CREATE TABLE IF NOT EXISTS titularidades (
  id text PRIMARY KEY,
  vivienda_id text NOT NULL REFERENCES viviendas(id),
  usuario_id text NOT NULL REFERENCES usuarios(id),
  desde date NOT NULL,
  hasta date
);

CREATE TABLE IF NOT EXISTS ocupaciones (
  id text PRIMARY KEY,
  vivienda_id text NOT NULL REFERENCES viviendas(id),
  usuario_id text NOT NULL REFERENCES usuarios(id),
  relacion text NOT NULL CHECK (relacion IN ('dueno', 'arrendatario', 'familiar')),
  desde date NOT NULL,
  hasta date
);

CREATE TABLE IF NOT EXISTS incidencias (
  id text PRIMARY KEY,
  fraccionamiento_id text NOT NULL REFERENCES fraccionamientos(id),
  vivienda_id text NOT NULL REFERENCES viviendas(id),
  reportada_por text NOT NULL REFERENCES usuarios(id),
  categoria text NOT NULL,
  gravedad text NOT NULL,
  descripcion text NOT NULL,
  ocurrio_en timestamptz NOT NULL,
  estado text NOT NULL CHECK (estado IN ('reportada', 'en_revision', 'confirmada', 'desestimada')),
  respuesta text,
  notas_internas text,
  creada_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS implicados (
  incidencia_id text NOT NULL REFERENCES incidencias(id),
  usuario_id text NOT NULL REFERENCES usuarios(id),
  PRIMARY KEY (incidencia_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS sucesos (
  id text PRIMARY KEY,
  incidencia_id text NOT NULL REFERENCES incidencias(id),
  usuario_id text NOT NULL REFERENCES usuarios(id),
  accion text NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cuotas (
  id text PRIMARY KEY,
  fraccionamiento_id text NOT NULL REFERENCES fraccionamientos(id),
  vivienda_id text NOT NULL REFERENCES viviendas(id),
  concepto text NOT NULL,
  periodo text NOT NULL,
  monto_centavos integer NOT NULL CHECK (monto_centavos > 0),
  vencimiento date NOT NULL,
  UNIQUE (vivienda_id, periodo, concepto)
);

CREATE TABLE IF NOT EXISTS pagos (
  id text PRIMARY KEY,
  cuota_id text NOT NULL REFERENCES cuotas(id),
  monto_centavos integer NOT NULL CHECK (monto_centavos > 0),
  pagado_en date NOT NULL,
  registrado_por text NOT NULL REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS incidencias_fra_idx ON incidencias (fraccionamiento_id, ocurrio_en);
CREATE INDEX IF NOT EXISTS sucesos_incidencia_idx ON sucesos (incidencia_id);
CREATE INDEX IF NOT EXISTS cuotas_fra_idx ON cuotas (fraccionamiento_id, periodo);

ALTER TABLE usuarios ALTER COLUMN hash_contrasena DROP NOT NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS supabase_id text;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_supabase_id_idx ON usuarios (supabase_id);
`;
