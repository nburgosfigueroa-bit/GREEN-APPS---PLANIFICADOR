-- ================================================================
-- GreenApps — Script SQL para Supabase
-- ================================================================

-- ================================================================
-- 1. TABLA: perfiles (extiende auth.users de Supabase)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.perfiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre      TEXT NOT NULL,
  rut         TEXT,
  rol         TEXT NOT NULL DEFAULT 'lider'
                CHECK (rol IN ('admin','lider','encargado','inspeccion')),
  contrato    TEXT NOT NULL DEFAULT 'maipu_6',
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 2. SECUENCIA Y TABLA: ordenes_trabajo
-- ================================================================
CREATE SEQUENCE IF NOT EXISTS public.ot_numero_seq START 1001;

CREATE TABLE IF NOT EXISTS public.ordenes_trabajo (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo        TEXT DEFAULT ('OT-' || LPAD(nextval('public.ot_numero_seq')::TEXT, 5, '0')),
  solicitante   TEXT NOT NULL CHECK (solicitante IN ('mun','vec','int')),
  area_verde    TEXT NOT NULL,
  direccion     TEXT NOT NULL,
  tipo_trabajo  TEXT NOT NULL CHECK (tipo_trabajo IN ('mob','poda','tolva','riego')),
  descripcion   TEXT NOT NULL,
  materiales    TEXT,
  requiere_especial BOOLEAN DEFAULT FALSE,
  prioridad     INT  NOT NULL DEFAULT 3 CHECK (prioridad BETWEEN 0 AND 3),
  plazo         DATE,
  estado        TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente','en_revision','aprobado','rechazado','cerrado')),
  operador_id   UUID REFERENCES public.perfiles(id),
  revisor_id    UUID REFERENCES public.perfiles(id),
  nota_rechazo  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 3. TABLA: archivos_multimedia
-- ================================================================
CREATE TABLE IF NOT EXISTS public.archivos_multimedia (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id        UUID REFERENCES public.ordenes_trabajo(id) ON DELETE CASCADE,
  nombre_archivo  TEXT NOT NULL,
  tipo_mime       TEXT NOT NULL,
  tamanio_bytes   BIGINT,
  storage_path    TEXT NOT NULL,
  url_publica     TEXT,
  subido_por      UUID REFERENCES public.perfiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ================================================================
ALTER TABLE public.perfiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordenes_trabajo    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.archivos_multimedia ENABLE ROW LEVEL SECURITY;

-- Perfiles
DROP POLICY IF EXISTS "Perfil propio" ON public.perfiles;
CREATE POLICY "Perfil propio" ON public.perfiles
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin ve todos los perfiles" ON public.perfiles;
CREATE POLICY "Admin ve todos los perfiles" ON public.perfiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- Órdenes
DROP POLICY IF EXISTS "Leer OTs autenticado" ON public.ordenes_trabajo;
CREATE POLICY "Leer OTs autenticado" ON public.ordenes_trabajo
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Crear OT propia" ON public.ordenes_trabajo;
CREATE POLICY "Crear OT propia" ON public.ordenes_trabajo
  FOR INSERT WITH CHECK (auth.uid() = operador_id);

DROP POLICY IF EXISTS "Editar OT propia" ON public.ordenes_trabajo;
CREATE POLICY "Editar OT propia" ON public.ordenes_trabajo
  FOR UPDATE USING (auth.uid() = operador_id);

DROP POLICY IF EXISTS "Cerrar OT encargado" ON public.ordenes_trabajo;
CREATE POLICY "Cerrar OT encargado" ON public.ordenes_trabajo
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND rol IN ('admin','encargado'))
  );

-- Multimedia
DROP POLICY IF EXISTS "Leer multimedia" ON public.archivos_multimedia;
CREATE POLICY "Leer multimedia" ON public.archivos_multimedia
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Subir multimedia" ON public.archivos_multimedia;
CREATE POLICY "Subir multimedia" ON public.archivos_multimedia
  FOR INSERT WITH CHECK (auth.uid() = subido_por);

-- ================================================================
-- 5. TRIGGER: actualizar updated_at automáticamente
-- ================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_perfiles_updated ON public.perfiles;
CREATE TRIGGER trg_perfiles_updated
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ot_updated ON public.ordenes_trabajo;
CREATE TRIGGER trg_ot_updated
  BEFORE UPDATE ON public.ordenes_trabajo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ================================================================
-- 6. TRIGGER: crear perfil automáticamente al registrar usuario
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, rol, contrato)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'lider'),
    COALESCE(NEW.raw_user_meta_data->>'contrato', 'maipu_6')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- 7. STORAGE BUCKET para multimedia
-- ================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias', 'evidencias', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Upload evidencias" ON storage.objects;
CREATE POLICY "Upload evidencias" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'evidencias' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Leer evidencias" ON storage.objects;
CREATE POLICY "Leer evidencias" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidencias');

-- ================================================================
-- 8. TABLA DE APOYO: areas_verdes
-- ================================================================
CREATE TABLE IF NOT EXISTS public.areas_verdes (
  codigo  TEXT PRIMARY KEY,
  nombre  TEXT NOT NULL,
  zona    TEXT,
  activo  BOOLEAN DEFAULT TRUE
);

INSERT INTO public.areas_verdes (codigo, nombre, zona) VALUES
  ('AV-042', 'Parque Central Sur',     'Norte'),
  ('AV-115', 'Plaza Los Héroes',        'Centro'),
  ('AV-089', 'Bandejón Alameda',        'Sur'),
  ('AV-201', 'Jardín Botánico Norte',   'Norte'),
  ('AV-055', 'Acceso Norte - Parque',   'Norte'),
  ('AV-104', 'Plaza Central',           'Centro'),
  ('AV-209', 'Parque Lineal Este',      'Este')
ON CONFLICT (codigo) DO NOTHING;
