# SBA AI Pulse

Ежедневный дайджест новостей об ИИ и автоматизации для руководителей компаний группы Самрук-Казына.

## Что это

Каждое утро система с помощью LLM (Perplexity Sonar через OpenRouter) собирает все релевантные новости об ИИ и автоматизации в корпоративном секторе Казахстана, суммирует каждую новость, добавляет ссылку на источник, генерирует рекомендацию к действию, связывает тренд с обучающей рекомендацией и маркирует по приоритетам государственной повестки.

## Быстрый старт

### 1. Установите зависимости

```bash
npm install
```

### 2. Получите OpenRouter API ключ

1. Зарегистрируйтесь на [openrouter.ai](https://openrouter.ai/)
2. Перейдите в [Keys](https://openrouter.ai/keys)
3. Создайте новый API ключ
4. Скопируйте его

### 3. Настройте окружение

```bash
cp .env.example .env.local
```

Откройте `.env.local` и заполните:

```
OPENROUTER_API_KEY=sk-or-v1-...     # ваш ключ от OpenRouter
CRON_SECRET=случная_строка_32+       # сгенерируйте: openssl rand -hex 32
NEXT_PUBLIC_CRON_SECRET=...           # тот же CRON_SECRET (для кнопки Refresh в UI)
```

### 4. Запустите

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

Первый запуск: на странице будет кнопка **«Сгенерировать сегодняшний выпуск»**. Нажмите её — система вызовет LLM, соберёт новости и покажет дайджест.

## Архитектура

```
src/
├── app/
│   ├── page.tsx              # Портал — главная страница
│   ├── teaser/page.tsx       # Email-teaser превью
│   ├── api/
│   │   ├── refresh/route.ts  # POST — запуск LLM пайплайна
│   │   ├── digest/route.ts   # GET — получение кэшированного дайджеста
│   │   └── ticket/route.ts   # POST — stub для создания тикетов в Академию
│   ├── layout.tsx            # Root layout (Inter, Cyrillic)
│   └── globals.css
├── components/
│   ├── Header.tsx            # Шапка с кнопкой Refresh
│   ├── Thermometer.tsx       # Шкала соответствия госповестке
│   ├── IndustryFilter.tsx    # Табы фильтрации по отрасли
│   ├── NewsCard.tsx          # Карточка новости
│   └── TeaserPage.tsx        # Email-стиль превью
├── lib/
│   ├── types.ts              # TypeScript типы (DigestItem, Digest)
│   ├── constants.ts          # Приоритеты госповестки, компании СК
│   ├── prompt.ts             # LLM prompt builder
│   ├── fetchNews.ts          # LLM fetch pipeline + валидация
│   └── storage.ts            # File I/O для digest JSON
```

## Как работает пайплайн новостей

1. **`POST /api/refresh`** — вызывается Vercel Cron (ежедневно в 02:00 UTC) или кнопкой Refresh в UI.
2. Отправляет запрос к `perplexity/sonar` через OpenRouter API с промптом, который инструктирует модель найти новости за 24–48 часов.
3. Парсит JSON-ответ, валидирует каждое поле.
4. **Жёсткое правило:** если `sourceUrl` не начинается с `http` — запись отбрасывается.
5. Сохраняет валидный дайджест в `/data/digest-YYYY-MM-DD.json`.
6. `GET /api/digest` возвращает кэшированный дайджест (сегодняшний или последний доступный).

## Деплой на Vercel

### 1. Подключите репозиторий

```bash
# Из корня проекта
git init
git add .
git commit -m "Initial commit: SBA AI Pulse"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Создайте проект на Vercel

1. Перейдите на [vercel.com/new](https://vercel.com/new)
2. Импортируйте репозиторий
3. Добавьте Environment Variables:
   - `OPENROUTER_API_KEY`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_CRON_SECRET`

### 3. Cron работает автоматически

`vercel.json` уже содержит конфигурацию cron:

```json
{
  "crons": [
    {
      "path": "/api/refresh",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Это вызывает `/api/refresh` ежедневно в 02:00 UTC (08:00 по Астане).

**Важно:** Vercel Cron — это функция Hobby/Pro планов. На бесплатном Hobby-плане доступно 1 cron-запуск в день.

### 4. Альтернативный вариант — внешний планировщик

Если Vercel Cron недоступен, настройте любой внешний scheduler (GitHub Actions, cron-job.org, и т.д.) для POST-запроса:

```
POST https://your-app.vercel.app/api/refresh
Authorization: Bearer ${CRON_SECRET}
```

## Функции

| Функция | Описание |
|---------|----------|
| **Портал** (`/`) | Главная страница с дайджестом, фильтром по отрасли, шкалой соответствия |
| **Thermometer** | Визуальная шкала `matched / 6` приоритетов госповестки |
| **Industry Filter** | Табы: Все / Нефтегаз / Транспорт / Энергетика / ГМК / Телеком / Кросс-отраслевое |
| **News Card** | Карточка новости: значимость, теги, заголовок, summary, action point, обучение, соответствие повестке, ссылка |
| **Teaser** (`/teaser`) | Email-стиль превью: топ-3 новости + шкала соответствия |
| **Refresh** | Кнопка в UI + cron endpoint `/api/refresh` |
| **Ticket stub** | `POST /api/ticket` — записывает запрос в `/data/tickets.json` |

## Приоритеты госповестки (6)

1. Цифровизация и искусственный интеллект
2. Год ИИ и цифровизации 2026
3. Цифровой кодекс
4. Smart Cargo / цифровая логистика
5. Цифровая платформа водных ресурсов на основе ИИ
6. ИИ в ГМК / промышленная безопасность

## Лицензия

Внутренний продукт. Все права защищены.
