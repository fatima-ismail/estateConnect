using System;
using System.Text.Json.Serialization;

namespace ConnectApi.models
{
    public class User
    {
        public const string RoleAdmin = "admin";
        public const string RoleSubAdmin = "subadmin";
        public const string RoleUser = "user";
        public const string RoleCompany = "company";

        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string Role { get; set; } = RoleUser;
        public string? ImageUrl { get; set; }

        public static string NormalizeRole(string? role)
        {
            return role?.Trim().ToLowerInvariant() switch
            {
                RoleAdmin => RoleAdmin,
                RoleSubAdmin => RoleSubAdmin,
                RoleCompany => RoleCompany,
                _ => RoleUser
            };
        }

        public static bool HasRole(User? user, string role)
        {
            return user != null &&
                string.Equals(user.Role, role, StringComparison.OrdinalIgnoreCase);
        }

        public static bool CanModerate(User? user)
        {
            return HasRole(user, RoleAdmin) || HasRole(user, RoleSubAdmin);
        }

        public static string NormalizeLebanesePhone(string phoneNumber)
        {
            var digits = new string(phoneNumber.Where(char.IsDigit).ToArray());

            if (digits.StartsWith("961", StringComparison.Ordinal))
            {
                digits = digits[3..];
            }

            return $"+961{digits}";
        }

        public static bool IsValidLebanesePhone(string? phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
            {
                return false;
            }

            var digits = new string(phoneNumber.Where(char.IsDigit).ToArray());

            if (digits.StartsWith("961", StringComparison.Ordinal))
            {
                digits = digits[3..];
            }

            return digits.Length == 8 && digits.All(char.IsDigit);
        }
    }
}
