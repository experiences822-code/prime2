/* ECO.EXPERIENCES — V1 funcional
   Auth + ECO.TRONIC guiado + ECO.LAB + comanda + estilos desde Supabase.
   No es todavía una IA generativa: es el flujo estructurado que prepara la base.
*/
(() => {
  const cfg = window.ECO_CONFIG || {};
  const configured = cfg.supabaseUrl && cfg.supabasePublishableKey && !cfg.supabaseUrl.includes('TU-PROYECTO') && !cfg.supabasePublishableKey.includes('TU_CLAVE');
  const supabase = configured && window.supabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabasePublishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null;

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const authModal = $('#auth-modal');
  const labModal = $('#lab-modal');
  const authStatus = $('#auth-status');
  const labStatus = $('#lab-status');
  let currentSession = null;
  let styles = [];
  let selectedStyles = [];
  let selectedType = '';

  function setStatus(el, message='', type='') {
    el.textContent = message;
    el.className = `status ${type}`;
  }

  function openModal(el) {
    el.classList.add('open'); el.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
  }
  function closeModal(el) {
    el.classList.remove('open'); el.setAttribute('aria-hidden','true');
    if (!authModal.classList.contains('open') && !labModal.classList.contains('open')) document.body.classList.remove('modal-open');
  }

  function openAuth() {
    if (currentSession) return openLab();
    setStatus(authStatus, configured ? '' : 'Configura config.js con tu Project URL y Publishable Key antes de probar la conexión.', configured ? '' : 'error');
    openModal(authModal);
  }
  function openLab() {
    if (!currentSession) return openAuth();
    resetLab(); openModal(labModal); loadStyles(); updateSessionBar();
  }

  $$('[data-open-auth]').forEach(b => b.addEventListener('click', openAuth));
  $$('[data-close-auth]').forEach(b => b.addEventListener('click', () => closeModal(authModal)));
  $$('[data-close-lab]').forEach(b => b.addEventListener('click', () => closeModal(labModal)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(authModal); closeModal(labModal); } });

  $$('[data-auth-tab]').forEach(tab => tab.addEventListener('click', () => {
    $$('[data-auth-tab]').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const register = tab.dataset.authTab === 'register';
    $('#login-form').classList.toggle('hidden', register);
    $('#register-form').classList.toggle('hidden', !register);
    $('#auth-title').innerHTML = register ? 'Crea tu entrada<br><em>al laboratorio.</em>' : 'Antes de crear,<br><em>conectemos.</em>';
    setStatus(authStatus, '');
  }));

  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (!supabase) return setStatus(authStatus, 'Falta configurar la conexión con Supabase.', 'error');
    const fd = new FormData(e.currentTarget);
    setStatus(authStatus, 'Entrando al laboratorio…');
    const { data, error } = await supabase.auth.signInWithPassword({ email: fd.get('email'), password: fd.get('password') });
    if (error) return setStatus(authStatus, error.message, 'error');
    currentSession = data.session;
    setStatus(authStatus, 'Entrada confirmada.', 'success');
    setTimeout(() => { closeModal(authModal); openLab(); }, 350);
  });

  $('#register-form').addEventListener('submit', async e => {
    e.preventDefault();
    if (!supabase) return setStatus(authStatus, 'Falta configurar la conexión con Supabase.', 'error');
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email')).trim();
    const password = String(fd.get('password'));
    setStatus(authStatus, 'Creando tu entrada…');
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: {
        nombre: String(fd.get('nombre')).trim(),
        telefono: String(fd.get('telefono')).trim(),
        ciudad: String(fd.get('ciudad')).trim(),
        empresa: String(fd.get('empresa')).trim()
      }}
    });
    if (error) return setStatus(authStatus, error.message, 'error');
    if (data.session) {
      currentSession = data.session;
      setStatus(authStatus, 'Cuenta creada. Bienvenido al laboratorio.', 'success');
      setTimeout(() => { closeModal(authModal); openLab(); }, 400);
    } else {
      setStatus(authStatus, 'Cuenta creada. Revisa tu correo para confirmar el acceso y luego inicia sesión.', 'success');
      e.currentTarget.reset();
    }
  });

  async function loadStyles() {
    const box = $('#style-options');
    box.innerHTML = '<div class="loading">Consultando estilos del laboratorio…</div>';
    if (!supabase) return;
    const { data, error } = await supabase.from('estilos').select('id,nombre,descripcion').eq('activo', true).order('nombre');
    if (error) { box.innerHTML = '<div class="loading error">No pudimos cargar los estilos. Revisa las políticas de Supabase.</div>'; return; }
    styles = data || [];
    box.innerHTML = styles.map(s => `<button type="button" class="style-card" data-style-id="${s.id}"><strong>${escapeHtml(s.nombre)}</strong><small>${escapeHtml(s.descripcion || 'Dirección creativa')}</small></button>`).join('');
    $$('.style-card', box).forEach(card => card.addEventListener('click', () => {
      const id = card.dataset.styleId;
      if (card.classList.contains('selected')) { card.classList.remove('selected'); selectedStyles = selectedStyles.filter(x => x !== id); }
      else if (selectedStyles.length < 3) { card.classList.add('selected'); selectedStyles.push(id); }
      else setStatus(labStatus, 'ECO.TRONIC permite combinar hasta 3 estilos.', 'warning');
      updateStepState();
    }));
  }

  function resetLab() {
    selectedStyles = []; selectedType = '';
    ['idea','project-location','project-date','project-measures','project-budget','project-time','project-notes'].forEach(id => { const el = $('#'+id); if (el) el.value=''; });
    $('#project-complexity').value = 'Por definir'; $('#project-type').value='';
    $$('.quick-types button').forEach(b => b.classList.remove('selected'));
    $$('.style-card').forEach(b => b.classList.remove('selected'));
    $$('.lab-step').forEach(s => s.classList.remove('active-step'));
    $('#lab-step-1').classList.add('active-step');
    $$('.step-line span').forEach((s,i) => s.classList.toggle('active', i===0));
    setStatus(labStatus, '');
  }

  $$('.quick-types button').forEach(b => b.addEventListener('click', () => {
    $$('.quick-types button').forEach(x => x.classList.remove('selected')); b.classList.add('selected'); selectedType = b.dataset.type; $('#project-type').value = selectedType;
  }));

  $$('.next-step').forEach(btn => btn.addEventListener('click', async () => {
    const next = Number(btn.dataset.next);
    if (next === 2 && !$('#idea').value.trim()) return setStatus(labStatus, 'Cuéntame primero la idea del proyecto.', 'warning');
    if (next === 2) return showStep(2);
    if (next === 3) return showStep(3);
    if (next === 4) await createComanda();
  }));

  function showStep(n) {
    $$('.lab-step').forEach(s => s.classList.remove('active-step'));
    $(`#lab-step-${n}`).classList.add('active-step');
    $$('.step-line span').forEach((s,i) => s.classList.toggle('active', i < n));
    setStatus(labStatus, '');
  }

  async function createComanda() {
    if (!supabase || !currentSession?.user) return setStatus(labStatus, 'Tu sesión no está disponible. Vuelve a entrar.', 'error');
    setStatus(labStatus, 'ECO.TRONIC está construyendo tu comanda…');
    const user = currentSession.user;
    const { data: client, error: clientError } = await supabase.from('clientes').select('id').eq('auth_user_id', user.id).single();
    if (clientError || !client) return setStatus(labStatus, 'No encontramos tu perfil de cliente. Ejecuta la migración SQL y vuelve a registrarte.', 'error');

    const type = selectedType || inferType($('#idea').value);
    const { data: project, error: projectError } = await supabase.from('proyectos').insert({
      cliente_id: client.id,
      nombre: `${type || 'Proyecto'} — ${shortName($('#idea').value)}`,
      descripcion: $('#idea').value.trim(),
      categoria: type || null,
      ubicacion: $('#project-location').value.trim() || null,
      fecha_deseada: $('#project-date').value || null,
      presupuesto_estimado: $('#project-budget').value ? Number($('#project-budget').value) : null,
      estado: 'recibido'
    }).select('id').single();
    if (projectError) return setStatus(labStatus, projectError.message, 'error');

    const { data: comanda, error: comandaError } = await supabase.from('comandas').insert({
      proyecto_id: project.id,
      estado: 'recibida', porcentaje_completado: calculateProgress(),
      idea: $('#idea').value.trim(), medidas: $('#project-measures').value.trim() || null,
      complejidad: $('#project-complexity').value, tiempo_requerido: $('#project-time').value.trim() || 'Por definir',
      observaciones: $('#project-notes').value.trim() || null
    }).select('id,codigo,porcentaje_completado').single();
    if (comandaError) return setStatus(labStatus, comandaError.message, 'error');

    if (selectedStyles.length) {
      const rows = selectedStyles.map(estilo_id => ({ comanda_id: comanda.id, estilo_id }));
      const { error: styleError } = await supabase.from('comanda_estilos').insert(rows);
      if (styleError) return setStatus(labStatus, styleError.message, 'error');
    }

    $('#comanda-code').textContent = comanda.codigo;
    $('#comanda-progress').textContent = `${comanda.porcentaje_completado}% completado · En análisis`;
    $('#comanda-result').textContent = `Hemos recibido tu idea. ECO.TRONIC la organizó como ${comanda.codigo}. El siguiente paso es analizar características, materiales, alcance y camino de producción antes de construir una propuesta.`;
    showStep(4);
  }

  function calculateProgress() {
    let p = 30;
    if ($('#project-location').value.trim()) p += 10;
    if ($('#project-measures').value.trim()) p += 10;
    if ($('#project-budget').value) p += 10;
    if ($('#project-date').value) p += 10;
    if (selectedStyles.length) p += 10;
    return Math.min(p, 100);
  }

  function inferType(text) {
    const t=text.toLowerCase();
    if (t.includes('mural')) return 'Mural'; if (t.includes('letrero') || t.includes('señal')) return 'Letrero'; if (t.includes('mueble') || t.includes('mobiliario')) return 'Mobiliario'; if (t.includes('espacio') || t.includes('local')) return 'Espacio'; if (t.includes('objeto')) return 'Objeto'; return 'Proyecto creativo';
  }
  function shortName(text) { return text.trim().split(/\s+/).slice(0,5).join(' '); }
  function escapeHtml(v) { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }

  async function hydrateSession() {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    currentSession = data.session;
    updateSessionBar();
    supabase.auth.onAuthStateChange((_event, session) => { currentSession=session; updateSessionBar(); });
  }
  function updateSessionBar() {
    const el=$('#session-user'); if (!el) return;
    el.textContent = currentSession?.user?.email ? `Sesión: ${currentSession.user.email}` : '';
  }
  $('#logout-btn').addEventListener('click', async () => { if (supabase) await supabase.auth.signOut(); currentSession=null; closeModal(labModal); });

  function updateStepState() {
    const styleCount=selectedStyles.length;
    const btn=$('#lab-step-2 .next-step');
    if (btn) btn.textContent = styleCount ? `CONTINUAR CON ${styleCount} ESTILO${styleCount===1?'':'S'} →` : 'CONTINUAR SIN ESTILO →';
  }
  hydrateSession();
})();
