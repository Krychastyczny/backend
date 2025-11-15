# TODO API - Menadżer Zadań

**Autor:** Krystian  
**Grupa:** INMN2(hybryda)_PAW2  
**Data:** 2025-11-15

## Opis projektu
REST API do zarządzania zadaniami (TODO) przygotowane na laboratoria z backendu. Dane są przechowywane w pliku `tasks.json`, a wszystkie operacje (GET/POST/PUT/DELETE) pracują na tym pliku, dzięki czemu stan serwera jest utrzymany między restartami.

## Technologie
- Node.js 18+
- Express 5
- Nodemon (dev)
- JSON jako prosta warstwa persistence

## Struktura projektu
```
lab1/
├── src/
│   ├── server.js            # definicje endpointów
│   └── tasksRepository.js   # helpery do pracy z plikiem JSON
├── tasks.json               # magazyn danych
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Instalacja i uruchomienie

### Wymagania
- Node.js w wersji 18 lub wyższej
- npm

### Krok po kroku
```bash
# 1. Sklonuj repozytorium
git clone <URL_DO_REPO>

# 2. Przejdź do katalogu projektu
cd lab1

# 3. Zainstaluj zależności
npm install

# 4. Uruchom serwer w trybie produkcyjnym
npm start

# lub w trybie deweloperskim z automatycznym restartem
npm run dev
```

Serwer startuje na porcie `3000` (można nadpisać zmienną `PORT`). Po uruchomieniu jest dostępny pod adresem `http://localhost:3000`.

## Endpointy API

1. **GET /health**  
   Sprawdza status API.  
   Przykład:
   ```bash
   curl http://localhost:3000/health
   ```

2. **GET /tasks**  
   Zwraca wszystkie zadania z pliku. Obsługuje opcjonalne parametry:
   - `completed=true|false` – filtruje po statusie wykonania,
   - `sort=createdAt|title` – sortowanie rosnące,
   - `page` i `limit` – paginacja.  
   Przykład:
   ```bash
   curl "http://localhost:3000/tasks?completed=false&sort=createdAt&page=1&limit=5"
   ```

3. **GET /tasks/:id**  
   Zwraca pojedyncze zadanie po identyfikatorze.  
   ```bash
   curl http://localhost:3000/tasks/1
   ```

4. **POST /tasks**  
   Dodaje nowe zadanie. `id`, `completed=false` i `createdAt` są ustawiane automatycznie.  
   ```bash
   curl -X POST http://localhost:3000/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"Nowe zadanie","description":"Opis"}'
   ```

5. **PUT /tasks/:id**  
   Aktualizuje istniejące zadanie. Możesz przekazać `title`, `description` i/lub `completed`.  
   ```bash
   curl -X PUT http://localhost:3000/tasks/1 \
     -H "Content-Type: application/json" \
     -d '{"title":"Zaktualizowane","completed":true}'
   ```

6. **DELETE /tasks/:id** *(bonus)*  
   Usuwa zadanie i zwraca informację o usuniętym wpisie.  
   ```bash
   curl -X DELETE http://localhost:3000/tasks/1
   ```

### Struktura zadania
```json
{
  "id": 1,
  "title": "Zrobić zakupy",
  "description": "Mleko, chleb, masło",
  "completed": false,
  "createdAt": "2025-11-15T10:00:00Z",
  "updatedAt": "2025-11-15T13:00:00Z"
}
```

## Testowanie
- **curl** – szybkie testy z terminala.
- **Thunder Client / Postman** – wygodne ręczne sprawdzanie endpointów.
- Przed wysłaniem rozwiązania przetestuj każdy scenariusz (dodanie, edycja, filtr, paginacja, obsługa błędów 400/404).

## Obsługa błędów
- 400 – błędne dane (np. brak `title`, niepoprawne parametry zapytania).
- 404 – brak zadania lub ścieżka nie istnieje.
- 500 – problemy z plikiem `tasks.json` (np. uszkodzony JSON).

## Checklist prowadzącego
- [x] `GET /health`
- [x] `GET /tasks`
- [x] `POST /tasks`
- [x] `PUT /tasks/:id`
- [x] `README.md` z instrukcjami
- [x] Historia commitów
- [x] Bonus: walidacja, obsługa błędów i dodatkowe endpointy (`GET/DELETE /tasks/:id`)

## Przydatne linki
- https://jsonformatter.org/
- https://httpstatuses.com/
- https://restfulapi.net/
- https://www.markdownguide.org/
