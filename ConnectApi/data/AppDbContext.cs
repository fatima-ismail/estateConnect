using Microsoft.EntityFrameworkCore;
using ConnectApi.models;

namespace ConnectApi.data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Property> Properties { get; set; }
        public DbSet<HomeService> HomeServices { get; set; }
        public DbSet<Job> Jobs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            modelBuilder.Entity<User>()
                .HasIndex(u => u.PhoneNumber)
                .IsUnique()
                .HasFilter("[PhoneNumber] IS NOT NULL");

            modelBuilder.Entity<Property>()
                .Property(property => property.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<HomeService>()
                .Property(service => service.Price)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Job>()
                .Property(job => job.SalaryFrom)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Job>()
                .Property(job => job.SalaryTo)
                .HasPrecision(18, 2);
        }
    }
}
