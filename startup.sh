

echo "Waiting for Redis..."
while ! redis-cli -h redis -p 6379 -a redis_password_123 ping | grep -q "PONG"; do
  sleep 2
done

echo "Redis is ready!"

echo "Waiting for PostgreSQL..."
while ! pg_isready -h postgres -p 5432 -U rr_user -d reactive_resume; do
  sleep 2
done

echo "PostgreSQL is ready!"

echo "Starting application..."
npm start