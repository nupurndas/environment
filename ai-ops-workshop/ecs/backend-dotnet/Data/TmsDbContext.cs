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
        // Configure Users table with PascalCase columns
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.Uid).HasColumnName("Uid");
            entity.Property(e => e.Password).HasColumnName("Password");
            entity.Property(e => e.Name).HasColumnName("Name");
            entity.Property(e => e.Email).HasColumnName("Email");
        });
        
        // Configure TimesheetEntries table with PascalCase columns
        modelBuilder.Entity<TimesheetEntry>(entity =>
        {
            entity.ToTable("TimesheetEntries");
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.UserId).HasColumnName("UserId");
            entity.Property(e => e.Date).HasColumnName("Date").HasColumnType("date");
            entity.Property(e => e.Project).HasColumnName("Project");
            entity.Property(e => e.Task).HasColumnName("Task");
            entity.Property(e => e.Hours).HasColumnName("Hours").HasColumnType("decimal(5,2)");
            entity.Property(e => e.Description).HasColumnName("Description");
        });
        
        modelBuilder.Entity<User>()
            .HasMany(u => u.TimesheetEntries)
            .WithOne(t => t.User)
            .HasForeignKey(t => t.UserId);
    }
}
