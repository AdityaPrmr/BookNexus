using BookStore.Model;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;

namespace BookStore.Connection
{
    public class _dbContext
    {
        private readonly IMongoDatabase _database;

        public _dbContext(IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("MongoDB");
            var client = new MongoClient(connectionString);

            // Assign to the class-level field (fixing the scoping issue)
            _database = client.GetDatabase(new MongoUrl(connectionString).DatabaseName);

            // Connection check
            try
            {
                _database.RunCommandAsync((Command<dynamic>)"{ping:1}").Wait();
                Console.WriteLine("Connected to MongoDB successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MongoDB connection failed: {ex.Message}");
            }
        }

        public IMongoCollection<T> GetCollection<T>(string name)
        {
            return _database.GetCollection<T>(name);
        }
        public async Task AddDocumentAsync<T>(T document, string collectionName)
        {
            var collection = _database.GetCollection<T>(collectionName);
            await collection.InsertOneAsync(document);
        }

        public async Task<User>? ValidateUserAsync(string email, string password)
        {

            var usersCollection = _database.GetCollection<User>("User");

            var filter = Builders<User>.Filter.And(
                Builders<User>.Filter.Eq(u => u.Email, email.Trim()),
                Builders<User>.Filter.Eq(u => u.Password, password.Trim())
            );

            var user = await usersCollection.Find(filter).FirstOrDefaultAsync();
            if (user != null)
            {
                return user;
            }
            else
            {
                return null;
            }

        }

    }
}
