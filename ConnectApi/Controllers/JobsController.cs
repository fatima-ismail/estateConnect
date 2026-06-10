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
    public class JobsController : ControllerBase
    {
        public class JobUpdateVerificationStatusRequest
        {
            public string VerificationStatus { get; set; } = Job.VerificationInProgress;
            public int AdminId { get; set; }
        }

        private readonly AppDbContext _context;

        public JobsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Job>>> GetJobs(
            [FromQuery] string? category = null,
            [FromQuery] string? workType = null,
            [FromQuery] string? location = null,
            [FromQuery] int? userId = null,
            [FromQuery] bool includeUnverified = false,
            [FromQuery] string? verificationStatus = null)
        {
            IQueryable<Job> query = _context.Jobs.Include(j => j.User);

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(j => j.Category == category);
            }

            if (!string.IsNullOrEmpty(workType))
            {
                query = query.Where(j => j.WorkType == workType);
            }

            if (!string.IsNullOrEmpty(location))
            {
                query = query.Where(j => j.Location.Contains(location));
            }

            if (userId.HasValue)
            {
                query = query.Where(j => j.UserId == userId.Value);
            }

            var canSeeUnverified = CanModerate ||
                (CurrentUserId.HasValue && userId == CurrentUserId);

            if (!canSeeUnverified)
            {
                query = query.Where(j => j.VerificationStatus == Job.VerificationVerified);
            }
            else if (!string.IsNullOrWhiteSpace(verificationStatus))
            {
                query = query.Where(j => j.VerificationStatus == verificationStatus);
            }
            else if (!includeUnverified && !userId.HasValue)
            {
                query = query.Where(j => j.VerificationStatus == Job.VerificationVerified);
            }

            return await query.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Job>> GetJob(int id)
        {
            var job = await _context.Jobs
                .Include(j => j.User)
                .FirstOrDefaultAsync(j => j.JobId == id);

            if (job == null)
            {
                return NotFound();
            }
            if (job.VerificationStatus != Job.VerificationVerified &&
                job.UserId != CurrentUserId &&
                !CanModerate)
            {
                return NotFound();
            }

            return job;
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> PutJob(int id, Job job)
        {
            if (id != job.JobId)
            {
                return BadRequest("Job ID mismatch");
            }

            var user = await _context.Users.FindAsync(CurrentUserId);
            if (user == null)
            {
                return BadRequest("Invalid User ID");
            }
            if (ConnectApi.models.User.HasRole(user, ConnectApi.models.User.RoleUser))
            {
                return BadRequest("Users cannot modify jobs.");
            }

            var existingJob = await _context.Jobs.FindAsync(id);
            if (existingJob == null)
            {
                return NotFound();
            }
            if (existingJob.UserId != CurrentUserId && !CanModerate)
            {
                return Forbid();
            }

            existingJob.JobTitle = job.JobTitle;
            existingJob.Category = job.Category;
            existingJob.CompanyName = job.CompanyName;
            existingJob.WorkType = job.WorkType;
            existingJob.Location = job.Location;
            existingJob.JobType = job.JobType;
            existingJob.JobDescription = job.JobDescription;
            existingJob.Status = job.Status;
            existingJob.ContactPhone = job.ContactPhone;
            existingJob.ContactEmail = job.ContactEmail;
            existingJob.SalaryFrom = job.SalaryFrom;
            existingJob.SalaryTo = job.SalaryTo;
            existingJob.ExperienceYears = job.ExperienceYears;
            
            if (!CanModerate)
            {
                existingJob.VerificationStatus = Job.VerificationInProgress;
            }
            
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!JobExists(id))
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
        public async Task<ActionResult<Job>> PostJob(Job job)
        {
            var user = await _context.Users.FindAsync(CurrentUserId);
            if (user == null)
            {
                return BadRequest("Invalid User ID");
            }
            if (ConnectApi.models.User.HasRole(user, ConnectApi.models.User.RoleUser))
            {
                return BadRequest("Users cannot add jobs.");
            }

            job.VerificationStatus = ConnectApi.models.User.CanModerate(user) 
                ? Job.VerificationVerified 
                : Job.VerificationInProgress;
            job.UserId = CurrentUserId!.Value;
            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();

            await _context.Entry(job).Reference(j => j.User).LoadAsync();

            return CreatedAtAction(nameof(GetJob), new { id = job.JobId }, job);
        }

        [Authorize(Roles = $"{ConnectApi.models.User.RoleAdmin},{ConnectApi.models.User.RoleSubAdmin}")]
        [HttpPut("{id}/verification")]
        public async Task<ActionResult<Job>> UpdateVerificationStatus(int id, JobUpdateVerificationStatusRequest request)
        {
            var adminUser = await _context.Users.FindAsync(request.AdminId);
            if (!ConnectApi.models.User.CanModerate(adminUser))
            {
                return BadRequest("Only administrators and sub-admins can approve jobs.");
            }

            if (!IsValidVerificationStatus(request.VerificationStatus))
            {
                return BadRequest("Invalid verification status.");
            }

            var job = await _context.Jobs
                .Include(j => j.User)
                .FirstOrDefaultAsync(j => j.JobId == id);

            if (job == null)
            {
                return NotFound();
            }

            job.VerificationStatus = request.VerificationStatus;
            await _context.SaveChangesAsync();

            return Ok(job);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJob(int id, [FromQuery] int? userId = null)
        {
            if (!userId.HasValue)
            {
                return BadRequest("User ID is required to delete a job.");
            }
            
            var user = await _context.Users.FindAsync(CurrentUserId);
            if (user == null || ConnectApi.models.User.HasRole(user, ConnectApi.models.User.RoleUser))
            {
                return BadRequest("Users cannot delete jobs.");
            }
            
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
            {
                return NotFound();
            }
            if (job.UserId != CurrentUserId && !CanModerate)
            {
                return Forbid();
            }

            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool JobExists(int id)
        {
            return _context.Jobs.Any(e => e.JobId == id);
        }

        private static bool IsValidVerificationStatus(string? verificationStatus)
        {
            return verificationStatus == Job.VerificationInProgress
                || verificationStatus == Job.VerificationVerified
                || verificationStatus == Job.VerificationNotAccepted;
        }

        private int? CurrentUserId =>
            int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

        private bool CanModerate =>
            User.IsInRole(ConnectApi.models.User.RoleAdmin) ||
            User.IsInRole(ConnectApi.models.User.RoleSubAdmin);
    }
}

