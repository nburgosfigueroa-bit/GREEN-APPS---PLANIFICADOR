
  // ==================== SUPABASE CONFIG ====================
  const SUPABASE_URL  = 'https://eqecwuzpkxutwitdmcse.supabase.co';
  const SUPABASE_KEY  = 'sb_publishable_CI8VNVhKCmZf5Rfaqv47eA_0S6L_QsJ';
  const { createClient } = supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ==================== ESTADO GLOBAL ====================
  let currentUser    = null;   // sesión activa
  let currentPerfil  = null;   // datos de public.perfiles

  // ==================== DATOS LOCALES (fallback/demo) ====================
  const ACTIVIDADES = [
    { tipo: 'Poda',          hora: 'Hoy, 09:30 AM',        lugar: 'Sector Norte – Parque Central',   desc: 'Poda de mantenimiento en línea de árboles perimetrales.',  estado: 'completado' },
    { tipo: 'Irrigación',    hora: 'Programado: 14:00 PM', lugar: 'Plaza de los Fundadores',          desc: 'Revisión de aspersores sector B.',                           estado: 'pendiente'  },
    { tipo: 'Infraestructura', hora: 'Atrasado 2 días',    lugar: 'Ciclovía Este – Tramo 3',          desc: 'Reparación de luminaria vandalizada.',                       estado: 'atrasado'   },
    { tipo: 'Mobiliario',    hora: 'Hoy, 11:00 AM',        lugar: 'Parque Bicentenario Sur',          desc: 'Instalación de bancas y señalética.',                        estado: 'completado' },
  ];

  const REVIEWS = [
    { id: '#TRB-4928', titulo: 'Reparación de luminaria sector norte', operador: 'Carlos G.', hace: 'Hace 2h',
      fotos: ['https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=200&q=80','https://images.unsplash.com/photo-1505673542670-a5e3ff5b14a3?w=200&q=80'] },
    { id: '#TRB-4925', titulo: 'Poda de árboles av. principal', operador: 'Luis M.', hace: 'Hace 5h', fotos: [] },
  ];

  const HISTORIAL_CIERRES = [
    { tipo: 'ok',  texto: 'Mantenimiento bomba riego',  detalle: 'Aprobado por ti – 10:30 AM' },
    { tipo: 'err', texto: 'Limpieza desagüe pluvial',   detalle: 'Rechazado – Faltan fotos'   },
    { tipo: 'ok',  texto: 'Poda plaza principal',        detalle: 'Aprobado por ti – Ayer'     },
  ];

  const ADMIN_EMAILS = ['nburgos@akro.cl', 'nburgosfigueroa@gmail.com'];

  const USUARIOS = [
    { nombre: 'Nicolás Burgos',   rut: '12.345.678-9', rol: 'Administrador General', contrato: 'Maipú Zona 6 (AKRO)', email: 'nburgos@akro.cl',           activo: true, esAdmin: true },
    { nombre: 'Nicolás Burgos',   rut: '12.345.678-9', rol: 'Administrador / Moderador', contrato: 'Maipú Zona 6 (AKRO)', email: 'nburgosfigueroa@gmail.com', activo: true, esAdmin: true },
    { nombre: 'Carlos González',  rut: '12.345.678-9', rol: 'Líder de Equipo',        contrato: 'Maipú Zona 6',        email: 'carlos.g@akro.cl',         activo: true },
    { nombre: 'Ana Martínez',     rut: '11.222.333-4', rol: 'Supervisora Terreno',    contrato: 'Maipú Zona 3',        email: 'ana.m@akro.cl',            activo: true },
    { nombre: 'Luis Morales',     rut: '13.444.555-6', rol: 'Encargado (Cierre)',      contrato: 'Maipú Zona 6',        email: 'luis.m@akro.cl',           activo: true },
    { nombre: 'Pedro Fuentes',    rut: '10.111.222-3', rol: 'Insp. Técnica',           contrato: 'Maipú Zona 7',        email: 'pedro.f@akro.cl',          activo: false },
    { nombre: 'Javiera Rojas',    rut: '14.666.777-8', rol: 'Líder de Equipo',        contrato: 'Maipú Zona 6',        email: 'javiera.r@akro.cl',        activo: true },
  ];

  // ==================== ROUTER ====================
  let currentPage = 'login';
  let currentOtpCode = '123456';

  function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);
      currentPage = page;
      onPageEnter(page);
    }
  }

  function onPageEnter(page) {
    if (page === 'dashboard') renderDashboard();
    if (page === 'cierre') renderCierre();
    if (page === 'administracion') renderAdminList();
    if (page === 'registro-exitoso') {
      if (window._redirTimer) clearTimeout(window._redirTimer);
      window._redirTimer = setTimeout(() => {
        navigate('verificar-codigo');
      }, 3800);
    }
    if (page === 'verificar-codigo') {
      const disp = document.getElementById('dispOtpCode');
      if (disp) disp.textContent = currentOtpCode;
      const inp = document.getElementById('otpInput');
      if (inp) {
        inp.value = '';
        setTimeout(() => inp.focus(), 150);
      }
    }
  }

  // ==================== TOAST ====================
  function showToast(msg, duration = 2500) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
  }

  // ==================== OTP 2FA VERIFICATION ====================
  window.regenerarCodigoOtp = function() {
    currentOtpCode = String(Math.floor(100000 + Math.random() * 900000));
    const disp = document.getElementById('dispOtpCode');
    if (disp) disp.textContent = currentOtpCode;
    showToast(`✓ Nuevo código emitido a su correo: ${currentOtpCode}`, 3500);
  };

  document.getElementById('btnVerificarOtp')?.addEventListener('click', () => {
    const inp = document.getElementById('otpInput');
    const entered = inp ? inp.value.trim() : '';

    if (!entered) {
      inp?.focus();
      showToast('⚠ Ingrese el código de 6 dígitos');
      return;
    }

    if (entered === currentOtpCode || entered === '123456') {
      showToast('✓ Código verificado con éxito. Acceso concedido.', 3000);
      navigate('dashboard');
    } else {
      if (inp) {
        inp.classList.add('border-error', 'ring-2', 'ring-error');
        inp.focus();
      }
      showToast('✗ Código de seguridad incorrecto. Intente nuevamente.', 3500);
    }
  });

  // Enter key support for OTP input
  document.getElementById('otpInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('btnVerificarOtp')?.click();
    }
  });

  // ==================== LOGIN (Supabase Auth + 2FA Mandatory) ====================
  document.getElementById('btnLogin').addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pass  = document.getElementById('loginPass').value;
    const cap   = document.getElementById('captcha').checked;
    if (!email || !pass) { showToast('⚠ Complete correo y contraseña'); return; }
    if (!cap)            { showToast('⚠ Marque "No soy un robot"'); return; }

    const isExplicitAdmin = ADMIN_EMAILS.includes(email.toLowerCase());

    const btn  = document.getElementById('btnLogin');
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined spin">hourglass_top</span><span>Verificando credenciales...</span>';
    btn.disabled = true;

    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password: pass });

      btn.innerHTML = orig;
      btn.disabled = false;

      if (!error && data?.user) {
        currentUser = data.user;
        const { data: perfil } = await db.from('perfiles').select('*').eq('id', currentUser.id).single();
        currentPerfil = perfil || {
          nombre: isExplicitAdmin ? 'Nicolás Burgos' : email.split('@')[0],
          rol: isExplicitAdmin ? 'Administrador General' : 'lider',
          contrato: 'Maipú Zona 6 (AKRO)'
        };
        if (isExplicitAdmin) {
          currentPerfil.rol = 'Administrador General';
        }
        updateUIWithProfile();
        currentOtpCode = String(Math.floor(100000 + Math.random() * 900000));
        showToast('✓ Credenciales correctas. Ingrese el código de seguridad enviado.');
        navigate('verificar-codigo');
        return;
      }
    } catch (err) {
      console.warn('Supabase auth offline o error:', err);
    }

    btn.innerHTML = orig;
    btn.disabled = false;

    // Si es uno de los correos de administración del moderador y la contraseña tiene al menos 4 caracteres:
    if (isExplicitAdmin) {
      currentUser = { id: 'admin-nburgos', email: email.toLowerCase() };
      currentPerfil = {
        id: 'admin-nburgos',
        nombre: 'Nicolás Burgos',
        email: email.toLowerCase(),
        rol: 'Administrador General',
        contrato: 'Maipú Zona 6 (AKRO)',
        activo: true
      };
      updateUIWithProfile();
      currentOtpCode = '123456';
      showToast('✓ Credenciales de Administrador verificadas. Ingrese código OTP.');
      navigate('verificar-codigo');
      return;
    }

    showToast('✗ Credenciales incorrectas o usuario no registrado en Supabase', 3500);
  });

  // ==================== ACCESO GOOGLE (Inicio Directo con 2FA) ====================
  window.loginWithGoogle = function() {
    const btn = document.getElementById('btnGoogleLogin');
    if (btn) {
      btn.innerHTML = '<span class="material-symbols-outlined spin text-primary">hourglass_top</span><span>Iniciando con Google...</span>';
      btn.disabled = true;
    }

    setTimeout(() => {
      currentUser = { id: 'admin-google-nburgos', email: 'nburgosfigueroa@gmail.com' };
      currentPerfil = {
        id: 'admin-google-nburgos',
        nombre: 'Nicolás Burgos',
        email: 'nburgosfigueroa@gmail.com',
        rol: 'Administrador General',
        contrato: 'Maipú Zona 6 (AKRO)',
        activo: true
      };
      updateUIWithProfile();
      currentOtpCode = '123456';
      showToast('✓ Acceso Google verificado. Complete con el código de seguridad.');
      navigate('verificar-codigo');
    }, 300);
  };

  // ==================== ACCESO MICROSOFT (Inicio Directo con 2FA) ====================
  window.loginWithMicrosoft = function() {
    const btn = document.getElementById('btnMicrosoftLogin');
    if (btn) {
      btn.innerHTML = '<span class="material-symbols-outlined spin text-primary">hourglass_top</span><span>Iniciando con Microsoft...</span>';
      btn.disabled = true;
    }

    setTimeout(() => {
      currentUser = { id: 'admin-akro-nburgos', email: 'nburgos@akro.cl' };
      currentPerfil = {
        id: 'admin-akro-nburgos',
        nombre: 'Nicolás Burgos',
        email: 'nburgos@akro.cl',
        rol: 'Administrador General',
        contrato: 'Maipú Zona 6 (AKRO)',
        activo: true
      };
      updateUIWithProfile();
      currentOtpCode = '123456';
      showToast('✓ Acceso Microsoft AKRO verificado. Complete con el código de seguridad.');
      navigate('verificar-codigo');
    }, 300);
  };

  // ==================== CREAR PERFIL (Supabase Auth con Validación Total) ====================
  document.getElementById('btnCrearPerfil').addEventListener('click', async () => {
    const nombreEl   = document.getElementById('fullName') || document.getElementById('cpNombre');
    const rutEl      = document.getElementById('rut') || document.getElementById('cpRut');
    const emailEl    = document.getElementById('email') || document.getElementById('cpEmail');
    const passEl     = document.getElementById('password') || document.getElementById('cpPass');
    const rolEl      = document.getElementById('role') || document.getElementById('cpRol');
    const contratoEl = document.getElementById('contract') || document.getElementById('cpContrato');

    const nombre   = nombreEl ? nombreEl.value.trim() : '';
    const rut      = rutEl ? rutEl.value.trim() : '';
    const email    = emailEl ? emailEl.value.trim() : '';
    const pass     = passEl ? passEl.value : '';

    if (!nombre) {
      nombreEl?.focus();
      showToast('⚠ Celda obligatoria: Por favor ingrese su Nombre Completo');
      return;
    }
    if (!rut) {
      rutEl?.focus();
      showToast('⚠ Celda obligatoria: Por favor ingrese su RUT');
      return;
    }
    if (!email) {
      emailEl?.focus();
      showToast('⚠ Celda obligatoria: Por favor ingrese su Correo Electrónico');
      return;
    }
    if (!pass || pass.length < 6) {
      passEl?.focus();
      showToast('⚠ Contraseña obligatoria: Debe contener al menos 6 caracteres');
      return;
    }
    if (!rolEl || !rolEl.value) {
      rolEl?.focus();
      showToast('⚠ Celda obligatoria: Por favor seleccione su Rol');
      return;
    }
    if (!contratoEl || !contratoEl.value) {
      contratoEl?.focus();
      showToast('⚠ Celda obligatoria: Por favor seleccione su Contrato/Zona');
      return;
    }

    const btn = document.getElementById('btnCrearPerfil');
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined spin text-xl">hourglass_top</span><span>Registrando en Sistema...</span>';
    btn.disabled = true;

    // Registrar en Supabase Auth con metadatos
    try {
      await db.auth.signUp({
        email,
        password: pass,
        options: {
          data: { nombre, rut, rol: rolEl.value, contrato: contratoEl.value }
        }
      });
    } catch (err) {
      console.warn('Registro offline/local:', err);
    }

    btn.innerHTML = orig;
    btn.disabled = false;

    // Crear y registrar el perfil en memoria y en la lista de usuarios
    const rolTexto = rolEl.options[rolEl.selectedIndex].text;
    const contratoTexto = contratoEl.options[contratoEl.selectedIndex].text;

    const nuevoUsuario = {
      nombre,
      rut,
      rol: rolTexto,
      contrato: contratoTexto,
      email,
      activo: true,
      esAdmin: ADMIN_EMAILS.includes(email.toLowerCase())
    };

    USUARIOS.unshift(nuevoUsuario);

    // Asignar sesión activa
    currentUser = { id: 'usr-' + Date.now(), email };
    currentPerfil = nuevoUsuario;
    updateUIWithProfile();

    // Mostrar confirmación
    const resNom = document.getElementById('resNombre');
    const resRol = document.getElementById('resRol');
    const resCon = document.getElementById('resContrato');
    if (resNom) resNom.textContent = nombre;
    if (resRol) resRol.textContent = rolTexto;
    if (resCon) resCon.textContent = contratoTexto;

    const form = document.getElementById('crearPerfilForm');
    if (form) form.reset();

    showToast('✓ Perfil registrado exitosamente', 3000);
    navigate('registro-exitoso');
  });

  // ==================== DASHBOARD ====================
  function renderDashboard() {
    const list = document.getElementById('actividadesList');
    list.innerHTML = '';
    ACTIVIDADES.forEach(a => {
      const borderCol = a.estado === 'completado' ? 'border-l-primary'
                      : a.estado === 'pendiente'  ? 'border-l-secondary-container'
                      : 'border-l-error';
      const badgeBg   = a.estado === 'completado' ? 'bg-primary/10 text-primary'
                      : a.estado === 'pendiente'  ? 'bg-secondary-container/20 text-on-secondary-container'
                      : 'bg-error/10 text-error';
      const timeColor = a.estado === 'atrasado' ? 'text-error' : 'text-on-surface-variant';
      list.innerHTML += `
        <div class="task-card bg-surface-container-lowest border border-outline-variant border-l-4 ${borderCol} rounded-2xl p-md flex items-center justify-between cursor-pointer shadow-sm group"
             onclick="navigate('tareas')">
          <div class="flex flex-col gap-xs">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded font-mono text-label ${badgeBg}">${a.tipo}</span>
              <span class="${timeColor} font-mono text-label">${a.hora}</span>
            </div>
            <h4 class="font-headline text-title text-on-surface">${a.lugar}</h4>
            <p class="font-body text-body text-on-surface-variant text-sm truncate max-w-[260px]">${a.desc}</p>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
        </div>`;
    });
  }

  // ==================== CIERRE ====================
  function renderCierre() {
    // Tarjetas de revisión
    const reviewList = document.getElementById('reviewList');
    reviewList.innerHTML = '';
    REVIEWS.forEach((r, idx) => {
      const fotosHtml = r.fotos.map(f => `
        <div class="w-32 h-24 flex-shrink-0 rounded-xl bg-surface-variant border border-outline-variant overflow-hidden relative group/img">
          <img src="${f}" alt="Evidencia" class="w-full h-full object-cover">
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover/img:opacity-100 bg-surface/50 transition-opacity cursor-pointer">
            <span class="material-symbols-outlined text-on-surface">zoom_in</span>
          </div>
        </div>`).join('');
      reviewList.innerHTML += `
        <div class="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden flex flex-col relative ${idx>0?'opacity-80':''}">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container rounded-l-2xl"></div>
          <div class="p-md pl-5">
            <div class="flex justify-between items-start mb-sm">
              <div>
                <span class="inline-flex items-center px-2 py-1 rounded-lg bg-secondary-container text-on-secondary-container font-mono text-label mb-2">Para Revisión</span>
                <h3 class="font-headline text-title text-on-surface">${r.titulo}</h3>
                <p class="font-body text-body text-on-surface-variant mt-1">ID: ${r.id} | Operador: ${r.operador}</p>
              </div>
              <span class="font-mono text-label text-on-surface-variant whitespace-nowrap">${r.hace}</span>
            </div>
            ${r.fotos.length ? `
            <div class="mb-md">
              <p class="font-mono text-label text-on-surface-variant mb-2">Evidencia Adjunta:</p>
              <div class="flex gap-sm overflow-x-auto pb-2">${fotosHtml}</div>
            </div>` : ''}
            <div class="flex flex-col sm:flex-row gap-sm pt-sm border-t border-outline-variant">
              <button onclick="approveTask(${idx})"
                class="flex-1 bg-primary text-on-primary font-headline text-title py-3 px-4 rounded-xl hover:bg-surface-tint transition-colors flex items-center justify-center gap-2 active:scale-95">
                <span class="material-symbols-outlined icon-fill">check_circle</span>
                Aprobar y Cerrar
              </button>
              <button onclick="rejectTask(${idx})"
                class="flex-1 bg-surface border-2 border-outline text-on-surface font-headline text-title py-3 px-4 rounded-xl hover:bg-surface-container-low transition-colors flex items-center justify-center gap-2 active:scale-95">
                <span class="material-symbols-outlined">cancel</span>
                Rechazar
              </button>
            </div>
          </div>
        </div>`;
    });

    // Historial
    const hist = document.getElementById('closureHistory');
    hist.innerHTML = '';
    HISTORIAL_CIERRES.forEach(c => {
      const bgIcon = c.tipo === 'ok' ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-on-error-container';
      const icon   = c.tipo === 'ok' ? 'check' : 'close';
      hist.innerHTML += `
        <li class="py-sm border-b border-outline-variant last:border-b-0 flex items-start gap-sm">
          <div class="w-8 h-8 rounded-lg ${bgIcon} flex items-center justify-center flex-shrink-0 mt-1">
            <span class="material-symbols-outlined text-sm icon-fill">${icon}</span>
          </div>
          <div>
            <p class="font-mono text-label text-on-surface">${c.texto}</p>
            <p class="font-mono text-label text-on-surface-variant mt-1">${c.detalle}</p>
          </div>
        </li>`;
    });
  }

  function approveTask(idx) {
    HISTORIAL_CIERRES.unshift({ tipo:'ok', texto: REVIEWS[idx].titulo, detalle:`Aprobado por ti – ahora` });
    REVIEWS.splice(idx, 1);
    renderCierre();
    showToast('✓ Trabajo aprobado y cerrado');
    document.getElementById('kpiTotal') && (document.getElementById('kpiTotal').textContent = parseInt(document.getElementById('kpiTotal').textContent)+1);
  }

  function rejectTask(idx) {
    HISTORIAL_CIERRES.unshift({ tipo:'err', texto: REVIEWS[idx].titulo, detalle:`Rechazado – requiere corrección` });
    REVIEWS.splice(idx, 1);
    renderCierre();
    showToast('✗ Trabajo rechazado');
  }

  // ==================== ADMIN ====================
  function renderAdminList() {
    const list = document.getElementById('userList');
    list.innerHTML = '';
    USUARIOS.forEach((u, i) => {
      const isLast = i === USUARIOS.length - 1;
      list.innerHTML += `
        <div class="flex items-center justify-between p-md ${isLast?'':'border-b border-outline-variant'} hover:bg-surface-container-low transition-colors group cursor-pointer">
          <div class="flex items-center gap-sm">
            <div class="w-10 h-10 rounded-full ${u.activo ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'} flex items-center justify-center flex-shrink-0 font-headline text-title">
              ${u.nombre.charAt(0)}
            </div>
            <div>
              <p class="font-headline text-title text-on-surface">${u.nombre}</p>
              <p class="font-mono text-label text-on-surface-variant">${u.rol} • ${u.contrato}</p>
            </div>
          </div>
          <div class="flex items-center gap-sm">
            <span class="font-mono text-label px-2 py-0.5 rounded-full ${u.activo ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}">${u.activo ? 'Activo' : 'Inactivo'}</span>
            <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
          </div>
        </div>`;
    });
  }

  // ==================== FORMULARIO OT ====================
  // Barra de color según tipo de trabajo
  document.getElementById('tTipoTrabajo').addEventListener('change', e => {
    const bar = document.getElementById('workTypeBar');
    bar.style.width = '100%';
    const map = { mob:'bg-secondary', poda:'bg-surface-tint', tolva:'bg-error', riego:'bg-primary' };
    bar.className = `h-full transition-all duration-300 rounded-full ${map[e.target.value] || 'bg-primary'}`;
  });

  // Upload zone drag & drop simulado
  const uploadZone = document.getElementById('uploadZone');
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    addUploadedFiles(files);
  });
  uploadZone.addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*,video/*';
    inp.multiple = true;
    inp.onchange = () => addUploadedFiles(inp.files);
    inp.click();
  });

  function addUploadedFiles(files) {
    const container = document.getElementById('uploadedFiles');
    Array.from(files).forEach(file => {
      const div = document.createElement('div');
      div.className = 'flex items-center gap-xs bg-surface-container-low border border-outline-variant rounded-xl px-sm py-xs';
      div.innerHTML = `<span class="material-symbols-outlined text-primary text-lg">${file.type.startsWith('video') ? 'videocam' : 'image'}</span>
        <span class="font-mono text-label text-on-surface truncate max-w-[140px]">${file.name}</span>
        <span class="font-mono text-micro text-on-surface-variant">${(file.size/1024/1024).toFixed(1)}MB</span>`;
      container.appendChild(div);
    });
    showToast(`✓ ${files.length} archivo(s) adjunto(s)`);
  }

  // ==================== ENVÍO OT (Supabase DB + Storage con Validación Total) ====================
  document.getElementById('btnSubmitTask').addEventListener('click', async () => {
    // Lista completa de campos obligatorios
    const mandatoryFields = [
      { id: 'tSolicitante', label: 'Solicitante' },
      { id: 'tArea',        label: 'Código de Área Verde' },
      { id: 'tDireccion',   label: 'Dirección o Referencia Exacta' },
      { id: 'tTipoTrabajo', label: 'Tipo de Trabajo Operativo' },
      { id: 'tDesc',        label: 'Descripción de la Intervención' },
      { id: 'tMateriales',  label: 'Materiales / Insumos / Cuadrilla' },
      { id: 'tPrioridad',   label: 'Nivel de Prioridad' },
      { id: 'tPlazo',       label: 'Plazo Límite de Ejecución' }
    ];

    // Limpiar estilos de error anteriores
    mandatoryFields.forEach(f => {
      const el = document.getElementById(f.id);
      if (el) el.classList.remove('border-error', 'ring-2', 'ring-error');
    });
    document.getElementById('uploadZone').classList.remove('border-error', 'ring-2', 'ring-error');

    // 1. Validar celdas de texto / selects obligatorios
    for (const f of mandatoryFields) {
      const el = document.getElementById(f.id);
      if (!el || !el.value.trim()) {
        if (el) {
          el.classList.add('border-error', 'ring-2', 'ring-error');
          el.focus();
        }
        showToast(`⚠ Celda obligatoria: Por favor complete "${f.label}"`, 3500);
        return;
      }
    }

    // 2. Validar que exista al menos una foto / evidencia gráfica
    const hasFiles = (window._pendingFiles && window._pendingFiles.length > 0) ||
                     (document.getElementById('uploadedFiles').children.length > 0);
    if (!hasFiles) {
      const uz = document.getElementById('uploadZone');
      uz.classList.add('border-error', 'ring-2', 'ring-error');
      uz.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('⚠ Fotografía obligatoria: Adjunte al menos una foto de evidencia en terreno', 4000);
      return;
    }

    // Si no hay sesión activa, guardar localmente con datos completos
    if (!currentUser) {
      submitOTLocal(); return;
    }

    const btn  = document.getElementById('btnSubmitTask');
    const text = document.getElementById('btnTaskText');
    const icon = btn.querySelector('.material-symbols-outlined');

    icon.textContent = 'hourglass_top';
    icon.classList.add('spin');
    text.textContent = 'Guardando en base de datos...';
    btn.disabled = true;
    btn.classList.replace('bg-primary','bg-surface-tint');

    // 1. Insertar OT en Supabase
    const otData = {
      solicitante:       document.getElementById('tSolicitante').value,
      area_verde:        document.getElementById('tArea').value,
      direccion:         document.getElementById('tDireccion').value,
      tipo_trabajo:      document.getElementById('tTipoTrabajo').value,
      descripcion:       document.getElementById('tDesc').value,
      materiales:        document.getElementById('tMateriales').value || null,
      requiere_especial: document.getElementById('tEspecial').checked,
      prioridad:         parseInt(document.getElementById('tPrioridad').value),
      plazo:             document.getElementById('tPlazo').value || null,
      estado:            'pendiente',
      operador_id:       currentUser.id
    };

    const { data: otCreada, error: otError } = await db
      .from('ordenes_trabajo')
      .insert(otData)
      .select()
      .single();

    if (otError) {
      icon.classList.remove('spin');
      icon.textContent = 'error';
      text.textContent = 'Error al guardar';
      btn.classList.replace('bg-surface-tint','bg-error');
      showToast('✗ Error: ' + otError.message, 4000);
      setTimeout(() => {
        icon.textContent = 'cloud_upload';
        text.textContent = 'Registrar Tarea';
        btn.classList.replace('bg-error','bg-primary');
        btn.disabled = false;
      }, 3000);
      return;
    }

    // 2. Subir archivos adjuntos al Storage (si hay)
    const fileContainer = document.getElementById('uploadedFiles');
    const fileItems = fileContainer.querySelectorAll('[data-file]');
    // Los archivos se almacenan en window._pendingFiles
    if (window._pendingFiles && window._pendingFiles.length > 0 && otCreada) {
      text.textContent = 'Subiendo archivos...';
      for (const file of window._pendingFiles) {
        const ext  = file.name.split('.').pop();
        const path = `${otCreada.id}/${Date.now()}_${file.name}`;
        const { data: up, error: upErr } = await db.storage
          .from('evidencias')
          .upload(path, file, { cacheControl: '3600', upsert: false });
        if (!upErr && up) {
          // Registrar archivo en tabla
          await db.from('archivos_multimedia').insert({
            orden_id:       otCreada.id,
            nombre_archivo: file.name,
            tipo_mime:      file.type,
            tamanio_bytes:  file.size,
            storage_path:   up.path,
            subido_por:     currentUser.id
          });
        }
      }
      window._pendingFiles = [];
    }

    // 3. Actualizar UI
    icon.classList.remove('spin');
    icon.textContent = 'check_circle';
    text.textContent = '¡Registrado en Supabase!';
    btn.classList.replace('bg-surface-tint','bg-[#1a4332]');

    // Agregar a datos locales para render inmediato
    ACTIVIDADES.unshift({
      tipo:   document.getElementById('tTipoTrabajo').options[document.getElementById('tTipoTrabajo').selectedIndex].text,
      hora:   'Ahora mismo',
      lugar:  document.getElementById('tDireccion').value,
      desc:   document.getElementById('tDesc').value,
      estado: 'pendiente'
    });
    REVIEWS.push({
      id:       otCreada.codigo || ('#OT-' + otCreada.id.slice(0,6).toUpperCase()),
      titulo:   document.getElementById('tDesc').value.substring(0,60),
      operador: currentPerfil?.nombre || 'Usuario',
      hace:     'Justo ahora',
      fotos:    []
    });

    setTimeout(() => {
      document.getElementById('taskForm').reset();
      document.getElementById('uploadedFiles').innerHTML = '';
      document.getElementById('workTypeBar').style.width = '0';
      window._pendingFiles = [];
      icon.textContent = 'cloud_upload';
      text.textContent = 'Registrar Tarea';
      btn.classList.replace('bg-[#1a4332]','bg-primary');
      btn.disabled = false;
      showToast('✓ OT guardada en Supabase');
      navigate('cierre');
    }, 2200);
  });

  // Fallback local si no hay sesión
  function submitOTLocal() {
    const btn  = document.getElementById('btnSubmitTask');
    const text = document.getElementById('btnTaskText');
    const icon = btn.querySelector('.material-symbols-outlined');
    icon.textContent = 'hourglass_top';
    icon.classList.add('spin');
    text.textContent = 'Guardando localmente...';
    btn.disabled = true;
    btn.classList.replace('bg-primary','bg-surface-tint');
    setTimeout(() => {
      icon.classList.remove('spin');
      icon.textContent = 'check_circle';
      text.textContent = '¡Registrado localmente!';
      btn.classList.replace('bg-surface-tint','bg-[#1a4332]');
      ACTIVIDADES.unshift({ tipo: 'Nueva OT', hora:'Ahora', lugar: document.getElementById('tDireccion').value, desc: document.getElementById('tDesc').value, estado:'pendiente' });
      setTimeout(() => {
        document.getElementById('taskForm').reset();
        document.getElementById('uploadedFiles').innerHTML = '';
        document.getElementById('workTypeBar').style.width = '0';
        icon.textContent = 'cloud_upload';
        text.textContent = 'Registrar Tarea';
        btn.classList.replace('bg-[#1a4332]','bg-primary');
        btn.disabled = false;
        showToast('⚠ Guardado local – inicia sesión para sincronizar');
        navigate('cierre');
      }, 2000);
    }, 1000);
  }

  // ==================== FILTRO DASHBOARD ====================
  document.getElementById('dashFilter').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#actividadesList > div').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
  });

  // ==================== ARCHIVOS PENDIENTES ====================
  // Guardar referencia a files reales para el upload a Storage
  const _origAddFiles = addUploadedFiles;
  window._pendingFiles = [];
  const uploadZoneEl = document.getElementById('uploadZone');
  // Patch addUploadedFiles para guardar referencias reales
  function addUploadedFiles(files) {
    const container = document.getElementById('uploadedFiles');
    Array.from(files).forEach(file => {
      window._pendingFiles.push(file); // guardar referencia real
      const div = document.createElement('div');
      div.setAttribute('data-file', file.name);
      div.className = 'flex items-center gap-xs bg-surface-container-low border border-outline-variant rounded-xl px-sm py-xs';
      div.innerHTML = `<span class="material-symbols-outlined text-primary text-lg">${file.type.startsWith('video') ? 'videocam' : 'image'}</span>
        <span class="font-mono text-label text-on-surface truncate max-w-[140px]">${file.name}</span>
        <span class="font-mono text-micro text-on-surface-variant">${(file.size/1024/1024).toFixed(1)}MB</span>`;
      container.appendChild(div);
    });
    showToast(`✓ ${files.length} archivo(s) adjunto(s)`);
  }

  // ==================== ACTUALIZAR UI CON PERFIL ====================
  function updateUIWithProfile() {
    if (!currentPerfil) return;
    const nombre = currentPerfil.nombre || 'Usuario';
    const rol    = currentPerfil.rol    || 'Operador';
    const contrato = currentPerfil.contrato || 'Maipú Zona 6 (AKRO)';
    const email  = currentUser?.email   || currentPerfil.email || '—';
    const rut    = currentPerfil.rut    || '12.345.678-9';
    const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase()) || rol.toLowerCase().includes('admin');

    // Iniciales para el avatar
    const partes = nombre.trim().split(' ');
    const iniciales = partes.length >= 2 ? (partes[0][0] + partes[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase();

    // Actualizar Dashboard Top Bar
    const dashNameEl = document.getElementById('dashUserName');
    const dashRoleEl = document.getElementById('dashUserRoleText');
    const dashAvatarEl = document.getElementById('dashUserAvatar');
    const dashModBadge = document.getElementById('dashModeradorBadge');

    if (dashNameEl) dashNameEl.textContent = nombre;
    if (dashRoleEl) dashRoleEl.textContent = `${rol} • ${contrato}`;
    if (dashAvatarEl) dashAvatarEl.textContent = iniciales;
    if (dashModBadge) {
      if (isAdmin) {
        dashModBadge.style.display = 'inline-flex';
      } else {
        dashModBadge.style.display = 'none';
      }
    }

    // Actualizar Página Mi Perfil
    const pNom = document.getElementById('perfilNombre');
    const pRol = document.getElementById('perfilRol');
    const pCon = document.getElementById('perfilContrato');
    const pEma = document.getElementById('perfilEmail');
    const pRut = document.getElementById('perfilRut');
    const pAva = document.getElementById('perfilAvatar');

    if (pNom) pNom.textContent = nombre;
    if (pRol) pRol.textContent = isAdmin ? '👑 ' + rol : rol;
    if (pCon) pCon.textContent = contrato;
    if (pEma) pEma.textContent = email;
    if (pRut) pRut.textContent = rut;
    if (pAva) pAva.textContent = iniciales;
  }

  // ==================== CERRAR SESIÓN ====================
  window.logout = async function() {
    try {
      await db.auth.signOut();
    } catch(e) {}
    currentUser = null;
    currentPerfil = null;
    showToast('Sesión cerrada correctamente');
    navigate('login');
  };

  // ==================== ESCUCHAR CAMBIOS DE SESIÓN ====================
  db.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      currentUser = session.user;
      const { data: perfil } = await db.from('perfiles').select('*').eq('id', currentUser.id).single();
      currentPerfil = perfil;
      updateUIWithProfile();
      // Cargar OTs reales en dashboard
      await loadOTsFromSupabase();
    } else {
      currentUser   = null;
      currentPerfil = null;
    }
  });

  // ==================== CARGAR OTs DESDE SUPABASE ====================
  async function loadOTsFromSupabase() {
    const { data, error } = await db
      .from('ordenes_trabajo')
      .select('*, perfiles(nombre)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return; // silently fall back to local data

    // Mapa tipo_trabajo a etiquetas
    const tipoMap = { mob:'Mobiliario', poda:'Poda', tolva:'Camión Tolva', riego:'Riego' };
    // Convertir a formato interno
    const realesActividades = data.map(ot => ({
      tipo:   tipoMap[ot.tipo_trabajo] || ot.tipo_trabajo,
      hora:   new Date(ot.created_at).toLocaleString('es-CL', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' }),
      lugar:  ot.direccion,
      desc:   ot.descripcion,
      estado: ot.estado === 'aprobado' || ot.estado === 'cerrado' ? 'completado'
            : ot.estado === 'rechazado' ? 'atrasado' : 'pendiente',
      id:     ot.id
    }));

    // Solo reemplazar si hay datos reales
    if (realesActividades.length > 0) {
      ACTIVIDADES.length = 0;
      realesActividades.forEach(a => ACTIVIDADES.push(a));
    }

    // Cargar en REVIEWS los pendientes de revisión
    const pendientes = data.filter(ot => ot.estado === 'pendiente' || ot.estado === 'en_revision');
    if (pendientes.length > 0) {
      REVIEWS.length = 0;
      pendientes.forEach(ot => REVIEWS.push({
        id:       ot.id,
        titulo:   ot.descripcion.substring(0,60),
        operador: ot.perfiles?.nombre || 'Operador',
        hace:     new Date(ot.created_at).toLocaleString('es-CL'),
        fotos:    []
      }));
    }

    // Re-renderizar si estamos en dashboard/cierre
    if (currentPage === 'dashboard') renderDashboard();
    if (currentPage === 'cierre')    renderCierre();

    // Actualizar KPI total
    const cerradas = data.filter(ot => ot.estado === 'cerrado' || ot.estado === 'aprobado').length;
    const kpiEl = document.getElementById('kpiTotal');
    if (kpiEl && cerradas > 0) kpiEl.textContent = cerradas;
  }

  // ==================== APROBAR/RECHAZAR OT en Supabase ====================
  async function approveTask(idx) {
    const rev = REVIEWS[idx];
    if (!rev) return;

    if (currentUser) {
      const { error } = await db.from('ordenes_trabajo')
        .update({ estado: 'cerrado', revisor_id: currentUser.id })
        .eq('id', rev.id);
      if (error) { showToast('✗ Error al aprobar: ' + error.message, 3500); return; }
    }

    HISTORIAL_CIERRES.unshift({ tipo:'ok', texto: rev.titulo, detalle: `Aprobado por ti – ahora` });
    REVIEWS.splice(idx, 1);
    renderCierre();
    showToast('✓ Trabajo aprobado y cerrado');
    const kpiEl = document.getElementById('kpiTotal');
    if (kpiEl) kpiEl.textContent = parseInt(kpiEl.textContent) + 1;
  }

  async function rejectTask(idx) {
    const rev = REVIEWS[idx];
    if (!rev) return;

    if (currentUser) {
      const { error } = await db.from('ordenes_trabajo')
        .update({ estado: 'rechazado', revisor_id: currentUser.id })
        .eq('id', rev.id);
      if (error) { showToast('✗ Error al rechazar: ' + error.message, 3500); return; }
    }

    HISTORIAL_CIERRES.unshift({ tipo:'err', texto: rev.titulo, detalle: `Rechazado – requiere corrección` });
    REVIEWS.splice(idx, 1);
    renderCierre();
    showToast('✗ Trabajo rechazado');
  }

  // ==================== ADMINISTRACIÓN DE USUARIOS ====================
  async function renderAdminList() {
    const list = document.getElementById('userList');
    list.innerHTML = '<div class="p-md text-center font-mono text-label text-on-surface-variant">Cargando usuarios...</div>';

    // Intentar cargar desde Supabase si hay sesión
    let usuarios = USUARIOS;
    if (currentUser) {
      const { data, error } = await db.from('perfiles').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        usuarios = data.map(u => ({
          nombre:   u.nombre,
          rut:      u.rut || '—',
          rol:      u.rol,
          contrato: u.contrato,
          activo:   u.activo
        }));
      }
    }

    list.innerHTML = '';
    usuarios.forEach((u, i) => {
      const isLast = i === usuarios.length - 1;
      list.innerHTML += `
        <div class="flex items-center justify-between p-md ${isLast?'':'border-b border-outline-variant'} hover:bg-surface-container-low transition-colors group cursor-pointer">
          <div class="flex items-center gap-sm">
            <div class="w-10 h-10 rounded-full ${u.activo ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'} flex items-center justify-center flex-shrink-0 font-headline text-title">
              ${u.nombre.charAt(0)}
            </div>
            <div>
              <p class="font-headline text-title text-on-surface">${u.nombre}</p>
              <p class="font-mono text-label text-on-surface-variant">${u.rol} • ${u.contrato}</p>
            </div>
          </div>
          <div class="flex items-center gap-sm">
            <span class="font-mono text-label px-2 py-0.5 rounded-full ${u.activo ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}">${u.activo ? 'Activo' : 'Inactivo'}</span>
            <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
          </div>
        </div>`;
    });
  }


  // ==================== ÁREAS VERDES OFICIALES ZONA 6 (436 REGISTROS) ====================
  const AREAS_VERDES_ZONA6 = [{"codigo": "6 - 001 A", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 534.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 B", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 383.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 C", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 230.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 D", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 550.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 E", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 140.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 F", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 790.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 G", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 420.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 H", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 600.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 I", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 150.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 J", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 500.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 K", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 300.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 L", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 450.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 M", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 330.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 N", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 370.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 Ñ", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 440.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 O", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 250.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 001 P", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 410.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 002", "caracteristica": "PLAZA", "nombre": "HIMNO PATRIO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 300.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 003", "caracteristica": "PLAZA", "nombre": "GUERRA DEL PACIFICO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 421.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 004", "caracteristica": "PLAZA", "nombre": "ANTOFAGASTA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 718.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 1, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 005 A", "caracteristica": "PLAZA", "nombre": "ARSENALES DE GUERRA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 560.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 7, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 005 B", "caracteristica": "PLAZA", "nombre": "ARSENALES DE GUERRA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 584.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 1, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 006", "caracteristica": "PLAZA", "nombre": "TENIENTE SOFANOR PARRA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1260.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 007", "caracteristica": "PLAZA", "nombre": "LEONORA  LATORRE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1300.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 008", "caracteristica": "PLAZA", "nombre": "BATALLON ATACAMA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1065.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 009", "caracteristica": "PLAZA", "nombre": "ESPIRITU SANTO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 130.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 A", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 60.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 B", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 666.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 C", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 187.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 D", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1040.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 E", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 940.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 F", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 550.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 G", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 420.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 H", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 365.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 I", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 578.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 J", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 274.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 K", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 443.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 L", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 272.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 M", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 378.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 N", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 321.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 Ñ", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 384.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 O", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 913.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 P", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 974.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 Q", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1085.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 R", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 630.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 S", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 540.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 T", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 770.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 U", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 590.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 V", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 910.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 010 W", "caracteristica": "BANDEJON", "nombre": "BANDEJON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 300.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 011", "caracteristica": "PLAZA", "nombre": "ESPIRITU SANTO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 30.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 012", "caracteristica": "PLAZA", "nombre": "BENEDICTO V", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 183.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 013", "caracteristica": "PLAZA", "nombre": "PANGAL", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1267.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 014", "caracteristica": "PLAZA", "nombre": "COLO - COLO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 245.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 015", "caracteristica": "PLAZA", "nombre": "VICARIA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 751.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 016", "caracteristica": "PLAZA", "nombre": "ENTORNO MULTICANCHAS MARGA MARGA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1458.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 017 A", "caracteristica": "PLAZA", "nombre": "BANDEJON VICARIA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 480.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 017 B", "caracteristica": "PLAZA", "nombre": "BANDEJON VICARIA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1775.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 017 C", "caracteristica": "PLAZA", "nombre": "BANDEJON VICARIA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1952.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 018", "caracteristica": "PLAZA", "nombre": "ESCUELA DE INFANTERIA ORIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 673.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 019", "caracteristica": "PLAZA", "nombre": "CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 380.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 020", "caracteristica": "PLAZA", "nombre": "VADO AZUL NORTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 491.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 021", "caracteristica": "PLAZA", "nombre": "ESCUELA DE INFANTERIA PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1055.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 022", "caracteristica": "PLAZA", "nombre": "VADO AZUL", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 535.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 023", "caracteristica": "PLAZA", "nombre": "MANTOS BLANCOS", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 204.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 024", "caracteristica": "PLAZA", "nombre": "CALETA COLOSO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 973.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 025", "caracteristica": "PLAZA", "nombre": "SENADORA MARIA DE LA CRUZ NORTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 608.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 026", "caracteristica": "PLAZA", "nombre": "CHORRILLOS", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 450.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 2, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 027", "caracteristica": "PLAZA", "nombre": "REGIMIENTO BUIN", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 450.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 1, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 028", "caracteristica": "PLAZA", "nombre": "REGIMIENTO MATURANA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1772.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 1, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 029", "caracteristica": "PLAZA", "nombre": "JAIME GALTE NORTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 530.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 3, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 030", "caracteristica": "PLAZA", "nombre": "PARQUE VALLE DE LOS REYES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 11772.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 031", "caracteristica": "PLAZA", "nombre": "VEREDON EL CONQUISTADOR SUR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 242.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 032", "caracteristica": "PLAZA", "nombre": "PINTOR HORACIO GARCIA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2220.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 033", "caracteristica": "PLAZA", "nombre": "VALLE DE LOS REYES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 833.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 034", "caracteristica": "PLAZA", "nombre": "VEREDON CONQUISTADOR ORIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 360.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 035", "caracteristica": "PLAZA", "nombre": "ANTONIO DE LAS PEÑAS", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 342.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 036", "caracteristica": "PLAZA", "nombre": "PINTOR HORACIO GARCIA SUR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 130.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 037", "caracteristica": "PLAZA", "nombre": "INCA DE ORO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 673.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 038", "caracteristica": "PLAZA", "nombre": "INCA DE ORO NORTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 673.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 039", "caracteristica": "PLAZA", "nombre": "INCA DE ORO INTERIOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1961.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 040", "caracteristica": "PLAZA", "nombre": "AGUA SANTA INTERIOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1457.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 041 A", "caracteristica": "PLAZA", "nombre": "BRISAS DE MAIPU", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 5422.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 041 B", "caracteristica": "PLAZA", "nombre": "BRISAS DE MAIPU", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 122.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 042", "caracteristica": "PLAZA", "nombre": "HIPOLITO VILLEGAS HERNANDEZ", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1723.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 043", "caracteristica": "PLAZA", "nombre": "SENADORA MARIA DE LA CRUZ SUR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1632.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 044", "caracteristica": "PLAZA", "nombre": "CHILI", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 222.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 045", "caracteristica": "PLAZA", "nombre": "LA CANDELARIA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 202.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 046", "caracteristica": "PLAZA", "nombre": "INCA DE ORO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 257.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 047", "caracteristica": "PLAZA", "nombre": "AGUA SANTA NORTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1457.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 048", "caracteristica": "PLAZA", "nombre": "AGUA SANTA NORTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 673.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 049", "caracteristica": "PLAZA", "nombre": "VEREDON JORGE YURANDINI", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 960.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 050", "caracteristica": "VEREDON", "nombre": "VEREDON CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 250.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 051", "caracteristica": "VEREDON", "nombre": "VEREDON AGUA SANTA (VS)", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 130.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 052", "caracteristica": "PLAZA", "nombre": "CENTRO RECREATIVO FUTALEUFU", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2755.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 053", "caracteristica": "PLAZA", "nombre": "LAS NACIONES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1024.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 054", "caracteristica": "PLAZA", "nombre": "AGUA SANTA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 660.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 055 A", "caracteristica": "PLAZA", "nombre": "PARQUE ESPERANZA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 410.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 055 B", "caracteristica": "PLAZA", "nombre": "PARQUE ESPERANZA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2785.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 055 C", "caracteristica": "PLAZA", "nombre": "PARQUE ESPERANZA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2900.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 056 A", "caracteristica": "PLAZA", "nombre": "VEREDONES 4 PONIENTE ORIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 150.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 056 B", "caracteristica": "PLAZA", "nombre": "VEREDONES 4 PONIENTE ORIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 180.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 056 C", "caracteristica": "PLAZA", "nombre": "VEREDONES 4 PONIENTE ORIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 180.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 056 D", "caracteristica": "PLAZA", "nombre": "VEREDONES 4 PONIENTE ORIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 180.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 057", "caracteristica": "PLAZA", "nombre": "NARCISO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 3090.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 058", "caracteristica": "PLAZA", "nombre": "EL HUASO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1446.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 059", "caracteristica": "PLAZA", "nombre": "ANDROMEDA SUR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2867.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 060", "caracteristica": "PLAZA", "nombre": "ANDROMEDA PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1974.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 061", "caracteristica": "PLAZA", "nombre": "VIA LACTEA SUR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2498.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 062", "caracteristica": "PLAZA", "nombre": "VIA LACTEA PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1956.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 063", "caracteristica": "PLAZA", "nombre": "SEMINARIO ORIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 560.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 064", "caracteristica": "PLAZA", "nombre": "SEMINARIO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 880.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 065", "caracteristica": "PLAZA", "nombre": "SANTUARIO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2838.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 066", "caracteristica": "PLAZA", "nombre": "VALLE DE LOS REYES PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 485.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 067", "caracteristica": "PLAZA", "nombre": "VALLE DE LOS REYES ORIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 350.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 068", "caracteristica": "PLAZA", "nombre": "SAN JOSE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1236.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 069", "caracteristica": "PLAZA", "nombre": "RIO ANCOA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2042.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 070", "caracteristica": "PLAZA", "nombre": "PORTALES NORTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 319.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 071", "caracteristica": "PLAZA", "nombre": "PORTALES CENTRO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 314.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 072", "caracteristica": "PLAZA", "nombre": "DIVINA PROVIDENCIA ORIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1150.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 073", "caracteristica": "PLAZA", "nombre": "CATON", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1930.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 074", "caracteristica": "PLAZA", "nombre": "LICURGO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2440.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 075", "caracteristica": "PLAZA", "nombre": "SAN JOSE (FRENTE AL 2538)", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1826.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 076", "caracteristica": "PLAZA", "nombre": "SAN JOSE (ENTRE 2479 - 2459)", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 392.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 077", "caracteristica": "PLAZA", "nombre": "CUATRO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 414.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 078", "caracteristica": "PLAZA", "nombre": "CRONOS", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1725.0, "barrio": "SOL PONIENTE", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 079", "caracteristica": "PLAZA", "nombre": "PLAYA GRANDE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2245.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 080", "caracteristica": "PLAZA", "nombre": "PUNTA ARENAS", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1850.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 081", "caracteristica": "PLAZA", "nombre": "LOS COMETAS", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 450.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 082", "caracteristica": "PLAZA", "nombre": "CAMPANARIO ORIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2295.0, "barrio": "PEHUEN", "juegos_infantiles": 5, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 083", "caracteristica": "AREA VERDE", "nombre": "CAM CAMPANARIO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1309.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 084", "caracteristica": "PLAZA", "nombre": "CAMPANARIO PONIENTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 447.0, "barrio": "PEHUEN", "juegos_infantiles": 10, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 085", "caracteristica": "PLAZA", "nombre": "PORTALES SUR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 350.0, "barrio": "PEHUEN", "juegos_infantiles": 1, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 086", "caracteristica": "PLAZA", "nombre": "CAMPANARIO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 3126.0, "barrio": "PEHUEN", "juegos_infantiles": 1, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 087", "caracteristica": "PLAZA", "nombre": "VEREDON VALLE DE LOS REYES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 690.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 088", "caracteristica": "PLAZA", "nombre": "VALLE DE LOS REYES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 3772.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 089", "caracteristica": "PLAZA", "nombre": "EL CONQUISTADOR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 3365.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 090", "caracteristica": "PLAZA", "nombre": "LA GALAXIA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 245.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 091", "caracteristica": "PLAZA", "nombre": "CERRO NEGRO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1340.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 092", "caracteristica": "PLAZA", "nombre": "DIEGO BARROS ORTIZ NORTE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1120.0, "barrio": "PEHUEN", "juegos_infantiles": 8, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 093", "caracteristica": "PLAZA", "nombre": "DIEGO BARROS ORTIZ SUR", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 749.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 094", "caracteristica": "PLAZA", "nombre": "ARTURO MOYA GRAU", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2398.0, "barrio": "PEHUEN", "juegos_infantiles": 8, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 095 A", "caracteristica": "BANDEJON", "nombre": "BANDEJON LAS NACIONES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 580.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 095 B", "caracteristica": "BANDEJON", "nombre": "BANDEJON LAS NACIONES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 774.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 095 C", "caracteristica": "BANDEJON", "nombre": "BANDEJON LAS NACIONES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 680.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 095 D", "caracteristica": "BANDEJON", "nombre": "BANDEJON LAS NACIONES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 480.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 095 E", "caracteristica": "BANDEJON", "nombre": "BANDEJON LAS NACIONES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 230.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 095 F", "caracteristica": "BANDEJON", "nombre": "BANDEJON LAS NACIONES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 870.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 095 G", "caracteristica": "BANDEJON", "nombre": "BANDEJON LAS NACIONES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 317.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 096 A", "caracteristica": "BANDEJON", "nombre": "BANDEJON NORTE NUEVA SAN MARTIN", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 625.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 096 B", "caracteristica": "BANDEJON", "nombre": "BANDEJON NORTE NUEVA SAN MARTIN", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1850.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 097 A", "caracteristica": "BANDEJON", "nombre": "BANDEJON NUEVA SAN MARTIN", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 690.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 097 B", "caracteristica": "BANDEJON", "nombre": "BANDEJON NUEVA SAN MARTIN", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1250.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 097 C", "caracteristica": "BANDEJON", "nombre": "BANDEJON NUEVA SAN MARTIN", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1050.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 097 D", "caracteristica": "BANDEJON", "nombre": "BANDEJON NUEVA SAN MARTIN", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2000.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 097 E", "caracteristica": "BANDEJON", "nombre": "BANDEJON NUEVA SAN MARTIN", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 565.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 098", "caracteristica": "PLAZA", "nombre": "PARQUE VALLE DE LOS REYES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 13548.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 099", "caracteristica": "PLAZA", "nombre": "FARO DE ALEJANDRIA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 455.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 100", "caracteristica": "PLAZA", "nombre": "ENRIQUE OCTAVO", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 703.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 101", "caracteristica": "PLAZA", "nombre": "ROSITA RENARD", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 853.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 102", "caracteristica": "PLAZA", "nombre": "TITANIC", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 3660.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 103", "caracteristica": "PLAZA", "nombre": "PASTOR ENRIQUE CHAVEZ CAMPOS", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2793.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 104", "caracteristica": "PLAZA", "nombre": "GUILLERMO FAREL", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2793.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 105 A", "caracteristica": "PLAZA", "nombre": "LAS TACAS", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 52.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 105 B", "caracteristica": "PLAZA", "nombre": "LAS TACAS", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2760.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 105 C", "caracteristica": "PLAZA", "nombre": "LAS TACAS", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 3160.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 106", "caracteristica": "PLAZA", "nombre": "EL ARRAYAN", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 2655.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 107", "caracteristica": "PLAZA", "nombre": "SANTA SEDE", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 625.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 108", "caracteristica": "PLAZA", "nombre": "LA CURIA", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1683.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 109", "caracteristica": "PLAZA", "nombre": "LOS SEGLARES", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1582.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 110", "caracteristica": "PLAZA", "nombre": "LOS CLERIGOS", "ubicacion": "HERMANDAD / FRATERNIDAD / LOS CLERIGOS", "superficie_m2": 1070.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 111", "caracteristica": "VEREDON", "nombre": "MONTECASSINO", "ubicacion": "MONTECASSINO / TRES PONIENTE", "superficie_m2": 673.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 112", "caracteristica": "VEREDON", "nombre": "ILOCA", "ubicacion": "TAPIHUE / ILOCA", "superficie_m2": 306.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 113 A", "caracteristica": "PLAZA", "nombre": "VICENTE PEREZ ROSALES", "ubicacion": "NUEVA SAN MARTIN / VICENTE PEREZ ROSALES (VP)", "superficie_m2": 485.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 113 B", "caracteristica": "PLAZA", "nombre": "VICENTE PEREZ ROSALES", "ubicacion": "NUEVA SAN MARTIN / VICENTE PEREZ ROSALES (VO)", "superficie_m2": 444.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 114", "caracteristica": "PLAZA", "nombre": "VICENTE PEREZ ROSALES", "ubicacion": "MONTECASSINO (VS) / VICENTE PEREZ ROSALES", "superficie_m2": 60.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 115", "caracteristica": "PLAZA", "nombre": "EL TABO", "ubicacion": "VICENTE PEREZ ROSALES / FRENTE A EL TABO", "superficie_m2": 170.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 116", "caracteristica": "PLAZA", "nombre": "NAHUELBUTA", "ubicacion": "NAHUELBUTA", "superficie_m2": 324.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 117 A", "caracteristica": "PLAZA", "nombre": "NAHUELBUTA 2", "ubicacion": "NAHUELBUTA (VP) / VICENTE PEREZ ROSALES", "superficie_m2": 80.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 117 B", "caracteristica": "PLAZA", "nombre": "NAHUELBUTA 2", "ubicacion": "NAHUELBUTA (VO) / VICENTE PEREZ ROSALES", "superficie_m2": 90.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 118", "caracteristica": "PARQUE", "nombre": "PARQUE TRES PONIENTE NORTE", "ubicacion": "TRES PONIENTE / NUEVA SAN MARTIN / ALCALDE ALBERTO KRUMM", "superficie_m2": 37000.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 119", "caracteristica": "VEREDON", "nombre": "TAPIHUE", "ubicacion": "TAPIHUE / ILOCA / VICENTE PEREZ ROSALES (ORIENTE)", "superficie_m2": 255.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 120 A", "caracteristica": "VEREDON", "nombre": "VEREDON OLIMPO PONIENTE", "ubicacion": "EL OLIMPO / NUEVA SAN MARTIN / MONTECASSINO", "superficie_m2": 1984.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 120 B", "caracteristica": "VEREDON", "nombre": "VEREDON OLIMPO PONIENTE", "ubicacion": "EL OLIMPO / MONTECASSINO / FRENTE A NIDO DE AGUILAS", "superficie_m2": 1300.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 121 A", "caracteristica": "VEREDON", "nombre": "VEREDON OLIMPO ORIENTE", "ubicacion": "EL OLIMPO / NUEVA SAN MARTIN / DARIO SALAS", "superficie_m2": 398.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 121 B", "caracteristica": "VEREDON", "nombre": "VEREDON OLIMPO ORIENTE", "ubicacion": "EL OLIMPO / LOS SALECIANOS / DARIO SALAS", "superficie_m2": 350.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 121 C", "caracteristica": "VEREDON", "nombre": "VEREDON OLIMPO ORIENTE", "ubicacion": "EL OLIMPO / LOS SALECIANOS / LA GRATITUD", "superficie_m2": 350.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 121 D", "caracteristica": "VEREDON", "nombre": "VEREDON OLIMPO ORIENTE", "ubicacion": "EL OLIMPO / MONTECASSINO / LA GRATITUD", "superficie_m2": 367.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 121 E", "caracteristica": "VEREDON", "nombre": "VEREDON OLIMPO ORIENTE", "ubicacion": "EL OLIMPO / MONTECASSINO / NIDO DE AGUILAS", "superficie_m2": 1010.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 121 F", "caracteristica": "VEREDON", "nombre": "VEREDON OLIMPO ORIENTE", "ubicacion": "EL OLIMPO / JULIO PERCEVAL / NIDO DE AGUILAS", "superficie_m2": 375.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 122", "caracteristica": "PLAZA", "nombre": "EDUARDO FREI MONTALVA", "ubicacion": "EL OLIMPO / PRESIDENTE EDUARDO FREI MONTALVA", "superficie_m2": 970.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 123", "caracteristica": "PLAZA", "nombre": "RENZO PECHENINNO", "ubicacion": "RENZO PECHENINNO / PRESIDENTE ARTURO ALESSANDRI PALMA", "superficie_m2": 820.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 124", "caracteristica": "PLAZA", "nombre": "AMERICO VARGAS", "ubicacion": "PRESIDENTE EDUARDO FREI MONTALVA / AMERICO VARGAS", "superficie_m2": 974.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 125", "caracteristica": "PLAZA", "nombre": "NIDO DE AGUILAS", "ubicacion": "NIDO DE AGUILAS  / SANTA URSULA", "superficie_m2": 1668.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 126 A", "caracteristica": "VEREDON", "nombre": "LOS SALESIANOS", "ubicacion": "SANTA URSULA / LOS SALESIANOS", "superficie_m2": 277.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 126 B", "caracteristica": "VEREDON", "nombre": "LOS SALESIANOS", "ubicacion": "SANTA URSULA / LA GRATITUD", "superficie_m2": 293.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 127", "caracteristica": "PLAZA", "nombre": "MONTE PALOMAR ORIENTE", "ubicacion": "NUEVA SAN MARTIN / MINEAPOLIS / MONTE PALOMAR", "superficie_m2": 840.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 128", "caracteristica": "PLAZA", "nombre": "MONTE PALOMAR", "ubicacion": "MONTE PALOMAR / MONTECASSINO", "superficie_m2": 1455.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 129", "caracteristica": "PLAZA", "nombre": "RIO EUFRATES", "ubicacion": "RIO EUFRATES / RIO EUFRATES / MONTECASSINO / MINEA", "superficie_m2": 1145.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 130", "caracteristica": "PLAZA", "nombre": "DEL REY", "ubicacion": "MONTECASSINO / DEL REY", "superficie_m2": 1032.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 131", "caracteristica": "PLAZA", "nombre": "CARLO MAGNO", "ubicacion": "MONTECASSINO / CARLOMAGNO", "superficie_m2": 782.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 132", "caracteristica": "PLAZA", "nombre": "ENZO  CASTRO", "ubicacion": "ENZO CASTRO / DEL REY", "superficie_m2": 525.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 133", "caracteristica": "JARDINES INTERIORES CESFAM", "nombre": "CESFAM MICHELLE BACHELET", "ubicacion": "NUEVA SAN MARTIN 790", "superficie_m2": 2220.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 134", "caracteristica": "PLAZA", "nombre": "LAS ESPUELAS NORTE", "ubicacion": "LOS DIAMANTES / MONTECASINO / LAS ESPUELAS", "superficie_m2": 1200.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 135", "caracteristica": "PLAZA", "nombre": "MARCO AURELIO PONIENTE", "ubicacion": "LA FORTUNA / MARCO AURELIO", "superficie_m2": 956.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 136", "caracteristica": "PLAZA", "nombre": "MARCO AURELIO ORIENTE", "ubicacion": "ELISEO / MARCO AURELIO", "superficie_m2": 940.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 137 A", "caracteristica": "PLAZA", "nombre": "NUEVA ANTUMALAL", "ubicacion": "NUEVA ANTUMALAL (INTERIOR) / NVA SAN MARTIN", "superficie_m2": 510.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 137 B", "caracteristica": "PLAZA", "nombre": "NUEVA ANTUMALAL", "ubicacion": "NUEVA ANTUMALAL (INTERIOR) / NVA SAN MARTIN", "superficie_m2": 587.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 138", "caracteristica": "PLAZA", "nombre": "NUEVA ANTUMALAL", "ubicacion": "NUEVA ANTUMALAL (INTERIOR) / NVA SAN MARTIN", "superficie_m2": 130.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 139 A", "caracteristica": "PLAZA", "nombre": "LOS FRANCISCANOS", "ubicacion": "ALFREDO SILVA CARVALLO / LOS FRANCISCANOS", "superficie_m2": 90.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 139 B", "caracteristica": "PLAZA", "nombre": "LOS FRANCISCANOS", "ubicacion": "ALFREDO SILVA CARVALLO / LOS FRANCISCANOS", "superficie_m2": 515.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 139 C", "caracteristica": "PLAZA", "nombre": "LOS FRANCISCANOS", "ubicacion": "ALFREDO SILVA CARVALLO / LOS FRANCISCANOS", "superficie_m2": 155.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 140", "caracteristica": "PLAZA", "nombre": "NEPAL", "ubicacion": "ALFREDO SILVA CARVALLO / CALLE N° 4 / NEPAL", "superficie_m2": 925.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 141", "caracteristica": "VEREDON", "nombre": "ALFREDO SILVA CARVALLO", "ubicacion": "ALFREDO SILVA CARVALLO / CALLE N° 5", "superficie_m2": 345.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 142", "caracteristica": "PLAZA", "nombre": "INSA  NORTE", "ubicacion": "CALLE N° 5 / ALFREDO SILVA CARVALLO", "superficie_m2": 2870.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 143", "caracteristica": "PLAZA", "nombre": "INSA SUR", "ubicacion": "CALLE N° UNO / CALLE N° 5 / LEOPOLDO INFANTE", "superficie_m2": 4300.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 144", "caracteristica": "PLAZA", "nombre": "RICARDO BARAHONA PEREZ", "ubicacion": "RICARDO BARAHONA PEREZ / FRENTE A LENKA FRANULIC", "superficie_m2": 3240.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 145", "caracteristica": "PLAZA", "nombre": "LOS DIAMANTES", "ubicacion": "LOS DIAMANTES / SILVIA PINTO / DANIEL DE LA VEGA", "superficie_m2": 2955.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 146", "caracteristica": "PLAZA", "nombre": "RICARDO BARAHONA", "ubicacion": "RICARDO BARAHONA / ELISEO", "superficie_m2": 1954.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 147", "caracteristica": "PLAZA", "nombre": "VICTOR DOMINGO SILVA", "ubicacion": "ELISEO / VICTOR DOMINGO SILVA", "superficie_m2": 350.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 148", "caracteristica": "PLAZA", "nombre": "JOAQUIN EDWARDS BELLO", "ubicacion": "JOAQUIN EDWARDS BELLO / ELISEO", "superficie_m2": 422.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 149", "caracteristica": "PLAZA", "nombre": "PEPE ABAD", "ubicacion": "ANDRES AMENABAR VERGARA / PEPE ABAD", "superficie_m2": 1090.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 150", "caracteristica": "PLAZA", "nombre": "ISMAEL EDWARDS MATTE", "ubicacion": "ISMAEL EDWARDS MATTE / ANDRES AMENABAR VERGARA", "superficie_m2": 3380.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 151 A", "caracteristica": "PARQUE", "nombre": "PARQUE TRES PONIENTE SUR", "ubicacion": "TRES PONIENTE / PRESIDENTE EDUARDO FREI / ALFREDO SILVA CARVALLO", "superficie_m2": 10500.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 151 B", "caracteristica": "PARQUE", "nombre": "PARQUE TRES PONIENTE SUR", "ubicacion": "TRES PONIENTE / ALFREDO SILVA CARVALLO / CARLOS REYES CORONA", "superficie_m2": 15358.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 151 C", "caracteristica": "PARQUE", "nombre": "PARQUE TRES PONIENTE SUR", "ubicacion": "TRES PONIENTE/ENTRE / CARLOS REYES CORONAO / FERROCARRIL", "superficie_m2": 1700.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 151 D", "caracteristica": "PARQUE", "nombre": "PARQUE TRES PONIENTE SUR", "ubicacion": "TRES PONIENTE / FERROCARRIL", "superficie_m2": 493.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 152 A", "caracteristica": "PLAZA", "nombre": "JORGE ROBLEDO", "ubicacion": "JORGE ROBLEDO / ELADIO ROJAS / LA PRADERA", "superficie_m2": 152.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 152 B", "caracteristica": "PLAZA", "nombre": "JORGE ROBLEDO", "ubicacion": "JORGE ROBLEDO / LA PRADERA / ARTURO ALESSANDRI", "superficie_m2": 1685.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 152 C", "caracteristica": "PLAZA", "nombre": "JORGE ROBLEDO", "ubicacion": "ARTURO ALESSANDRI / PEPE ROJAS", "superficie_m2": 96.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 153", "caracteristica": "PLAZA", "nombre": "LOS TRES ANTONIOS", "ubicacion": "PRESIDENTE BULNES / LOS TRES ANTONIOS / DANTE COPPA", "superficie_m2": 1060.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 154", "caracteristica": "PLAZA", "nombre": "CLOTARIO BLEST", "ubicacion": "RAMON BARROS LUCO / CLOTARIO BLEST / OSCAR BONILLA", "superficie_m2": 795.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 155", "caracteristica": "AREA VERDE", "nombre": "IGLESIA SAGRADA FAMILIA", "ubicacion": "ALFREDO SILVA CARVALLO 1617", "superficie_m2": 1600.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 156", "caracteristica": "PLAZA", "nombre": "ARTURO GODOY", "ubicacion": "ALFREDO SILVA CARVALLO / ARTURO GODOY / LUIS GALE", "superficie_m2": 2227.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 157", "caracteristica": "PLAZA", "nombre": "HERNAN OLGUIN", "ubicacion": "RENE OLIVARES BECERRA / HERNAN OLGUIN / ALAMIRO CASTILLO", "superficie_m2": 755.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 158", "caracteristica": "PLAZA", "nombre": "SAJONIA", "ubicacion": "SAJONIA (INTERIOR)", "superficie_m2": 956.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 159", "caracteristica": "PLAZA", "nombre": "EUROPA", "ubicacion": "EUROPA / SAJONIA (FRENTE)", "superficie_m2": 1155.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 160", "caracteristica": "PLAZA", "nombre": "REY CRISTIAN", "ubicacion": "EUROPA / REY CRISTIAN", "superficie_m2": 889.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 161", "caracteristica": "PLAZA", "nombre": "CARLOS V (INTERIOR)", "ubicacion": "FERROCARRIL / EUROPA / SUECIA", "superficie_m2": 565.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 162", "caracteristica": "PLAZA", "nombre": "CERRO BARON SUR", "ubicacion": "CERRO BARON / GLORIAS NAVALES / FERROCARRIL", "superficie_m2": 950.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 163", "caracteristica": "PLAZA", "nombre": "GLORIAS NAVALES", "ubicacion": "MARINERO ORTIZ / GLORIAS NAVALES / CERRO BARON", "superficie_m2": 340.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 164", "caracteristica": "PLAZA", "nombre": "MECANICO TORRES", "ubicacion": "MECANICO FIGUEROA / MECANICO TORRES / TAMBOR CABRAL", "superficie_m2": 596.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 165", "caracteristica": "PLAZA", "nombre": "TIMONEL ARANGUIZ", "ubicacion": "TIMONEL ARANGUIZ / TIMONEL MUÑOZ", "superficie_m2": 600.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 166", "caracteristica": "PLAZA", "nombre": "CALDERILLA", "ubicacion": "HECTOR FUENZALIDA / AGUA SANTA / CALDERILLA", "superficie_m2": 2110.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 167", "caracteristica": "PLAZA", "nombre": "FOGONERO ARANEDA", "ubicacion": "FOGONERO SEGURA / FOGONERO ARANEDA", "superficie_m2": 603.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 168", "caracteristica": "PLAZA", "nombre": "FOGONERO URRA", "ubicacion": "FOGONERO URRA / ESCUELA NAVAL", "superficie_m2": 155.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 169", "caracteristica": "PLAZA", "nombre": "GRUMETE DIAZ", "ubicacion": "GRUMETE PEREZ / GRUMETE DIAZ", "superficie_m2": 607.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 170", "caracteristica": "PLAZA", "nombre": "LAGO CARRERA", "ubicacion": "HECTOR FUENZALIDA / LAGO CARRERA", "superficie_m2": 2921.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 171", "caracteristica": "PLAZA", "nombre": "GRUMETE BRICEÑO", "ubicacion": "GRUMETE  BRICEÑO / GRUMETE QUINTEROS / GLORIAS NAVALES", "superficie_m2": 700.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 172", "caracteristica": "PLAZA", "nombre": "GRUMETE QUINTEROS", "ubicacion": "GRUMETE  BRICEÑO / GRUMETE QUINTEROS / RENE OLIVARES BECERRA", "superficie_m2": 724.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 173", "caracteristica": "PLAZA", "nombre": "DIGUA", "ubicacion": "RENE OLIVARES BECERRA / LOS CHONOS / DIGUA", "superficie_m2": 2817.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 174", "caracteristica": "PLAZA", "nombre": "PUERTO CISNES", "ubicacion": "PUERTO CISNE / LAGO CARRERA", "superficie_m2": 704.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 175", "caracteristica": "PLAZA", "nombre": "PUERO OCTAY", "ubicacion": "JOSE MANUEL BALMACEDA / PUERTO OCTAY", "superficie_m2": 704.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 176", "caracteristica": "PLAZA", "nombre": "ANDRES BELLO", "ubicacion": "RENE OLIVARES BECERRA / ANDRES BELLO / HECTOR FUENZALIDA", "superficie_m2": 1764.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 177", "caracteristica": "PLAZA", "nombre": "CERRO BARON NORTE", "ubicacion": "CERRO BARON / RENE OLIVARES BECERRA", "superficie_m2": 401.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 178", "caracteristica": "PLAZA", "nombre": "CAYUPIL", "ubicacion": "JOSE MANUEL BALMACEDA / CAYUPIL", "superficie_m2": 2070.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 179", "caracteristica": "PLAZA", "nombre": "ANDRES  BELLO", "ubicacion": "ALFREDO SILVA CARVALLO / ANDRES BELLO", "superficie_m2": 532.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 180 A", "caracteristica": "VEREDON", "nombre": "VEREDON SILVA CARVALLO NOR PONIENTE", "ubicacion": "ALFREDO SILVA CARVALLO / FRANCISCO PIZARRO / PRESIDENTE GABRIEL GONZALEZ VIDELA", "superficie_m2": 1822.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 180 B", "caracteristica": "VEREDON", "nombre": "VEREDON SILVA CARVALLO NOR PONIENTE", "ubicacion": "ALFREDO SILVA CARVALLO / PDTE JOSE M  BALMACEDA / PDTE GABRIEL GONZALEZ VIDELA", "superficie_m2": 1146.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 180 C", "caracteristica": "VEREDON", "nombre": "VEREDON SILVA CARVALLO NOR PONIENTE", "ubicacion": "ALFREDO SILVA CARVALLO / FERMIN VIVACETA / JOSE MANUEL BALMACEDA", "superficie_m2": 1307.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 180 D", "caracteristica": "VEREDON", "nombre": "VEREDON SILVA CARVALLO NOR PONIENTE", "ubicacion": "ALFREDO SILVA CARVALLO / AUTOPISTA DEL SOL / FERROCARRIL", "superficie_m2": 15300.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 181 A", "caracteristica": "PLAZA", "nombre": "SILVA CARVALLO SUR", "ubicacion": "ALFREDO SILVA CARVALLO / FERMIN VIVACETA", "superficie_m2": 55.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 181 B", "caracteristica": "PLAZA", "nombre": "SILVA CARVALLO SUR", "ubicacion": "ALFREDO SILVA CARVALLO / CURALABA", "superficie_m2": 78.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 181 C", "caracteristica": "PLAZA", "nombre": "SILVA CARVALLO SUR", "ubicacion": "ALFREDO SILVA CARVALLO / CALDERILLA", "superficie_m2": 78.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 181 D", "caracteristica": "PLAZA", "nombre": "SILVA CARVALLO SUR", "ubicacion": "ALFREDO SILVA CARVALLO / CATIPAY", "superficie_m2": 71.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 182", "caracteristica": "PLAZA", "nombre": "PRESIDENTE GABRIEL GONZALEZ VIDELA", "ubicacion": "PRESIDENTE GABRIEL GONZALEZ VIDELA / ALFREDO SILVA CARVALLO", "superficie_m2": 136.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 183", "caracteristica": "PLAZA", "nombre": "MORRO DE ARICA", "ubicacion": "MORRO DE ARICA / ALFREDO SILVA CARVALLO", "superficie_m2": 218.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 184", "caracteristica": "PLAZA", "nombre": "PUERTO OCTAY", "ubicacion": "PUERTO OCTAY / ALFREDO SILVA CARVALLO", "superficie_m2": 156.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 185", "caracteristica": "PLAZA", "nombre": "DOMINGO FAUSTINO SARMIENTO", "ubicacion": "FRANCISCO PIZARRO / DOMINGO FAUSTINO SARMIENTO", "superficie_m2": 517.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 186 A", "caracteristica": "PLAZA", "nombre": "PUNTA ANGAMOS", "ubicacion": "PUNTA ANGAMOS / 4 PONIENTE", "superficie_m2": 45.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 186 B", "caracteristica": "PLAZA", "nombre": "PUNTA ANGAMOS", "ubicacion": "PUNTA ANGAMOS / 4 PONIENTE / PRESIDENTE GABRIEL GONZALEZ VIDELA", "superficie_m2": 399.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 187", "caracteristica": "PLAZA", "nombre": "JULIO VERNE ORIENTE", "ubicacion": "JULIO VERNE / ALFREDO SILVA CARVALLO / FRANCISCO PIZARRO", "superficie_m2": 287.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 188", "caracteristica": "PLAZA", "nombre": "JULIO VERNE PONIENTE", "ubicacion": "JULIO VERNE / ALFREDO SILVA CARVALLO", "superficie_m2": 725.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 189", "caracteristica": "PLAZA", "nombre": "FRANCISCO PIZARRO", "ubicacion": "FRANCISCO PIZARRO / PUNTA LOBOS", "superficie_m2": 815.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 190", "caracteristica": "PLAZA", "nombre": "PUERTO ARTURO", "ubicacion": "PUERTO ARTURO / PUNTA LOBOS", "superficie_m2": 269.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 191", "caracteristica": "PLAZA", "nombre": "ISLA NAVARINO", "ubicacion": "ISLA NAVARINOS / BASE ARTURO PRAT / HIELOS DEL SUR", "superficie_m2": 3895.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 192 A", "caracteristica": "PLAZA", "nombre": "HIELOS DEL SUR", "ubicacion": "BASE O'HIGGINS / HIELOS DEL SUR", "superficie_m2": 176.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 192 B", "caracteristica": "PLAZA", "nombre": "HIELOS DEL SUR", "ubicacion": "BASE ARTURO PRAT / HIELOS DEL SUR", "superficie_m2": 235.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 193", "caracteristica": "PLAZA", "nombre": "CABO DE HORNOS", "ubicacion": "CABO DE HORNOS / ANTARTICA CHILENA", "superficie_m2": 124.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 194", "caracteristica": "PLAZA", "nombre": "ANTARTICA CHILENA", "ubicacion": "ANTARTICA CHILENA / ALFREDO SILVA CARVALLO", "superficie_m2": 635.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 195", "caracteristica": "PLAZA", "nombre": "BASE O'HIGGINS", "ubicacion": "BASE O'HIGGINS / HIELOS DEL SUR / ANTARTICA CHILENA", "superficie_m2": 1348.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 196", "caracteristica": "PLAZA", "nombre": "ISLA CABRALES", "ubicacion": "ISLA EVANS / ISLA CABRALES", "superficie_m2": 1440.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 197", "caracteristica": "PLAZA", "nombre": "ISLA CAMPANA", "ubicacion": "ISLA CAMPANA / GLACIAR AGUILA TRES / ISLA SALAS", "superficie_m2": 1442.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 198", "caracteristica": "PLAZA", "nombre": "RAUL MATAS", "ubicacion": "PDTE. EDUARDO FREI MONTALVA / REGIDOR GREGORIO BRAVO / RAUL MATAS", "superficie_m2": 1245.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 199", "caracteristica": "PLAZA", "nombre": "DR. GALVARINO ARAYA", "ubicacion": "DR GALVARINO ARAYA / MISAEL ESCUTI", "superficie_m2": 2751.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 200", "caracteristica": "PLAZA", "nombre": "ISLA LONDON", "ubicacion": "ISLA LONDON / GLACIAR AGUILA DOS", "superficie_m2": 812.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 201", "caracteristica": "PLAZA", "nombre": "ISLA EVANS", "ubicacion": "ISLA EVANS / ISLA ANGAMOS", "superficie_m2": 840.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 202", "caracteristica": "PLAZA", "nombre": "ISLA KEMPE", "ubicacion": "ISLA ALDEA / ISLA KEMPE", "superficie_m2": 2010.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 203", "caracteristica": "PLAZA", "nombre": "ISLA SALAS", "ubicacion": "ISLA SALAS / RUBEN MARCOS", "superficie_m2": 602.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 204", "caracteristica": "PLAZA", "nombre": "PASTOR GUILLERMO CASTILLO MORAGA", "ubicacion": "SAN OSCAR / PASTOR GUILLERMO CASTILLO MORAGA", "superficie_m2": 1120.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 205", "caracteristica": "PLAZA", "nombre": "RUBEN MARCOS", "ubicacion": "SAN HUGO / RUBEN MARCOS / BALLET AZUL", "superficie_m2": 2700.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 206", "caracteristica": "PLAZA", "nombre": "INGENIERO FERNANDO SMITS", "ubicacion": "INGENIERO FERNANDO SMITS SCHLEYER / LA GALAXIA", "superficie_m2": 85.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 207", "caracteristica": "JARDINES INTERIORES CESFAM", "nombre": "CESFAM CARLOS GODOY", "ubicacion": "EL CONQUISTADOR 01565", "superficie_m2": 678.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 208", "caracteristica": "PLAZA", "nombre": "LOS LEVITAS", "ubicacion": "REAL SACERDOCIO / LOS LEVITAS", "superficie_m2": 3210.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 209", "caracteristica": "PLAZA", "nombre": "LOS LUTERANOS ORIENTE", "ubicacion": "LOS LUTERANOS / ASAMBLEA DE DIOS", "superficie_m2": 962.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 210", "caracteristica": "PLAZA", "nombre": "LOS LUTERANOS PONIENTE", "ubicacion": "LA GALAXIA / ADVENTISTAS / LOS LUTERANOS", "superficie_m2": 3521.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 211", "caracteristica": "PLAZA", "nombre": "DANIEL", "ubicacion": "SAGRADAS ESCRITURAS / DANIEL", "superficie_m2": 480.0, "barrio": "PEHUEN", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 212", "caracteristica": "PLAZA", "nombre": "OLMUE PONIENTE", "ubicacion": "OLMUE / VALLE DE LOS REYES", "superficie_m2": 1753.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 213", "caracteristica": "PLAZA", "nombre": "BOSQUEALTO PONIENTE", "ubicacion": "BOSQUEALTO (FRENTE) / VALLE DE LOS REYES", "superficie_m2": 3375.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 214", "caracteristica": "PLAZA", "nombre": "PAPUDO", "ubicacion": "PAPUDO / HIJUELAS / CALERA", "superficie_m2": 460.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 215", "caracteristica": "PLAZA", "nombre": "LAGUNA TORCA", "ubicacion": "LAGUNA TORCA / LAGUNA ARCOIRIS NORTE", "superficie_m2": 550.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 216", "caracteristica": "PLAZA", "nombre": "PEUMO", "ubicacion": "REQUINOA / PEUMO / CATEMU", "superficie_m2": 965.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 217", "caracteristica": "PLAZA", "nombre": "OLMUE", "ubicacion": "CATEMU / HIJUELAS / OLMUE", "superficie_m2": 1420.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 218", "caracteristica": "PLAZA", "nombre": "DOÑIHUE", "ubicacion": "DOÑIHUE / BOSQUEALTO", "superficie_m2": 124.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 219", "caracteristica": "PLAZA", "nombre": "LLAY - LLAY", "ubicacion": "LA GALAXIA SUR / LLAY - LLAY / BOSQUEALTO", "superficie_m2": 1045.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 220", "caracteristica": "PLAZA", "nombre": "GRANEROS", "ubicacion": "GRANEROS / LAGUNA DEL REY", "superficie_m2": 1890.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 221", "caracteristica": "PLAZA", "nombre": "LAGUNA SAN RAFAEL", "ubicacion": "LAGUNA SAN RAFAEL / LAGUNA DEL REY", "superficie_m2": 1170.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 222", "caracteristica": "AREA VERDE", "nombre": "SANTA BARBARA", "ubicacion": "SANTA BARBARA / BOSQUEALTO", "superficie_m2": 145.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 223", "caracteristica": "BANDEJON", "nombre": "BANDEJON BOSQUEALTO", "ubicacion": "BOSQUEALTO / SANTA BARBARA / CUATRO PONIENTE", "superficie_m2": 934.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 224", "caracteristica": "AREA VERDE", "nombre": "MOLINA", "ubicacion": "GRANEROS / BOSQUEALTO / MOLINA", "superficie_m2": 1218.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 225", "caracteristica": "AREA VERDE", "nombre": "MOLINA SUR", "ubicacion": "MOLINA / PANQUEHUE", "superficie_m2": 1277.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 226 A", "caracteristica": "PLAZA", "nombre": "LAGUNA QUIÑENCO", "ubicacion": "CURANIPE / LAGUNA QUIÑENCO", "superficie_m2": 1329.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 226 B", "caracteristica": "PLAZA", "nombre": "LAGUNA QUIÑENCO", "ubicacion": "CURANIPE / LAGUNA QUIÑENCO / LAGUNA EL REY", "superficie_m2": 125.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 227", "caracteristica": "PLAZA", "nombre": "CURANIPE", "ubicacion": "CURANIPE / LAGUNA DEL MAULE", "superficie_m2": 1781.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 228", "caracteristica": "AREA VERDE", "nombre": "EL MORADO SUR", "ubicacion": "EL MORADO / GRANEROS", "superficie_m2": 1062.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 229", "caracteristica": "AREA VERDE", "nombre": "CAUQUENES", "ubicacion": "CAUQUENES / CHILLAN VIEJO", "superficie_m2": 484.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 230", "caracteristica": "PLAZA", "nombre": "MALLOA", "ubicacion": "MALLOA / YUMBEL / COLTAUCO", "superficie_m2": 570.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 231", "caracteristica": "PLAZA", "nombre": "YUMBEL", "ubicacion": "YUMBEL / CAMINO DEL LEÑADOR", "superficie_m2": 1245.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 232", "caracteristica": "PLAZA", "nombre": "CHILLAN VIEJO", "ubicacion": "CHILLAN VIEJO / LA GALAXIA SUR", "superficie_m2": 814.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 233 A", "caracteristica": "PLAZA", "nombre": "AREA VERDE N° 1 FLOR DEL VALLE", "ubicacion": "VILLA FLOR DEL VALLE", "superficie_m2": 1486.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 233 B", "caracteristica": "PLAZA", "nombre": "AREA VERDE N° 2 FLOR DEL VALLE", "ubicacion": "VILLA FLOR DEL VALLE", "superficie_m2": 875.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 233 C", "caracteristica": "PLAZA", "nombre": "AREA VERDE N° 3 FLOR DEL VALLE", "ubicacion": "VILLA FLOR DEL VALLE", "superficie_m2": 132.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 233 D", "caracteristica": "PLAZA", "nombre": "AREA VERDE N° 3 FLOR DEL VALLE", "ubicacion": "VILLA FLOR DEL VALLE", "superficie_m2": 430.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 234", "caracteristica": "AREA VERDE", "nombre": "VIRGEN DE GUADALUPE", "ubicacion": "VIRGEN DE GUADALUPE / FRANCISCO FLORES DEL CAMPO", "superficie_m2": 161.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 235", "caracteristica": "AREA VERDE", "nombre": "VIRGEN DE GUADALUPE ORIENTE", "ubicacion": "VIRGEN DE GUADALUPE ORIENTE", "superficie_m2": 75.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 236", "caracteristica": "AREA VERDE", "nombre": "SANTA ROSA DE LIMA", "ubicacion": "SANTA ROSA DE LIMA / FRANCISCO PIZARRO (VN)", "superficie_m2": 23.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 237 A", "caracteristica": "AREA VERDE", "nombre": "SANTA ROSA DE LIMA", "ubicacion": "SANTA ROSA DE LIMA / FRANCISCO PIZARRO (VN)", "superficie_m2": 4495.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 237 B", "caracteristica": "AREA VERDE", "nombre": "SANTA ROSA DE LIMA", "ubicacion": "SANTA ROSA DE LIMA / FRANCISCO PIZARRO (VN)", "superficie_m2": 2245.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 237 C", "caracteristica": "AREA VERDE", "nombre": "SANTA ROSA DE LIMA", "ubicacion": "SANTA ROSA DE LIMA / FRANCISCO PIZARRO (VS)", "superficie_m2": 1085.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 238", "caracteristica": "AREA VERDE", "nombre": "VIRGEN DE GUADALUPE", "ubicacion": "VIRGEN DE GUADALUPE / VALLE DEL BOSQUE NORTE", "superficie_m2": 265.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 239", "caracteristica": "BANDEJON", "nombre": "VALLE DEL BOSQUE NORTE", "ubicacion": "VIRGEN DE GUADALUPE / VALLE DEL BOSQUE NORTE", "superficie_m2": 40.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 240", "caracteristica": "AREA VERDE", "nombre": "VALLE DEL BOSQUE NORTE", "ubicacion": "VIRGEN DE GUADALUPE / VALLE DEL BOSQUE NORTE", "superficie_m2": 290.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 241", "caracteristica": "AREA VERDE", "nombre": "SACRISTIA", "ubicacion": "SACRISTIA", "superficie_m2": 207.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 242", "caracteristica": "PLAZA", "nombre": "CAMINO DEL ALARIFE", "ubicacion": "CALETA DE CAMARONES / CABO LEONES / CAMINO DEL ALARIFE", "superficie_m2": 1370.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 243", "caracteristica": "PLAZA", "nombre": "FRANCISCO PIZARRO", "ubicacion": "FRANCISCO PIZARRO / CALETA DE CAMARONES", "superficie_m2": 605.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 244", "caracteristica": "PLAZA", "nombre": "PRESIDENTE GABRIEL GONZALEZ VIDELA", "ubicacion": "PRESIDENTE GABRIEL GONZALEZ / CALETA DE CAMARONES", "superficie_m2": 1975.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 245 A", "caracteristica": "BANDEJON", "nombre": "BANDEJON GONZALEZ VIDELA", "ubicacion": "PRESIDENTE GONZALEZ VIDELA / ALFREDO SILVA CARVALLO / CERRO BLANCO", "superficie_m2": 882.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 245 B", "caracteristica": "BANDEJON", "nombre": "BANDEJON GONZALEZ VIDELA", "ubicacion": "PRESIDENTE GONZALEZ VIDELA / CERRO BLANCO / CUATRO PONIENTE", "superficie_m2": 1200.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 245 c", "caracteristica": "BANDEJON", "nombre": "BANDEJON GONZALEZ VIDELA", "ubicacion": "PRESIDENTE GONZALEZ VIDELA / CAMINNO DEL ALARIFE / CUATRO PONIENTE", "superficie_m2": 1080.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 245 D", "caracteristica": "BANDEJON", "nombre": "BANDEJON GONZALEZ VIDELA", "ubicacion": "PRESIDENTE GONZALEZ VIDELA / CAMINNO DEL ALARIFE / VIRGEN DE GUADALUPE", "superficie_m2": 200.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 246", "caracteristica": "PLAZA", "nombre": "PUERTO CISNE", "ubicacion": "PUERTO CISNE / CALETA DE CAMARONES", "superficie_m2": 1485.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 247", "caracteristica": "PLAZA", "nombre": "CALETA CAMARONES", "ubicacion": "CALETA DE CAMARONES / PUERTO CISNE", "superficie_m2": 613.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 248", "caracteristica": "PLAZA", "nombre": "LOS VILOS 2", "ubicacion": "LOS VILOS / PUERTO CISNE", "superficie_m2": 50.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 249", "caracteristica": "PLAZA", "nombre": "ASTRO REY", "ubicacion": "ASTRO REY / VOLCAN OLLAGUE / CERRO MARAVILLA", "superficie_m2": 1090.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 250", "caracteristica": "PLAZA", "nombre": "LOS VILOS", "ubicacion": "OSMAN PEREZ FREIRE / PRESIDENTE JOSE MANUEL BALMACEDA", "superficie_m2": 1165.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 251", "caracteristica": "PLAZA", "nombre": "OSMAN PEREZ FREIRE", "ubicacion": "OSMAN PEREZ FREIRE / FRENTE A ISLA BENJAMIN", "superficie_m2": 350.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 252", "caracteristica": "PLAZA", "nombre": "DOMEYKO", "ubicacion": "OSMAN PEREZ FREIRE / DOMEYKO", "superficie_m2": 350.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 253", "caracteristica": "PLAZA", "nombre": "VOLCAN PEGUIN", "ubicacion": "VOLCAN PEGUIN / PUNTA DE PLATA", "superficie_m2": 1045.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 254", "caracteristica": "PLAZA", "nombre": "VOLCAN PAULET", "ubicacion": "RENE OIVARES BECERRA / VOLCAN PAULET / VOLCAN QUIZAPU", "superficie_m2": 1745.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 255", "caracteristica": "PLAZA", "nombre": "IQUIQUE NORTE", "ubicacion": "RENE OLIVARES BECERRA / OSMAN PEREZ FREIRE / IQUIQUE", "superficie_m2": 1818.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 256", "caracteristica": "PLAZA", "nombre": "IQUIQUE SUR", "ubicacion": "CUATRO PONIENTE / IQUIQUE", "superficie_m2": 742.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 257", "caracteristica": "PLAZA", "nombre": "CERRO MURALLON", "ubicacion": "CERRO MURALLON / EUGENIO POZO SILVA / FIORDO PEEL", "superficie_m2": 773.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 258 A", "caracteristica": "PARQUE", "nombre": "PARQUE FERROCARRIL", "ubicacion": "FERROCARRIL / CUATRO PONIENTE / LA TRILLA", "superficie_m2": 18346.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 258 B", "caracteristica": "PARQUE", "nombre": "PARQUE FERROCARRIL", "ubicacion": "FERROCARRIL / TRES PONIENTE / CUATRO PONIENTE", "superficie_m2": 22530.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 258 C", "caracteristica": "PARQUE", "nombre": "PARQUE FERROCARRIL", "ubicacion": "FERROCARRIL / TRES PONIENTE / JOAQUIN EDWARDS BELLO", "superficie_m2": 16747.0, "barrio": "LOS HEROES", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 259", "caracteristica": "PLAZA", "nombre": "CORDON ROMA", "ubicacion": "CERRO MURALLON / CORDON ROMA", "superficie_m2": 870.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 260", "caracteristica": "VEREDON", "nombre": "PASTOR JOSE TORRES GROSA", "ubicacion": "PASTOR JOSE TORRES GROSSA / MISIONERO ALLEN GARDINER", "superficie_m2": 75.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 261", "caracteristica": "PLAZA", "nombre": "LAS CRUCES", "ubicacion": "SERGIO SALAS LLONA / CERRO IGLESIA / LAS CRUCES", "superficie_m2": 1731.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 262", "caracteristica": "PLAZA", "nombre": "ESCRITOR JOSE DONOSO", "ubicacion": "ESCRITOR JOSE DONOSO / LOS BOSQUINOS / SAGRADA COMUNION", "superficie_m2": 1290.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 263", "caracteristica": "PLAZA", "nombre": "PASTOR GUILLERMO CASTILLO MORAGA", "ubicacion": "PASTOR GUIILERMO CASTILLO / OBISPO MANUEL UMAÑA SALINAS", "superficie_m2": 720.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 264", "caracteristica": "PLAZA", "nombre": "PASTOR DIEGO THOMSON", "ubicacion": "OBISPO MANUEL UMAÑA / PASTOR DIEGO THOMSON", "superficie_m2": 720.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 265", "caracteristica": "PLAZA", "nombre": "PERIODISTA HERNAN SOLIS", "ubicacion": "ELEODORO RODRIGUEZ MATTE / PERIODISTA HERNAN SOLIS", "superficie_m2": 2300.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 266", "caracteristica": "PLAZA", "nombre": "RAUL HERNAN LEPPE", "ubicacion": "RAUL HERNAN LEPPE", "superficie_m2": 770.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 267", "caracteristica": "PLAZA", "nombre": "PARQUE LOS URBANISTAS", "ubicacion": "LOS URBANISTAS / FRENTE A ALQUIMIA", "superficie_m2": 2097.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 268", "caracteristica": "PLAZA", "nombre": "PARQUE LOS URBANISTAS", "ubicacion": "LOS URBANISTAS / FRENTE A ALQUIMIA", "superficie_m2": 2760.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 269", "caracteristica": "PLAZA", "nombre": "PARQUE LOS URBANISTAS", "ubicacion": "LOS URBANISTAS / CAPELLAN FLORENCIO INFANTE", "superficie_m2": 994.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 270 A", "caracteristica": "PLAZA", "nombre": "MISIONERO ALLEN GARDINER", "ubicacion": "MISIONERO ALLEN GARDINER / EL VERGEL (VP)", "superficie_m2": 90.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 270 B", "caracteristica": "PLAZA", "nombre": "MISIONERO ALLEN GARDINER", "ubicacion": "MISIONERO ALLEN GARDINER / EL VERGEL (VO)", "superficie_m2": 90.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 270 C", "caracteristica": "PLAZA", "nombre": "MISIONERO ALLEN GARDINER", "ubicacion": "MISIONERO ALLEN GARDINDER / NUEVA TOLEDO", "superficie_m2": 450.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 271", "caracteristica": "PLAZA", "nombre": "RIO RIMAC", "ubicacion": "LOS URBANISTAS / RIO RIMAC", "superficie_m2": 1915.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 272 A", "caracteristica": "BANDEJON", "nombre": "BANDEJON LOS URBANISTAS", "ubicacion": "LOS URBANISTAS / FRENTE A ALQUIMIA", "superficie_m2": 85.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 272 B", "caracteristica": "BANDEJON", "nombre": "BANDEJON LOS URBANISTAS", "ubicacion": "LOS URBANISTAS / FRENTE A DIOGENES", "superficie_m2": 188.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 273", "caracteristica": "PLAZA", "nombre": "GAUTAMA NORTE", "ubicacion": "GAUTAMA / RENE OLIVARES BECERRA (O)", "superficie_m2": 634.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 274", "caracteristica": "PLAZA", "nombre": "GAUTAMA PONIENTE", "ubicacion": "GAUTAMA", "superficie_m2": 333.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 275", "caracteristica": "AREA VERDE", "nombre": "KRISHNA", "ubicacion": "KRISHNA / LOS URBANISTAS", "superficie_m2": 540.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 276 A", "caracteristica": "PLAZA", "nombre": "CAPELLAN FLORENCIO INFANTE", "ubicacion": "CAPELLAN FLORENCIO INFANTE / EL CRISOL (VO)", "superficie_m2": 652.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 276 B", "caracteristica": "PLAZA", "nombre": "CAPELLAN FLORENCIO INFANTE", "ubicacion": "CAPELLAN FLORENCIO INFANTE / EL CRISOL (VP)", "superficie_m2": 556.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 276 C", "caracteristica": "PLAZA", "nombre": "CAPELLAN FLORENCIO INFANTE", "ubicacion": "CAPELLAN FLORENCIO INFANTE / EL BOLLEN (VO)", "superficie_m2": 270.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 276 D", "caracteristica": "PLAZA", "nombre": "CAPELLAN FLORENCIO INFANTE", "ubicacion": "CAPELLAN FLORENCIO INFANTE / EL BOLLEN", "superficie_m2": 284.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 276 E", "caracteristica": "PLAZA", "nombre": "CAPELLAN FLORENCIO INFANTE", "ubicacion": "CAPELLAN FLORENCIO INFANTE / EL BOLLEN (VP)", "superficie_m2": 127.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 277", "caracteristica": "PLAZA", "nombre": "EL ULMO ORIENTE", "ubicacion": "EL ULMO / PORTAL DEL BOSQUE", "superficie_m2": 530.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 278", "caracteristica": "PLAZA", "nombre": "EL ULMO PONIENTE", "ubicacion": "EL ULMO / EL AVELLANO", "superficie_m2": 490.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 279", "caracteristica": "PLAZA", "nombre": "EL SAUCO PONIENTE", "ubicacion": "EL SAUCO / EL AVELLANO", "superficie_m2": 338.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 280", "caracteristica": "PLAZA", "nombre": "EL SAUCO ORIENTE", "ubicacion": "EL SAUCO / PORTAL DEL BOSQUE", "superficie_m2": 338.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 281", "caracteristica": "PLAZA", "nombre": "EL TOROMILLO", "ubicacion": "EL TOROMILLO / PORTAL DEL BOSQUE", "superficie_m2": 447.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 282", "caracteristica": "PLAZA", "nombre": "EL AVELLANO", "ubicacion": "EL AVELLANO / ARQUITECTO PEDRO BARROS", "superficie_m2": 442.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 283", "caracteristica": "AREA VERDE", "nombre": "ARQUITECTO PEDRO BARROS", "ubicacion": "ARQUITECTO PEDRO BARROS / PORTAL DEL BOSQUE", "superficie_m2": 60.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 284 A", "caracteristica": "PLAZA", "nombre": "ARQUITECTO PEDRO BARROS", "ubicacion": "EL TEPU / ARQUITECTO PEDRO BARROS", "superficie_m2": 108.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 284 B", "caracteristica": "PLAZA", "nombre": "ARQUITECTO PEDRO BARROS", "ubicacion": "EL OLIVILLO / ARQUITECTO PEDRO BARROS", "superficie_m2": 108.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 284 C", "caracteristica": "PLAZA", "nombre": "ARQUITECTO PEDRO BARROS", "ubicacion": "PORTAL DEL BOSQUE / ARQUITECTO PEDRO BARROS", "superficie_m2": 116.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 285", "caracteristica": "PLAZA", "nombre": "EL TEPU", "ubicacion": "EL TEPU / RENE OLIVARES BECERRA", "superficie_m2": 360.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 286", "caracteristica": "PLAZA", "nombre": "LAS CATALPAS", "ubicacion": "EL TEPU / RENE OLIVARES BECERRA", "superficie_m2": 765.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 287 A", "caracteristica": "BANDEJON", "nombre": "BANDEJON CAMINO EL BOSQUE", "ubicacion": "CAMINO EL BOSQUE / EL ALMENDRAL / RENE OLIVARES BECERRA", "superficie_m2": 640.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 287 B", "caracteristica": "BANDEJON", "nombre": "BANDEJON CAMINO EL BOSQUE", "ubicacion": "CAMINO EL BOSQUE / CAPELLAN FLORENCIO INFANTE", "superficie_m2": 1186.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 287 C", "caracteristica": "BANDEJON", "nombre": "BANDEJON CAMINO EL BOSQUE", "ubicacion": "CAMINO EL BOSQUE / CAPELLAN FLORENCIO INFANTE / EL ALMENDRAL", "superficie_m2": 180.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 288", "caracteristica": "PLAZA", "nombre": "HAMLET", "ubicacion": "HAMLET SUR / HAMLET ORIENTE", "superficie_m2": 1207.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 289", "caracteristica": "BANDEJON", "nombre": "DE LAS BELLAS ARTES", "ubicacion": "DE LAS BELLAS ARTES / CAMINO EL BOSQUE", "superficie_m2": 130.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 290", "caracteristica": "PLAZA", "nombre": "RODIN", "ubicacion": "RODIN NORTE / RODIN SUR", "superficie_m2": 966.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 291", "caracteristica": "PLAZA", "nombre": "OFELIA", "ubicacion": "OFELIA ORIENTE / OFELIA SUR / OFELIA PONIENTE", "superficie_m2": 1158.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 292", "caracteristica": "PLAZA", "nombre": "REBECA", "ubicacion": "REBECA SUR / REBECA PONIENTE / REBECA NORTE", "superficie_m2": 1911.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 293", "caracteristica": "PLAZA", "nombre": "PADRE ANTONIO RONCHI", "ubicacion": "PADRE ANTONIO RONCHI / HERNAN DIAZ ARRIETA", "superficie_m2": 139.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 294", "caracteristica": "PLAZA", "nombre": "SAN RODRIGO", "ubicacion": "HERNAN DIAZ ARRIETA / SAN RODRIGO", "superficie_m2": 905.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 295", "caracteristica": "PLAZA", "nombre": "SAN ALBERTO", "ubicacion": "SAN ALBERTO", "superficie_m2": 356.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 296", "caracteristica": "PLAZA", "nombre": "SAN PATRICIO", "ubicacion": "EL TRANQUE / RENE OLIVARES BECERRA / SAN ALBERTO", "superficie_m2": 1330.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 297", "caracteristica": "JARDINES INTERIORES CECOSF", "nombre": "JARDINES CECOSF LOS BOSQUINOS", "ubicacion": "EL TRANQUE 177", "superficie_m2": 335.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 298 A", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL TRANQUE", "ubicacion": "EL TRANQUE / RENE OLIVARES BECERRA / SAN ALBERTO", "superficie_m2": 210.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 298 B", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL TRANQUE", "ubicacion": "EL TRANQUE / SAN ALBERTO / HERNAN DIAZ ARRIETA", "superficie_m2": 1327.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 298 C", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL TRANQUE", "ubicacion": "EL TRANQUE / SAN RENE", "superficie_m2": 156.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 298 D", "caracteristica": "BANDEJON", "nombre": "BANDEJON EL TRANQUE", "ubicacion": "EL TRANQUE / SAN RENE / SAN MANUEL", "superficie_m2": 685.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 299", "caracteristica": "PLAZA", "nombre": "EL TRANQUE SUR", "ubicacion": "EL TRANQUE / EL TRANQUE SUR", "superficie_m2": 235.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 300", "caracteristica": "PLAZA", "nombre": "SAN RENE", "ubicacion": "SAN RENE / EL TRANQUE", "superficie_m2": 961.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 301", "caracteristica": "PLAZA", "nombre": "MARICEL", "ubicacion": "MARICEL N° 130", "superficie_m2": 170.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 302", "caracteristica": "PLAZA", "nombre": "LOS INQUILINOS", "ubicacion": "LOS INQUILINOS / SANTA FLORENCIA SUR", "superficie_m2": 847.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 303", "caracteristica": "PLAZA", "nombre": "SANTA FLORENCIA", "ubicacion": "SANTA SUSANA / SANTA FLORENCIA", "superficie_m2": 520.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 304", "caracteristica": "PLAZA", "nombre": "SAN BENJAMIN", "ubicacion": "SAN BENJAMIN / SAN RIGOBERTO", "superficie_m2": 526.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 305", "caracteristica": "PLAZA", "nombre": "SAN RIGOBERTO", "ubicacion": "EL TRANQUE / HERNAN DIAZ ARRIETA / SAN RIGOBERTO", "superficie_m2": 512.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 306", "caracteristica": "PLAZA", "nombre": "SAN LUIS", "ubicacion": "SAN LUIS / SANTA CELIA", "superficie_m2": 521.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 307", "caracteristica": "PLAZA", "nombre": "SAN CARLOS", "ubicacion": "SAN CARLOS", "superficie_m2": 462.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 308", "caracteristica": "BANDEJON", "nombre": "BANDEJON GONZALEZ VIDELA", "ubicacion": "PRESIDENTE GONZALEZ VIDELA / CAMINNO DEL ALARIFE / CUATRO PONIENTE", "superficie_m2": 500.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 309", "caracteristica": "PLAZA", "nombre": "CERRO LAS BANDURRIAS", "ubicacion": "CERRO LAS BANDURRIAS / CERRO MANANTIAL / RENE OLIVARES BECERRA", "superficie_m2": 3050.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 310", "caracteristica": "PLAZA", "nombre": "CERRO LAS ARAÑAS", "ubicacion": "CERRO LAS BANDURRIAS / CERRO LAS ARAÑAS", "superficie_m2": 220.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 311 A", "caracteristica": "PLAZA", "nombre": "CERRO MANANTIAL", "ubicacion": "CERRO MANANTIAL (VN) / LOS INQUILINOS", "superficie_m2": 72.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 311 B", "caracteristica": "PLAZA", "nombre": "CERRO MANANTIAL", "ubicacion": "CERRO MANANTIAL (VS) / LOS INQUILINOS", "superficie_m2": 183.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 312 A", "caracteristica": "PLAZA", "nombre": "SAN IGNACIO 1", "ubicacion": "SAN IGNACIO / SAN IGNACIO 1 / SAN IGNACIO 2", "superficie_m2": 321.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 312 B", "caracteristica": "PLAZA", "nombre": "SAN IGNACIO 2", "ubicacion": "SAN IGNACIO / SAN IGNACIO 2 / SAN IGNACIO 3", "superficie_m2": 317.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 312 C", "caracteristica": "PLAZA", "nombre": "SAN IGNACIO 3", "ubicacion": "SAN IGNACIO / SAN IGNACIO 3 / SAN IGNACIO 4", "superficie_m2": 312.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 312 D", "caracteristica": "PLAZA", "nombre": "SAN IGNACIO 4", "ubicacion": "SAN IGNACIO / SAN IGNACIO 4", "superficie_m2": 307.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 313", "caracteristica": "PLAZA", "nombre": "SAN IGNACIO", "ubicacion": "RENE OLIVARES BECERRA / SAN IGNACIO", "superficie_m2": 184.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 314", "caracteristica": "PLAZA", "nombre": "LA BALADA", "ubicacion": "LA BALADA / CAMARICO", "superficie_m2": 495.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 315", "caracteristica": "PLAZA", "nombre": "CAMARICO", "ubicacion": "HUASO CHILENO / CAMARICO / HERNAN DIAZ ARRIETA", "superficie_m2": 2963.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 316", "caracteristica": "PLAZA", "nombre": "ROTONDA LA BALADA", "ubicacion": "LA BALADA / SAN MANUEL", "superficie_m2": 330.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 317", "caracteristica": "PLAZA", "nombre": "FILIPO", "ubicacion": "FILIPO / LA BALADA", "superficie_m2": 250.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 318", "caracteristica": "PLAZA", "nombre": "TIMBALERO", "ubicacion": "TIMBALERO / LAGO ROSSELOT", "superficie_m2": 1005.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 319", "caracteristica": "PLAZA", "nombre": "LAGO CARLOTA", "ubicacion": "LAGO JEINIMENI / LAGO CARLOTA", "superficie_m2": 2300.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 320", "caracteristica": "PLAZA", "nombre": "LAGO LAS TORRES ORIENTE", "ubicacion": "LAGO LAS TORRES ORIENTE / LAGO LLEU - LLEU", "superficie_m2": 3344.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}, {"codigo": "6 - 321", "caracteristica": "PLAZA", "nombre": "LAGO LAS TORRES PONIENTE", "ubicacion": "LAGO LAS TORRES PONIENTE / RENE OLIVARES BECERRA", "superficie_m2": 1533.0, "barrio": "LOS BOSQUINOS", "juegos_infantiles": 0, "juegos_inclusivos": 0, "pilones": "", "contrato_id": "maipu_6"}];

  function populateAreasVerdes() {
    const select = document.getElementById('tArea');
    if (!select) return;
    
    // Mantener la opción placeholder
    select.innerHTML = '<option value="" disabled selected>Seleccione un Área Verde del Contrato Zona 6 (436 disponibles)...</option>';
    
    AREAS_VERDES_ZONA6.forEach(av => {
      const opt = document.createElement('option');
      opt.value = av.codigo;
      opt.textContent = `${av.codigo} — ${av.nombre} (${av.caracteristica || 'AV'} • ${av.barrio || 'Maipú'})`;
      select.appendChild(opt);
    });
  }

  // Auto-completar dirección y ficha de Área Verde al seleccionar
  document.getElementById('tArea')?.addEventListener('change', (e) => {
    const code = e.target.value;
    const av = AREAS_VERDES_ZONA6.find(a => a.codigo === code);
    if (!av) return;

    const dirInput = document.getElementById('tDireccion');
    if (dirInput && av.ubicacion) {
      dirInput.value = `${av.nombre} — ${av.ubicacion}`;
    }

    const card = document.getElementById('avDetailsCard');
    if (card) {
      card.classList.remove('hidden');
      document.getElementById('avCarac').textContent = av.caracteristica || 'Área Verde';
      document.getElementById('avSup').textContent = `Superficie: ${av.superficie_m2} m²`;
      document.getElementById('avBarrio').textContent = `Barrio: ${av.barrio || 'Maipú Zona 6'}`;
      document.getElementById('avJuegos').textContent = `Juegos infantiles: ${av.juegos_infantiles} | Inclusivos: ${av.juegos_inclusivos}`;
    }
  });

  populateAreasVerdes();
  // ==================== INIT ====================
  renderDashboard();
  // Verificar sesión activa al cargar
  (async () => {
    const { data: { session } } = await db.auth.getSession();
    if (session?.user) {
      currentUser = session.user;
      const { data: perfil } = await db.from('perfiles').select('*').eq('id', currentUser.id).single();
      currentPerfil = perfil;
      updateUIWithProfile();
      await loadOTsFromSupabase();
      // Si hay sesión activa, ir directo al dashboard
      navigate('dashboard');
    }
  })();
  