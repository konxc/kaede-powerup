# Kebijakan Privasi

**Berlaku efektif: 1 Januari 2026**

KAEDE ("Koneksi Automated Environment DE") adalah Trello Power-Up yang dikembangkan dan dioperasikan oleh PT Koneksi Jaringan Indonesia ("Koneksi", "kami", "kita").

## Data yang Dikumpulkan

KAEDE beroperasi sebagai jembatan antara Trello dan lingkungan eksternal. Kami mengumpulkan data minimal berikut:

| Jenis Data | Tujuan | Masa Simpan |
|---|---|---|
| **Token API Trello** | Otentikasi sesi Power-Up | Hanya selama sesi aktif, tidak disimpan |
| **ID Board, List, Card** | Operasi Power-Up (konteks lingkungan) | Tidak disimpan secara permanen |
| **Environment name/value** | Dikonfigurasi user, ditampilkan di card Trello | Hingga user mengubahnya |
| **Log error anonim** | Debugging dan perbaikan bug | 30 hari |

## Cara Kami Menggunakan Data

Data hanya digunakan untuk:

1. Menampilkan environment indicator di kartu Trello
2. Mengelola koneksi ke environment staging/produksi
3. Menyediakan fungsi navigasi yang diminta user
4. Diagnostik dan perbaikan error

## Penyimpanan dan Keamanan

- **Semua data disimpan secara lokal** di browser user (localStorage) atau di Trello (melalui API)
- **Tidak ada server backend** yang menyimpan data user
- **Token API disimpan di Trello** sebagai bagian dari otorisasi Power-Up
- Kami tidak menjual, menyewakan, atau membagikan data ke pihak ketiga
- Koneksi ke Trello API menggunakan enkripsi HTTPS

## Data Anak di Bawah 16 Tahun

KAEDE tidak ditujukan untuk pengguna di bawah 16 tahun. Kami tidak sengaja mengumpulkan data dari anak-anak. Jika kami mengetahui adanya data dari anak di bawah 16 tahun, data tersebut akan segera dihapus.

## Hak Pengguna

Pengguna berhak untuk:

- **Mengetahui** data apa yang dikumpulkan (lihat tabel di atas)
- **Menghapus** data lokal dengan membersihkan browser cache/localStorage
- **Mencabut akses** dengan menghapus Power-Up dari board Trello
- **Menonaktifkan** Power-Up kapan saja melalui Trello Power-Up admin

## Perubahan Kebijakan

Kebijakan ini dapat diperbarui dari waktu ke waktu. Perubahan akan diumumkan melalui halaman ini dan/atau melalui channel komunikasi tim Koneksi.

## Kontak

Untuk pertanyaan tentang kebijakan privasi ini, hubungi:

**PT Koneksi Jaringan Indonesia**  
Email: [privasi@koneksi.co.id](mailto:privasi@koneksi.co.id)
