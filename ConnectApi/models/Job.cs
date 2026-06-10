using System;

namespace ConnectApi.models
{
    public class Job
    {
        public const string VerificationInProgress = "InProgress";
        public const string VerificationVerified = "Verified";
        public const string VerificationNotAccepted = "NotAccepted";

        public int JobId { get; set; }
        
        public int UserId { get; set; }
        public User? User { get; set; }
        
        public string JobTitle { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string CompanyName { get; set; } = string.Empty;
        public string WorkType { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string JobType { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
        public string Status { get; set; } = "Open";
        public string ContactPhone { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        
        public string VerificationStatus { get; set; } = VerificationInProgress;

        public decimal SalaryFrom { get; set; }
        public decimal SalaryTo { get; set; }
        public int ExperienceYears { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
