# Local Test Kılavuzu

## Hızlı Test (Form Yapısı)

```bash
npm run dev
```

- Tarayıcıda `http://localhost:4182` açılır
- Form yapısını, validasyonu ve border efektlerini test edebilirsiniz
- ⚠️ **Not:** Form gönderimi çalışmaz (Netlify Forms local'de çalışmaz)

## Netlify Forms ile Test (Form Gönderimi Dahil)

### 1. Netlify CLI ile Login

```bash
netlify login
```

### 2. Netlify Dev Server Başlat

```bash
netlify dev
```

Bu komut:
- Local development server'ı başlatır
- Netlify Forms'u local'de çalıştırır
- Form gönderimlerini test edebilirsiniz
- Dosya upload'ları test edebilirsiniz

### 3. Test Adımları

1. Tarayıcıda açılan sayfada formu doldurun
2. CV dosyası yükleyin
3. Formu gönderin
4. Console'da "CV file ready for upload" mesajını kontrol edin
5. Netlify dashboard'da form submission'ı kontrol edin

## Önemli Notlar

- **Netlify Forms local'de çalışmaz** - Sadece `netlify dev` ile çalışır
- **Dosya upload limiti:** 10MB
- **E-posta bildirimleri:** Sadece production'da çalışır
- **Form submission:** `netlify dev` ile local'de test edilebilir

## Sorun Giderme

### Port zaten kullanılıyor
```bash
# Farklı bir port kullan
netlify dev --port 3000
```

### Netlify CLI bulunamıyor
```bash
# Global olarak kur
npm install -g netlify-cli
```

### Form gönderimi çalışmıyor
- `netlify dev` kullandığınızdan emin olun
- `npm run dev` ile form gönderimi çalışmaz

