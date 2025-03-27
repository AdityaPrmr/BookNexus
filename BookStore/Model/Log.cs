using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace BookStore.Model
{
    public class Log
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? _id { get; set; }

        [Required]
        public string? Name { get; set; }

        [Required]
        public string? Role { get; set; }

        [Required]
        public DateTime DToc { get; set; }
    }
}
