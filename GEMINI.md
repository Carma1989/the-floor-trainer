# The Floor Trainer ("THE WIEDZA") — Pamięć projektu i zasady pracy

## 1. Użytkowniczka i styl komunikacji
- **Imię:** Camilla (NIGDY nie zwracać się „Patrycja”).
- **Język:** Polski.
- **Styl:** Krótko, rzeczowo, technicznie, bez korpo-entuzjazmu, wykrzykników i lania wody.
- **Rzetelność:** Zero halucynacji i zgadywania. Podawać wyłącznie fakty zweryfikowane w plikach lub wyjściu komend; przy brakach danych podawać twarde liczby.
- **Linki:** Zawsze używać klikalnych linków markdown z `file://` dla przywoływanych plików lokalnych.
- **Globalne zasady:** Rozszerzają plik `~/.gemini/antigravity/rules/user_principles.md`.

## 2. Cel projektu i architektura
- **Ścieżka:** `/Users/camillahansen/Desktop/4th-devs/the-floor-trainer`
- **Cel:** Mobilna aplikacja treningowa (React 19 + Vite 8 + Tailwind) przygotowująca do 10. sezonu polskiego teleturnieju *The Floor* (TVN).
- **UI (`src/App.jsx`):** 2 zakładki (`Ćwicz`, `Katalog`).
  - `src/components/MobilePlay.jsx`: tryb fiszek (`ODPOWIEDŹ` → `NASTĘPNA KARTA`, bez timera i przycisków `ZALICZ/PAS`), stały kwadratowy kontener obrazu (`w-[280px] h-[280px] sm:w-[310px] sm:h-[310px] shrink-0`), obsługa podmiany obrazu po odpowiedzi (`revealedImageUrl`), preload kolejnych 5 kart.
  - `src/components/MobileBrowse.jsx`: lista kategorii z liczbą kart i wyszukiwarką.
  - `src/components/SmartImage.jsx`: obsługa ładowania, spinner `border-4`, reset stanu przy zmianie `src`.
  - `src/utils/speech.js`: naprawiona pętla `not-allowed` (`blockedRef`, mikrofon domyślnie wyłączony).

## 3. Baza wiedzy i standardy kart (`src/data/categories.js`)
- **Stan:** 42 kategorie, 1 624 karty.
- **Media:** 100% lokalne w `public/media/` i `public/logos/` (`0` zewnętrznych URL-i, żeby uniknąć limitów 429 z Wikimedia). Wygenerowane SVG ujednolicone do `800×800` (`1:1`).
- **Ustalone standardy wizualne (jak w TVN *The Floor*):**
  - **Loga marek spożywczych (`polish_food_logos`):** `imageUrl` zawiera logo z czysto usuniętą nazwą marki, `revealedImageUrl` pokazuje pełne logo z nazwą po kliknięciu `ODPOWIEDŹ`.
  - **Przyprawy / jedzenie (`spices_herbs`):** zdjęcia z kontekstem (naczynie/pojemnik, proszek/ziarna + roślina/kwiat/korzeń w tle), unikać nieczytelnych zbliżeń makro.
  - **Ludzie / seriale (np. `bridgerton`, `pop_stars_radio`):** wyłącznie prawdziwe twarze/zdjęcia, zero kart z opisem tekstowym.
- **Analiza sezonów (`src/data/analysis/`):** `season_1.json`..`season_9.json` (835/900 zweryfikowanych kafelków), `casting_questionnaire.json` (90/90), `raport_produkcyjny.md`.

## 4. Uruchamianie, telefon poza Wi-Fi i deployment
- **Build i podgląd lokalny:** `npm run build && npm run preview -- --host 0.0.0.0 --port 5173` (w `vite.config.js` ustawiono `allowedHosts: true` dla `server` i `preview`).
- **Tunel na telefon (LTE/5G, bez konta):** `npx --yes cloudflared tunnel --url http://localhost:5173`.
- **Ważne o Vercel / e-mail:** Na tym Macu w Git jest ustawiony adres `98vqzxqpxf@privaterelay.appleid.com` (Apple Hide My Email), który blokuje maile weryfikacyjne z `vercel.com`. Nie uruchamiać `vercel login` z weryfikacją e-mail; do stałego hostingu 24/7 używać repozytorium GitHub (`Carma1989`) + importu w przeglądarce (`vercel.com/new`).
