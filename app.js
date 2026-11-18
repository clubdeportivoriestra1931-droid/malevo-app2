'use strict';

// La URL y la clave publicable son públicas por diseño: la seguridad la dan las reglas de la base de datos.
const SUPABASE_URL = 'https://tubhkovztslpyxhwegli.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5Gh3LxqkyXr4iXMAicOHNw_iTLXFyxz';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const ROL = { jugador: 'Jugador', dt: 'DT', superadmin: 'Administrador' };
const PIERNA = { derecha: 'Derecha', izquierda: 'Izquierda', ambas: 'Las dos' };
const PIERNAS = [
  { id: 'derecha', texto: 'Derecha' },
  { id: 'izquierda', texto: 'Izquierda' },
  { id: 'ambas', texto: 'Las dos' },
];
const PUNTOS = [
  { id: 'Arquero', x: 50, y: 88 },
  { id: 'Defensor', x: 50, y: 70 },
  { id: 'Lateral', x: 15, y: 62 },
  { id: 'Lateral', x: 85, y: 62 },
  { id: 'Volante', x: 50, y: 49 },
  { id: 'Enganche', x: 50, y: 32 },
  { id: 'Delantero', x: 50, y: 14 },
];

const S = {
  vista: 'cargando',
  sesion: null,
  perfil: null,
  modo: 'entrar',
  error: '',
  errorRol: '',
  aviso: '',
  enviando: false,
  guardando: false,
  paso: 1,
  usuarios: null,
  tab: 'inicio',
  mensajes: null,
  noLeidos: 0,
  borrador: '',
  canal: null,
  f: { email: '', clave: '', nombre: '', apodo: '', edad: '', eligiendo: 'principal', principal: '', secundaria: '', pierna: '' },
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function traducir(mensaje = '') {
  const m = mensaje.toLowerCase();
  if (m.includes('invalid login')) return 'El mail o la contraseña no coinciden.';
  if (m.includes('already registered')) return 'Ese mail ya tiene cuenta. Entrá con tu contraseña.';
  if (m.includes('at least 6')) return 'La contraseña tiene que tener al menos 6 caracteres.';
  if (m.includes('valid email') || m.includes('invalid email')) return 'Revisá el mail: no parece válido.';
  if (m.includes('rate limit')) return 'Hiciste muchos intentos seguidos. Esperá unos minutos.';
  return 'No se pudo completar la acción. Revisá los datos y probá de nuevo.';
}

/* ---------- Vistas ---------- */

function vistaCargando() {
  return '<main class="marco"><p role="status">Cargando…</p></main>';
}

function vistaLogin() {
  const reg = S.modo === 'registro';
  const f = S.f;
  return `
    <header class="portada">
      <div class="marco portada-int">
        <img class="escudo" src="escudo.png" alt="Escudo de Deportivo Riestra">
        <div>
          <h1 class="marca">MALEVO</h1>
          <p class="lema">Puntuá a tus compañeros y subí en el ranking del grupo.</p>
        </div>
      </div>
    </header>
    <main class="marco">
      <h2 class="titulo">${reg ? 'Creá tu cuenta' : 'Entrá a tu cuenta'}</h2>
      <form data-form="auth">
        ${reg ? `<label class="campo"><span>Nombre</span><input data-campo="nombre" value="${esc(f.nombre)}" autocomplete="name" required></label>` : ''}
        <label class="campo"><span>Mail</span><input type="email" data-campo="email" value="${esc(f.email)}" autocomplete="email" required></label>
        <label class="campo"><span>Contraseña</span><input type="password" data-campo="clave" value="${esc(f.clave)}" autocomplete="${reg ? 'new-password' : 'current-password'}" minlength="6" required></label>
        ${S.error ? `<p class="error" role="alert">${esc(S.error)}</p>` : ''}
        ${S.aviso ? `<p class="aviso" role="status">${esc(S.aviso)}</p>` : ''}
        <button class="boton" type="submit" ${S.enviando ? 'disabled' : ''}>${S.enviando ? 'Un segundo…' : reg ? 'Crear cuenta' : 'Entrar'}</button>
      </form>
      <p class="cambio">${reg ? '¿Ya tenés cuenta?' : '¿Todavía no jugás con nosotros?'}
        <button type="button" class="enlace" data-accion="cambiar-modo">${reg ? 'Entrá' : 'Anotate'}</button></p>
    </main>`;
}

function puedeSeguir() {
  const f = S.f;
  return (
    (S.paso === 1 && f.nombre.trim().length >= 2) ||
    (S.paso === 2 && !!f.principal) ||
    (S.paso === 3 && !!f.pierna) ||
    S.paso === 4
  );
}

function vistaCancha() {
  const f = S.f;
  const bandas = [0, 1, 2, 3, 4, 5, 6, 7]
    .map((i) => `<rect x="0" y="${i * 50}" width="300" height="50" fill="${i % 2 ? '#1E1E1E' : '#101010'}"/>`)
    .join('');
  const botones = PUNTOS.map(
    (p) => `<button type="button" class="punto ${p.id === f.principal ? 'principal' : ''} ${p.id === f.secundaria ? 'secundaria' : ''}"
      style="left:${p.x}%;top:${p.y}%" data-accion="puesto" data-id="${p.id}"
      aria-pressed="${p.id === f.principal || p.id === f.secundaria}">${p.id}</button>`
  ).join('');
  return `
    <div class="cancha">
      <svg viewBox="0 0 300 400" preserveAspectRatio="none" aria-hidden="true">
        ${bandas}
        <g fill="none" stroke="#FFFFFF" stroke-width="2.5" opacity="0.85">
          <rect x="10" y="10" width="280" height="380"/>
          <line x1="10" y1="200" x2="290" y2="200"/>
          <circle cx="150" cy="200" r="38"/>
          <rect x="80" y="10" width="140" height="80"/>
          <rect x="115" y="10" width="70" height="34"/>
          <rect x="80" y="310" width="140" height="80"/>
          <rect x="115" y="356" width="70" height="34"/>
        </g>
      </svg>
      ${botones}
    </div>`;
}

function vistaOnboarding() {
  const f = S.f;
  let cuerpo = '';

  if (S.paso === 1) {
    cuerpo = `
      <section>
        <h2 class="titulo">¿Cómo te llamamos?</h2>
        <label class="campo"><span>Nombre</span><input data-campo="nombre" value="${esc(f.nombre)}" autocomplete="name"></label>
        <label class="campo"><span>Apodo (opcional)</span><input data-campo="apodo" value="${esc(f.apodo)}"></label>
        <label class="campo"><span>Edad (opcional)</span><input type="number" inputmode="numeric" min="8" max="90" data-campo="edad" value="${esc(f.edad)}"></label>
      </section>`;
  } else if (S.paso === 2) {
    cuerpo = `
      <section>
        <h2 class="titulo">¿Dónde jugás?</h2>
        <p class="ayuda">Elegí qué puesto vas a marcar y tocalo en la cancha.</p>
        <div class="selector" role="group" aria-label="Tipo de puesto">
          <button type="button" class="${f.eligiendo === 'principal' ? 'activo' : ''}" data-accion="eligiendo" data-id="principal">Mi puesto${f.principal ? ': ' + esc(f.principal) : ''}</button>
          <button type="button" class="${f.eligiendo === 'secundaria' ? 'activo' : ''}" data-accion="eligiendo" data-id="secundaria">Segundo puesto${f.secundaria ? ': ' + esc(f.secundaria) : ' (opcional)'}</button>
        </div>
        ${vistaCancha()}
      </section>`;
  } else if (S.paso === 3) {
    cuerpo = `
      <section>
        <h2 class="titulo">¿Con qué pierna pegás?</h2>
        <div class="opciones">
          ${PIERNAS.map((p) => `<button type="button" class="opcion ${f.pierna === p.id ? 'activo' : ''}" data-accion="pierna" data-id="${p.id}" aria-pressed="${f.pierna === p.id}">${p.texto}</button>`).join('')}
        </div>
      </section>`;
  } else {
    cuerpo = `
      <section>
        <h2 class="titulo">Así funciona MALEVO</h2>
        <div class="explicacion">
          <p><strong>Después de cada partido</strong> ves a los compañeros con los que jugaste y les ponés una nota del 1 al 10.</p>
          <p><strong>Tus notas son anónimas.</strong> Solo el administrador puede ver quién votó qué.</p>
          <p><strong>El ranking se actualiza</strong> cuando se cierra la votación del partido.</p>
        </div>
      </section>`;
  }

  return `
    <main class="marco">
      <div class="progreso" aria-hidden="true">${[1, 2, 3, 4].map((n) => `<i class="${n <= S.paso ? 'on' : ''}"></i>`).join('')}</div>
      <p class="paso">Paso ${S.paso} de 4</p>
      ${cuerpo}
      ${S.error ? `<p class="error" role="alert">${esc(S.error)}</p>` : ''}
      <div class="acciones">
        ${S.paso < 4
          ? `<button class="boton" type="button" data-accion="seguir" ${puedeSeguir() ? '' : 'disabled'}>Seguir</button>`
          : `<button class="boton" type="button" data-accion="terminar" ${S.guardando ? 'disabled' : ''}>${S.guardando ? 'Guardando…' : 'Entrar a MALEVO'}</button>`}
        ${S.paso > 1 ? '<button class="boton sec" type="button" data-accion="volver">Volver</button>' : ''}
      </div>
    </main>`;
}

function vistaUsuarios() {
  if (S.usuarios === 'error') {
    return '<section class="bloque"><h3>Usuarios registrados</h3><p class="error" role="alert">No se pudo cargar la lista de usuarios.</p></section>';
  }
  if (!S.usuarios) {
    return '<section class="bloque"><h3>Usuarios registrados</h3><p class="ayuda">Cargando…</p></section>';
  }
  const filas = S.usuarios
    .map(
      (u) => `
      <li class="fila">
        <div>
          <strong>${esc(u.apodo || u.nombre || 'Sin nombre')}</strong>
          <div class="ayuda">${esc(u.posicion_principal || 'Sin puesto todavía')}</div>
        </div>
        <select aria-label="Rol de ${esc(u.nombre || 'usuario')}" data-rol-de="${u.id}" ${u.id === S.perfil.id ? 'disabled' : ''}>
          ${['jugador', 'dt', 'superadmin'].map((r) => `<option value="${r}" ${u.rol === r ? 'selected' : ''}>${ROL[r]}</option>`).join('')}
        </select>
      </li>`
    )
    .join('');
  return `
    <section class="bloque">
      <h3>Usuarios registrados (${S.usuarios.length})</h3>
      ${S.errorRol ? `<p class="error" role="alert">${esc(S.errorRol)}</p>` : ''}
      ${S.usuarios.length ? `<ul class="lista">${filas}</ul>` : '<p class="ayuda">Todavía no se registró nadie.</p>'}
    </section>`;
}

const ICO = {
  inicio: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
  chat: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z"/></svg>',
  perfil: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
};

const textoNoLeidos = () => (S.noLeidos > 9 ? '9+' : String(S.noLeidos));

function nav() {
  const item = (id, texto, extra = '') => `
    <button type="button" class="nav-b ${S.tab === id ? 'activo' : ''}" data-accion="tab" data-id="${id}" ${S.tab === id ? 'aria-current="page"' : ''}>
      <span aria-hidden="true">${ICO[id]}</span><span>${texto}</span>${extra}
    </button>`;
  const insignia = S.noLeidos ? `<b class="insignia" aria-label="${S.noLeidos} mensajes nuevos">${textoNoLeidos()}</b>` : '';
  return `<nav class="nav" aria-label="Secciones">${item('inicio', 'Inicio')}${item('chat', 'Chat', insignia)}${item('perfil', 'Perfil')}</nav>`;
}

function cabecera() {
  const p = S.perfil;
  const puestos = [p.posicion_principal, p.posicion_secundaria].filter(Boolean).map(esc).join(' y ');
  const pierna = p.pierna_habil ? `. Pierna ${PIERNA[p.pierna_habil].toLowerCase()}.` : '';
  return `
      <header class="cabecera">
        <div>
          <span class="rol">${ROL[p.rol]}</span>
          <h1>${esc(p.apodo || p.nombre)}</h1>
          <p>${puestos}${pierna}</p>
        </div>
        <img class="escudo-chico" src="escudo.png" alt="Escudo de Deportivo Riestra">
      </header>`;
}

function vistaHome() {
  const p = S.perfil;
  const esDT = p.rol === 'dt' || p.rol === 'superadmin';
  return `
    <main class="marco">
      ${cabecera()}

      <section class="bloque">
        <h3>Próximo partido</h3>
        <p class="ayuda">Todavía no hay partidos. Cuando se cree uno, lo vas a ver acá para confirmar si vas.</p>
      </section>

      <section class="bloque">
        <h3>Chat del club</h3>
        <p class="ayuda">Charlá con el grupo, coordiná los partidos y avisá si llegás tarde.</p>
        <button class="boton atajo" type="button" data-accion="tab" data-id="chat">Abrir el chat${S.noLeidos ? `<span class="insignia">${textoNoLeidos()}</span>` : ''}</button>
      </section>

      ${esDT ? `<section class="bloque"><h3>Gestión de partidos</h3><p class="ayuda">Crear partidos y abrir votaciones estará disponible en la próxima versión.</p></section>` : ''}
    </main>`;
}

function vistaPerfil() {
  const p = S.perfil;
  const fila = (nombre, valor) => (valor ? `<li><span>${nombre}</span><strong>${esc(valor)}</strong></li>` : '');
  return `
    <main class="marco">
      ${cabecera()}

      <section class="bloque">
        <h3>Mis datos</h3>
        <ul class="datos">
          ${fila('Nombre', p.nombre)}
          ${fila('Apodo', p.apodo)}
          ${fila('Edad', p.edad)}
          ${fila('Puesto', p.posicion_principal)}
          ${fila('Segundo puesto', p.posicion_secundaria)}
          ${fila('Pierna hábil', p.pierna_habil ? PIERNA[p.pierna_habil] : '')}
        </ul>
      </section>

      ${p.rol === 'superadmin' ? vistaUsuarios() : ''}

      <button class="boton sec" type="button" data-accion="salir">Cerrar sesión</button>
    </main>`;
}

/* ---------- Chat ---------- */

function htmlMensajes() {
  if (S.mensajes === null) return '<li class="vacio">Cargando mensajes…</li>';
  if (S.mensajes === 'error') return '<li class="vacio">No se pudo cargar el chat. Tocá otra pestaña y volvé a Chat para reintentar.</li>';
  if (!S.mensajes.length) return '<li class="vacio">Todavía no hay mensajes. ¡Escribí el primero y saludá al grupo!</li>';
  const yo = S.perfil.id;
  const moderador = S.perfil.rol === 'dt' || S.perfil.rol === 'superadmin';
  let dia = '';
  let html = '';
  for (const m of S.mensajes) {
    const fecha = new Date(m.creado_en);
    const d = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (d !== dia) {
      dia = d;
      html += `<li class="dia"><span>${esc(d)}</span></li>`;
    }
    const mio = m.usuario_id === yo;
    const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
    const borrar = mio || moderador ? ` <button type="button" class="borrar" data-accion="borrar-msg" data-id="${m.id}" aria-label="Borrar mensaje">Borrar</button>` : '';
    html += `
      <li class="msg ${mio ? 'mio' : ''}">
        <div class="burbuja">
          ${mio ? '' : `<strong class="autor">${esc(m.autor || 'Jugador')}</strong>`}
          <p>${esc(m.texto)}</p>
          <span class="hora">${hora}${borrar}</span>
        </div>
      </li>`;
  }
  return html;
}

function vistaChat() {
  return `
    <section class="chat" aria-label="Chat del club">
      <header class="chat-barra">
        <h1>Chat del club</h1>
        <p>Lo que escribas lo ve todo el grupo.</p>
      </header>
      <ul id="mensajes" class="mensajes" aria-live="polite">${htmlMensajes()}</ul>
      <div class="envio-caja">
        <p id="chat-error" class="error" role="alert" hidden></p>
        <form class="envio" data-form="chat">
          <input id="chat-texto" type="text" maxlength="500" placeholder="Escribí un mensaje…" aria-label="Mensaje" autocomplete="off" value="${esc(S.borrador)}">
          <button class="boton" type="submit">Enviar</button>
        </form>
      </div>
    </section>`;
}

function bajarChat() {
  const l = document.getElementById('mensajes');
  if (l) l.scrollTop = l.scrollHeight;
}

function pintarMensajes(forzar = false) {
  const l = document.getElementById('mensajes');
  if (!l) return;
  const cerca = l.scrollHeight - l.scrollTop - l.clientHeight < 140;
  l.innerHTML = htmlMensajes();
  if (cerca || forzar) l.scrollTop = l.scrollHeight;
}

function mostrarErrorChat(texto) {
  const e = document.getElementById('chat-error');
  if (!e) return;
  e.textContent = texto;
  e.hidden = !texto;
}

const enChat = () => S.vista === 'home' && S.tab === 'chat';

async function cargarMensajes() {
  const { data, error } = await db
    .from('mensajes')
    .select('id,usuario_id,autor,texto,creado_en')
    .eq('sala', 'general')
    .order('creado_en', { ascending: false })
    .limit(100);
  if (error) {
    if (!Array.isArray(S.mensajes)) S.mensajes = 'error';
  } else {
    S.mensajes = data.reverse();
  }
  if (enChat()) pintarMensajes(true);
}

function nuevoMensaje(m) {
  if (!m || !S.perfil) return;
  const propio = m.usuario_id === S.perfil.id;
  if (Array.isArray(S.mensajes) && !S.mensajes.some((x) => x.id === m.id)) S.mensajes.push(m);
  if (enChat()) return pintarMensajes(propio);
  if (!propio) {
    S.noLeidos += 1;
    if (S.vista === 'home') pintar();
  }
}

function suscribirChat() {
  if (S.canal) return;
  S.canal = db
    .channel('chat-club')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (p) => nuevoMensaje(p.new))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'mensajes' }, (p) => {
      if (!Array.isArray(S.mensajes)) return;
      S.mensajes = S.mensajes.filter((m) => m.id !== p.old.id);
      if (enChat()) pintarMensajes();
    })
    .subscribe();
}

function cerrarChat() {
  if (S.canal) db.removeChannel(S.canal);
  S.canal = null;
  S.mensajes = null;
  S.noLeidos = 0;
  S.borrador = '';
  S.tab = 'inicio';
}

async function enviarMensaje() {
  const campo = document.getElementById('chat-texto');
  const texto = campo.value.trim();
  if (!texto) return;
  campo.value = '';
  S.borrador = '';
  mostrarErrorChat('');
  const { data, error } = await db
    .from('mensajes')
    .insert({ texto, sala: 'general' })
    .select('id,usuario_id,autor,texto,creado_en')
    .single();
  if (error) {
    campo.value = texto;
    S.borrador = texto;
    return mostrarErrorChat('No se pudo enviar el mensaje. Probá de nuevo.');
  }
  nuevoMensaje(data);
  campo.focus();
}

function pintar() {
  const app = document.getElementById('app');
  if (S.vista === 'home') {
    const cuerpo = S.tab === 'chat' ? vistaChat() : S.tab === 'perfil' ? vistaPerfil() : vistaHome();
    app.innerHTML = cuerpo + nav();
    if (S.tab === 'chat') bajarChat();
    return;
  }
  const vistas = { cargando: vistaCargando, login: vistaLogin, onboarding: vistaOnboarding };
  app.innerHTML = vistas[S.vista]();
}

/* ---------- Lógica ---------- */

async function iniciar() {
  const { data } = await db.auth.getSession();
  S.sesion = data.session;
  if (!S.sesion) {
    cerrarChat();
    S.perfil = null;
    S.vista = 'login';
    return pintar();
  }
  const { data: p, error } = await db.from('profiles').select('*').eq('id', S.sesion.user.id).single();
  if (error || !p) {
    await db.auth.signOut();
    S.sesion = null;
    S.vista = 'login';
    S.error = 'No se pudo cargar tu perfil. Probá entrar de nuevo.';
    return pintar();
  }
  S.perfil = p;
  if (!p.onboarding_completo) {
    if (S.vista !== 'onboarding') {
      S.f.nombre = p.nombre || '';
      S.paso = 1;
    }
    S.vista = 'onboarding';
  } else {
    S.vista = 'home';
    if (p.rol === 'superadmin') cargarUsuarios();
    suscribirChat();
  }
  pintar();
}

async function cargarUsuarios() {
  const { data, error } = await db
    .from('profiles')
    .select('id,nombre,apodo,posicion_principal,rol,creado_en')
    .order('creado_en', { ascending: false });
  S.usuarios = error ? 'error' : data;
  if (S.vista === 'home' && S.tab === 'perfil') pintar();
}

async function enviarAuth() {
  const f = S.f;
  S.error = '';
  S.aviso = '';
  S.enviando = true;
  pintar();

  if (S.modo === 'entrar') {
    const { error } = await db.auth.signInWithPassword({ email: f.email.trim(), password: f.clave });
    S.enviando = false;
    if (error) {
      S.error = traducir(error.message);
      return pintar();
    }
    f.clave = '';
    return iniciar();
  }

  const { data, error } = await db.auth.signUp({
    email: f.email.trim(),
    password: f.clave,
    options: { data: { nombre: f.nombre.trim() } },
  });
  S.enviando = false;
  if (error) {
    S.error = traducir(error.message);
    return pintar();
  }
  if (data.session) {
    f.clave = '';
    return iniciar();
  }
  S.aviso = 'Te mandamos un mail para confirmar la cuenta. Abrilo y después entrá.';
  pintar();
}

async function terminar() {
  const f = S.f;
  S.guardando = true;
  S.error = '';
  pintar();
  const edadNum = f.edad ? Number(f.edad) : null;
  const { error } = await db
    .from('profiles')
    .update({
      nombre: f.nombre.trim(),
      apodo: f.apodo.trim() || null,
      edad: edadNum && edadNum >= 8 && edadNum <= 90 ? edadNum : null,
      posicion_principal: f.principal,
      posicion_secundaria: f.secundaria || null,
      pierna_habil: f.pierna,
      onboarding_completo: true,
    })
    .eq('id', S.sesion.user.id);
  S.guardando = false;
  if (error) {
    S.error = 'No se pudo guardar tu perfil. Probá de nuevo.';
    return pintar();
  }
  await iniciar();
}

/* ---------- Eventos ---------- */

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-accion]');
  if (!el) return;
  const f = S.f;
  switch (el.dataset.accion) {
    case 'cambiar-modo':
      S.modo = S.modo === 'entrar' ? 'registro' : 'entrar';
      S.error = '';
      S.aviso = '';
      return pintar();
    case 'eligiendo':
      f.eligiendo = el.dataset.id;
      return pintar();
    case 'puesto': {
      const id = el.dataset.id;
      if (f.eligiendo === 'principal') {
        f.principal = id;
        if (f.secundaria === id) f.secundaria = '';
      } else if (id !== f.principal) {
        f.secundaria = id === f.secundaria ? '' : id;
      }
      return pintar();
    }
    case 'pierna':
      f.pierna = el.dataset.id;
      return pintar();
    case 'seguir':
      S.paso += 1;
      pintar();
      return window.scrollTo(0, 0);
    case 'volver':
      S.paso -= 1;
      S.error = '';
      pintar();
      return window.scrollTo(0, 0);
    case 'terminar':
      return terminar();
    case 'tab':
      S.tab = el.dataset.id;
      if (S.tab === 'chat') {
        S.noLeidos = 0;
        pintar();
        cargarMensajes();
      } else {
        pintar();
        window.scrollTo(0, 0);
      }
      return;
    case 'borrar-msg': {
      if (!confirm('¿Borrar este mensaje?')) return;
      const id = Number(el.dataset.id);
      const { error } = await db.from('mensajes').delete().eq('id', id);
      if (error) return mostrarErrorChat('No se pudo borrar el mensaje.');
      S.mensajes = S.mensajes.filter((m) => m.id !== id);
      return pintarMensajes();
    }
    case 'salir':
      await db.auth.signOut();
      cerrarChat();
      S.usuarios = null;
      S.vista = 'login';
      return pintar();
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'chat-texto') {
    S.borrador = e.target.value;
    return;
  }
  const campo = e.target.dataset.campo;
  if (!campo) return;
  S.f[campo] = e.target.value;
  const seguir = document.querySelector('[data-accion="seguir"]');
  if (seguir) seguir.disabled = !puedeSeguir();
});

document.addEventListener('submit', (e) => {
  const form = e.target.dataset.form;
  if (form === 'chat') {
    e.preventDefault();
    return enviarMensaje();
  }
  if (form !== 'auth') return;
  e.preventDefault();
  enviarAuth();
});

document.addEventListener('change', async (e) => {
  const id = e.target.dataset.rolDe;
  if (!id) return;
  const rol = e.target.value;
  S.errorRol = '';
  const { error } = await db.from('profiles').update({ rol }).eq('id', id);
  if (error) S.errorRol = 'No se pudo cambiar el rol. Probá de nuevo.';
  else S.usuarios = S.usuarios.map((u) => (u.id === id ? { ...u, rol } : u));
  pintar();
});

pintar();
iniciar();
