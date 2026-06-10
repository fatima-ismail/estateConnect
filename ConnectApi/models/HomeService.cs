using System;

namespace ConnectApi.models
{
    public class HomeService
    {
        public const string VerificationInProgress = "InProgress";
        public const string VerificationVerified = "Verified";
        public const string VerificationNotAccepted = "NotAccepted";

        public int HomeServiceId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Location { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int YearsOfExperience { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Links { get; set; }
        public string VerificationStatus { get; set; } = VerificationInProgress;
        
        public int UserId { get; set; }
        public User? User { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
