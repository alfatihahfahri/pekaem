import { SISWA } from '../konstanta.js';
import { kelasMapel, materiSiswa, singkatanMapel, soalSiswa } from '../seleksi.js';
import { catat, simpan } from '../status.js';
import { jalankanEfek } from '../efek/halaman.js';
import { toast } from '../ui.js';
import { $, $$, esc } from '../util.js';
import { status } from '../status.js';

const IKON_KOSONG = '<svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h11l3 3v13H5z"/><path d="M15 8h4M15 4v4"/><path d="M8.5 13.5l1.8 1.8 3.4-3.6"/></svg>';
const PANAH = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M13 7l5 5-5 5"/></svg>';

export function renderPilihLatihan() {
  const sel = $('#pilihMateriLatihan');
  const daftarSoal = soalSiswa();
  const pakai = materiSiswa().filter((m) => daftarSoal.some((s) => s.materiId === m.id));
  sel.innerHTML = pakai.length
    ? pakai.map((m) => `<option value="${m.id}">${esc(m.mapel)} — ${esc(m.judul)} (${daftarSoal.filter((s) => s.materiId === m.id).length} soal)</option>`).join('')
    : '<option value="">Belum ada soal untuk kelas ini</option>';

  const cepat = $('#pilihLatihanCepat');
  if (!cepat) return;
  cepat.innerHTML = pakai.length
    ? pakai.map((m) => {
        const n = daftarSoal.filter((s) => s.materiId === m.id).length;
        return `
          <button class="mapel-${kelasMapel(m.mapel)}" data-act="keLatihan" data-id="${m.id}">
            <span class="pk-atas">
              <span class="mapel-ikon">${esc(singkatanMapel(m.mapel))}</span>
              <span class="tag mapel">${n} soal</span>
            </span>
            <b>${esc(m.judul)}</b>
            <span class="pk-bawah">
              <span class="small muted">${esc(m.mapel)}</span>
              <span class="pk-aksi">Mulai latihan ${PANAH}</span>
            </span>
          </button>`;
      }).join('')
    : `
      <div class="kosong">
        <span class="kosong-ikon">${IKON_KOSONG}</span>
        <b>Belum ada soal untuk kelas ini</b>
        <p class="muted small">Guru belum menerbitkan soal untuk <b>kelas ${esc(status.kelasSiswa)}</b>. Coba cek lagi nanti, atau tanya Bemai dulu di halaman Chat AI.</p>
      </div>`;
}

export function mulaiLatihan(paksaId) {
  const id = paksaId || $('#pilihMateriLatihan').value;
  const m = status.db.materi.find((x) => x.id === id);
  const daftar = soalSiswa().filter((s) => s.materiId === id);
  if (!m || !daftar.length) { toast('Belum ada soal untuk materi ini'); return; }

  $('#areaLatihan').innerHTML = `
    <div class="spacer"></div>
    <div class="card">
      <span class="tag">${esc(m.mapel)} · ${esc(status.kelasSiswa)}</span>
      <h2 style="margin-top:12px">${esc(m.judul)}</h2>
      <p class="muted small">${daftar.length} soal · pilih satu jawaban per soal</p>
      <div class="bilah-jawab"><span id="bilahJawab"></span></div>
      <form id="formLatihan">
        ${daftar.map((s, i) => `
          <div style="margin-bottom:20px" data-soal="${s.id}">
            <p style="font-weight:700;margin:0 0 10px">${i + 1}. ${esc(s.tanya)}</p>
            ${s.opsi.map((o, j) => `
              <label class="opsi"><input type="radio" name="s_${s.id}" value="${j}" style="width:auto;margin-right:9px"/>${esc(o)}</label>`).join('')}
          </div>`).join('')}
        <div class="btnrow">
          <button class="btn primary" type="submit">Kumpulkan jawaban</button>
          <button class="btn ghost" type="button" data-act="batalLatihan">Batal</button>
        </div>
      </form>
    </div>`;

  $('#formLatihan').addEventListener('submit', (e) => {
    e.preventDefault();
    kumpulkanLatihan(m, daftar);
  });
  $$('#areaLatihan input[type="radio"]').forEach((r) => r.addEventListener('change', () => {
    const dijawab = new Set($$('#areaLatihan input[type="radio"]:checked').map((i) => i.name)).size;
    $('#bilahJawab').style.width = Math.round((dijawab / daftar.length) * 100) + '%';
  }));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function kumpulkanLatihan(m, daftar) {
  const detail = [];
  let benar = 0;
  let adaKosong = false;

  daftar.forEach((s) => {
    const pilih = $(`input[name="s_${s.id}"]:checked`);
    if (!pilih) adaKosong = true;
    const jawab = pilih ? Number(pilih.value) : -1;
    const tepat = jawab === s.jawaban;
    if (tepat) benar++;
    detail.push({ soalId: s.id, benar: tepat, jawab });
  });

  if (adaKosong && !confirm('Masih ada soal yang belum dijawab. Tetap kumpulkan?')) return;

  const nilai = Math.round((benar / daftar.length) * 100);
  const hasil = { id: 'h' + Date.now(), waktu: Date.now(), siswa: SISWA, kelas: status.kelasSiswa, materiId: m.id, benar, total: daftar.length, nilai, detail };
  status.db.hasil.unshift(hasil);
  catat('Latihan Soal', m.judul, nilai + '/100', status.kelasSiswa);
  simpan();

  daftar.forEach((s) => {
    const kotak = $(`[data-soal="${s.id}"]`);
    $$('input', kotak).forEach((inp) => {
      const label = inp.closest('.opsi');
      const j = Number(inp.value);
      if (j === s.jawaban) label.classList.add('benar');
      else if (inp.checked) label.classList.add('salah');
      inp.disabled = true;
    });
  });

  const pembahasan = daftar.map((s, i) => {
    const d = detail[i];
    const kunci = s.opsi[s.jawaban];
    return `<div class="list-item"><span>${i + 1}. ${esc(s.tanya)}</span>
      <span class="tag ${d.benar ? 'green' : 'amber'}">${d.benar ? 'Benar' : 'Salah'} — kunci: ${esc(kunci)}</span></div>`;
  }).join('');

  $('#areaLatihan').insertAdjacentHTML('afterbegin', `
    <div class="spacer"></div>
    <div class="card" data-tilt="1" data-tilt-kuat="5" style="border-color:#bfe6cf;background:linear-gradient(135deg,#eaf9f1,#fff)">
      <div class="stat"><div><h2 style="margin:0">Nilai kamu: ${nilai}/100</h2>
        <p class="muted small" style="margin:6px 0 0">${benar} benar dari ${daftar.length} soal · hasil ini juga muncul di dashboard guru</p></div>
        <div class="skor-ring" data-p="${nilai}"><b data-angka="${nilai}">0</b><span>nilai</span></div></div>
    </div>`);
  $('#areaLatihan').insertAdjacentHTML('beforeend',
    '<div class="spacer"></div><div class="card"><h2>Pembahasan</h2><div class="list">' + pembahasan + '</div></div>');

  jalankanEfek('s-latihan');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  toast('Jawaban terkirim — nilai ' + nilai);
}

export function batalLatihan() { $('#areaLatihan').innerHTML = ''; }
