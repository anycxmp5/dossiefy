# Dossiefy

Независимый образовательный проект для русскоязычных школьников и родителей: курс по поступлению в университеты США, демо-подача в стиле Common App, каталог вузов с проверенными требованиями, раздел про эссе с проверкой текста в браузере и страница платной проверки эссе (оплата и приём эссе в Telegram-боте).

> Независимый образовательный проект. Не связан с Common App и университетами. Проверяйте требования на официальных сайтах.

Интерфейс сайта английский (как в настоящей заявке), объяснения, разборы, дисклеймеры и подсказки русские. Сайт статический: HTML, CSS и JavaScript (ES-модули), без серверной части. Работает на GitHub Pages.

## Запуск

Node.js нужен только для разработки (сборка страниц, локальный сервер, проверки). Для самого сайта он не нужен.

```bash
node tools/build.mjs          # собрать все страницы из data/ и templates/
node tools/serve.mjs 4173     # локальный сервер: http://localhost:4173
node --test tests/            # юнит-тесты анализатора эссе
node tools/check-data.mjs     # валидатор данных
node tools/check-links.mjs    # внутренние ссылки; с флагом --external проверяет и внешние
```

Собранные `.html` лежат в репозитории (так сайт отдаётся без сборки на GitHub Pages). После любой правки в `data/`, `templates/` или `tools/pages/` запустите `node tools/build.mjs`.

## Структура

```
index.html, catalog/, course/, demo/, essays/, review/, privacy/, credits/, about/, 404.html   собранные страницы
templates/layout.html        общая оболочка (шапка, подвал, мета-теги)
tools/                       build.mjs (генератор), pages/*.mjs (страницы), lib.mjs, data.mjs, проверки
css/ js/ fonts/ vendor/      стили, скрипты, шрифты и GSAP/Lenis (локально, без CDN)
data/                        все данные и тексты
tests/                       тесты анализатора эссе
```

Данные (`data/`):

| Файл | Что внутри |
|---|---|
| `universities/<id>.json` | требования вуза: значение, `source_url`, `verified_on`, `cycle`, `status` |
| `membership.json` | подтверждение участия вуза в Common App (`node tools/fetch-membership.mjs`) |
| `images.json` | фото кампусов: автор, источник, лицензия (из них строится страница Credits) |
| `course.json`, `process.json` | модули и уроки курса, шаги обзора процесса |
| `demo_steps.json` | 8 шагов демо-подачи, поля, подсказки, тестовые значения |
| `essay_prompts.json`, `essay_lessons.json`, `essay_examples.json`, `cliches.json` | раздел эссе |
| `i18n/en.json`, `i18n/ru.json` | словари интерфейса с общими ключами (переключатель RU/EN пока не показан) |
| `promos.json` | реклама учебных сайтов SAT Boot Camp и IELTS Boot Camp (главная, модуль Exams, уроки про тесты, подвал) |
| `settings.json` | бренд, `indexable`, ссылка на Telegram-бота, цена и срок, `disclosure_text` |
| `verification_log.json` | журнал второй проверки данных |

## Как добавить университет

1. Убедитесь, что вуз подаёт first-year заявки через Common App: откройте `https://www.commonapp.org/explore/<slug>/`.
2. Создайте `data/universities/<id>.json` по образцу любого существующего файла. Поля: `id`, `name`, `common_app_slug`, `official_admissions_url`, `fields` с ключами `deadlines`, `tests`, `english`, `essays`, `international`, `aid`, `aid_forms`.
3. Для каждого значения укажите `value` (английская строка; для `deadlines` массив `{round, date}`), `cycle` (цикл подачи или `"not stated"`, если страница его не называет), `note_ru`, `source_url` (только официальная страница вуза), `verified_on` и `status` (`verified` или `needs_verification`).
4. `node tools/fetch-membership.mjs` подтянет участие в Common App и город.
5. Фото: найдите свободный снимок на Wikimedia Commons (`node tools/find-images.mjs "<запрос>"` показывает только CC0, CC BY, CC BY-SA, Public domain), затем `node tools/fetch-images.mjs <id>="File:Название.jpg"`. Сожмите файл в WebP двух размеров (`img/campus/<id>.webp` и `<id>-sm.webp`) и убедитесь, что в `data/images.json` есть `file`, `file_small`, `author`, `license`, `source_url`. Без фото страница вуза покажет типографическую карточку.
6. `node tools/check-data.mjs` и `node tools/build.mjs`.

## Как обновлять требования

Требования меняются каждый год. Раз в цикл (и перед запуском): открыть `source_url` каждого значения, сверить, обновить `value`, `note_ru`, `cycle`, `verified_on`. Не угадывайте: если страница не отвечает или данных нет, ставьте `needs_verification` и объясняйте в `note_ru`, чего не хватает. После правок: `node tools/check-data.mjs`, `node tools/sample-values.mjs` (случайные 20% значений для второй проверки), `node tools/build.mjs`.

## Как выложить на GitHub Pages

1. Создайте репозиторий и загрузите содержимое папки `admit-demo/` в корень (файл `.nojekyll` уже есть).
2. Settings → Pages → Source: ветка `main`, папка `/ (root)`.
3. Домен: добавьте в корень файл `CNAME` со строкой `dossiefy.com` и настройте DNS у регистратора. Страница `404.html` использует ссылки от корня сайта, поэтому сайт должен жить на корне домена, а не в подпапке репозитория.
4. Индексация выключена (`"indexable": false` в `data/settings.json`, на каждой странице `noindex`). Когда будете готовы открыть сайт, поставьте `true`, выполните `node tools/build.mjs` (появятся `robots.txt` и `sitemap.xml`) и закоммитьте.
5. В `data/settings.json` укажите `telegram_url`, `review_service.price` и `review_service.turnaround` (пока на странице проверки написано «Details in the Telegram bot») и пересоберите страницы.

## Данные, требующие ручной проверки

<!-- NV:START -->
Значений со статусом `needs_verification`: **16**.

- **Brown University**, English proficiency (`brown.english`): Not stated on the pages checked Источник: https://admission.brown.edu/international
- **Brown University**, Aid forms (`brown.aid_forms`): Forms and deadlines for international aid are not stated on the pages checked Источник: https://admission.brown.edu/international
- **Duke University**, Aid forms (`duke.aid_forms`): The aid office lists the CSS Profile and FAFSA with deadlines of November 3 (Early Decision) and February 1 (Regular Decision); which of them applies to international families is not stated Источник: https://financialaid.duke.edu/undergraduate-applicants/apply-aid
- **Harvard University**, Aid forms (`harvard.aid_forms`): Forms and aid deadline are not stated on the pages checked Источник: https://college.harvard.edu/financial-aid
- **Princeton University**, Aid forms (`princeton.aid_forms`): Forms and aid deadlines are not stated on the pages checked Источник: https://admission.princeton.edu/cost-aid
- **Rice University**, Tests (`rice.tests`): The testing policy could not be read from the page automatically Источник: https://admission.rice.edu/apply/first-year-international-applicants
- **Rice University**, Aid for internationals (`rice.aid`): Financial statement, aid and scholarships for international applicants are described in a section that could not be read automatically Источник: https://admission.rice.edu/apply/first-year-international-applicants
- **Rice University**, Aid forms (`rice.aid_forms`): International Student Financial Statement is listed among the required materials; other forms are not stated Источник: https://admission.rice.edu/apply/first-year-international-applicants
- **Stanford University**, English proficiency (`stanford.english`): Not stated on the pages checked Источник: https://admission.stanford.edu/apply/international/index.html
- **Stanford University**, Aid forms (`stanford.aid_forms`): Forms are not stated on the pages checked Источник: https://admission.stanford.edu/apply/international/index.html
- **Vanderbilt University**, Deadlines (`vanderbilt.deadlines`): Источник: https://admissions.vanderbilt.edu/apply/
- **Vanderbilt University**, Essays (`vanderbilt.essays`): Not stated on the pages checked Источник: https://admissions.vanderbilt.edu/apply/
- **Vanderbilt University**, Aid for internationals (`vanderbilt.aid`): Policy for international applicants is not stated on the pages checked Источник: https://admissions.vanderbilt.edu/apply/
- **Vanderbilt University**, Aid forms (`vanderbilt.aid_forms`): CSS Profile and FAFSA are listed with priority filing deadlines; which apply to international families is not stated Источник: https://admissions.vanderbilt.edu/apply/
- **Williams College**, Aid forms (`williams.aid_forms`): Aid forms are requested after admission; the set of forms was not stated on the page Источник: https://www.williams.edu/admission-aid/how-to-apply/additional-applicant-information/international/
- **Yale University**, Aid forms (`yale.aid_forms`): CSS Profile is listed on the affordability page; which forms apply to international families is not confirmed Источник: https://admissions.yale.edu/affordability
<!-- NV:END -->

Помимо этого, перед публикацией проверьте вручную: тексты приватности и дисклеймера (`data/i18n/ru.json`: ключи `pv.*`, `rv.privacy.*`, `ab.*`), реальные правила хранения и удаления эссе в Telegram-боте и актуальность всех дат на официальных сайтах.

## Лицензии и атрибуция

Фото кампусов с Wikimedia Commons под свободными лицензиями: авторы, источники и лицензии на странице `/credits/` (генерируется из `data/images.json`). Логотипов вузов и Common App на сайте нет. Шрифты (Alfa Slab One, Barlow Condensed, Source Sans 3, Bitter, Roboto Condensed) под SIL OFL 1.1, GSAP и Lenis лежат в `vendor/`, версии и лицензии в `vendor/VERSIONS.md`.

Alfa Slab One и Barlow Condensed не содержат кириллицу, поэтому для русского текста браузер сам берёт ближайшие по характеру Bitter Black и Roboto Condensed Bold (одно семейство, выбор по `unicode-range` в `css/tokens.css`).
