-- Vienna. Pégalo una vez en el editor SQL de Supabase.
-- Crea las tablas de la app, cierra el acceso directo desde el navegador
-- y registra en `usuarios` a quien entre con Google.
--
-- El proveedor de Google no se prende desde aquí. Después de este script:
-- Authentication → Providers → Google → Enable
-- y agrega las URLs de redirección (localhost y el dominio de Vercel) en /auth/callback.

create table if not exists fraccionamientos (
  id text primary key,
  nombre text not null,
  ciudad text not null,
  estado text not null,
  creado_en timestamptz not null default now()
);

create table if not exists usuarios (
  id text primary key,
  nombre text not null,
  correo text not null unique,
  telefono text,
  hash_contrasena text,
  supabase_id text,
  creado_en timestamptz not null default now()
);

create table if not exists sesiones (
  token text primary key,
  usuario_id text not null references usuarios(id),
  fraccionamiento_id text not null references fraccionamientos(id),
  expira_en timestamptz not null
);

create table if not exists membresias (
  id text primary key,
  usuario_id text not null references usuarios(id),
  fraccionamiento_id text not null references fraccionamientos(id),
  rol text not null check (rol in ('administracion', 'comite', 'dueno', 'habitante')),
  unique (usuario_id, fraccionamiento_id, rol)
);

create table if not exists viviendas (
  id text primary key,
  fraccionamiento_id text not null references fraccionamientos(id),
  calle text not null,
  numero text not null,
  unique (fraccionamiento_id, calle, numero)
);

create table if not exists titularidades (
  id text primary key,
  vivienda_id text not null references viviendas(id),
  usuario_id text not null references usuarios(id),
  desde date not null,
  hasta date
);

create table if not exists ocupaciones (
  id text primary key,
  vivienda_id text not null references viviendas(id),
  usuario_id text not null references usuarios(id),
  relacion text not null check (relacion in ('dueno', 'arrendatario', 'familiar')),
  desde date not null,
  hasta date
);

create table if not exists incidencias (
  id text primary key,
  fraccionamiento_id text not null references fraccionamientos(id),
  vivienda_id text not null references viviendas(id),
  reportada_por text not null references usuarios(id),
  categoria text not null,
  gravedad text not null,
  descripcion text not null,
  ocurrio_en timestamptz not null,
  estado text not null check (estado in ('reportada', 'en_revision', 'confirmada', 'desestimada')),
  respuesta text,
  notas_internas text,
  creada_en timestamptz not null default now()
);

create table if not exists implicados (
  incidencia_id text not null references incidencias(id),
  usuario_id text not null references usuarios(id),
  primary key (incidencia_id, usuario_id)
);

create table if not exists sucesos (
  id text primary key,
  incidencia_id text not null references incidencias(id),
  usuario_id text not null references usuarios(id),
  accion text not null,
  creado_en timestamptz not null default now()
);

create table if not exists cuotas (
  id text primary key,
  fraccionamiento_id text not null references fraccionamientos(id),
  vivienda_id text not null references viviendas(id),
  concepto text not null,
  periodo text not null,
  monto_centavos integer not null check (monto_centavos > 0),
  vencimiento date not null,
  unique (vivienda_id, periodo, concepto)
);

create table if not exists pagos (
  id text primary key,
  cuota_id text not null references cuotas(id),
  monto_centavos integer not null check (monto_centavos > 0),
  pagado_en date not null,
  registrado_por text not null references usuarios(id)
);

create index if not exists incidencias_fra_idx on incidencias (fraccionamiento_id, ocurrio_en);
create index if not exists sucesos_incidencia_idx on sucesos (incidencia_id);
create index if not exists cuotas_fra_idx on cuotas (fraccionamiento_id, periodo);

alter table usuarios alter column hash_contrasena drop not null;
alter table usuarios add column if not exists supabase_id text;
create unique index if not exists usuarios_supabase_id_idx on usuarios (supabase_id);

-- El navegador solo usa la llave anónima para iniciar sesión.
-- Sin políticas, esa llave no puede leer vecinos, incidencias ni cuotas.
-- El servidor entra con DATABASE_URL (rol postgres) y sí puede.
do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'fraccionamientos', 'usuarios', 'sesiones', 'membresias', 'viviendas',
    'titularidades', 'ocupaciones', 'incidencias', 'implicados', 'sucesos', 'cuotas', 'pagos'
  ]
  loop
    execute format('alter table public.%I enable row level security', tabla);
  end loop;
end $$;

create or replace function public.registrar_usuario_google()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null then
    return new;
  end if;

  insert into public.usuarios (id, nombre, correo, supabase_id)
  values (
    new.id::text,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Vecino'),
    lower(new.email),
    new.id::text
  )
  on conflict (correo) do update
    set supabase_id = excluded.supabase_id;

  return new;
end;
$$;

drop trigger if exists registrar_usuario_google on auth.users;
create trigger registrar_usuario_google
  after insert on auth.users
  for each row execute function public.registrar_usuario_google();
