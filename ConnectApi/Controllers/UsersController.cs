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
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        public record UpdateProfileRequest(
            string FullName,
            string Email,
            string? PhoneNumber,
            string? ImageUrl);
        public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
        public record CreateSubAdminRequest(
            string FullName,
            string Email,
            string Password,
            string? PhoneNumber,
            string? ImageUrl);
        public record AdminContactResponse(string FullName, string Email, string? PhoneNumber);

        private readonly AppDbContext _context;
        private readonly PasswordService _passwordService;

        public UsersController(AppDbContext context, PasswordService passwordService)
        {
            _context = context;
            _passwordService = passwordService;
        }

        [Authorize(Roles = $"{UserModel.RoleAdmin},{UserModel.RoleSubAdmin}")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        [AllowAnonymous]
        [HttpGet("admin-contact")]
        public async Task<ActionResult<AdminContactResponse>> GetAdminContact()
        {
            var admin = await _context.Users
                .Where(user => user.Role == UserModel.RoleAdmin)
                .OrderByDescending(user => !string.IsNullOrWhiteSpace(user.PhoneNumber))
                .ThenBy(user => user.UserId)
                .FirstOrDefaultAsync();

            if (admin == null)
            {
                return NotFound("No admin contact is configured.");
            }

            return Ok(new AdminContactResponse(
                admin.FullName,
                admin.Email,
                admin.PhoneNumber));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            if (!CanAccessUser(id))
            {
                return Forbid();
            }

            var user = await _context.Users.FindAsync(id);
            return user == null ? NotFound() : Ok(user);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutUser(int id, UpdateProfileRequest request)
        {
            if (!CanAccessUser(id))
            {
                return Forbid();
            }
            if (string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                !UserModel.IsValidLebanesePhone(request.PhoneNumber))
            {
                return BadRequest("Full name, email, and phone number are required. Phone number must be +961 followed by 8 digits.");
            }

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            var normalizedPhone = UserModel.NormalizeLebanesePhone(request.PhoneNumber!);
            if (await _context.Users.AnyAsync(user =>
                user.UserId != id && user.Email.ToLower() == normalizedEmail))
            {
                return Conflict("Email already exists.");
            }

            if (await _context.Users.AnyAsync(user =>
                user.UserId != id && user.PhoneNumber == normalizedPhone))
            {
                return Conflict("Phone number already exists.");
            }

            var existingUser = await _context.Users.FindAsync(id);
            if (existingUser == null)
            {
                return NotFound();
            }

            existingUser.FullName = request.FullName.Trim();
            existingUser.Email = request.Email.Trim();
            existingUser.PhoneNumber = normalizedPhone;
            existingUser.ImageUrl = request.ImageUrl?.Trim();
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("{id}/password")]
        public async Task<IActionResult> ChangePassword(int id, ChangePasswordRequest request)
        {
            if (CurrentUserId != id)
            {
                return Forbid();
            }
            if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest("Current password and new password are required.");
            }
            if (request.NewPassword.Length < 8)
            {
                return BadRequest("Password must be at least 8 characters.");
            }

            var existingUser = await _context.Users.FindAsync(id);
            if (existingUser == null)
            {
                return NotFound();
            }

            if (!_passwordService.Verify(request.CurrentPassword, existingUser.PasswordHash, out _))
            {
                return BadRequest("Current password is incorrect.");
            }

            existingUser.PasswordHash = _passwordService.Hash(request.NewPassword);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize(Roles = UserModel.RoleAdmin)]
        [HttpPost("subadmins")]
        public async Task<ActionResult<User>> PostSubAdmin(CreateSubAdminRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password) ||
                request.Password.Length < 8 ||
                !UserModel.IsValidLebanesePhone(request.PhoneNumber))
            {
                return BadRequest("Full name, email, password (min 8 chars), and a valid Lebanese phone number (+961 followed by 8 digits) are required.");
            }

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();
            if (await _context.Users.AnyAsync(user => user.Email.ToLower() == normalizedEmail))
            {
                return Conflict("Email already exists.");
            }

            var normalizedPhone = UserModel.NormalizeLebanesePhone(request.PhoneNumber!);
            if (await _context.Users.AnyAsync(u => u.PhoneNumber == normalizedPhone))
            {
                return Conflict("Phone number already exists.");
            }

            var subAdmin = new User
            {
                FullName = request.FullName.Trim(),
                Email = request.Email.Trim(),
                PasswordHash = _passwordService.Hash(request.Password),
                PhoneNumber = normalizedPhone,
                ImageUrl = request.ImageUrl?.Trim(),
                Role = UserModel.RoleSubAdmin
            };

            _context.Users.Add(subAdmin);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = subAdmin.UserId }, subAdmin);
        }

        [Authorize(Roles = UserModel.RoleAdmin)]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            if (CurrentUserId == id)
            {
                return BadRequest("You cannot delete your own account.");
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            if (user.Role == UserModel.RoleAdmin)
            {
                return BadRequest("Admin accounts cannot be deleted from this dashboard.");
            }

            _context.Properties.RemoveRange(_context.Properties.Where(property => property.UserId == id));
            _context.HomeServices.RemoveRange(_context.HomeServices.Where(service => service.UserId == id));
            _context.Jobs.RemoveRange(_context.Jobs.Where(job => job.UserId == id));
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private int CurrentUserId =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private bool CanAccessUser(int userId)
        {
            return CurrentUserId == userId ||
                User.IsInRole(UserModel.RoleAdmin) ||
                User.IsInRole(UserModel.RoleSubAdmin);
        }
    }
}
