using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConnectApi.data;
using ConnectApi.models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ConnectApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PropertiesController : ControllerBase
    {
        public class PropertyUpdateVerificationStatusRequest
        {
            public string VerificationStatus { get; set; } = Property.VerificationInProgress;
            public int AdminId { get; set; }
        }

        private readonly AppDbContext _context;

        public PropertiesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Property>>> GetProperties(
            [FromQuery] string? type = null,
            [FromQuery] string? status = null,
            [FromQuery] int? userId = null,
            [FromQuery] bool includeUnverified = false,
            [FromQuery] string? verificationStatus = null)
        {
            IQueryable<Property> query = _context.Properties
                .Include(p => p.User);

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(p => p.PropertyType == type);
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(p => p.Status == status);
            }

            if (userId.HasValue)
            {
                query = query.Where(p => p.UserId == userId.Value);
            }

            var isViewingOwnProperties = CurrentUserId.HasValue &&
                userId == CurrentUserId;

            if (!CanModerate && !isViewingOwnProperties)
            {
                if (CurrentUserId.HasValue && !userId.HasValue)
                {
                    var currentUserId = CurrentUserId.Value;
                    query = query.Where(p =>
                        p.VerificationStatus == Property.VerificationVerified ||
                        p.UserId == currentUserId);
                }
                else
                {
                    query = query.Where(p => p.VerificationStatus == Property.VerificationVerified);
                }
            }
            else if (!string.IsNullOrWhiteSpace(verificationStatus))
            {
                query = query.Where(p => p.VerificationStatus == verificationStatus);
            }
            else if (!includeUnverified && !userId.HasValue)
            {
                query = query.Where(p => p.VerificationStatus == Property.VerificationVerified);
            }

            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Property>> GetProperty(int id)
        {
            var property = await _context.Properties
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.PropertyId == id);

            if (property == null)
            {
                return NotFound();
            }
            if (property.VerificationStatus != Property.VerificationVerified &&
                property.UserId != CurrentUserId &&
                !CanModerate)
            {
                return NotFound();
            }

            return property;
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProperty(int id, Property property)
        {
            if (id != property.PropertyId)
            {
                return BadRequest("Property ID mismatch");
            }

            var user = await _context.Users.FindAsync(CurrentUserId);
            if (user == null)
            {
                return BadRequest("Invalid User ID");
            }
            if (ConnectApi.models.User.HasRole(user, ConnectApi.models.User.RoleCompany))
            {
                return BadRequest("Companies cannot modify properties.");
            }

            var existingProperty = await _context.Properties.FindAsync(id);
            if (existingProperty == null)
            {
                return NotFound();
            }
            if (existingProperty.UserId != CurrentUserId && !CanModerate)
            {
                return Forbid();
            }

            existingProperty.Title = property.Title;
            existingProperty.Description = property.Description;
            existingProperty.Price = property.Price;
            existingProperty.Location = property.Location;
            existingProperty.PropertyType = property.PropertyType;
            existingProperty.Status = property.Status;
            existingProperty.Bedrooms = property.Bedrooms;
            existingProperty.Bathrooms = property.Bathrooms;
            existingProperty.Area = property.Area;
            existingProperty.ImageUrl = property.ImageUrl;
            existingProperty.OwnerName = property.OwnerName;
            existingProperty.OwnerPhone = property.OwnerPhone;
            existingProperty.OwnerEmail = property.OwnerEmail;
            
            if (!CanModerate)
            {
                existingProperty.VerificationStatus = Property.VerificationInProgress;
            }
            
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PropertyExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [Authorize]
        [HttpPost]
        public async Task<ActionResult<Property>> PostProperty(Property property)
        {
            var user = await _context.Users.FindAsync(CurrentUserId);
            if (user == null)
            {
                return BadRequest("Invalid User ID");
            }
            if (ConnectApi.models.User.HasRole(user, ConnectApi.models.User.RoleCompany))
            {
                return BadRequest("Companies cannot add properties.");
            }

            property.VerificationStatus = ConnectApi.models.User.CanModerate(user) 
                ? Property.VerificationVerified 
                : Property.VerificationInProgress;
            property.UserId = CurrentUserId!.Value;
            _context.Properties.Add(property);
            await _context.SaveChangesAsync();

            await _context.Entry(property).Reference(p => p.User).LoadAsync();

            return CreatedAtAction(nameof(GetProperty), new { id = property.PropertyId }, property);
        }

        [Authorize(Roles = $"{ConnectApi.models.User.RoleAdmin},{ConnectApi.models.User.RoleSubAdmin}")]
        [HttpPut("{id}/verification")]
        public async Task<ActionResult<Property>> UpdateVerificationStatus(int id, PropertyUpdateVerificationStatusRequest request)
        {
            var adminUser = await _context.Users.FindAsync(request.AdminId);
            if (!ConnectApi.models.User.CanModerate(adminUser))
            {
                return BadRequest("Only administrators and sub-admins can approve properties.");
            }

            if (!IsValidVerificationStatus(request.VerificationStatus))
            {
                return BadRequest("Invalid verification status.");
            }

            var property = await _context.Properties
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.PropertyId == id);

            if (property == null)
            {
                return NotFound();
            }

            property.VerificationStatus = request.VerificationStatus;
            await _context.SaveChangesAsync();

            return Ok(property);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProperty(int id, [FromQuery] int? userId = null)
        {
            if (!userId.HasValue) 
            {
                return BadRequest("User ID is required to delete a property.");
            }
            
            var user = await _context.Users.FindAsync(CurrentUserId);
            if (user == null || ConnectApi.models.User.HasRole(user, ConnectApi.models.User.RoleCompany)) 
            {
                return BadRequest("Companies cannot delete properties.");
            }
            var property = await _context.Properties.FindAsync(id);
            if (property == null)
            {
                return NotFound();
            }
            if (property.UserId != CurrentUserId && !CanModerate)
            {
                return Forbid();
            }

            _context.Properties.Remove(property);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PropertyExists(int id)
        {
            return _context.Properties.Any(e => e.PropertyId == id);
        }

        private static bool IsValidVerificationStatus(string? verificationStatus)
        {
            return verificationStatus == Property.VerificationInProgress
                || verificationStatus == Property.VerificationVerified
                || verificationStatus == Property.VerificationNotAccepted;
        }

        private int? CurrentUserId =>
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

        private bool CanModerate =>
            User.IsInRole(ConnectApi.models.User.RoleAdmin) ||
            User.IsInRole(ConnectApi.models.User.RoleSubAdmin);
    }
}

