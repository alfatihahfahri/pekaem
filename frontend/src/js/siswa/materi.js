import { definisiDariMateri, kelasMapel, materiSiswa, singkatanMapel } from '../seleksi.js';
import { kirimChat } from './chat.js';
import { bukaModal, tampilkanHalaman, tutupModal } from '../ui.js';
import { $, esc } from '../util.js';
import { status } from '../status.js';

const IKON_BUKU = '<svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5Z"/><path d="M4 5.5v15"/></svg>';

export function renderChips() {
  const m = materiSiswa()[0];
  const def = m ? definisiDariMateri(m).slice(0, 3) : [];
  $('#chipCepat').innerHTML = def.length
    ? def.map((d) => `<button class="btn ghost" data-act="chip" data-q="Apa itu ${esc(d.istilah)}?">${esc(d.istilah)}</button>`).join('')
    : '<span class="small muted">Belum ada contoh pertanyaan — guru belum mengisi materi untuk kelas ini.</span>';
}

export function renderMateriSiswa() {
  const wadah = $('#daftarMateriSiswa');
  const daftar = materiSiswa();
  const label = $('#labelKelasSiswa');
  if (label) label.textContent = 'Kelas ' + status.kelasSiswa;
  if (!daftar.length) {
    wadah.innerHTML = `
      <div class="card">
        <div class="kosong">
          <span class="kosong-ikon">${IKON_BUKU}</span>
          <b>Materi belum tersedia</b>
          <p class="muted small">Guru belum mengisi materi untuk kelas ${esc(status.kelasSiswa)}. Materi kelas lain memang tidak ditampilkan di sini.</p>
        </div>
      </div>`;
    return;
  }
  wadah.innerHTML = daftar.map((m) => `
    <div class="card materi mapel-${kelasMapel(m.mapel)}" data-tilt="1" data-tilt-kuat="9">
      <div class="baris" style="justify-content:space-between">
        <span class="mapel-ikon">${esc(singkatanMapel(m.mapel))}</span>
        <span class="tag">Kelas ${esc(status.kelasSiswa)}</span>
      </div>
      <h3>${esc(m.judul)}</h3>
      <p class="muted small" style="margin:0">${m.teks.length} bagian materi · ${esc(m.mapel)}</p>
      <div class="btnrow">
        <button class="btn primary" data-act="bacaMateri" data-id="${m.id}">Buka materi</button>
        <button class="btn ghost" data-act="tanyaMateri" data-id="${m.id}">Tanya AI</button>
      </div>
    </div>`).join('');
}

export function bacaMateri(id) {
  const m = status.db.materi.find((x) => x.id === id);
  if (!m) return;
  bukaModal(m.mapel + ' · Kelas ' + m.kelas, m.judul,
    m.teks.map((t) => '<p style="margin:0 0 10px">' + esc(t) + '</p>').join('') +
    '<div class="spacer"></div><div class="btnrow">' +
    '<button class="btn primary" data-act="tanyaMateri" data-id="' + m.id + '">Tanya AI tentang materi ini</button>' +
    '<button class="btn ghost" data-act="keLatihan" data-id="' + m.id + '">Latihan soal materi ini</button>' +
    '</div>');
}

export function tanyaMateri(id) {
  const m = status.db.materi.find((x) => x.id === id);
  if (!m) return;
  tutupModal();
  tampilkanHalaman('s-chat');
  $('#chatInput').value = 'Apa itu ' + m.judul.toLowerCase().split(' ')[0] + '?';
  kirimChat('Jelaskan ' + m.judul);
}
