using Microsoft.EntityFrameworkCore;
using TmsApi.Models;

namespace TmsApi.Data;

public class TmsDbContext : DbContext
{
    public TmsDbContext(DbContextOptions<TmsDbContext> options) : base(options) { }
    
    public DbSet<User> Users { get; set; }
    public DbSet<TimesheetEntry> TimesheetEntries { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasMany(u => u.TimesheetEntries)
            .WithOne(t => t.User)
            .HasForeignKey(t => t.UserId);
            
        modelBuilder.Entity<User>().HasData(
            new User { Id = 1, Uid = "admin", Password = "admin123", Name = "Administrator", Email = "admin@tms.com" }
        );
    }
}
