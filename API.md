# API-контракт — Bunker Monitor

Контракт спроектирован фронтом (бэкенд Python/FastAPI ещё не готов) и реализован в мок-сервере
(`mock-server/index.cjs`), чтобы фронт мог разрабатываться автономно. При переходе на реальный
бэкенд меняется только `VITE_API_BASE_URL` (см. README) — сам контракт остаётся тем же; любые
несовпадения полей/типов на реальном бэкенде нужно свести к формату ниже (или обновить типы в
`src/types/index.ts` и этот файл вместе с ними).

Базовый префикс — `/api/v1`. Все ответы — JSON. `bunker_id` — часть пути везде, где ответ относится
к конкретному бункеру (multi-bunker-ready с первого коммита, см. `CLAUDE.md`).

Соответствующие TypeScript-типы — в `src/types/index.ts`, здесь только форма ответов и пояснения.

---

## GET /api/v1/bunkers

Список бункеров.

```json
[
  { "id": "bunker-1", "name": "Бункер №1", "online": true, "geometry_id": "geom-bunker-1" },
  { "id": "bunker-2", "name": "Бункер №2", "online": true, "geometry_id": "geom-bunker-2" }
]
```

`online` — агрегированный статус связи с этим бункером (в моке завязан на общий Edge PC, у реального
бэкенда с несколькими Edge-узлами может отличаться по бункерам).

---

## GET /api/v1/bunkers/:bunker_id/measurements/latest

Последний замер — для live-дашборда (поллинг раз в `POLL_INTERVAL_MS`, по умолчанию 1.5 с).

```json
{
  "id": 4213,
  "ts": "2026-07-29T07:21:00.000Z",
  "avg_level": 2.61,
  "min_level": 1.35,
  "max_level": 3.96,
  "volume": 13.82,
  "mass": 31.796,
  "beams": [
    { "beam_name": "A1", "height": 2.62, "status": "" },
    { "beam_name": "H6", "height": 0, "status": "Unknown, NotUsed, Disabled, DistanceNotUpdating" }
  ]
}
```

Критически важно (см. открытые вопросы в README, №1–2):
- `status` — строка через запятую, не массив: `split(',').map(s => s.trim())` (`lib/beamUtils.ts:parseStatus`).
- `height = 0` **не значит «руды нет»**, если статус содержит `Disabled`/`DistanceNotUpdating`/`NotUsed`/`Unknown`
  — проверять `isBeamReliable(statusFlags)` (`lib/beamUtils.ts`), никогда не читать `height` напрямую.
- `min_level`/`max_level` в самом замере — это мин/макс **высот отдельных лучей** этого замера (по
  достоверным лучам), не то же самое, что `avg_level`.
- Единицы: `avg_level`/`min_level`/`max_level` — метры, `volume` — м³ (допущение), `mass` — тонны
  (допущение, плотность 2.3 т/м³) — константы в `src/config/index.ts` (`UNITS`, `DENSITY_T_PER_M3`),
  не хардкодить подписи.
- `ts` — ISO-8601 UTC. Хранить/сравнивать в UTC, показывать в локальном времени (`formatTimestamp`).

---

## GET /api/v1/bunkers/:bunker_id/measurements?from=&to=&limit=&offset=

Постраничный список замеров (используется фронтом только программно — для CSV-экспорта на странице
«История», см. открытые/принятые решения в README про отсутствие видимой таблицы замеров).

```json
{
  "total": 2000,
  "limit": 50,
  "offset": 0,
  "items": [ /* Measurement[], формат как у /measurements/latest, новые первыми */ ]
}
```

`limit` максимум 100 на страницу (мок ограничивает жёстко). `from`/`to` — ISO-8601, опциональны.

---

## GET /api/v1/bunkers/:bunker_id/stats?period=day|week|month

Агрегаты для графиков истории.

```json
{
  "period": "day",
  "min_level": 0.47,
  "max_level": 5.96,
  "avg_level": 3.14,
  "series": [
    {
      "ts": "2026-07-29T06:00:00.000Z",
      "avg_level": 2.9,
      "min_level": 1.2,
      "max_level": 4.1,
      "mass": 38.2,
      "volume": 16.6
    }
  ]
}
```

Бакетирование по времени (в моке): 1 ч для `day`, 6 ч для `week`, 1 день для `month`. `min_level`/
`max_level` в точках серии берутся из мин/макс высот лучей внутри бакета, а не из `avg_level` —
иначе при одном замере на бакет три линии графика совпадали бы.

---

## GET /api/v1/bunkers/:bunker_id/geometry

Геометрия бункера и раскладка 64 лучей — **фронт её не вычисляет**, только потребляет (см. открытый
вопрос №3 и №5–8 в README: азимут оси A, тип формы, `beams[].z`, азимут наклона датчика).

```json
{
  "bunker_id": "bunker-1",
  "shape": { "type": "truncated_cone", "top_diameter_m": 7, "bottom_diameter_m": 4.2, "height_m": 8 },
  "sensor": { "x": 0, "y": 0, "z": 8.5, "tilt_deg": 0 },
  "beams": [
    { "beam_name": "A1", "axis": "A", "position": 1, "x": 0.35, "y": 0, "z": 0 }
    /* ... 64 точки ... */
  ]
}
```

Если `/geometry` недоступен — фронт использует резервную раскладку (`FALLBACK_GEOMETRY`/
`FALLBACK_BUNKER_SHAPE`/`FALLBACK_SENSOR` в `src/config/index.ts`): 8 осей через 45°, равномерный
радиус — **только для разработки**, не для продакшена.

---

## GET /api/v1/bunkers/:bunker_id/buildup

Анализ подозрения на налипание руды на боковых стенках по каждой из 8 осей (этап 4).

```json
{
  "bunker_id": "bunker-1",
  "ts": "2026-07-29T07:21:00.000Z",
  "threshold_m": 0.35,
  "zones": [
    {
      "axis": "C",
      "severity": "high",
      "score": 1,
      "deviation_m": 1.17,
      "affected_positions": [7, 8]
    }
    /* ... по одной записи на каждую из 8 осей, включая severity: "none" ... */
  ]
}
```

**Критично:** `severity` (`none`/`low`/`medium`/`high`, список открытый — как и флаги статуса луча),
`score`, `deviation_m` и `threshold_m` — фронт трактует как непрозрачные значения от бэкенда.
Реальный критерий детекции определяется заказчиком (открытый вопрос №4 в README); мок использует
placeholder-эвристику (линейная экстраполяция профиля оси, см. `mock-server/index.cjs:computeBuildupZones`).
Фронт **не** пересчитывает и не хардкодит порог ни в одном компоненте — см. `lib/buildupUtils.ts`.

---

## GET /api/v1/health

Здоровье Edge-узлов (промышленный мини-ПК, Intel NUC 7i5DN) — источник алертов «Edge PC offline».

```json
{
  "edge_pcs": [
    {
      "node_id": "edge-1",
      "online": true,
      "last_pulse": "2026-07-29T07:21:00.000Z",
      "cpu": 24.1,
      "ram": 40.4,
      "disk": 59.4
    }
  ]
}
```

---

## POST /api/v1/debug/edge-offline (только мок-сервер)

Не часть контракта с реальным бэкендом — служебный эндпоинт мока для ручной проверки алерта
«Edge PC offline» без ожидания реального сбоя.

```bash
curl -X POST http://localhost:3001/api/v1/debug/edge-offline \
     -H "Content-Type: application/json" \
     -d '{"online": false}'
```

---

## Выбор технологии мок-сервера

Node/Express, а не `json-server` — потому что нужна не статичная выдача фикстур, а живая генерация:
реалистичный разброс статусов лучей (`pickStatus`), дрейф уровня во времени, накапливающаяся история
(`setInterval`), демонстрационное нарастание налипания на одной оси, ручное управление состоянием Edge PC
(`/debug/edge-offline`) — весь этот процедурный код проще писать на обычном сервере, чем настраивать
поверх `json-server` middleware/generators. Express выбран как самый распространённый и лёгкий вариант,
без ORM/фреймворка — сервер укладывается в один файл (`mock-server/index.cjs`) без отдельной сборки.

## Допущения и открытые вопросы

Полная таблица допущений (единицы измерения, азимут осей, критерий налипаний, форма бункера и т.д.) —
в README, раздел «Открытые вопросы / Допущения». Здесь она не дублируется, чтобы не рассинхронизироваться.
