using System.Security.Cryptography;

namespace Hcu008.Api.Helpers;

public static class PasswordHelper
{
  public static string SessionStamp(string hash, string signingKey) =>
      Convert.ToHexString(HMACSHA256.HashData(System.Text.Encoding.UTF8.GetBytes(signingKey), System.Text.Encoding.UTF8.GetBytes(hash)));

  private const int SaltSize = 16;
  private const int KeySize = 32;
  private const int Iterations = 100000;

  public static string HashPassword(string password)
  {
    if (string.IsNullOrWhiteSpace(password))
    {
      throw new ArgumentException("La contraseña no puede estar vacía.", nameof(password));
    }

    var salt = RandomNumberGenerator.GetBytes(SaltSize);

    var key = Rfc2898DeriveBytes.Pbkdf2(
        password: password,
        salt: salt,
        iterations: Iterations,
        hashAlgorithm: HashAlgorithmName.SHA256,
        outputLength: KeySize
    );

    return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(key)}";
  }

  public static bool VerifyPassword(string password, string hash)
  {
    if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(hash))
    {
      return false;
    }

    var parts = hash.Split('.', 3);

    if (parts.Length != 3)
    {
      return false;
    }

    if (!int.TryParse(parts[0], out var iterations) || iterations <= 0 || iterations > 1000000)
    {
      return false;
    }

    byte[] salt;
    byte[] keyGuardada;

    try
    {
      salt = Convert.FromBase64String(parts[1]);
      keyGuardada = Convert.FromBase64String(parts[2]);
    }
    catch
    {
      return false;
    }

    if (salt.Length != SaltSize || keyGuardada.Length != KeySize)
    {
      return false;
    }

    var keyIngresada = Rfc2898DeriveBytes.Pbkdf2(
        password: password,
        salt: salt,
        iterations: iterations,
        hashAlgorithm: HashAlgorithmName.SHA256,
        outputLength: keyGuardada.Length
    );

    return CryptographicOperations.FixedTimeEquals(keyIngresada, keyGuardada);
  }
}
