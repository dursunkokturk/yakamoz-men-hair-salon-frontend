# TR
# 💈 Yakamoz Erkek Kuaförü — Online Randevu Sistemi

Yakamoz Erkek Kuaförü için geliştirilmiş, backend gerektirmeyen, tamamen istemci tarafında (client-side) çalışan bir randevu yönetim uygulamasıdır. Müşteriler online randevu alabilir, randevularını telefon numaralarıyla sorgulayabilir; işletme sahibi ise admin panelinden randevuları onaylayıp yönetebilir.

🎯 Portfolyo / demo projesi — Veriler bir sunucuya değil, tarayıcının localStorage'ına kaydedilir.

## 📑 İçindekiler

## Özellikler
- Ekran Akışı
- Teknoloji Yığını
- Proje Yapısı
- Kurulum
- Admin Girişi
- Veri Katmanı ve Kalıcılık
- Randevu İş Kuralları
- Tema Sistemi
- Bilinen Sınırlamalar
- Yol Haritası


### ✨ Özellikler

### Müşteri Tarafı

|                   |                                                                                                                   |
|:------------------|:------------------------------------------------------------------------------------------------------------------|
| 🏠 Ana Sayfa      | İşletme tanıtımı, öne çıkan hizmetler, hızlı randevu çağrısı                                                      |
| ✂️ Hizmetler      | Aktif hizmetlerin listesi (isim, süre, ücret), hizmete tıklayarak doğrudan randevu formuna geçiş                  |
| 📅 Randevu Al     | Ad-soyad, telefon, hizmet seçimi, takvimden tarih seçimi ve o günün uygun saatlerini gösteren dinamik saat seçimi |
| 🔍 Randevularım   | Telefon numarasıyla geçmiş/gelecek randevu sorgulama                                                              |
| 🌗 Açık/Koyu Tema | Sistem tercihine duyarlı, manuel değiştirilebilir tema anahtarı                                                   |


### Admin (Berber Paneli) Tarafı
|                          |                                                                                |
|:-------------------------|:-------------------------------------------------------------------------------|
| 🔐 Kullanıcı adı/şifre   | ile korumalı giriş (ProtectedRoute)                                            |
| 📋 Randevu Yönetimi      | Güne göre randevu listeleme, durum/hizmet/isim filtreleme, randevu detayında onayla / iptal et / sil / tarih değiştir / müşteriyi engelle işlemleri |
| 🚫 Engellenen Müşteriler | Kötüye kullanan müşterileri isim+telefon eşleşmesiyle engelleme/engel kaldırma |
| 🛠️ Hizmet Yönetimi       | Hizmet ekleme, düzenleme, silme, aktif/pasif yapma                             |
| 📆 Kapalı Günler         | Resmî tatil, bakım vb. sebeplerle özel gün kapatma                             |
| ⚙️ Ayarlar               | Haftalık kapalı gün seçimi, admin şifre değiştirme                             |
 

### 🧭 Ekran Akışı

Ana Sayfa ──┬── Hizmetler ──► Randevu Al ──► Onay Ekranı <br>
            ├── Randevu Al (doğrudan) <br>
            ├── Randevularım (telefonla sorgu) <br>
            └── Admin Girişi ──► Berber Paneli <br>
                                   ├── Randevular (filtrele / onayla / iptal / sil / ertele / engelle) <br>
                                   ├── Engellenen Müşteriler <br>
                                   ├── Hizmetler (CRUD) <br>
                                   ├── Kapalı Günler <br>
                                   └── Ayarlar (çalışma günleri, şifre) <br>


### 🧰 Teknoloji Yığını

| Katman           | Kullanılan Kütüphane                                                |
|:-----------------|:--------------------------------------------------------------------|
| UI Framework     | React (fonksiyonel bileşenler + Hooks)                              |
| Yönlendirme      | react-router-dom (BrowserRouter, ProtectedRoute)                    |
| Form Yönetimi    | react-hook-form (useForm, Controller)                               |
| Bildirimler      | react-toastify                                                      |
| Tarih İşlemleri  | dayjs (weekday, customParseFormat, isSameOrAfter/Before, tr locale) |
| İkonlar          | lucide-react                                                        |
| Veri Kalıcılığı  | Tarayıcı localStorage (özel storage.js sarmalayıcı)                 |
| Kimlik Doğrulama | İstemci tarafında üretilen sahte JWT (demo amaçlı, alg: none)       |
| Stil             | CSS, CSS custom properties (design tokens) ile tema yönetimi        |


⚠️ Not: Kimlik doğrulama, kod içindeki yorumda da belirtildiği gibi gerçek bir backend'i temsil etmez. Üretim ortamında bu mantığın bir sunucu tarafından yürütülmesi gerekir.

### 📁 Proje Yapısı

src/ <br>
├── App.jsx                     # Route tanımları ve provider ağacı <br>
├── App.css                     # Tüm tasarım tokenları ve global stiller <br>
├── context/ <br>
│   ├── SettingsContext.jsx     # İşletme adı, telefon, çalışma saatleri, kapalı gün <br>
│   ├── AuthContext.jsx         # Sahte JWT tabanlı admin oturumu <br>
│   ├── ServiceContext.jsx      # Hizmet CRUD + aktif/pasif yönetimi <br>
│   ├── BlockedCustomerContext.jsx <br>
│   ├── AppointmentContext.jsx  # Randevu CRUD, slot doluluk kontrolü <br>
│   ├── ClosedDayContext.jsx    # Admin tarafından eklenen özel kapalı günler <br>
│   └── ThemeContext.jsx        # Açık/koyu tema durumu <br>
├── components/ <br>
│   ├── layout/                 # Header, Footer, ProtectedRoute <br>
│   ├── pages/                  # Home, Services, BookAppointment, MyAppointments, <br>
│   │                           # Login, AdminPanel, NotFound <br>
│   ├── admin/                  # BusinessHoursSettings, ClosedDaysManager, <br>
│   │                           # AppointmentFilters, PasswordSettings <br>
│   ├── services/                # ServiceCard, ServiceForm, ServiceManagerList <br>
│   ├── ui/                      # Button, Input, Select, Modal, Card, Badge, Calendar, Spinner <br>
│   ├── visuals/                 # Logo, BarberStripe (marka imza öğesi) <br>
│   └── hooks/                   # useAvailability, useDebounce, useFetch <br>
└── utils/ <br>
    ├── dateUtils.js             # Slot üretimi, tarih formatlama, çalışma günü kontrolü <br>
    ├── scheduling.js            # Tek noktadan tarih kapalılık kontrolü (UI + veri katmanı ortak) <br>
    ├── storage.js                # localStorage get/set sarmalayıcı + STORAGE_KEYS <br>
    └── validation.js             # Ad-soyad / telefon doğrulama ve normalize etme <br>

Mimari Not: utils/scheduling.js içindeki getDateClosureInfo fonksiyonu, hem Calendar bileşeninin hem useAvailability hook'unun hem de AppointmentContext'in aynı kapalı gün mantığını kullanmasını sağlar. Bu, arayüz ile veri katmanının kapanış kurallarında birbirinden sapmasını önler.


### 🚀 Kurulum

bash# Bağımlılıkları yükleyin  <br>
npm install 

### Geliştirme sunucusunu başlatın
npm run dev

### Üretim derlemesi
npm run build

Uygulama varsayılan olarak Vite geliştirme sunucusunda (index.html giriş noktası /src/main.jsx) çalışacak şekilde yapılandırılmıştır.


### 🔑 Admin Girişi

Varsayılan demo kimlik bilgileri (AuthContext.jsx içinde tanımlı):

| Kullanıcı Adı | Şifre       |
|:--------------|:------------|
| admin         | yakamoz2026 |


Giriş yaptıktan sonra admin, Ayarlar sekmesinden şifresini değiştirebilir (PasswordSettings). Oturum, 8 saat geçerlilik süreli bir token ile localStorage'da tutulur.


#### 💾 Veri Katmanı ve Kalıcılık

Tüm veriler src/utils/storage.js üzerinden localStorage'a yazılır. Kullanılan anahtarlar:

| Anahtar                   | İçerik                                                         |
|:--------------------------|:---------------------------------------------------------------|
| yakamoz_appointments      | Randevu kayıtları                                              |
| yakamoz_services          | Hizmet listesi                                                 |
| yakamoz_blocked_customers | Engellenen müşteriler                                          |
| yakamoz_auth_token        | Admin oturum token'ı                                           |
| yakamoz_admin_credentials | Admin kullanıcı adı/şifresi                                    |
| yakamoz_settings          | İşletme ayarları (isim, telefon, çalışma saatleri, kapalı gün) |
| yakamoz_closed_days       | Özel kapalı günler                                             |
| yakamoz_theme             | Seçili tema                                                    |
| yakamoz_admin_filters     | Admin panelindeki son kullanılan randevu filtreleri            |


Backend olmadığı için useFetch hook'u şu an aktif kullanılmıyor; ileride gerçek bir API'ye (/api/appointments vb.) geçiş yapılmak istenirse hazır bir soyutlama olarak bırakılmıştır.


### 📏 Randevu İş Kuralları

- Çalışma saatleri: 09:00 – 19:00, 30 dakikalık dilimlerle (SLOT_INTERVAL_MINUTES)
- Bir zaman dilimine en fazla 2 randevu alınabilir (MAX_APPOINTMENTS_PER_SLOT)
- Varsayılan haftalık kapalı gün: Salı (admin panelinden değiştirilebilir)
- Admin, takvimden bağımsız olarak istediği özel günleri de kapalı ilan edebilir (resmî tatil, bakım vb.)
- Geçmiş tarih/saatler otomatik olarak seçilemez hale gelir
- Aynı ad-soyad + telefon kombinasyonu engellenmişse yeni randevu oluşturulamaz
- Randevu ertelendiğinde de aynı doluluk ve kapalı gün kontrolleri tekrar uygulanır

### 🎨 Tema Sistemi

- İlk yüklemede index.html içindeki inline script, flash of wrong theme önlemek için tema kararını DOM boyanmadan önce verir
- Kullanıcı tercihi yoksa prefers-color-scheme sistem ayarına bakılır
- Seçim ThemeContext üzerinden data-theme attribute'u ile CSS custom property'lerine yansıtılır


### ⚠️ Bilinen Sınırlamalar

- Gerçek bir backend/API yoktur; veriler yalnızca kullanıcının tarayıcısında saklanır ve cihazlar arasında senkronize olmaz
- Kimlik doğrulama demo amaçlıdır, üretim güvenliği sağlamaz (alg: none sahte JWT)
- Randevu bildirimleri (SMS/e-posta) gönderilmez, sadece uygulama içi toast bildirimleri vardır


### 🗺️ Yol Haritası Fikirleri

- Gerçek bir backend/API entegrasyonu (useFetch hook'u bu geçişe hazır)
- SMS/e-posta ile randevu hatırlatma
- Çoklu berber/çalışan desteği
- Randevu istatistikleri ve raporlama paneli


# EN
# 💈 Yakamoz Men's Barbershop — Online Booking System

An appointment management application built for Yakamoz Men's Barbershop that requires no backend and runs entirely client-side. Customers can book appointments online and look them up by phone number; the shop owner can approve and manage appointments from an admin panel.

🎯 Portfolio / demo project — Data is saved to the browser's localStorage rather than a server.

## 📑 Table of Contents

## Features
- Screen Flow
- Tech Stack
- Project Structure
- Setup
- Admin Login
- Data Layer & Persistence
- Appointment Business Rules
- Theme System
- Known Limitations
- Roadmap Ideas


## ✨ Features

### Customer Side

|                     |                                                                                                         |
|:--------------------|:--------------------------------------------------------------------------------------------------------|
| 🏠 Home             | Business intro, featured services, quick booking call-to-action                                         |
| ✂️ Services         | List of active services (name, duration, price); tapping a service jumps straight into the booking form |
| 📅 Book Appointment | Full name, phone, service selection, date picker, and a dynamic time-slot picker showing that day's available times |
| 🔍 My Appointments  | Look up past/upcoming appointments by phone number                                                      |
| 🌗 Light/Dark Theme | Respects system preference and can be toggled manually                                                  |


### Admin (Barber Panel) Side

|                                |                                                                      |
|:-------------------------------|:---------------------------------------------------------------------|
| 🔐 Username/password-protected | login (ProtectedRoute)                                               |
| 📋 Appointment Management      | List appointments by day, filter by status/service/name, and from the appointment detail view approve / cancel / delete / reschedule / block customer |
| 🚫 Blocked Customers           | Block/unblock abusive customers using a name + phone match           |
| 🛠️ Service Management          | Add, edit, delete, and activate/deactivate services                  |
| 📆 Closed Days                 | Close specific dates for reasons like public holidays or maintenance |
| ⚙️ Settings                    | Choose the weekly closed day, change the admin password              |


### 🧭 Screen Flow

Home ──┬── Services ──► Book Appointment ──► Confirmation <br>
       ├── Book Appointment (direct) <br>
       ├── My Appointments (lookup by phone) <br>
       └── Admin Login ──► Barber Panel <br>
                              ├── Appointments (filter / approve / cancel / delete / reschedule / block) <br>
                              ├── Blocked Customers <br>
                              ├── Services (CRUD) <br>
                              ├── Closed Days <br>
                              └── Settings (working days, password) <br>


### 🧰 Tech Stack

| Layer            | Library Used                                                        |
|:-----------------|:--------------------------------------------------------------------|
| UI Framework     | React (functional components + Hooks)                               |
| Routing          | react-router-dom (BrowserRouter, ProtectedRoute)                    |
| Form Handling    | react-hook-form (useForm, Controller)                               |
| Notifications    | react-toastify                                                      |
| Date Handling    | dayjs (weekday, customParseFormat, isSameOrAfter/Before, tr locale) |
| Icons            | lucide-react                                                        |
| Data Persistence | Browser localStorage (custom storage.js wrapper)                    |
| Authentication   | Client-side generated fake JWT (demo purposes only, alg: none)      |
| Styling          | CSS, theme handled via CSS custom properties (design tokens)        |


⚠️ Note: As noted in the code comments, the authentication mechanism does not represent a real backend. In a production setting, this logic must be handled by a server.


📁 Project Structure

src/ <br>
├── App.jsx                     # Route definitions and provider tree <br>
├── App.css                     # All design tokens and global styles <br>
├── context/ <br>
│   ├── SettingsContext.jsx     # Business name, phone, working hours, closed weekday <br>
│   ├── AuthContext.jsx         # Fake-JWT-based admin session <br>
│   ├── ServiceContext.jsx      # Service CRUD + active/inactive management <br>
│   ├── BlockedCustomerContext.jsx <br>
│   ├── AppointmentContext.jsx  # Appointment CRUD, slot capacity checks <br>
│   ├── ClosedDayContext.jsx    # Ad-hoc closed days added by the admin <br>
│   └── ThemeContext.jsx        # Light/dark theme state <br>
├── components/ <br>
│   ├── layout/                 # Header, Footer, ProtectedRoute <br>
│   ├── pages/                  # Home, Services, BookAppointment, MyAppointments, <br>
│   │                           # Login, AdminPanel, NotFound <br>
│   ├── admin/                  # BusinessHoursSettings, ClosedDaysManager, <br>
│   │                           # AppointmentFilters, PasswordSettings <br>
│   ├── services/                # ServiceCard, ServiceForm, ServiceManagerList <br>
│   ├── ui/                      # Button, Input, Select, Modal, Card, Badge, Calendar, Spinner <br>
│   ├── visuals/                 # Logo, BarberStripe (signature brand element) <br>
│   └── hooks/                   # useAvailability, useDebounce, useFetch <br>
└── utils/ <br>
    ├── dateUtils.js             # Slot generation, date formatting, working-day checks <br>
    ├── scheduling.js            # Single source of truth for date-closure logic (shared by UI + data layer) <br>
    ├── storage.js                # localStorage get/set wrapper + STORAGE_KEYS <br>
    └── validation.js             # Full name / phone validation and normalization <br>

Architecture Note: The getDateClosureInfo function in utils/scheduling.js ensures that the Calendar component, the useAvailability hook, and AppointmentContext all use the same closed-day logic. This prevents the UI and the data layer from drifting apart on closure rules.


## 🚀 Setup

bash# Install dependencies <br>
npm install

### Start the dev server
npm run dev

### Production build
npm run build

The app is set up to run by default on the Vite dev server (index.html entry point is /src/main.jsx).


🔑 Admin Login

Default demo credentials (defined in AuthContext.jsx):

| Username | Password    |
|:---------|:------------|
| admin    | yakamoz2026 |


After logging in, the admin can change the password from the Settings tab (PasswordSettings). The session is stored in localStorage as a token valid for 8 hours.


💾 Data Layer & Persistence

All data is written to localStorage via src/utils/storage.js. Keys used:

| Key                       | Content                                                        |
|:--------------------------|:---------------------------------------------------------------|
| yakamoz_appointments      | Appointment records                                            |
| yakamoz_services          | Service list                                                   |
| yakamoz_blocked_customers | Blocked customers                                              |
| yakamoz_auth_token        | Admin session token                                            |
| yakamoz_admin_credentials | Admin username/password                                        |
| yakamoz_settings          | Business settings (name, phone, working hours, closed weekday) |
| yakamoz_closed_days       | Ad-hoc closed days                                             |
| yakamoz_theme             | Selected theme                                                 |
| yakamoz_admin_filters     | Last-used appointment filters in the admin panel               |

Since there's no backend, the useFetch hook isn't actively used yet — it's left in place as a ready-made abstraction for a future migration to a real API (e.g. /api/appointments).


### 📏 Appointment Business Rules

- Working hours: 09:00 – 19:00, in 30-minute slots (SLOT_INTERVAL_MINUTES)
- Each time slot can hold at most 2 appointments (MAX_APPOINTMENTS_PER_SLOT)
- Default weekly closed day: Tuesday (configurable from the admin panel)
- The admin can also declare any specific date as closed regardless of the calendar (public holiday, maintenance, etc.)
- Past dates/times are automatically disabled
- A new appointment cannot be created if the same full name + phone combination is blocked
- The same capacity and closed-day checks are re-applied whenever an appointment is rescheduled


### 🎨 Theme System

- On first load, an inline script in index.html decides the theme before the DOM paints, preventing a flash of the wrong theme
- If the user has no stored preference, the system's prefers-color-scheme setting is used
- The selection is reflected via the data-theme attribute through ThemeContext, driving the CSS custom properties


### ⚠️ Known Limitations

- There is no real backend/API; data is stored only in the user's browser and does not sync across devices
- Authentication is for demo purposes only and provides no production-grade security (fake JWT with alg: none)
- No appointment notifications (SMS/email) are sent — only in-app toast notifications


### 🗺️ Roadmap Ideas

 - Real backend/API integration (the useFetch hook is ready for this transition)
 - SMS/email appointment reminders
 - Support for multiple barbers/staff
 - Appointment statistics and reporting dashboard
