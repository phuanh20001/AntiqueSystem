## Backend environment setup

This project uses environment variables loaded from `antique-backend/.env`.

### Quick start

1. Copy the template:
   - Copy `antique-backend/.env.example` to `antique-backend/.env`
2. Fill in values:
   - `MONGO_URI`: MongoDB Atlas connection string
   - `JWT_SECRET`: long random string
   - `ALCHEMY_SEPOLIA_URL`: RPC URL
   - `DEPLOYER_PRIVATE_KEY`: **do not commit**; keep it private
3. Run the backend:
   - `cd antique-backend`
   - `npm install`
   - `npm start`

### Security note (important)

Never commit a real `.env` file or any private keys to Git (especially in a public repository).
If you need to share team secrets, use a password manager (1Password/Bitwarden), a secure shared vault,
or GitHub Actions secrets for CI/CD.
