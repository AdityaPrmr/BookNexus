using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;

namespace BookStore.Model
{
    public class Book
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)] 
        public string? _id { get; set; }

        [Required]
        public string? Title { get; set; }

        [Required]
        public string? Description { get; set; }

        [Required]
        public string? Author { get; set; }

        [Required]
        public string? Publisher { get; set; }

        [Required]
        public int? Year { get; set; }

        [Required]
        public string? path { get; set; }

        [Required]
        public string? imgPath { get; set; }
    }
}
