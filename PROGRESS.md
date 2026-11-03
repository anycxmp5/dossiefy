# PROGRESS — Dossiefy

Рабочий журнал. Обновляется после каждого этапа, чтобы можно было продолжить с любого места.

Дата начала финальной сборки: 2026-11-03. Цикл подачи, актуальный на эту дату: 2026–27 (поступление осенью 2027), но в данных указывается то, что написано на официальной странице вуза.

## Сделано до финальной сборки
- Главная (hero, обзор процесса, анонсы), дизайн-система bootcamp, английский интерфейс + русские пояснения, i18n en/ru, генератор `tools/build.mjs`, Lighthouse mobile главной: Performance 97 / A11y 100 / SEO 100 / BP 100.
- noindex включён (`data/settings.json: indexable=false`), оставить до команды владельца.

## Этап 2. Данные (выполнено частично)
- Prompts Common App 2026–27: `data/essay_prompts.json` (источник commonapp.org/apply/essay-prompts, проверено 2026-11-03; текст prompts достаётся только через рендер в Chrome — WebFetch страницу не видит).
- 12 вузов собраны в `data/universities/<id>.json`: harvard, yale, princeton, brown, duke, northwestern, jhu, rice, amherst, williams, stanford, vanderbilt. Членство в Common App подтверждено через page-data (commonapp.org/page-data/explore/<slug>/page-data.json), результат в `data/membership.json` (`node tools/fetch-membership.mjs`).
- Не вошли: Columbia (сайт отдаёт 403 автоматическому доступу), NYU и Cornell (редирект/таймаут), UChicago, Notre Dame, Georgia Tech, Michigan, Penn, MIT, Caltech, UC Berkeley (slug не найден на Common App — не члены или другой адрес; не включены).
- needs_verification: Harvard.aid_forms; Yale.aid_forms; Princeton.aid_forms; Brown.english, aid_forms; Duke.aid_forms; Rice.tests, aid, aid_forms; Williams.aid_forms; Stanford.english, aid_forms; Vanderbilt.deadlines, essays, aid, aid_forms.
- Рабочие инструменты (вне проекта, в scratchpad): rendertext/grab/hidden.mjs на puppeteer-core. Не использовать флаги, отключающие проверку сертификатов (заблокировано).
- Осталось: фото (Wikimedia Commons) + images.json, генерация страниц каталога.

## Этап 0 и 3. Инфраструктура и каталог — ГОТОВО
- Генератор: `tools/build.mjs` + `tools/lib.mjs` (словари, render, inline CSS) + `tools/data.mjs` (вузы) + `tools/pages/*.mjs` (home, catalog; остальные добавляются в список `pageModules` в build.mjs: course, demo, essays, review, static).
- Слова: `data/i18n/en.json` / `ru.json`, добавление пачкой: `node tools/i18n-add.mjs <batch.json>` ({"ключ":["en","ru"]}).
- Фото: 12 шт. с Wikimedia Commons (все CC0/CC BY/CC BY-SA), `img/campus/*.webp`, метаданные `data/images.json`; подпись-атрибуция собирается в data.mjs из original_title+author+license. Важно: PowerShell Set-Content портит кодировку JSON (BOM/кракозябры) — править JSON только через node/Edit.
- Каталог: `catalog/` (карточки + фильтры js/pages/catalog.js), `catalog/<id>/` ×12. Главная: живое превью (Harvard, Duke, Northwestern), CTA ведут на реальные страницы.
## Курс и демо — ГОТОВО
- Курс: `data/course.json` (6 модулей × 3 урока, термины, чек-листы, ошибки), `tools/pages/course.mjs`, `js/pages/course.js` (прогресс в localStorage), страницы course/, course/<модуль>/, course/<модуль>/<урок>/.
- Демо: `data/demo_steps.json` (8 шагов), `tools/pages/demo.mjs`, `js/pages/demo.js`, `css/pages/demo.css`; автотест (scratchpad demo-test.mjs): все 7 шагов проходят, финальный штамп, очистка работает, JS-ошибок нет.
- Ключи i18n курса/демо добавлены (всего ~207).
## Эссе — ГОТОВО
- `data/essay_prompts.json` (prompts 2026–27 + источник), `data/essay_lessons.json` (4 урока), `data/essay_examples.json` (9 публичных эссе: 5 Johns Hopkins, 4 Connecticut College, мои разборы), `data/cliches.json` (39 шаблонов).
- Проверщик: `js/essay-check/analyzer.js` + `messages.js`, UI `js/pages/checker.js`, страница essays/checker/. Юнит-тесты: `node --test tests/` — 13/13 проходят. Автотест страницы: клише подсвечиваются, сторонних запросов нет.
- Страницы: essays/, essays/<урок>/ ×4, essays/examples/, essays/checker/.
- Ссылки на примеры ещё не прогнаны check-links (сделать в QA).
## ИТОГ (2026-11-03): проект завершён
- 52 страницы; check-data без ошибок; check-links: внутренних 1070, ошибок 0; внешних 103, открылись 100 (3 страницы Williams отвечают ботам 403).
- Вторая проверка 20%: 17 значений, расхождений 0, один nv-пункт дополнен.
- Lighthouse (итоговая сборка без noindex): все страницы 96–100 по Performance, 100 по A11y/BP/SEO; мобильные LCP главной 1,96 с, вуза 3,0 с (оценка 95).
- axe-core: 0 нарушений на всех 52 страницах и в динамических состояниях (демо, проверка эссе, фильтр каталога) на 1280 и 390 px; без JS и при reduced-motion весь контент виден; русского вне lang="ru" нет; автора и почты нет; noindex стоит на всех страницах.
- Юнит-тесты: 13/13.
- Скриншоты и инструменты аудита лежат в scratchpad (вне проекта).

## Платная проверка и служебные страницы — ГОТОВО
- review/ (disclosure_text в основном потоке, цена/срок = «Details in the Telegram bot», ссылка на бота из settings.json — пока заглушка `PLACEHOLDER_BOT`), privacy/, credits/ (из images.json), about/, 404.html (ссылки абсолютные от корня), `tools/check-data.mjs`, `tools/check-links.mjs [--external]`.
- check-data: ошибок 0 (84 значения, 16 needs_verification → после перепроверки у Duke.aid_forms значение дополнено, статус остался nv). check-links: внутренних 1018, ошибок 0; внешних 103, открылись 100, три страницы Williams отвечают ботам 403 (в Chrome открываются).
- Вторая проверка 20% (17 значений): расхождений 0, один nv-пункт дополнен (Duke.aid_forms). Журнал: `data/verification_log.json`.
- Осталось: Lighthouse (mobile+desktop по 5 страницам), a11y/контраст/клавиатура/no-JS на всех страницах, проверка отсутствия русского вне lang=ru и имени владельца, скриншоты, README, финальный отчёт, пересборка с noindex.
- Осталось по всему проекту (старый список): course, demo, essays(+checker, examples, tests), review, privacy/credits/about/404, check-data, check-links, 2-я проверка 20%, Lighthouse, a11y, скриншоты, README, финальный отчёт.

## План этапов
1. Инфраструктура сборки + навигация
2. Данные: Common App prompts, вузы
3. Каталог
4. Курс
5. Демо-подача
6. Эссе (+ проверка, тесты)
7. Платная проверка, Privacy, Credits, About, 404, главная
8. QA и отчёт

## Что должен сделать владелец (копится по ходу)
- Купить домен dossiefy.com, включить индексацию (`indexable: true`).
- Указать ссылку на Telegram-бота, цену и срок (`data/settings.json`).
- Подтвердить тексты приватности и дисклеймера.
