# Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/fashify

# Nano Banano API Configuration (for outfit suggestions)
NANO_BANANO_API_URL=https://api.nanobanano.com
```

## MongoDB Setup

### Local MongoDB
If you're running MongoDB locally, make sure it's running on the default port (27017).

### MongoDB Atlas (Cloud)
If you're using MongoDB Atlas, use your connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fashify
```
