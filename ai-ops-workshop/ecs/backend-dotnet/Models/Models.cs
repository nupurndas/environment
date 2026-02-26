using System.ComponentModel.DataAnnotations;

namespace TmsApi.Models;

public class User
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string Uid { get; set; } = string.Empty;
    
    [Required]
    public string Password { get; set; } = string.Empty;
    
    public string Name { get; set; } = string.Empty;
    
    public string Email { get; set; } = string.Empty;
    
    public ICollection<TimesheetEntry> TimesheetEntries { get; set; } = new List<TimesheetEntry>();
}

public class TimesheetEntry
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int UserId { get; set; }
    
    public User User { get; set; } = null!;
    
    [Required]
    public DateTime Date { get; set; }
    
    [Required]
    public string Project { get; set; } = string.Empty;
    
    [Required]
    public string Task { get; set; } = string.Empty;
    
    [Required]
    public decimal Hours { get; set; }
    
    public string? Description { get; set; }
}
