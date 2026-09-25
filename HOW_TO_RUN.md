# How to run
Run all commands from the repository root.

1. Start the API and database ```docker compose up -d --build```
2. Seed an auction ```docker compose exec public-api npm run db:seed```
3. Run the automated tests ```docker compose exec public-api npm test```


## Test the API
```
curl --request POST http://localhost:9090/bid \
  --header "Content-Type: application/json" \
  --data '{
    "auction_id": "11111111-1111-1111-1111-111111111111",
    "user_id": "22222222-2222-2222-2222-222222222222",
    "amount": 100
  }'
```