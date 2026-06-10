using System.Security.Cryptography;

namespace ConnectApi.services
{
    public class PasswordService
    {
        private const int Iterations = 120_000;
        private const int SaltSize = 16;
        private const int KeySize = 32;
        private const string Prefix = "pbkdf2";

        public string Hash(string password)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(password);

            var salt = RandomNumberGenerator.GetBytes(SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                Iterations,
                HashAlgorithmName.SHA256,
                KeySize);

            return $"{Prefix}${Iterations}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
        }

        public bool Verify(string password, string storedHash, out bool needsRehash)
        {
            needsRehash = false;

            if (!storedHash.StartsWith($"{Prefix}$", StringComparison.Ordinal))
            {
                needsRehash = string.Equals(password, storedHash, StringComparison.Ordinal);
                return needsRehash;
            }

            var parts = storedHash.Split('$');
            if (parts.Length != 4 || !int.TryParse(parts[1], out var iterations))
            {
                return false;
            }

            try
            {
                var salt = Convert.FromBase64String(parts[2]);
                var expectedHash = Convert.FromBase64String(parts[3]);
                var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                    password,
                    salt,
                    iterations,
                    HashAlgorithmName.SHA256,
                    expectedHash.Length);

                needsRehash = iterations < Iterations;
                return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
            }
            catch (FormatException)
            {
                return false;
            }
        }
    }
}
