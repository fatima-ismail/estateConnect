using System;
using System.Data;
using System.Linq;
using ConnectApi.models;
using ConnectApi.services;
using Microsoft.EntityFrameworkCore;

namespace ConnectApi.data
{
    public static class DbSeeder
    {
        public static void Seed(AppDbContext context)
        {
            if (!TableExists(context, "Users"))
            {
                context.Database.Migrate();
            }

            var passwordService = new PasswordService();

            var seedUsers = new[]
            {
                new User
                {
                    FullName = "John Doe",
                    Email = "john@example.com",
                    PasswordHash = passwordService.Hash("hashedpassword123"),
                    PhoneNumber = "+961 70 192 834",
                    Role = User.RoleUser,
                    ImageUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
                },
                new User
                {
                    FullName = "Jane Smith",
                    Email = "jane@example.com",
                    PasswordHash = passwordService.Hash("hashedpassword456"),
                    PhoneNumber = "+961 71 149 988",
                    Role = User.RoleUser,
                    ImageUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
                },
                new User
                {
                    FullName = "Admin User",
                    Email = "admin@estateconnect.com",
                    PasswordHash = passwordService.Hash("adminpassword"),
                    PhoneNumber = "+961 01 000 000",
                    Role = User.RoleAdmin,
                    ImageUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                }
            };

            foreach (var seedUser in seedUsers)
            {
                if (!context.Users.Any(user => user.Email == seedUser.Email))
                {
                    context.Users.Add(seedUser);
                }
            }

            if (context.ChangeTracker.HasChanges())
            {
                context.SaveChanges();
            }

            if (!context.Users.Any(u => u.Email == "admin123"))
            {
                context.Users.Add(new User
                {
                    FullName = "Admin User",
                    Email = "admin123",
                    PasswordHash = passwordService.Hash("12345678"),
                    Role = User.RoleAdmin
                });
                context.SaveChanges();
            }

            var users = context.Users.ToList();
            var john = users.First(u => u.Email == "john@example.com");
            var jane = users.First(u => u.Email == "jane@example.com");
            var adminUser = users.First(u => u.Email == "admin@estateconnect.com");

            var nonAdminUserIds = context.Users
                .Where(u => u.Role.ToLower() != User.RoleAdmin)
                .Select(u => u.UserId)
                .ToList();
            if (nonAdminUserIds.Any())
            {
                var propsToRemove = context.Properties.Where(p => nonAdminUserIds.Contains(p.UserId)).ToList();
                if (propsToRemove.Any()) {
                    context.Properties.RemoveRange(propsToRemove);
                    context.SaveChanges();
                }

                var jobsToRemove = context.Jobs.Where(j => nonAdminUserIds.Contains(j.UserId)).ToList();
                if (jobsToRemove.Any()) {
                    context.Jobs.RemoveRange(jobsToRemove);
                    context.SaveChanges();
                }
            }

            if (!context.Properties.Any())
            {
                context.Properties.AddRange(
                    new Property
                    {
                        Title = "Seaside Beachfront Chalet",
                        Description = "Wake up to the sound of waves in this beautiful 2-bedroom chalet with direct beach access, an open terrace, and modern amenities.",
                        Price = 1200,
                        Location = "Batroun, Lebanon",
                        PropertyType = "Chalet",
                        Status = "For Rent",
                        Bedrooms = 2,
                        Bathrooms = 1,
                        Area = 90,
                        ImageUrl = "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80",
                        UserId = adminUser.UserId,
                        VerificationStatus = Property.VerificationVerified,
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    },
                    new Property
                    {
                        Title = "Mountain View Retreat",
                        Description = "Escape the city to this luxurious stone villa nestled in the mountains. Features a fireplace, wrap-around balcony, and stunning valley views.",
                        Price = 450000,
                        Location = "Faraya, Lebanon",
                        PropertyType = "Villa",
                        Status = "For Sale",
                        Bedrooms = 4,
                        Bathrooms = 4,
                        Area = 350,
                        ImageUrl = "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80",
                        UserId = adminUser.UserId,
                        VerificationStatus = Property.VerificationVerified,
                        CreatedAt = DateTime.UtcNow.AddDays(-3)
                    }
                );
                context.SaveChanges();
            }

            if (!context.HomeServices.Any())
            {
                context.HomeServices.AddRange(
                    new HomeService
                    {
                        Title = "Premium House Cleaning Service",
                        Description = "Professional deep cleaning for apartments and villas. Dusting, vacuuming, mopping, kitchen sanitation, and bathroom disinfection. Eco-friendly cleaning products used.",
                        Price = 85,
                        Location = "Tripoli, Lebanon",
                        ImageUrl = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
                        UserId = john.UserId,
                        VerificationStatus = HomeService.VerificationVerified,
                        CreatedAt = DateTime.UtcNow.AddDays(-3)
                    },
                    new HomeService
                    {
                        Title = "Emergency Electrical Repairs & Wiring",
                        Description = "Certified local electrician available 24/7. Short circuit fixes, panel upgrades, outlet replacements, and general wiring inspection. Fast response guaranteed.",
                        Price = 110,
                        Location = "Beirut, Lebanon",
                        ImageUrl = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
                        UserId = jane.UserId,
                        VerificationStatus = HomeService.VerificationVerified,
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    },
                    new HomeService
                    {
                        Title = "Lawn Mowing & Landscape Design",
                        Description = "Complete garden care package. Includes regular lawn mowing, weed control, hedge trimming, flower planting, and automatic irrigation setup consultations.",
                        Price = 75,
                        Location = "Jounieh, Lebanon",
                        ImageUrl = "https://images.unsplash.com/photo-1558904541-efa8c3a30fc9?auto=format&fit=crop&w=800&q=80",
                        UserId = john.UserId,
                        VerificationStatus = HomeService.VerificationVerified,
                        CreatedAt = DateTime.UtcNow.AddDays(-7)
                    },
                    new HomeService
                    {
                        Title = "Comprehensive Plumbing & Leak Repair",
                        Description = "Experienced plumber specializing in copper pipes, water heaters, toilet unclogging, and under-sink leak fixing. Free inspections and transparent pricing.",
                        Price = 95,
                        Location = "Byblos, Lebanon",
                        ImageUrl = "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80",
                        UserId = jane.UserId,
                        VerificationStatus = HomeService.VerificationVerified,
                        CreatedAt = DateTime.UtcNow.AddDays(-4)
                    }
                );
                context.SaveChanges();
            }

            if (!context.Jobs.Any())
            {
                context.Jobs.AddRange(
                    new Job
                    {
                        JobTitle = "Senior Real Estate Agent",
                        CompanyName = "EstateConnect Premium",
                        Location = "Beirut, Lebanon",
                        JobType = "Full-Time",
                        WorkType = "On-site",
                        Category = "Sales & Brokerage",
                        JobDescription = "We are seeking an experienced real estate agent to join our premium properties team. The ideal candidate has a strong network, excellent negotiation skills, and a proven track record in high-end real estate sales.",
                        SalaryFrom = 2000,
                        SalaryTo = 5000,
                        ExperienceYears = 5,
                        ContactEmail = "careers@estateconnect.com",
                        ContactPhone = "+961 01 000 000",
                        Status = "Active",
                        UserId = adminUser.UserId,
                        VerificationStatus = Job.VerificationVerified,
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    },
                    new Job
                    {
                        JobTitle = "Property Manager",
                        CompanyName = "EstateConnect Operations",
                        Location = "Tripoli, Lebanon",
                        JobType = "Full-Time",
                        WorkType = "Hybrid",
                        Category = "Management",
                        JobDescription = "Looking for a dedicated property manager to oversee a portfolio of residential properties. Responsibilities include tenant relations, maintenance coordination, and lease administration.",
                        SalaryFrom = 1200,
                        SalaryTo = 2000,
                        ExperienceYears = 3,
                        ContactEmail = "careers@estateconnect.com",
                        ContactPhone = "+961 01 000 000",
                        Status = "Active",
                        UserId = adminUser.UserId,
                        VerificationStatus = Job.VerificationVerified,
                        CreatedAt = DateTime.UtcNow.AddDays(-4)
                    },
                    new Job
                    {
                        JobTitle = "Freelance Interior Designer",
                        CompanyName = "Studio Creativ",
                        Location = "Remote (Lebanon)",
                        JobType = "Contract",
                        WorkType = "Remote",
                        Category = "Design & Architecture",
                        JobDescription = "Seeking a talented interior designer for project-based work on luxury apartments. Must be proficient in AutoCAD and 3D rendering software, with a modern and minimalist aesthetic.",
                        SalaryFrom = 500,
                        SalaryTo = 1500,
                        ExperienceYears = 2,
                        ContactEmail = "design@studiocreativ.lb",
                        ContactPhone = "+961 70 999 888",
                        Status = "Active",
                        UserId = adminUser.UserId,
                        VerificationStatus = Job.VerificationVerified,
                        CreatedAt = DateTime.UtcNow.AddDays(-1)
                    }
                );
                context.SaveChanges();
            }
        }

        private static bool TableExists(AppDbContext context, string tableName)
        {
            var connection = context.Database.GetDbConnection();
            var shouldClose = connection.State == ConnectionState.Closed;

            if (shouldClose)
            {
                connection.Open();
            }

            try
            {
                using var command = connection.CreateCommand();
                command.CommandText = "SELECT CASE WHEN OBJECT_ID(@tableName, 'U') IS NULL THEN 0 ELSE 1 END";

                var parameter = command.CreateParameter();
                parameter.ParameterName = "@tableName";
                parameter.Value = tableName;
                command.Parameters.Add(parameter);

                return Convert.ToInt32(command.ExecuteScalar()) == 1;
            }
            finally
            {
                if (shouldClose)
                {
                    connection.Close();
                }
            }
        }
    }
}
