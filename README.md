Educational Center Management System (EduCenter)

Система управління навчальним центром.

1. Змінні оточення (Environment Variables)
Створіть файл .env у кореневій папці проєкту та додайте наступні значення:

DJANGO_SECRET_KEY=super-secret-dev-key-for-local-testing
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

POSTGRES_DB=edu_db
POSTGRES_USER=edu_user
POSTGRES_PASSWORD=edu_password

DB_HOST=db
DB_PORT=5432
DB_NAME=edu_db
DB_USER=edu_user
DB_PASSWORD=edu_password

2. Для запуску бази даних (PostgreSQL) та бекенду (Django) виконайте одну команду:
docker compose up --build

3. Створення адміністратора (Create superuser):
docker compose exec web python manage.py createsuperuser

4. Запуск тестів:
Запуск базових тестів: docker compose exec web python manage.py test 
Запуск тестів зі збором покриття: docker compose exec web coverage run manage.py test 
Перегляд звіту про покриття в терміналі: docker compose exec web coverage report 
