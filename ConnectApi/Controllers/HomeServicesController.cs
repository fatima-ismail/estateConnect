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
    public class HomeServicesController : ControllerBase
    {
        public class HomeServiceUpdateVerificationStatusRequest
        {
            public string VerificationStatus { get; set; } = HomeService.VerificationInProgress;
            public int AdminId { get; set; }
        }

        private readonly AppDbContext _context;

        public HomeServicesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<HomeService>>> GetHomeServices(
            [FromQuery] int? userId = null,
            [FromQuery] string? location = null,
            [FromQuery] bool includeUnverified = false,
            [FromQuery] string? verificationStatus = null)
        {
            IQueryable<HomeService> query = _context.HomeServices
                .Include(s => s.User);

            if (userId.HasValue)
            {
                query = query.Where(s => s.UserId == userId.Value);
            }

            if (!string.IsNullOrEmpty(location))
            {
                query = query.Where(s => s.Location.Contains(location));
            }

            var canSeeUnverified = CanModerate ||
                (CurrentUserId.HasValue && userId == CurrentUserId);

            if (!canSeeUnverified)
            {
                query = query.Where(s => s.VerificationStatus == HomeService.VerificationVerified);
            }
            else if (!string.IsNullOrWhiteSpace(verificationStatus))
            {
                query = query.Where(s => s.VerificationStatus == verificationStatus);
            }
            else if (!includeUnverified && !userId.HasValue)
            {
                query = query.Where(s => s.VerificationStatus == HomeService.VerificationVerified);
            }

            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<HomeService>> GetHomeService(int id)
        {
            var homeService = await _context.HomeServices
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.HomeServiceId == id);

            if (homeService == null)
            {
                return NotFound();
            }

            return homeService;
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutHomeService(int id, HomeService homeService)
        {
            if (id != homeService.HomeServiceId)
            {
                return BadRequest("Service ID mismatch");
            }

            var user = await _context.Users.FindAsync(CurrentUserId);
            if (user == null)
            {
                return BadRequest("Invalid User ID");
            }
            if (ConnectApi.models.User.HasRole(user, ConnectApi.models.User.RoleCompany))
            {
                return BadRequest("Companies cannot modify services.");
            }

            var existingService = await _context.HomeServices.FindAsync(id);
            if (existingService == null)
            {
                return NotFound();
            }
            if (existingService.UserId != CurrentUserId && !CanModerate)
            {
                return Forbid();
            }

            existingService.Title = homeService.Title;
            existingService.Description = homeService.Description;
            existingService.Price = homeService.Price;
            existingService.Location = homeService.Location;
            existingService.ImageUrl = homeService.ImageUrl;
            existingService.YearsOfExperience = homeService.YearsOfExperience;
            existingService.Phone = homeService.Phone;
            existingService.Email = homeService.Email;
            existingService.Links = homeService.Links;
            
            if (!CanModerate)
            {
                existingService.VerificationStatus = HomeService.VerificationInProgress;
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!HomeServiceExists(id))
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
        public async Task<ActionResult<HomeService>> PostHomeService(HomeService homeService)
        {
            var user = await _context.Users.FindAsync(CurrentUserId);
            if (user == null)
            {
                return BadRequest("Invalid User ID");
            }
            if (ConnectApi.models.User.HasRole(user, ConnectApi.models.User.RoleCompany))
            {
                return BadRequest("Companies cannot add services.");
            }

            homeService.VerificationStatus = ConnectApi.models.User.CanModerate(user) 
                ? HomeService.VerificationVerified 
                : HomeService.VerificationInProgress;
            homeService.UserId = CurrentUserId!.Value;
            _context.HomeServices.Add(homeService);
            await _context.SaveChangesAsync();

            await _context.Entry(homeService).Reference(s => s.User).LoadAsync();
            return CreatedAtAction(nameof(GetHomeService), new { id = homeService.HomeServiceId }, homeService);
        }

        [Authorize(Roles = $"{ConnectApi.models.User.RoleAdmin},{ConnectApi.models.User.RoleSubAdmin}")]
        [HttpPut("{id}/verification")]
        public async Task<ActionResult<HomeService>> UpdateVerificationStatus(int id, HomeServiceUpdateVerificationStatusRequest request)
        {
            var adminUser = await _context.Users.FindAsync(request.AdminId);
            if (!ConnectApi.models.User.CanModerate(adminUser))
            {
                return BadRequest("Only administrators and sub-admins can approve services.");
            }

            if (!IsValidVerificationStatus(request.VerificationStatus))
            {
                return BadRequest("Invalid verification status.");
            }

            var homeService = await _context.HomeServices
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.HomeServiceId == id);

            if (homeService == null)
            {
                return NotFound();
            }

            homeService.VerificationStatus = request.VerificationStatus;
            await _context.SaveChangesAsync();

            return Ok(homeService);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHomeService(int id, [FromQuery] int? userId = null)
        {
            if (!userId.HasValue) 
            {
                return BadRequest("User ID is required to delete a service.");
            }
            var user = await _context.Users.FindAsync(CurrentUserId);
            if (user == null || ConnectApi.models.User.HasRole(user, ConnectApi.models.User.RoleCompany)) 
            {
                return BadRequest("Companies cannot delete services.");
            }

            var homeService = await _context.HomeServices.FindAsync(id);
            if (homeService == null)
            {
                return NotFound();
            }
            if (homeService.VerificationStatus != HomeService.VerificationVerified &&
                homeService.UserId != CurrentUserId &&
                !CanModerate)
            {
                return NotFound();
            }
            if (homeService.UserId != CurrentUserId && !CanModerate)
            {
                return Forbid();
            }

            _context.HomeServices.Remove(homeService);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool HomeServiceExists(int id)
        {
            return _context.HomeServices.Any(e => e.HomeServiceId == id);
        }

        private static bool IsValidVerificationStatus(string? verificationStatus)
        {
            return verificationStatus == HomeService.VerificationInProgress
                || verificationStatus == HomeService.VerificationVerified
                || verificationStatus == HomeService.VerificationNotAccepted;
        }

        private int? CurrentUserId =>
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

        private bool CanModerate =>
            User.IsInRole(ConnectApi.models.User.RoleAdmin) ||
            User.IsInRole(ConnectApi.models.User.RoleSubAdmin);
    }
}

