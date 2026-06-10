using System.Security.Claims;
using ConnectApi.data;
using ConnectApi.models;
using ConnectApi.services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserModel = ConnectApi.models.User;

namespace ConnectApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        public record LoginRequest(string Email, string Password);
        public record RegisterRequest(
            string FullName,
            string Email,
            string Password,
            string? PhoneNumber,
            string? Role,
            string? ImageUrl);
        public record AuthResponse(string Token, User User);

        private readonly AppDbContext _context;
        private readonly PasswordService _passwordService;
        private readonly JwtTokenService _jwtTokenService;

        public AuthController(
            AppDbContext context,
            PasswordService passwordService,
            JwtTokenService jwtTokenService)
        {
            _context = context;
            _passwordService = passwordService;
            _jwtTokenService = jwtTokenService;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return Unauthorized("Invalid email or password.");
            }

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(
                user => user.Email.ToLower() == normalizedEmail);

            if (user == null ||
                !_passwordService.Verify(request.Password, user.PasswordHash, out var needsRehash))
            {
                return Unauthorized("Invalid email or password.");
            }

            if (needsRehash)
            {
                user.PasswordHash = _passwordService.Hash(request.Password);
                await _context.SaveChangesAsync();
            }

            return Ok(new AuthResponse(_jwtTokenService.Create(user), user));
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password) ||
                request.Password.Length < 8 ||
                !UserModel.IsValidLebanesePhone(request.PhoneNumber))
            {
                return BadRequest("Full name, email, phone number, and a password of at least 8 characters are required. Phone number must be +961 followed by 8 digits.");
            }

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var normalizedPhone = UserModel.NormalizeLebanesePhone(request.PhoneNumber!);
            if (await _context.Users.AnyAsync(user => user.Email.ToLower() == normalizedEmail))
            {
                return Conflict("Email already exists.");
            }

            if (await _context.Users.AnyAsync(u => u.PhoneNumber == normalizedPhone))
            {
                return Conflict("Phone number already exists.");
            }

            var role = UserModel.NormalizeRole(request.Role);
            if (role == UserModel.RoleAdmin || role == UserModel.RoleSubAdmin)
            {
                role = UserModel.RoleUser;
            }

            var user = new User
            {
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim(),
                PasswordHash = _passwordService.Hash(request.Password),
                PhoneNumber = normalizedPhone,
                Role = role,
                ImageUrl = request.ImageUrl
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new AuthResponse(_jwtTokenService.Create(user), user));
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult<User>> Me()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users.FindAsync(userId);

            return user == null ? NotFound() : Ok(user);
        }
    }
}
