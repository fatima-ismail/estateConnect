using System;

namespace ConnectApi.models
{
    public class Property
    {
        public const string VerificationInProgress = "InProgress";
        public const string VerificationVerified = "Verified";
        public const string VerificationNotAccepted = "NotAccepted";

        public int PropertyId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Location { get; set; } = string.Empty;
        public string PropertyType { get; set; } = string.Empty; 
        public string Status { get; set; } = string.Empty; 
        public int Bedrooms { get; set; }
        public int Bathrooms { get; set; }
        public double Area { get; set; }
        public string? ImageUrl { get; set; }
        
        public string? OwnerName { get; set; }
        public string? OwnerPhone { get; set; }
        public string? OwnerEmail { get; set; }
        
        public string VerificationStatus { get; set; } = VerificationInProgress;

        public int UserId { get; set; }
        public User? User { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
