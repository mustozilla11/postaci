# Postacı ✉️

**Postacı**, Linux (CachyOS, Arch, Fedora, Ubuntu vb.) ve özellikle **KDE Plasma (Wayland / X11)** masaüstü ortamları için tasarlanmış; hafif, hızlı ve çoklu hesap destekli modern bir masaüstü e-posta istemcisidir.

Tüm e-posta hesaplarınızı (Gmail, Microsoft 365, Outlook, iCloud veya özel Webmail) tek bir pencerede, bağımsız ve izole oturum sekmeleriyle yönetmenizi sağlar.

---

## 🌟 Öne Çıkan Özellikler

- **🔒 İzole Çoklu Oturum Mimarisi:** Her hesap bağımsız bir çerez ve oturum alanında (`partition: 'persist:<hesap_id>'`) çalışır. Örneğin 5 farklı Gmail veya kurumsal hesabı birbirine karışmadan aynı anda kullanabilirsiniz.
- **🛡️ Güvenli Giriş Uyumluluğu:** Google ve Microsoft kimlik doğrulama sistemlerinin gömülü tarayıcılarda verdiği *"Bu tarayıcı veya uygulama güvenli olmayabilir"* engelini çözen dinamik User-Agent başlığı mimarisi.
- **🎓 Microsoft 365 (Üniversite & Kurumsal) Desteği:** `@posta.mu.edu.tr` gibi üniversite ve kurumsal Office 365 e-posta hesapları için doğrudan optimize edilmiş oturum akışı.
- **🐧 KDE Plasma & Wayland Desteği:** `--ozone-platform-hint=auto` ve yerel pencere dekorasyonları sayesinde Wayland üzerinde keskin ve akıcı arayüz.
- **📑 Sekmeli Minimalist Tasarım:** Sekmelerde servis logoları, hesap takma adları, kolay sekme yönetimi ve sağ tık bağlam menüsü (Yenile, Düzenle, Kapat).
- **🖥️ Linux Masaüstü ve Terminal Entegrasyonu:** KDE / GNOME uygulama menüsü kısayolu (`mailhub.desktop`) ve terminalden tek komutla çalıştırma (`mailhub` / `postaci`).

---

## 🚀 Kurulum ve Çalıştırma

### Hazır Derlenmiş Sürümden Çalıştırma

Postacı sisteminize entegre edildikten sonra doğrudan terminalden çalıştırılabilir:

```bash
mailhub
```
*(veya KDE / GNOME uygulama başlatıcınızda **Postacı** aratabilirsiniz)*

---

### Kaynak Koddan Geliştirme ve Derleme

Gereksinimler: Node.js (v18+) ve npm.

```bash
# Depoyu klonlayın
git clone https://github.com/mustozilla11/postaci.git
cd postaci

# Bağımlılıkları yükleyin
npm install

# Geliştirme modunda başlatın
npm start

# Optimize Linux release derlemesi alın
npm run build
```

---

## ⌨️ Desteklenen Servisler

| Servis | Açıklama |
| :--- | :--- |
| **Gmail** | Google Workspace ve kişisel Gmail hesapları |
| **Microsoft 365** | Üniversite (`.edu.tr`) ve şirket Office 365 e-postaları |
| **Outlook / Live** | Kişisel `@outlook.com`, `@hotmail.com` hesapları |
| **iCloud Mail** | Apple iCloud e-posta hesapları |
| **Özel Webmail** | Kendi sunucunuz, cPanel Webmail, Roundcube vb. |

---

## 📜 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır.
